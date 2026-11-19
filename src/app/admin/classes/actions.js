"use server";

import { revalidatePath } from "next/cache";

import { createClassService, updateClassService } from "@/services/class-service";

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
      error: error.message || "Gagal menambahkan kelas.",
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
      error: error.message || "Gagal memperbarui data kelas.",
    };
  }
}
