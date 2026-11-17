import "server-only";
import { getGoogleSheetsClient } from "@/lib/google-sheets";
import { DATABASE_SCHEMA } from "@/config/database-schema";
import { createSchoolInformation } from "@/repositories/school-information-repository";

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

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

export async function validateActiveAcademicYear(academicYearId) {
  if (!academicYearId) {
    throw new Error("ACTIVE_ACADEMIC_YEAR_REQUIRED");
  }

  const sheets = await getGoogleSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "Academic_Years!A:G",
  });

  const rows = response.data.values || [];

  if (rows.length < 2) {
    throw new Error("ACADEMIC_YEAR_NOT_FOUND");
  }

  const headers = rows[0];

  const academicYears = rows.slice(1).map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""])));

  const academicYear = academicYears.find((item) => item.academic_year_id === academicYearId);

  if (!academicYear) {
    throw new Error("ACADEMIC_YEAR_NOT_FOUND");
  }

  const startDate = new Date(`${academicYear.start_date}T00:00:00+07:00`);
  const endDate = new Date(`${academicYear.end_date}T23:59:59+07:00`);

  const today = new Date(
    new Date().toLocaleString("en-US", {
      timeZone: "Asia/Jakarta",
    }),
  );

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || startDate > endDate) {
    throw new Error("ACADEMIC_YEAR_PERIOD_INVALID");
  }

  if (today < startDate || today > endDate) {
    throw new Error("ACADEMIC_YEAR_NOT_CURRENT");
  }

  return academicYear;
}

export async function initializeSchoolInformation(data) {
  const sheets = await getGoogleSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "School_Information!A:J",
  });

  const rows = response.data.values || [];

  if (rows.length > 2) {
    throw new Error("MULTIPLE_SCHOOL_INFORMATION_RECORDS");
  }

  if (rows.length > 1) {
    throw new Error("INFORMATION_ALREADY_EXISTS");
  }

  await validateActiveAcademicYear(data.active_academic_year_id);

  return createSchoolInformation(data);
}
