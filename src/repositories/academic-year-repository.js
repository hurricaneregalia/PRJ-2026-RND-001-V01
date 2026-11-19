// src/repositories/academic-year-repository.js

import "server-only";

import { randomUUID } from "node:crypto";
import { getGoogleSheetsClient } from "@/lib/google-sheets";

import { ACADEMIC_YEAR_HEADERS } from "@/config/academic-year-config";

import { prepareAdministrativeAudit } from "@/repositories/administrative-audit-repository";

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

const SHEET_NAME = "Academic_Years";
const SCHOOL_SHEET_NAME = "School_Information";
const AUDIT_SHEET_NAME = "Administrative_Audit_Logs";

const SCHOOL_HEADERS = ["school_id", "school_name", "school_address", "school_phone", "school_email", "school_logo_url", "principal_name", "active_academic_year_id", "created_at", "updated_at"];

async function getAcademicYearsData() {
  const sheets = await getGoogleSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:G`,
  });

  const rows = response.data.values || [];

  if (!rows.length) {
    throw new Error("ACADEMIC_YEAR_HEADER_NOT_FOUND");
  }

  const validHeaders = rows[0].length === ACADEMIC_YEAR_HEADERS.length && ACADEMIC_YEAR_HEADERS.every((header, index) => header === rows[0][index]);

  if (!validHeaders) {
    throw new Error("ACADEMIC_YEAR_HEADERS_INVALID");
  }

  return rows;
}

async function getSchoolInformationData() {
  const sheets = await getGoogleSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SCHOOL_SHEET_NAME}!A:J`,
  });

  const rows = response.data.values || [];

  if (!rows.length) {
    throw new Error("SCHOOL_INFORMATION_HEADERS_NOT_FOUND");
  }

  const validHeaders = rows[0].length === SCHOOL_HEADERS.length && SCHOOL_HEADERS.every((header, index) => header === rows[0][index]);

  if (!validHeaders) {
    throw new Error("SCHOOL_INFORMATION_HEADERS_INVALID");
  }

  if (rows.length !== 2) {
    throw new Error("SCHOOL_INFORMATION_RECORD_INVALID");
  }

  return {
    ...Object.fromEntries(SCHOOL_HEADERS.map((header, index) => [header, rows[1][index] ?? ""])),
    row_number: 2,
  };
}

function mapAcademicYearRows(rows) {
  return rows.slice(1).map((row, index) => ({
    ...Object.fromEntries(ACADEMIC_YEAR_HEADERS.map((header, columnIndex) => [header, row[columnIndex] ?? ""])),
    row_number: index + 2,
  }));
}

async function getRequiredSheetIds() {
  const sheets = await getGoogleSheetsClient();

  const response = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    fields: "sheets.properties",
  });

  const properties = response.data.sheets || [];

  const academicYearSheet = properties.find((item) => item.properties.title === SHEET_NAME);

  const schoolSheet = properties.find((item) => item.properties.title === SCHOOL_SHEET_NAME);

  const auditSheet = properties.find((item) => item.properties.title === AUDIT_SHEET_NAME);

  if (!academicYearSheet || !schoolSheet || !auditSheet) {
    throw new Error("REQUIRED_SHEET_NOT_FOUND");
  }

  return {
    academicYearSheetId: academicYearSheet.properties.sheetId,
    schoolSheetId: schoolSheet.properties.sheetId,
    auditSheetId: auditSheet.properties.sheetId,
  };
}

function toCellData(values) {
  return values.map((value) => ({
    userEnteredValue: {
      stringValue: String(value ?? ""),
    },
  }));
}

function validateAcademicYearPeriod(startDate, endDate) {
  if (typeof startDate !== "string" || typeof endDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    return false;
  }

  const parsedStart = new Date(`${startDate}T00:00:00Z`);
  const parsedEnd = new Date(`${endDate}T00:00:00Z`);

  return (
    !Number.isNaN(parsedStart.getTime()) &&
    !Number.isNaN(parsedEnd.getTime()) &&
    parsedStart.toISOString().slice(0, 10) === startDate &&
    parsedEnd.toISOString().slice(0, 10) === endDate &&
    startDate < endDate
  );
}

export async function getAllAcademicYears() {
  const rows = await getAcademicYearsData();

  return mapAcademicYearRows(rows);
}

export async function getAcademicYearById(academicYearId) {
  if (typeof academicYearId !== "string" || !academicYearId.trim()) {
    return null;
  }

  const academicYears = await getAllAcademicYears();

  return academicYears.find((item) => item.academic_year_id === academicYearId) || null;
}

