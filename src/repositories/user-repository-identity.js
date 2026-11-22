// src/repositories/user-repository-identity.js
import "server-only";

import { getGoogleSheetsClient } from "@/lib/google-sheets";
import { USER_ROLES, USER_STATUS } from "@/config/user-config";
import { prepareAdministrativeAudit } from "@/repositories/administrative-audit-repository";

import { SPREADSHEET_ID, getUsersData, getSheetIds, normalizeEmail, normalizeAuthUserId, toCellData, assertUniqueUserId, assertUniqueEmail, assertIdentityAvailable } from "./user-repository-core";

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
