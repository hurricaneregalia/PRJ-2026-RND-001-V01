// src/app/admin/assignments/assignment-list.js

"use client";

import AssignmentListItem from "./assignment-list-item";

export default function AssignmentList({
  assignments,
  filteredAssignments,
  visibleAssignments,
  selectedAssignmentIds,
  allVisibleActiveSelected,
  visibleCount,
  loadMoreRef,
  todayWIB,
  onSelectAll,
  onSelectionChange,
}) {
  if (assignments.length === 0) {
    return <p>Belum ada penugasan guru.</p>;
  }

  if (filteredAssignments.length === 0) {
    return <p>Tidak ada penugasan yang sesuai dengan filter.</p>;
  }

  return (
    <>
      <p>
        <label>
          <input type="checkbox" checked={allVisibleActiveSelected} onChange={(event) => onSelectAll(event.target.checked)} />
          Pilih Semua Penugasan Aktif yang Ditampilkan
        </label>
      </p>

      <ul>
        {visibleAssignments.map((assignment) => (
          <AssignmentListItem
            key={assignment.assignment_id}
            assignment={assignment}
            todayWIB={todayWIB}
            selected={selectedAssignmentIds.includes(assignment.assignment_id)}
            onSelectionChange={onSelectionChange}
          />
        ))}
      </ul>

      {visibleCount < filteredAssignments.length && <div ref={loadMoreRef} aria-hidden="true" />}
    </>
  );
}
