// src/app/admin/classes/[classId]/class-membership-movement.js

"use client";

import ClassMembershipBulkResult from "./class-membership-bulk-result";

import { getStudentName, getStudentNumber } from "./class-membership-helpers";

export default function ClassMembershipMovement({
  classMembers,
  students,
  targetClasses,

  selectedIds,
  setSelectedIds,

  targetClassId,
  setTargetClassId,

  moveReason,
  setMoveReason,

  handleSelection,
  handleSelectAll,
  handleBulkMove,

  isPending,
  result,
}) {
  const uniqueStudentIds = [...new Set(classMembers.map((membership) => membership.student_id))];

  return (
    <section>
      <h3>2. Pemindahan Siswa Antar Kelas</h3>

      <p>Daftar seluruh siswa yang saat ini menjadi anggota aktif kelas ini.</p>

      {classMembers.length === 0 ? (
        <p>Belum ada anggota aktif pada kelas ini.</p>
      ) : (
        <>
          <div>
            <label>
              <input
                type="checkbox"
                checked={uniqueStudentIds.length > 0 && uniqueStudentIds.every((id) => selectedIds.includes(id))}
                onChange={(event) => handleSelectAll(setSelectedIds, uniqueStudentIds, event.target.checked)}
                disabled={isPending}
              />
              Pilih Semua Anggota Kelas
            </label>

            <ul>
              {classMembers.map((membership) => (
                <li key={membership.membership_id}>
                  <label>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(membership.student_id)}
                      onChange={(event) => handleSelection(setSelectedIds, membership.student_id, event.target.checked)}
                      disabled={isPending}
                    />

                    <strong>{getStudentName(students, membership.student_id)}</strong>
                  </label>

                  <p>Nomor Induk: {getStudentNumber(students, membership.student_id)}</p>

                  <p>Mulai: {membership.effective_from}</p>
                </li>
              ))}
            </ul>

            <p>Siswa dipilih: {selectedIds.length}</p>
          </div>

          <form onSubmit={handleBulkMove}>
            <label>
              Kelas Tujuan
              <select value={targetClassId} onChange={(event) => setTargetClassId(event.target.value)} required disabled={isPending || targetClasses.length === 0}>
                <option value="">Pilih kelas tujuan</option>

                {targetClasses.map((item) => (
                  <option key={item.class_id} value={item.class_id}>
                    {item.class_name}
                  </option>
                ))}
              </select>
            </label>

            {targetClasses.length === 0 && <p>Belum ada kelas aktif lain sebagai tujuan.</p>}

            <label>
              Alasan pemindahan (opsional)
              <input type="text" value={moveReason} onChange={(event) => setMoveReason(event.target.value)} maxLength={500} disabled={isPending} />
            </label>

            <button type="submit" disabled={isPending || selectedIds.length === 0 || !targetClassId}>
              {isPending ? "Memproses..." : `Pindahkan ${selectedIds.length} Siswa`}
            </button>
          </form>
        </>
      )}

      <ClassMembershipBulkResult result={result} students={students} />
    </section>
  );
}
