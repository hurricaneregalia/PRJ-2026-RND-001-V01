import "server-only";
import { getGoogleSheetsClient } from "@/lib/google-sheets";

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const SHEET_NAME = "Academic_Years";

const HEADERS = ["academic_year_id", "academic_year_name", "start_date", "end_date", "academic_year_status", "created_at", "updated_at"];

export async function getAcademicYears() {
  const sheets = await getGoogleSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:G`,
  });

  const rows = response.data.values || [];

  if (!rows.length) {
    throw new Error("ACADEMIC_YEAR_HEADERS_NOT_FOUND");
  }

  const validHeaders = rows[0].length === HEADERS.length && HEADERS.every((header, index) => rows[0][index] === header);

  if (!validHeaders) {
    throw new Error("ACADEMIC_YEAR_HEADERS_INVALID");
  }

  return rows.slice(1).map((row) => Object.fromEntries(HEADERS.map((header, index) => [header, row[index] ?? ""])));
}

export async function getAcademicYearById(academicYearId) {
  if (typeof academicYearId !== "string" || !academicYearId.trim()) {
    return null;
  }

  const academicYears = await getAcademicYears();

  return academicYears.find((item) => item.academic_year_id === academicYearId) || null;
}
