import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import Link from "next/link";

import { getStudentDetailsService } from "@/services/student-service";
import { getStudentClassMembershipsService } from "@/services/class-member-service";
import { getAllClassesService } from "@/services/class-service";

import { updateStudentAction } from "../actions";

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

        <form
          action={async (formData) => {
            "use server";

            await updateStudentAction(studentId, {
              student_number: formData.get("student_number") || "",
              full_name: formData.get("full_name"),
              gender: formData.get("gender"),
              parent_name: formData.get("parent_name"),
              parent_relation: formData.get("parent_relation"),
              parent_whatsapp: formData.get("parent_whatsapp"),
              student_status: formData.get("student_status"),
            });
          }}
        >
          <div>
            <label htmlFor="student_number">Nomor Induk Siswa</label>
            <input id="student_number" name="student_number" type="text" defaultValue={student.student_number || ""} />
          </div>

          <div>
            <label htmlFor="full_name">Nama Lengkap</label>
            <input id="full_name" name="full_name" type="text" defaultValue={student.full_name || ""} required />
          </div>

          <div>
            <label htmlFor="gender">Jenis Kelamin</label>
            <select id="gender" name="gender" defaultValue={student.gender || ""} required>
              <option value="">Pilih jenis kelamin</option>
              <option value="Laki-laki">Laki-laki</option>
              <option value="Perempuan">Perempuan</option>
            </select>
          </div>

          <div>
            <label htmlFor="parent_name">Nama Orang Tua</label>
            <input id="parent_name" name="parent_name" type="text" defaultValue={student.parent_name || ""} required />
          </div>

          <div>
            <label htmlFor="parent_relation">Hubungan Orang Tua</label>
            <select id="parent_relation" name="parent_relation" defaultValue={student.parent_relation || ""} required>
              <option value="">Pilih hubungan</option>
              <option value="Ibu">Ibu</option>
              <option value="Ayah">Ayah</option>
            </select>
          </div>

          <div>
            <label htmlFor="parent_whatsapp">WhatsApp Orang Tua</label>
            <input id="parent_whatsapp" name="parent_whatsapp" type="text" defaultValue={student.parent_whatsapp || ""} required />
          </div>

          <div>
            <label htmlFor="student_status">Status Siswa</label>
            <select id="student_status" name="student_status" defaultValue={student.student_status || ""} required>
              <option value="active">Aktif</option>
              <option value="inactive">Tidak Aktif</option>
              <option value="graduated">Lulus</option>
              <option value="transferred">Pindah</option>
            </select>
          </div>

          <button type="submit">Simpan Perubahan</button>
        </form>
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
