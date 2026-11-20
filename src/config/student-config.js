// src/config/student-config.js

export const STUDENT_STATUS = Object.freeze({
  ACTIVE: "active",
  INACTIVE: "inactive",
  GRADUATED: "graduated",
  TRANSFERRED: "transferred",
});

export const STUDENT_GENDER = Object.freeze({
  MALE: "Laki-laki",
  FEMALE: "Perempuan",
});

export const STUDENT_PARENT_RELATIONS = Object.freeze(["Ibu", "Ayah"]);

export const STUDENT_HEADERS = Object.freeze([
  "student_id",
  "student_number",
  "full_name",
  "gender",
  "parent_name",
  "parent_relation",
  "parent_whatsapp",
  "student_status",
  "created_at",
  "updated_at",
]);

export const STUDENT_EDITABLE_FIELDS_BY_TEACHER = Object.freeze(["full_name", "gender", "parent_name", "parent_relation", "parent_whatsapp"]);

export const STUDENT_REQUIRED_FIELDS = Object.freeze(["full_name", "gender", "student_status"]);
