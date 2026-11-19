// src/app/admin/academic-years/actions.js
"use server";

import { revalidatePath } from "next/cache";

import { createAcademicYearService, updateAcademicYearService, activateAcademicYearService } from "@/services/academic-year-service";

export async function createAcademicYearAction(data) {
  try {
    const result = await createAcademicYearService(data);

    revalidatePath("/admin/academic-years");
    revalidatePath("/admin");

    return {
      success: true,
      data: result,
      message: "Tahun ajaran berhasil dibuat.",
    };
  } catch (error) {
    console.error("Create academic year failed:", error);

    return {
      success: false,
      error: error.message || "Gagal membuat tahun ajaran.",
    };
  }
}

export async function updateAcademicYearAction(academicYearId, updates) {
  try {
    const result = await updateAcademicYearService(academicYearId, updates);

    revalidatePath("/admin/academic-years");
    revalidatePath(`/admin/academic-years/${academicYearId}`);
    revalidatePath("/admin");

    return {
      success: true,
      data: result,
      message: "Tahun ajaran berhasil diperbarui.",
    };
  } catch (error) {
    console.error("Update academic year failed:", error);

    return {
      success: false,
      error: error.message || "Gagal memperbarui tahun ajaran.",
    };
  }
}

export async function activateAcademicYearAction(academicYearId) {
  try {
    const result = await activateAcademicYearService(academicYearId);

    revalidatePath("/admin/academic-years");
    revalidatePath("/admin");

    return {
      success: true,
      data: result,
      message: "Tahun ajaran berhasil diaktifkan.",
    };
  } catch (error) {
    console.error("Activate academic year failed:", error);

    return {
      success: false,
      error: error.message || "Gagal mengaktifkan tahun ajaran.",
    };
  }
}
