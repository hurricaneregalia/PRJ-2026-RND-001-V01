import { createTableRepository } from '@/repositories/sheet-table-repository';
import { validateFields } from '@/lib/field-validation';

const fields = {
  nama_sekolah: { type: 'string', required: true, maxLength: 200 },
  alamat: { type: 'string', maxLength: 500 },
  no_hp: { type: 'string', maxLength: 30 },
};

const repository = createTableRepository({
  tableName: 'sekolah',
  idColumn: 'sekolah_id',
  fields,
  deleteMode: { type: 'clear' },
  validateCreate: (data) => validateFields(data, fields, { label: 'sekolah' }),
  validateUpdate: (data) =>
    validateFields(data, fields, { partial: true, label: 'sekolah' }),
});

export const listSekolah = () => repository.list();
export const getSekolahById = (sekolahId) => repository.findById(sekolahId);
export const createSekolah = (data) => repository.create(data);
export const updateSekolah = (sekolahId, data) => repository.update(sekolahId, data);
export const deleteSekolah = (sekolahId) => repository.remove(sekolahId);
