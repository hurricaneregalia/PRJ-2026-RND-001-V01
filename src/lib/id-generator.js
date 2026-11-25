import { ConflictError, ValidationError } from '@/lib/data-errors';

const ID_PATTERN = /^([A-Z]{3})-(\d{4})$/;

export function formatRecordId(prefix, sequence) {
  if (!/^[A-Z]{3}$/.test(prefix)) {
    throw new ValidationError('ID prefix must contain exactly 3 uppercase letters', {
      field: 'prefix',
    });
  }

  if (!Number.isInteger(sequence) || sequence < 1 || sequence > 9999) {
    throw new ValidationError('ID sequence must be an integer between 1 and 9999', {
      field: 'sequence',
    });
  }

  return `${prefix}-${String(sequence).padStart(4, '0')}`;
}

export function parseRecordId(recordId) {
  const match = String(recordId ?? '').trim().match(ID_PATTERN);

  if (!match) {
    return null;
  }

  return {
    prefix: match[1],
    sequence: Number(match[2]),
  };
}

export function assertRecordId(recordId, prefix, field = 'id') {
  const parsed = parseRecordId(recordId);

  if (!parsed || parsed.prefix !== prefix) {
    throw new ValidationError(`Invalid ${field}; expected format ${prefix}-NNNN`, {
      field,
    });
  }

  return String(recordId).trim();
}

export function nextRecordId(prefix, records, idColumn) {
  let highest = 0;

  for (const record of records) {
    const parsed = parseRecordId(record?.[idColumn]);

    if (parsed?.prefix === prefix && parsed.sequence > highest) {
      highest = parsed.sequence;
    }
  }

  if (highest >= 9999) {
    throw new ConflictError(`ID sequence for prefix ${prefix} is exhausted`, {
      field: idColumn,
    });
  }

  return formatRecordId(prefix, highest + 1);
}

export function assertIdAvailable(recordId, records, idColumn) {
  if (records.some((record) => record?.[idColumn] === recordId)) {
    throw new ConflictError(`Duplicate ${idColumn}: ${recordId}`, {
      field: idColumn,
    });
  }
}
