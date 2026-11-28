import { createTableRepository } from '@/repositories/sheet-table-repository';
import { validateFields } from '@/lib/field-validation';
import { ConflictError, DataIntegrityError } from '@/lib/data-errors';

const fields = {
  nama_sekolah: { type: 'string', required: true, maxLength: 200 },
  alamat: { type: 'string', required: true, maxLength: 500 },
  no_hp: { type: 'string', required: true, maxLength: 30 },
  logo: { type: 'url', maxLength: 1000 },
  email: { type: 'email', required: true },
};

function assertSingleRecord(records, operation) {
  if (records.length > 1) {
    throw new DataIntegrityError(
      `sekolah must contain only one record; found ${records.length}`,
      { table: 'sekolah', field: 'sekolah_id' },
    );
  }

  if (operation === 'create' && records.length > 0) {
    throw new ConflictError('Informasi sekolah sudah tersedia; gunakan edit', {
      field: 'sekolah_id',
    });
  }
}

const repository = createTableRepository({
  tableName: 'sekolah',
  idColumn: 'sekolah_id',
  fields,
  deleteMode: { type: 'clear' },
  validateRecords: (records) => assertSingleRecord(records, 'read'),
  beforeCreate: ({ records }) => assertSingleRecord(records, 'create'),
  validateCreate: (data) => validateFields(data, fields, { label: 'sekolah' }),
  validateUpdate: (data) =>
    validateFields(data, fields, { partial: true, label: 'sekolah' }),
});

export const listSekolah = () => repository.list();
export const getSekolahById = (sekolahId) => repository.findById(sekolahId);
export const createSekolah = (data) => repository.create(data);
export const updateSekolah = (sekolahId, data) => repository.update(sekolahId, data);
export const deleteSekolah = (sekolahId) => repository.remove(sekolahId);
