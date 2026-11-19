// src/repositories/user-repository.js
import "server-only";

import { randomUUID } from "node:crypto";
import { getGoogleSheetsClient } from "@/lib/google-sheets";
import { USER_HEADERS, USER_ROLES, USER_STATUS } from "@/config/user-config";
import { prepareAdministrativeAudit } from "@/repositories/administrative-audit-repository";

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const SHEET_NAME = "Users";
const AUDIT_SHEET_NAME = "Administrative_Audit_Logs";

function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

function normalizeAuthUserId(authUserId) {
  return String(authUserId || "").trim();
}

function mapUserRows(rows) {
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

async function getUsersData() {
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
export async function isUserBootstrapAvailable() {
  // Bootstrap hanya diperbolehkan di lingkungan development.
  if (process.env.NODE_ENV !== "development") {
    return false;
  }

  const users = await getUsersData();

  // Hanya tersedia jika worksheet Users belum memiliki record pengguna.
  return users.length === 0;
}
async function getSheetIds(sheets) {
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

function toCellData(value) {
  return {
    userEnteredValue: {
      stringValue: String(value ?? ""),
    },
  };
}

function assertUniqueUserId(users, userId) {
  const matches = users.filter((user) => user.user_id === userId);

  if (matches.length !== 1) {
    throw new Error(matches.length === 0 ? "USER_NOT_FOUND" : "USER_ID_AMBIGUOUS");
  }

  return matches[0];
}

function assertUniqueEmail(users, email) {
  const normalizedEmail = normalizeEmail(email);

  const matches = users.filter((user) => normalizeEmail(user.email) === normalizedEmail);

  if (matches.length !== 1) {
    throw new Error(matches.length === 0 ? "USER_NOT_FOUND" : "USER_EMAIL_AMBIGUOUS");
  }

  return matches[0];
}

function assertIdentityAvailable(users, authUserId, targetUserId) {
  const matches = users.filter((user) => normalizeAuthUserId(user.auth_user_id) === authUserId);

  const linkedToOtherUser = matches.some((user) => user.user_id !== targetUserId);

  if (linkedToOtherUser || matches.length > 1) {
    throw new Error("GOOGLE_IDENTITY_ALREADY_LINKED");
  }
}

async function persistGoogleIdentityBinding({ userId, authUserId, reason }) {
  const normalizedAuthUserId = normalizeAuthUserId(authUserId);

  if (!userId || !normalizedAuthUserId) {
    throw new Error("INVALID_GOOGLE_IDENTITY");
  }

  const users = await getUsersData();
  const user = assertUniqueUserId(users, userId);

  if (user.account_status !== USER_STATUS.ACTIVE) {
    throw new Error("USER_ACCOUNT_INACTIVE");
  }

  if (user.role !== USER_ROLES.ADMINISTRATOR && user.role !== USER_ROLES.TEACHER) {
    throw new Error("USER_ROLE_NOT_ALLOWED");
  }

  const uniqueEmailUser = assertUniqueEmail(users, user.email);

  if (uniqueEmailUser.user_id !== user.user_id) {
    throw new Error("USER_EMAIL_AMBIGUOUS");
  }

  assertIdentityAvailable(users, normalizedAuthUserId, user.user_id);

  if (normalizeAuthUserId(user.auth_user_id) === normalizedAuthUserId) {
    return {
      success: true,
      alreadyLinked: true,
      user_id: user.user_id,
    };
  }

  if (normalizeAuthUserId(user.auth_user_id)) {
    throw new Error("USER_ALREADY_LINKED_TO_ANOTHER_GOOGLE_ACCOUNT");
  }

  const audit = await prepareAdministrativeAudit({
    actor_user_id: user.user_id,
    action_type: "GOOGLE_IDENTITY_BOUND",
    table_name: "Users",
    record_id: user.user_id,
    old_data: {
      auth_user_id: "",
    },
    new_data: {
      auth_user_id: normalizedAuthUserId,
    },
    reason,
  });

  const sheets = await getGoogleSheetsClient();

  const { usersSheetId, auditSheetId } = await getSheetIds(sheets);

  const timestamp = new Date().toISOString();

  const requests = [
    {
      updateCells: {
        range: {
          sheetId: usersSheetId,
          startRowIndex: user.row_number - 1,
          endRowIndex: user.row_number,
          startColumnIndex: 1,
          endColumnIndex: 2,
        },
        rows: [
          {
            values: [toCellData(normalizedAuthUserId)],
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
            values: audit.map(toCellData),
          },
        ],
        fields: "userEnteredValue",
      },
    },
  ];

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests,
    },
  });

  return {
    success: true,
    alreadyLinked: false,
    user_id: user.user_id,
    auth_user_id: normalizedAuthUserId,
    linked_at: timestamp,
  };
}

