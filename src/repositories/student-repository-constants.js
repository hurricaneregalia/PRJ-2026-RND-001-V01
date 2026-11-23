// src/repositories/student-repository-constants.js

import "server-only";

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const SHEET_NAME = "Students";
const AUDIT_SHEET_NAME = "Administrative_Audit_Logs";

export { SPREADSHEET_ID, SHEET_NAME, AUDIT_SHEET_NAME };
