// src/services/class-member-service.js

import "server-only";

import { requireRole } from "@/lib/authorization";

import { CLASS_STATUS } from "@/config/class-config";
import { STUDENT_STATUS } from "@/config/student-config";

import { getAllClassMembers, getClassMemberById, getClassMembersByStudentId, createClassMembership, endClassMembership, moveClassMembership } from "@/repositories/class-member-repository";

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
