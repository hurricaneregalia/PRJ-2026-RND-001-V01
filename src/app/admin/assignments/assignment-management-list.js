// src/app/admin/assignments/assignment-management-list.js

import { useMemo } from "react";

import { compareValues, getAssignmentStatus } from "./assignment-management-utils";

export function useFilteredAssignments({ assignments, todayWIB, teacherFilter, classFilter, statusFilter, effectiveFromFilter, sortField, sortDirection }) {
  return useMemo(() => {
    const filtered = assignments.filter((assignment) => {
      const status = getAssignmentStatus(assignment, todayWIB);

      if (teacherFilter !== "all" && assignment.user_id !== teacherFilter) {
        return false;
      }

      if (classFilter !== "all" && assignment.class_id !== classFilter) {
        return false;
      }

      if (statusFilter !== "all" && status !== statusFilter) {
        return false;
      }

      if (effectiveFromFilter && assignment.effective_from !== effectiveFromFilter) {
        return false;
      }

      return true;
    });

    return [...filtered].sort((first, second) => {
      let firstValue;
      let secondValue;

      switch (sortField) {
        case "teacher_name":
          firstValue = first.teacher_name;
          secondValue = second.teacher_name;
          break;

        case "class_name":
          firstValue = first.class_name;
          secondValue = second.class_name;
          break;

        case "effective_from":
          firstValue = first.effective_from;
          secondValue = second.effective_from;
          break;

        case "status":
          firstValue = getAssignmentStatus(first, todayWIB);
          secondValue = getAssignmentStatus(second, todayWIB);
          break;

        case "updated_at":
        default:
          firstValue = first.updated_at;
          secondValue = second.updated_at;
          break;
      }

      const comparison = compareValues(firstValue, secondValue);

      if (comparison !== 0) {
        return sortDirection === "asc" ? comparison : -comparison;
      }

      return compareValues(first.assignment_id, second.assignment_id);
    });
  }, [assignments, todayWIB, teacherFilter, classFilter, statusFilter, effectiveFromFilter, sortField, sortDirection]);
}
