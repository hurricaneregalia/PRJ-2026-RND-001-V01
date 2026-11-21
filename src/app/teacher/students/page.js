import { Suspense } from "react";
import { connection } from "next/server";

import { getTeacherStudentsService } from "@/services/student-service";
import StudentManagement from "./student-management";

async function TeacherStudentsData() {
  await connection();

  const students = await getTeacherStudentsService();

  return <StudentManagement students={students} />;
}

export default function TeacherStudentsPage() {
  return (
    <main>
      <h1>Daftar Siswa</h1>

      <Suspense fallback={<p>Memuat data siswa...</p>}>
        <TeacherStudentsData />
      </Suspense>
    </main>
  );
}
