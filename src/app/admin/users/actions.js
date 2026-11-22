"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/authorization";

import { registerUser, updateUserProfile, listUsersPage } from "@/services/user-management-service";

export async function listUsersPageAction(input = {}) {
  await requireRole(["Administrator"]);

  return listUsersPage(input);
}

export async function registerUserAction(formData) {
  await requireRole(["Administrator"]);

  const data = {
    username: formData.get("username"),
    email: formData.get("email"),
    full_name: formData.get("full_name"),
    gender: formData.get("gender"),
    role: formData.get("role"),
  };

  try {
    await registerUser(data);
  } catch (error) {
    const allowedErrors = [
      "INVALID_USER_DATA",
      "USER_EMAIL_ALREADY_EXISTS",
      "GOOGLE_ID_ALREADY_LINKED",
      "INVALID_AUDIT_ACTOR",
      "INVALID_ADMINISTRATIVE_AUDIT_DATA",
      "ADMINISTRATIVE_AUDIT_HEADERS_INVALID",
      "REQUIRED_SHEET_NOT_FOUND",
    ];

    const errorCode = allowedErrors.includes(error.message) ? error.message : "USER_REGISTRATION_FAILED";

    redirect(`/admin/users?error=${errorCode}`);
  }

  redirect("/admin/users?success=created");
}

export async function updateUserAction(formData) {
  const userId = formData.get("user_id");

  try {
    await requireRole(["Administrator"]);

    const data = {
      username: formData.get("username"),
      email: formData.get("email"),
      full_name: formData.get("full_name"),
      gender: formData.get("gender"),
      role: formData.get("role"),
      account_status: formData.get("account_status"),
    };

    await updateUserProfile(userId, data);
  } catch (error) {
    const allowedErrors = [
      "USER_NOT_FOUND",
      "INVALID_USER_UPDATE",
      "INVALID_USER_UPDATE_FIELD",
      "INVALID_USERNAME",
      "INVALID_FULL_NAME",
      "INVALID_EMAIL",
      "INVALID_GENDER",
      "INVALID_ROLE",
      "INVALID_ACCOUNT_STATUS",
      "USER_EMAIL_ALREADY_EXISTS",
      "CANNOT_CHANGE_OWN_ADMIN_ACCESS",
      "LAST_ACTIVE_ADMINISTRATOR",
      "INVALID_AUDIT_ACTOR",
      "INVALID_ADMINISTRATIVE_AUDIT_DATA",
      "ADMINISTRATIVE_AUDIT_HEADERS_INVALID",
      "REQUIRED_SHEET_NOT_FOUND",
    ];

    const errorCode = allowedErrors.includes(error.message) ? error.message : "USER_UPDATE_FAILED";

    redirect(`/admin/users/${encodeURIComponent(userId)}?error=${errorCode}`);
  }

  redirect(`/admin/users/${encodeURIComponent(userId)}?success=updated`);
}
