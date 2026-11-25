import { SISWA_STATUSES, JENIS_KELAMIN } from '@/lib/domain-constants';
import { validateFields } from '@/lib/field-validation';
import { createTableRepository } from '@/repositories/sheet-table-repository';

const fields = {
  nama: { type: 'string', required: true, maxLength: 200 },
  nis: { type: 'string', maxLength: 50 },
  jenis_kelamin: { type: 'enum', allowedValues: JENIS_KELAMIN },
  tanggal_lahir: { type: 'date' },
  alamat: { type: 'string', maxLength: 500 },
  no_hp: { type: 'string', maxLength: 30 },
  status: { type: 'enum', required: true, allowedValues: SISWA_STATUSES },
};

const repository = createTableRepository({
  tableName: 'siswa',
  idColumn: 'siswa_id',
  fields,
  deleteMode: { type: 'soft', field: 'status', value: 'nonaktif' },
  validateCreate: (data) =>
    validateFields(data.status === undefined ? { status: 'aktif', ...data } : data, fields, {
      label: 'siswa',
    }),
  validateUpdate: (data) =>
    validateFields(data, fields, { partial: true, label: 'siswa' }),
});

export const listSiswa = () => repository.list();
export const getSiswaById = (siswaId) => repository.findById(siswaId);
export const findSiswaByNis = (nis) =>
  repository.findOne((record) => record.nis === String(nis ?? '').trim());
export const createSiswa = (data) => repository.create(data);
export const updateSiswa = (siswaId, data) => repository.update(siswaId, data);
export const deactivateSiswa = (siswaId) => repository.remove(siswaId);
