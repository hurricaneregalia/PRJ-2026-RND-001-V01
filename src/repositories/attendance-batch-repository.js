import { AUDIT_ACTIONS } from '@/lib/domain-constants';
import { ConflictError, ValidationError } from '@/lib/data-errors';
import { validateFields, validateStoredFields } from '@/lib/field-validation';
import { assertRecordId, nextRecordId } from '@/lib/id-generator';
import { changedFields } from '@/lib/repository-helpers';
import { getWorksheetSchema, ID_PREFIXES } from '@/lib/sheet-schema';
import {
  columnNumberToLetter,
  readWorksheetRecords,
  updateRanges,
} from '@/repositories/sheets-repository';
import { sanitizeAuditPayload } from '@/repositories/audit-log-repository';
import { absensiDetailFields } from '@/repositories/absensi-detail-repository';
import { absensiFields } from '@/repositories/absensi-repository';

const TABLE = Object.freeze({
  absensi: 'absensi',
  detail: 'absensi_detail',
  audit: 'audit_log',
});
const AUDIT_NOTE = 'Perubahan absensi pengajar [attendance-batch]';
const AUDIT_FIELDS = Object.freeze({
  audit_id: { type: 'string', required: true, maxLength: 20 },
  idempotency_key: { type: 'string', maxLength: 200 },
  user_id: { type: 'string', required: true, maxLength: 20 },
  aksi: { type: 'enum', required: true, allowedValues: AUDIT_ACTIONS },
  nama_tabel: { type: 'string', required: true, maxLength: 100 },
  record_id: { type: 'string', required: true, maxLength: 50 },
  data_sebelum: { type: 'json' },
  data_sesudah: { type: 'json' },
  keterangan: { type: 'string', maxLength: 1000 },
  created_at: { type: 'string', required: true, maxLength: 20 },
});
const ABSENSI_AUDIT_FIELDS = Object.freeze(['topik', 'status_absensi', 'updated_at']);
const DETAIL_AUDIT_FIELDS = Object.freeze([
  'status_kehadiran',
  'catatan',
  'updated_by',
  'updated_at',
]);
const DESCRIPTORS = Object.freeze({
  absensi: { table: TABLE.absensi, fields: absensiFields, idColumn: 'absensi_id' },
  detail: {
    table: TABLE.detail,
    fields: absensiDetailFields,
    idColumn: 'absensi_detail_id',
    uniqueKeys: [['absensi_id', 'siswa_id']],
  },
  audit: {
    table: TABLE.audit,
    fields: AUDIT_FIELDS,
    idColumn: 'audit_id',
    uniqueKeys: [['idempotency_key']],
  },
});

let lockTail = Promise.resolve();

export async function withAttendanceBatchLock(task) {
  if (typeof task !== 'function') {
    throw new ValidationError('task must be a function', { field: 'task' });
  }
  const previous = lockTail;
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  lockTail = previous.then(
    () => gate,
    () => gate,
  );
  await previous.catch(() => {});
  try {
    return await task();
  } finally {
    release();
  }
}

function assertRangeEntry(entry, label) {
  if (!entry || typeof entry.range !== 'string' || !Array.isArray(entry.values)) {
    throw new ValidationError(`${label} must contain range and values`, {
      field: label,
    });
  }
}

export async function commitAttendanceBatch({
  operationId,
  operationTimestamp,
  dataRanges,
  auditEntries,
}) {
  if (typeof operationId !== 'string' || operationId.trim() === '') {
    throw new ValidationError('operationId is required', { field: 'operationId' });
  }
  if (typeof operationTimestamp !== 'string' || operationTimestamp.trim() === '') {
    throw new ValidationError('operationTimestamp is required', {
      field: 'operationTimestamp',
    });
  }
  if (!Array.isArray(dataRanges) || dataRanges.length === 0) {
    throw new ValidationError('dataRanges must not be empty', { field: 'dataRanges' });
  }
  if (!Array.isArray(auditEntries) || auditEntries.length === 0) {
    throw new ValidationError('auditEntries must not be empty', {
      field: 'auditEntries',
    });
  }
  dataRanges.forEach((entry, index) => assertRangeEntry(entry, `dataRanges[${index}]`));
  auditEntries.forEach((entry, index) =>
    assertRangeEntry(entry, `auditEntries[${index}]`),
  );
  const updates = [
    ...dataRanges.map(({ range, values }) => ({ range, values })),
    ...auditEntries.map(({ range, values }) => ({ range, values })),
  ];
  return updateRanges(updates);
}

