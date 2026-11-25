// Error types for the data layer. Messages must never include credentials or
// values from environment variables.

export class DataError extends Error {
  constructor(message, { code = 'DATA_ERROR', details, cause } = {}) {
    super(message, cause ? { cause } : undefined);
    this.name = 'DataError';
    this.code = code;
    this.details = details;
  }
}

export class ConfigurationError extends DataError {
  constructor(message, options = {}) {
    super(message, { ...options, code: 'CONFIGURATION_ERROR' });
    this.name = 'ConfigurationError';
  }
}

export class ValidationError extends DataError {
  constructor(message, { field, details, cause } = {}) {
    super(message, {
      code: 'VALIDATION_ERROR',
      details: { ...details, field },
      cause,
    });
    this.name = 'ValidationError';
    this.field = field;
  }
}

export class NotFoundError extends DataError {
  constructor(message, { table, recordId } = {}) {
    super(message, {
      code: 'NOT_FOUND',
      details: { table, recordId },
    });
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends DataError {
  constructor(message, { field, details } = {}) {
    super(message, {
      code: 'CONFLICT',
      details: { ...details, field },
    });
    this.name = 'ConflictError';
    this.field = field;
  }
}

export class DataIntegrityError extends DataError {
  constructor(message, { table, rowNumber, field, cause } = {}) {
    super(message, {
      code: 'DATA_INTEGRITY_ERROR',
      details: { table, rowNumber, field },
      cause,
    });
    this.name = 'DataIntegrityError';
  }
}

export class SheetOperationError extends DataError {
  constructor(message, { operation, range, status, apiCode, cause } = {}) {
    super(message, {
      code: 'SHEET_OPERATION_ERROR',
      details: { operation, range, status, apiCode },
      cause,
    });
    this.name = 'SheetOperationError';
  }
}

export class SheetHeaderError extends DataError {
  constructor(message, { table, expected, actual, missing = [], extra = [] } = {}) {
    super(message, {
      code: 'SHEET_HEADER_ERROR',
      details: { table, expected, actual, missing, extra },
    });
    this.name = 'SheetHeaderError';
  }
}

export class UnsupportedOperationError extends DataError {
  constructor(message, { table, operation } = {}) {
    super(message, {
      code: 'UNSUPPORTED_OPERATION',
      details: { table, operation },
    });
    this.name = 'UnsupportedOperationError';
  }
}
