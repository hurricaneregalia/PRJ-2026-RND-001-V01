import { ConflictError } from '@/lib/data-errors';

export function sameValue(left, right) {
  return String(left ?? '') === String(right ?? '');
}

export function findDuplicate(records, candidate, uniqueKeys, idColumn) {
  for (const fields of uniqueKeys ?? []) {
    if (fields.every((field) => String(candidate?.[field] ?? '').trim() === '')) {
      continue;
    }

    const duplicate = records.find(
      (record) =>
        record?.[idColumn] !== candidate?.[idColumn] &&
        fields.every((field) => sameValue(record?.[field], candidate?.[field])),
    );

    if (duplicate) {
      return { duplicate, fields };
    }
  }

  return null;
}

export function assertNoDuplicate(records, candidate, uniqueKeys, idColumn) {
  const match = findDuplicate(records, candidate, uniqueKeys, idColumn);

  if (match) {
    throw new ConflictError(
      `Duplicate value for ${match.fields.join(' + ')}`,
      { details: { fields: match.fields } },
    );
  }
}

export function changedFields(before, after) {
  const fields = new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]);
  const changed = {};

  for (const field of fields) {
    if (!sameValue(before?.[field], after?.[field])) {
      changed[field] = {
        before: before?.[field] ?? '',
        after: after?.[field] ?? '',
      };
    }
  }

  return changed;
}
