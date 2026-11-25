import {
  PENERIMA_TYPES,
  PENGIRIMAN_STATUSES,
  PENGIRIM_TYPES,
} from '@/lib/domain-constants';
import { ValidationError } from '@/lib/data-errors';
import { validateFields } from '@/lib/field-validation';
import { createTableRepository } from '@/repositories/sheet-table-repository';

const fields = {
  pemantauan_id: { type: 'string', required: true, maxLength: 20 },
  siswa_id: { type: 'string', required: true, maxLength: 20 },
  kelas_id: { type: 'string', required: true, maxLength: 20 },
  pengajar_id: { type: 'string', maxLength: 20 },
  jenis_pengirim: {
    type: 'enum',
    required: true,
    allowedValues: PENGIRIM_TYPES,
  },
  jenis_penerima: {
    type: 'enum',
    required: true,
    allowedValues: PENERIMA_TYPES,
  },
  penerima_id: { type: 'string', required: true, maxLength: 50 },
  nomor_whatsapp: { type: 'string', required: true, maxLength: 30 },
  pesan: { type: 'string', required: true, maxLength: 5000 },
  jumlah_alpa_saat_kontak: {
    type: 'integer',
    required: true,
    min: 0,
    max: 10000,
  },
  periode_awal: { type: 'date', required: true },
  periode_akhir: { type: 'date', required: true },
  status_pengiriman: {
    type: 'enum',
    required: true,
    allowedValues: PENGIRIMAN_STATUSES,
  },
  dikirim_oleh: { type: 'string', required: true, maxLength: 20 },
  tanggal_kontak: { type: 'date', required: true },
};

const repository = createTableRepository({
  tableName: 'riwayat_kontak',
  idColumn: 'kontak_id',
  fields,
  allowUpdate: false,
  deleteMode: { type: 'forbidden' },
  validateCreate: (data) => {
    const record = validateFields(data, fields, { label: 'riwayat_kontak' });

    if (record.periode_awal > record.periode_akhir) {
      throw new ValidationError('periode_akhir must not be before periode_awal', {
        field: 'periode_akhir',
      });
    }

    return record;
  },
});

export const listRiwayatKontak = () => repository.list();
export const getRiwayatKontakById = (kontakId) => repository.findById(kontakId);
export const listRiwayatKontakBySiswaId = async (siswaId) => {
  const records = await repository.list();
  return records.filter((record) => record.siswa_id === siswaId);
};
export const listRiwayatKontakByPemantauanId = async (pemantauanId) => {
  const records = await repository.list();
  return records.filter((record) => record.pemantauan_id === pemantauanId);
};
export const createRiwayatKontak = (data) => repository.create(data);