export async function getAllUsers() {
  return getUsersData();
}

export async function getUserById(userId) {
  const users = await getUsersData();

  return users.find((user) => user.user_id === userId) || null;
}

export async function findUserByEmail(email) {
  const users = await getUsersData();

  const normalizedEmail = normalizeEmail(email);

  return users.find((user) => normalizeEmail(user.email) === normalizedEmail) || null;
}

export async function findUserByAuthId(authUserId) {
  const users = await getUsersData();

  const normalizedAuthUserId = normalizeAuthUserId(authUserId);

  return users.find((user) => normalizeAuthUserId(user.auth_user_id) === normalizedAuthUserId && normalizedAuthUserId !== "") || null;
}

export async function createUser(data, auditData) {
  const sheets = await getGoogleSheetsClient();

  const users = await getUsersData();

  const normalizedEmail = normalizeEmail(data.email);

  if (users.some((user) => normalizeEmail(user.email) === normalizedEmail)) {
    throw new Error("USER_EMAIL_ALREADY_EXISTS");
  }

  const userId = randomUUID();
  const timestamp = new Date().toISOString();

  const row = [userId, data.auth_user_id || "", data.username, normalizedEmail, data.full_name, data.gender, data.role, data.account_status, timestamp, timestamp];

  const audit = await prepareAdministrativeAudit({
    actor_user_id: auditData.actor_user_id,
    action_type: "USER_CREATED",
    table_name: "Users",
    record_id: userId,
    old_data: null,
    new_data: {
      user_id: userId,
      username: data.username,
      email: normalizedEmail,
      full_name: data.full_name,
      gender: data.gender,
      role: data.role,
      account_status: data.account_status,
    },
    reason: auditData.reason,
  });

  const { usersSheetId, auditSheetId } = await getSheetIds(sheets);

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [
        {
          appendCells: {
            sheetId: usersSheetId,
            rows: [
              {
                values: row.map(toCellData),
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
                values: audit.map(toCellData),
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
    user_id: userId,
  };
}

export async function updateUser(userId, updates, auditData) {
  const sheets = await getGoogleSheetsClient();

  const users = await getUsersData();
  const user = assertUniqueUserId(users, userId);

  const allowedFields = {
    username: 2,
    email: 3,
    full_name: 4,
    gender: 5,
    role: 6,
    account_status: 7,
  };

  const oldData = {};
  const newData = {};

  for (const [field, value] of Object.entries(updates)) {
    if (!(field in allowedFields)) {
      throw new Error("INVALID_USER_UPDATE_FIELD");
    }

    oldData[field] = user[field];

    newData[field] = field === "email" ? normalizeEmail(value) : value;
  }

  const updatedRow = [
    user.user_id,
    user.auth_user_id,
    updates.username ?? user.username,
    updates.email !== undefined ? normalizeEmail(updates.email) : user.email,
    updates.full_name ?? user.full_name,
    updates.gender ?? user.gender,
    updates.role ?? user.role,
    updates.account_status ?? user.account_status,
    user.created_at,
    new Date().toISOString(),
  ];

  const audit = await prepareAdministrativeAudit({
    actor_user_id: auditData.actor_user_id,
    action_type: auditData.action_type || "USER_PROFILE_UPDATED",
    table_name: "Users",
    record_id: userId,
    old_data: oldData,
    new_data: newData,
    reason: auditData.reason,
  });

  const { usersSheetId, auditSheetId } = await getSheetIds(sheets);

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [
        {
          updateCells: {
            range: {
              sheetId: usersSheetId,
              startRowIndex: user.row_number - 1,
              endRowIndex: user.row_number,
              startColumnIndex: 0,
              endColumnIndex: USER_HEADERS.length,
            },
            rows: [
              {
                values: updatedRow.map(toCellData),
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
                values: audit.map(toCellData),
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
    user_id: userId,
  };
}

export async function bindGoogleIdentity(email, authUserId) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedAuthUserId = normalizeAuthUserId(authUserId);

  if (!normalizedEmail || !normalizedAuthUserId) {
    throw new Error("INVALID_GOOGLE_IDENTITY");
  }

  const users = await getUsersData();
  const user = assertUniqueEmail(users, normalizedEmail);

  return persistGoogleIdentityBinding({
    userId: user.user_id,
    authUserId: normalizedAuthUserId,
    reason: "Pengaitan otomatis melalui Google OAuth",
  });
}
