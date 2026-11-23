// src/repositories/attendance-session-repository-write.js

import "server-only";

import { randomUUID } from "node:crypto";
import { getGoogleSheetsClient } from "@/lib/google-sheets";
import { ATTENDANCE_STATUS, ATTENDANCE_SESSION_HEADERS } from "@/config/attendance-config";
import { getAllTeacherAssignments } from "@/repositories/teacher-assignment-repository";
import { getAllClassMembers } from "@/repositories/class-member-repository";
import { prepareAttendanceAudit } from "./attendance-audit-repository";

import {
  SPREADSHEET_ID,
  ATTENDANCE_SESSION_SHEET_NAME,
  ATTENDANCE_RECORD_SHEET_NAME,
} from "./attendance-session-repository-constants";
import {
  getAttendanceSessionsData,
  getRequiredSheetIds,
  toRowData,
  createSessionRow,
  createRecordRow,
  getSessionSnapshot,
  getRecordSnapshot,
} from "./attendance-session-repository-data";
import {
  assertValidSessionData,
  assertTeacherAssignmentActiveOnDate,
  assertNoSessionInSameWeek,
  getActiveClassMembers,
  buildAttendanceRecordStatusMap,
} from "./attendance-session-repository-validation";
import { getAttendanceRecordsBySessionId } from "./attendance-record-repository-read";

export async function createAttendanceSession(data, auditData) {
  const sessionData = assertValidSessionData(data);

  const [assignments, sessions, memberships] = await Promise.all([
    getAllTeacherAssignments(),
    getAttendanceSessionsData(),
    getAllClassMembers(),
  ]);

  assertTeacherAssignmentActiveOnDate(
    assignments,
    sessionData.teacher_user_id,
    sessionData.class_id,
    sessionData.attendance_date,
  );

  assertNoSessionInSameWeek(
    sessions,
    sessionData.teacher_user_id,
    sessionData.class_id,
    sessionData.attendance_date,
  );

  const activeMemberships = getActiveClassMembers(
    memberships,
    sessionData.class_id,
    sessionData.attendance_date,
  );

  const statusMap = buildAttendanceRecordStatusMap(
    data?.student_statuses,
    activeMemberships,
  );

  if (!SPREADSHEET_ID) {
    throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID_MISSING");
  }

  const sheets = await getGoogleSheetsClient();
  const { sessionSheetId, recordSheetId, auditSheetId } = await getRequiredSheetIds(sheets);

  const now = new Date().toISOString();
  const sessionId = randomUUID();
  const createdAt = now;

  const session = {
    session_id: sessionId,
    class_id: sessionData.class_id,
    teacher_user_id: sessionData.teacher_user_id,
    academic_year_id: sessionData.academic_year_id,
    attendance_date: sessionData.attendance_date,
    location_type: sessionData.location_type,
    location_name: sessionData.location_name,
    location_note: sessionData.location_note,
    lesson_material: sessionData.lesson_material,
    created_at: createdAt,
    updated_at: now,
  };

  const records = activeMemberships.map((membership) => ({
    attendance_id: randomUUID(),
    session_id: sessionId,
    student_id: membership.student_id,
    membership_id: membership.membership_id,
    status: statusMap.get(membership.student_id) || ATTENDANCE_STATUS.HADIR,
    created_at: createdAt,
    updated_at: now,
  }));

  const requests = [
    {
      appendCells: {
        sheetId: sessionSheetId,
        rows: [toRowData(createSessionRow(session))],
        fields: "userEnteredValue",
      },
    },
  ];

  if (records.length > 0) {
    requests.push({
      appendCells: {
        sheetId: recordSheetId,
        rows: records.map((record) => toRowData(createRecordRow(record))),
        fields: "userEnteredValue",
      },
    });
  }

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests,
    },
  });

  return {
    session,
    records,
  };
}

