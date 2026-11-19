"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { createInitialAdministrator } from "@/services/admin-bootstrap-service";

export async function createAdministrator(formData) {
  if (process.env.NODE_ENV !== "development") {
    redirect("/login");
  }

  const session = await auth();

  if (!session?.user?.bootstrapPending || !session.user.authUserId || !session.user.email || !session.user.name) {
    redirect("/login");
  }

  const username = formData.get("username");
  const gender = formData.get("gender");

  try {
    await createInitialAdministrator({
      auth_user_id: session.user.authUserId,
      username,
      email: session.user.email,
      full_name: session.user.name,
      gender,
    });
  } catch (error) {
    const allowedErrors = ["INVALID_ADMIN_DATA", "GOOGLE_SHEETS_SPREADSHEET_ID_MISSING", "ADMIN_BOOTSTRAP_NOT_ALLOWED", "ADMIN_BOOTSTRAP_ALREADY_USED"];

    const errorCode = allowedErrors.includes(error.message) ? error.message : "BOOTSTRAP_FAILED";

    redirect(`/setup-admin?error=${errorCode}`);
  }

  redirect("/setup-admin?success=1");
}
