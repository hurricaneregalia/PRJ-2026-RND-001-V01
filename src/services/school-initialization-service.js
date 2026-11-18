import "server-only";
import { randomUUID } from "node:crypto";
import { getGoogleSheetsClient } from "@/lib/google-sheets";
import { getAcademicYears } from "@/repositories/academic-year-repository";
import { validateAcademicYearData } from "@/services/academic-year-service";

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

const SCHOOL_HEADERS = ["school_id", "school_name", "school_address", "school_phone", "school_email", "school_logo_url", "principal_name", "active_academic_year_id", "created_at", "updated_at"];

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

function toCellData(values) {
  return values.map((value) => ({
    userEnteredValue: {
      stringValue: String(value ?? ""),
    },
  }));
}

async function getSchoolSheetRows(sheets) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "School_Information!A:J",
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

async function getSheetIds(sheets) {
  const response = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    fields: "sheets.properties(sheetId,title)",
  });

  const sheetProperties = response.data.sheets || [];

  const academicSheet = sheetProperties.find((sheet) => sheet.properties?.title === "Academic_Years");

  const schoolSheet = sheetProperties.find((sheet) => sheet.properties?.title === "School_Information");

  if (!academicSheet || !schoolSheet) {
    throw new Error("INITIALIZATION_SHEET_NOT_FOUND");
  }

  return {
    academicSheetId: academicSheet.properties.sheetId,
    schoolSheetId: schoolSheet.properties.sheetId,
  };
}

export async function initializeSchool(data) {
  if (initializationInProgress) {
    throw new Error("INITIALIZATION_IN_PROGRESS");
  }

  initializationInProgress = true;

  try {
    if (!data || !data.school || !data.academicYear) {
      throw new Error("INVALID_INITIALIZATION_DATA");
    }

    const schoolData = validateSchoolData(data.school);

    const academicYearData = await validateAcademicYearData(data.academicYear);

    const sheets = await getGoogleSheetsClient();

    const [academicYears, schoolRows] = await Promise.all([getAcademicYears(), getSchoolSheetRows(sheets)]);

    if (academicYears.length > 0) {
      throw new Error("ACADEMIC_YEARS_ALREADY_EXIST");
    }

    if (schoolRows.length > 1) {
      throw new Error("SCHOOL_INFORMATION_ALREADY_EXISTS");
    }

    const { academicSheetId, schoolSheetId } = await getSheetIds(sheets);

    const now = new Date().toISOString();
    const academicYearId = randomUUID();
    const schoolId = randomUUID();

    const academicYearRow = [academicYearId, academicYearData.academic_year_name, academicYearData.start_date, academicYearData.end_date, "active", now, now];

    const schoolRow = [
      schoolId,
      schoolData.school_name,
      schoolData.school_address,
      schoolData.school_phone,
      schoolData.school_email,
      schoolData.school_logo_url,
      schoolData.principal_name,
      academicYearId,
      now,
      now,
    ];

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [
          {
            appendCells: {
              sheetId: academicSheetId,
              rows: [
                {
                  values: toCellData(academicYearRow),
                },
              ],
              fields: "userEnteredValue",
            },
          },
          {
            appendCells: {
              sheetId: schoolSheetId,
              rows: [
                {
                  values: toCellData(schoolRow),
                },
              ],
              fields: "userEnteredValue",
            },
          },
        ],
      },
    });

    return {
      success: true,
      message: "Inisialisasi sekolah berhasil.",
      academicYear: {
        academic_year_id: academicYearId,
        ...academicYearData,
        academic_year_status: "active",
      },
      school: {
        school_id: schoolId,
        ...schoolData,
        active_academic_year_id: academicYearId,
      },
    };
  } finally {
    initializationInProgress = false;
  }
}
