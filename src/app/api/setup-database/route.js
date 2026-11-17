import { NextResponse } from "next/server";
import { verifyDatabaseHeaders } from "@/services/database-setup-service";

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
  }

  try {
    const result = await verifyDatabaseHeaders();

    return NextResponse.json(result);
  } catch (error) {
    console.error("Database verification error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Database verification failed.",
      },
      { status: 500 },
    );
  }
}
