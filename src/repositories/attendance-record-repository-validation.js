// src/repositories/attendance-record-repository-validation.js

import "server-only";

import { ATTENDANCE_STATUS } from "@/config/attendance-config";

export function assertValidAttendanceStatus(status) {
  const normalizedStatus = String(status || "").trim();

  if (!Object.values(ATTENDANCE_STATUS).includes(normalizedStatus)) {
    throw new Error("INVALID_ATTENDANCE_STATUS");
  }

  return normalizedStatus;
}

export function assertValidRecordData(data) {
  const attendanceId = String(data?.attendance_id || "").trim();
  const sessionId = String(data?.session_id || "").trim();
  const studentId = String(data?.student_id || "").trim();
  const membershipId = String(data?.membership_id || "").trim();
  const status = assertValidAttendanceStatus(data?.status);

  if (!sessionId) {
    throw new Error("ATTENDANCE_SESSION_ID_REQUIRED");
  }

  if (!studentId) {
    throw new Error("ATTENDANCE_STUDENT_ID_REQUIRED");
  }

  if (!membershipId) {
    throw new Error("ATTENDANCE_MEMBERSHIP_ID_REQUIRED");
  }

  return {
    attendance_id: attendanceId,
    session_id: sessionId,
    student_id: studentId,
    membership_id: membershipId,
    status,
  };
}