// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { getGoogleSheetsClient } from '@/lib/google-sheets-client';
import { WORKSHEET_SCHEMAS } from '@/lib/sheet-schema';
import { readStates } from '@/repositories/attendance-batch-repository';
import { listKelasSiswaByKelasId } from '@/repositories/kelas-siswa-repository';
import {
  appendRow,
  clearWorksheetRow,
  readWorksheetRecords,
} from '@/repositories/sheets-repository';
import { updateTeacherAbsensiBatch } from '@/services/teacher-absensi-batch-service';
import { getAbsensiForPengajar, getKelasForPengajar } from '@/services/teacher-scope-service';

// Scoping is mocked; the three worksheet reads and the single batchUpdate are real.
vi.mock('@/services/teacher-scope-service', () => ({
  getKelasForPengajar: vi.fn(),
  getAbsensiForPengajar: vi.fn(),
}));
vi.mock('@/repositories/kelas-siswa-repository', () => ({
  listKelasSiswaByKelasId: vi.fn(),
}));

const integrationEnabled = process.env.RUN_SHEETS_INTEGRATION === '1';
const TOUCHED_SHEETS = ['absensi', 'absensi_detail', 'audit_log'];
const MARKER = 'TEST-BATCH';
const OP = '22222222-3333-4444-8555-666666666666';
const TS = '2026-11-28T10:00:00';
const USER = 'USR-9001';
const KELAS = 'KLS-9001';
const ABS = 'ABS-9001';
const DETAIL_1 = 'ABD-9001';
const DETAIL_2 = 'ABD-9002';
const createdIds = new Map();
let batchSpy;

const absensiRow = {
  absensi_id: ABS, kelas_id: KELAS, jadwal_id: 'JDL-9001',
  tanggal: '2026-11-28', jam_mulai: '08:00', jam_selesai: '10:00',
  topik: 'Topik awal', status_absensi: 'final', created_by: MARKER,
  created_at: TS, updated_at: '2026-11-28T09:00:00',
};
const detailRow = (id, siswaId, status) => ({
  absensi_detail_id: id, absensi_id: ABS, siswa_id: siswaId,
  status_kehadiran: status, catatan: MARKER, updated_by: MARKER,
  updated_at: '2026-11-28T09:00:00',
});
const input = {
  userId: USER, kelasId: KELAS, absensiId: ABS, operationId: OP,
  operationTimestamp: TS, topik: 'Topik baru',
  details: [
    { absensiDetailId: DETAIL_1, statusKehadiran: 'hadir', catatan: MARKER },
    { absensiDetailId: DETAIL_2, statusKehadiran: 'sakit', catatan: MARKER },
  ],
};

function remember(tableName, id) {
  if (!createdIds.has(tableName)) {
    createdIds.set(tableName, new Set());
  }
  createdIds.get(tableName).add(id);
}

function isTestRow(tableName, record) {
  const idColumn = WORKSHEET_SCHEMAS[tableName][0];
  if (createdIds.get(tableName)?.has(record[idColumn])) {
    return true;
  }
  return Object.values(record).some(
    (value) =>
      String(value).includes(MARKER) || String(value).includes('9001'),
  );
}

async function snapshot() {
  const states = await readStates();
  return Object.fromEntries(
    Object.entries(states).map(([key, value]) => [
      key,
      value.records.map((item) => ({ rowNumber: item.rowNumber, values: item.values })),
    ]),
  );
}

beforeAll(async () => {
  if (!integrationEnabled) {
    return;
  }

  for (const tableName of TOUCHED_SHEETS) {
    const { records } = await readWorksheetRecords(
      tableName,
      WORKSHEET_SCHEMAS[tableName],
    );
    if (records.length > 0) {
      throw new Error(
        `Refusing integration test: ${tableName} already contains data`,
      );
    }
  }

  const sheets = getGoogleSheetsClient();
  batchSpy = vi.spyOn(sheets.spreadsheets.values, 'batchUpdate');

  const rows = [
    ['absensi', absensiRow],
    ['absensi_detail', detailRow(DETAIL_1, 'SIS-9001', 'alfa')],
    ['absensi_detail', detailRow(DETAIL_2, 'SIS-9002', 'izin')],
  ];
  for (const [tableName, record] of rows) {
    const values = WORKSHEET_SCHEMAS[tableName].map((column) => record[column] ?? '');
    await appendRow(`${tableName}!A1`, values);
    remember(tableName, record[WORKSHEET_SCHEMAS[tableName][0]]);
  }

  getKelasForPengajar.mockResolvedValue({ status: 'ok', data: {} });
  getAbsensiForPengajar.mockResolvedValue({ status: 'ok', data: absensiRow });
  listKelasSiswaByKelasId.mockResolvedValue([
    { siswa_id: 'SIS-9001', status_keanggotaan: 'aktif' },
    { siswa_id: 'SIS-9002', status_keanggotaan: 'aktif' },
  ]);
}, 30000);

