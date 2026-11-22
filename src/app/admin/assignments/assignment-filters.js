// src/app/admin/assignments/assignment-filters.js

"use client";

export default function AssignmentFilters({
  teacherFilter,
  classFilter,
  statusFilter,
  effectiveFromFilter,
  teachersWithAssignments,
  classesWithAssignments,
  onTeacherFilterChange,
  onClassFilterChange,
  onStatusFilterChange,
  onEffectiveFromFilterChange,
}) {
  return (
    <>
      <p>
        <label htmlFor="teacherFilter">Filter Guru</label>
      </p>

      <select id="teacherFilter" value={teacherFilter} onChange={(event) => onTeacherFilterChange(event.target.value)}>
        <option value="all">Semua Guru</option>

        {teachersWithAssignments.map((teacher) => (
          <option key={teacher.user_id} value={teacher.user_id}>
            {teacher.full_name} ({teacher.classCount})
          </option>
        ))}
      </select>

      <p>
        <label htmlFor="classFilter">Filter Kelas</label>
      </p>

      <select id="classFilter" value={classFilter} onChange={(event) => onClassFilterChange(event.target.value)}>
        <option value="all">Semua Kelas</option>

        {classesWithAssignments.map((item) => (
          <option key={item.class_id} value={item.class_id}>
            {item.class_name}
          </option>
        ))}
      </select>

      <p>
        <label htmlFor="statusFilter">Filter Status</label>
      </p>

      <select id="statusFilter" value={statusFilter} onChange={(event) => onStatusFilterChange(event.target.value)}>
        <option value="all">Semua Status</option>
        <option value="Belum aktif">Belum aktif</option>
        <option value="Masih aktif">Masih aktif</option>
        <option value="Sudah berakhir">Sudah berakhir</option>
      </select>

      <p>
        <label htmlFor="effectiveFromFilter">Filter Tanggal Mulai</label>
      </p>

      <input id="effectiveFromFilter" type="date" value={effectiveFromFilter} onChange={(event) => onEffectiveFromFilterChange(event.target.value)} />
    </>
  );
}
