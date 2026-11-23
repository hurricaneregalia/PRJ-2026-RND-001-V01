// src/services/attendance-page-service.js

import "server-only";

import { requireRole } from "@/lib/authorization";

import { USER_ROLES } from "@/config/user-config";
import { CLASS_STATUS } from "@/config/class-config";
import { ATTENDANCE_STATUS } from "@/config/attendance-config";

import { getTodayWIB, getWeekRangeWIB } from "@/lib/attendance-date-utils";

import { getAllClasses, getClassById } from "@/repositories/class-repository";
import { getAllClassMembers } from "@/repositories/class-member-repository";
import { getAllStudents } from "@/repositories/student-repository";
import { getUserById } from "@/repositories/user-repository";
import { getActiveClassMembers } from "@/repositories/attendance-session-repository-validation";

import {
  getTeacherActiveAssignmentsOnDate,
  assertTeacherActiveAssignment,
  validateAttendanceDate,
} from "./attendance-service-utils";

import {
  getAttendanceSessionsService,
  getAttendanceSessionWithRecordsService,
} from "./attendance-service";

function toPublicClass(classData) {
  if (!classData) {
    return null;
  }

  return {
    class_id: classData.class_id,
    class_name: classData.class_name,
  };
}

function toPublicStudent(student) {
  if (!student) {
    return {
      student_id: "",
      student_number: "",
      full_name: "",
    };
  }

  return {
    student_id: student.student_id,
    student_number: student.student_number,
    full_name: student.full_name,
  };
}

function sortSessions(sessions) {
  return [...sessions].sort((first, second) => {
    const dateComparison = String(second.attendance_date).localeCompare(String(first.attendance_date));

    if (dateComparison !== 0) {
      return dateComparison;
    }

    return String(second.created_at).localeCompare(String(first.created_at));
  });
}

export async function getTeacherAttendancePageDataService() {
  const teacher = await requireRole([USER_ROLES.TEACHER]);

  const todayWIB = getTodayWIB();
  const { weekStart, weekEnd } = getWeekRangeWIB(todayWIB);

  const [assignments, classes, sessions] = await Promise.all([
    getTeacherActiveAssignmentsOnDate(teacher.userId, todayWIB),
    getAllClasses(),
    getAttendanceSessionsService({}),
  ]);

  const classMap = new Map(classes.map((classData) => [classData.class_id, toPublicClass(classData)]));
  const activeClassIds = new Set(
    classes
      .filter((classData) => classData.class_status === CLASS_STATUS.ACTIVE)
      .map((classData) => classData.class_id),
  );

  const assignedClassIds = new Set(
    assignments
      .map((assignment) => assignment.class_id)
      .filter((classId) => activeClassIds.has(classId)),
  );

  const classesData = [...assignedClassIds]
    .map((classId) => {
      const classData = classMap.get(classId);

      const hasSessionThisWeek = sessions.some((session) => {
        return (
          session.class_id === classId &&
          session.attendance_date >= weekStart &&
          session.attendance_date <= weekEnd
        );
      });

      return {
        class_id: classId,
        class_name: classData?.class_name || "",
        has_session_this_week: hasSessionThisWeek,
      };
    })
    .sort((first, second) => first.class_name.localeCompare(second.class_name, "id"));

  const sessionsData = sortSessions(
    sessions.map((session) => ({
      ...session,
      class_name: classMap.get(session.class_id)?.class_name || "",
    })),
  );

  return {
    todayWIB,
    classes: classesData,
    sessions: sessionsData,
  };
}

export async function getAttendanceSessionPageDataService(sessionId) {
  const { session, records } = await getAttendanceSessionWithRecordsService(sessionId);

  const [classData, teacher, students] = await Promise.all([
    getClassById(session.class_id),
    getUserById(session.teacher_user_id),
    getAllStudents(),
  ]);

  const studentMap = new Map(
    students.map((student) => [
      student.student_id,
      {
        student_number: student.student_number,
        full_name: student.full_name,
      },
    ]),
  );

  const publicRecords = records.map((record) => {
    const student = studentMap.get(record.student_id);

    return {
      attendance_id: record.attendance_id,
      session_id: record.session_id,
      student_id: record.student_id,
      status: record.status,
      created_at: record.created_at,
      updated_at: record.updated_at,
      student_name: student?.full_name || "",
      student_number: student?.student_number || "",
    };
  });

  return {
    session: {
      ...session,
      class_name: classData?.class_name || "",
      teacher_name: teacher?.full_name || "",
    },
    records: publicRecords,
  };
}

export async function getTeacherAttendanceRosterPreviewService(classId, attendanceDate) {
  const teacher = await requireRole([USER_ROLES.TEACHER]);

  const normalizedClassId = String(classId || "").trim();

  if (!normalizedClassId) {
    throw new Error("ATTENDANCE_CLASS_ID_REQUIRED");
  }

  const normalizedDate = validateAttendanceDate(attendanceDate);

  const classData = await getClassById(normalizedClassId);

  if (!classData) {
    throw new Error("CLASS_NOT_FOUND");
  }

  if (classData.class_status !== CLASS_STATUS.ACTIVE) {
    throw new Error("CLASS_NOT_ACTIVE");
  }

  await assertTeacherActiveAssignment(teacher.userId, normalizedClassId, normalizedDate);

  const memberships = await getAllClassMembers();
  const activeMemberships = getActiveClassMembers(memberships, normalizedClassId, normalizedDate);
  const activeStudentIds = new Set(activeMemberships.map((membership) => membership.student_id));

  const students = (await getAllStudents()).filter((student) => activeStudentIds.has(student.student_id));
  const studentMap = new Map(students.map((student) => [student.student_id, student]));

  const roster = activeMemberships
    .map((membership) => {
      const student = studentMap.get(membership.student_id);

      return {
        ...toPublicStudent(student),
        student_id: membership.student_id,
        status: ATTENDANCE_STATUS.HADIR,
      };
    })
    .sort((first, second) => first.full_name.localeCompare(second.full_name, "id"));

  return {
    class_id: normalizedClassId,
    class_name: classData.class_name,
    attendance_date: normalizedDate,
    students: roster,
  };
}
