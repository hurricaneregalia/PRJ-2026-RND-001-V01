// src/repositories/user-repository-core.js
import "server-only";

import { getGoogleSheetsClient } from "@/lib/google-sheets";
import { USER_HEADERS } from "@/config/user-config";

export const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
export const SHEET_NAME = "Users";
export const AUDIT_SHEET_NAME = "Administrative_Audit_Logs";

export function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

export function normalizeAuthUserId(authUserId) {
  return String(authUserId || "").trim();
}

export function mapUserRows(rows) {
  return rows.map((row, index) => ({
    user_id: row[0] || "",
    auth_user_id: row[1] || "",
    username: row[2] || "",
    email: row[3] || "",
    full_name: row[4] || "",
    gender: row[5] || "",
    role: row[6] || "",
    account_status: row[7] || "",
    created_at: row[8] || "",
    updated_at: row[9] || "",
    row_number: index + 2,
  }));
}

export async function getUsersData() {
  const sheets = await getGoogleSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:J`,
  });

  const rows = response.data.values || [];
  const headers = rows[0] || [];

  if (headers.length !== USER_HEADERS.length || !USER_HEADERS.every((header, index) => headers[index] === header)) {
    throw new Error("INVALID_USERS_HEADERS");
  }

  return mapUserRows(rows.slice(1));
}

export async function getSheetIds(sheets) {
  const response = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    fields: "sheets.properties",
  });

  const properties = response.data.sheets || [];

  const usersSheet = properties.find((sheet) => sheet.properties.title === SHEET_NAME);
  const auditSheet = properties.find((sheet) => sheet.properties.title === AUDIT_SHEET_NAME);

  if (!usersSheet || !auditSheet) {
    throw new Error("REQUIRED_SHEET_NOT_FOUND");
  }

  return {
    usersSheetId: usersSheet.properties.sheetId,
    auditSheetId: auditSheet.properties.sheetId,
  };
}

export function toCellData(value) {
  return {
    userEnteredValue: {
      stringValue: String(value ?? ""),
    },
  };
}

export function assertUniqueUserId(users, userId) {
  const matches = users.filter((user) => user.user_id === userId);

  if (matches.length !== 1) {
    throw new Error(matches.length === 0 ? "USER_NOT_FOUND" : "USER_ID_AMBIGUOUS");
  }

  return matches[0];
}

export function assertUniqueEmail(users, email) {
  const normalizedEmail = normalizeEmail(email);

  const matches = users.filter((user) => normalizeEmail(user.email) === normalizedEmail);

  if (matches.length !== 1) {
    throw new Error(matches.length === 0 ? "USER_NOT_FOUND" : "USER_EMAIL_AMBIGUOUS");
  }

  return matches[0];
}

export function assertIdentityAvailable(users, authUserId, targetUserId) {
  const matches = users.filter((user) => normalizeAuthUserId(user.auth_user_id) === authUserId);

  const linkedToOtherUser = matches.some((user) => user.user_id !== targetUserId);

  if (linkedToOtherUser || matches.length > 1) {
    throw new Error("GOOGLE_IDENTITY_ALREADY_LINKED");
  }
}
