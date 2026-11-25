import {
  DataIntegrityError,
  ConflictError,
  ValidationError,
} from '@/lib/data-errors';
import { todayDate } from '@/lib/date-time';
import { KELAS_SISWA_STATUSES } from '@/lib/domain-constants';
import { validateFields } from '@/lib/field-validation';
import { createTableRepository } from '@/repositories/sheet-table-repository';

const fields = {
  kelas_id: { type: 'string', required: true, maxLength: 20 },
  siswa_id: { type: 'string', required: true, maxLength: 20 },
  tanggal_mulai: { type: 'date', required: true },
  tanggal_selesai: { type: 'date' },
  status_keanggotaan: {
    type: 'enum',
    required: true,
    allowedValues: KELAS_SISWA_STATUSES,
  },
};

const IMMUTABLE_FIELDS = ['kelas_id', 'siswa_id', 'tanggal_mulai'];
const TRANSITIONS = {
  pending: ['aktif', 'dibatalkan'],
  aktif: ['selesai'],
  selesai: [],
  dibatalkan: [],
};

function validateShape(data) {
  if (data.status_keanggotaan === 'aktif' && data.tanggal_selesai) {
    throw new ValidationError('tanggal_selesai must be empty for active membership', {
      field: 'tanggal_selesai',
    });
  }

  if (data.status_keanggotaan === 'pending' && data.tanggal_selesai) {
    throw new ValidationError('tanggal_selesai must be empty for pending membership', {
      field: 'tanggal_selesai',
    });
  }

  if (data.status_keanggotaan === 'selesai' && !data.tanggal_selesai) {
    throw new ValidationError('tanggal_selesai is required for completed membership', {
      field: 'tanggal_selesai',
    });
  }

  return data;
}

function assertNoOtherActive(records, siswaId, exceptId) {
  const active = records.find(
    (record) =>
      record.siswa_id === siswaId &&
      record.status_keanggotaan === 'aktif' &&
      record.kelas_siswa_id !== exceptId,
  );

  if (active) {
    throw new ConflictError(
      `Siswa ${siswaId} already has active membership ${active.kelas_siswa_id}`,
      { field: 'siswa_id' },
    );
  }
}

const repository = createTableRepository({
  tableName: 'kelas_siswa',
  idColumn: 'kelas_siswa_id',
  fields,
  uniqueKeys: [['kelas_id', 'siswa_id', 'tanggal_mulai']],
  deleteMode: { type: 'forbidden' },
  validateCreate: (data) =>
    validateShape(
      validateFields(
        data.status_keanggotaan === undefined
          ? { status_keanggotaan: 'pending', ...data }
          : data,
        fields,
        { label: 'kelas_siswa' },
      ),
    ),
  validateUpdate: (data, previous) => {
    const patch = validateFields(data, fields, {
      partial: true,
      label: 'kelas_siswa',
    });

    for (const field of IMMUTABLE_FIELDS) {
      if (field in patch && patch[field] !== previous[field]) {
        throw new ValidationError(`${field} cannot be changed`, { field });
      }
    }

    const nextStatus = patch.status_keanggotaan ?? previous.status_keanggotaan;

    if (
      patch.status_keanggotaan &&
      patch.status_keanggotaan !== previous.status_keanggotaan &&
      !TRANSITIONS[previous.status_keanggotaan]?.includes(patch.status_keanggotaan)
    ) {
      throw new ValidationError(
        `Invalid membership transition: ${previous.status_keanggotaan} -> ${patch.status_keanggotaan}`,
        { field: 'status_keanggotaan' },
      );
    }

    const merged = { ...previous, ...patch };

    if (nextStatus === 'aktif' && merged.tanggal_selesai) {
      throw new ValidationError('tanggal_selesai must be empty for active membership', {
        field: 'tanggal_selesai',
      });
    }

    if (nextStatus === 'pending' && merged.tanggal_selesai) {
      throw new ValidationError('tanggal_selesai must be empty for pending membership', {
        field: 'tanggal_selesai',
      });
    }

    if (nextStatus === 'selesai' && !(patch.tanggal_selesai ?? previous.tanggal_selesai)) {
      throw new ValidationError('tanggal_selesai is required for completed membership', {
        field: 'tanggal_selesai',
      });
    }

    return patch;
  },
  validateRecords: (records) => {
    const activeBySiswa = new Map();

    for (const record of records) {
      if (record.status_keanggotaan !== 'aktif') {
        continue;
      }

      if (activeBySiswa.has(record.siswa_id)) {
        throw new DataIntegrityError(
          `Siswa ${record.siswa_id} has more than one active membership`,
          { table: 'kelas_siswa', field: 'siswa_id' },
        );
      }

      activeBySiswa.set(record.siswa_id, record.kelas_siswa_id);
    }
  },
  beforeCreate: async ({ record, records }) => {
    if (record.status_keanggotaan === 'aktif') {
      assertNoOtherActive(records, record.siswa_id, record.kelas_siswa_id);
    }
  },
  beforeUpdate: async ({ previous, next, records }) => {
    if (
      previous.status_keanggotaan !== 'aktif' &&
      next.status_keanggotaan === 'aktif'
    ) {
      assertNoOtherActive(records, next.siswa_id, next.kelas_siswa_id);
    }
  },
});

export const listKelasSiswa = () => repository.list();
export const getKelasSiswaById = (kelasSiswaId) =>
  repository.findById(kelasSiswaId);
export const listKelasSiswaBySiswaId = async (siswaId) => {
  const records = await repository.list();
  return records.filter((record) => record.siswa_id === siswaId);
};
export const listKelasSiswaByKelasId = async (kelasId) => {
  const records = await repository.list();
  return records.filter((record) => record.kelas_id === kelasId);
};
export const findActiveKelasSiswaBySiswaId = async (siswaId) => {
  const records = await repository.list();
  return (
    records.find(
      (record) =>
        record.siswa_id === siswaId && record.status_keanggotaan === 'aktif',
    ) ?? null
  );
};
export const createKelasSiswa = (data) => repository.create(data);
export const updateKelasSiswa = (kelasSiswaId, data) =>
  repository.update(kelasSiswaId, data);
export const closeKelasSiswa = (kelasSiswaId, tanggalSelesai = todayDate()) =>
  repository.update(kelasSiswaId, {
    status_keanggotaan: 'selesai',
    tanggal_selesai: tanggalSelesai,
  });
