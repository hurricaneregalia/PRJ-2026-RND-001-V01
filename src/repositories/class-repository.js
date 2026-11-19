// src/repositories/class-repository.js
import "server-only";

import { randomUUID } from "node:crypto";
import { getGoogleSheetsClient } from "@/lib/google-sheets";
import { CLASS_HEADERS } from "@/config/class-config";
import { prepareAdministrativeAudit } from "@/repositories/administrative-audit-repository";

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const SHEET_NAME = "Classes";
const AUDIT_SHEET_NAME = "Administrative_Audit_Logs";

async function getClassesData() {
  const sheets = await getGoogleSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:E`,
  });

  const rows = response.data.values || [];
  const headers = rows[0] || [];

  if (headers.length !== CLASS_HEADERS.length || !CLASS_HEADERS.every((header, index) => headers[index] === header)) {
    throw new Error("INVALID_CLASSES_HEADERS");
  }

  return rows.slice(1).map((row, index) => ({
    class_id: row[0] || "",
    class_name: row[1] || "",
    class_status: row[2] || "",
    created_at: row[3] || "",
    updated_at: row[4] || "",
    row_number: index + 2,
  }));
}

async function getRequiredSheetIds(sheets) {
  const response = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    fields: "sheets.properties",
  });

  const properties = response.data.sheets || [];

  const classesSheet = properties.find((sheet) => sheet.properties.title === SHEET_NAME);

  const auditSheet = properties.find((sheet) => sheet.properties.title === AUDIT_SHEET_NAME);

  if (!classesSheet || !auditSheet) {
    throw new Error("REQUIRED_SHEET_NOT_FOUND");
  }

  return {
    classesSheetId: classesSheet.properties.sheetId,
    auditSheetId: auditSheet.properties.sheetId,
  };
}

function toCellData(value) {
  return {
    userEnteredValue: {
      stringValue: String(value ?? ""),
    },
  };
}

function toRowData(values) {
  return {
    values: values.map(toCellData),
  };
}

export async function getAllClasses() {
  return getClassesData();
}

export async function getClassById(classId) {
  const classes = await getClassesData();

  return classes.find((item) => item.class_id === classId) || null;
}

export async function createClass(data, auditData) {
  const className = String(data.class_name || "").trim();

  if (!className) {
    throw new Error("INVALID_CLASS_DATA");
  }

  const classes = await getClassesData();

  const duplicate = classes.some((item) => item.class_name.toLowerCase() === className.toLowerCase());

  if (duplicate) {
    throw new Error("CLASS_ALREADY_EXISTS");
  }

  const sheets = await getGoogleSheetsClient();

  const { classesSheetId, auditSheetId } = await getRequiredSheetIds(sheets);

  const now = new Date().toISOString();
  const classId = randomUUID();

  const row = [classId, className, data.class_status || "active", now, now];

  // Siapkan data audit sebelum penulisan ke Google Sheets.
  const auditRow = await prepareAdministrativeAudit({
    ...auditData,
    action_type: "CREATE",
    table_name: SHEET_NAME,
    record_id: classId,
    new_data: {
      class_id: classId,
      class_name: className,
      class_status: row[2],
      created_at: now,
      updated_at: now,
    },
  });

  // Data kelas dan audit ditulis dalam satu batch.
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [
        {
          appendCells: {
            sheetId: classesSheetId,
            rows: [toRowData(row)],
            fields: "userEnteredValue",
          },
        },
        {
          appendCells: {
            sheetId: auditSheetId,
            rows: [toRowData(auditRow)],
            fields: "userEnteredValue",
          },
        },
      ],
    },
  });

  return {
    class_id: classId,
    class_name: className,
    class_status: row[2],
    created_at: now,
    updated_at: now,
  };
}

export async function updateClass(classId, data, auditData) {
  const classes = await getClassesData();

  const existing = classes.find((item) => item.class_id === classId);

  if (!existing) {
    throw new Error("CLASS_NOT_FOUND");
  }

  const className = data.class_name !== undefined ? String(data.class_name).trim() : existing.class_name;

  const classStatus = data.class_status !== undefined ? String(data.class_status).trim() : existing.class_status;

  if (!className) {
    throw new Error("INVALID_CLASS_DATA");
  }

  if (!["active", "inactive"].includes(classStatus)) {
    throw new Error("INVALID_CLASS_STATUS");
  }

  const duplicate = classes.some((item) => item.class_id !== classId && item.class_name.toLowerCase() === className.toLowerCase());

  if (duplicate) {
    throw new Error("CLASS_ALREADY_EXISTS");
  }

  const sheets = await getGoogleSheetsClient();

  const { classesSheetId, auditSheetId } = await getRequiredSheetIds(sheets);

  const now = new Date().toISOString();

  const updatedRow = [classId, className, classStatus, existing.created_at, now];

  // Siapkan data audit sebelum penulisan ke Google Sheets.
  const auditRow = await prepareAdministrativeAudit({
    ...auditData,
    action_type: "UPDATE",
    table_name: SHEET_NAME,
    record_id: classId,
    old_data: {
      class_id: existing.class_id,
      class_name: existing.class_name,
      class_status: existing.class_status,
      created_at: existing.created_at,
      updated_at: existing.updated_at,
    },
    new_data: {
      class_id: classId,
      class_name: className,
      class_status: classStatus,
      created_at: existing.created_at,
      updated_at: now,
    },
  });

  // Perubahan kelas dan pencatatan audit dilakukan dalam satu batch.
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [
        {
          updateCells: {
            range: {
              sheetId: classesSheetId,
              startRowIndex: existing.row_number - 1,
              endRowIndex: existing.row_number,
              startColumnIndex: 0,
              endColumnIndex: CLASS_HEADERS.length,
            },
            rows: [toRowData(updatedRow)],
            fields: "userEnteredValue",
          },
        },
        {
          appendCells: {
            sheetId: auditSheetId,
            rows: [toRowData(auditRow)],
            fields: "userEnteredValue",
          },
        },
      ],
    },
  });

  return {
    class_id: classId,
    class_name: className,
    class_status: classStatus,
    created_at: existing.created_at,
    updated_at: now,
  };
}
