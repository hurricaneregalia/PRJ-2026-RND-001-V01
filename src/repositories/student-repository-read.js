// src/repositories/student-repository-read.js

import "server-only";

import { getStudentsData } from "./student-repository-data";
import { normalizeStudentNumber } from "./student-repository-validation";

export async function getAllStudents() {
  return getStudentsData();
}

export async function getStudentById(studentId) {
  if (!studentId) {
    throw new Error("STUDENT_ID_REQUIRED");
  }

  const students = await getStudentsData();

  return students.find((student) => student.student_id === studentId) || null;
}

export async function getStudentByNumber(studentNumber) {
  const normalizedNumber = normalizeStudentNumber(studentNumber);

  if (!normalizedNumber) {
    return null;
  }

  const students = await getStudentsData();

  return students.find((student) => student.student_number.toLowerCase() === normalizedNumber.toLowerCase()) || null;
}
