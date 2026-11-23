"use server";

import {
  getAttendanceSessionsAction as getAttendanceSessionsShared,
  getAttendanceSessionDetailAction as getAttendanceSessionDetailShared,
  getAttendanceRecordsAction as getAttendanceRecordsShared,
  getAttendanceSessionWithRecordsAction as getAttendanceSessionWithRecordsShared,
  getAttendanceRosterPreviewAction as getAttendanceRosterPreviewShared,
  createAttendanceSessionAction as createAttendanceSessionShared,
  updateAttendanceSessionAction as updateAttendanceSessionShared,
  updateAttendanceRecordStatusAction as updateAttendanceRecordStatusShared,
  updateAttendanceRecordsStatusAction as updateAttendanceRecordsStatusShared,
  deleteAttendanceSessionAction as deleteAttendanceSessionShared,
} from "@/app/attendance/actions";

export async function getAttendanceSessionsAction(filters = {}) {
  return getAttendanceSessionsShared(filters);
}

export async function getAttendanceSessionDetailAction(sessionId) {
  return getAttendanceSessionDetailShared(sessionId);
}

export async function getAttendanceRecordsAction(sessionId) {
  return getAttendanceRecordsShared(sessionId);
}

export async function getAttendanceSessionWithRecordsAction(sessionId) {
  return getAttendanceSessionWithRecordsShared(sessionId);
}

export async function getAttendanceRosterPreviewAction(classId) {
  return getAttendanceRosterPreviewShared(classId);
}

export async function createAttendanceSessionAction(data) {
  return createAttendanceSessionShared(data);
}

export async function updateAttendanceSessionAction(sessionId, data) {
  return updateAttendanceSessionShared(sessionId, data);
}

export async function updateAttendanceRecordStatusAction(attendanceId, status, reason = "") {
  return updateAttendanceRecordStatusShared(attendanceId, status, reason);
}

export async function updateAttendanceRecordsStatusAction(sessionId, updates, reason = "") {
  return updateAttendanceRecordsStatusShared(sessionId, updates, reason);
}

export async function deleteAttendanceSessionAction(sessionId, reason) {
  return deleteAttendanceSessionShared(sessionId, reason);
}