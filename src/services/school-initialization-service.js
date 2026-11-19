import "server-only";

import { randomUUID } from "node:crypto";
import { getGoogleSheetsClient } from "@/lib/google-sheets";

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

const SCHOOL_HEADERS = ["school_id", "school_name", "school_address", "school_phone", "school_email", "school_logo_url", "principal_name", "created_at", "updated_at"];

let initializationInProgress = false;

function validateSchoolData(data) {
  if (!data || typeof data.school_name !== "string" || !data.school_name.trim() || typeof data.school_address !== "string" || !data.school_address.trim()) {
    throw new Error("INVALID_SCHOOL_INFORMATION");
  }

  const optionalFields = ["school_phone", "school_email", "school_logo_url", "principal_name"];

  for (const field of optionalFields) {
    if (data[field] !== undefined && typeof data[field] !== "string") {
      throw new Error("INVALID_SCHOOL_INFORMATION");
    }
  }

  return {
    school_name: data.school_name.trim(),
    school_address: data.school_address.trim(),
    school_phone: data.school_phone?.trim() ?? "",
    school_email: data.school_email?.trim() ?? "",
    school_logo_url: data.school_logo_url?.trim() ?? "",
    principal_name: data.principal_name?.trim() ?? "",
  };
}

async function getSchoolSheetRows(sheets) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "School_Information!A:I",
  });

  const rows = response.data.values || [];

  if (!rows.length) {
    throw new Error("SCHOOL_INFORMATION_HEADERS_NOT_FOUND");
  }

  const validHeaders = rows[0].length === SCHOOL_HEADERS.length && SCHOOL_HEADERS.every((header, index) => rows[0][index] === header);

  if (!validHeaders) {
    throw new Error("SCHOOL_INFORMATION_HEADERS_INVALID");
  }

  return rows;
}

function toCellData(values) {
  return values.map((value) => ({
    userEnteredValue: {
      stringValue: String(value ?? ""),
    },
  }));
}

export async function initializeSchool(data) {
  if (initializationInProgress) {
    throw new Error("INITIALIZATION_IN_PROGRESS");
  }

  initializationInProgress = true;

  try {
    if (!data || !data.school) {
      throw new Error("INVALID_INITIALIZATION_DATA");
    }

    const schoolData = validateSchoolData(data.school);
    const sheets = await getGoogleSheetsClient();

    const schoolRows = await getSchoolSheetRows(sheets);

    if (schoolRows.length > 1) {
      throw new Error("SCHOOL_INFORMATION_ALREADY_EXISTS");
    }

    const now = new Date().toISOString();
    const schoolId = randomUUID();

    const schoolRow = [schoolId, schoolData.school_name, schoolData.school_address, schoolData.school_phone, schoolData.school_email, schoolData.school_logo_url, schoolData.principal_name, now, now];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "School_Information!A:I",
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [schoolRow],
      },
    });

    return {
      success: true,
      message: "Inisialisasi sekolah berhasil.",
      school: {
        school_id: schoolId,
        ...schoolData,
        created_at: now,
        updated_at: now,
      },
    };
  } finally {
    initializationInProgress = false;
  }
}