export function rowValues(header, record) {
  return header.map((column) => record?.[column] ?? '');
}

export function buildRange(tableName, header, rowNumber) {
  return `${tableName}!A${rowNumber}:${columnNumberToLetter(header.length)}${rowNumber}`;
}

function assertUnique(records, uniqueKeys, idColumn, tableName) {
  for (const fields of uniqueKeys) {
    const seen = new Map();
    for (const record of records) {
      if (fields.every((field) => String(record?.[field] ?? '').trim() === '')) {
        continue;
      }
      const key = fields.map((field) => String(record?.[field] ?? '')).join('|');
      if (seen.has(key)) {
        throw new ConflictError(`Duplicate value for ${fields.join(' + ')} in ${tableName}`, {
          details: { table: tableName, fields, ids: [seen.get(key), record[idColumn]] },
        });
      }
      seen.set(key, record[idColumn]);
    }
  }
}

export async function readBatchState({
  table,
  fields,
  idColumn,
  uniqueKeys = [],
}) {
  const header = getWorksheetSchema(table);
  const { records } = await readWorksheetRecords(table, header);
  records.forEach(({ record }) => validateStoredFields(record, fields));
  assertUnique(
    records.map(({ record }) => record),
    uniqueKeys,
    idColumn,
    table,
  );
  return {
    header,
    records,
    maxRowNumber: Math.max(
      1,
      records.reduce((max, item) => Math.max(max, item.rowNumber), 0),
    ),
    recordById: new Map(
      records.map((item) => [
        item.record[idColumn],
        { ...item, values: rowValues(header, item.record) },
      ]),
    ),
  };
}

export function readStates() {
  return Promise.all([
    readBatchState(DESCRIPTORS.absensi),
    readBatchState(DESCRIPTORS.detail),
    readBatchState(DESCRIPTORS.audit),
  ]).then(([absensi, detail, audit]) => ({ absensi, detail, audit }));
}

export function assertSameRows(baseline, guard, ids) {
  const snapshot = (state) =>
    JSON.stringify(
      ids.map((id) => {
        const item = state.recordById.get(id);
        return item
          ? { id, rowNumber: item.rowNumber, values: item.values }
          : { id, rowNumber: null, values: null };
      }),
    );
  if (snapshot(baseline) !== snapshot(guard)) {
    throw new ConflictError('Data changed before batch was sent', {
      details: { ids },
    });
  }
}

export function assertSameAuditTail(baseline, guard) {
  const summarize = (state) => ({
    maxRowNumber: state.maxRowNumber,
    ids: state.records.map((item) => item.record.audit_id).sort(),
    keys: state.records.map((item) => item.record.idempotency_key).sort(),
  });
  if (JSON.stringify(summarize(baseline)) !== JSON.stringify(summarize(guard))) {
    throw new ConflictError('audit_log changed before batch was sent');
  }
}

function buildAuditRow({
  auditId,
  key,
  userId,
  tableName,
  recordId,
  before,
  after,
  operationTimestamp,
}) {
  const changed = changedFields(before, after);
  const beforePayload = {};
  const afterPayload = {};
  for (const [field, values] of Object.entries(changed)) {
    beforePayload[field] = values.before;
    afterPayload[field] = values.after;
  }
  const encode = (value) => {
    const sanitized = sanitizeAuditPayload(value);
    return Object.keys(sanitized).length > 0 ? JSON.stringify(sanitized) : '';
  };
  const row = {
    audit_id: auditId,
    idempotency_key: key,
    user_id: userId,
    aksi: 'update',
    nama_tabel: tableName,
    record_id: recordId,
    data_sebelum: encode(beforePayload),
    data_sesudah: encode(afterPayload),
    keterangan: AUDIT_NOTE,
    created_at: operationTimestamp,
  };
  validateFields(row, AUDIT_FIELDS, { label: TABLE.audit });
  return row;
}

function assertAuditIds(providedIds, keys) {
  if (providedIds === undefined) return {};
  if (!providedIds || typeof providedIds !== 'object' || Array.isArray(providedIds)) {
    throw new ValidationError('auditIds must be an object', { field: 'auditIds' });
  }
  const seen = new Set();
  for (const [key, value] of Object.entries(providedIds)) {
    if (!keys.includes(key)) throw new ValidationError('unknown auditIds key', { field: 'auditIds' });
    const id = assertRecordId(value, ID_PREFIXES[TABLE.audit], 'audit_id');
    if (seen.has(id)) throw new ValidationError('duplicate audit id', { field: 'auditIds' });
    seen.add(id);
  }
  return providedIds;
}

