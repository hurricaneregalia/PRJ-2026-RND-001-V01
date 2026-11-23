// src/repositories/student-repository-data.js

import "server-only";

import { getGoogleSheetsClient } from "@/lib/google-sheets";
import { STUDENT_HEADERS } from "@/config/student-config";

import { SPREADSHEET_ID, SHEET_NAME, AUDIT_SHEET_NAME } from "./student-repository-constants";

export async function getStudentsData() {
  if (!SPREADSHEET_ID) {
    throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID_MISSING");
  }

  const sheets = await getGoogleSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:J`,
  });

  const rows = response.data.values || [];
  const headers = rows[0] || [];

  if (headers.length !== STUDENT_HEADERS.length || !STUDENT_HEADERS.every((header, index) => headers[index] === header)) {
    throw new Error("INVALID_STUDENTS_HEADERS");
  }

  return rows.slice(1).map((row, index) => ({
    student_id: row[0] || "",
    student_number: row[1] || "",
    full_name: row[2] || "",
    gender: row[3] || "",
    parent_name: row[4] || "",
    parent_relation: row[5] || "",
    parent_whatsapp: row[6] || "",
    student_status: row[7] || "",
    created_at: row[8] || "",
    updated_at: row[9] || "",
    row_number: index + 2,
  }));
}

export async function getRequiredSheetIds(sheets) {
  const response = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    fields: "sheets.properties",
  });

  const properties = response.data.sheets || [];
  const studentsSheet = properties.find((sheet) => sheet.properties.title === SHEET_NAME);
  const auditSheet = properties.find((sheet) => sheet.properties.title === AUDIT_SHEET_NAME);

  if (!studentsSheet || !auditSheet) {
    throw new Error("REQUIRED_SHEET_NOT_FOUND");
  }

  return {
    studentsSheetId: studentsSheet.properties.sheetId,
    auditSheetId: auditSheet.properties.sheetId,
  };
}

export function toCellData(value) {
  return {
    userEnteredValue: {
      stringValue: String(value ?? ""),
    },
  };
}

export function toRowData(values) {
  return {
    values: values.map(toCellData),
  };
}