export async function getActiveAcademicYear() {
  const school = await getSchoolInformationData();

  if (!school.active_academic_year_id) {
    return null;
  }

  const academicYear = await getAcademicYearById(school.active_academic_year_id);

  if (!academicYear) {
    throw new Error("ACTIVE_ACADEMIC_YEAR_NOT_FOUND");
  }

  return academicYear;
}

export async function createAcademicYear(data, auditData) {
  if (!data || typeof data.academic_year_name !== "string" || !data.academic_year_name.trim()) {
    throw new Error("INVALID_ACADEMIC_YEAR_DATA");
  }

  if (!validateAcademicYearPeriod(data.start_date, data.end_date)) {
    throw new Error("INVALID_ACADEMIC_YEAR_PERIOD");
  }

  const academicYears = await getAllAcademicYears();

  const normalizedName = data.academic_year_name.trim();

  const duplicate = academicYears.some((item) => item.academic_year_name.toLowerCase() === normalizedName.toLowerCase());

  if (duplicate) {
    throw new Error("ACADEMIC_YEAR_ALREADY_EXISTS");
  }

  const now = new Date().toISOString();

  // Tahun ajaran baru selalu dibuat inactive.
  // Aktivasi hanya boleh melalui activateAcademicYear().
  const academicYearData = [randomUUID(), normalizedName, data.start_date, data.end_date, "inactive", now, now];

  const newData = Object.fromEntries(ACADEMIC_YEAR_HEADERS.map((header, index) => [header, academicYearData[index]]));

  const auditRow = await prepareAdministrativeAudit({
    ...auditData,
    action_type: "ACADEMIC_YEAR_CREATED",
    table_name: SHEET_NAME,
    record_id: academicYearData[0],
    old_data: null,
    new_data: newData,
  });

  const { academicYearSheetId, auditSheetId } = await getRequiredSheetIds();

  const sheets = await getGoogleSheetsClient();

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [
        {
          appendCells: {
            sheetId: academicYearSheetId,
            rows: [
              {
                values: toCellData(academicYearData),
              },
            ],
            fields: "userEnteredValue",
          },
        },
        {
          appendCells: {
            sheetId: auditSheetId,
            rows: [
              {
                values: toCellData(auditRow),
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
    academic_year_id: academicYearData[0],
  };
}

export async function updateAcademicYear(academicYearId, updates, auditData) {
  if (!updates || typeof updates !== "object") {
    throw new Error("INVALID_ACADEMIC_YEAR_UPDATE");
  }

  const academicYears = await getAllAcademicYears();

  const academicYear = academicYears.find((item) => item.academic_year_id === academicYearId);

  if (!academicYear) {
    throw new Error("ACADEMIC_YEAR_NOT_FOUND");
  }

  // Status tidak boleh diubah melalui fungsi ini.
  const allowedFields = ["academic_year_name", "start_date", "end_date"];

  for (const field of Object.keys(updates)) {
    if (!allowedFields.includes(field)) {
      throw new Error("INVALID_ACADEMIC_YEAR_UPDATE_FIELD");
    }
  }

  const updatedAcademicYear = {
    ...academicYear,
    ...updates,
    updated_at: new Date().toISOString(),
  };

  if (typeof updatedAcademicYear.academic_year_name !== "string" || !updatedAcademicYear.academic_year_name.trim()) {
    throw new Error("INVALID_ACADEMIC_YEAR_DATA");
  }

  if (!validateAcademicYearPeriod(updatedAcademicYear.start_date, updatedAcademicYear.end_date)) {
    throw new Error("INVALID_ACADEMIC_YEAR_PERIOD");
  }

  const duplicate = academicYears.some((item) => item.academic_year_id !== academicYearId && item.academic_year_name.toLowerCase() === updatedAcademicYear.academic_year_name.trim().toLowerCase());

  if (duplicate) {
    throw new Error("ACADEMIC_YEAR_ALREADY_EXISTS");
  }

  const values = ACADEMIC_YEAR_HEADERS.map((header) => updatedAcademicYear[header] ?? "");

  const oldData = Object.fromEntries(ACADEMIC_YEAR_HEADERS.map((header) => [header, academicYear[header] ?? ""]));

  const newData = Object.fromEntries(ACADEMIC_YEAR_HEADERS.map((header, index) => [header, values[index]]));

  const auditRow = await prepareAdministrativeAudit({
    ...auditData,
    action_type: "ACADEMIC_YEAR_UPDATED",
    table_name: SHEET_NAME,
    record_id: academicYearId,
    old_data: oldData,
    new_data: newData,
  });

  const { academicYearSheetId, auditSheetId } = await getRequiredSheetIds();

  const sheets = await getGoogleSheetsClient();

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [
        {
          updateCells: {
            range: {
              sheetId: academicYearSheetId,
              startRowIndex: academicYear.row_number - 1,
              endRowIndex: academicYear.row_number,
              startColumnIndex: 0,
              endColumnIndex: ACADEMIC_YEAR_HEADERS.length,
            },
            rows: [
              {
                values: toCellData(values),
              },
            ],
            fields: "userEnteredValue",
          },
        },
        {
          appendCells: {
            sheetId: auditSheetId,
            rows: [
              {
                values: toCellData(auditRow),
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
  };
}

export async function activateAcademicYear(academicYearId, auditData) {
  if (typeof academicYearId !== "string" || !academicYearId.trim()) {
    throw new Error("INVALID_ACADEMIC_YEAR_ID");
  }

  const academicYears = await getAllAcademicYears();

  const targetYear = academicYears.find((item) => item.academic_year_id === academicYearId);

  if (!targetYear) {
    throw new Error("ACADEMIC_YEAR_NOT_FOUND");
  }

  const school = await getSchoolInformationData();

  const previousActiveYearId = school.active_academic_year_id;

  if (previousActiveYearId === academicYearId) {
    return {
      success: true,
      unchanged: true,
    };
  }

  const now = new Date().toISOString();

  const { academicYearSheetId, schoolSheetId, auditSheetId } = await getRequiredSheetIds();

  const requests = [];

  const oldYearData = academicYears.map((year) => ({
    academic_year_id: year.academic_year_id,
    academic_year_status: year.academic_year_status,
  }));

  const newYearData = academicYears.map((year) => ({
    academic_year_id: year.academic_year_id,
    academic_year_status: year.academic_year_id === academicYearId ? "active" : "inactive",
  }));

  // Sinkronisasi seluruh status tahun ajaran.
  for (const year of academicYears) {
    const newStatus = year.academic_year_id === academicYearId ? "active" : "inactive";

    if (year.academic_year_status === newStatus) {
      continue;
    }

    requests.push({
      updateCells: {
        range: {
          sheetId: academicYearSheetId,
          startRowIndex: year.row_number - 1,
          endRowIndex: year.row_number,
          startColumnIndex: 4,
          endColumnIndex: 7,
        },
        rows: [
          {
            values: toCellData([newStatus, year.created_at, now]),
          },
        ],
        fields: "userEnteredValue",
      },
    });
  }

  // Perbarui active_academic_year_id.
  requests.push({
    updateCells: {
      range: {
        sheetId: schoolSheetId,
        startRowIndex: school.row_number - 1,
        endRowIndex: school.row_number,
        startColumnIndex: 7,
        endColumnIndex: 8,
      },
      rows: [
        {
          values: toCellData([academicYearId]),
        },
      ],
      fields: "userEnteredValue",
    },
  });

  // Perbarui updated_at informasi sekolah.
  requests.push({
    updateCells: {
      range: {
        sheetId: schoolSheetId,
        startRowIndex: school.row_number - 1,
        endRowIndex: school.row_number,
        startColumnIndex: 9,
        endColumnIndex: 10,
      },
      rows: [
        {
          values: toCellData([now]),
        },
      ],
      fields: "userEnteredValue",
    },
  });

  const auditRow = await prepareAdministrativeAudit({
    ...auditData,
    action_type: "ACADEMIC_YEAR_ACTIVATED",
    table_name: SHEET_NAME,
    record_id: academicYearId,
    old_data: {
      active_academic_year_id: previousActiveYearId,
      academic_years: oldYearData,
    },
    new_data: {
      active_academic_year_id: academicYearId,
      academic_years: newYearData,
    },
  });

  requests.push({
    appendCells: {
      sheetId: auditSheetId,
      rows: [
        {
          values: toCellData(auditRow),
        },
      ],
      fields: "userEnteredValue",
    },
  });

  const sheets = await getGoogleSheetsClient();

  // Semua perubahan berhasil bersama-sama atau tidak diterapkan.
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests,
    },
  });

  return {
    success: true,
    academic_year_id: academicYearId,
  };
}

// Kompatibilitas untuk school-initialization-service.
export async function getAcademicYears() {
  return getAllAcademicYears();
}
