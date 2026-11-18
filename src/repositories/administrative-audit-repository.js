import "server-only";

import { randomUUID } from "node:crypto";
import { getGoogleSheetsClient } from "@/lib/google-sheets";

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const SHEET_NAME = "Administrative_Audit_Logs";

const HEADERS = ["admin_audit_id", "actor_user_id", "action_type", "table_name", "record_id", "old_data", "new_data", "reason", "created_at"];

export async function prepareAdministrativeAudit(data) {
  if (
    !data ||
    typeof data.actor_user_id !== "string" ||
    !data.actor_user_id.trim() ||
    typeof data.action_type !== "string" ||
    !data.action_type.trim() ||
    typeof data.table_name !== "string" ||
    !data.table_name.trim() ||
    typeof data.record_id !== "string" ||
    !data.record_id.trim()
  ) {
    throw new Error("INVALID_ADMINISTRATIVE_AUDIT_DATA");
  }

  const sheets = await getGoogleSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:I`,
  });

  const rows = response.data.values || [];

  const validHeaders = rows.length > 0 && rows[0].length === HEADERS.length && HEADERS.every((header, index) => header === rows[0][index]);

  if (!validHeaders) {
    throw new Error("ADMINISTRATIVE_AUDIT_HEADERS_INVALID");
  }

  const auditData = {
    admin_audit_id: randomUUID(),
    actor_user_id: data.actor_user_id,
    action_type: data.action_type,
    table_name: data.table_name,
    record_id: data.record_id,
    old_data: data.old_data ? JSON.stringify(data.old_data) : "",
    new_data: data.new_data ? JSON.stringify(data.new_data) : "",
    reason: data.reason || "",
    created_at: new Date().toISOString(),
  };

  return HEADERS.map((header) => auditData[header]);
}
