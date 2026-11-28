import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ConflictError,
  SheetHeaderError,
  ValidationError,
} from '@/lib/data-errors';
import { changedFields } from '@/lib/repository-helpers';
import { WORKSHEET_SCHEMAS } from '@/lib/sheet-schema';
import {
  assertSameAuditTail,
  assertSameRows,
  buildBatchRequest,
  buildRange,
  commitAttendanceBatch,
  readBatchState,
  readStates,
  rowValues,
  withAttendanceBatchLock,
} from '@/repositories/attendance-batch-repository';
import {
  assertWorksheetHeader,
  readWorksheetRecords,
  updateRanges,
} from '@/repositories/sheets-repository';

vi.mock('@/repositories/sheets-repository', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    updateRanges: vi.fn(),
    assertWorksheetHeader: vi.fn(),
    readWorksheetRecords: vi.fn(),
  };
});

const OP = '11111111-2222-4333-8444-555555555555';
const TS = '2026-11-28T10:00:00';
const USER = 'USR-0002';
const ABSENSI = 'ABS-0001';

function wrap(table, rowNumber, overrides) {
  const header = WORKSHEET_SCHEMAS[table];
  const record = Object.fromEntries(header.map((column) => [column, '']));
  const merged = { ...record, ...overrides };
  return { rowNumber, record: merged, values: rowValues(header, merged) };
}

function state(table, records) {
  const header = WORKSHEET_SCHEMAS[table];
  return {
    header,
    records,
    maxRowNumber: records.reduce((max, item) => Math.max(max, item.rowNumber), 0),
    recordById: new Map(
      records.map((item) => [
        item.record[header[0]],
        { ...item, values: rowValues(header, item.record) },
      ]),
    ),
  };
}

const beforeAbsensi = {
  absensi_id: ABSENSI,
  kelas_id: 'KLS-0001',
  jadwal_id: 'JDL-0001',
  tanggal: '2026-11-28',
  jam_mulai: '08:00',
  jam_selesai: '10:00',
  topik: 'Topik lama',
  status_absensi: 'final',
  created_by: USER,
  created_at: '2026-11-28T09:00:00',
  updated_at: '2026-11-28T09:00:00',
};

const beforeDetail = {
  absensi_detail_id: 'ABD-0001',
  absensi_id: ABSENSI,
  siswa_id: 'SIS-0001',
  status_kehadiran: 'alfa',
  catatan: '',
  updated_by: USER,
  updated_at: '2026-11-28T09:00:00',
};

function requestArgs(overrides = {}) {
  const nextAbsensi = { ...beforeAbsensi, topik: 'Topik baru', updated_at: TS };
  const nextDetail = {
    ...beforeDetail,
    status_kehadiran: 'hadir',
    updated_at: TS,
  };
  const detailEntries = [{ absensiDetailId: 'ABD-0001', before: beforeDetail }];
  const nextDetails = [
    {
      ...detailEntries[0],
      next: nextDetail,
      changed: changedFields(beforeDetail, nextDetail),
    },
  ];
  return {
    baseline: {
      absensi: state('absensi', [wrap('absensi', 2, beforeAbsensi)]),
      detail: state('absensi_detail', [
        wrap('absensi_detail', 4, beforeDetail),
      ]),
      audit: state('audit_log', []),
    },
    operationId: OP,
    operationTimestamp: TS,
    absensiId: ABSENSI,
    userId: USER,
    beforeAbsensi,
    nextAbsensi,
    detailEntries,
    nextDetails,
    changedAbsensi: changedFields(beforeAbsensi, nextAbsensi),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  updateRanges.mockResolvedValue({ updatedRows: 3 });
  assertWorksheetHeader.mockResolvedValue(WORKSHEET_SCHEMAS.absensi);
  readWorksheetRecords.mockResolvedValue({
    header: WORKSHEET_SCHEMAS.absensi,
    records: [wrap('absensi', 2, beforeAbsensi)],
  });
});

