// src/repositories/attendance-record-repository-write.js

import "server-only";

import { randomUUID } from "node:crypto";
import { getGoogleSheetsClient } from "@/lib/google-sheets";
import { ATTENDANCE_RECORD_HEADERS } from "@/config/attendance-config";
import { prepareAttendanceAudit } from "./attendance-audit-repository";

import {
  SPREADSHEET_ID,
  ATTENDANCE_RECORD_SHEET_NAME,
} from "./attendance-session-repository-constants";
import {
  getAttendanceRecordsData,
  getRequiredSheetIds,
  toRowData,
  createRecordRow,
  getRecordSnapshot,
} from "./attendance-record-repository-data";
import {
  assertValidRecordData,
  assertValidAttendanceStatus,
} from "./attendance-record-repository-validation";

export async function createAttendanceRecords(recordsData, auditData) {
  if (!Array.isArray(recordsData) || recordsData.length === 0) {
    throw new Error("ATTENDANCE_RECORDS_DATA_REQUIRED");
  }

  const validatedRecords = recordsData.map((recordData, index) => {
    try {
      const validated = assertValidRecordData(recordData);

      if (!validated.attendance_id) {
        validated.attendance_id = randomUUID();
      }

      const now = new Date().toISOString();

      return {
        attendance_id: validated.attendance_id,
        session_id: validated.session_id,
        student_id: validated.student_id,
        membership_id: validated.membership_id,
        status: validated.status,
        created_at: recordData?.created_at || now,
        updated_at: recordData?.updated_at || now,
      };
    } catch (error) {
      throw new Error(`ATTENDANCE_RECORD_INVALID_DATA:${index + 1}:${error.message}`);
    }
  });

  if (!SPREADSHEET_ID) {
    throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID_MISSING");
  }

  const sheets = await getGoogleSheetsClient();
  const { recordSheetId } = await getRequiredSheetIds(sheets);

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [
        {
          appendCells: {
            sheetId: recordSheetId,
            rows: validatedRecords.map((record) => toRowData(createRecordRow(record))),
            fields: "userEnteredValue",
          },
        },
      ],
    },
  });

  return validatedRecords;
}

