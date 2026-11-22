// src/app/admin/assignments/assignment-management-utils.js

export function getAssignmentStatus(assignment, today) {
  if (assignment.effective_from > today) {
    return "Belum aktif";
  }

  if (assignment.effective_to && assignment.effective_to < today) {
    return "Sudah berakhir";
  }

  return "Masih aktif";
}

export function isAssignmentActiveToday(assignment, today) {
  return assignment.effective_from <= today && (!assignment.effective_to || assignment.effective_to >= today);
}

export function compareValues(first, second) {
  return String(first || "").localeCompare(String(second || ""), "id", {
    sensitivity: "base",
    numeric: true,
  });
}
