import "server-only";

import { google } from "googleapis";

const requiredEnv = ["GOOGLE_SERVICE_ACCOUNT_EMAIL", "GOOGLE_PRIVATE_KEY", "GOOGLE_CLOUD_PROJECT_ID", "GOOGLE_SHEETS_SPREADSHEET_ID"];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Environment variable ${key} belum diatur.`);
  }
}

const auth = new google.auth.GoogleAuth({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,

  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  },

  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

export async function getGoogleSheetsClient() {
  const authClient = await auth.getClient();

  return google.sheets({
    version: "v4",
    auth: authClient,
  });
}
