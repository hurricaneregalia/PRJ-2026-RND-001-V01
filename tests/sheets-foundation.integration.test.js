// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { ConflictError, SheetHeaderError } from '@/lib/data-errors';
import { validateFields } from '@/lib/field-validation';
import { WORKSHEET_NAMES, WORKSHEET_SCHEMAS } from '@/lib/sheet-schema';
import {
  assertWorksheetHeader,
  clearWorksheetRow,
  readWorksheetRecords,
} from '@/repositories/sheets-repository';
import {
  createSekolah,
  deleteSekolah,
  getSekolahById,
  listSekolah,
  updateSekolah,
} from '@/repositories/sekolah-repository';
import {
  closeKelasSiswa,
  createKelasSiswa,
  findActiveKelasSiswaBySiswaId,
} from '@/repositories/kelas-siswa-repository';
import { createKelas } from '@/repositories/kelas-repository';
import {
  findAuditByIdempotencyKey,
  recordAuditLogin,
} from '@/repositories/audit-log-repository';
import { createTableRepository } from '@/repositories/sheet-table-repository';

const integrationEnabled = process.env.RUN_SHEETS_INTEGRATION === '1';
const TOUCHED_SHEETS = ['sekolah', 'kelas', 'kelas_siswa', 'audit_log'];
const TEST_MARKERS = ['TEST-FOUNDATION', 'TEST-SISWA-1', 'TEST-KELAS-1', 'TEST-ACTOR'];
const createdIds = new Map();
const headerSnapshots = new Map();

function remember(tableName, record) {
  const idColumn = WORKSHEET_SCHEMAS[tableName][0];

  if (!createdIds.has(tableName)) {
    createdIds.set(tableName, new Set());
  }

  createdIds.get(tableName).add(record[idColumn]);
}

function isTestRow(tableName, record) {
  const idColumn = WORKSHEET_SCHEMAS[tableName][0];

  if (createdIds.get(tableName)?.has(record[idColumn])) {
    return true;
  }

  return Object.values(record).some((value) =>
    TEST_MARKERS.some((marker) => String(value).includes(marker)),
  );
}

async function clearTestRows() {
  for (const tableName of TOUCHED_SHEETS) {
    const { header, records } = await readWorksheetRecords(
      tableName,
      WORKSHEET_SCHEMAS[tableName],
    );

    for (const { rowNumber, record } of records) {
      if (!isTestRow(tableName, record)) {
        throw new Error(
          `Refusing to clear non-test row ${rowNumber} from ${tableName}`,
        );
      }
    }

    for (const { rowNumber } of records) {
      await clearWorksheetRow(tableName, rowNumber, header.length);
    }

    const after = await readWorksheetRecords(
      tableName,
      WORKSHEET_SCHEMAS[tableName],
    );

    if (after.records.length !== 0) {
      throw new Error(`Cleanup failed for ${tableName}`);
    }
  }
}

beforeAll(async () => {
  if (!integrationEnabled) {
    return;
  }

  for (const tableName of WORKSHEET_NAMES) {
    const { header, records } = await readWorksheetRecords(
      tableName,
      WORKSHEET_SCHEMAS[tableName],
    );

    if (records.length > 0) {
      throw new Error(
        `Refusing integration test: ${tableName} already contains data`,
      );
    }

    headerSnapshots.set(tableName, header);
  }
}, 30000);

afterAll(async () => {
  if (!integrationEnabled) {
    return;
  }

  await clearTestRows();
}, 30000);

