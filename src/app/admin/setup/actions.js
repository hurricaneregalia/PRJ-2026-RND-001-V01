"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/authorization";
import { initializeSchool } from "@/services/school-initialization-service";

export async function initializeSchoolAction(formData) {
  await requireRole(["Administrator"]);

  const data = {
    school: {
      school_name: formData.get("school_name"),
      school_address: formData.get("school_address"),
      school_phone: formData.get("school_phone"),
      school_email: formData.get("school_email"),
      school_logo_url: formData.get("school_logo_url"),
      principal_name: formData.get("principal_name"),
    },
  };

  try {
    await initializeSchool(data);
  } catch (error) {
    const allowedErrors = [
      "INVALID_INITIALIZATION_DATA",
      "INVALID_SCHOOL_INFORMATION",
      "SCHOOL_INFORMATION_ALREADY_EXISTS",
      "SCHOOL_INFORMATION_HEADERS_NOT_FOUND",
      "SCHOOL_INFORMATION_HEADERS_INVALID",
      "INITIALIZATION_IN_PROGRESS",
    ];

    const errorCode = allowedErrors.includes(error.message) ? error.message : "INITIALIZATION_FAILED";

    redirect(`/admin/setup?error=${errorCode}`);
  }

  redirect("/admin/setup?success=1");
}