function resolveAuditIds(auditState, keys, providedIds = {}) {
  const givenIds = assertAuditIds(providedIds, keys);
  const working = auditState.records.map((item) => item.record);
  const resolved = {};
  for (const key of keys) {
    const given = givenIds[key];
    const existing = given === undefined ? null : working.find(
      (record) => record.audit_id === given,
    );
    if (existing) {
      if (existing.idempotency_key !== key) {
        throw new ConflictError('audit_id belongs to another key', {
          details: { auditId: given },
        });
      }
      resolved[key] = given;
      continue;
    }
    const auditId =
      given === undefined
        ? nextRecordId(ID_PREFIXES[TABLE.audit], working, 'audit_id')
        : assertRecordId(given, ID_PREFIXES[TABLE.audit], 'audit_id');
    if (working.some((record) => record.audit_id === auditId)) {
      throw new ConflictError('audit_id already exists', { details: { auditId } });
    }
    resolved[key] = auditId;
    working.push({ audit_id: auditId });
  }
  return resolved;
}

export function buildBatchRequest({
  baseline,
  operationId,
  operationTimestamp,
  absensiId,
  userId,
  beforeAbsensi,
  nextAbsensi,
  detailEntries,
  nextDetails,
  changedAbsensi,
  auditIds = {},
}) {
  const absensiKey = `${operationId}:absensi:${absensiId}`;
  const expected = new Map();
  const set = (key, tableName, recordId, changed, allowedFields) =>
    expected.set(key, {
      tableName,
      recordId,
      allowedFields,
      changedFields: Object.keys(changed),
    });
  set(absensiKey, TABLE.absensi, beforeAbsensi.absensi_id, changedAbsensi, ABSENSI_AUDIT_FIELDS);
  const nextById = new Map(nextDetails.map((item) => [item.absensiDetailId, item.next]));
  for (const item of detailEntries) {
    const changed = nextById.has(item.absensiDetailId)
      ? changedFields(item.before, nextById.get(item.absensiDetailId))
      : {};
    set(
      `${operationId}:detail:${item.absensiDetailId}`,
      TABLE.detail,
      item.before.absensi_detail_id,
      changed,
      DETAIL_AUDIT_FIELDS,
    );
  }
  const nextRecords = new Map([[absensiKey, nextAbsensi]]);
  for (const item of detailEntries) {
    nextRecords.set(
      `${operationId}:detail:${item.absensiDetailId}`,
      nextById.get(item.absensiDetailId) ?? item.before,
    );
  }
  const keys = [...expected.keys()];
  const detailIds = new Set(
    baseline.detail.records
      .filter((item) => item.record.absensi_id === absensiId)
      .map((item) => item.record.absensi_detail_id),
  );
  const resolvedAuditIds = resolveAuditIds(baseline.audit, keys, auditIds);
  const dataRanges = [];
  if (Object.keys(changedAbsensi).length > 0) {
    const entry = baseline.absensi.recordById.get(absensiId);
    dataRanges.push({
      range: buildRange(TABLE.absensi, baseline.absensi.header, entry.rowNumber),
      values: rowValues(baseline.absensi.header, nextAbsensi),
    });
  }
  for (const item of nextDetails) {
    const entry = baseline.detail.recordById.get(item.absensiDetailId);
    dataRanges.push({
      range: buildRange(TABLE.detail, baseline.detail.header, entry.rowNumber),
      values: rowValues(baseline.detail.header, item.next),
    });
  }
  const auditEntries = keys.map((key, index) => {
    const entry = expected.get(key);
    const detail = detailEntries.find(
      (item) => `${operationId}:detail:${item.absensiDetailId}` === key,
    );
    const row = buildAuditRow({
      auditId: resolvedAuditIds[key],
      key,
      userId,
      tableName: entry.tableName,
      recordId: entry.recordId,
      before: entry.tableName === TABLE.absensi ? beforeAbsensi : detail.before,
      after: nextRecords.get(key),
      operationTimestamp,
    });
    return {
      range: buildRange(
        TABLE.audit,
        baseline.audit.header,
        Math.max(1, baseline.audit.maxRowNumber) + index + 1,
      ),
      values: rowValues(baseline.audit.header, row),
    };
  });
  return {
    keys,
    resolvedAuditIds,
    verifyArgs: {
      keys,
      expected,
      nextRecords,
      detailIds,
      userId,
      operationTimestamp,
      absensiId,
    },
    payload: { operationId, operationTimestamp, dataRanges, auditEntries },
  };
}