beforeEach(() => {
  batchSpy?.mockClear();
});

afterAll(async () => {
  if (!integrationEnabled) {
    return;
  }

  for (const tableName of [...TOUCHED_SHEETS].reverse()) {
    const { header, records } = await readWorksheetRecords(
      tableName,
      WORKSHEET_SCHEMAS[tableName],
    );
    for (const { rowNumber, record } of records) {
      if (!isTestRow(tableName, record)) {
        throw new Error(`Refusing to clear non-test row ${rowNumber} from ${tableName}`);
      }
    }
    for (const { rowNumber } of records) {
      await clearWorksheetRow(tableName, rowNumber, header.length);
    }
    const after = await readWorksheetRecords(tableName, WORKSHEET_SCHEMAS[tableName]);
    if (after.records.length !== 0) {
      throw new Error(`Cleanup failed for ${tableName}`);
    }
  }
}, 30000);

describe.skipIf(!integrationEnabled)('Google Sheets attendance batch', () => {
  it('verifies the three worksheet headers before any write', async () => {
    const states = await readStates();

    expect(states.absensi.header).toEqual(WORKSHEET_SCHEMAS.absensi);
    expect(states.detail.header).toEqual(WORKSHEET_SCHEMAS.absensi_detail);
    expect(states.audit.header).toEqual(WORKSHEET_SCHEMAS.audit_log);
    expect(batchSpy).not.toHaveBeenCalled();
  });

  it('rejects invalid input without changing any worksheet', async () => {
    const before = await snapshot();

    const result = await updateTeacherAbsensiBatch({
      ...input,
      operationTimestamp: 'invalid',
    });

    expect(result.status).toBe('invalid');
    expect(batchSpy).not.toHaveBeenCalled();
    expect(await snapshot()).toEqual(before);
  });

  it('writes data and audit rows in one batch and verifies read-back', async () => {
    const result = await updateTeacherAbsensiBatch(input);

    expect(result.status).toBe('ok');
    expect(batchSpy).toHaveBeenCalledTimes(1);
    const request = batchSpy.mock.calls[0][0];
    expect(request.requestBody.valueInputOption).toBe('RAW');
    expect(request.requestBody.data).toHaveLength(5);

    const states = await readStates();
    const absensi = states.absensi.recordById.get(ABS)?.record;
    expect(absensi.topik).toBe('Topik baru');
    expect(absensi.updated_at).toBe(TS);
    expect(absensi.kelas_id).toBe(KELAS);
    expect(absensi.created_by).toBe(MARKER);

    const detail1 = states.detail.recordById.get(DETAIL_1)?.record;
    expect(detail1.status_kehadiran).toBe('hadir');
    expect(detail1.updated_at).toBe(TS);
    expect(detail1.absensi_id).toBe(ABS);

    const byKey = new Map(
      states.audit.records.map((item) => [item.record.idempotency_key, item.record]),
    );
    const absensiAudit = byKey.get(`${OP}:absensi:${ABS}`);
    expect(absensiAudit).toBeDefined();
    expect(absensiAudit.user_id).toBe(USER);
    expect(absensiAudit.created_at).toBe(TS);
    expect(JSON.parse(absensiAudit.data_sesudah).topik).toBe('Topik baru');
    expect(byKey.get(`${OP}:detail:${DETAIL_1}`)).toBeDefined();
    expect(byKey.get(`${OP}:detail:${DETAIL_2}`)).toBeDefined();
    for (const auditId of Object.values(result.data.auditIds)) {
      remember('audit_log', auditId);
    }
  });

  it('returns already_applied on a repeated operation without a second write', async () => {
    const callsBefore = batchSpy.mock.calls.length;

    const result = await updateTeacherAbsensiBatch(input);

    expect(result.status).toBe('already_applied');
    expect(batchSpy.mock.calls.length).toBe(callsBefore);
  });
});
