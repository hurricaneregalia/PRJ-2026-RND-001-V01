import { HARI, JADWAL_STATUSES } from '@/lib/domain-constants';
import { validateFields } from '@/lib/field-validation';
import { ValidationError } from '@/lib/data-errors';
import { createTableRepository } from '@/repositories/sheet-table-repository';

const fields = {
  kelas_id: { type: 'string', required: true, maxLength: 20 },
  hari: { type: 'enum', required: true, allowedValues: HARI },
  jam_mulai: { type: 'time', required: true },
  jam_selesai: { type: 'time', required: true },
  ruangan: { type: 'string', maxLength: 100 },
  status_jadwal: { type: 'enum', required: true, allowedValues: JADWAL_STATUSES },
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
  tableName: 'jadwal',
  idColumn: 'jadwal_id',
  fields,
  deleteMode: { type: 'soft', field: 'status_jadwal', value: 'nonaktif' },
  validateCreate: (data) =>
    validateTimes(
      validateFields(
        data.status_jadwal === undefined ? { status_jadwal: 'aktif', ...data } : data,
        fields,
        { label: 'jadwal' },
      ),
    ),
  validateUpdate: (data, previous) => {
    const patch = validateFields(data, fields, {
      partial: true,
      label: 'jadwal',
    });
    validateTimes({ ...previous, ...patch });
    return patch;
  },
});

export const listJadwal = () => repository.list();
export const getJadwalById = (jadwalId) => repository.findById(jadwalId);
export const listJadwalByKelasId = async (kelasId) => {
  const records = await repository.list();
  return records.filter((record) => record.kelas_id === kelasId);
};
export const createJadwal = (data) => repository.create(data);
export const updateJadwal = (jadwalId, data) => repository.update(jadwalId, data);
export const deactivateJadwal = (jadwalId) => repository.remove(jadwalId);
