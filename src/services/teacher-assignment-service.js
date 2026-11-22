// src/services/teacher-assignment-service.js
import "server-only";

import { requireRole } from "@/lib/authorization";
import { USER_ROLES, USER_STATUS } from "@/config/user-config";
import { CLASS_STATUS } from "@/config/class-config";

import {
  getAllTeacherAssignments,
  getTeacherAssignmentById,
  getTeacherAssignmentsByTeacherId,
  getTeacherAssignmentsByClassId,
  createTeacherAssignment,
  endTeacherAssignment,
} from "@/repositories/teacher-assignment-repository";

import { getUserById, getAllUsers } from "@/repositories/user-repository";

import { getClassById, getAllClasses } from "@/repositories/class-repository";
import { bulkEndTeacherAssignments } from "@/repositories/teacher-assignment-repository-bulk";

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

function hasDateOverlap(first, second) {
  const firstEnd = first.effective_to || "9999-12-31";
  const secondEnd = second.effective_to || "9999-12-31";

  return first.effective_from <= secondEnd && second.effective_from <= firstEnd;
}

function validateAssignmentLimit(assignments, newAssignment) {
  const intervals = [
    ...assignments.map((item) => ({
      effective_from: item.effective_from,
      effective_to: item.effective_to,
      class_id: item.class_id,
    })),
    newAssignment,
  ];

  const startDates = [...new Set(intervals.map((item) => item.effective_from))];

  for (const date of startDates) {
    const concurrent = intervals.filter((item) => {
      const endDate = item.effective_to || "9999-12-31";

      return item.effective_from <= date && endDate >= date;
    });

    if (concurrent.length > 2) {
      throw new Error("TEACHER_ASSIGNMENT_LIMIT_EXCEEDED");
    }
  }
}

function validateClassAssignmentOverlap(classAssignments, newAssignment) {
  const overlapping = classAssignments.some((assignment) => hasDateOverlap(assignment, newAssignment));

  if (overlapping) {
    throw new Error("TEACHER_CLASS_ASSIGNMENT_OVERLAP");
  }
}

async function requireAdministrator() {
  return requireRole(["Administrator"]);
}

export async function getTeacherAssignmentPageDataService() {
  await requireAdministrator();

  const [users, classes, assignments] = await Promise.all([getAllUsers(), getAllClasses(), getAllTeacherAssignments()]);

  const teachers = users
    .filter((user) => user.role === USER_ROLES.TEACHER && user.account_status === USER_STATUS.ACTIVE)
    .map((user) => ({
      user_id: user.user_id,
      username: user.username,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      account_status: user.account_status,
    }));

  const activeClasses = classes
    .filter((item) => item.class_status === CLASS_STATUS.ACTIVE)
    .map(({ row_number, ...classData }) => classData);

  const enrichedAssignments = assignments.map((assignment) => {
    const { row_number, ...assignmentData } = assignment;

    const teacher = users.find((user) => user.user_id === assignment.user_id);

    const classData = classes.find((item) => item.class_id === assignment.class_id);

    return {
      ...assignmentData,
      teacher_name: teacher?.full_name || "",
      class_name: classData?.class_name || "",
    };
  });

  return {
    teachers,
    classes: activeClasses,
    assignments: enrichedAssignments,
  };
}

export async function getAllTeacherAssignmentsService() {
  await requireAdministrator();

  const [assignments, users, classes] = await Promise.all([getAllTeacherAssignments(), getAllUsers(), getAllClasses()]);

  return assignments.map((assignment) => {
    const { row_number, ...assignmentData } = assignment;

    const teacher = users.find((user) => user.user_id === assignment.user_id);

    const classData = classes.find((item) => item.class_id === assignment.class_id);

    return {
      ...assignmentData,
      teacher_name: teacher?.full_name || "",
      class_name: classData?.class_name || "",
    };
  });
}

export async function getTeacherAssignmentDetailsService(assignmentId) {
  await requireAdministrator();

  if (!assignmentId) {
    throw new Error("ASSIGNMENT_ID_REQUIRED");
  }

  return getTeacherAssignmentById(assignmentId);
}

export async function getTeacherAssignmentsByTeacherService(userId) {
  await requireAdministrator();

  if (!userId) {
    throw new Error("TEACHER_ID_REQUIRED");
  }

  return getTeacherAssignmentsByTeacherId(userId);
}

export async function createTeacherAssignmentService(data) {
  const administrator = await requireAdministrator();

  const userId = String(data?.user_id || "").trim();
  const classId = String(data?.class_id || "").trim();

  const effectiveFrom = validateDate(data?.effective_from, "INVALID_EFFECTIVE_FROM");

  if (!userId || !classId) {
    throw new Error("INVALID_ASSIGNMENT_DATA");
  }

  const [teacher, classData, teacherAssignments, classAssignments] = await Promise.all([
    getUserById(userId),
    getClassById(classId),
    getTeacherAssignmentsByTeacherId(userId),
    getTeacherAssignmentsByClassId(classId),
  ]);

  if (!teacher) {
    throw new Error("TEACHER_NOT_FOUND");
  }

  if (teacher.role !== USER_ROLES.TEACHER || teacher.account_status !== USER_STATUS.ACTIVE) {
    throw new Error("TEACHER_NOT_ACTIVE");
  }

  if (!classData) {
    throw new Error("CLASS_NOT_FOUND");
  }

  if (classData.class_status !== CLASS_STATUS.ACTIVE) {
    throw new Error("CLASS_NOT_ACTIVE");
  }

  const newAssignment = {
    effective_from: effectiveFrom,
    effective_to: "",
    class_id: classId,
  };

  validateAssignmentLimit(teacherAssignments, newAssignment);

  validateClassAssignmentOverlap(classAssignments, newAssignment);

  return createTeacherAssignment(
    {
      user_id: userId,
      class_id: classId,
      effective_from: effectiveFrom,
    },
    {
      actor_user_id: administrator.userId,
      reason: data?.reason || "",
    },
  );
}

export async function endTeacherAssignmentService(assignmentId, effectiveTo, reason = "") {
  const administrator = await requireAdministrator();

  if (!assignmentId) {
    throw new Error("ASSIGNMENT_ID_REQUIRED");
  }

  const endDate = validateDate(effectiveTo, "INVALID_EFFECTIVE_TO");

  const assignment = await getTeacherAssignmentById(assignmentId);

  if (!assignment) {
    throw new Error("ASSIGNMENT_NOT_FOUND");
  }

  if (assignment.effective_to) {
    throw new Error("ASSIGNMENT_ALREADY_ENDED");
  }

  if (endDate < assignment.effective_from) {
    throw new Error("INVALID_ASSIGNMENT_PERIOD");
  }

  return endTeacherAssignment(assignmentId, endDate, {
    actor_user_id: administrator.userId,
    reason,
  });
}

export async function bulkEndTeacherAssignmentsService(items) {
  const administrator = await requireAdministrator();

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("ASSIGNMENTS_REQUIRED");
  }

  const uniqueItems = [...new Map(items.filter((item) => item && typeof item.assignment_id === "string").map((item) => [item.assignment_id, item])).values()];

  if (uniqueItems.length === 0) {
    throw new Error("ASSIGNMENTS_REQUIRED");
  }

  return bulkEndTeacherAssignments(uniqueItems, {
    actor_user_id: administrator.userId,
    reason: "Bulk mengakhiri penugasan oleh administrator.",
  });
}
