import { PEMINDAHAN_STATUSES } from '@/lib/domain-constants';
import { nowTimestamp } from '@/lib/date-time';
import { ValidationError } from '@/lib/data-errors';
import { validateFields } from '@/lib/field-validation';
import { createTableRepository } from '@/repositories/sheet-table-repository';

const fields = {
  kelas_asal_id: { type: 'string', required: true, maxLength: 20 },
  kelas_tujuan_id: { type: 'string', required: true, maxLength: 20 },
  tanggal_pemindahan: { type: 'date', required: true },
  dilakukan_oleh: { type: 'string', required: true, maxLength: 20 },
  status: { type: 'enum', required: true, allowedValues: PEMINDAHAN_STATUSES },
  total_siswa: { type: 'integer', required: true, min: 0, max: 10000 },
  jumlah_berhasil: { type: 'integer', required: true, min: 0, max: 10000 },
  jumlah_gagal: { type: 'integer', required: true, min: 0, max: 10000 },
  jumlah_dilewati: { type: 'integer', required: true, min: 0, max: 10000 },
  waktu_mulai: { type: 'datetime', required: true },
  waktu_selesai: { type: 'datetime' },
  error_message: { type: 'string', maxLength: 1000 },
};

function validateBatchShape(data, previous) {
  const merged = { ...previous, ...data };

  if (merged.kelas_asal_id === merged.kelas_tujuan_id) {
    throw new ValidationError('kelas_asal_id and kelas_tujuan_id must differ', {
      field: 'kelas_tujuan_id',
    });
  }

  const counted =
    Number(merged.jumlah_berhasil) +
    Number(merged.jumlah_gagal) +
    Number(merged.jumlah_dilewati);

  if (counted > Number(merged.total_siswa)) {
    throw new ValidationError('Result counts cannot exceed total_siswa', {
      field: 'total_siswa',
    });
  }

  return data;
}

const repository = createTableRepository({
  tableName: 'pemindahan_kelas',
  idColumn: 'pemindahan_id',
  fields,
  deleteMode: { type: 'forbidden' },
  validateCreate: (data) => {
    const normalized = validateFields(
      {
        status: 'pending',
        total_siswa: 0,
        jumlah_berhasil: 0,
        jumlah_gagal: 0,
        jumlah_dilewati: 0,
        waktu_mulai: nowTimestamp(),
        ...data,
      },
      fields,
      { label: 'pemindahan_kelas' },
    );
    return validateBatchShape(normalized, {});
  },
  validateUpdate: (data, previous) => {
    const patch = validateFields(data, fields, {
      partial: true,
      label: 'pemindahan_kelas',
    });
    validateBatchShape(patch, previous);
    return patch;
  },
});

export const listPemindahanKelas = () => repository.list();
export const getPemindahanKelasById = (pemindahanId) =>
  repository.findById(pemindahanId);
export const listPemindahanKelasByStatus = async (status) => {
  const records = await repository.list();
  return records.filter((record) => record.status === status);
};
export const createPemindahanKelas = (data) => repository.create(data);
export const updatePemindahanKelas = (pemindahanId, data) =>
  repository.update(pemindahanId, data);
