import { ValidationError } from '@/lib/data-errors';
import { validateFields } from '@/lib/field-validation';
import { isValidDateTime } from '@/lib/validation';
import { absensiDetailFields } from '@/repositories/absensi-detail-repository';
import { absensiFields } from '@/repositories/absensi-repository';

const OPERATION_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const invalid = (error) => ({
  status: 'invalid',
  data: { message: error.message, field: error.field ?? '' },
});

function parseAuditIds(value) {
  if (value === null || value === undefined || value === '') {
    return {};
  }

  let parsed;
  try {
    parsed = JSON.parse(String(value));
  } catch {
    throw new ValidationError('auditIds must be valid JSON', { field: 'auditIds' });
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new ValidationError('auditIds must be an object', { field: 'auditIds' });
  }

  return parsed;
}

/**
 * Builds batch input from FormData. The expected detail ids always come from
 * the repository, never from the form, so the form cannot add or remove siswa.
 */
export function parseTeacherAbsensiEditForm(formData, expectedDetailIds) {
  try {
    if (
      !formData ||
      typeof formData.get !== 'function' ||
      typeof formData.getAll !== 'function'
    ) {
      throw new ValidationError('form data is invalid', { field: 'formData' });
    }
    if (!Array.isArray(expectedDetailIds)) {
      throw new ValidationError('detail ids must be an array', { field: 'details' });
    }

    const operationId = String(formData.get('operationId') ?? '');
    if (!OPERATION_ID_PATTERN.test(operationId)) {
      throw new ValidationError('operationId must be a UUID', {
        field: 'operationId',
      });
    }

    const operationTimestamp = String(formData.get('operationTimestamp') ?? '');
    if (!isValidDateTime(operationTimestamp)) {
      throw new ValidationError('operationTimestamp must be a timestamp', {
        field: 'operationTimestamp',
      });
    }

    const submittedIds = formData.getAll('absensiDetailId').map(String);
    if (submittedIds.length === 0) {
      throw new ValidationError('detail list is empty', { field: 'details' });
    }
    if (new Set(submittedIds).size !== submittedIds.length) {
      throw new ValidationError('duplicate detail id', { field: 'details' });
    }

    const storedIds = expectedDetailIds.map(String);
    if (new Set(storedIds).size !== storedIds.length) {
      throw new ValidationError('stored detail ids are duplicated', {
        field: 'details',
      });
    }
    const submittedSet = [...submittedIds].sort();
    const storedSet = [...storedIds].sort();
    if (submittedSet.join('|') !== storedSet.join('|')) {
      throw new ValidationError('detail ids do not match absensi', {
        field: 'details',
      });
    }

    const { topik } = validateFields(
      { topik: formData.get('topik') ?? '' },
      { topik: absensiFields.topik },
      { label: 'absensi' },
    );

    const details = submittedIds.map((absensiDetailId) => {
      const validated = validateFields(
        {
          status_kehadiran: formData.get(`status_${absensiDetailId}`),
          catatan: formData.get(`catatan_${absensiDetailId}`) ?? '',
        },
        {
          status_kehadiran: absensiDetailFields.status_kehadiran,
          catatan: absensiDetailFields.catatan,
        },
        { label: 'absensi_detail' },
      );

      return {
        absensiDetailId,
        statusKehadiran: validated.status_kehadiran,
        catatan: validated.catatan,
      };
    });

    return {
      status: 'ok',
      data: {
        operationId,
        operationTimestamp,
        topik,
        details,
        auditIds: parseAuditIds(formData.get('auditIds')),
      },
    };
  } catch (error) {
    if (error instanceof ValidationError) {
      return invalid(error);
    }

    throw error;
  }
}
