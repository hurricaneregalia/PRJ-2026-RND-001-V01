// src/services/attendance-service-utils.js

import "server-only";

import { requireRole } from "@/lib/authorization";
import { USER_ROLES } from "@/config/user-config";
import { CLASS_STATUS } from "@/config/class-config";
import { ATTENDANCE_STATUS, ATTENDANCE_LOCATION_TYPE } from "@/config/attendance-config";
import { getTodayWIB } from "@/lib/attendance-date-utils";
import { isValidDate } from "@/repositories/class-member-repository-validation";

import { getAllClasses } from "@/repositories/class-repository";
import { getTeacherAssignmentsByTeacherId } from "@/repositories/teacher-assignment-repository";
import { getAttendanceSessionById } from "@/repositories/attendance-session-repository";

async function requireAdministrator() {
  return requireRole([USER_ROLES.ADMINISTRATOR]);
}

async function requireTeacher() {
  return requireRole([USER_ROLES.TEACHER]);
}

export async function requireTeacherOrAdministrator() {
  return requireRole([USER_ROLES.TEACHER, USER_ROLES.ADMINISTRATOR]);
}

export function validateAttendanceDate(value) {
  const normalizedValue = String(value || "").trim();

  if (!isValidDate(normalizedValue)) {
    throw new Error("INVALID_ATTENDANCE_DATE");
  }

  return normalizedValue;
}

export function validateDate(value, errorCode = "INVALID_DATE") {
  const normalizedValue = String(value || "").trim();

  if (!isValidDate(normalizedValue)) {
    throw new Error(errorCode);
  }

  return normalizedValue;
}

export function validateLocationType(value) {
  const normalizedValue = String(value || "").trim();

  if (!Object.values(ATTENDANCE_LOCATION_TYPE).includes(normalizedValue)) {
    throw new Error("INVALID_ATTENDANCE_LOCATION_TYPE");
  }

  return normalizedValue;
}

export function validateLocationName(locationType, value) {
  const normalizedType = validateLocationType(locationType);

  if (normalizedType === ATTENDANCE_LOCATION_TYPE.IN_CLASS) {
    return "";
  }

  const normalizedName = String(value || "").trim();

  if (!normalizedName) {
    throw new Error("ATTENDANCE_LOCATION_NAME_REQUIRED");
  }

  if (normalizedName.length > 150) {
    throw new Error("INVALID_ATTENDANCE_LOCATION_NAME");
  }

  return normalizedName;
}

export function validateLocationData(data) {
  const locationType = validateLocationType(data?.location_type);
  const locationName = validateLocationName(locationType, data?.location_name);
  const locationNote = String(data?.location_note || "").trim();

  if (locationNote.length > 1000) {
    throw new Error("INVALID_ATTENDANCE_LOCATION_NOTE");
  }

  return {
    location_type: locationType,
    location_name: locationName,
    location_note: locationNote,
  };
}

export function validateLessonMaterial(value) {
  const normalizedValue = String(value || "").trim();

  if (!normalizedValue || normalizedValue.length > 5000) {
    throw new Error("INVALID_ATTENDANCE_LESSON_MATERIAL");
  }

  return normalizedValue;
}

export function validateAttendanceStatus(value) {
  const normalizedValue = String(value || "").trim();

  if (!Object.values(ATTENDANCE_STATUS).includes(normalizedValue)) {
    throw new Error("INVALID_ATTENDANCE_STATUS");
  }

  return normalizedValue;
}

export function validateAttendanceReason(value, required = false) {
  if (value === undefined || value === null) {
    if (required) {
      throw new Error("ATTENDANCE_DELETE_REASON_REQUIRED");
    }

    return "";
  }

  if (typeof value !== "string") {
    throw new Error("INVALID_AUDIT_REASON");
  }

  const normalizedValue = value.trim();

  if (required && !normalizedValue) {
    throw new Error("ATTENDANCE_DELETE_REASON_REQUIRED");
  }

  if (normalizedValue.length > 500) {
    throw new Error("INVALID_AUDIT_REASON");
  }

  return normalizedValue;
}

export function getTodayAttendanceDate() {
  return getTodayWIB();
}

export function isAttendanceDateToday(value) {
  return String(value || "").trim() === getTodayWIB();
}

export async function getTeacherActiveAssignmentsOnDate(userId, attendanceDate) {
  const normalizedUserId = String(userId || "").trim();
  const normalizedDate = validateAttendanceDate(attendanceDate);

  if (!normalizedUserId) {
    throw new Error("ATTENDANCE_TEACHER_USER_ID_REQUIRED");
  }

  const assignments = await getTeacherAssignmentsByTeacherId(normalizedUserId);

  return assignments.filter((assignment) => {
    return (
      assignment.effective_from <= normalizedDate &&
      (!assignment.effective_to || assignment.effective_to >= normalizedDate)
    );
  });
}

export async function getTeacherActiveAssignmentOnDate(userId, classId, attendanceDate) {
  const normalizedUserId = String(userId || "").trim();
  const normalizedClassId = String(classId || "").trim();
  const normalizedDate = validateAttendanceDate(attendanceDate);

  if (!normalizedUserId || !normalizedClassId) {
    throw new Error("ATTENDANCE_SESSION_LOOKUP_DATA_REQUIRED");
  }

  const assignments = await getTeacherActiveAssignmentsOnDate(normalizedUserId, normalizedDate);

  return assignments.find((assignment) => assignment.class_id === normalizedClassId) || null;
}

export async function assertTeacherActiveAssignment(userId, classId, attendanceDate) {
  const assignment = await getTeacherActiveAssignmentOnDate(userId, classId, attendanceDate);

  if (!assignment) {
    throw new Error("TEACHER_ASSIGNMENT_NOT_ACTIVE_ON_DATE");
  }

  return assignment;
}

export async function getTeacherAccessibleClassIds(userId, attendanceDate, activeClassesOnly = true) {
  const normalizedUserId = String(userId || "").trim();
  const normalizedDate = validateAttendanceDate(attendanceDate);

  if (!normalizedUserId) {
    throw new Error("ATTENDANCE_TEACHER_USER_ID_REQUIRED");
  }

  const assignments = await getTeacherActiveAssignmentsOnDate(normalizedUserId, normalizedDate);
  const classes = await getAllClasses();

  const allowedClassIds = activeClassesOnly
    ? new Set(classes.filter((classData) => classData.class_status === CLASS_STATUS.ACTIVE).map((classData) => classData.class_id))
    : new Set(classes.map((classData) => classData.class_id));

  return new Set(
    assignments
      .filter((assignment) => allowedClassIds.has(assignment.class_id))
      .map((assignment) => assignment.class_id),
  );
}

export function isAttendanceSessionAccessible(session, user) {
  if (!session || !user) {
    return false;
  }

  if (user.role === USER_ROLES.ADMINISTRATOR) {
    return true;
  }

  return user.role === USER_ROLES.TEACHER && session.teacher_user_id === user.userId;
}

export function assertAttendanceSessionAccess(session, user) {
  if (!session) {
    throw new Error("ATTENDANCE_SESSION_NOT_FOUND");
  }

  if (!isAttendanceSessionAccessible(session, user)) {
    throw new Error("ATTENDANCE_SESSION_FORBIDDEN");
  }

  return session;
}

export { requireAdministrator, requireTeacher };