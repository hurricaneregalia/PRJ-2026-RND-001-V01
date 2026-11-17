import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createInitialAdministrator } from "@/services/admin-bootstrap-service";

export async function POST(request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ success: false, message: "Not found." }, { status: 404 });
  }

  const bootstrapSecret = process.env.ADMIN_BOOTSTRAP_SECRET;

  if (!bootstrapSecret) {
    return NextResponse.json(
      {
        success: false,
        message: "Bootstrap secret belum dikonfigurasi.",
      },
      { status: 500 },
    );
  }

  const providedSecret = request.headers.get("x-admin-bootstrap-secret");

  if (providedSecret !== bootstrapSecret) {
    return NextResponse.json({ success: false, message: "Akses ditolak." }, { status: 403 });
  }

  try {
    const session = await auth();

    if (!session?.user?.bootstrapPending || !session.user.authUserId || !session.user.email || !session.user.name) {
      return NextResponse.json(
        {
          success: false,
          message: "Sesi bootstrap Google tidak valid.",
        },
        { status: 401 },
      );
    }

    const body = await request.json();

    const result = await createInitialAdministrator({
      auth_user_id: session.user.authUserId,
      username: body.username,
      email: session.user.email,
      full_name: session.user.name,
      gender: body.gender,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Admin bootstrap error:", error);

    const messages = {
      INVALID_ADMIN_DATA: "Data Administrator tidak valid.",
      USERS_HEADER_NOT_FOUND: "Header Users tidak ditemukan.",
      USERS_HEADER_INVALID: "Struktur header Users tidak sesuai.",
      ADMIN_BOOTSTRAP_ALREADY_USED: "Administrator awal sudah dibuat.",
    };

    const message = messages[error.message] || "Gagal membuat Administrator awal.";

    const status = error.message === "ADMIN_BOOTSTRAP_ALREADY_USED" ? 409 : 400;

    return NextResponse.json({ success: false, message }, { status });
  }
}
