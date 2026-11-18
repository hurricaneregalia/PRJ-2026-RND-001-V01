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

    academicYear: {
      academic_year_name: formData.get("academic_year_name"),
      start_date: formData.get("start_date"),
      end_date: formData.get("end_date"),
    },
  };

  try {
    await initializeSchool(data);
  } catch (error) {
    const allowedErrors = [
      "INVALID_INITIALIZATION_DATA",
      "INVALID_SCHOOL_INFORMATION",
      "INVALID_ACADEMIC_YEAR_DATA",
      "ACADEMIC_YEAR_PERIOD_OVERLAP",
      "EXISTING_ACADEMIC_YEAR_PERIOD_INVALID",
      "ACADEMIC_YEARS_ALREADY_EXIST",
      "SCHOOL_INFORMATION_ALREADY_EXISTS",
      "SCHOOL_INFORMATION_HEADERS_NOT_FOUND",
      "SCHOOL_INFORMATION_HEADERS_INVALID",
      "ACADEMIC_YEAR_HEADERS_NOT_FOUND",
      "ACADEMIC_YEAR_HEADERS_INVALID",
      "INITIALIZATION_SHEET_NOT_FOUND",
      "INITIALIZATION_IN_PROGRESS",
    ];

    const errorCode = allowedErrors.includes(error.message) ? error.message : "INITIALIZATION_FAILED";

    redirect(`/admin/setup?error=${errorCode}`);
  }

  redirect("/admin/setup?success=1");
}
