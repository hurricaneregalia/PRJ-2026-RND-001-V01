import { ValidationError } from '@/lib/data-errors';

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DATE_TIME_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isBlank(value) {
  return value === undefined || value === null || String(value).trim() === '';
}

export function assertPlainObject(value, label = 'input') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ValidationError(`${label} must be an object`);
  }

  return value;
}

function toText(value, field) {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'bigint') {
    return String(value).trim();
  }

  throw new ValidationError(`${field} must be text`, { field });
}

function assertMaxLength(value, field, maxLength) {
  if (value.length > maxLength) {
    throw new ValidationError(`${field} must be at most ${maxLength} characters`, {
      field,
    });
  }

  return value;
}

function assertPattern(value, field, pattern, description) {
  if (!pattern.test(value)) {
    throw new ValidationError(`${field} must be ${description}`, { field });
  }

  return value;
}

export function isValidDate(value) {
  const match = String(value ?? '').match(DATE_PATTERN);

  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function isValidTime(value) {
  return TIME_PATTERN.test(String(value ?? ''));
}

export function isValidDateTime(value) {
  const text = String(value ?? '');
  const match = text.match(DATE_TIME_PATTERN);

  return Boolean(match) && isValidDate(text.slice(0, 10));
}

export function requireString(value, field, { maxLength = 500 } = {}) {
  const text = toText(value, field);

  if (!text) {
    throw new ValidationError(`${field} is required`, { field });
  }

  return assertMaxLength(text, field, maxLength);
}

export function optionalString(value, field, { maxLength = 500 } = {}) {
  if (isBlank(value)) {
    return '';
  }

  return assertMaxLength(toText(value, field), field, maxLength);
}

export function requireEmail(value, field = 'email') {
  return assertPattern(
    requireString(value, field, { maxLength: 320 }).toLowerCase(),
    field,
    EMAIL_PATTERN,
    'a valid email address',
  );
}

export function requireEnum(value, field, allowedValues) {
  const text = requireString(value, field, { maxLength: 100 });

  if (!allowedValues.includes(text)) {
    throw new ValidationError(`${field} must be one of: ${allowedValues.join(', ')}`, {
      field,
    });
  }

  return text;
}

export function optionalEnum(value, field, allowedValues) {
  if (isBlank(value)) {
    return '';
  }

  return requireEnum(value, field, allowedValues);
}

export function requireDate(value, field) {
  const text = requireString(value, field, { maxLength: 10 });

  if (!isValidDate(text)) {
    throw new ValidationError(`${field} must use YYYY-MM-DD`, { field });
  }

  return text;
}

export function optionalDate(value, field) {
  if (isBlank(value)) {
    return '';
  }

  return requireDate(value, field);
}

export function requireTime(value, field) {
  const text = requireString(value, field, { maxLength: 5 });

  if (!isValidTime(text)) {
    throw new ValidationError(`${field} must use HH:mm`, { field });
  }

  return text;
}

export function optionalTime(value, field) {
  if (isBlank(value)) {
    return '';
  }

  return requireTime(value, field);
}

export function requireDateTime(value, field) {
  const text = requireString(value, field, { maxLength: 19 });

  if (!isValidDateTime(text)) {
    throw new ValidationError(`${field} must use YYYY-MM-DDTHH:mm:ss`, { field });
  }

  return text;
}

export function optionalDateTime(value, field) {
  if (isBlank(value)) {
    return '';
  }

  return requireDateTime(value, field);
}

export function requireInteger(value, field, { min = 0, max = 1_000_000 } = {}) {
  const text = isBlank(value) ? '' : toText(value, field);
  const number = Number(text);

  if (!text || !Number.isInteger(number) || number < min || number > max) {
    throw new ValidationError(`${field} must be an integer between ${min} and ${max}`, {
      field,
    });
  }

  return String(number);
}

export function optionalInteger(value, field, options = {}) {
  if (isBlank(value)) {
    return '';
  }

  return requireInteger(value, field, options);
}

export function normalizeJsonObject(value, field) {
  if (isBlank(value)) {
    return '';
  }

  let parsed = value;

  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value);
    } catch {
      throw new ValidationError(`${field} must contain valid JSON`, { field });
    }
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new ValidationError(`${field} must contain a JSON object`, { field });
  }

  return JSON.stringify(parsed);
}

export function rejectUnknownFields(data, allowedFields, label) {
  const unknown = Object.keys(data).filter((field) => !allowedFields.includes(field));

  if (unknown.length > 0) {
    throw new ValidationError(`${label} contains unknown fields: ${unknown.join(', ')}`, {
      details: { unknownFields: unknown },
    });
  }
}
