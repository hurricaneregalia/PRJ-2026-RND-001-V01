// src/repositories/attendance-session-repository-constants.js

import "server-only";

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

const ATTENDANCE_SESSION_SHEET_NAME = "Attendance_Sessions";
const ATTENDANCE_RECORD_SHEET_NAME = "Attendance_Records";
const ATTENDANCE_AUDIT_SHEET_NAME = "Attendance_Audit_Logs";

export {
  SPREADSHEET_ID,
  ATTENDANCE_SESSION_SHEET_NAME,
  ATTENDANCE_RECORD_SHEET_NAME,
  ATTENDANCE_AUDIT_SHEET_NAME,
};