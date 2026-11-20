// src/services/student-service.js

import "server-only";

import { requireRole } from "@/lib/authorization";

import { USER_ROLES } from "@/config/user-config";
import { CLASS_STATUS } from "@/config/class-config";

import { STUDENT_STATUS, STUDENT_GENDER, STUDENT_PARENT_RELATIONS, STUDENT_EDITABLE_FIELDS_BY_TEACHER } from "@/config/student-config";

import { getAllStudents, getStudentById, createStudent, updateStudent } from "@/repositories/student-repository";

import { getAllClassMembers } from "@/repositories/class-member-repository";

import { getTeacherAssignmentsByTeacherId } from "@/repositories/teacher-assignment-repository";

import { getAllClasses } from "@/repositories/class-repository";

function getTodayWIB() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}`;
}

function validateText(value, errorCode, maxLength = 150) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > maxLength) {
    throw new Error(errorCode);
  }

  return value.trim();
}

function validateOptionalText(value, maxLength = 150) {
  if (value === undefined || value === null) {
    return "";
  }

  if (typeof value !== "string" || value.trim().length > maxLength) {
    throw new Error("INVALID_OPTIONAL_STUDENT_DATA");
  }

  return value.trim();
}

function validateStudentNumber(studentNumber) {
  const value = validateOptionalText(studentNumber, 50);
  return value;
}

function validateStudentGender(gender) {
  if (!Object.values(STUDENT_GENDER).includes(gender)) {
    throw new Error("INVALID_STUDENT_GENDER");
  }

  return gender;
}

function validateStudentStatus(status) {
  if (!Object.values(STUDENT_STATUS).includes(status)) {
    throw new Error("INVALID_STUDENT_STATUS");
  }

  return status;
}

function validateParentRelation(relation) {
  if (!STUDENT_PARENT_RELATIONS.includes(relation)) {
    throw new Error("INVALID_PARENT_RELATION");
  }

  return relation;
}

function validateStudentData(data) {
  return {
    student_number: validateStudentNumber(data?.student_number),
    full_name: validateText(data?.full_name, "INVALID_STUDENT_NAME", 150),
    gender: validateStudentGender(data?.gender),
    parent_name: validateText(data?.parent_name, "INVALID_PARENT_NAME", 150),
    parent_relation: validateParentRelation(data?.parent_relation),
    parent_whatsapp: validateText(data?.parent_whatsapp, "INVALID_PARENT_WHATSAPP", 30),
    student_status: validateStudentStatus(data?.student_status),
  };
}

function getActiveAssignments(assignments, today) {
  return assignments.filter((assignment) => assignment.effective_from <= today && (!assignment.effective_to || assignment.effective_to >= today));
}

async function getTeacherAccessibleClassIds(userId) {
  const today = getTodayWIB();

  const assignments = await getTeacherAssignmentsByTeacherId(userId);
  const activeAssignments = getActiveAssignments(assignments, today);
  const classes = await getAllClasses();

  const activeClassIds = new Set(classes.filter((item) => item.class_status === CLASS_STATUS.ACTIVE).map((item) => item.class_id));

  return new Set(activeAssignments.filter((assignment) => activeClassIds.has(assignment.class_id)).map((assignment) => assignment.class_id));
}

async function getTeacherAccessibleStudentIds(userId) {
  const [classIds, memberships] = await Promise.all([getTeacherAccessibleClassIds(userId), getAllClassMembers()]);

  const today = getTodayWIB();

  return new Set(
    memberships
      .filter((membership) => classIds.has(membership.class_id) && membership.effective_from <= today && (!membership.effective_to || membership.effective_to >= today))
      .map((membership) => membership.student_id),
  );
}

async function requireAdministrator() {
  return requireRole([USER_ROLES.ADMINISTRATOR]);
}

async function requireTeacher() {
  return requireRole([USER_ROLES.TEACHER]);
}

export async function getAllStudentsService() {
  await requireAdministrator();

  return getAllStudents();
}

export async function getStudentDetailsService(studentId) {
  const user = await requireRole([USER_ROLES.ADMINISTRATOR, USER_ROLES.TEACHER]);

  if (!studentId) {
    throw new Error("STUDENT_ID_REQUIRED");
  }

  const student = await getStudentById(studentId);

  if (!student) {
    throw new Error("STUDENT_NOT_FOUND");
  }

  if (user.role === USER_ROLES.TEACHER) {
    const accessibleStudentIds = await getTeacherAccessibleStudentIds(user.userId);

    if (!accessibleStudentIds.has(studentId)) {
      throw new Error("FORBIDDEN");
    }
  }

  return student;
}

export async function getTeacherStudentsService() {
  const teacher = await requireTeacher();

  const accessibleStudentIds = await getTeacherAccessibleStudentIds(teacher.userId);

  if (accessibleStudentIds.size === 0) {
    return [];
  }

  const students = await getAllStudents();

  return students.filter((student) => accessibleStudentIds.has(student.student_id));
}

export async function createStudentService(data) {
  const administrator = await requireAdministrator();

  const studentData = validateStudentData(data);

  return createStudent(studentData, {
    actor_user_id: administrator.userId,
    reason: validateOptionalText(data?.reason, 500),
  });
}

export async function updateStudentService(studentId, data) {
  const user = await requireRole([USER_ROLES.ADMINISTRATOR, USER_ROLES.TEACHER]);

  if (!studentId) {
    throw new Error("STUDENT_ID_REQUIRED");
  }

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("INVALID_STUDENT_DATA");
  }

  const existing = await getStudentById(studentId);

  if (!existing) {
    throw new Error("STUDENT_NOT_FOUND");
  }

  if (user.role === USER_ROLES.TEACHER) {
    const accessibleStudentIds = await getTeacherAccessibleStudentIds(user.userId);

    if (!accessibleStudentIds.has(studentId)) {
      throw new Error("FORBIDDEN");
    }

    const submittedFields = Object.keys(data).filter((field) => field !== "reason");

    const invalidFields = submittedFields.filter((field) => !STUDENT_EDITABLE_FIELDS_BY_TEACHER.includes(field));

    if (invalidFields.length > 0) {
      throw new Error("FORBIDDEN_STUDENT_FIELD_UPDATE");
    }
  }

  const updatedData = {};

  if (data.student_number !== undefined) {
    updatedData.student_number = validateStudentNumber(data.student_number);
  }

  if (data.full_name !== undefined) {
    updatedData.full_name = validateText(data.full_name, "INVALID_STUDENT_NAME", 150);
  }

  if (data.gender !== undefined) {
    updatedData.gender = validateStudentGender(data.gender);
  }

  if (data.parent_name !== undefined) {
    updatedData.parent_name = validateText(data.parent_name, "INVALID_PARENT_NAME", 150);
  }

  if (data.parent_relation !== undefined) {
    updatedData.parent_relation = validateParentRelation(data.parent_relation);
  }

  if (data.parent_whatsapp !== undefined) {
    updatedData.parent_whatsapp = validateText(data.parent_whatsapp, "INVALID_PARENT_WHATSAPP", 30);
  }

  if (data.student_status !== undefined) {
    updatedData.student_status = validateStudentStatus(data.student_status);
  }

  if (Object.keys(updatedData).length === 0) {
    throw new Error("NO_STUDENT_CHANGES");
  }

  return updateStudent(studentId, updatedData, {
    actor_user_id: user.userId,
    reason: validateOptionalText(data.reason, 500),
  });
}
