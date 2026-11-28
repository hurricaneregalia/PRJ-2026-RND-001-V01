import { ABSENSI_STATUSES } from '@/lib/domain-constants';
import {
  ConflictError,
  DataIntegrityError,
  SheetOperationError,
  ValidationError,
} from '@/lib/data-errors';
import { validateFields } from '@/lib/field-validation';
import { changedFields, sameValue } from '@/lib/repository-helpers';
import { isValidDateTime } from '@/lib/validation';
import { absensiDetailFields } from '@/repositories/absensi-detail-repository';
import { absensiFields } from '@/repositories/absensi-repository';
import {
  assertSameAuditTail,
  assertSameRows,
  buildBatchRequest,
  commitAttendanceBatch,
  readStates,
  withAttendanceBatchLock,
} from '@/repositories/attendance-batch-repository';
import { listKelasSiswaByKelasId } from '@/repositories/kelas-siswa-repository';
import {
  getAbsensiForPengajar,
  getKelasForPengajar,
} from '@/services/teacher-scope-service';

const OPERATION_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const conflict = (reason, data = {}) => ({
  status: 'conflict',
  data: { reason, ...data },
});
const invalid = (error) => ({
  status: 'invalid',
  data: { message: error.message, field: error.field ?? '' },
});

function assertContext(input) {
  const { kelasId, absensiId, operationId, operationTimestamp } = input ?? {};
  for (const [field, value] of Object.entries({ kelasId, absensiId })) {
    if (typeof value !== 'string' || value.trim() === '') {
      throw new ValidationError(`${field} is required`, { field });
    }
  }
  if (!OPERATION_ID_PATTERN.test(String(operationId ?? ''))) {
    throw new ValidationError('operationId must be a UUID', { field: 'operationId' });
  }
  if (!isValidDateTime(operationTimestamp)) {
    throw new ValidationError('operationTimestamp must be a timestamp', {
      field: 'operationTimestamp',
    });
  }
}

function normalizeChanges({ topik, details }) {
  if (!Array.isArray(details)) {
    throw new ValidationError('details must be an array', { field: 'details' });
  }
  const normalizedTopik = validateFields(
    { topik: topik ?? '' },
    { topik: absensiFields.topik },
    { label: 'absensi' },
  ).topik;
  const normalizedDetails = details.map((item, index) => {
    if (!item || typeof item.absensiDetailId !== 'string') {
      throw new ValidationError('absensiDetailId is required', {
        field: `details[${index}].absensiDetailId`,
      });
    }
    const validated = validateFields(
      {
        status_kehadiran: item.statusKehadiran,
        catatan: item.catatan ?? '',
      },
      {
        status_kehadiran: absensiDetailFields.status_kehadiran,
        catatan: absensiDetailFields.catatan,
      },
      { label: 'absensi_detail' },
    );
    return {
      absensiDetailId: item.absensiDetailId,
      statusKehadiran: validated.status_kehadiran,
      catatan: validated.catatan,
    };
  });
  return { topik: normalizedTopik, details: normalizedDetails };
}

function parseAuditPayload(value) {
  if (!value) {
    return {};
  }
  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('not an object');
    }
    return parsed;
  } catch {
    throw new DataIntegrityError('audit payload is invalid', { table: 'audit_log' });
  }
}

/**
 * Audit existence alone is never enough: current data must match data_sesudah.
 */
