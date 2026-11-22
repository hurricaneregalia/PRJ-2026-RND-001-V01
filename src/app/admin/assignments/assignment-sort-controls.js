// src/app/admin/assignments/assignment-sort-controls.js

"use client";

export default function AssignmentSortControls({ sortField, sortDirection, onSortFieldChange, onSortDirectionChange }) {
  return (
    <>
      <p>
        <label htmlFor="assignmentSortField">Urutkan Berdasarkan</label>
      </p>

      <select id="assignmentSortField" value={sortField} onChange={(event) => onSortFieldChange(event.target.value)}>
        <option value="updated_at">Terakhir Diperbarui</option>
        <option value="teacher_name">Nama Guru</option>
        <option value="class_name">Nama Kelas</option>
        <option value="effective_from">Tanggal Mulai</option>
        <option value="status">Status</option>
      </select>

      <p>
        <label htmlFor="assignmentSortDirection">Arah Pengurutan</label>
      </p>

      <select id="assignmentSortDirection" value={sortDirection} onChange={(event) => onSortDirectionChange(event.target.value)}>
        <option value="desc">Menurun</option>
        <option value="asc">Menaik</option>
      </select>
    </>
  );
}
