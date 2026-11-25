import {
  DataIntegrityError,
  ConflictError,
  ValidationError,
} from '@/lib/data-errors';
import { PEMANTAUAN_STATUSES } from '@/lib/domain-constants';
import { validateFields } from '@/lib/field-validation';
import { createTableRepository } from '@/repositories/sheet-table-repository';

const fields = {
  siswa_id: { type: 'string', required: true, maxLength: 20 },
  kelas_id: { type: 'string', required: true, maxLength: 20 },
  tanggal_mulai: { type: 'date', required: true },
  tanggal_selesai: { type: 'date' },
  jumlah_alpa_terakhir: { type: 'integer', required: true, min: 0, max: 10000 },
  status_pemantauan: {
    type: 'enum',
    required: true,
    allowedValues: PEMANTAUAN_STATUSES,
  },
};

function validateShape(data) {
  if (data.status_pemantauan === 'aktif' && data.tanggal_selesai) {
    throw new ValidationError('tanggal_selesai must be empty for active case', {
      field: 'tanggal_selesai',
    });
  }

  if (data.status_pemantauan === 'selesai' && !data.tanggal_selesai) {
    throw new ValidationError('tanggal_selesai is required for completed case', {
      field: 'tanggal_selesai',
    });
  }

  return data;
}

function assertNoOtherActive(records, siswaId, kelasId, exceptId) {
  const active = records.find(
    (record) =>
      record.siswa_id === siswaId &&
      record.kelas_id === kelasId &&
      record.status_pemantauan === 'aktif' &&
      record.pemantauan_id !== exceptId,
  );

  if (active) {
    throw new ConflictError(
      `Siswa ${siswaId} already has active monitoring for kelas ${kelasId}`,
      { field: 'siswa_id' },
    );
  }
}

const repository = createTableRepository({
  tableName: 'pemantauan_ketidakhadiran',
  idColumn: 'pemantauan_id',
  fields,
  deleteMode: { type: 'forbidden' },
  validateCreate: (data) =>
    validateShape(
      validateFields(
        data.status_pemantauan === undefined
          ? { status_pemantauan: 'aktif', ...data }
          : data,
        fields,
        { label: 'pemantauan_ketidakhadiran' },
      ),
    ),
  validateUpdate: (data, previous) => {
    const patch = validateFields(data, fields, {
      partial: true,
      label: 'pemantauan_ketidakhadiran',
    });

    for (const field of ['siswa_id', 'kelas_id', 'tanggal_mulai']) {
      if (field in patch && patch[field] !== previous[field]) {
        throw new ValidationError(`${field} cannot be changed`, { field });
      }
    }

    const nextStatus = patch.status_pemantauan ?? previous.status_pemantauan;

    if (
      patch.status_pemantauan &&
      patch.status_pemantauan !== previous.status_pemantauan &&
      previous.status_pemantauan === 'selesai'
    ) {
      throw new ValidationError('Completed monitoring case cannot be reopened', {
        field: 'status_pemantauan',
      });
    }

    const merged = { ...previous, ...patch };

    if (nextStatus === 'aktif' && merged.tanggal_selesai) {
      throw new ValidationError('tanggal_selesai must be empty for active case', {
        field: 'tanggal_selesai',
      });
    }

    if (nextStatus === 'selesai' && !merged.tanggal_selesai) {
      throw new ValidationError('tanggal_selesai is required for completed case', {
        field: 'tanggal_selesai',
      });
    }

    return patch;
  },
  validateRecords: (records) => {
    const activeKeys = new Set();

    for (const record of records) {
      if (record.status_pemantauan !== 'aktif') {
        continue;
      }

      const key = `${record.siswa_id}\u0000${record.kelas_id}`;

      if (activeKeys.has(key)) {
        throw new DataIntegrityError(
          `Siswa ${record.siswa_id} has more than one active monitoring case`,
          { table: 'pemantauan_ketidakhadiran', field: 'siswa_id' },
        );
      }

      activeKeys.add(key);
    }
  },
  beforeCreate: async ({ record, records }) => {
    if (record.status_pemantauan === 'aktif') {
      assertNoOtherActive(
        records,
        record.siswa_id,
        record.kelas_id,
        record.pemantauan_id,
      );
    }
  },
  beforeUpdate: async ({ previous, next, records }) => {
    if (
      previous.status_pemantauan !== 'aktif' &&
      next.status_pemantauan === 'aktif'
    ) {
      assertNoOtherActive(
        records,
        next.siswa_id,
        next.kelas_id,
        next.pemantauan_id,
      );
    }
  },
});

export const listPemantauan = () => repository.list();
export const getPemantauanById = (pemantauanId) =>
  repository.findById(pemantauanId);
export const findActivePemantauan = async (siswaId, kelasId) => {
  const records = await repository.list();
  return (
    records.find(
      (record) =>
        record.siswa_id === siswaId &&
        record.kelas_id === kelasId &&
        record.status_pemantauan === 'aktif',
    ) ?? null
  );
};
export const createPemantauan = (data) => repository.create(data);
export const updatePemantauan = (pemantauanId, data) =>
  repository.update(pemantauanId, data);
