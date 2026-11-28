import { ValidationError } from '@/lib/data-errors';
import {
  assertPlainObject,
  isBlank,
  normalizeJsonObject,
  optionalDate,
  optionalDateTime,
  optionalEnum,
  optionalInteger,
  optionalString,
  optionalTime,
  rejectUnknownFields,
  requireDate,
  requireDateTime,
  requireEmail,
  requireEnum,
  requireInteger,
  requireString,
  requireTime,
  requireUrl,
  optionalUrl,
} from '@/lib/validation';

const VALIDATORS = {
  string: (value, field, descriptor) =>
    descriptor.required
      ? requireString(value, field, descriptor)
      : optionalString(value, field, descriptor),
  email: (value, field) => requireEmail(value, field),
  url: (value, field, descriptor) =>
    descriptor.required
      ? requireUrl(value, field, descriptor)
      : optionalUrl(value, field, descriptor),
  enum: (value, field, descriptor) =>
    descriptor.required
      ? requireEnum(value, field, descriptor.allowedValues)
      : optionalEnum(value, field, descriptor.allowedValues),
  date: (value, field, descriptor) =>
    descriptor.required ? requireDate(value, field) : optionalDate(value, field),
  time: (value, field, descriptor) =>
    descriptor.required ? requireTime(value, field) : optionalTime(value, field),
  datetime: (value, field, descriptor) =>
    descriptor.required ? requireDateTime(value, field) : optionalDateTime(value, field),
  integer: (value, field, descriptor) =>
    descriptor.required
      ? requireInteger(value, field, descriptor)
      : optionalInteger(value, field, descriptor),
  json: (value, field) => normalizeJsonObject(value, field),
};

function validateDescriptorValue(value, field, descriptor) {
  if (isBlank(value)) {
    if (descriptor.required) {
      throw new ValidationError(`${field} is required`, { field });
    }

    return '';
  }

  const validate = VALIDATORS[descriptor.type ?? 'string'];

  if (!validate) {
    throw new ValidationError(`Unsupported validator for ${field}`, { field });
  }

  return validate(value, field, descriptor);
}

export function validateFields(data, descriptors, { partial = false, label = 'input' } = {}) {
  assertPlainObject(data, label);

  const fields = Object.keys(descriptors);
  rejectUnknownFields(data, fields, label);

  const result = {};

  for (const [field, descriptor] of Object.entries(descriptors)) {
    const present = Object.prototype.hasOwnProperty.call(data, field);

    if (!present) {
      if (!partial && descriptor.required) {
        throw new ValidationError(`${field} is required`, { field });
      }

      continue;
    }

    result[field] = validateDescriptorValue(data[field], field, descriptor);
  }

  return result;
}

export function validateStoredFields(record, descriptors) {
  for (const [field, descriptor] of Object.entries(descriptors)) {
    const value = record?.[field] ?? '';

    if (isBlank(value) && !descriptor.required) {
      continue;
    }

    validateDescriptorValue(value, field, descriptor);
  }

  return record;
}