describe.skipIf(!integrationEnabled)('Google Sheets foundation', () => {
  it('reads all 13 worksheets and validates headers', () => {
    for (const tableName of WORKSHEET_NAMES) {
      expect(headerSnapshots.get(tableName)).toEqual(
        WORKSHEET_SCHEMAS[tableName],
      );
    }
  });

  it('creates, reads, updates, and deletes a temporary sekolah', async () => {
    const created = await createSekolah({
      nama_sekolah: 'TEST-FOUNDATION-SCHOOL',
      alamat: 'Alamat awal',
    });
    remember('sekolah', created);

    expect(created.sekolah_id).toMatch(/^SCH-\d{4}$/);
    expect((await getSekolahById(created.sekolah_id)).nama_sekolah).toBe(
      'TEST-FOUNDATION-SCHOOL',
    );
    expect((await listSekolah()).some((record) => record.sekolah_id === created.sekolah_id)).toBe(
      true,
    );

    const updated = await updateSekolah(created.sekolah_id, {
      alamat: 'Alamat baru',
    });
    expect(updated.alamat).toBe('Alamat baru');

    const duplicateRepository = createTableRepository({
      tableName: 'sekolah',
      idColumn: 'sekolah_id',
      fields: {
        nama_sekolah: { type: 'string', required: true, maxLength: 200 },
        alamat: { type: 'string', maxLength: 500 },
        no_hp: { type: 'string', maxLength: 30 },
      },
      deleteMode: { type: 'forbidden' },
      validateCreate: (data) =>
        validateFields(
          data,
          {
            nama_sekolah: { type: 'string', required: true, maxLength: 200 },
            alamat: { type: 'string', maxLength: 500 },
            no_hp: { type: 'string', maxLength: 30 },
          },
          { label: 'sekolah' },
        ),
    });

    await expect(
      duplicateRepository.create(
        { nama_sekolah: 'TEST-FOUNDATION-DUPLICATE' },
        { recordId: created.sekolah_id },
      ),
    ).rejects.toBeInstanceOf(ConflictError);

    await deleteSekolah(created.sekolah_id);
    expect(await getSekolahById(created.sekolah_id)).toBeNull();
  }, 60000);

  it('serializes concurrent creates and assigns distinct IDs', async () => {
    const [first, second] = await Promise.all([
      createSekolah({ nama_sekolah: 'TEST-FOUNDATION-CONCURRENT-A' }),
      createSekolah({ nama_sekolah: 'TEST-FOUNDATION-CONCURRENT-B' }),
    ]);

    remember('sekolah', first);
    remember('sekolah', second);
    expect(first.sekolah_id).not.toBe(second.sekolah_id);

    await deleteSekolah(first.sekolah_id);
    await deleteSekolah(second.sekolah_id);
  }, 60000);

  it('rejects duplicate unique values', async () => {
    const first = await createKelas({
      kode_kelas: 'TEST-FOUNDATION-K',
      nama_kelas: 'TEST-FOUNDATION-KELAS',
      pengajar_id: 'TEST-TEACHER',
    });
    remember('kelas', first);

    await expect(
      createKelas({
        kode_kelas: 'TEST-FOUNDATION-K',
        nama_kelas: 'TEST-FOUNDATION-KELAS-2',
        pengajar_id: 'TEST-TEACHER',
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  }, 60000);

  it('prevents two active class memberships for one student', async () => {
    const first = await createKelasSiswa({
      kelas_id: 'TEST-KELAS-1',
      siswa_id: 'TEST-SISWA-1',
      tanggal_mulai: '2026-01-01',
      status_keanggotaan: 'aktif',
    });
    remember('kelas_siswa', first);

    await expect(
      createKelasSiswa({
        kelas_id: 'TEST-KELAS-2',
        siswa_id: 'TEST-SISWA-1',
        tanggal_mulai: '2026-02-01',
        status_keanggotaan: 'aktif',
      }),
    ).rejects.toBeInstanceOf(ConflictError);

    await closeKelasSiswa(first.kelas_siswa_id, '2026-01-31');

    const second = await createKelasSiswa({
      kelas_id: 'TEST-KELAS-2',
      siswa_id: 'TEST-SISWA-1',
      tanggal_mulai: '2026-02-01',
      status_keanggotaan: 'aktif',
    });
    remember('kelas_siswa', second);

    const active = await findActiveKelasSiswaBySiswaId('TEST-SISWA-1');
    expect(active.kelas_siswa_id).toBe(second.kelas_siswa_id);
  }, 60000);

  it('rejects a mismatched worksheet header', async () => {
    await expect(
      assertWorksheetHeader('sekolah', ['wrong_header']),
    ).rejects.toBeInstanceOf(SheetHeaderError);
  }, 30000);

  it('writes audit entries idempotently and redacts sensitive values', async () => {
    const params = {
      tableName: 'users',
      recordId: 'TEST-FOUNDATION-RECORD',
      userId: 'TEST-ACTOR',
      idempotencyKey: 'TEST-FOUNDATION-AUDIT-1',
      after: {
        email: 'test@example.com',
        password: 'PASSWORD-SHOULD-NOT-APPEAR',
        token: 'TOKEN-SHOULD-NOT-APPEAR',
      },
      note: 'TEST-FOUNDATION audit',
    };

    const first = await recordAuditLogin(params);
    remember('audit_log', first);

    const second = await recordAuditLogin(params);
    expect(second.audit_id).toBe(first.audit_id);

    const stored = await findAuditByIdempotencyKey('TEST-FOUNDATION-AUDIT-1');
    expect(stored.audit_id).toBe(first.audit_id);
    expect(stored.data_sesudah).toContain('[REDACTED]');
    expect(stored.data_sesudah).not.toContain('PASSWORD-SHOULD-NOT-APPEAR');
    expect(stored.data_sesudah).not.toContain('TOKEN-SHOULD-NOT-APPEAR');
  }, 60000);
});
