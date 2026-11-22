// src/app/admin/assignments/assignment-management-options.js

import { useMemo } from "react";

import { compareValues, isAssignmentActiveToday } from "./assignment-management-utils";

export function useAssignmentManagementOptions({ teachers, classes, assignments, todayWIB, effectiveFrom = "" }) {
  const currentAssignments = useMemo(() => assignments.filter((assignment) => isAssignmentActiveToday(assignment, todayWIB)), [assignments, todayWIB]);

  const selectedDate = effectiveFrom || todayWIB;

  const selectedDateAssignments = useMemo(() => assignments.filter((assignment) => isAssignmentActiveToday(assignment, selectedDate)), [assignments, selectedDate]);

  const teacherClassCounts = useMemo(() => {
    const counts = new Map();

    currentAssignments.forEach((assignment) => {
      if (!assignment.user_id || !assignment.class_id) return;

      if (!counts.has(assignment.user_id)) {
        counts.set(assignment.user_id, new Set());
      }

      counts.get(assignment.user_id).add(assignment.class_id);
    });

    return counts;
  }, [currentAssignments]);

  const teachersWithAssignments = useMemo(() => {
    const assignedTeacherIds = new Set(currentAssignments.map((assignment) => assignment.user_id));

    return teachers
      .filter((teacher) => assignedTeacherIds.has(teacher.user_id))
      .map((teacher) => ({
        ...teacher,
        classCount: teacherClassCounts.get(teacher.user_id)?.size || 0,
      }))
      .sort((a, b) => compareValues(a.full_name, b.full_name));
  }, [teachers, currentAssignments, teacherClassCounts]);

  const classesWithAssignments = useMemo(() => {
    const assignedClassIds = new Set(currentAssignments.map((assignment) => assignment.class_id));

    return classes.filter((item) => assignedClassIds.has(item.class_id)).sort((a, b) => compareValues(a.class_name, b.class_name));
  }, [classes, currentAssignments]);

  const availableTeachers = useMemo(
    () => teachers.filter((teacher) => (teacherClassCounts.get(teacher.user_id)?.size || 0) < 2).sort((a, b) => compareValues(a.full_name, b.full_name)),
    [teachers, teacherClassCounts],
  );

  const availableClasses = useMemo(() => {
    const assignedClassIds = new Set(selectedDateAssignments.map((assignment) => assignment.class_id));

    return classes.filter((item) => !assignedClassIds.has(item.class_id)).sort((a, b) => compareValues(a.class_name, b.class_name));
  }, [classes, selectedDateAssignments]);

  const canCreateAssignment = availableTeachers.length > 0 && availableClasses.length > 0;

  return {
    currentAssignments,
    teacherClassCounts,
    teachersWithAssignments,
    classesWithAssignments,
    availableTeachers,
    availableClasses,
    canCreateAssignment,
  };
}
