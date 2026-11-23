// src/repositories/attendance-session-repository-read.js

import "server-only";

import { getAttendanceSessionsData } from "./attendance-session-repository-data";

export async function getAttendanceSessionById(sessionId) {
  const normalizedSessionId = String(sessionId || "").trim();

  if (!normalizedSessionId) {
    throw new Error("ATTENDANCE_SESSION_ID_REQUIRED");
  }

  const sessions = await getAttendanceSessionsData();

  return sessions.find((session) => session.session_id === normalizedSessionId) || null;
}

export async function getAttendanceSessionsByTeacherId(teacherUserId) {
  const normalizedTeacherUserId = String(teacherUserId || "").trim();

  if (!normalizedTeacherUserId) {
    throw new Error("ATTENDANCE_TEACHER_USER_ID_REQUIRED");
  }

  const sessions = await getAttendanceSessionsData();

  return sessions.filter((session) => session.teacher_user_id === normalizedTeacherUserId);
}

export async function getAttendanceSessionsByClassId(classId) {
  const normalizedClassId = String(classId || "").trim();

  if (!normalizedClassId) {
    throw new Error("ATTENDANCE_CLASS_ID_REQUIRED");
  }

  const sessions = await getAttendanceSessionsData();

  return sessions.filter((session) => session.class_id === normalizedClassId);
}

export async function getAttendanceSessionsByTeacherAndClass(teacherUserId, classId) {
  const normalizedTeacherUserId = String(teacherUserId || "").trim();
  const normalizedClassId = String(classId || "").trim();

  if (!normalizedTeacherUserId || !normalizedClassId) {
    throw new Error("ATTENDANCE_SESSION_LOOKUP_DATA_REQUIRED");
  }

  const sessions = await getAttendanceSessionsData();

  return sessions.filter(
    (session) => session.teacher_user_id === normalizedTeacherUserId && session.class_id === normalizedClassId,
  );
}