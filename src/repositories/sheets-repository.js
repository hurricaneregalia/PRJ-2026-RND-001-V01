import { GOOGLE_SHEETS_CONFIG } from '@/config/google-sheets';
import {
  NotFoundError,
  SheetHeaderError,
  SheetOperationError,
} from '@/lib/data-errors';
import { isBlank } from '@/lib/validation';
import {
  getGoogleSheetsClient,
  getSpreadsheetMetadata,
} from '@/lib/google-sheets-client';

function getSpreadsheetId() {
  const id = GOOGLE_SHEETS_CONFIG.spreadsheetId;

  if (!id) {
    throw new Error('GOOGLE_SHEETS_SPREADSHEET_ID is not configured');
  }

  return id;
}

function operationError(operation, range, error) {
  return new SheetOperationError(`Google Sheets ${operation} failed`, {
    operation,
    range,
    status: error?.response?.status ?? error?.status,
    apiCode: error?.code,
  });
}

export function columnNumberToLetter(columnNumber) {
  let number = Number(columnNumber);

  if (!Number.isInteger(number) || number < 1) {
    throw new Error('Column number must be a positive integer');
  }

  let letters = '';

  while (number > 0) {
    const remainder = (number - 1) % 26;
    letters = String.fromCharCode(65 + remainder) + letters;
    number = Math.floor((number - 1) / 26);
  }

  return letters;
}

export async function readRange(range) {
  try {
    const sheets = getGoogleSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: getSpreadsheetId(),
      range,
    });
    return response.data.values ?? [];
  } catch (error) {
    throw operationError('read', range, error);
  }
}

export async function appendRow(range, values) {
  try {
    const sheets = getGoogleSheetsClient();
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: getSpreadsheetId(),
      range,
      valueInputOption: 'RAW',
      requestBody: { values: [values] },
    });
    return response.data;
  } catch (error) {
    throw operationError('append', range, error);
  }
}

export async function updateRange(range, values) {
  try {
    const sheets = getGoogleSheetsClient();
    const response = await sheets.spreadsheets.values.update({
      spreadsheetId: getSpreadsheetId(),
      range,
      valueInputOption: 'RAW',
      requestBody: { values },
    });
    return response.data;
  } catch (error) {
    throw operationError('update', range, error);
  }
}

export async function clearRange(range) {
  try {
    const sheets = getGoogleSheetsClient();
    const response = await sheets.spreadsheets.values.clear({
      spreadsheetId: getSpreadsheetId(),
      range,
    });
    return response.data;
  } catch (error) {
    throw operationError('clear', range, error);
  }
}

export async function updateRanges(updates) {
  if (!Array.isArray(updates) || updates.length === 0) {
    throw new Error('At least one range update is required');
  }

  try {
    const sheets = getGoogleSheetsClient();
    const response = await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: getSpreadsheetId(),
      requestBody: {
        valueInputOption: 'RAW',
        data: updates.map(({ range, values }) => ({ range, values })),
      },
    });
    return response.data;
  } catch (error) {
    throw operationError('batch update', 'multiple ranges', error);
  }
}

export async function listWorksheetNames() {
  try {
    const metadata = await getSpreadsheetMetadata();
    return (metadata.sheets ?? [])
      .map((sheet) => sheet.properties?.title)
      .filter(Boolean);
  } catch (error) {
    throw operationError('metadata', 'spreadsheet', error);
  }
}

export async function worksheetExists(title) {
  const names = await listWorksheetNames();
  return names.includes(title);
}

export async function readWorksheetHeader(title) {
  const rows = await readRange(`${title}!A1:ZZ1`);
  return (rows[0] ?? []).map((value) => String(value ?? ''));
}

function assertHeaderMatches(title, expectedHeader, actualHeader) {
  const actual = actualHeader.map((value) => String(value ?? ''));
  const expected = expectedHeader.map((value) => String(value));
  const missing = expected.filter((column) => !actual.includes(column));
  const extra = actual.filter((column) => !expected.includes(column));
  const sameOrder =
    actual.length === expected.length &&
    expected.every((column, index) => actual[index] === column);

  if (!sameOrder) {
    throw new SheetHeaderError(`Worksheet header mismatch: ${title}`, {
      table: title,
      expected,
      actual,
      missing,
      extra,
    });
  }

  return actual;
}

export async function assertWorksheetHeader(title, expectedHeader) {
  if (!(await worksheetExists(title))) {
    throw new NotFoundError(`Worksheet not found: ${title}`, { table: title });
  }

  return assertHeaderMatches(
    title,
    expectedHeader,
    await readWorksheetHeader(title),
  );
}

export async function readWorksheetRecords(title, expectedHeader) {
  // One read covers both the header check and the data rows. This keeps the
  // repository within the default Sheets read quota.
  const rows = await readRange(`${title}!A1:ZZ`);
  const header = assertHeaderMatches(title, expectedHeader, rows[0] ?? []);
  const records = [];

  rows.slice(1).forEach((row, index) => {
    if (!row || row.every((value) => isBlank(value))) {
      return;
    }

    const record = {};

    header.forEach((column, columnIndex) => {
      record[column] = row[columnIndex] === undefined ? '' : String(row[columnIndex]);
    });

    records.push({ rowNumber: index + 2, record });
  });

  return { header, records };
}

export async function appendWorksheetRow(title, values) {
  return appendRow(`${title}!A1`, values);
}

export async function updateWorksheetRow(title, rowNumber, values) {
  const lastColumn = columnNumberToLetter(values.length);
  return updateRange(`${title}!A${rowNumber}:${lastColumn}${rowNumber}`, [values]);
}

export async function clearWorksheetRow(title, rowNumber, columnCount) {
  const lastColumn = columnNumberToLetter(columnCount);
  return clearRange(`${title}!A${rowNumber}:${lastColumn}${rowNumber}`);
}

export async function getWorksheetProperties(title) {
  try {
    const metadata = await getSpreadsheetMetadata();
    const sheet = (metadata.sheets ?? []).find(
      (entry) => entry.properties?.title === title,
    );

    if (!sheet) {
      throw new NotFoundError(`Worksheet not found: ${title}`, { table: title });
    }

    return sheet.properties;
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }

    throw operationError('metadata', title, error);
  }
}
