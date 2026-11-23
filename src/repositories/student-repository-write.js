// src/repositories/student-repository-write.js

import "server-only";

import { randomUUID } from "node:crypto";
import { getGoogleSheetsClient } from "@/lib/google-sheets";
import { STUDENT_HEADERS, STUDENT_STATUS } from "@/config/student-config";
import { prepareAdministrativeAudit } from "@/repositories/administrative-audit-repository";
import { prepareEndStudentClassMemberships } from "@/repositories/class-member-repository";
import { getTodayWIB } from "@/lib/attendance-date-utils";

import { SPREADSHEET_ID, SHEET_NAME, AUDIT_SHEET_NAME } from "./student-repository-constants";
import {
  getStudentsData,
  getRequiredSheetIds,
  toCellData,
  toRowData,
} from "./student-repository-data";
import {
  assertValidStudentData,
  assertUniqueStudentNumber,
  shouldEndClassMembership,
} from "./student-repository-validation";

export async function createStudent(data, auditData) {
  const studentData = assertValidStudentData(data);

  await assertUniqueStudentNumber(studentData.student_number);

  if (!SPREADSHEET_ID) {
    throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID_MISSING");
  }

  const sheets = await getGoogleSheetsClient();
  const { studentsSheetId, auditSheetId } = await getRequiredSheetIds(sheets);

  const now = new Date().toISOString();
  const studentId = randomUUID();

  const row = [
    studentId,
    studentData.student_number,
    studentData.full_name,
    studentData.gender,
    studentData.parent_name,
    studentData.parent_relation,
    studentData.parent_whatsapp,
    studentData.student_status,
    now,
    now,
  ];

  const auditRow = await prepareAdministrativeAudit({
    ...auditData,
    action_type: "CREATE",
    table_name: SHEET_NAME,
    record_id: studentId,
    new_data: {
      student_id: studentId,
      ...studentData,
      created_at: now,
      updated_at: now,
    },
  });

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [
        {
          appendCells: {
            sheetId: studentsSheetId,
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
    student_id: studentId,
    ...studentData,
    created_at: now,
    updated_at: now,
  };
}

export async function createStudentsBulk(dataList, auditData) {
  if (!Array.isArray(dataList) || dataList.length === 0) {
    throw new Error("STUDENT_BULK_DATA_REQUIRED");
  }

  if (!SPREADSHEET_ID) {
    throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID_MISSING");
  }

  const studentsData = dataList.map((data, index) => {
    try {
      return assertValidStudentData(data);
    } catch (error) {
      throw new Error(`STUDENT_BULK_INVALID_DATA:${index + 1}:${error.message}`);
    }
  });

  const existingStudents = await getStudentsData();
  const existingNumbers = new Set(existingStudents.map((student) => student.student_number.trim().toLowerCase()).filter(Boolean));
  const batchNumbers = new Set();

  studentsData.forEach((student, index) => {
    const normalizedNumber = student.student_number.toLowerCase();

    if (!normalizedNumber) {
      return;
    }

    if (existingNumbers.has(normalizedNumber)) {
      throw new Error(`STUDENT_BULK_DUPLICATE_EXISTING:${index + 1}`);
    }

    if (batchNumbers.has(normalizedNumber)) {
      throw new Error(`STUDENT_BULK_DUPLICATE_INPUT:${index + 1}`);
    }

    batchNumbers.add(normalizedNumber);
  });

  const sheets = await getGoogleSheetsClient();
  const { studentsSheetId, auditSheetId } = await getRequiredSheetIds(sheets);

  const now = new Date().toISOString();

  const createdStudents = studentsData.map((studentData) => ({
    student_id: randomUUID(),
    ...studentData,
    student_status: STUDENT_STATUS.ACTIVE,
    created_at: now,
    updated_at: now,
  }));

  const studentRows = createdStudents.map((student) =>
    toRowData([
      student.student_id,
      student.student_number,
      student.full_name,
      student.gender,
      student.parent_name,
      student.parent_relation,
      student.parent_whatsapp,
      student.student_status,
      student.created_at,
      student.updated_at,
    ]),
  );

  const auditRows = await Promise.all(
    createdStudents.map(async (student) => {
      const auditRow = await prepareAdministrativeAudit({
        ...auditData,
        action_type: "CREATE",
        table_name: SHEET_NAME,
        record_id: student.student_id,
        new_data: student,
      });

      return toRowData(auditRow);
    }),
  );

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [
        {
          appendCells: {
            sheetId: studentsSheetId,
            rows: studentRows,
            fields: "userEnteredValue",
          },
        },
        {
          appendCells: {
            sheetId: auditSheetId,
            rows: auditRows,
            fields: "userEnteredValue",
          },
        },
      ],
    },
  });

  return createdStudents;
}

export async function updateStudent(studentId, data, auditData) {
  if (!studentId) {
    throw new Error("STUDENT_ID_REQUIRED");
  }

  const students = await getStudentsData();
  const existing = students.find((student) => student.student_id === studentId);

  if (!existing) {
    throw new Error("STUDENT_NOT_FOUND");
  }

  const studentData = assertValidStudentData({
    ...existing,
    ...data,
  });

  await assertUniqueStudentNumber(studentData.student_number, studentId);

  if (!SPREADSHEET_ID) {
    throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID_MISSING");
  }

  const sheets = await getGoogleSheetsClient();
  const { studentsSheetId, auditSheetId } = await getRequiredSheetIds(sheets);

  const now = new Date().toISOString();

  const updatedRow = [
    studentId,
    studentData.student_number,
    studentData.full_name,
    studentData.gender,
    studentData.parent_name,
    studentData.parent_relation,
    studentData.parent_whatsapp,
    studentData.student_status,
    existing.created_at,
    now,
  ];

  const oldData = {
    student_id: existing.student_id,
    student_number: existing.student_number,
    full_name: existing.full_name,
    gender: existing.gender,
    parent_name: existing.parent_name,
    parent_relation: existing.parent_relation,
    parent_whatsapp: existing.parent_whatsapp,
    student_status: existing.student_status,
    created_at: existing.created_at,
    updated_at: existing.updated_at,
  };

  const newData = {
    student_id: studentId,
    ...studentData,
    created_at: existing.created_at,
    updated_at: now,
  };

  const studentAuditRow = await prepareAdministrativeAudit({
    ...auditData,
    action_type: "UPDATE",
    table_name: SHEET_NAME,
    record_id: studentId,
    old_data: oldData,
    new_data: newData,
  });

  const requests = [
    {
      updateCells: {
        range: {
          sheetId: studentsSheetId,
          startRowIndex: existing.row_number - 1,
          endRowIndex: existing.row_number,
          startColumnIndex: 0,
          endColumnIndex: STUDENT_HEADERS.length,
        },
        rows: [toRowData(updatedRow)],
        fields: "userEnteredValue",
      },
    },
  ];

  if (shouldEndClassMembership(existing.student_status, studentData.student_status)) {
    const effectiveDate = getTodayWIB();

    const membershipChanges = await prepareEndStudentClassMemberships(studentId, effectiveDate, {
      ...auditData,
      reason: auditData?.reason || `Perubahan status siswa menjadi ${studentData.student_status}`,
    });

    requests.push(...membershipChanges.requests);
  }

  requests.push({
    appendCells: {
      sheetId: auditSheetId,
      rows: [toRowData(studentAuditRow)],
      fields: "userEnteredValue",
    },
  });

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests,
    },
  });

  return {
    student_id: studentId,
    ...studentData,
    created_at: existing.created_at,
    updated_at: now,
  };
}
