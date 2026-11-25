import { KELAS_STATUSES } from '@/lib/domain-constants';
import { validateFields } from '@/lib/field-validation';
import { createTableRepository } from '@/repositories/sheet-table-repository';

const fields = {
  kode_kelas: { type: 'string', required: true, maxLength: 50 },
  nama_kelas: { type: 'string', required: true, maxLength: 200 },
  pengajar_id: { type: 'string', required: true, maxLength: 20 },
  kapasitas: { type: 'integer', min: 0, max: 10000 },
  status_kelas: { type: 'enum', required: true, allowedValues: KELAS_STATUSES },
};

const repository = createTableRepository({
  tableName: 'kelas',
  idColumn: 'kelas_id',
  fields,
  uniqueKeys: [['kode_kelas']],
  deleteMode: { type: 'soft', field: 'status_kelas', value: 'nonaktif' },
  validateCreate: (data) =>
    validateFields(
      data.status_kelas === undefined ? { status_kelas: 'aktif', ...data } : data,
      fields,
      { label: 'kelas' },
    ),
  validateUpdate: (data) =>
    validateFields(data, fields, { partial: true, label: 'kelas' }),
});

export const listKelas = () => repository.list();
export const getKelasById = (kelasId) => repository.findById(kelasId);
export const findKelasByKode = (kodeKelas) =>
  repository.findOne((record) => record.kode_kelas === String(kodeKelas ?? '').trim());
export const createKelas = (data) => repository.create(data);
export const updateKelas = (kelasId, data) => repository.update(kelasId, data);
export const deactivateKelas = (kelasId) => repository.remove(kelasId);
