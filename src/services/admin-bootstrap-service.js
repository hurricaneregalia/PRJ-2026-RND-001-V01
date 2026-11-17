import "server-only";
import { randomUUID } from "node:crypto";
import { getGoogleSheetsClient } from "@/lib/google-sheets";

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const SHEET_NAME = "Users";

const HEADERS = ["user_id", "auth_user_id", "username", "email", "full_name", "gender", "role", "account_status", "created_at", "updated_at"];

export async function createInitialAdministrator(data) {
  if (!data.auth_user_id || !data.username?.trim() || !data.email?.trim() || !data.full_name?.trim() || !["Laki-laki", "Perempuan"].includes(data.gender)) {
    throw new Error("INVALID_ADMIN_DATA");
  }

  const sheets = await getGoogleSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:J`,
  });

  const rows = response.data.values || [];

  if (!rows.length) {
    throw new Error("USERS_HEADER_NOT_FOUND");
  }

  const headers = rows[0];

  const validHeaders = headers.length === HEADERS.length && HEADERS.every((header, index) => headers[index] === header);

  if (!validHeaders) {
    throw new Error("USERS_HEADER_INVALID");
  }

  if (rows.length > 1) {
    throw new Error("ADMIN_BOOTSTRAP_ALREADY_USED");
  }

  const now = new Date().toISOString();

  const adminData = [randomUUID(), data.auth_user_id, data.username.trim(), data.email.trim().toLowerCase(), data.full_name.trim(), data.gender, "Administrator", "active", now, now];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:J`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [adminData],
    },
  });

  return {
    success: true,
    message: "Administrator awal berhasil dibuat.",
  };
}
