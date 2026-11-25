import { describe, expect, it } from 'vitest';

import { ValidationError } from '@/lib/data-errors';
import { validateFields } from '@/lib/field-validation';

const fields = {
  nama: { type: 'string', required: true, maxLength: 20 },
  tanggal: { type: 'date' },
  status: { type: 'enum', required: true, allowedValues: ['aktif', 'nonaktif'] },
  jumlah: { type: 'integer', min: 0, max: 100 },
};

describe('field validation', () => {
  it('normalizes valid fields and rejects unknown fields', () => {
    expect(
      validateFields(
        { nama: '  Ani  ', tanggal: '2026-02-28', status: 'aktif', jumlah: '3' },
        fields,
      ),
    ).toEqual({
      nama: 'Ani',
      tanggal: '2026-02-28',
      status: 'aktif',
      jumlah: '3',
    });

    expect(() => validateFields({ nama: 'Ani', status: 'aktif', extra: 1 }, fields)).toThrow(
      ValidationError,
    );
  });

  it('rejects invalid dates, enum values, and missing required fields', () => {
    expect(() =>
      validateFields({ nama: 'Ani', status: 'aktif', tanggal: '2026-02-31' }, fields),
    ).toThrow(ValidationError);
    expect(() => validateFields({ nama: 'Ani', status: 'lain' }, fields)).toThrow(
      ValidationError,
    );
    expect(() => validateFields({ status: 'aktif' }, fields)).toThrow(ValidationError);
  });

  it('allows partial updates but still rejects invalid supplied values', () => {
    expect(validateFields({ nama: 'Budi' }, fields, { partial: true })).toEqual({
      nama: 'Budi',
    });
    expect(() =>
      validateFields({ jumlah: '-1' }, fields, { partial: true }),
    ).toThrow(ValidationError);
  });
});
