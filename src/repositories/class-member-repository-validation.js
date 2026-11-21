// src/repositories/class-member-repository-validation.js

import "server-only";

export function isValidDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function assertValidMembershipData(data) {
  const studentId = String(data?.student_id || "").trim();
  const classId = String(data?.class_id || "").trim();
  const effectiveFrom = String(data?.effective_from || "").trim();
  const effectiveTo = String(data?.effective_to || "").trim();

  if (!studentId || !classId) {
    throw new Error("INVALID_CLASS_MEMBER_DATA");
  }

  if (!isValidDate(effectiveFrom)) {
    throw new Error("INVALID_EFFECTIVE_FROM");
  }

  if (effectiveTo && !isValidDate(effectiveTo)) {
    throw new Error("INVALID_EFFECTIVE_TO");
  }

  if (effectiveTo && effectiveTo < effectiveFrom) {
    throw new Error("INVALID_MEMBERSHIP_DATE_RANGE");
  }

  return {
    student_id: studentId,
    class_id: classId,
    effective_from: effectiveFrom,
    effective_to: effectiveTo,
  };
}

export function hasDateOverlap(startA, endA, startB, endB) {
  const normalizedEndA = endA || "9999-12-31";
  const normalizedEndB = endB || "9999-12-31";

  return startA <= normalizedEndB && startB <= normalizedEndA;
}

export function assertNoMembershipOverlap(memberships, studentId, effectiveFrom, effectiveTo, excludeMembershipId = null) {
  const overlap = memberships.some((membership) => {
    if (membership.student_id !== studentId) {
      return false;
    }

    if (membership.membership_id === excludeMembershipId) {
      return false;
    }

    return hasDateOverlap(effectiveFrom, effectiveTo, membership.effective_from, membership.effective_to);
  });

  if (overlap) {
    throw new Error("STUDENT_MEMBERSHIP_DATE_OVERLAP");
  }
}

export function getPreviousDate(value) {
  const date = new Date(`${value}T00:00:00.000Z`);

  date.setUTCDate(date.getUTCDate() - 1);

  return date.toISOString().slice(0, 10);
}

export function getActiveMemberships(memberships, studentId, date) {
  return memberships.filter((membership) => membership.student_id === studentId && membership.effective_from <= date && (!membership.effective_to || membership.effective_to >= date));
}

export function validateBulkStudentIds(studentIds) {
  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    throw new Error("STUDENT_IDS_REQUIRED");
  }

  const normalizedIds = studentIds.map((id) => String(id || "").trim());

  if (normalizedIds.some((id) => !id)) {
    throw new Error("INVALID_STUDENT_ID");
  }

  if (new Set(normalizedIds).size !== normalizedIds.length) {
    throw new Error("DUPLICATE_STUDENT_IDS");
  }

  return normalizedIds;
}
