import { PEMINDAHAN_DETAIL_STATUSES } from '@/lib/domain-constants';
import { validateFields } from '@/lib/field-validation';
import { createTableRepository } from '@/repositories/sheet-table-repository';

const fields = {
  pemindahan_id: { type: 'string', required: true, maxLength: 20 },
  siswa_id: { type: 'string', required: true, maxLength: 20 },
  kelas_siswa_lama_id: { type: 'string', required: true, maxLength: 20 },
  kelas_siswa_baru_id: { type: 'string', maxLength: 20 },
  status_siswa: {
    type: 'enum',
    required: true,
    allowedValues: PEMINDAHAN_DETAIL_STATUSES,
  },
  alasan: { type: 'string', maxLength: 1000 },
  waktu_mulai: { type: 'datetime' },
  waktu_selesai: { type: 'datetime' },
  error_message: { type: 'string', maxLength: 1000 },
};

const repository = createTableRepository({
  tableName: 'pemindahan_kelas_detail',
  idColumn: 'detail_id',
  fields,
  uniqueKeys: [['pemindahan_id', 'siswa_id']],
  deleteMode: { type: 'forbidden' },
  validateCreate: (data) =>
    validateFields(
      data.status_siswa === undefined ? { status_siswa: 'pending', ...data } : data,
      fields,
      { label: 'pemindahan_kelas_detail' },
    ),
  validateUpdate: (data) =>
    validateFields(data, fields, {
      partial: true,
      label: 'pemindahan_kelas_detail',
    }),
});

export const listPemindahanKelasDetail = () => repository.list();
export const getPemindahanKelasDetailById = (detailId) =>
  repository.findById(detailId);
export const listPemindahanKelasDetailByPemindahanId = async (pemindahanId) => {
  const records = await repository.list();
  return records.filter((record) => record.pemindahan_id === pemindahanId);
};
export const listPemindahanKelasDetailBySiswaId = async (siswaId) => {
  const records = await repository.list();
  return records.filter((record) => record.siswa_id === siswaId);
};
export const createPemindahanKelasDetail = (data) => repository.create(data);
export const updatePemindahanKelasDetail = (detailId, data) =>
  repository.update(detailId, data);
