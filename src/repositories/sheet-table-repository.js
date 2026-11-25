import { nowTimestamp } from '@/lib/date-time';
import {
  DataIntegrityError,
  NotFoundError,
  UnsupportedOperationError,
  ValidationError,
} from '@/lib/data-errors';
import {
  assertIdAvailable,
  assertRecordId,
  nextRecordId,
} from '@/lib/id-generator';
import { getWorksheetPrefix, getWorksheetSchema } from '@/lib/sheet-schema';
import { validateFields, validateStoredFields } from '@/lib/field-validation';
import {
  assertNoDuplicate,
  findDuplicate,
} from '@/lib/repository-helpers';
import { isBlank, isValidDateTime } from '@/lib/validation';
import {
  appendWorksheetRow,
  clearWorksheetRow,
  readWorksheetRecords,
  updateWorksheetRow,
} from '@/repositories/sheets-repository';

const lockTails = new Map();

async function withTableLock(tableName, task) {
  const previous = lockTails.get(tableName) ?? Promise.resolve();
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });

  lockTails.set(
    tableName,
    previous.then(
      () => gate,
      () => gate,
    ),
  );

  await previous.catch(() => {});

  try {
    return await task();
  } finally {
    release();
  }
}

function rowValues(record, header) {
  return header.map((column) => record?.[column] ?? '');
}

function buildRecord(data, { idColumn, header, existing, recordId }) {
  const now = nowTimestamp();
  const record = {};

  for (const column of header) {
    if (column === idColumn) {
      record[column] = recordId;
    } else if (Object.prototype.hasOwnProperty.call(data, column)) {
      record[column] = data[column] ?? '';
    } else if (column === 'created_at' && existing) {
      record[column] = existing[column] ?? now;
    } else if (column === 'created_at' || column === 'updated_at') {
      record[column] = now;
    } else {
      record[column] = existing?.[column] ?? '';
    }
  }

  return record;
}

function validateUniqueCollection(records, uniqueKeys, idColumn, tableName) {
  for (const fields of uniqueKeys ?? []) {
    const seen = new Map();

    for (const record of records) {
      if (fields.every((field) => isBlank(record?.[field]))) {
        continue;
      }

      const key = fields.map((field) => String(record?.[field] ?? '')).join('\u0000');

      if (seen.has(key)) {
        throw new DataIntegrityError(
          `Duplicate ${fields.join(' + ')} in ${tableName}: ${record?.[idColumn]}`,
          { table: tableName, field: fields.join('+') },
        );
      }

      seen.set(key, record?.[idColumn]);
    }
  }
}

function validateStoredRows(tableName, header, idColumn, prefix, fields, rows) {
  const seenIds = new Set();
  const records = [];

  for (const { rowNumber, record } of rows) {
    try {
      assertRecordId(record[idColumn], prefix, idColumn);
      validateStoredFields(record, fields);

      for (const column of ['created_at', 'updated_at']) {
        if (!isBlank(record[column]) && !isValidDateTime(record[column])) {
          throw new ValidationError(
            `${column} must use YYYY-MM-DDTHH:mm:ss`,
            { field: column },
          );
        }
      }
    } catch (error) {
      throw new DataIntegrityError(
        `${tableName} row ${rowNumber} is invalid: ${error.message}`,
        {
          table: tableName,
          rowNumber,
          field: error.field,
          cause: error,
        },
      );
    }

    if (seenIds.has(record[idColumn])) {
      throw new DataIntegrityError(
        `Duplicate ${idColumn} in ${tableName}: ${record[idColumn]}`,
        { table: tableName, rowNumber, field: idColumn },
      );
    }

    seenIds.add(record[idColumn]);
    records.push(record);
  }

  return records;
}