export async function updateAttendanceSession(sessionId, data, auditData) {
  const normalizedSessionId = String(sessionId || "").trim();

  if (!normalizedSessionId) {
    throw new Error("ATTENDANCE_SESSION_ID_REQUIRED");
  }

  const sessions = await getAttendanceSessionsData();
  const existing = sessions.find((session) => session.session_id === normalizedSessionId);

  if (!existing) {
    throw new Error("ATTENDANCE_SESSION_NOT_FOUND");
  }

  const nextSessionData = assertValidSessionData({
    ...existing,
    ...data,
    class_id: data?.class_id || existing.class_id,
    teacher_user_id: data?.teacher_user_id || existing.teacher_user_id,
    attendance_date: data?.attendance_date || existing.attendance_date,
  });

  if (nextSessionData.attendance_date !== existing.attendance_date) {
    throw new Error("ATTENDANCE_SESSION_DATE_IMMUTABLE");
  }

  if (nextSessionData.class_id !== existing.class_id || nextSessionData.teacher_user_id !== existing.teacher_user_id) {
    throw new Error("ATTENDANCE_SESSION_OWNER_IMMUTABLE");
  }

  const oldSnapshot = getSessionSnapshot(existing);
  const newSnapshot = {
    ...oldSnapshot,
    location_type: nextSessionData.location_type,
    location_name: nextSessionData.location_name,
    location_note: nextSessionData.location_note,
    lesson_material: nextSessionData.lesson_material,
    updated_at: new Date().toISOString(),
  };

  const changedLocation =
    existing.location_type !== nextSessionData.location_type ||
    existing.location_name !== nextSessionData.location_name ||
    existing.location_note !== nextSessionData.location_note;

  const changedMaterial = existing.lesson_material !== nextSessionData.lesson_material;

  if (!changedLocation && !changedMaterial) {
    return {
      session_id: existing.session_id,
      ...oldSnapshot,
    };
  }

  if (!SPREADSHEET_ID) {
    throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID_MISSING");
  }

  const sheets = await getGoogleSheetsClient();
  const { sessionSheetId, auditSheetId } = await getRequiredSheetIds(sheets);

  const now = new Date().toISOString();
  newSnapshot.updated_at = now;

  const updatedRow = [
    existing.session_id,
    existing.class_id,
    existing.teacher_user_id,
    existing.academic_year_id,
    existing.attendance_date,
    nextSessionData.location_type,
    nextSessionData.location_name,
    nextSessionData.location_note,
    nextSessionData.lesson_material,
    existing.created_at,
    now,
  ];

  const auditRow = await prepareAttendanceAudit({
    ...auditData,
    session_id: existing.session_id,
    attendance_id: "",
    actor_user_id: auditData?.actor_user_id,
    action_type: changedLocation
      ? "LOCATION_UPDATED"
      : "MATERIAL_UPDATED",
    old_data: oldSnapshot,
    new_data: newSnapshot,
    reason: auditData?.reason || (changedLocation ? "Perubahan lokasi sesi absensi" : "Perubahan materi sesi absensi"),
    changed_at: now,
  });

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [
        {
          updateCells: {
            range: {
              sheetId: sessionSheetId,
              startRowIndex: existing.row_number - 1,
              endRowIndex: existing.row_number,
              startColumnIndex: 0,
              endColumnIndex: ATTENDANCE_SESSION_HEADERS.length,
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
    session_id: existing.session_id,
    class_id: existing.class_id,
    teacher_user_id: existing.teacher_user_id,
    academic_year_id: existing.academic_year_id,
    attendance_date: existing.attendance_date,
    location_type: nextSessionData.location_type,
    location_name: nextSessionData.location_name,
    location_note: nextSessionData.location_note,
    lesson_material: nextSessionData.lesson_material,
    created_at: existing.created_at,
    updated_at: now,
  };
}

export async function deleteAttendanceSession(sessionId, auditData) {
  const normalizedSessionId = String(sessionId || "").trim();

  if (!normalizedSessionId) {
    throw new Error("ATTENDANCE_SESSION_ID_REQUIRED");
  }

  const reason = String(auditData?.reason || "").trim();

  if (!reason) {
    throw new Error("ATTENDANCE_DELETE_REASON_REQUIRED");
  }

  const sessions = await getAttendanceSessionsData();
  const existingSession = sessions.find((session) => session.session_id === normalizedSessionId);

  if (!existingSession) {
    throw new Error("ATTENDANCE_SESSION_NOT_FOUND");
  }

  const records = await getAttendanceRecordsBySessionId(normalizedSessionId);

  if (!SPREADSHEET_ID) {
    throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID_MISSING");
  }

  const sheets = await getGoogleSheetsClient();
  const { sessionSheetId, recordSheetId, auditSheetId } = await getRequiredSheetIds(sheets);

  const now = new Date().toISOString();
  const requests = [];
  const auditRows = [];

  const sessionAuditRow = await prepareAttendanceAudit({
    ...auditData,
    session_id: existingSession.session_id,
    attendance_id: "",
    actor_user_id: auditData?.actor_user_id,
    action_type: "SESSION_DELETED",
    old_data: getSessionSnapshot(existingSession),
    new_data: null,
    reason,
    changed_at: now,
  });

  auditRows.push(sessionAuditRow);

  for (const record of records) {
    const recordAuditRow = await prepareAttendanceAudit({
      ...auditData,
      session_id: existingSession.session_id,
      attendance_id: record.attendance_id,
      actor_user_id: auditData?.actor_user_id,
      action_type: "RECORD_DELETED",
      old_data: getRecordSnapshot(record),
      new_data: null,
      reason,
      changed_at: now,
    });

    auditRows.push(recordAuditRow);
  }

  requests.push({
    appendCells: {
      sheetId: auditSheetId,
      rows: auditRows.map(toRowData),
      fields: "userEnteredValue",
    },
  });

  const recordRowIndexes = records
    .map((record) => record.row_number - 1)
    .sort((a, b) => b - a);

  for (const rowIndex of recordRowIndexes) {
    requests.push({
      deleteDimension: {
        range: {
          sheetId: recordSheetId,
          dimension: "ROWS",
          startIndex: rowIndex,
          endIndex: rowIndex + 1,
        },
      },
    });
  }

  requests.push({
    deleteDimension: {
      range: {
        sheetId: sessionSheetId,
        dimension: "ROWS",
        startIndex: existingSession.row_number - 1,
        endIndex: existingSession.row_number,
      },
    },
  });

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests,
    },
  });

  return {
    session_id: existingSession.session_id,
    deleted_records: records.length,
  };
}