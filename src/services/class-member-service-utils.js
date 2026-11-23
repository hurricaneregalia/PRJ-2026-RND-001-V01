// src/services/class-member-service-utils.js

import { CLASS_STATUS } from "@/config/class-config";
import { STUDENT_STATUS } from "@/config/student-config";

export function validateDate(value, errorCode) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(errorCode);
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error(errorCode);
  }

  return value;
}

export function validateReason(value) {
  if (value === undefined || value === null) {
    return "";
  }

  if (typeof value !== "string" || value.trim().length > 500) {
    throw new Error("INVALID_AUDIT_REASON");
  }

  return value.trim();
}

export function validateBulkStudentIds(studentIds) {
  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    throw new Error("STUDENT_IDS_REQUIRED");
  }

  const normalizedIds = studentIds.map((id) => (typeof id === "string" ? id.trim() : ""));

  if (normalizedIds.some((id) => !id)) {
    throw new Error("INVALID_STUDENT_IDS");
  }

  if (new Set(normalizedIds).size !== normalizedIds.length) {
    throw new Error("DUPLICATE_STUDENT_IDS");
  }

  return normalizedIds;
}

export function validateStudentData(student) {
  if (!student) {
    throw new Error("STUDENT_NOT_FOUND");
  }

  if (student.student_status !== STUDENT_STATUS.ACTIVE) {
    throw new Error("STUDENT_NOT_ACTIVE");
  }

  return student;
}

export function validateClassData(classData) {
  if (!classData) {
    throw new Error("CLASS_NOT_FOUND");
  }

  if (classData.class_status !== CLASS_STATUS.ACTIVE) {
    throw new Error("CLASS_NOT_ACTIVE");
  }

  return classData;
}

export function enrichBulkResult(result, students, initialSkipped) {
  const studentMap = new Map(students.map((student) => [student.student_id, student.full_name || student.student_id]));

  const processed = (result?.processed || []).map((item) => ({
    ...item,
    student_name: studentMap.get(item.student_id) || item.student_id,
  }));

  const repositorySkipped = (result?.skipped || []).map((item) => ({
    ...item,
    student_name: studentMap.get(item.student_id) || item.student_id,
  }));

  const skipped = [...initialSkipped, ...repositorySkipped];

  return {
    processed,
    skipped,
    processed_count: processed.length,
    skipped_count: skipped.length,
  };
}
