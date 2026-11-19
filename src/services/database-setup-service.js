// src/services/database-setup-service.js

import "server-only";

import { getGoogleSheetsClient } from "@/lib/google-sheets";
import { DATABASE_SCHEMA } from "@/config/database-schema";

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

export async function verifyDatabaseHeaders() {
  const sheets = await getGoogleSheetsClient();
  const results = {};

  for (const [sheetName, expectedHeaders] of Object.entries(DATABASE_SCHEMA)) {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!1:1`,
    });

    const actualHeaders = response.data.values?.[0] || [];

    const isValid = actualHeaders.length === expectedHeaders.length && expectedHeaders.every((header, index) => actualHeaders[index] === header);

    results[sheetName] = {
      valid: isValid,
      expectedColumns: expectedHeaders.length,
      actualColumns: actualHeaders.length,
      expectedHeaders,
      actualHeaders,
    };
  }

  return {
    success: Object.values(results).every((result) => result.valid),
    results,
  };
}

export async function initializeDatabaseHeaders() {
  const sheets = await getGoogleSheetsClient();
  const results = {};

  for (const [sheetName, expectedHeaders] of Object.entries(DATABASE_SCHEMA)) {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!1:1`,
    });

    const actualHeaders = response.data.values?.[0] || [];

    if (actualHeaders.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!A1`,
        valueInputOption: "RAW",
        requestBody: {
          values: [expectedHeaders],
        },
      });

      results[sheetName] = "created";
      continue;
    }

    const isValid = actualHeaders.length === expectedHeaders.length && expectedHeaders.every((header, index) => header === actualHeaders[index]);

    results[sheetName] = isValid ? "already_valid" : "mismatch";
  }

  return results;
}