describe('attendance-batch-repository', () => {
  it('sends data and audit ranges through one updateRanges call', async () => {
    const payload = {
      operationId: OP,
      operationTimestamp: TS,
      dataRanges: [{ range: 'absensi!A2:K2', values: ['a'] }],
      auditEntries: [
        { range: 'audit_log!A2:J2', values: ['b'] },
        { range: 'audit_log!A3:J3', values: ['c'] },
      ],
    };

    const response = await commitAttendanceBatch(payload);

    expect(updateRanges).toHaveBeenCalledTimes(1);
    expect(updateRanges).toHaveBeenCalledWith([
      { range: 'absensi!A2:K2', values: ['a'] },
      { range: 'audit_log!A2:J2', values: ['b'] },
      { range: 'audit_log!A3:J3', values: ['c'] },
    ]);
    expect(response).toEqual({ updatedRows: 3 });
  });

  it('rejects an empty range list without writing', async () => {
    await expect(
      commitAttendanceBatch({
        operationId: OP,
        operationTimestamp: TS,
        dataRanges: [],
        auditEntries: [{ range: 'audit_log!A2:J2', values: [] }],
      }),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(updateRanges).not.toHaveBeenCalled();
  });

  it('serializes concurrent tasks with one shared lock', async () => {
    let active = 0;
    let maxActive = 0;
    const task = async () => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await Promise.resolve();
      await Promise.resolve();
      active -= 1;
      return active;
    };

    await Promise.all([
      withAttendanceBatchLock(task),
      withAttendanceBatchLock(task),
      withAttendanceBatchLock(task),
    ]);

    expect(maxActive).toBe(1);
    await expect(
      withAttendanceBatchLock(async () => {
        throw new Error('task failed');
      }),
    ).rejects.toThrow('task failed');
    await expect(withAttendanceBatchLock(async () => 'ok')).resolves.toBe('ok');
  });

  it('maps row numbers from the single worksheet read', async () => {
    const result = await readBatchState({
      table: 'absensi',
      fields: {},
      idColumn: 'absensi_id',
    });

    expect(assertWorksheetHeader).not.toHaveBeenCalled();
    expect(readWorksheetRecords).toHaveBeenCalledTimes(1);
    expect(readWorksheetRecords).toHaveBeenCalledWith(
      'absensi',
      WORKSHEET_SCHEMAS.absensi,
    );
    expect(result.maxRowNumber).toBe(2);
    expect(result.recordById.get(ABSENSI)).toMatchObject({
      rowNumber: 2,
      values: result.records[0].values,
    });
  });

  it('propagates a header mismatch from the row reader', async () => {
    readWorksheetRecords.mockRejectedValueOnce(
      new SheetHeaderError('Worksheet header mismatch: absensi', {
        table: 'absensi',
      }),
    );

    await expect(
      readBatchState({ table: 'absensi', fields: {}, idColumn: 'absensi_id' }),
    ).rejects.toBeInstanceOf(SheetHeaderError);
    expect(assertWorksheetHeader).not.toHaveBeenCalled();
  });

  it('reads each worksheet once per readStates call', async () => {
    readWorksheetRecords.mockResolvedValue({ header: WORKSHEET_SCHEMAS.absensi, records: [] });

    await readStates();

    expect(readWorksheetRecords).toHaveBeenCalledTimes(3);
    expect(assertWorksheetHeader).not.toHaveBeenCalled();
  });

  it('detects duplicate idempotency keys in stored audit rows', async () => {
    assertWorksheetHeader.mockResolvedValue(WORKSHEET_SCHEMAS.audit_log);
    readWorksheetRecords.mockResolvedValue({
      header: WORKSHEET_SCHEMAS.audit_log,
      records: [
        wrap('audit_log', 2, { audit_id: 'AUD-0001', idempotency_key: 'same' }),
        wrap('audit_log', 3, { audit_id: 'AUD-0002', idempotency_key: 'same' }),
      ],
    });

    await expect(
      readBatchState({
        table: 'audit_log',
        fields: {},
        idColumn: 'audit_id',
        uniqueKeys: [['idempotency_key']],
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('maps data rows and audit rows into explicit ranges', () => {
    const request = buildBatchRequest(requestArgs());

    expect(request.payload.dataRanges.map((item) => item.range)).toEqual([
      'absensi!A2:K2',
      'absensi_detail!A4:G4',
    ]);
    expect(request.payload.auditEntries.map((item) => item.range)).toEqual([
      'audit_log!A2:J2',
      'audit_log!A3:J3',
    ]);
    expect(request.payload.auditEntries[0].values[1]).toBe(
      `${OP}:absensi:${ABSENSI}`,
    );
    expect(request.payload.auditEntries[0].values[9]).toBe(TS);
    expect(request.payload.dataRanges[0].values[1]).toBe('KLS-0001');
    expect(request.payload.dataRanges[0].values[8]).toBe(USER);
    expect(request.payload.dataRanges[1].values[1]).toBe(ABSENSI);
  });

  it('keeps supplied audit ids during retry preparation', () => {
    const provided = {
      [`${OP}:absensi:${ABSENSI}`]: 'AUD-0042',
    };
    const request = buildBatchRequest(requestArgs({ auditIds: provided }));

    expect(request.resolvedAuditIds[`${OP}:absensi:${ABSENSI}`]).toBe('AUD-0042');
    expect(request.payload.auditEntries[0].values[0]).toBe('AUD-0042');
  });

  it.each([
    ['null', null],
    ['array', []],
    ['unknown key', { [`${OP}:absensi:ABD-9999`]: 'AUD-0042' }],
    ['bad format', { [`${OP}:absensi:${ABSENSI}`]: 'BAD-0042' }],
    ['duplicate id', {
      [`${OP}:absensi:${ABSENSI}`]: 'AUD-0042',
      [`${OP}:detail:ABD-0001`]: 'AUD-0042',
    }],
  ])('rejects invalid auditIds (%s)', (_label, auditIds) => {
    expect(() => buildBatchRequest(requestArgs({ auditIds }))).toThrow(ValidationError);
    expect(updateRanges).not.toHaveBeenCalled();
  });

  it('builds ranges with the exact header width', () => {
    expect(buildRange('absensi', WORKSHEET_SCHEMAS.absensi, 7)).toBe(
      'absensi!A7:K7',
    );
    expect(buildRange('audit_log', WORKSHEET_SCHEMAS.audit_log, 12)).toBe(
      'audit_log!A12:J12',
    );
  });

  it('detects row and audit-tail changes before batch is sent', () => {
    const baseline = state('absensi', [wrap('absensi', 2, beforeAbsensi)]);
    const changed = state('absensi', [
      wrap('absensi', 2, { ...beforeAbsensi, topik: 'Admin edit' }),
    ]);

    expect(() => assertSameRows(baseline, baseline, [ABSENSI])).not.toThrow();
    expect(() => assertSameRows(baseline, changed, [ABSENSI])).toThrow(
      ConflictError,
    );

    const auditBaseline = state('audit_log', [
      wrap('audit_log', 2, { audit_id: 'AUD-0001', idempotency_key: 'k1' }),
    ]);
    const auditChanged = state('audit_log', [
      wrap('audit_log', 2, { audit_id: 'AUD-0001', idempotency_key: 'k1' }),
      wrap('audit_log', 3, { audit_id: 'AUD-0002', idempotency_key: 'k2' }),
    ]);

    expect(() => assertSameAuditTail(auditBaseline, auditBaseline)).not.toThrow();
    expect(() => assertSameAuditTail(auditBaseline, auditChanged)).toThrow(
      ConflictError,
    );
  });
});
