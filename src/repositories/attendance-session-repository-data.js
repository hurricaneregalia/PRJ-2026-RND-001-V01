// src/repositories/attendance-session-repository-data.js

import "server-only";

import { getGoogleSheetsClient } from "@/lib/google-sheets";
import { ATTENDANCE_SESSION_HEADERS } from "@/config/attendance-config";

import {
  SPREADSHEET_ID,
  ATTENDANCE_SESSION_SHEET_NAME,
} from "./attendance-session-repository-constants";

export {
  getRequiredSheetIds,
  toCellData,
  toRowData,
  createSessionRow,
  createRecordRow,
  getSessionSnapshot,
  getRecordSnapshot,
} from "./attendance-repository-infrastructure";

export async function getAttendanceSessionsData() {
  if (!SPREADSHEET_ID) {
    throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID_MISSING");
  }

  const sheets = await getGoogleSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${ATTENDANCE_SESSION_SHEET_NAME}!A:K`,
  });

  const rows = response.data.values || [];
  const headers = rows[0] || [];

  if (
    headers.length !== ATTENDANCE_SESSION_HEADERS.length ||
    !ATTENDANCE_SESSION_HEADERS.every((header, index) => headers[index] === header)
  ) {
    throw new Error("INVALID_ATTENDANCE_SESSION_HEADERS");
  }

  return rows.slice(1).map((row, index) => {
    const session = Object.fromEntries(
      ATTENDANCE_SESSION_HEADERS.map((header, columnIndex) => [header, row[columnIndex] || ""]),
    );

    return {
      ...session,
      row_number: index + 2,
    };
  });
}