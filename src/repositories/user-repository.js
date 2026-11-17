import "server-only";
import { getGoogleSheetsClient } from "@/lib/google-sheets";

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const SHEET_NAME = "Users";

const HEADERS = ["user_id", "auth_user_id", "username", "email", "full_name", "gender", "role", "account_status", "created_at", "updated_at"];

async function getUsersData() {
  const sheets = await getGoogleSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:J`,
  });

  const rows = response.data.values || [];

  if (!rows.length) {
    throw new Error("USERS_HEADER_NOT_FOUND");
  }

  const validHeaders = rows[0].length === HEADERS.length && HEADERS.every((header, index) => rows[0][index] === header);

  if (!validHeaders) {
    throw new Error("USERS_HEADER_INVALID");
  }

  return rows;
}

export async function findUserByAuthId(authUserId) {
  const rows = await getUsersData();

  if (rows.length < 2) {
    return null;
  }

  const users = rows.slice(1).map((row) => Object.fromEntries(HEADERS.map((header, index) => [header, row[index] ?? ""])));

  return users.find((user) => user.auth_user_id === authUserId) || null;
}

export async function isUserBootstrapAvailable() {
  if (process.env.NODE_ENV !== "development") {
    return false;
  }

  const rows = await getUsersData();

  return rows.length === 1;
}

export async function isUserActive(authUserId) {
  const user = await findUserByAuthId(authUserId);

  return Boolean(user && user.account_status === "active");
}
