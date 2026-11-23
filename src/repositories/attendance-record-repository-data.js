// src/repositories/attendance-record-repository-data.js

import "server-only";

import { getGoogleSheetsClient } from "@/lib/google-sheets";
import { ATTENDANCE_RECORD_HEADERS } from "@/config/attendance-config";

import {
  SPREADSHEET_ID,
  ATTENDANCE_RECORD_SHEET_NAME,
} from "./attendance-session-repository-constants";

export {
  getRequiredSheetIds,
  toCellData,
  toRowData,
  createRecordRow,
  getRecordSnapshot,
} from "./attendance-repository-infrastructure";

export async function getAttendanceRecordsData() {
  if (!SPREADSHEET_ID) {
    throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID_MISSING");
  }

  const sheets = await getGoogleSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${ATTENDANCE_RECORD_SHEET_NAME}!A:G`,
  });

  const rows = response.data.values || [];
  const headers = rows[0] || [];

  if (
    headers.length !== ATTENDANCE_RECORD_HEADERS.length ||
    !ATTENDANCE_RECORD_HEADERS.every((header, index) => headers[index] === header)
  ) {
    throw new Error("INVALID_ATTENDANCE_RECORD_HEADERS");
  }

  return rows.slice(1).map((row, index) => {
    const record = Object.fromEntries(
      ATTENDANCE_RECORD_HEADERS.map((header, columnIndex) => [header, row[columnIndex] || ""]),
    );

    return {
      ...record,
      row_number: index + 2,
    };
  });
}