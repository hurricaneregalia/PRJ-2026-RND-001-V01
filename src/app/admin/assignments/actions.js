// src/app/admin/assignments/actions.js
"use server";

import { revalidatePath } from "next/cache";

import { createTeacherAssignmentService, endTeacherAssignmentService } from "@/services/teacher-assignment-service";

export async function createTeacherAssignmentAction(data) {
  try {
    const result = await createTeacherAssignmentService(data);

    revalidatePath("/admin/assignments");
    revalidatePath("/admin/classes");
    revalidatePath("/admin");

    return {
      success: true,
      data: result,
      message: "Penugasan guru berhasil dibuat.",
    };
  } catch (error) {
    console.error("Create teacher assignment failed:", error);

    return {
      success: false,
      error: error.message || "Gagal membuat penugasan guru.",
    };
  }
}

export async function endTeacherAssignmentAction(assignmentId, effectiveTo, reason = "") {
  try {
    const result = await endTeacherAssignmentService(assignmentId, effectiveTo, reason);

    revalidatePath("/admin/assignments");
    revalidatePath("/admin/classes");
    revalidatePath("/admin");

    return {
      success: true,
      data: result,
      message: "Penugasan guru berhasil diakhiri.",
    };
  } catch (error) {
    console.error("End teacher assignment failed:", error);

    return {
      success: false,
      error: error.message || "Gagal mengakhiri penugasan guru.",
    };
  }
}