function verifyCommitted({
  states,
  keys,
  expected,
  nextRecords,
  detailIds,
  userId,
  operationTimestamp,
  absensiId,
}) {
  const found = new Map(
    states.audit.records
      .filter((item) => keys.includes(item.record.idempotency_key))
      .map((item) => [item.record.idempotency_key, item.record]),
  );
  if (found.size === 0) {
    const dataMatches = keys.every((key) => {
      const entry = expected.get(key);
      const table =
        entry.tableName === 'absensi' ? states.absensi : states.detail;
      const current = table.recordById.get(entry.recordId)?.record;
      return (
        current &&
        Object.entries(nextRecords.get(key)).every(([field, value]) =>
          sameValue(value, current[field]),
        )
      );
    });
    return { status: dataMatches ? 'unrecorded' : 'missing' };
  }
  if (found.size !== keys.length) {
    return {
      status: 'partial',
      found: [...found.keys()],
      missing: keys.filter((key) => !found.has(key)),
    };
  }

  const diffs = [];
  for (const key of keys) {
    const audit = found.get(key);
    const entry = expected.get(key);
    if (audit.user_id !== userId) diffs.push(`${key}:user_id`);
    if (audit.aksi !== 'update') diffs.push(`${key}:aksi`);
    if (audit.nama_tabel !== entry.tableName) diffs.push(`${key}:nama_tabel`);
    if (audit.record_id !== entry.recordId) diffs.push(`${key}:record_id`);
    if (audit.created_at !== operationTimestamp) diffs.push(`${key}:created_at`);
    const before = parseAuditPayload(audit.data_sebelum);
    const after = parseAuditPayload(audit.data_sesudah);
    for (const field of Object.keys(before)) {
      if (!entry.allowedFields.includes(field)) diffs.push(`${key}:before:${field}`);
    }
    for (const field of Object.keys(after)) {
      if (!entry.allowedFields.includes(field)) diffs.push(`${key}:after:${field}`);
    }
    for (const field of entry.changedFields) {
      if (!(field in after)) diffs.push(`${key}:missing_after:${field}`);
    }
    for (const [field, value] of Object.entries(after)) {
      if (!sameValue(value, nextRecords.get(key)[field])) {
        diffs.push(`${key}:after:${field}`);
      }
    }
    const table =
      entry.tableName === 'absensi' ? states.absensi : states.detail;
    const current = table.recordById.get(entry.recordId)?.record;
    for (const [field, value] of Object.entries(nextRecords.get(key))) {
      if (!current || !sameValue(value, current[field])) {
        diffs.push(`${key}:data:${field}`);
      }
    }
  }
  const currentIds = states.detail.records
    .filter((item) => item.record.absensi_id === absensiId)
    .map((item) => item.record.absensi_detail_id)
    .sort();
  if (JSON.stringify(currentIds) !== JSON.stringify([...detailIds].sort())) {
    diffs.push('absensi_detail:id_set');
  }
  return diffs.length === 0 ? { status: 'matched' } : { status: 'mismatch', diffs };
}

