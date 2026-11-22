// src/repositories/class-repository-bulk.js
import "server-only";

import { getGoogleSheetsClient } from "@/lib/google-sheets";
import { CLASS_HEADERS } from "@/config/class-config";
import { getAllClasses } from "@/repositories/class-repository";
import { prepareAdministrativeAudits } from "@/repositories/administrative-audit-repository";

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const SHEET_NAME = "Classes";
const AUDIT_SHEET_NAME = "Administrative_Audit_Logs";

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

export async function bulkUpdateClassStatus(classIds, status, auditData) {
  const classes = await getAllClasses();

  const uniqueClassIds = [...new Set(classIds)];
  const results = [];
  const validUpdates = [];

  for (const classId of uniqueClassIds) {
    try {
      if (!classId || typeof classId !== "string") {
        throw new Error("CLASS_ID_REQUIRED");
      }

      const existing = classes.find((item) => item.class_id === classId);

      if (!existing) {
        throw new Error("CLASS_NOT_FOUND");
      }

      if (!existing.class_name.trim()) {
        throw new Error("INVALID_CLASS_DATA");
      }

      if (!["active", "inactive"].includes(status)) {
        throw new Error("INVALID_CLASS_STATUS");
      }

      const duplicate = classes.some((item) => item.class_id !== classId && item.class_name.toLowerCase() === existing.class_name.toLowerCase());

      if (duplicate) {
        throw new Error("CLASS_ALREADY_EXISTS");
      }

      validUpdates.push({
        class_id: classId,
        existing,
      });

      results.push({
        class_id: classId,
        success: false,
        pending: true,
      });
    } catch (error) {
      results.push({
        class_id: classId,
        success: false,
        reason: error.message || "CLASS_UPDATE_FAILED",
      });
    }
  }

  if (validUpdates.length === 0) {
    return {
      success: false,
      total: results.length,
      succeeded: 0,
      failed: results.length,
      results,
    };
  }

  const now = new Date().toISOString();

  const auditDataList = validUpdates.map(({ class_id, existing }) => ({
    ...auditData,
    action_type: "UPDATE",
    table_name: SHEET_NAME,
    record_id: class_id,
    old_data: {
      class_id: existing.class_id,
      class_name: existing.class_name,
      class_status: existing.class_status,
      created_at: existing.created_at,
      updated_at: existing.updated_at,
    },
    new_data: {
      class_id: existing.class_id,
      class_name: existing.class_name,
      class_status: status,
      created_at: existing.created_at,
      updated_at: now,
    },
  }));

  const auditRows = await prepareAdministrativeAudits(auditDataList);

  const sheets = await getGoogleSheetsClient();

  const { classesSheetId, auditSheetId } = await getRequiredSheetIds(sheets);

  const requests = validUpdates.map(({ class_id, existing }) => ({
    updateCells: {
      range: {
        sheetId: classesSheetId,
        startRowIndex: existing.row_number - 1,
        endRowIndex: existing.row_number,
        startColumnIndex: 0,
        endColumnIndex: CLASS_HEADERS.length,
      },
      rows: [toRowData([class_id, existing.class_name, status, existing.created_at, now])],
      fields: "userEnteredValue",
    },
  }));

  requests.push({
    appendCells: {
      sheetId: auditSheetId,
      rows: auditRows.map(toRowData),
      fields: "userEnteredValue",
    },
  });

  try {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests,
      },
    });

    const successfulIds = new Set(validUpdates.map((item) => item.class_id));

    for (const result of results) {
      if (successfulIds.has(result.class_id)) {
        result.success = true;
        delete result.pending;
      }
    }
  } catch (error) {
    for (const result of results) {
      if (result.pending) {
        result.reason = error.message || "CLASS_UPDATE_FAILED";
        delete result.pending;
      }
    }
  }

  const succeeded = results.filter((item) => item.success).length;
  const failed = results.length - succeeded;

  return {
    success: failed === 0,
    total: results.length,
    succeeded,
    failed,
    results,
  };
}
