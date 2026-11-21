import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import Link from "next/link";

import { getStudentDetailsService } from "@/services/student-service";
import { updateTeacherStudentAction } from "../actions";

async function StudentDetailData({ params }) {
  const { studentId } = await params;

  await connection();

  const student = await getStudentDetailsService(studentId);

  if (!student) {
    notFound();
  }

  return (
    <section>
      <h2>Informasi Siswa</h2>

      <form
        action={async (formData) => {
          "use server";

          await updateTeacherStudentAction(studentId, {
            full_name: formData.get("full_name"),
            gender: formData.get("gender"),
            parent_name: formData.get("parent_name"),
            parent_relation: formData.get("parent_relation"),
            parent_whatsapp: formData.get("parent_whatsapp"),
          });
        }}
      >
        <div>
          <label htmlFor="student_number">Nomor Induk Siswa</label>
          <p>{student.student_number || "-"}</p>
        </div>

        <div>
          <label htmlFor="full_name">Nama Lengkap</label>
          <input id="full_name" name="full_name" type="text" defaultValue={student.full_name || ""} maxLength={150} required />
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
          <input id="parent_name" name="parent_name" type="text" defaultValue={student.parent_name || ""} maxLength={150} required />
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
          <input id="parent_whatsapp" name="parent_whatsapp" type="tel" defaultValue={student.parent_whatsapp || ""} maxLength={30} required />
        </div>

        <div>
          <label>Status Siswa</label>
          <p>{student.student_status}</p>
        </div>

        <button type="submit">Simpan Perubahan</button>
      </form>
    </section>
  );
}

export default function TeacherStudentDetailPage({ params }) {
  return (
    <main>
      <nav>
        <Link href="/teacher/students">Kembali ke Daftar Siswa</Link>
      </nav>

      <h1>Detail Siswa</h1>

      <Suspense fallback={<p>Memuat detail siswa...</p>}>
        <StudentDetailData params={params} />
      </Suspense>
    </main>
  );
}