export function createTableRepository(config) {
  const {
    tableName,
    idColumn,
    fields,
    uniqueKeys = [],
    duplicateBehavior = 'reject',
    allowUpdate = true,
    deleteMode = { type: 'forbidden' },
    validateCreate = (data) =>
      validateFields(data, fields, { label: tableName }),
    validateUpdate = (data) =>
      validateFields(data, fields, { partial: true, label: tableName }),
    validateRecords,
    beforeCreate,
    beforeUpdate,
    beforeDelete,
  } = config;

  const header = getWorksheetSchema(tableName);
  const prefix = getWorksheetPrefix(tableName);

  if (!header.includes(idColumn)) {
    throw new Error(`${tableName} header does not contain ${idColumn}`);
  }

  if (!['forbidden', 'clear', 'soft'].includes(deleteMode.type)) {
    throw new Error(`Unsupported delete mode for ${tableName}`);
  }

  if (deleteMode.type === 'soft' && (!deleteMode.field || !deleteMode.value)) {
    throw new Error(`Soft delete configuration is incomplete for ${tableName}`);
  }

  async function readAll() {
    const { records: rows } = await readWorksheetRecords(tableName, header);
    const records = validateStoredRows(
      tableName,
      header,
      idColumn,
      prefix,
      fields,
      rows,
    );

    validateUniqueCollection(records, uniqueKeys, idColumn, tableName);
    validateRecords?.(records);

    return { rows, records };
  }

  async function list() {
    const { records } = await readAll();
    return records;
  }

  async function findById(recordId) {
    const id = assertRecordId(recordId, prefix, idColumn);
    const { records } = await readAll();
    return records.find((record) => record[idColumn] === id) ?? null;
  }

  async function findOne(predicate) {
    if (typeof predicate !== 'function') {
      throw new ValidationError('findOne requires a predicate function');
    }

    const { records } = await readAll();
    return records.find((record) => predicate(record)) ?? null;
  }

  async function createUnlocked(input = {}, options = {}) {
    const { records } = await readAll();
    const data = validateCreate(input, { records });
    const recordId = options.recordId
      ? assertRecordId(options.recordId, prefix, idColumn)
      : nextRecordId(prefix, records, idColumn);

    assertIdAvailable(recordId, records, idColumn);

    const record = buildRecord(data, { idColumn, header, existing: null, recordId });
    const duplicate = findDuplicate(records, record, uniqueKeys, idColumn);

    if (duplicate && duplicateBehavior === 'return-existing') {
      return duplicate.duplicate;
    }

    assertNoDuplicate(records, record, uniqueKeys, idColumn);
    await beforeCreate?.({ record, records });

    await appendWorksheetRow(tableName, rowValues(record, header));
    return record;
  }

  async function updateUnlocked(recordId, patch) {
    if (!allowUpdate) {
      throw new UnsupportedOperationError(`Update is disabled for ${tableName}`, {
        table: tableName,
        operation: 'update',
      });
    }

    const id = assertRecordId(recordId, prefix, idColumn);
    const { rows, records } = await readAll();
    const index = records.findIndex((record) => record[idColumn] === id);

    if (index === -1) {
      throw new NotFoundError(`${tableName} record not found: ${id}`, {
        table: tableName,
        recordId: id,
      });
    }

    const previous = records[index];
    const data = validateUpdate(patch ?? {}, previous, {
      records,
      rowNumber: rows[index].rowNumber,
    });

    if (Object.keys(data).length === 0) {
      throw new ValidationError(`No update fields supplied for ${tableName}`);
    }

    const next = buildRecord(data, {
      idColumn,
      header,
      existing: previous,
      recordId: id,
    });

    assertNoDuplicate(records, next, uniqueKeys, idColumn);
    await beforeUpdate?.({
      previous,
      next,
      records,
      rowNumber: rows[index].rowNumber,
    });

    await updateWorksheetRow(tableName, rows[index].rowNumber, rowValues(next, header));
    return next;
  }

  async function removeUnlocked(recordId) {
    if (deleteMode.type === 'forbidden') {
      throw new UnsupportedOperationError(`Delete is disabled for ${tableName}`, {
        table: tableName,
        operation: 'delete',
      });
    }

    const id = assertRecordId(recordId, prefix, idColumn);
    const { rows, records } = await readAll();
    const index = records.findIndex((record) => record[idColumn] === id);

    if (index === -1) {
      throw new NotFoundError(`${tableName} record not found: ${id}`, {
        table: tableName,
        recordId: id,
      });
    }

    const record = records[index];
    await beforeDelete?.({ record, records });

    if (deleteMode.type === 'soft') {
      return updateUnlocked(id, { [deleteMode.field]: deleteMode.value });
    }

    await clearWorksheetRow(
      tableName,
      rows[index].rowNumber,
      header.length,
    );

    return record;
  }

  async function count() {
    const { records } = await readAll();
    return records.length;
  }

  async function exists(recordId) {
    return Boolean(await findById(recordId));
  }

  function create(input, options) {
    return withTableLock(tableName, () => createUnlocked(input, options));
  }

  function update(recordId, patch) {
    return withTableLock(tableName, () => updateUnlocked(recordId, patch));
  }

  function remove(recordId) {
    return withTableLock(tableName, () => removeUnlocked(recordId));
  }

  return {
    tableName,
    idColumn,
    header,
    list,
    findAll: list,
    findById,
    findOne,
    create,
    update,
    remove,
    delete: remove,
    count,
    exists,
  };
}
