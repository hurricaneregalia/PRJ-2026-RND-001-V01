import { beforeEach, describe, expect, it, vi } from 'vitest';

import { auth } from '@/auth';
import { SheetHeaderError, SheetOperationError, ValidationError } from '@/lib/data-errors';
import { changedFields } from '@/lib/repository-helpers';
import { WORKSHEET_SCHEMAS } from '@/lib/sheet-schema';
import { commitAttendanceBatch, readStates, rowValues, withAttendanceBatchLock } from '@/repositories/attendance-batch-repository';
import { listKelasSiswaByKelasId } from '@/repositories/kelas-siswa-repository';
import { getAbsensiForPengajar, getKelasForPengajar } from '@/services/teacher-scope-service';
import { updateTeacherAbsensiBatch } from '@/services/teacher-absensi-batch-service';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('@/repositories/attendance-batch-repository', async (importOriginal) => ({
  ...(await importOriginal()),
  readStates: vi.fn(),
  commitAttendanceBatch: vi.fn(),
  withAttendanceBatchLock: vi.fn((task) => task()),
}));
vi.mock('@/repositories/kelas-siswa-repository', () => ({
  listKelasSiswaByKelasId: vi.fn(),
}));
vi.mock('@/services/teacher-scope-service', () => ({
  getKelasForPengajar: vi.fn(),
  getAbsensiForPengajar: vi.fn(),
}));

const OP = '11111111-2222-4333-8444-555555555555';
const TS = '2026-11-28T10:00:00';
const USER = 'USR-0002';
const KELAS = 'KLS-0001';
const ABSENSI = 'ABS-0001';
const KEY_ABSENSI = `${OP}:absensi:${ABSENSI}`;
const KEY_DETAIL_1 = `${OP}:detail:ABD-0001`;
const KEY_DETAIL_2 = `${OP}:detail:ABD-0002`;
const VALID_SESSION = {
  user: { id: USER, role: 'Pengajar', accountStatus: 'active', bootstrapPending: false },
};

function wrap(table, rowNumber, overrides) {
  const header = WORKSHEET_SCHEMAS[table];
  const record = { ...Object.fromEntries(header.map((column) => [column, ''])), ...overrides };
  return { rowNumber, record, values: rowValues(header, record) };
}

function state(table, records) {
  const header = WORKSHEET_SCHEMAS[table];
  const byId = new Map(records.map((item) => [
    item.record[header[0]], { ...item, values: rowValues(header, item.record) },
  ]));
  return {
    header, records, recordById: byId,
    maxRowNumber: records.reduce((max, item) => Math.max(max, item.rowNumber), 0),
  };
}

const absensiBefore = {
  absensi_id: ABSENSI, kelas_id: KELAS, jadwal_id: 'JDL-0001', tanggal: '2026-11-28',
  jam_mulai: '08:00', jam_selesai: '10:00', topik: 'Topik lama', status_absensi: 'final',
  created_by: USER, created_at: '2026-11-28T09:00:00', updated_at: '2026-11-28T09:00:00',
};
const absensiNext = { ...absensiBefore, topik: 'Topik baru', updated_at: TS };
const detailBefore1 = {
  absensi_detail_id: 'ABD-0001', absensi_id: ABSENSI, siswa_id: 'SIS-0001',
  status_kehadiran: 'alfa', catatan: '', updated_by: USER, updated_at: '2026-11-28T09:00:00',
};
const detailBefore2 = {
  ...detailBefore1, absensi_detail_id: 'ABD-0002', siswa_id: 'SIS-0002',
  status_kehadiran: 'izin',
};
const detailNext1 = { ...detailBefore1, status_kehadiran: 'hadir', updated_at: TS };
const detailNext2 = { ...detailBefore2, status_kehadiran: 'sakit', updated_at: TS };

