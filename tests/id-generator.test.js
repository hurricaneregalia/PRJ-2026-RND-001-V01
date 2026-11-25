import { describe, expect, it } from 'vitest';

import {
  assertIdAvailable,
  assertRecordId,
  formatRecordId,
  nextRecordId,
} from '@/lib/id-generator';
import { ConflictError, ValidationError } from '@/lib/data-errors';

describe('id generator', () => {
  it('formats and increments IDs without gaps', () => {
    expect(formatRecordId('SIS', 1)).toBe('SIS-0001');
    expect(formatRecordId('SIS', 42)).toBe('SIS-0042');
    expect(
      nextRecordId(
        'SIS',
        [{ siswa_id: 'SIS-0001' }, { siswa_id: 'SIS-0007' }, { siswa_id: 'SIS-0003' }],
        'siswa_id',
      ),
    ).toBe('SIS-0008');
  });

  it('rejects invalid IDs and duplicate IDs', () => {
    expect(() => assertRecordId('SIS-1', 'SIS')).toThrow(ValidationError);
    expect(() => formatRecordId('SIS', 10000)).toThrow(ValidationError);
    expect(() =>
      assertIdAvailable('SIS-0001', [{ siswa_id: 'SIS-0001' }], 'siswa_id'),
    ).toThrow(ConflictError);
  });
});
