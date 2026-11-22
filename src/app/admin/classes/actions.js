// src/app/admin/classes/actions.js
"use server";

import { revalidatePath } from "next/cache";

import { createClassService, updateClassService, bulkUpdateClassStatusService } from "@/services/class-service";

const classErrorMessages = {
  CLASS_ID_REQUIRED: "ID kelas wajib diisi.",
  CLASS_NOT_FOUND: "Kelas tidak ditemukan.",
  INVALID_CLASS_DATA: "Data kelas tidak valid.",
  INVALID_CLASS_STATUS: "Status kelas tidak valid.",
  INVALID_CLASS_NAME: "Nama kelas tidak valid.",
  CLASS_ALREADY_EXISTS: "Nama kelas sudah digunakan.",
  NO_CLASS_CHANGES: "Tidak ada perubahan kelas.",
  CLASS_IDS_REQUIRED: "Pilih minimal satu kelas.",
  INVALID_CLASSES_HEADERS: "Header sheet Classes tidak valid.",
  REQUIRED_SHEET_NOT_FOUND: "Sheet yang diperlukan tidak ditemukan.",
  GOOGLE_SHEETS_SPREADSHEET_ID_MISSING: "Konfigurasi Google Sheets tidak lengkap.",
};

function getClassErrorMessage(code) {
  return classErrorMessages[code] || "Terjadi kesalahan. Silakan coba lagi.";
}

export async function createClassAction(data) {
  try {
    const result = await createClassService(data);

    revalidatePath("/admin/classes");
    revalidatePath("/admin");

    return {
      success: true,
      data: result,
      message: "Kelas berhasil ditambahkan.",
    };
  } catch (error) {
    console.error("Create class failed:", error);

    return {
      success: false,
      error: getClassErrorMessage(error?.message),
    };
  }
}

export async function updateClassAction(classId, updates) {
  try {
    const result = await updateClassService(classId, updates);

    revalidatePath("/admin/classes");
    revalidatePath(`/admin/classes/${classId}`);
    revalidatePath("/admin");

    return {
      success: true,
      data: result,
      message: "Data kelas berhasil diperbarui.",
    };
  } catch (error) {
    console.error("Update class failed:", error);

    return {
      success: false,
      error: getClassErrorMessage(error?.message),
    };
  }
}

export async function bulkUpdateClassStatusAction(classIds, status) {
  try {
    const result = await bulkUpdateClassStatusService(classIds, status);

    const mappedResult = {
      ...result,
      results: (result?.results || []).map((item) => ({
        ...item,
        reason: item?.reason ? getClassErrorMessage(item.reason) : item?.reason,
      })),
    };

    revalidatePath("/admin/classes");
    revalidatePath("/admin");

    return mappedResult;
  } catch (error) {
    console.error("Bulk update class status failed:", error);

    return {
      success: false,
      error: getClassErrorMessage(error?.message),
    };
  }
}
