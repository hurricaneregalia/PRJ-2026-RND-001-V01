import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import Link from "next/link";

import { getStudentDetailsService } from "@/services/student-service";
import { getStudentClassMembershipsService } from "@/services/class-member-service";
import { getAllClassesService } from "@/services/class-service";

import StudentEditForm from "../student-edit-form";

function formatDate(date) {
  if (!date) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(`${date}T00:00:00+07:00`));
}

async function StudentDetailData({ params }) {
  const { studentId } = await params;

  await connection();

  const [student, memberships, classes] = await Promise.all([getStudentDetailsService(studentId), getStudentClassMembershipsService(studentId), getAllClassesService()]);

  if (!student) {
    notFound();
  }

  const classNames = new Map(classes.map((item) => [item.class_id, item.class_name]));

  return (
    <>
      <section>
        <h2>Informasi Siswa</h2>
        <StudentEditForm student={student} />
      </section>

      <section>
        <h2>Riwayat Keanggotaan Kelas</h2>

        {memberships.length === 0 ? (
          <p>Belum ada riwayat keanggotaan kelas.</p>
        ) : (
          <ul>
            {memberships.map((membership) => (
              <li key={membership.membership_id}>
                <article>
                  <h3>Kelas: {classNames.get(membership.class_id) || "Nama kelas tidak ditemukan"}</h3>

                  <p>Tanggal mulai: {formatDate(membership.effective_from)}</p>

                  <p>Tanggal selesai: {membership.effective_to ? formatDate(membership.effective_to) : "Belum berakhir"}</p>

                  <p>Status: {membership.effective_to ? "Selesai" : "Berjalan"}</p>
                </article>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

export default function StudentDetailPage({ params }) {
  return (
    <main>
      <nav>
        <Link href="/admin/students">Kembali ke Daftar Siswa</Link>
      </nav>

      <h1>Detail Siswa</h1>

      <Suspense fallback={<p>Memuat detail siswa...</p>}>
        <StudentDetailData params={params} />
      </Suspense>
    </main>
  );
}
