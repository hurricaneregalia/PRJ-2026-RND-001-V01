"use client";

import { useState } from "react";

export default function StudentCheckboxList({
  students = [],
  selectedIds = [],
  onChange,
  disabled = false,
}) {
  const [selected, setSelected] = useState(selectedIds);
  const sortedStudents = [...students].sort((left, right) => {
    const leftName = left?.nama ?? left?.name ?? left?.siswa_id ?? left?.id ?? "";
    const rightName = right?.nama ?? right?.name ?? right?.siswa_id ?? right?.id ?? "";

    return String(leftName).localeCompare(String(rightName), "id", {
      sensitivity: "base",
    });
  });

  function toggle(studentId) {
    const next = selected.includes(studentId)
      ? selected.filter((id) => id !== studentId)
      : [...selected, studentId];

    setSelected(next);

    if (onChange) {
      onChange(next);
    }
  }

  if (students.length === 0) {
    return <p>Belum ada siswa tersedia.</p>;
  }

  return (
    <ul>
      {sortedStudents.map((student) => {
        const studentId = student.siswa_id ?? student.id;

        return (
          <li key={studentId}>
            <label>
              <input
                type="checkbox"
                value={studentId}
                checked={selected.includes(studentId)}
                onChange={() => toggle(studentId)}
                disabled={disabled}
              />{" "}
              {student.nama ?? student.name ?? studentId}
              {student.nis ? ` | ${student.nis}` : ""}
            </label>
          </li>
        );
      })}
    </ul>
  );
}
