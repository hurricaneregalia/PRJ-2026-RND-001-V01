import { google } from 'googleapis';

import { GOOGLE_SHEETS_CONFIG, hasGoogleSheetsConfig } from '@/config/google-sheets';

// Server-side only. Do not import from client components.

let cachedClient = null;

export function getGoogleSheetsClient() {
  if (cachedClient) {
    return cachedClient;
  }

  if (!hasGoogleSheetsConfig()) {
    throw new Error('Google Sheets configuration is incomplete');
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: GOOGLE_SHEETS_CONFIG.clientEmail,
      private_key: GOOGLE_SHEETS_CONFIG.privateKey?.replace(/\\n/g, '\n'),
    },
    projectId: GOOGLE_SHEETS_CONFIG.projectId,
    scopes: GOOGLE_SHEETS_CONFIG.scopes,
  });

  cachedClient = google.sheets({ version: 'v4', auth });
  return cachedClient;
}

export async function getSpreadsheetMetadata() {
  const sheets = getGoogleSheetsClient();
  const spreadsheetId = GOOGLE_SHEETS_CONFIG.spreadsheetId;

  const response = await sheets.spreadsheets.get({ spreadsheetId });
  return response.data;
}
