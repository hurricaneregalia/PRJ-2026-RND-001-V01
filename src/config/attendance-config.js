// src/config/attendance-config.js

export const ATTENDANCE_STATUS = Object.freeze({
  HADIR: "Hadir",
  SAKIT: "Sakit",
  IZIN: "Izin",
  ALPA: "Alpa",
});

export const ATTENDANCE_LOCATION_TYPE = Object.freeze({
  IN_CLASS: "IN_CLASS",
  OUTSIDE_CLASS: "OUTSIDE_CLASS",
});

export const ATTENDANCE_SESSION_HEADERS = Object.freeze([
  "session_id",
  "class_id",
  "teacher_user_id",
  "academic_year_id",
  "attendance_date",
  "location_type",
  "location_name",
  "location_note",
  "lesson_material",
  "created_at",
  "updated_at",
]);

export const ATTENDANCE_RECORD_HEADERS = Object.freeze([
  "attendance_id",
  "session_id",
  "student_id",
  "membership_id",
  "status",
  "created_at",
  "updated_at",
]);

export const ATTENDANCE_AUDIT_HEADERS = Object.freeze([
  "audit_id",
  "session_id",
  "attendance_id",
  "actor_user_id",
  "action_type",
  "old_data",
  "new_data",
  "reason",
  "changed_at",
]);

export const ATTENDANCE_AUDIT_ACTION_TYPES = Object.freeze({
  STATUS_UPDATED: "STATUS_UPDATED",
  LOCATION_UPDATED: "LOCATION_UPDATED",
  MATERIAL_UPDATED: "MATERIAL_UPDATED",
  SESSION_DELETED: "SESSION_DELETED",
  RECORD_DELETED: "RECORD_DELETED",
});
