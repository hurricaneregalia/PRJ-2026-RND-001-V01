// src/repositories/class-member-repository-infrastructure.js

import "server-only";

import { getGoogleSheetsClient } from "@/lib/google-sheets";

import { SPREADSHEET_ID, SHEET_NAME, AUDIT_SHEET_NAME } from "./class-member-repository-constants";

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

export async function getRequiredSheetIds(sheets) {
  const response = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    fields: "sheets.properties",
  });

  const properties = response.data.sheets || [];

  const membersSheet = properties.find((sheet) => sheet.properties.title === SHEET_NAME);

  const auditSheet = properties.find((sheet) => sheet.properties.title === AUDIT_SHEET_NAME);

  if (!membersSheet || !auditSheet) {
    throw new Error("REQUIRED_SHEET_NOT_FOUND");
  }

  return {
    membersSheetId: membersSheet.properties.sheetId,
    auditSheetId: auditSheet.properties.sheetId,
  };
}

export async function executeBulkBatch(requests) {
  if (requests.length === 0) {
    return;
  }

  if (!SPREADSHEET_ID) {
    throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID_MISSING");
  }

  const sheets = await getGoogleSheetsClient();

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests,
    },
  });
}
