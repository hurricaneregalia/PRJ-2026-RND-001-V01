// src/repositories/attendance-audit-repository.js

import "server-only";

import { randomUUID } from "node:crypto";
import { getGoogleSheetsClient } from "@/lib/google-sheets";
import { ATTENDANCE_AUDIT_HEADERS, ATTENDANCE_AUDIT_ACTION_TYPES } from "@/config/attendance-config";

const DELETION_AUDIT_ACTION_TYPES = new Set([
  ATTENDANCE_AUDIT_ACTION_TYPES.SESSION_DELETED,
  ATTENDANCE_AUDIT_ACTION_TYPES.RECORD_DELETED,
]);

const MAX_AUDIT_REASON_LENGTH = 500;

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const SHEET_NAME = "Attendance_Audit_Logs";

function validateAuditData(data) {
  if (
    !data ||
    typeof data.actor_user_id !== "string" ||
    !data.actor_user_id.trim() ||
    typeof data.action_type !== "string" ||
    !data.action_type.trim() ||
    typeof data.session_id !== "string" ||
    !data.session_id.trim()
  ) {
    throw new Error("INVALID_ATTENDANCE_AUDIT_DATA");
  }

  if (!Object.values(ATTENDANCE_AUDIT_ACTION_TYPES).includes(data.action_type)) {
    throw new Error("INVALID_ATTENDANCE_AUDIT_ACTION_TYPE");
  }

  if (data.attendance_id !== undefined && data.attendance_id !== null && typeof data.attendance_id !== "string") {
    throw new Error("INVALID_ATTENDANCE_AUDIT_DATA");
  }

  const reason = String(data.reason || "").trim();

  if (DELETION_AUDIT_ACTION_TYPES.has(data.action_type) && !reason) {
    throw new Error("ATTENDANCE_AUDIT_REASON_REQUIRED");
  }

  if (reason.length > MAX_AUDIT_REASON_LENGTH) {
    throw new Error("ATTENDANCE_AUDIT_REASON_TOO_LONG");
  }
}

function createAuditRow(data) {
  validateAuditData(data);

  const auditData = {
    audit_id: randomUUID(),
    session_id: data.session_id,
    attendance_id: data.attendance_id || "",
    actor_user_id: data.actor_user_id,
    action_type: data.action_type,
    old_data: data.old_data ? JSON.stringify(data.old_data) : "",
    new_data: data.new_data ? JSON.stringify(data.new_data) : "",
    reason: String(data.reason || "").trim(),
    changed_at: data.changed_at || new Date().toISOString(),
  };

  return ATTENDANCE_AUDIT_HEADERS.map((header) => auditData[header]);
}

export async function prepareAttendanceAudit(data) {
  if (!SPREADSHEET_ID) {
    throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID_MISSING");
  }

  const sheets = await getGoogleSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:I`,
  });

  const rows = response.data.values || [];
  const headers = rows[0] || [];

  const validHeaders =
    headers.length === ATTENDANCE_AUDIT_HEADERS.length &&
    ATTENDANCE_AUDIT_HEADERS.every((header, index) => headers[index] === header);

  if (!validHeaders) {
    throw new Error("ATTENDANCE_AUDIT_HEADERS_INVALID");
  }

  return createAuditRow(data);
}

export async function prepareAttendanceAudits(dataList) {
  if (!Array.isArray(dataList) || dataList.length === 0) {
    throw new Error("ATTENDANCE_AUDIT_DATA_REQUIRED");
  }

  if (!SPREADSHEET_ID) {
    throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID_MISSING");
  }

  const sheets = await getGoogleSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:I`,
  });

  const rows = response.data.values || [];
  const headers = rows[0] || [];

  const validHeaders =
    headers.length === ATTENDANCE_AUDIT_HEADERS.length &&
    ATTENDANCE_AUDIT_HEADERS.every((header, index) => headers[index] === header);

  if (!validHeaders) {
    throw new Error("ATTENDANCE_AUDIT_HEADERS_INVALID");
  }

  return dataList.map(createAuditRow);
}