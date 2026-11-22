// src/repositories/teacher-assignment-repository-bulk.js
import "server-only";

import { getGoogleSheetsClient } from "@/lib/google-sheets";
import { TEACHER_ASSIGNMENT_HEADERS } from "@/config/teacher-assignment-config";
import { getAllTeacherAssignments } from "@/repositories/teacher-assignment-repository";
import { prepareAdministrativeAudits } from "@/repositories/administrative-audit-repository";

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const SHEET_NAME = "Teacher_Assignments";
const AUDIT_SHEET_NAME = "Administrative_Audit_Logs";

function toCellData(values) {
  return values.map((value) => ({
    userEnteredValue: {
      stringValue: String(value ?? ""),
    },
  }));
}

function isValidDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function getPreviousDate(value) {
  const date = new Date(`${value}T00:00:00.000Z`);

  date.setUTCDate(date.getUTCDate() - 1);

  return date.toISOString().slice(0, 10);
}

async function getRequiredSheetIds(sheets) {
  const response = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    fields: "sheets.properties",
  });

  const properties = response.data.sheets || [];

  const assignmentSheet = properties.find((item) => item.properties.title === SHEET_NAME);

  const auditSheet = properties.find((item) => item.properties.title === AUDIT_SHEET_NAME);

  if (!assignmentSheet || !auditSheet) {
    throw new Error("REQUIRED_SHEET_NOT_FOUND");
  }

  return {
    assignmentSheetId: assignmentSheet.properties.sheetId,
    auditSheetId: auditSheet.properties.sheetId,
  };
}

export async function bulkEndTeacherAssignments(items, auditData) {
  const assignments = await getAllTeacherAssignments();

  const uniqueItems = [...new Map(items.filter((item) => item && typeof item.assignment_id === "string" && item.assignment_id.trim()).map((item) => [item.assignment_id, item])).values()];

  const results = [];
  const validUpdates = [];

  for (const item of uniqueItems) {
    try {
      const assignment = assignments.find((record) => record.assignment_id === item.assignment_id);

      if (!assignment) {
        throw new Error("TEACHER_ASSIGNMENT_NOT_FOUND");
      }

      if (assignment.effective_to) {
        throw new Error("TEACHER_ASSIGNMENT_ALREADY_ENDED");
      }

      const effectiveTo = item.effective_to;

      if (!isValidDate(effectiveTo)) {
        throw new Error("INVALID_EFFECTIVE_TO");
      }

      if (effectiveTo < getPreviousDate(assignment.effective_from)) {
        throw new Error("INVALID_ASSIGNMENT_PERIOD");
      }
      validUpdates.push({
        assignment,
        effective_to: effectiveTo,
        reason: item.reason || "Bulk mengakhiri penugasan oleh administrator.",
      });

      results.push({
        assignment_id: item.assignment_id,
        success: false,
        pending: true,
      });
    } catch (error) {
      results.push({
        assignment_id: item.assignment_id,
        success: false,
        reason: error.message || "ASSIGNMENT_END_FAILED",
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

  const auditDataList = validUpdates.map(({ assignment, effective_to, reason }) => {
    const oldData = Object.fromEntries(TEACHER_ASSIGNMENT_HEADERS.map((header) => [header, assignment[header] ?? ""]));

    const newData = {
      ...oldData,
      effective_to,
      updated_at: now,
    };

    return {
      ...auditData,
      action_type: "TEACHER_ASSIGNMENT_ENDED",
      table_name: SHEET_NAME,
      record_id: assignment.assignment_id,
      old_data: oldData,
      new_data: newData,
      reason,
    };
  });

  const auditRows = await prepareAdministrativeAudits(auditDataList);

  const sheets = await getGoogleSheetsClient();

  const { assignmentSheetId, auditSheetId } = await getRequiredSheetIds(sheets);

  const requests = validUpdates.map(({ assignment, effective_to }) => {
    const updatedAssignment = {
      ...assignment,
      effective_to,
      updated_at: now,
    };

    const values = TEACHER_ASSIGNMENT_HEADERS.map((header) => updatedAssignment[header] ?? "");

    return {
      updateCells: {
        range: {
          sheetId: assignmentSheetId,
          startRowIndex: assignment.row_number - 1,
          endRowIndex: assignment.row_number,
          startColumnIndex: 0,
          endColumnIndex: TEACHER_ASSIGNMENT_HEADERS.length,
        },
        rows: [
          {
            values: toCellData(values),
          },
        ],
        fields: "userEnteredValue",
      },
    };
  });

  requests.push({
    appendCells: {
      sheetId: auditSheetId,
      rows: auditRows.map((row) => ({
        values: toCellData(row),
      })),
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

    const successfulIds = new Set(validUpdates.map(({ assignment }) => assignment.assignment_id));

    for (const result of results) {
      if (successfulIds.has(result.assignment_id)) {
        result.success = true;
        delete result.pending;
      }
    }
  } catch (error) {
    for (const result of results) {
      if (result.pending) {
        result.reason = error.message || "ASSIGNMENT_END_FAILED";

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
