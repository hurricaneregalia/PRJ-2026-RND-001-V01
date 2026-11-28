import { KEHADIRAN_STATUSES } from '@/lib/domain-constants';
import { ValidationError } from '@/lib/data-errors';
import { validateFields } from '@/lib/field-validation';
import { createTableRepository } from '@/repositories/sheet-table-repository';

const fields = {
  absensi_id: { type: 'string', required: true, maxLength: 20 },
  siswa_id: { type: 'string', required: true, maxLength: 20 },
  status_kehadiran: {
    type: 'enum',
    required: true,
    allowedValues: KEHADIRAN_STATUSES,
  },
  catatan: { type: 'string', maxLength: 500 },
  updated_by: { type: 'string', required: true, maxLength: 20 },
};

const repository = createTableRepository({
  tableName: 'absensi_detail',
  idColumn: 'absensi_detail_id',
  fields,
  uniqueKeys: [['absensi_id', 'siswa_id']],
  deleteMode: { type: 'forbidden' },
  validateCreate: (data) =>
    validateFields(data, fields, { label: 'absensi_detail' }),
  validateUpdate: (data, previous) => {
    const patch = validateFields(data, fields, {
      partial: true,
      label: 'absensi_detail',
    });

    for (const field of ['absensi_id', 'siswa_id']) {
      if (field in patch && patch[field] !== previous[field]) {
        throw new ValidationError(`${field} cannot be changed`, { field });
      }
    }

    return patch;
  },
});

export const absensiDetailFields = fields;
export const listAbsensiDetail = () => repository.list();
export const getAbsensiDetailById = (absensiDetailId) =>
  repository.findById(absensiDetailId);
export const listAbsensiDetailByAbsensiId = async (absensiId) => {
  const records = await repository.list();
  return records.filter((record) => record.absensi_id === absensiId);
};
export const listAbsensiDetailBySiswaId = async (siswaId) => {
  const records = await repository.list();
  return records.filter((record) => record.siswa_id === siswaId);
};
export const createAbsensiDetail = (data) => repository.create(data);
export const updateAbsensiDetail = (absensiDetailId, data) =>
  repository.update(absensiDetailId, data);
