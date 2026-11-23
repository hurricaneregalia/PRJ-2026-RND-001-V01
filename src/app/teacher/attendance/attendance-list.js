"use client";

import Link from "next/link";

export default function AttendanceList({ sessions = [] }) {
  if (sessions.length === 0) {
    return (
      <section>
        <h2>Daftar Sesi Absensi</h2>
        <p>Belum ada sesi absensi yang dibuat.</p>
      </section>
    );
  }

  return (
    <section>
      <h2>Daftar Sesi Absensi</h2>

      <ul>
        {sessions.map((session) => (
          <li key={session.session_id}>
            <p>
              <strong>{session.class_name || session.class_id}</strong>
            </p>
            <p>Tanggal: {session.attendance_date}</p>
            <p>Materi: {session.lesson_material || "-"}</p>
            <p>Lokasi: {session.location_type === "IN_CLASS" ? "Dalam kelas" : session.location_name || "-"}</p>
            <p>
              <Link href={`/teacher/attendance/${session.session_id}`}>Lihat Detail</Link>
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}