// Configuration for Google Sheets integration.
// Values come from environment variables; never hardcode secrets.

export const GOOGLE_SHEETS_CONFIG = {
  spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  clientEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  privateKey: process.env.GOOGLE_PRIVATE_KEY,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
};

export function hasGoogleSheetsConfig() {
  return Boolean(
    GOOGLE_SHEETS_CONFIG.spreadsheetId &&
      GOOGLE_SHEETS_CONFIG.clientEmail &&
      GOOGLE_SHEETS_CONFIG.privateKey,
  );
}
