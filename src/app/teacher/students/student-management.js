"use client";

import Link from "next/link";

export default function StudentManagement({ students = [] }) {
  return (
    <main>
      <section>
        <h2>Daftar Siswa</h2>

        {students.length === 0 ? (
          <p>Belum ada siswa pada kelas yang menjadi tanggung jawab Anda.</p>
        ) : (
          <ul>
            {students.map((student) => (
              <li key={student.student_id}>
                <h3>{student.full_name}</h3>

                <p>Nomor Induk: {student.student_number || "-"}</p>

                <Link href={`/teacher/students/${student.student_id}`}>Lihat Detail</Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
