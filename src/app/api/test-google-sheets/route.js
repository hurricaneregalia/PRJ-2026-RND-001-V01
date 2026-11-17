import { getGoogleSheetsClient } from "@/lib/google-sheets";

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return Response.json({ success: false, message: "Not found" }, { status: 404 });
  }

  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
      fields: "properties.title,sheets.properties.title",
    });

    return Response.json({
      success: true,
      message: "Google Sheets berhasil terhubung.",
      spreadsheet: response.data.properties.title,
      sheetsCount: response.data.sheets.length,
    });
  } catch (error) {
    console.error("Google Sheets connection error:", error);

    return Response.json(
      {
        success: false,
        message: "Koneksi Google Sheets gagal. Periksa konfigurasi backend.",
      },
      { status: 500 },
    );
  }
}
