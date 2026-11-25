import { AUDIT_ACTIONS } from '@/lib/domain-constants';
import { validateFields } from '@/lib/field-validation';
import { changedFields } from '@/lib/repository-helpers';
import { createTableRepository } from '@/repositories/sheet-table-repository';

const fields = {
  idempotency_key: { type: 'string', maxLength: 200 },
  user_id: { type: 'string', required: true, maxLength: 20 },
  aksi: { type: 'enum', required: true, allowedValues: AUDIT_ACTIONS },
  nama_tabel: { type: 'string', required: true, maxLength: 100 },
  record_id: { type: 'string', required: true, maxLength: 50 },
  data_sebelum: { type: 'json' },
  data_sesudah: { type: 'json' },
  keterangan: { type: 'string', maxLength: 1000 },
};

const SENSITIVE_KEY_PATTERN =
  /password|passwd|token|secret|private[_-]?key|access[_-]?key|authorization|cookie|api[_-]?key|credential/i;

const repository = createTableRepository({
  tableName: 'audit_log',
  idColumn: 'audit_id',
  fields,
  uniqueKeys: [['idempotency_key']],
  duplicateBehavior: 'return-existing',
  allowUpdate: false,
  deleteMode: { type: 'forbidden' },
  validateCreate: (data) =>
    validateFields(data, fields, { label: 'audit_log' }),
});

function sanitizeValue(value, seen = new WeakSet()) {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'bigint') {
    return String(value);
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value !== 'object') {
    return String(value);
  }

  if (seen.has(value)) {
    return '[Circular]';
  }

  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, seen));
  }

  const result = {};

  for (const [key, item] of Object.entries(value)) {
    result[key] = SENSITIVE_KEY_PATTERN.test(key)
      ? '[REDACTED]'
      : sanitizeValue(item, seen);
  }

  return result;
}

export function sanitizeAuditPayload(value) {
  return sanitizeValue(value);
}

function jsonOrEmpty(value) {
  if (!value || Object.keys(value).length === 0) {
    return '';
  }

  return JSON.stringify(value);
}

function buildPayload(action, before, after) {
  if (action === 'create') {
    return { before: {}, after: sanitizeAuditPayload(after ?? before ?? {}) };
  }

  if (action === 'delete') {
    return { before: sanitizeAuditPayload(before ?? {}), after: {} };
  }

  const changed = changedFields(before ?? {}, after ?? {});

  return {
    before: Object.fromEntries(
      Object.entries(changed).map(([field, values]) => [field, values.before]),
    ),
    after: Object.fromEntries(
      Object.entries(changed).map(([field, values]) => [field, values.after]),
    ),
  };
}

export async function logAudit({
  action,
  tableName,
  recordId,
  userId,
  before,
  after,
  note = '',
  idempotencyKey = '',
}) {
  if (idempotencyKey) {
    const existing = await repository.findOne(
      (record) => record.idempotency_key === idempotencyKey,
    );

    if (existing) {
      return existing;
    }
  }

  const payload = buildPayload(action, before, after);
  const resolvedTable =
    tableName ?? (action === 'login' || action === 'logout' ? 'users' : '');

  return repository.create({
    idempotency_key: idempotencyKey,
    user_id: userId,
    aksi: action,
    nama_tabel: resolvedTable,
    record_id: recordId,
    data_sebelum: jsonOrEmpty(sanitizeAuditPayload(payload.before)),
    data_sesudah: jsonOrEmpty(sanitizeAuditPayload(payload.after)),
    keterangan: note,
  });
}

export const recordAuditCreate = (params) =>
  logAudit({ ...params, action: 'create' });
export const recordAuditUpdate = (params) =>
  logAudit({ ...params, action: 'update' });
export const recordAuditDelete = (params) =>
  logAudit({ ...params, action: 'delete' });
export const recordAuditLogin = (params) =>
  logAudit({ ...params, action: 'login' });
export const recordAuditLogout = (params) =>
  logAudit({ ...params, action: 'logout' });
export const recordAuditAdmin = (params) =>
  logAudit({ ...params, action: 'admin' });

export const listAuditLog = () => repository.list();
export const getAuditLogById = (auditId) => repository.findById(auditId);
export const findAuditByIdempotencyKey = (idempotencyKey) =>
  repository.findOne((record) => record.idempotency_key === idempotencyKey);
