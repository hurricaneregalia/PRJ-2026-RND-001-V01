// src/repositories/user-repository.js
import "server-only";

import { randomUUID } from "node:crypto";
import { getGoogleSheetsClient } from "@/lib/google-sheets";
import { USER_HEADERS, USER_ROLES } from "@/config/user-config";
import { prepareAdministrativeAudit } from "@/repositories/administrative-audit-repository";

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const SHEET_NAME = "Users";
const AUDIT_SHEET_NAME = "Administrative_Audit_Logs";

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

  const validHeaders = rows[0].length === USER_HEADERS.length && USER_HEADERS.every((header, index) => header === rows[0][index]);

  if (!validHeaders) {
    throw new Error("USERS_HEADER_INVALID");
  }

  return rows;
}

function mapUserRows(rows) {
  return rows.slice(1).map((row, index) => ({
    ...Object.fromEntries(USER_HEADERS.map((header, columnIndex) => [header, row[columnIndex] ?? ""])),
    row_number: index + 2,
  }));
}

async function getSheetIds() {
  const sheets = await getGoogleSheetsClient();

  const response = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    fields: "sheets.properties",
  });

  const properties = response.data.sheets || [];

  const userSheet = properties.find((item) => item.properties.title === SHEET_NAME);

  const auditSheet = properties.find((item) => item.properties.title === AUDIT_SHEET_NAME);

  if (!userSheet || !auditSheet) {
    throw new Error("REQUIRED_SHEET_NOT_FOUND");
  }

  return {
    userSheetId: userSheet.properties.sheetId,
    auditSheetId: auditSheet.properties.sheetId,
  };
}

function toCellData(values) {
  return values.map((value) => ({
    userEnteredValue: {
      stringValue: String(value ?? ""),
    },
  }));
}

export async function getAllUsers() {
  const rows = await getUsersData();
  return mapUserRows(rows);
}

export async function getUserById(userId) {
  if (typeof userId !== "string" || !userId.trim()) {
    return null;
  }

  const users = await getAllUsers();

  return users.find((user) => user.user_id === userId) || null;
}

export async function findUserByEmail(email) {
  if (typeof email !== "string" || !email.trim()) {
    return null;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const users = await getAllUsers();

  return users.find((user) => user.email.toLowerCase() === normalizedEmail) || null;
}

export async function findUserByAuthId(authUserId) {
  if (typeof authUserId !== "string" || !authUserId.trim()) {
    return null;
  }

  const users = await getAllUsers();

  return users.find((user) => user.auth_user_id === authUserId) || null;
}

export async function isUserBootstrapAvailable() {
  if (process.env.NODE_ENV !== "development") {
    return false;
  }

  const users = await getAllUsers();

  return users.length === 0;
}

export async function isUserActive(authUserId) {
  const user = await findUserByAuthId(authUserId);

  return Boolean(user && user.account_status === "active");
}

export async function createUser(data, auditData) {
  const users = await getAllUsers();
  const normalizedEmail = data.email.trim().toLowerCase();

  if (users.some((user) => user.email.toLowerCase() === normalizedEmail)) {
    throw new Error("USER_EMAIL_ALREADY_EXISTS");
  }

  if (data.auth_user_id && users.some((user) => user.auth_user_id === data.auth_user_id)) {
    throw new Error("GOOGLE_ID_ALREADY_LINKED");
  }

  const now = new Date().toISOString();

  const userData = [randomUUID(), data.auth_user_id || "", data.username.trim(), normalizedEmail, data.full_name.trim(), data.gender, data.role, data.account_status, now, now];

  const auditRow = await prepareAdministrativeAudit({
    ...auditData,
    action_type: auditData.action_type || "USER_CREATED",
    table_name: SHEET_NAME,
    record_id: userData[0],
    old_data: null,
    new_data: Object.fromEntries(USER_HEADERS.map((header, index) => [header, userData[index]])),
  });

  const { userSheetId, auditSheetId } = await getSheetIds();
  const sheets = await getGoogleSheetsClient();

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [
        {
          appendCells: {
            sheetId: userSheetId,
            rows: [
              {
                values: toCellData(userData),
              },
            ],
            fields: "userEnteredValue",
          },
        },
        {
          appendCells: {
            sheetId: auditSheetId,
            rows: [
              {
                values: toCellData(auditRow),
              },
            ],
            fields: "userEnteredValue",
          },
        },
      ],
    },
  });

  return {
    success: true,
    user_id: userData[0],
  };
}

