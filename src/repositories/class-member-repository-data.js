// src/repositories/class-member-repository-data.js

import "server-only";

import { getGoogleSheetsClient } from "@/lib/google-sheets";
import { CLASS_MEMBER_HEADERS } from "@/config/class-member-config";

import { SPREADSHEET_ID, SHEET_NAME } from "./class-member-repository-constants";

export async function getClassMembersData() {
  if (!SPREADSHEET_ID) {
    throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID_MISSING");
  }

  const sheets = await getGoogleSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:G`,
  });

  const rows = response.data.values || [];
  const headers = rows[0] || [];

  if (headers.length !== CLASS_MEMBER_HEADERS.length || !CLASS_MEMBER_HEADERS.every((header, index) => headers[index] === header)) {
    throw new Error("INVALID_CLASS_MEMBERS_HEADERS");
  }

  return rows.slice(1).map((row, index) => ({
    membership_id: row[0] || "",
    student_id: row[1] || "",
    class_id: row[2] || "",
    effective_from: row[3] || "",
    effective_to: row[4] || "",
    created_at: row[5] || "",
    updated_at: row[6] || "",
    row_number: index + 2,
  }));
}
