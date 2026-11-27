import { ABSENSI_STATUSES } from '@/lib/domain-constants';
import { ValidationError } from '@/lib/data-errors';
import { validateFields } from '@/lib/field-validation';
import { createTableRepository } from '@/repositories/sheet-table-repository';

const fields = {
  kelas_id: { type: 'string', required: true, maxLength: 20 },
  jadwal_id: { type: 'string', maxLength: 20 },
  tanggal: { type: 'date', required: true },
  jam_mulai: { type: 'time' },
  jam_selesai: { type: 'time' },
  topik: { type: 'string', maxLength: 500 },
  status_absensi: {
    type: 'enum',
    required: true,
    allowedValues: ABSENSI_STATUSES,
  },
  created_by: { type: 'string', required: true, maxLength: 20 },
};

function validateTimes(data) {
  if (data.jam_mulai && data.jam_selesai && data.jam_mulai >= data.jam_selesai) {
    throw new ValidationError('jam_selesai must be after jam_mulai', {
      field: 'jam_selesai',
    });
  }

  return data;
}

const repository = createTableRepository({
  tableName: 'absensi',
  idColumn: 'absensi_id',
  fields,
  deleteMode: { type: 'forbidden' },
  validateCreate: (data) =>
    validateTimes(
      validateFields({ ...data, status_absensi: 'final' }, fields, {
        label: 'absensi',
      }),
    ),
  validateUpdate: (data, previous) => {
    const patch = validateFields(data, fields, {
      partial: true,
      label: 'absensi',
    });

    if (patch.kelas_id !== undefined && patch.kelas_id !== previous.kelas_id) {
      throw new ValidationError('kelas_id cannot be changed after absensi is created', {
        field: 'kelas_id',
      });
    }

    validateTimes({ ...previous, ...patch });
    return patch;
  },
});

export const listAbsensi = () => repository.list();
export const getAbsensiById = (absensiId) => repository.findById(absensiId);
export const listAbsensiByKelasId = async (kelasId) => {
  const records = await repository.list();
  return records.filter((record) => record.kelas_id === kelasId);
};
export const listAbsensiByTanggal = async (tanggal) => {
  const records = await repository.list();
  return records.filter((record) => record.tanggal === tanggal);
};
export const createAbsensi = (data) => repository.create(data);
export const updateAbsensi = (absensiId, data) => repository.update(absensiId, data);
