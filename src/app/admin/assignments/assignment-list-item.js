// src/app/admin/assignments/assignment-list-item.js

"use client";

import { getAssignmentStatus, isAssignmentActiveToday } from "./assignment-management-utils";

export default function AssignmentListItem({ assignment, todayWIB, selected, onSelectionChange }) {
  const isActive = isAssignmentActiveToday(assignment, todayWIB);

  return (
    <li>
      <section>
        {isActive && (
          <p>
            <label>
              <input type="checkbox" checked={selected} onChange={(event) => onSelectionChange(assignment.assignment_id, event.target.checked)} />
              Pilih Penugasan
            </label>
          </p>
        )}

        <h3>{assignment.teacher_name}</h3>

        <p>Kelas: {assignment.class_name}</p>
        <p>Mulai: {assignment.effective_from}</p>
        <p>Berakhir: {assignment.effective_to || "-"}</p>

        <p>Status: {getAssignmentStatus(assignment, todayWIB)}</p>
      </section>
    </li>
  );
}
