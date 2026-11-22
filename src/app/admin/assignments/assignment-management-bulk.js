// src/app/admin/assignments/assignment-management-bulk.js

import { useMemo } from "react";

import { isAssignmentActiveToday } from "./assignment-management-utils";

export function useAssignmentBulkSelection({ assignments, visibleAssignments, selectedAssignmentIds, todayWIB }) {
  const selectedActiveAssignments = useMemo(
    () => assignments.filter((assignment) => selectedAssignmentIds.includes(assignment.assignment_id) && isAssignmentActiveToday(assignment, todayWIB)),
    [assignments, selectedAssignmentIds, todayWIB],
  );

  const visibleActiveAssignments = useMemo(() => visibleAssignments.filter((assignment) => isAssignmentActiveToday(assignment, todayWIB)), [visibleAssignments, todayWIB]);

  const allVisibleActiveSelected = visibleActiveAssignments.length > 0 && visibleActiveAssignments.every((assignment) => selectedAssignmentIds.includes(assignment.assignment_id));

  return {
    selectedActiveAssignments,
    visibleActiveAssignments,
    allVisibleActiveSelected,
  };
}