export async function updateTeacherAbsensiBatch(input) {
  try {
    assertContext(input);
  } catch (error) {
    if (error instanceof ValidationError) {
      return invalid(error);
    }
    throw error;
  }

  const { auth } = await import('@/auth');
  const session = await auth();
  const user = session?.user;
  if (
    typeof user?.id !== 'string' ||
    user.id.trim() === '' ||
    user.role !== 'Pengajar' ||
    user.accountStatus !== 'active' ||
    user.bootstrapPending !== false
  ) {
    return { status: 'forbidden' };
  }
  const userId = user.id.trim();

  try {
    return await withAttendanceBatchLock(async () => {
      const { kelasId, absensiId, operationId, operationTimestamp, auditIds = {} } = input;
      const baseline = await readStates();

      const kelasResult = await getKelasForPengajar(userId, kelasId, {
        requireActive: true,
      });
      if (kelasResult.status !== 'ok') {
        return { status: kelasResult.status };
      }
      const absensiResult = await getAbsensiForPengajar(userId, kelasId, absensiId);
      if (absensiResult.status !== 'ok') {
        return { status: absensiResult.status };
      }
      if (absensiResult.data.status_absensi !== ABSENSI_STATUSES[0]) {
        return { status: 'forbidden' };
      }

      let normalized;
      try {
        normalized = normalizeChanges(input);
      } catch (error) {
        if (error instanceof ValidationError) {
          return invalid(error);
        }
        throw error;
      }

      const beforeAbsensi = baseline.absensi.recordById.get(absensiId)?.record;
      if (!beforeAbsensi) {
        return { status: 'not_found' };
      }
      const submittedIds = normalized.details.map((item) => item.absensiDetailId);
      if (new Set(submittedIds).size !== submittedIds.length) {
        return invalid(new ValidationError('duplicate detail id', { field: 'details' }));
      }

      const detailEntries = [];
      for (const item of normalized.details) {
        const before = baseline.detail.recordById.get(item.absensiDetailId)?.record;
        if (!before || before.absensi_id !== absensiId) {
          return invalid(
            new ValidationError('detail not found in absensi', {
              field: 'absensiDetailId',
            }),
          );
        }
        detailEntries.push({ ...item, before });
      }
      const memberships = await listKelasSiswaByKelasId(kelasId);
      const activeSiswaIds = new Set(
        memberships
          .filter((item) => item.status_keanggotaan === 'aktif')
          .map((item) => item.siswa_id),
      );
      if (detailEntries.some((item) => !activeSiswaIds.has(item.before.siswa_id))) {
        return invalid(
          new ValidationError('siswa is not active in kelas', { field: 'siswa_id' }),
        );
      }

      const nextAbsensi = {
        ...beforeAbsensi,
        topik: normalized.topik,
        status_absensi: ABSENSI_STATUSES[0],
        updated_at: operationTimestamp,
      };
      const changedAbsensi = changedFields(beforeAbsensi, nextAbsensi);
      const nextDetails = [];
      for (const item of detailEntries) {
        const next = {
          ...item.before,
          status_kehadiran: item.statusKehadiran,
          catatan: item.catatan,
          updated_by: userId,
          updated_at: operationTimestamp,
        };
        const changed = changedFields(item.before, next);
        if (Object.keys(changed).length > 0) {
          nextDetails.push({ ...item, next, changed });
        }
      }
      const hasChanges =
        Object.keys(changedAbsensi).length > 0 || nextDetails.length > 0;

      let request;
      try {
        request = buildBatchRequest({
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
          auditIds,
        });
      } catch (error) {
        if (error instanceof ValidationError) return invalid(error);
        throw error;
      }
      const initial = verifyCommitted({
        ...request.verifyArgs,
        states: baseline,
      });
      if (initial.status === 'matched') {
        return { status: 'already_applied', data: { auditIds } };
      }
      if (initial.status === 'partial' || initial.status === 'mismatch') {
        return conflict('audit_state_invalid', initial);
      }
      if (!hasChanges) {
        return {
          status: 'ok',
          data: { auditIds: {}, unchanged: true, reason: 'no_changes_requested' },
        };
      }
      if (initial.status !== 'missing') {
        return conflict('audit_state_invalid', initial);
      }

      const guard = await readStates();
      assertSameRows(baseline.absensi, guard.absensi, [absensiId]);
      assertSameRows(baseline.detail, guard.detail, submittedIds);
      assertSameAuditTail(baseline.audit, guard.audit);

      try {
        await commitAttendanceBatch(request.payload);
      } catch (error) {
        if (!(error instanceof SheetOperationError)) throw error;
        const observed = await readStates();
        const check = verifyCommitted({
          ...request.verifyArgs,
          states: observed,
        });
        if (check.status === 'matched') {
          return {
            status: 'already_applied',
            data: { auditIds: request.resolvedAuditIds },
          };
        }
        if (check.status !== 'missing') {
          return conflict('audit_or_data_mismatch_after_error', check);
        }
        assertSameRows(baseline.absensi, observed.absensi, [absensiId]);
        assertSameRows(baseline.detail, observed.detail, submittedIds);
        assertSameAuditTail(baseline.audit, observed.audit);
        await commitAttendanceBatch(request.payload);
      }

      const final = verifyCommitted({
        ...request.verifyArgs,
        states: await readStates(),
      });
      return final.status === 'matched'
        ? { status: 'ok', data: { auditIds: request.resolvedAuditIds } }
        : conflict('readback_mismatch', final);
    });
  } catch (error) {
    if (error instanceof ConflictError) {
      return conflict(error.message, error.details ?? {});
    }
    throw error;
  }
}
