import "server-only";

import { randomUUID } from "node:crypto";
import { getGoogleSheetsClient } from "@/lib/google-sheets";
import { isUserBootstrapAvailable } from "@/repositories/user-repository";

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

function validateAdminData(data) {
  return (
    data &&
    typeof data === "object" &&
    typeof data.auth_user_id === "string" &&
    data.auth_user_id.trim() !== "" &&
    typeof data.username === "string" &&
    data.username.trim() !== "" &&
    typeof data.email === "string" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim()) &&
    typeof data.full_name === "string" &&
    data.full_name.trim() !== "" &&
    ["Laki-laki", "Perempuan"].includes(data.gender)
  );
}

export async function createInitialAdministrator(data) {
  if (process.env.NODE_ENV !== "development") {
    throw new Error("ADMIN_BOOTSTRAP_NOT_ALLOWED");
  }

  if (!validateAdminData(data)) {
    throw new Error("INVALID_ADMIN_DATA");
  }

  if (!SPREADSHEET_ID) {
    throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID_MISSING");
  }

  const bootstrapAvailable = await isUserBootstrapAvailable();

  if (!bootstrapAvailable) {
    throw new Error("ADMIN_BOOTSTRAP_ALREADY_USED");
  }

  const sheets = await getGoogleSheetsClient();
  const timestamp = new Date().toISOString();

  const adminData = [
    randomUUID(),
    data.auth_user_id.trim(),
    data.username.trim(),
    data.email.trim().toLowerCase(),
    data.full_name.trim(),
    data.gender,
    "Administrator",
    "active",
    timestamp,
    timestamp,
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: "Users!A:J",
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
