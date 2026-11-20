// src/app/admin/students/page.js

import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";

import { getAllStudentsService } from "@/services/student-service";
import StudentManagement from "./student-management";

async function StudentsData() {
  await connection();

  const students = await getAllStudentsService();

  return <StudentManagement students={students} />;
}

export default function StudentsPage() {
  return (
    <main>
      <nav>
        <Link href="/admin">Kembali ke Dashboard</Link>
      </nav>

      <h1>Manajemen Siswa</h1>

      <Suspense fallback={<p>Memuat data siswa...</p>}>
        <StudentsData />
      </Suspense>
    </main>
  );
}
