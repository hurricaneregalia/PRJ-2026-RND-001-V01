// src/app/admin/classes/[classId]/class-membership-placement.js
"use client";

import ClassMembershipBulkResult from "./class-membership-bulk-result";

export default function ClassMembershipPlacement({
  placementStudents,
  students,
  studentsWithActiveMembership,
  selectedIds,
  setSelectedIds,
  placementReason,
  setPlacementReason,
  handleSelection,
  handleSelectAll,
  handleBulkPlacement,
  isPending,
  result,
}) {
  const studentIds = placementStudents.map((student) => student.student_id);

  return (
    <section>
      <h3>1. Penempatan Siswa ke Kelas</h3>

      <p>Daftar siswa aktif yang belum menjadi anggota kelas ini. Siswa dari kelas lain juga ditampilkan dan akan divalidasi oleh sistem.</p>

      {placementStudents.length === 0 ? (
        <p>Tidak ada siswa yang dapat ditampilkan.</p>
      ) : (
        <form onSubmit={handleBulkPlacement}>
          <label>
            <input
              type="checkbox"
              checked={studentIds.length > 0 && studentIds.every((id) => selectedIds.includes(id))}
              onChange={(event) => handleSelectAll(setSelectedIds, studentIds, event.target.checked)}
              disabled={isPending}
            />
            Pilih Semua Siswa
          </label>

          <ul>
            {placementStudents.map((student) => (
              <li key={student.student_id}>
                <label>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(student.student_id)}
                    onChange={(event) => handleSelection(setSelectedIds, student.student_id, event.target.checked)}
                    disabled={isPending}
                  />

                  {student.full_name}
                  {student.student_number ? ` (${student.student_number})` : ""}

                  {studentsWithActiveMembership.has(student.student_id) ? " — masih memiliki kelas aktif" : ""}
                </label>
              </li>
            ))}
          </ul>

          <p>Siswa dipilih: {selectedIds.length}</p>

          <label>
            Alasan penempatan (opsional)
            <input type="text" value={placementReason} onChange={(event) => setPlacementReason(event.target.value)} maxLength={500} disabled={isPending} />
          </label>

          <button type="submit" disabled={isPending || selectedIds.length === 0}>
            {isPending ? "Memproses..." : `Tempatkan ${selectedIds.length} Siswa`}
          </button>
        </form>
      )}

      <ClassMembershipBulkResult result={result} students={students} />
    </section>
  );
}
