// src/repositories/student-repository.js

import "server-only";

import { randomUUID } from "node:crypto";
import { getGoogleSheetsClient } from "@/lib/google-sheets";
import { STUDENT_HEADERS, STUDENT_STATUS, STUDENT_GENDER, STUDENT_PARENT_RELATIONS } from "@/config/student-config";
import { prepareAdministrativeAudit } from "@/repositories/administrative-audit-repository";
import { prepareEndStudentClassMemberships } from "@/repositories/class-member-repository";

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const SHEET_NAME = "Students";
const AUDIT_SHEET_NAME = "Administrative_Audit_Logs";

function getTodayWIB() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}`;
}

async function getStudentsData() {
  if (!SPREADSHEET_ID) {
    throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID_MISSING");
  }

  const sheets = await getGoogleSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:J`,
  });

  const rows = response.data.values || [];
  const headers = rows[0] || [];

  if (headers.length !== STUDENT_HEADERS.length || !STUDENT_HEADERS.every((header, index) => headers[index] === header)) {
    throw new Error("INVALID_STUDENTS_HEADERS");
  }

  return rows.slice(1).map((row, index) => ({
    student_id: row[0] || "",
    student_number: row[1] || "",
    full_name: row[2] || "",
    gender: row[3] || "",
    parent_name: row[4] || "",
    parent_relation: row[5] || "",
    parent_whatsapp: row[6] || "",
    student_status: row[7] || "",
    created_at: row[8] || "",
    updated_at: row[9] || "",
    row_number: index + 2,
  }));
}

async function getRequiredSheetIds(sheets) {
  const response = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    fields: "sheets.properties",
  });

  const properties = response.data.sheets || [];

  const studentsSheet = properties.find((sheet) => sheet.properties.title === SHEET_NAME);

  const auditSheet = properties.find((sheet) => sheet.properties.title === AUDIT_SHEET_NAME);

  if (!studentsSheet || !auditSheet) {
    throw new Error("REQUIRED_SHEET_NOT_FOUND");
  }

  return {
    studentsSheetId: studentsSheet.properties.sheetId,
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

function normalizeStudentNumber(value) {
  return String(value ?? "").trim();
}

function assertValidStudentData(data) {
  const studentNumber = normalizeStudentNumber(data?.student_number);
  const fullName = String(data?.full_name ?? "").trim();
  const gender = String(data?.gender ?? "").trim();
  const parentName = String(data?.parent_name ?? "").trim();
  const parentRelation = String(data?.parent_relation ?? "").trim();
  const parentWhatsapp = String(data?.parent_whatsapp ?? "").trim();
  const studentStatus = String(data?.student_status ?? "").trim();

  if (studentNumber.length > 50) {
    throw new Error("INVALID_STUDENT_NUMBER");
  }

  if (!fullName || fullName.length > 150) {
    throw new Error("INVALID_STUDENT_NAME");
  }

  if (!Object.values(STUDENT_STATUS).includes(studentStatus)) {
    throw new Error("INVALID_STUDENT_STATUS");
  }

  if (!Object.values(STUDENT_GENDER).includes(gender)) {
    throw new Error("INVALID_STUDENT_GENDER");
  }

  if (!parentName || parentName.length > 150) {
    throw new Error("INVALID_PARENT_NAME");
  }

  if (!STUDENT_PARENT_RELATIONS.includes(parentRelation)) {
    throw new Error("INVALID_PARENT_RELATION");
  }

  if (!parentWhatsapp || parentWhatsapp.length > 30) {
    throw new Error("INVALID_PARENT_WHATSAPP");
  }

  return {
    student_number: studentNumber,
    full_name: fullName,
    gender,
    parent_name: parentName,
    parent_relation: parentRelation,
    parent_whatsapp: parentWhatsapp,
    student_status: studentStatus,
  };
}

async function assertUniqueStudentNumber(studentNumber, excludeStudentId = null) {
  if (!studentNumber) {
    return;
  }

  const normalizedNumber = studentNumber.toLowerCase();
  const students = await getStudentsData();

  const duplicate = students.some((student) => student.student_id !== excludeStudentId && student.student_number.toLowerCase() === normalizedNumber);

  if (duplicate) {
    throw new Error("STUDENT_NUMBER_ALREADY_EXISTS");
  }
}

function shouldEndClassMembership(existingStatus, newStatus) {
  const terminalStatuses = [STUDENT_STATUS.GRADUATED, STUDENT_STATUS.TRANSFERRED];

  return existingStatus !== newStatus && terminalStatuses.includes(newStatus);
}

export async function getAllStudents() {
  return getStudentsData();
}

export async function getStudentById(studentId) {
  if (!studentId) {
    throw new Error("STUDENT_ID_REQUIRED");
  }

  const students = await getStudentsData();

  return students.find((student) => student.student_id === studentId) || null;
}

export async function getStudentByNumber(studentNumber) {
  const normalizedNumber = normalizeStudentNumber(studentNumber);

  if (!normalizedNumber) {
    return null;
  }

  const students = await getStudentsData();

  return students.find((student) => student.student_number.toLowerCase() === normalizedNumber.toLowerCase()) || null;
}

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

  // Tutup keanggotaan jika status berubah menjadi
  // graduated atau transferred.
  if (shouldEndClassMembership(existing.student_status, studentData.student_status)) {
    const effectiveDate = getTodayWIB();

    const membershipChanges = await prepareEndStudentClassMemberships(studentId, effectiveDate, {
      ...auditData,
      reason: auditData?.reason || `Perubahan status siswa menjadi ${studentData.student_status}`,
    });

    requests.push(...membershipChanges.requests);
  }

  // Audit perubahan data siswa.
  requests.push({
    appendCells: {
      sheetId: auditSheetId,
      rows: [toRowData(studentAuditRow)],
      fields: "userEnteredValue",
    },
  });

  // Seluruh perubahan siswa, keanggotaan, dan audit
  // dijalankan dalam satu batchUpdate.
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
