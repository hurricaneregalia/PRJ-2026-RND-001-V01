import "server-only";

import { requireRole } from "@/lib/authorization";

import { CLASS_STATUS } from "@/config/class-config";
import { STUDENT_STATUS } from "@/config/student-config";

import {
  getAllClassMembers,
  getClassMemberById,
  getClassMembersByStudentId,
  createClassMembership,
  endClassMembership,
  moveClassMembership,
  createClassMembershipsBulk,
  moveClassMembershipsBulk,
  endClassMembershipsBulk,
} from "@/repositories/class-member-repository";

import { getStudentById } from "@/repositories/student-repository";
import { getClassById } from "@/repositories/class-repository";

async function requireAdministrator() {
  return requireRole(["Administrator"]);
}

function validateDate(value, errorCode) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(errorCode);
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error(errorCode);
  }

  return value;
}

function validateReason(value) {
  if (value === undefined || value === null) {
    return "";
  }

  if (typeof value !== "string" || value.trim().length > 500) {
    throw new Error("INVALID_AUDIT_REASON");
  }

  return value.trim();
}

function getTodayWIB() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}`;
}

function validateBulkStudentIds(studentIds) {
  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    throw new Error("STUDENT_IDS_REQUIRED");
  }

  const normalizedIds = studentIds.map((id) => (typeof id === "string" ? id.trim() : ""));

  if (normalizedIds.some((id) => !id)) {
    throw new Error("INVALID_STUDENT_IDS");
  }

  if (new Set(normalizedIds).size !== normalizedIds.length) {
    throw new Error("DUPLICATE_STUDENT_IDS");
  }

  return normalizedIds;
}

async function validateStudentAndClass(studentId, classId) {
  const [student, classData] = await Promise.all([getStudentById(studentId), getClassById(classId)]);

  if (!student) {
    throw new Error("STUDENT_NOT_FOUND");
  }

  if (student.student_status !== STUDENT_STATUS.ACTIVE) {
    throw new Error("STUDENT_NOT_ACTIVE");
  }

  if (!classData) {
    throw new Error("CLASS_NOT_FOUND");
  }

  if (classData.class_status !== CLASS_STATUS.ACTIVE) {
    throw new Error("CLASS_NOT_ACTIVE");
  }

  return { student, classData };
}

async function validateBulkStudents(studentIds) {
  const validStudents = [];
  const skipped = [];

  const results = await Promise.all(
    studentIds.map(async (studentId) => {
      try {
        const student = await getStudentById(studentId);

        if (!student) {
          return {
            valid: false,
            student_id: studentId,
            student_name: studentId,
            reason: "STUDENT_NOT_FOUND",
          };
        }

        if (student.student_status !== STUDENT_STATUS.ACTIVE) {
          return {
            valid: false,
            student_id: studentId,
            student_name: student.full_name || studentId,
            reason: "STUDENT_NOT_ACTIVE",
          };
        }

        return {
          valid: true,
          student,
        };
      } catch (error) {
        throw error;
      }
    }),
  );

  for (const result of results) {
    if (result.valid) {
      validStudents.push(result.student);
    } else {
      skipped.push({
        student_id: result.student_id,
        student_name: result.student_name,
        reason: result.reason,
      });
    }
  }

  return { validStudents, skipped };
}

function enrichBulkResult(result, students, initialSkipped) {
  const studentMap = new Map(students.map((student) => [student.student_id, student.full_name || student.student_id]));

  const processed = (result?.processed || []).map((item) => ({
    ...item,
    student_name: studentMap.get(item.student_id) || item.student_id,
  }));

  const repositorySkipped = (result?.skipped || []).map((item) => ({
    ...item,
    student_name: studentMap.get(item.student_id) || item.student_id,
  }));

  const skipped = [...initialSkipped, ...repositorySkipped];

  return {
    processed,
    skipped,
    processed_count: processed.length,
    skipped_count: skipped.length,
  };
}

export async function getAllClassMembersService() {
  await requireAdministrator();

  return getAllClassMembers();
}

export async function getClassMemberDetailsService(membershipId) {
  await requireAdministrator();

  if (!membershipId) {
    throw new Error("MEMBERSHIP_ID_REQUIRED");
  }

  const membership = await getClassMemberById(membershipId);

  if (!membership) {
    throw new Error("CLASS_MEMBERSHIP_NOT_FOUND");
  }

  return membership;
}

export async function getStudentClassMembershipsService(studentId) {
  await requireAdministrator();

  if (!studentId) {
    throw new Error("STUDENT_ID_REQUIRED");
  }

  return getClassMembersByStudentId(studentId);
}

export async function createClassMembershipService(data) {
  const administrator = await requireAdministrator();

  const studentId = String(data?.student_id || "").trim();
  const classId = String(data?.class_id || "").trim();

  if (!studentId || !classId) {
    throw new Error("INVALID_CLASS_MEMBER_DATA");
  }

  const effectiveFrom = validateDate(data?.effective_from, "INVALID_EFFECTIVE_FROM");

  await validateStudentAndClass(studentId, classId);

  return createClassMembership(
    {
      student_id: studentId,
      class_id: classId,
      effective_from: effectiveFrom,
      effective_to: "",
    },
    {
      actor_user_id: administrator.userId,
      reason: validateReason(data?.reason),
    },
  );
}

export async function moveStudentToClassService(data) {
  const administrator = await requireAdministrator();

  const studentId = String(data?.student_id || "").trim();
  const newClassId = String(data?.new_class_id || "").trim();

  if (!studentId || !newClassId) {
    throw new Error("INVALID_CLASS_MEMBER_DATA");
  }

  const effectiveFrom = validateDate(data?.effective_from, "INVALID_EFFECTIVE_FROM");

  await validateStudentAndClass(studentId, newClassId);

  return moveClassMembership(studentId, newClassId, effectiveFrom, {
    actor_user_id: administrator.userId,
    reason: validateReason(data?.reason),
  });
}

export async function endClassMembershipService(membershipId, effectiveTo, reason = "") {
  const administrator = await requireAdministrator();

  if (!membershipId) {
    throw new Error("MEMBERSHIP_ID_REQUIRED");
  }

  const endDate = validateDate(effectiveTo, "INVALID_EFFECTIVE_TO");

  const membership = await getClassMemberById(membershipId);

  if (!membership) {
    throw new Error("CLASS_MEMBERSHIP_NOT_FOUND");
  }

  if (membership.effective_to) {
    throw new Error("MEMBERSHIP_ALREADY_ENDED");
  }

  if (endDate < membership.effective_from) {
    throw new Error("INVALID_MEMBERSHIP_DATE_RANGE");
  }

  return endClassMembership(membershipId, endDate, {
    actor_user_id: administrator.userId,
    reason: validateReason(reason),
  });
}

/**
 * Menempatkan banyak siswa ke satu kelas.
 * Tanggal efektif menggunakan tanggal hari ini berdasarkan WIB.
 */
export async function createClassMembershipsService(data) {
  const administrator = await requireAdministrator();

  const studentIds = validateBulkStudentIds(data?.student_ids);
  const classId = String(data?.class_id || "").trim();

  if (!classId) {
    throw new Error("CLASS_ID_REQUIRED");
  }

  const reason = validateReason(data?.reason);
  const effectiveDate = getTodayWIB();

  const classData = await getClassById(classId);

  if (!classData) {
    throw new Error("CLASS_NOT_FOUND");
  }

  if (classData.class_status !== CLASS_STATUS.ACTIVE) {
    throw new Error("CLASS_NOT_ACTIVE");
  }

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

  if (!classData) {
    throw new Error("CLASS_NOT_FOUND");
  }

  if (classData.class_status !== CLASS_STATUS.ACTIVE) {
    throw new Error("CLASS_NOT_ACTIVE");
  }

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
