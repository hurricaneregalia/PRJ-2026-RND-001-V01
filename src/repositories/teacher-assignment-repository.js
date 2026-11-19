// src/repositories/teacher-assignment-repository.js
import "server-only";

import { randomUUID } from "node:crypto";
import { getGoogleSheetsClient } from "@/lib/google-sheets";
import {
  TEACHER_ASSIGNMENT_HEADERS,
} from "@/config/teacher-assignment-config";
import {
  prepareAdministrativeAudit,
} from "@/repositories/administrative-audit-repository";

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const SHEET_NAME = "Teacher_Assignments";
const AUDIT_SHEET_NAME = "Administrative_Audit_Logs";

async function getAssignmentsData() {
  const sheets = await getGoogleSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:G`,
  });

  const rows = response.data.values || [];

  if (!rows.length) {
    throw new Error("TEACHER_ASSIGNMENT_HEADERS_NOT_FOUND");
  }

  const validHeaders =
    rows[0].length === TEACHER_ASSIGNMENT_HEADERS.length &&
    TEACHER_ASSIGNMENT_HEADERS.every(
      (header, index) => header === rows[0][index]
    );

  if (!validHeaders) {
    throw new Error("TEACHER_ASSIGNMENT_HEADERS_INVALID");
  }

  return rows;
}

function mapAssignmentRows(rows) {
  return rows.slice(1).map((row, index) => ({
    ...Object.fromEntries(
      TEACHER_ASSIGNMENT_HEADERS.map((header, columnIndex) => [
        header,
        row[columnIndex] ?? "",
      ])
    ),
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

  const assignmentSheet = properties.find(
    (item) => item.properties.title === SHEET_NAME
  );

  const auditSheet = properties.find(
    (item) => item.properties.title === AUDIT_SHEET_NAME
  );

  if (!assignmentSheet || !auditSheet) {
    throw new Error("REQUIRED_SHEET_NOT_FOUND");
  }

  return {
    assignmentSheetId: assignmentSheet.properties.sheetId,
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

export async function getAllTeacherAssignments() {
  const rows = await getAssignmentsData();
  return mapAssignmentRows(rows);
}

export async function getTeacherAssignmentById(assignmentId) {
  if (
    typeof assignmentId !== "string" ||
    !assignmentId.trim()
  ) {
    return null;
  }

  const assignments = await getAllTeacherAssignments();

  return assignments.find(
    (item) => item.assignment_id === assignmentId
  ) || null;
}

export async function getTeacherAssignmentsByTeacherId(userId) {
  if (typeof userId !== "string" || !userId.trim()) {
    return [];
  }

  const assignments = await getAllTeacherAssignments();

  return assignments.filter(
    (item) => item.user_id === userId
  );
}

export async function getTeacherAssignmentsByClassId(classId) {
  if (typeof classId !== "string" || !classId.trim()) {
    return [];
  }

  const assignments = await getAllTeacherAssignments();

  return assignments.filter(
    (item) => item.class_id === classId
  );
}

export async function getActiveTeacherAssignments(userId) {
  const assignments = await getTeacherAssignmentsByTeacherId(userId);

  return assignments.filter(
    (item) => !item.effective_to
  );
}

export async function createTeacherAssignment(data, auditData) {
  const assignments = await getAllTeacherAssignments();

  if (
    typeof data.user_id !== "string" ||
    !data.user_id.trim() ||
    typeof data.class_id !== "string" ||
    !data.class_id.trim() ||
    typeof data.effective_from !== "string" ||
    !data.effective_from.trim() ||
    !Number.isFinite(Date.parse(data.effective_from))
  ) {
    throw new Error("INVALID_TEACHER_ASSIGNMENT_DATA");
  }

  const duplicate = assignments.some(
    (item) =>
      item.user_id === data.user_id &&
      item.class_id === data.class_id &&
      !item.effective_to
  );

  if (duplicate) {
    throw new Error("TEACHER_ASSIGNMENT_ALREADY_ACTIVE");
  }

  const now = new Date().toISOString();

  const assignmentData = [
    randomUUID(),
    data.user_id,
    data.class_id,
    data.effective_from,
    "",
    now,
    now,
  ];

  const newData = Object.fromEntries(
    TEACHER_ASSIGNMENT_HEADERS.map((header, index) => [
      header,
      assignmentData[index],
    ])
  );

  const auditRow = await prepareAdministrativeAudit({
    ...auditData,
    action_type: "TEACHER_ASSIGNED_TO_CLASS",
    table_name: SHEET_NAME,
    record_id: assignmentData[0],
    old_data: null,
    new_data: newData,
  });

  const { assignmentSheetId, auditSheetId } =
    await getRequiredSheetIds();

  const sheets = await getGoogleSheetsClient();

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [
        {
          appendCells: {
            sheetId: assignmentSheetId,
            rows: [
              {
                values: toCellData(assignmentData),
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
    assignment_id: assignmentData[0],
  };
}

export async function endTeacherAssignment(
  assignmentId,
  effectiveTo,
  auditData
) {
  const assignments = await getAllTeacherAssignments();

  const assignment = assignments.find(
    (item) => item.assignment_id === assignmentId
  );

  if (!assignment) {
    throw new Error("TEACHER_ASSIGNMENT_NOT_FOUND");
  }

  if (assignment.effective_to) {
    throw new Error("TEACHER_ASSIGNMENT_ALREADY_ENDED");
  }

  if (
    typeof effectiveTo !== "string" ||
    !effectiveTo.trim() ||
    !Number.isFinite(Date.parse(effectiveTo)) ||
    effectiveTo < assignment.effective_from
  ) {
    throw new Error("INVALID_TEACHER_ASSIGNMENT_END_DATE");
  }

  const updatedAssignment = {
    ...assignment,
    effective_to: effectiveTo,
    updated_at: new Date().toISOString(),
  };

  const values = TEACHER_ASSIGNMENT_HEADERS.map(
    (header) => updatedAssignment[header] ?? ""
  );

  const oldData = Object.fromEntries(
    TEACHER_ASSIGNMENT_HEADERS.map((header) => [
      header,
      assignment[header] ?? "",
    ])
  );

  const newData = Object.fromEntries(
    TEACHER_ASSIGNMENT_HEADERS.map((header, index) => [
      header,
      values[index],
    ])
  );

  const auditRow = await prepareAdministrativeAudit({
    ...auditData,
    action_type: "TEACHER_ASSIGNMENT_ENDED",
    table_name: SHEET_NAME,
    record_id: assignmentId,
    old_data: oldData,
    new_data: newData,
  });

  const { assignmentSheetId, auditSheetId } =
    await getRequiredSheetIds();

  const sheets = await getGoogleSheetsClient();

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [
        {
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
