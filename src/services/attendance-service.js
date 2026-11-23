// src/services/attendance-service.js

import "server-only";

import { USER_ROLES } from "@/config/user-config";
import { CLASS_STATUS } from "@/config/class-config";
import { requireRole } from "@/lib/authorization";

import {
  requireTeacherOrAdministrator,
  assertAttendanceSessionAccess,
  getTodayAttendanceDate,
  isAttendanceDateToday,
  validateAttendanceDate,
  validateLocationData,
  validateLessonMaterial,
  validateAttendanceStatus,
  validateAttendanceReason,
  assertTeacherActiveAssignment,
} from "./attendance-service-utils";

import { getClassById } from "@/repositories/class-repository";

import {
  getAttendanceSessionsData,
  getAttendanceSessionById,
  createAttendanceSession,
  updateAttendanceSession,
  deleteAttendanceSession,
} from "@/repositories/attendance-session-repository";

import {
  getAttendanceRecordById,
  getAttendanceRecordsBySessionId,
  updateAttendanceRecordStatus,
  updateAttendanceRecordsStatus,
} from "@/repositories/attendance-record-repository";

function toPublicSession(session) {
  if (!session) {
    return null;
  }

  const { row_number, ...publicSession } = session;

  return publicSession;
}

function toPublicRecord(record) {
  if (!record) {
    return null;
  }

  const { row_number, ...publicRecord } = record;

  return publicRecord;
}

export async function getAttendanceSessionsService(filters = {}) {
  const user = await requireTeacherOrAdministrator();

  const normalizedFilters = filters && typeof filters === "object" ? filters : {};

  const classId = String(normalizedFilters.class_id || "").trim();
  const attendanceDate = String(normalizedFilters.attendance_date || "").trim();
  const academicYearId = String(normalizedFilters.academic_year_id || "").trim();
  const locationType = String(normalizedFilters.location_type || "").trim();
  const requestedTeacherUserId = String(normalizedFilters.teacher_user_id || "").trim();

  let sessions = await getAttendanceSessionsData();

  if (user.role === USER_ROLES.TEACHER) {
    sessions = sessions.filter((session) => session.teacher_user_id === user.userId);
  } else if (requestedTeacherUserId) {
    sessions = sessions.filter((session) => session.teacher_user_id === requestedTeacherUserId);
  }

  if (classId) {
    sessions = sessions.filter((session) => session.class_id === classId);
  }

  if (attendanceDate) {
    sessions = sessions.filter((session) => session.attendance_date === attendanceDate);
  }

  if (academicYearId) {
    sessions = sessions.filter((session) => session.academic_year_id === academicYearId);
  }

  if (locationType) {
    sessions = sessions.filter((session) => session.location_type === locationType);
  }

  return sessions.map(toPublicSession);
}

export async function getAttendanceSessionDetailService(sessionId) {
  const user = await requireTeacherOrAdministrator();

  const normalizedSessionId = String(sessionId || "").trim();

  if (!normalizedSessionId) {
    throw new Error("ATTENDANCE_SESSION_ID_REQUIRED");
  }

  const session = await getAttendanceSessionById(normalizedSessionId);

  assertAttendanceSessionAccess(session, user);

  return toPublicSession(session);
}

export async function getAttendanceRecordsService(sessionId) {
  const user = await requireTeacherOrAdministrator();

  const normalizedSessionId = String(sessionId || "").trim();

  if (!normalizedSessionId) {
    throw new Error("ATTENDANCE_SESSION_ID_REQUIRED");
  }

  const session = await getAttendanceSessionById(normalizedSessionId);

  assertAttendanceSessionAccess(session, user);

  const records = await getAttendanceRecordsBySessionId(normalizedSessionId);

  return records.map(toPublicRecord);
}

export async function getAttendanceSessionWithRecordsService(sessionId) {
  const session = await getAttendanceSessionDetailService(sessionId);

  const records = await getAttendanceRecordsBySessionId(session.session_id);

  return {
    session,
    records: records.map(toPublicRecord),
  };
}

export async function createAttendanceSessionService(data) {
  const teacher = await requireRole([USER_ROLES.TEACHER]);

  const classId = String(data?.class_id || "").trim();

  if (!classId) {
    throw new Error("ATTENDANCE_CLASS_ID_REQUIRED");
  }

  const attendanceDate = getTodayAttendanceDate();

  if (!isAttendanceDateToday(attendanceDate) || !validateAttendanceDate(attendanceDate)) {
    throw new Error("INVALID_ATTENDANCE_DATE");
  }

  const classData = await getClassById(classId);

  if (!classData) {
    throw new Error("CLASS_NOT_FOUND");
  }

  if (classData.class_status !== CLASS_STATUS.ACTIVE) {
    throw new Error("CLASS_NOT_ACTIVE");
  }

  await assertTeacherActiveAssignment(teacher.userId, classId, attendanceDate);

  const locationData = validateLocationData(data);
  const lessonMaterial = validateLessonMaterial(data?.lesson_material);
  const reason = validateAttendanceReason(data?.reason, false);

  const result = await createAttendanceSession(
    {
      class_id: classId,
      teacher_user_id: teacher.userId,
      attendance_date: attendanceDate,
      location_type: locationData.location_type,
      location_name: locationData.location_name,
      location_note: locationData.location_note,
      lesson_material: lessonMaterial,
      student_statuses: data?.student_statuses,
    },
    {
      actor_user_id: teacher.userId,
      reason,
    },
  );

  return {
    session: toPublicSession(result.session),
    records: (result.records || []).map(toPublicRecord),
  };
}

