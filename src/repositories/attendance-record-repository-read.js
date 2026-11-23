// src/repositories/attendance-record-repository-read.js

import "server-only";

import { getAttendanceRecordsData } from "./attendance-record-repository-data";

export async function getAttendanceRecordsBySessionId(sessionId) {
  const normalizedSessionId = String(sessionId || "").trim();

  if (!normalizedSessionId) {
    throw new Error("ATTENDANCE_SESSION_ID_REQUIRED");
  }

  const records = await getAttendanceRecordsData();

  return records.filter((record) => record.session_id === normalizedSessionId);
}

export async function getAttendanceRecordById(attendanceId) {
  const normalizedAttendanceId = String(attendanceId || "").trim();

  if (!normalizedAttendanceId) {
    throw new Error("ATTENDANCE_ATTENDANCE_ID_REQUIRED");
  }

  const records = await getAttendanceRecordsData();

  return records.find((record) => record.attendance_id === normalizedAttendanceId) || null;
}

export async function getAttendanceRecordsByStudentId(studentId) {
  const normalizedStudentId = String(studentId || "").trim();

  if (!normalizedStudentId) {
    throw new Error("ATTENDANCE_STUDENT_ID_REQUIRED");
  }

  const records = await getAttendanceRecordsData();

  return records.filter((record) => record.student_id === normalizedStudentId);
}