"use client";

import Link from "next/link";

import { formatLocation } from "./attendance-utils";

export default function AttendanceList({ sessions = [], classes = [], teachers = [] }) {
  const classMap = new Map(classes.map((item) => [item.class_id, item.class_name]));
  const teacherMap = new Map(teachers.map((item) => [item.user_id, item.full_name]));

  if (sessions.length === 0) {
    return (
      <section>
        <h2>Daftar Sesi Absensi</h2>
        <p>Tidak ada sesi absensi yang sesuai dengan filter.</p>
      </section>
    );
  }

  return (
    <section>
      <h2>Daftar Sesi Absensi</h2>

      <ul>
        {sessions.map((session) => (
          <li key={session.session_id}>
            <p>Tanggal: {session.attendance_date}</p>
            <p>Kelas: {classMap.get(session.class_id) || session.class_id}</p>
            <p>Guru: {teacherMap.get(session.teacher_user_id) || session.teacher_user_id}</p>
            <p>Lokasi: {formatLocation(session)}</p>
            <p>Materi: {session.lesson_material || "-"}</p>
            <p>
              <Link href={`/admin/attendance/${session.session_id}`}>Lihat Detail</Link>
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}