// src/repositories/user-repository-write.js
import "server-only";

import { randomUUID } from "node:crypto";
import { getGoogleSheetsClient } from "@/lib/google-sheets";
import { USER_HEADERS } from "@/config/user-config";
import { prepareAdministrativeAudit } from "@/repositories/administrative-audit-repository";

import { SPREADSHEET_ID, getUsersData, getSheetIds, normalizeEmail, toCellData, assertUniqueUserId } from "./user-repository-core";

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

  const normalizedEmail = updates.email !== undefined ? normalizeEmail(updates.email) : null;

  if (normalizedEmail !== null) {
    const emailAlreadyUsed = users.some((record) => record.user_id !== userId && normalizeEmail(record.email) === normalizedEmail);

    if (emailAlreadyUsed) {
      throw new Error("USER_EMAIL_ALREADY_EXISTS");
    }
  }

  const updatedRow = [
    user.user_id,
    user.auth_user_id,
    updates.username ?? user.username,
    normalizedEmail !== null ? normalizedEmail : user.email,
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
