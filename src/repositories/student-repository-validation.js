// src/repositories/student-repository-validation.js

import "server-only";

import { STUDENT_STATUS, STUDENT_GENDER, STUDENT_PARENT_RELATIONS } from "@/config/student-config";

import { getStudentsData } from "./student-repository-data";

export function normalizeStudentNumber(value) {
  return String(value ?? "").trim();
}

export function assertValidStudentData(data) {
  const studentNumber = normalizeStudentNumber(data?.student_number);
  const fullName = String(data?.full_name ?? "").trim();
  const gender = String(data?.gender ?? "").trim();
  const parentName = String(data?.parent_name ?? "").trim();
  const parentRelation = String(data?.parent_relation ?? "").trim();
  const parentWhatsapp = String(data?.parent_whatsapp ?? "").trim();
  const studentStatus = String(data?.student_status ?? "").trim();

  if (studentNumber.length > 50) {
    throw new Error("INVALID_STUDENT_NUMBER");
  }

  if (!fullName || fullName.length > 150) {
    throw new Error("INVALID_STUDENT_NAME");
  }

  if (!Object.values(STUDENT_STATUS).includes(studentStatus)) {
    throw new Error("INVALID_STUDENT_STATUS");
  }

  if (!Object.values(STUDENT_GENDER).includes(gender)) {
    throw new Error("INVALID_STUDENT_GENDER");
  }

  if (!parentName || parentName.length > 150) {
    throw new Error("INVALID_PARENT_NAME");
  }

  if (!STUDENT_PARENT_RELATIONS.includes(parentRelation)) {
    throw new Error("INVALID_PARENT_RELATION");
  }

  if (!parentWhatsapp || parentWhatsapp.length > 30) {
    throw new Error("INVALID_PARENT_WHATSAPP");
  }

  return {
    student_number: studentNumber,
    full_name: fullName,
    gender,
    parent_name: parentName,
    parent_relation: parentRelation,
    parent_whatsapp: parentWhatsapp,
    student_status: studentStatus,
  };
}

export async function assertUniqueStudentNumber(studentNumber, excludeStudentId = null) {
  if (!studentNumber) {
    return;
  }

  const normalizedNumber = studentNumber.toLowerCase();
  const students = await getStudentsData();

  const duplicate = students.some(
    (student) => student.student_id !== excludeStudentId && student.student_number.toLowerCase() === normalizedNumber,
  );

  if (duplicate) {
    throw new Error("STUDENT_NUMBER_ALREADY_EXISTS");
  }
}

export function shouldEndClassMembership(existingStatus, newStatus) {
  const terminalStatuses = [STUDENT_STATUS.GRADUATED, STUDENT_STATUS.TRANSFERRED];

  return existingStatus !== newStatus && terminalStatuses.includes(newStatus);
}