function auditRow({ auditId, key, tableName, recordId, before, after, createdAt = TS }) {
  const changed = changedFields(before, after);
  const payload = (side) => Object.fromEntries(Object.entries(changed).map(([field, values]) => [field, values[side]]));
  return {
    audit_id: auditId, idempotency_key: key, user_id: USER, aksi: 'update',
    nama_tabel: tableName, record_id: recordId,
    data_sebelum: JSON.stringify(payload('before')), data_sesudah: JSON.stringify(payload('after')),
    keterangan: 'Perubahan absensi pengajar [attendance-batch]', created_at: createdAt,
  };
}

const audits = [
  auditRow({ auditId: 'AUD-0001', key: KEY_ABSENSI, tableName: 'absensi', recordId: ABSENSI, before: absensiBefore, after: absensiNext }),
  auditRow({ auditId: 'AUD-0002', key: KEY_DETAIL_1, tableName: 'absensi_detail', recordId: 'ABD-0001', before: detailBefore1, after: detailNext1 }),
  auditRow({ auditId: 'AUD-0003', key: KEY_DETAIL_2, tableName: 'absensi_detail', recordId: 'ABD-0002', before: detailBefore2, after: detailNext2 }),
];

function baselineStates() {
  const detail = [wrap('absensi_detail', 2, detailBefore1), wrap('absensi_detail', 3, detailBefore2)];
  return {
    absensi: state('absensi', [wrap('absensi', 2, absensiBefore)]),
    detail: state('absensi_detail', detail), audit: state('audit_log', []),
  };
}

function appliedStates({ absensi = absensiNext, detail1 = detailNext1, detail2 = detailNext2, auditRows = audits } = {}) {
  const detail = [wrap('absensi_detail', 2, detail1), wrap('absensi_detail', 3, detail2)];
  return {
    absensi: state('absensi', [wrap('absensi', 2, absensi)]),
    detail: state('absensi_detail', detail),
    audit: state('audit_log', auditRows.map((row, index) => wrap('audit_log', index + 2, row))),
  };
}

const input = {
  userId: USER, kelasId: KELAS, absensiId: ABSENSI, operationId: OP,
  operationTimestamp: TS, topik: 'Topik baru',
  details: [
    { absensiDetailId: 'ABD-0001', statusKehadiran: 'hadir', catatan: '' },
    { absensiDetailId: 'ABD-0002', statusKehadiran: 'sakit', catatan: '' },
  ],
};
const noChangeInput = {
  ...input,
  topik: absensiBefore.topik,
  operationTimestamp: absensiBefore.updated_at,
  details: [{ absensiDetailId: 'ABD-0001', statusKehadiran: 'alfa', catatan: '' }],
};

beforeEach(() => {
  vi.clearAllMocks();
  readStates.mockReset();
  commitAttendanceBatch.mockReset();
  withAttendanceBatchLock.mockImplementation((task) => task());
  auth.mockResolvedValue(VALID_SESSION);
  commitAttendanceBatch.mockResolvedValue({});
  readStates.mockResolvedValue(baselineStates());
  getKelasForPengajar.mockResolvedValue({ status: 'ok', data: {} });
  getAbsensiForPengajar.mockResolvedValue({ status: 'ok', data: absensiBefore });
  listKelasSiswaByKelasId.mockResolvedValue([
    { siswa_id: 'SIS-0001', status_keanggotaan: 'aktif' },
    { siswa_id: 'SIS-0002', status_keanggotaan: 'aktif' },
  ]);
});

