// src/services/class-member-service-bulk.js

import "server-only";

import { requireRole } from "@/lib/authorization";

import { validateBulkStudentIds, validateReason, validateDate, validateStudentData, validateClassData, enrichBulkResult } from "./class-member-service-utils";
import { getTodayWIB } from "@/lib/attendance-date-utils";

import { getAllStudents } from "@/repositories/student-repository";
import { getClassById } from "@/repositories/class-repository";

import { createClassMembershipsBulk, moveClassMembershipsBulk, endClassMembershipsBulk } from "@/repositories/class-member-repository";

async function requireAdministrator() {
  return requireRole(["Administrator"]);
}

/**
 * Membaca seluruh data siswa satu kali,
 * kemudian memvalidasi setiap siswa yang dipilih.
 */
async function validateBulkStudents(studentIds) {
  const allStudents = await getAllStudents();

  const studentMap = new Map(allStudents.map((student) => [student.student_id, student]));

  const validStudents = [];
  const skipped = [];

  for (const studentId of studentIds) {
    const student = studentMap.get(studentId);

    try {
      validateStudentData(student);
      validStudents.push(student);
    } catch (error) {
      skipped.push({
        student_id: studentId,
        student_name: student?.full_name || studentId,
        reason: error.message || "STUDENT_VALIDATION_FAILED",
      });
    }
  }

  return { validStudents, skipped };
}

/**
 * Menempatkan banyak siswa ke satu kelas.
 * Tanggal efektif menggunakan nilai effective_from dari pemanggil.
 */
export async function createClassMembershipsService(data) {
  const administrator = await requireAdministrator();

  const studentIds = validateBulkStudentIds(data?.student_ids);
  const classId = String(data?.class_id || "").trim();

  if (!classId) {
    throw new Error("CLASS_ID_REQUIRED");
  }

  const reason = validateReason(data?.reason);
  const effectiveDate = validateDate(data?.effective_from, "INVALID_EFFECTIVE_FROM");

  const classData = await getClassById(classId);
  validateClassData(classData);

  const { validStudents, skipped } = await validateBulkStudents(studentIds);

  if (validStudents.length === 0) {
    return enrichBulkResult({ processed: [], skipped: [] }, [], skipped);
  }

  const result = await createClassMembershipsBulk(
    validStudents.map((student) => student.student_id),
    classId,
    effectiveDate,
    {
      actor_user_id: administrator.userId,
      reason,
    },
  );

  return enrichBulkResult(result, validStudents, skipped);
}

/**
 * Memindahkan banyak siswa ke satu kelas.
 * Tanggal efektif menggunakan tanggal hari ini berdasarkan WIB.
 */
export async function moveClassMembershipsService(data) {
  const administrator = await requireAdministrator();

  const studentIds = validateBulkStudentIds(data?.student_ids);
  const newClassId = String(data?.new_class_id || "").trim();

  if (!newClassId) {
    throw new Error("CLASS_ID_REQUIRED");
  }

  const reason = validateReason(data?.reason);
  const effectiveDate = getTodayWIB();

  const classData = await getClassById(newClassId);
  validateClassData(classData);

  const { validStudents, skipped } = await validateBulkStudents(studentIds);

  if (validStudents.length === 0) {
    return enrichBulkResult({ processed: [], skipped: [] }, [], skipped);
  }

  const result = await moveClassMembershipsBulk(
    validStudents.map((student) => student.student_id),
    newClassId,
    effectiveDate,
    {
      actor_user_id: administrator.userId,
      reason,
    },
  );

  return enrichBulkResult(result, validStudents, skipped);
}

/**
 * Mengakhiri keanggotaan kelas banyak siswa.
 * Tanggal efektif menggunakan tanggal hari ini berdasarkan WIB.
 */
export async function endClassMembershipsService(data) {
  const administrator = await requireAdministrator();

  const studentIds = validateBulkStudentIds(data?.student_ids);
  const reason = validateReason(data?.reason);
  const effectiveDate = getTodayWIB();

  const { validStudents, skipped } = await validateBulkStudents(studentIds);

  if (validStudents.length === 0) {
    return enrichBulkResult({ processed: [], skipped: [] }, [], skipped);
  }

  const result = await endClassMembershipsBulk(
    validStudents.map((student) => student.student_id),
    effectiveDate,
    {
      actor_user_id: administrator.userId,
      reason,
    },
  );

  return enrichBulkResult(result, validStudents, skipped);
}