export async function updateUser(userId, updates, auditData) {
  const users = await getAllUsers();

  const user = users.find((item) => item.user_id === userId);

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  const allowedFields = ["username", "email", "full_name", "gender", "role", "account_status"];

  for (const field of Object.keys(updates)) {
    if (!allowedFields.includes(field)) {
      throw new Error("INVALID_USER_UPDATE_FIELD");
    }
  }

  const newEmail = (updates.email ?? user.email).trim().toLowerCase();

  if (users.some((item) => item.user_id !== userId && item.email.toLowerCase() === newEmail)) {
    throw new Error("USER_EMAIL_ALREADY_EXISTS");
  }

  const updatedUser = {
    ...user,
    ...updates,
    email: newEmail,
    updated_at: new Date().toISOString(),
  };

  const values = USER_HEADERS.map((header) => updatedUser[header] ?? "");

  const oldData = Object.fromEntries(USER_HEADERS.map((header) => [header, user[header] ?? ""]));

  const newData = Object.fromEntries(USER_HEADERS.map((header, index) => [header, values[index]]));

  const auditRow = await prepareAdministrativeAudit({
    ...auditData,
    action_type: auditData.action_type || "USER_UPDATED",
    table_name: SHEET_NAME,
    record_id: userId,
    old_data: oldData,
    new_data: newData,
  });

  const { userSheetId, auditSheetId } = await getSheetIds();
  const sheets = await getGoogleSheetsClient();

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [
        {
          updateCells: {
            range: {
              sheetId: userSheetId,
              startRowIndex: user.row_number - 1,
              endRowIndex: user.row_number,
              startColumnIndex: 0,
              endColumnIndex: USER_HEADERS.length,
            },
            rows: [
              {
                values: toCellData(values),
              },
            ],
            fields: "userEnteredValue",
          },
        },
        {
          appendCells: {
            sheetId: auditSheetId,
            rows: [
              {
                values: toCellData(auditRow),
              },
            ],
            fields: "userEnteredValue",
          },
        },
      ],
    },
  });

  return {
    success: true,
  };
}

export async function bindGoogleIdentity(email, authUserId) {
  if (typeof email !== "string" || !email.trim() || typeof authUserId !== "string" || !authUserId.trim()) {
    throw new Error("INVALID_GOOGLE_IDENTITY");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const users = await getAllUsers();

  const user = users.find((item) => item.email.toLowerCase() === normalizedEmail);

  if (!user) {
    throw new Error("USER_EMAIL_NOT_REGISTERED");
  }

  if (user.account_status !== "active") {
    throw new Error("USER_ACCOUNT_INACTIVE");
  }

  // Pengaitan pertama hanya diperbolehkan untuk akun Guru.
  if (user.role !== USER_ROLES.TEACHER) {
    throw new Error("GOOGLE_ID_BINDING_ROLE_NOT_ALLOWED");
  }

  if (user.auth_user_id === authUserId) {
    return user;
  }

  if (user.auth_user_id) {
    throw new Error("USER_GOOGLE_ID_ALREADY_BOUND");
  }

  const existingIdentity = users.find((item) => item.auth_user_id === authUserId);

  if (existingIdentity) {
    throw new Error("GOOGLE_ID_ALREADY_LINKED");
  }

  const sheets = await getGoogleSheetsClient();

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!B${user.row_number}`,
    valueInputOption: "RAW",
    requestBody: {
      values: [[authUserId]],
    },
  });

  return {
    ...user,
    auth_user_id: authUserId,
  };
}
