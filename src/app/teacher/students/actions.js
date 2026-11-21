"use server";

import { revalidatePath } from "next/cache";

import { updateStudentService } from "@/services/student-service";

/**
 * Memperbarui data siswa oleh Guru.
 * Hak akses dan pembatasan lima field divalidasi oleh Service Layer.
 */
export async function updateTeacherStudentAction(studentId, data) {
  const result = await updateStudentService(studentId, data);

  revalidatePath("/teacher/students");
  revalidatePath(`/teacher/students/${studentId}`);

  return result;
}
