import "server-only";
import { randomUUID } from "node:crypto";
import { getGoogleSheetsClient } from "@/lib/google-sheets";
import { getSchoolDisplayData } from "@/config/school-defaults";

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const SHEET_NAME = "School_Information";

const HEADERS = ["school_id", "school_name", "school_address", "school_phone", "school_email", "school_logo_url", "principal_name", "active_academic_year_id", "created_at", "updated_at"];

async function getSheetData() {
  const sheets = await getGoogleSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:J`,
  });

  const rows = response.data.values || [];

  if (!rows.length) {
    throw new Error("SCHOOL_INFORMATION_HEADERS_NOT_FOUND");
  }

  const headers = rows[0];

  if (headers.length !== HEADERS.length || !HEADERS.every((header, index) => headers[index] === header)) {
    throw new Error("SCHOOL_INFORMATION_HEADERS_INVALID");
  }

  return { sheets, rows };
}

export async function getSchoolInformation() {
  const { rows } = await getSheetData();

  if (rows.length < 2) {
    return getSchoolDisplayData();
  }

  if (rows.length > 2) {
    throw new Error("MULTIPLE_SCHOOL_INFORMATION_RECORDS");
  }

  const schoolInformation = Object.fromEntries(HEADERS.map((header, index) => [header, rows[1][index] ?? ""]));

  return getSchoolDisplayData(schoolInformation);
}

export async function createSchoolInformation(data) {
  if (typeof data.school_name !== "string" || !data.school_name.trim() || typeof data.school_address !== "string" || !data.school_address.trim() || !data.active_academic_year_id) {
    throw new Error("INVALID_SCHOOL_INFORMATION");
  }

  const { sheets, rows } = await getSheetData();

  if (rows.length > 1) {
    throw new Error("INFORMATION_ALREADY_EXISTS");
  }

  const now = new Date().toISOString();

  const values = [
    randomUUID(),
    data.school_name.trim(),
    data.school_address.trim(),
    data.school_phone?.trim() ?? "",
    data.school_email?.trim() ?? "",
    data.school_logo_url?.trim() ?? "",
    data.principal_name?.trim() ?? "",
    data.active_academic_year_id,
    now,
    now,
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:J`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [values],
    },
  });

  return { success: true };
}
