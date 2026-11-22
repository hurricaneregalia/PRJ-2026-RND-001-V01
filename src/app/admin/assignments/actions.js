// src/app/admin/assignments/actions.js
"use server";

import { revalidatePath } from "next/cache";

import { createTeacherAssignmentService, endTeacherAssignmentService, bulkEndTeacherAssignmentsService } from "@/services/teacher-assignment-service";

const assignmentErrorMessages = {
  ASSIGNMENTS_REQUIRED: "Pilih minimal satu penugasan.",
  ASSIGNMENT_ID_REQUIRED: "ID penugasan wajib diisi.",
  TEACHER_ASSIGNMENT_NOT_FOUND: "Penugasan tidak ditemukan.",
  TEACHER_ASSIGNMENT_ALREADY_ENDED: "Penugasan sudah diakhiri.",
  INVALID_EFFECTIVE_TO: "Tanggal akhir tidak valid.",
  INVALID_ASSIGNMENT_PERIOD: "Periode penugasan tidak valid.",
  INVALID_ASSIGNMENT_DATA: "Data penugasan tidak valid.",
  TEACHER_NOT_FOUND: "Guru tidak ditemukan.",
  TEACHER_NOT_ACTIVE: "Guru tidak aktif.",
  CLASS_NOT_FOUND: "Kelas tidak ditemukan.",
  CLASS_NOT_ACTIVE: "Kelas tidak aktif.",
  TEACHER_ASSIGNMENT_LIMIT_EXCEEDED: "Batas penugasan guru terlampaui.",
  TEACHER_CLASS_ASSIGNMENT_OVERLAP: "Penugasan kelas bertumpuk.",
  INVALID_EFFECTIVE_FROM: "Tanggal mulai tidak valid.",
  REQUIRED_SHEET_NOT_FOUND: "Sheet yang diperlukan tidak ditemukan.",
  GOOGLE_SHEETS_SPREADSHEET_ID_MISSING: "Konfigurasi Google Sheets tidak lengkap.",
};

function getAssignmentErrorMessage(code) {
  return assignmentErrorMessages[code] || "Terjadi kesalahan. Silakan coba lagi.";
}

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
      error: getAssignmentErrorMessage(error?.message),
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
      error: getAssignmentErrorMessage(error?.message),
    };
  }
}

export async function bulkEndTeacherAssignmentsAction(items) {
  try {
    const result = await bulkEndTeacherAssignmentsService(items);

    const mappedResult = {
      ...result,
      results: (result?.results || []).map((item) => ({
        ...item,
        reason: item?.reason ? getAssignmentErrorMessage(item.reason) : item?.reason,
      })),
      message: `Bulk end selesai: ${result.succeeded} berhasil, ${result.failed} gagal dari ${result.total} penugasan.`,
    };

    revalidatePath("/admin/assignments");
    revalidatePath("/admin/classes");
    revalidatePath("/admin");

    return mappedResult;
  } catch (error) {
    console.error("Bulk end teacher assignments failed:", error);

    return {
      success: false,
      error: getAssignmentErrorMessage(error?.message),
    };
  }
}
