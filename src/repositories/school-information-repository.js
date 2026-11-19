import "server-only";

import { randomUUID } from "node:crypto";
import { getGoogleSheetsClient } from "@/lib/google-sheets";
import { getSchoolDisplayData } from "@/config/school-defaults";

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const SHEET_NAME = "School_Information";

const HEADERS = ["school_id", "school_name", "school_address", "school_phone", "school_email", "school_logo_url", "principal_name", "created_at", "updated_at"];

async function getSheetData() {
  const sheets = await getGoogleSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:I`,
  });

  const rows = response.data.values || [];

  if (!rows.length) {
    throw new Error("SCHOOL_INFORMATION_HEADERS_NOT_FOUND");
  }

  const validHeaders = rows[0].length === HEADERS.length && HEADERS.every((header, index) => header === rows[0][index]);

  if (!validHeaders) {
    throw new Error("SCHOOL_INFORMATION_HEADERS_INVALID");
  }

  return rows;
}

export async function getSchoolInformationRecord() {
  const rows = await getSheetData();

  if (rows.length < 2) {
    return null;
  }

  if (rows.length > 2) {
    throw new Error("MULTIPLE_SCHOOL_INFORMATION_RECORDS");
  }

  return Object.fromEntries(HEADERS.map((header, index) => [header, rows[1][index] ?? ""]));
}

export async function getSchoolInformation() {
  const record = await getSchoolInformationRecord();

  return getSchoolDisplayData(record);
}

export async function createSchoolInformation(data) {
  if (typeof data.school_name !== "string" || !data.school_name.trim() || typeof data.school_address !== "string" || !data.school_address.trim()) {
    throw new Error("INVALID_SCHOOL_INFORMATION");
  }

  const optionalFields = ["school_phone", "school_email", "school_logo_url", "principal_name"];

  for (const field of optionalFields) {
    if (data[field] !== undefined && typeof data[field] !== "string") {
      throw new Error("INVALID_SCHOOL_INFORMATION");
    }
  }

  const rows = await getSheetData();

  if (rows.length > 1) {
    throw new Error("INFORMATION_ALREADY_EXISTS");
  }

  const sheets = await getGoogleSheetsClient();
  const now = new Date().toISOString();

  const values = [
    randomUUID(),
    data.school_name.trim(),
    data.school_address.trim(),
    data.school_phone?.trim() ?? "",
    data.school_email?.trim() ?? "",
    data.school_logo_url?.trim() ?? "",
    data.principal_name?.trim() ?? "",
    now,
    now,
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:I`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [values],
    },
  });

  return { success: true };
}
