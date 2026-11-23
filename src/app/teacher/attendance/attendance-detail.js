"use client";

export default function AttendanceDetail({ session, records = [] }) {
  return (
    <section>
      <h2>Informasi Sesi</h2>

      <p>Tanggal: {session.attendance_date}</p>
      <p>Kelas: {session.class_name || session.class_id}</p>
      <p>Guru: {session.teacher_name || session.teacher_user_id}</p>
      <p>Jenis Lokasi: {session.location_type === "IN_CLASS" ? "Dalam kelas" : "Luar kelas"}</p>
      <p>Nama Lokasi: {session.location_name || "-"}</p>
      <p>Catatan Lokasi: {session.location_note || "-"}</p>
      <p>Materi: {session.lesson_material || "-"}</p>

      <h2>Daftar Siswa</h2>

      {records.length === 0 ? (
        <p>Tidak ada record siswa pada sesi ini.</p>
      ) : (
        <ul>
          {records.map((record) => (
            <li key={record.attendance_id}>
              <p>{record.student_name || record.student_id}</p>
              <p>Nomor Induk: {record.student_number || "-"}</p>
              <p>Status: {record.status}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}