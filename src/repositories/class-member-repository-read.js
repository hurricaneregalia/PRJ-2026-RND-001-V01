// src/repositories/class-member-repository-read.js

import "server-only";

import { getClassMembersData } from "./class-member-repository-data";
import { getActiveMemberships, isValidDate } from "./class-member-repository-validation";

export async function getAllClassMembers() {
  return getClassMembersData();
}

export async function getClassMemberById(membershipId) {
  if (!membershipId) {
    throw new Error("MEMBERSHIP_ID_REQUIRED");
  }

  const memberships = await getClassMembersData();

  return memberships.find((membership) => membership.membership_id === membershipId) || null;
}

export async function getClassMembersByStudentId(studentId) {
  if (!studentId) {
    throw new Error("STUDENT_ID_REQUIRED");
  }

  const memberships = await getClassMembersData();

  return memberships.filter((membership) => membership.student_id === studentId);
}

export async function getActiveClassMembershipByStudentId(studentId, date) {
  if (!studentId) {
    throw new Error("STUDENT_ID_REQUIRED");
  }

  if (!isValidDate(date)) {
    throw new Error("INVALID_MEMBERSHIP_CHECK_DATE");
  }

  const memberships = await getClassMembersData();

  return getActiveMemberships(memberships, studentId, date)[0] || null;
}
