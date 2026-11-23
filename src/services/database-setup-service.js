// src/services/database-setup-service.js

import "server-only";

import { getGoogleSheetsClient } from "@/lib/google-sheets";
import { DATABASE_SCHEMA } from "@/config/database-schema";
import { ATTENDANCE_SESSION_HEADERS } from "@/config/attendance-config";

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

const ATTENDANCE_SESSION_LEGACY_HEADERS = [
  "session_id",
  "class_id",
  "teacher_user_id",
  "academic_year_id",
  "attendance_date",
  "location_name",
  "location_note",
  "lesson_material",
  "created_at",
  "updated_at",
];

export async function verifyDatabaseHeaders() {
  const sheets = await getGoogleSheetsClient();
  const results = {};

  for (const [sheetName, expectedHeaders] of Object.entries(DATABASE_SCHEMA)) {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!1:1`,
    });

    const actualHeaders = response.data.values?.[0] || [];

    const isValid = actualHeaders.length === expectedHeaders.length && expectedHeaders.every((header, index) => actualHeaders[index] === header);

    results[sheetName] = {
      valid: isValid,
      expectedColumns: expectedHeaders.length,
      actualColumns: actualHeaders.length,
      expectedHeaders,
      actualHeaders,
    };
  }

  return {
    success: Object.values(results).every((result) => result.valid),
    results,
  };
}

export async function initializeDatabaseHeaders() {
  const sheets = await getGoogleSheetsClient();
  const results = {};

  for (const [sheetName, expectedHeaders] of Object.entries(DATABASE_SCHEMA)) {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!1:1`,
    });

    const actualHeaders = response.data.values?.[0] || [];

    if (actualHeaders.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!A1`,
        valueInputOption: "RAW",
        requestBody: {
          values: [expectedHeaders],
        },
      });

      results[sheetName] = "created";
      continue;
    }

    const isValid = actualHeaders.length === expectedHeaders.length && expectedHeaders.every((header, index) => header === actualHeaders[index]);

    results[sheetName] = isValid ? "already_valid" : "mismatch";
  }

  return results;
}

export async function migrateAttendanceSessionHeaders() {
  const sheets = await getGoogleSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "Attendance_Sessions!A:K",
  });

  const rows = response.data.values || [];
  const actualHeaders = rows[0] || [];

  const isNewHeader =
    actualHeaders.length === ATTENDANCE_SESSION_HEADERS.length &&
    ATTENDANCE_SESSION_HEADERS.every((header, index) => actualHeaders[index] === header);

  if (isNewHeader) {
    return {
      status: "already_valid",
      migratedRows: 0,
    };
  }

  const isLegacyHeader =
    actualHeaders.length === ATTENDANCE_SESSION_LEGACY_HEADERS.length &&
    ATTENDANCE_SESSION_LEGACY_HEADERS.every((header, index) => actualHeaders[index] === header);

  if (!isLegacyHeader) {
    return {
      status: "mismatch",
      actualHeaders,
      expectedHeaders: ATTENDANCE_SESSION_HEADERS,
    };
  }

  const migratedRows = rows.map((row, rowIndex) => {
    if (rowIndex === 0) {
      return [...ATTENDANCE_SESSION_HEADERS];
    }

    const legacyLocationName = String(row[5] || "").trim();
    const locationType = legacyLocationName ? "OUTSIDE_CLASS" : "IN_CLASS";

    const migratedRow = [
      row[0] || "",
      row[1] || "",
      row[2] || "",
      row[3] || "",
      row[4] || "",
      locationType,
      row[5] || "",
      row[6] || "",
      row[7] || "",
      row[8] || "",
      row[9] || "",
    ];

    return migratedRow;
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `Attendance_Sessions!A1:K${Math.max(migratedRows.length, 1)}`,
    valueInputOption: "RAW",
    requestBody: {
      values: migratedRows,
    },
  });

  return {
    status: "migrated",
    migratedRows: Math.max(migratedRows.length - 1, 0),
    defaultLocationTypeRule: "OUTSIDE_CLASS when legacy location_name is not empty, otherwise IN_CLASS",
  };
}