export async function updateAttendanceSessionService(sessionId, data) {
  const user = await requireTeacherOrAdministrator();

  const normalizedSessionId = String(sessionId || "").trim();

  if (!normalizedSessionId) {
    throw new Error("ATTENDANCE_SESSION_ID_REQUIRED");
  }

  const session = await getAttendanceSessionById(normalizedSessionId);

  assertAttendanceSessionAccess(session, user);

  const locationData = validateLocationData({
    location_type: data?.location_type ?? session.location_type,
    location_name: data?.location_name ?? session.location_name,
    location_note: data?.location_note ?? session.location_note,
  });

  const lessonMaterial = validateLessonMaterial(
    data?.lesson_material === undefined ? session.lesson_material : data.lesson_material,
  );

  const reason = validateAttendanceReason(data?.reason, false);

  const result = await updateAttendanceSession(
    normalizedSessionId,
    {
      location_type: locationData.location_type,
      location_name: locationData.location_name,
      location_note: locationData.location_note,
      lesson_material: lessonMaterial,
    },
    {
      actor_user_id: user.userId,
      reason,
    },
  );

  return toPublicSession(result);
}

export async function updateAttendanceRecordStatusService(attendanceId, status, reason) {
  const user = await requireTeacherOrAdministrator();

  const normalizedAttendanceId = String(attendanceId || "").trim();

  if (!normalizedAttendanceId) {
    throw new Error("ATTENDANCE_ATTENDANCE_ID_REQUIRED");
  }

  const record = await getAttendanceRecordById(normalizedAttendanceId);

  if (!record) {
    throw new Error("ATTENDANCE_RECORD_NOT_FOUND");
  }

  const session = await getAttendanceSessionById(record.session_id);

  assertAttendanceSessionAccess(session, user);

  const validatedStatus = validateAttendanceStatus(status);
  const validatedReason = validateAttendanceReason(reason, false);

  const result = await updateAttendanceRecordStatus(
    normalizedAttendanceId,
    validatedStatus,
    {
      actor_user_id: user.userId,
      reason: validatedReason,
    },
  );

  return toPublicRecord(result);
}

export async function updateAttendanceRecordsStatusService(sessionId, updates, reason) {
  const user = await requireTeacherOrAdministrator();

  const normalizedSessionId = String(sessionId || "").trim();

  if (!normalizedSessionId) {
    throw new Error("ATTENDANCE_SESSION_ID_REQUIRED");
  }

  if (!Array.isArray(updates) || updates.length === 0) {
    throw new Error("ATTENDANCE_RECORD_UPDATES_REQUIRED");
  }

  const session = await getAttendanceSessionById(normalizedSessionId);

  assertAttendanceSessionAccess(session, user);

  const allowedRecords = await getAttendanceRecordsBySessionId(normalizedSessionId);
  const allowedRecordIds = new Set(allowedRecords.map((record) => record.attendance_id));

  const normalizedUpdates = updates.map((update, index) => {
    const attendanceId = String(update?.attendance_id || "").trim();

    if (!attendanceId) {
      throw new Error(`ATTENDANCE_ATTENDANCE_ID_REQUIRED:${index + 1}`);
    }

    if (!allowedRecordIds.has(attendanceId)) {
      throw new Error(`ATTENDANCE_RECORD_NOT_IN_SESSION:${index + 1}`);
    }

    return {
      attendance_id: attendanceId,
      status: validateAttendanceStatus(update?.status),
    };
  });

  const validatedReason = validateAttendanceReason(reason, false);

  const result = await updateAttendanceRecordsStatus(
    normalizedUpdates,
    {
      actor_user_id: user.userId,
      reason: validatedReason,
    },
  );

  return (result || []).map(toPublicRecord);
}

export async function deleteAttendanceSessionService(sessionId, reason) {
  const user = await requireRole([USER_ROLES.ADMINISTRATOR]);

  const normalizedSessionId = String(sessionId || "").trim();

  if (!normalizedSessionId) {
    throw new Error("ATTENDANCE_SESSION_ID_REQUIRED");
  }

  const session = await getAttendanceSessionById(normalizedSessionId);

  if (!session) {
    throw new Error("ATTENDANCE_SESSION_NOT_FOUND");
  }

  const validatedReason = validateAttendanceReason(reason, true);

  return deleteAttendanceSession(normalizedSessionId, {
    actor_user_id: user.userId,
    reason: validatedReason,
  });
}