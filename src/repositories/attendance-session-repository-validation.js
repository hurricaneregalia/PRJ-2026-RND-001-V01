// src/repositories/attendance-session-repository-validation.js

import "server-only";

import { isValidDate } from "./class-member-repository-validation";
import { getWeekRangeWIB, getAcademicYearId } from "@/lib/attendance-date-utils";
import { ATTENDANCE_STATUS, ATTENDANCE_LOCATION_TYPE } from "@/config/attendance-config";
import { assertValidAttendanceStatus } from "./attendance-record-repository-validation";

export { isValidDate };

export function assertValidLocationType(locationType) {
  const normalizedType = String(locationType || "").trim();

  if (!Object.values(ATTENDANCE_LOCATION_TYPE).includes(normalizedType)) {
    throw new Error("INVALID_ATTENDANCE_LOCATION_TYPE");
  }

  return normalizedType;
}

export function normalizeLocationName(locationType, locationName) {
  const normalizedType = assertValidLocationType(locationType);
  const normalizedName = String(locationName || "").trim();

  if (normalizedType === ATTENDANCE_LOCATION_TYPE.IN_CLASS) {
    return "";
  }

  if (!normalizedName) {
    throw new Error("ATTENDANCE_LOCATION_NAME_REQUIRED");
  }

  if (normalizedName.length > 150) {
    throw new Error("INVALID_ATTENDANCE_LOCATION_NAME");
  }

  return normalizedName;
}

export function assertValidSessionData(data) {
  const classId = String(data?.class_id || "").trim();
  const teacherUserId = String(data?.teacher_user_id || "").trim();
  const attendanceDate = String(data?.attendance_date || "").trim();
  const locationType = assertValidLocationType(data?.location_type);
  const locationName = normalizeLocationName(locationType, data?.location_name);
  const locationNote = String(data?.location_note || "").trim();
  const lessonMaterial = String(data?.lesson_material || "").trim();

  if (!classId) {
    throw new Error("ATTENDANCE_CLASS_ID_REQUIRED");
  }

  if (!teacherUserId) {
    throw new Error("ATTENDANCE_TEACHER_USER_ID_REQUIRED");
  }

  if (!isValidDate(attendanceDate)) {
    throw new Error("INVALID_ATTENDANCE_DATE");
  }

  if (!lessonMaterial || lessonMaterial.length > 5000) {
    throw new Error("INVALID_ATTENDANCE_LESSON_MATERIAL");
  }

  if (locationNote.length > 1000) {
    throw new Error("INVALID_ATTENDANCE_LOCATION_NOTE");
  }

  return {
    class_id: classId,
    teacher_user_id: teacherUserId,
    attendance_date: attendanceDate,
    academic_year_id: getAcademicYearId(attendanceDate),
    location_type: locationType,
    location_name: locationName,
    location_note: locationNote,
    lesson_material: lessonMaterial,
  };
}

export function assertTeacherAssignmentActiveOnDate(assignments, teacherUserId, classId, attendanceDate) {
  const activeAssignments = (assignments || []).filter((assignment) => {
    return (
      assignment.user_id === teacherUserId &&
      assignment.class_id === classId &&
      assignment.effective_from <= attendanceDate &&
      (!assignment.effective_to || assignment.effective_to >= attendanceDate)
    );
  });

  if (activeAssignments.length === 0) {
    throw new Error("TEACHER_ASSIGNMENT_NOT_ACTIVE_ON_DATE");
  }

  return activeAssignments[0];
}

export function assertNoSessionInSameWeek(sessions, teacherUserId, classId, attendanceDate) {
  const { weekStart, weekEnd } = getWeekRangeWIB(attendanceDate);

  const duplicate = (sessions || []).some((session) => {
    return (
      session.teacher_user_id === teacherUserId &&
      session.class_id === classId &&
      session.attendance_date >= weekStart &&
      session.attendance_date <= weekEnd
    );
  });

  if (duplicate) {
    throw new Error("ATTENDANCE_SESSION_DUPLICATE_IN_WEEK");
  }
}

export function getActiveClassMembers(memberships, classId, attendanceDate) {
  return (memberships || []).filter((membership) => {
    return (
      membership.class_id === classId &&
      membership.effective_from <= attendanceDate &&
      (!membership.effective_to || membership.effective_to >= attendanceDate)
    );
  });
}

export function buildAttendanceRecordStatusMap(studentStatuses, activeMemberships) {
  const statusMap = new Map();

  if (studentStatuses === undefined || studentStatuses === null) {
    return statusMap;
  }

  if (!Array.isArray(studentStatuses)) {
    throw new Error("INVALID_ATTENDANCE_STUDENT_STATUSES");
  }

  const membershipStudentIds = new Set(
    (activeMemberships || []).map((membership) => membership.student_id),
  );

  studentStatuses.forEach((studentStatus, index) => {
    const studentId = String(studentStatus?.student_id || "").trim();

    if (!studentId) {
      throw new Error(`ATTENDANCE_STUDENT_ID_REQUIRED:${index + 1}`);
    }

    if (statusMap.has(studentId)) {
      throw new Error(`DUPLICATE_ATTENDANCE_STUDENT_IDS:${index + 1}`);
    }

    if (!membershipStudentIds.has(studentId)) {
      throw new Error(`ATTENDANCE_STUDENT_NOT_IN_CLASS:${index + 1}`);
    }

    statusMap.set(studentId, assertValidAttendanceStatus(studentStatus?.status));
  });

  return statusMap;
}