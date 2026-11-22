// src/app/admin/assignments/assignment-create-form.js

"use client";

export default function AssignmentCreateForm({
  userId,
  classId,
  effectiveFrom,
  reason,
  availableTeachers,
  availableClasses,
  canCreateAssignment,
  loading,
  onUserIdChange,
  onClassIdChange,
  onEffectiveFromChange,
  onReasonChange,
  onSubmit,
}) {
  return (
    <section>
      <h2>Tambah Penugasan Guru</h2>

      {!canCreateAssignment ? (
        <p>Formulir penugasan belum tersedia karena guru aktif atau kelas aktif belum tersedia.</p>
      ) : (
        <form onSubmit={onSubmit}>
          <p>
            <label htmlFor="teacher">Guru</label>
          </p>

          <select id="teacher" value={userId} onChange={(event) => onUserIdChange(event.target.value)} required>
            <option value="">Pilih guru</option>

            {availableTeachers.map((teacher) => (
              <option key={teacher.user_id} value={teacher.user_id}>
                {teacher.full_name}
              </option>
            ))}
          </select>

          <p>
            <label htmlFor="class">Kelas</label>
          </p>

          <select id="class" value={classId} onChange={(event) => onClassIdChange(event.target.value)} required>
            <option value="">Pilih kelas</option>

            {availableClasses.map((item) => (
              <option key={item.class_id} value={item.class_id}>
                {item.class_name}
              </option>
            ))}
          </select>

          <p>
            <label htmlFor="effectiveFrom">Tanggal Mulai</label>
          </p>

          <input id="effectiveFrom" type="date" value={effectiveFrom} onChange={(event) => onEffectiveFromChange(event.target.value)} required />

          <p>
            <label htmlFor="reason">Keterangan</label>
          </p>

          <textarea id="reason" value={reason} onChange={(event) => onReasonChange(event.target.value)} />

          <p>
            <button type="submit" disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan Penugasan"}
            </button>
          </p>
        </form>
      )}
    </section>
  );
}