export async function updateAttendanceRecordStatus(attendanceId, status, auditData) {
  const normalizedAttendanceId = String(attendanceId || "").trim();
  const newStatus = assertValidAttendanceStatus(status);

  if (!normalizedAttendanceId) {
    throw new Error("ATTENDANCE_ATTENDANCE_ID_REQUIRED");
  }

  const records = await getAttendanceRecordsData();
  const existing = records.find((record) => record.attendance_id === normalizedAttendanceId);

  if (!existing) {
    throw new Error("ATTENDANCE_RECORD_NOT_FOUND");
  }

  if (existing.status === newStatus) {
    return {
      attendance_id: existing.attendance_id,
      session_id: existing.session_id,
      student_id: existing.student_id,
      membership_id: existing.membership_id,
      status: existing.status,
      created_at: existing.created_at,
      updated_at: existing.updated_at,
    };
  }

  if (!SPREADSHEET_ID) {
    throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID_MISSING");
  }

  const sheets = await getGoogleSheetsClient();
  const { recordSheetId, auditSheetId } = await getRequiredSheetIds(sheets);

  const now = new Date().toISOString();
  const oldSnapshot = getRecordSnapshot(existing);
  const newSnapshot = {
    ...oldSnapshot,
    status: newStatus,
    updated_at: now,
  };

  const updatedRow = [
    existing.attendance_id,
    existing.session_id,
    existing.student_id,
    existing.membership_id,
    newStatus,
    existing.created_at,
    now,
  ];

  const auditRow = await prepareAttendanceAudit({
    ...auditData,
    session_id: existing.session_id,
    attendance_id: existing.attendance_id,
    actor_user_id: auditData?.actor_user_id,
    action_type: "STATUS_UPDATED",
    old_data: oldSnapshot,
    new_data: newSnapshot,
    reason: auditData?.reason || "Perubahan status kehadiran siswa",
    changed_at: now,
  });

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [
        {
          updateCells: {
            range: {
              sheetId: recordSheetId,
              startRowIndex: existing.row_number - 1,
              endRowIndex: existing.row_number,
              startColumnIndex: 0,
              endColumnIndex: ATTENDANCE_RECORD_HEADERS.length,
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
    attendance_id: existing.attendance_id,
    session_id: existing.session_id,
    student_id: existing.student_id,
    membership_id: existing.membership_id,
    status: newStatus,
    created_at: existing.created_at,
    updated_at: now,
  };
}

export async function updateAttendanceRecordsStatus(updates, auditData) {
  if (!Array.isArray(updates) || updates.length === 0) {
    throw new Error("ATTENDANCE_RECORD_UPDATES_REQUIRED");
  }

  const normalizedUpdateIds = updates.map((update, index) => {
    const attendanceId = String(update?.attendance_id || "").trim();

    if (!attendanceId) {
      throw new Error(`ATTENDANCE_ATTENDANCE_ID_REQUIRED:${index + 1}`);
    }

    return attendanceId;
  });

  if (new Set(normalizedUpdateIds).size !== normalizedUpdateIds.length) {
    throw new Error("DUPLICATE_ATTENDANCE_RECORD_IDS");
  }

  const records = await getAttendanceRecordsData();
  const recordMap = new Map(records.map((record) => [record.attendance_id, record]));

  const preparedUpdates = updates.map((update, index) => {
    const attendanceId = String(update?.attendance_id || "").trim();
    const newStatus = assertValidAttendanceStatus(update?.status);

    if (!attendanceId) {
      throw new Error(`ATTENDANCE_ATTENDANCE_ID_REQUIRED:${index + 1}`);
    }

    const existing = recordMap.get(attendanceId);

    if (!existing) {
      throw new Error(`ATTENDANCE_RECORD_NOT_FOUND:${index + 1}`);
    }

    return {
      existing,
      newStatus,
      changed: existing.status !== newStatus,
    };
  });

  const changedUpdates = preparedUpdates.filter((item) => item.changed);

  if (changedUpdates.length === 0) {
    return [];
  }

  if (!SPREADSHEET_ID) {
    throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID_MISSING");
  }

  const sheets = await getGoogleSheetsClient();
  const { recordSheetId, auditSheetId } = await getRequiredSheetIds(sheets);

  const now = new Date().toISOString();
  const requests = [];
  const auditRows = [];

  for (const item of changedUpdates) {
    const { existing, newStatus } = item;
    const oldSnapshot = getRecordSnapshot(existing);
    const newSnapshot = {
      ...oldSnapshot,
      status: newStatus,
      updated_at: now,
    };

    const updatedRow = [
      existing.attendance_id,
      existing.session_id,
      existing.student_id,
      existing.membership_id,
      newStatus,
      existing.created_at,
      now,
    ];

    requests.push({
      updateCells: {
        range: {
          sheetId: recordSheetId,
          startRowIndex: existing.row_number - 1,
          endRowIndex: existing.row_number,
          startColumnIndex: 0,
          endColumnIndex: ATTENDANCE_RECORD_HEADERS.length,
        },
        rows: [toRowData(updatedRow)],
        fields: "userEnteredValue",
      },
    });

    const auditRow = await prepareAttendanceAudit({
      ...auditData,
      session_id: existing.session_id,
      attendance_id: existing.attendance_id,
      actor_user_id: auditData?.actor_user_id,
      action_type: "STATUS_UPDATED",
      old_data: oldSnapshot,
      new_data: newSnapshot,
      reason: auditData?.reason || "Perubahan status kehadiran siswa",
      changed_at: now,
    });

    auditRows.push(auditRow);
  }

  requests.push({
    appendCells: {
      sheetId: auditSheetId,
      rows: auditRows.map(toRowData),
      fields: "userEnteredValue",
    },
  });

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests,
    },
  });

  return changedUpdates.map((item) => ({
    attendance_id: item.existing.attendance_id,
    session_id: item.existing.session_id,
    student_id: item.existing.student_id,
    membership_id: item.existing.membership_id,
    status: item.newStatus,
    created_at: item.existing.created_at,
    updated_at: now,
  }));
}

export async function deleteAttendanceRecordsBySessionId(sessionId, auditData) {
  const normalizedSessionId = String(sessionId || "").trim();

  if (!normalizedSessionId) {
    throw new Error("ATTENDANCE_SESSION_ID_REQUIRED");
  }

  const records = await getAttendanceRecordsData();
  const affectedRecords = records.filter((record) => record.session_id === normalizedSessionId);

  if (affectedRecords.length === 0) {
    return {
      deleted_count: 0,
    };
  }

  if (!SPREADSHEET_ID) {
    throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID_MISSING");
  }

  const reason = String(auditData?.reason || "").trim();

  if (!reason) {
    throw new Error("ATTENDANCE_DELETE_REASON_REQUIRED");
  }

  const sheets = await getGoogleSheetsClient();
  const { recordSheetId, auditSheetId } = await getRequiredSheetIds(sheets);

  const now = new Date().toISOString();
  const requests = [];

  const preparedAuditRows = await Promise.all(
    affectedRecords.map(async (record) => {
      return prepareAttendanceAudit({
        ...auditData,
        session_id: record.session_id,
        attendance_id: record.attendance_id,
        actor_user_id: auditData?.actor_user_id,
        action_type: "RECORD_DELETED",
        old_data: getRecordSnapshot(record),
        new_data: null,
        reason,
        changed_at: now,
      });
    }),
  );

  requests.push({
    appendCells: {
      sheetId: auditSheetId,
      rows: preparedAuditRows.map(toRowData),
      fields: "userEnteredValue",
    },
  });

  const rowIndexes = affectedRecords
    .map((record) => record.row_number - 1)
    .sort((a, b) => b - a);

  for (const rowIndex of rowIndexes) {
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

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests,
    },
  });

  return {
    deleted_count: affectedRecords.length,
  };
}