// src/repositories/attendance-repository-infrastructure.js

import "server-only";

import { getGoogleSheetsClient } from "@/lib/google-sheets";
import {
  ATTENDANCE_SESSION_HEADERS,
  ATTENDANCE_RECORD_HEADERS,
} from "@/config/attendance-config";

import {
  SPREADSHEET_ID,
  ATTENDANCE_SESSION_SHEET_NAME,
  ATTENDANCE_RECORD_SHEET_NAME,
  ATTENDANCE_AUDIT_SHEET_NAME,
} from "./attendance-session-repository-constants";

export async function getRequiredSheetIds(sheets) {
  const response = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    fields: "sheets.properties",
  });

  const properties = response.data.sheets || [];

  const sessionSheet = properties.find(
    (sheet) => sheet.properties.title === ATTENDANCE_SESSION_SHEET_NAME,
  );
  const recordSheet = properties.find(
    (sheet) => sheet.properties.title === ATTENDANCE_RECORD_SHEET_NAME,
  );
  const auditSheet = properties.find(
    (sheet) => sheet.properties.title === ATTENDANCE_AUDIT_SHEET_NAME,
  );

  if (!sessionSheet || !recordSheet || !auditSheet) {
    throw new Error("REQUIRED_SHEET_NOT_FOUND");
  }

  return {
    sessionSheetId: sessionSheet.properties.sheetId,
    recordSheetId: recordSheet.properties.sheetId,
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

export function createSessionRow(session) {
  return ATTENDANCE_SESSION_HEADERS.map((header) => session[header]);
}

export function createRecordRow(record) {
  return ATTENDANCE_RECORD_HEADERS.map((header) => record[header]);
}

export function getSessionSnapshot(session) {
  return Object.fromEntries(
    ATTENDANCE_SESSION_HEADERS.map((header) => [header, session[header]]),
  );
}

export function getRecordSnapshot(record) {
  return Object.fromEntries(
    ATTENDANCE_RECORD_HEADERS.map((header) => [header, record[header]]),
  );
}