describe('teacher-absensi-batch-service', () => {
  it('commits one batch with absensi, details, and audit rows', async () => {
    readStates
      .mockResolvedValueOnce(baselineStates())
      .mockResolvedValueOnce(baselineStates())
      .mockResolvedValueOnce(appliedStates());

    const result = await updateTeacherAbsensiBatch(input);

    expect(result.status).toBe('ok');
    expect(commitAttendanceBatch).toHaveBeenCalledTimes(1);
    const payload = commitAttendanceBatch.mock.calls[0][0];
    expect(payload.operationId).toBe(OP);
    expect(payload.operationTimestamp).toBe(TS);
    expect(payload.dataRanges.map((item) => item.range)).toEqual([
      'absensi!A2:K2', 'absensi_detail!A2:G2', 'absensi_detail!A3:G3',
    ]);
    expect(payload.auditEntries.map((item) => item.range)).toEqual([
      'audit_log!A2:J2', 'audit_log!A3:J3', 'audit_log!A4:J4',
    ]);
    expect(payload.dataRanges[0].values[1]).toBe(KELAS);
    expect(payload.dataRanges[0].values[8]).toBe(USER);
    expect(payload.dataRanges[1].values[1]).toBe(ABSENSI);
    expect(payload.dataRanges[1].values[2]).toBe('SIS-0001');
    expect(result.data.auditIds).toEqual({
      [KEY_ABSENSI]: 'AUD-0001',
      [KEY_DETAIL_1]: 'AUD-0002',
      [KEY_DETAIL_2]: 'AUD-0003',
    });
  });

  it.each([
    ['invalid operation id', { operationId: 'not-a-uuid' }, 'invalid', 'operationId'],
    ['invalid timestamp', { operationTimestamp: '28-11-2026' }, 'invalid', 'operationTimestamp'],
    ['other teacher class', null, 'forbidden', undefined, () => getKelasForPengajar.mockResolvedValue({ status: 'forbidden' })],
    ['inactive class', null, 'forbidden', undefined, () => getKelasForPengajar.mockResolvedValue({ status: 'forbidden' })],
    ['absensi from other class', null, 'forbidden', undefined, () => getAbsensiForPengajar.mockResolvedValue({ status: 'forbidden' })],
    ['non-final absensi', null, 'forbidden', undefined, () => getAbsensiForPengajar.mockResolvedValue({ status: 'ok', data: { ...absensiBefore, status_absensi: 'draft' } })],
    ['unknown detail id', { details: [{ absensiDetailId: 'ABD-9999', statusKehadiran: 'hadir' }] }, 'invalid', 'absensiDetailId'],
    ['invalid status', { details: [{ absensiDetailId: 'ABD-0001', statusKehadiran: 'unknown' }] }, 'invalid', 'status_kehadiran'],
    ['oversized topic', { topik: 'x'.repeat(501) }, 'invalid', 'topik'],
    ['oversized note', { details: [{ absensiDetailId: 'ABD-0001', statusKehadiran: 'hadir', catatan: 'y'.repeat(501) }] }, 'invalid', 'catatan'],
  ])('rejects %s without writing', async (_label, patch, expectedStatus, expectedField, arrange) => {
    arrange?.();
    const result = await updateTeacherAbsensiBatch({ ...input, ...(patch ?? {}) });

    expect(result.status).toBe(expectedStatus);
    if (expectedField) expect(result.data.field).toBe(expectedField);
    expect(commitAttendanceBatch).not.toHaveBeenCalled();
  });

  it('rejects inactive class membership without writing', async () => {
    listKelasSiswaByKelasId.mockResolvedValue([
      { siswa_id: 'SIS-0001', status_keanggotaan: 'nonaktif' },
      { siswa_id: 'SIS-0002', status_keanggotaan: 'aktif' },
    ]);

    const result = await updateTeacherAbsensiBatch(input);

    expect(result.status).toBe('invalid');
    expect(result.data.field).toBe('siswa_id');
    expect(commitAttendanceBatch).not.toHaveBeenCalled();
  });

  it.each([
    ['no session', null],
    ['missing id', { user: { ...VALID_SESSION.user, id: '' } }],
    ['non-Pengajar', { user: { ...VALID_SESSION.user, role: 'Admin' } }],
    ['inactive account', { user: { ...VALID_SESSION.user, accountStatus: 'nonaktif' } }],
    ['bootstrap pending', { user: { ...VALID_SESSION.user, bootstrapPending: true } }],
  ])('rejects %s before any read or write', async (_label, session) => {
    auth.mockResolvedValue(session);

    const result = await updateTeacherAbsensiBatch(input);

    expect(result.status).toBe('forbidden');
    expect(readStates).not.toHaveBeenCalled();
    expect(commitAttendanceBatch).not.toHaveBeenCalled();
  });

  it('ignores userId supplied by the caller', async () => {
    readStates
      .mockResolvedValueOnce(baselineStates())
      .mockResolvedValueOnce(baselineStates())
      .mockResolvedValueOnce(appliedStates());

    const result = await updateTeacherAbsensiBatch({ ...input, userId: 'USR-9999' });

    expect(result.status).toBe('ok');
    expect(getKelasForPengajar).toHaveBeenCalledWith(USER, KELAS, { requireActive: true });
    expect(commitAttendanceBatch.mock.calls[0][0].dataRanges[1].values[5]).toBe(USER);
  });

  it('reports no-change as ok without already_applied evidence', async () => {
    const result = await updateTeacherAbsensiBatch(noChangeInput);

    expect(result.status).toBe('ok');
    expect(result.data.unchanged).toBe(true);
    expect(result.data.reason).toBe('no_changes_requested');
    expect(commitAttendanceBatch).not.toHaveBeenCalled();
  });

  it('returns already_applied only when audit and data match', async () => {
    readStates.mockResolvedValue(appliedStates());
    const result = await updateTeacherAbsensiBatch(input);

    expect(result.status).toBe('already_applied');
    expect(commitAttendanceBatch).not.toHaveBeenCalled();
  });

  it('keeps supplied audit ids on a repeated already_applied call', async () => {
    readStates.mockResolvedValue(appliedStates());

    const result = await updateTeacherAbsensiBatch({
      ...input,
      auditIds: {
        [KEY_ABSENSI]: 'AUD-0001',
        [KEY_DETAIL_1]: 'AUD-0002',
        [KEY_DETAIL_2]: 'AUD-0003',
      },
    });

    expect(result.status).toBe('already_applied');
    expect(result.data.auditIds[KEY_ABSENSI]).toBe('AUD-0001');
    expect(commitAttendanceBatch).not.toHaveBeenCalled();
  });

  it.each([
    ['null', null],
    ['array', []],
    ['unknown key', { [`${OP}:absensi:ABD-0001`]: 'AUD-0001' }],
    ['bad format', { [KEY_ABSENSI]: 'BAD-0001' }],
    ['duplicate id', { [KEY_ABSENSI]: 'AUD-0001', [KEY_DETAIL_1]: 'AUD-0001' }],
  ])('rejects invalid auditIds (%s) without writing', async (_label, auditIds) => {
    const result = await updateTeacherAbsensiBatch({ ...input, auditIds });

    expect(result.status).toBe('invalid');
    expect(result.data.field).toMatch(/^audit/);
    expect(commitAttendanceBatch).not.toHaveBeenCalled();
  });

  it('returns conflict for a partial audit', async () => {
    readStates.mockResolvedValue(appliedStates({ auditRows: audits.slice(0, 2) }));
    const result = await updateTeacherAbsensiBatch(input);

    expect(result.status).toBe('conflict');
    expect(result.data.status).toBe('partial');
    expect(commitAttendanceBatch).not.toHaveBeenCalled();
  });

  it('returns conflict when audit exists but data does not match', async () => {
    readStates.mockResolvedValue(appliedStates({ absensi: { ...absensiNext, topik: 'Admin edit' } }));
    const result = await updateTeacherAbsensiBatch(input);

    expect(result.status).toBe('conflict');
    expect(result.data.reason).toBe('audit_state_invalid');
    expect(commitAttendanceBatch).not.toHaveBeenCalled();
  });

  it('returns conflict when data_sesudah differs from the expected value', async () => {
    const forged = auditRow({
      auditId: 'AUD-0001', key: KEY_ABSENSI, tableName: 'absensi', recordId: ABSENSI,
      before: absensiBefore, after: { ...absensiNext, topik: 'Tulisan lain' },
    });
    readStates.mockResolvedValue(appliedStates({ auditRows: [forged, ...audits.slice(1)] }));

    const result = await updateTeacherAbsensiBatch(input);

    expect(result.status).toBe('conflict');
    expect(result.data.diffs.join(' ')).toContain(`${KEY_ABSENSI}:after:topik`);
    expect(commitAttendanceBatch).not.toHaveBeenCalled();
  });

  it('treats matching data without audit as a no-op', async () => {
    readStates.mockResolvedValue(appliedStates({ auditRows: [] }));
    const result = await updateTeacherAbsensiBatch(input);

    expect(result.status).toBe('ok');
    expect(result.data.unchanged).toBe(true);
    expect(result.data.reason).toBe('no_changes_requested');
    expect(commitAttendanceBatch).not.toHaveBeenCalled();
  });

  it('cancels before writing when guard detects an Admin change', async () => {
    readStates
      .mockResolvedValueOnce(baselineStates())
      .mockResolvedValueOnce(appliedStates({ absensi: { ...absensiBefore, topik: 'Admin edit' } }));
    const result = await updateTeacherAbsensiBatch(input);

    expect(result.status).toBe('conflict');
    expect(commitAttendanceBatch).not.toHaveBeenCalled();
  });

  it('propagates a header error without calling the batch', async () => {
    readStates.mockRejectedValueOnce(new SheetHeaderError('Worksheet header mismatch: absensi', { table: 'absensi' }));

    await expect(updateTeacherAbsensiBatch(input)).rejects.toBeInstanceOf(SheetHeaderError);
    expect(commitAttendanceBatch).not.toHaveBeenCalled();
  });

  it('retries with identical payload after a sheet operation error', async () => {
    readStates
      .mockResolvedValueOnce(baselineStates())
      .mockResolvedValueOnce(baselineStates())
      .mockResolvedValueOnce(baselineStates())
      .mockResolvedValueOnce(appliedStates());
    commitAttendanceBatch
      .mockRejectedValueOnce(new SheetOperationError('Google Sheets batch update failed'))
      .mockResolvedValueOnce({});

    const result = await updateTeacherAbsensiBatch(input);

    expect(result.status).toBe('ok');
    expect(commitAttendanceBatch).toHaveBeenCalledTimes(2);
    expect(commitAttendanceBatch.mock.calls[0][0]).toEqual(commitAttendanceBatch.mock.calls[1][0]);
    expect(result.data.auditIds[KEY_ABSENSI]).toBe('AUD-0001');
  });

  it('retries at most once', async () => {
    readStates.mockResolvedValue(baselineStates());
    commitAttendanceBatch.mockRejectedValue(new SheetOperationError('Google Sheets batch update failed'));

    await expect(updateTeacherAbsensiBatch(input)).rejects.toBeInstanceOf(SheetOperationError);
    expect(commitAttendanceBatch).toHaveBeenCalledTimes(2);
    expect(readStates).toHaveBeenCalledTimes(3);
  });

  it('does not retry deterministic commit errors', async () => {
    commitAttendanceBatch.mockRejectedValueOnce(new ValidationError('bad payload'));

    await expect(updateTeacherAbsensiBatch(input)).rejects.toBeInstanceOf(ValidationError);
    expect(commitAttendanceBatch).toHaveBeenCalledTimes(1);
    expect(readStates).toHaveBeenCalledTimes(2);
  });

  it('does not retry when read-back finds a complete applied operation', async () => {
    readStates
      .mockResolvedValueOnce(baselineStates())
      .mockResolvedValueOnce(baselineStates())
      .mockResolvedValueOnce(appliedStates());
    commitAttendanceBatch.mockRejectedValueOnce(new SheetOperationError('Google Sheets batch update failed'));

    const result = await updateTeacherAbsensiBatch(input);

    expect(result.status).toBe('already_applied');
    expect(commitAttendanceBatch).toHaveBeenCalledTimes(1);
  });

  it('reports read-back mismatch without correcting data', async () => {
    readStates
      .mockResolvedValueOnce(baselineStates())
      .mockResolvedValueOnce(baselineStates())
      .mockResolvedValueOnce(appliedStates({ auditRows: [] }));
    const result = await updateTeacherAbsensiBatch(input);

    expect(result.status).toBe('conflict');
    expect(result.data.reason).toBe('readback_mismatch');
    expect(commitAttendanceBatch).toHaveBeenCalledTimes(1);
  });
});
