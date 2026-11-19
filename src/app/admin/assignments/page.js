// src/app/admin/assignments/page.js

import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";

import { getTeacherAssignmentPageDataService } from "@/services/teacher-assignment-service";
import AssignmentManagement from "./assignment-management";

async function AssignmentsContent() {
  await connection();

  const { teachers, classes, assignments } = await getTeacherAssignmentPageDataService();

  let prerequisiteMessage = "";

  if (classes.length === 0) {
    prerequisiteMessage = "Belum ada kelas aktif. Buat kelas terlebih dahulu.";
  } else if (teachers.length === 0) {
    prerequisiteMessage = "Belum ada guru aktif yang dapat ditugaskan.";
  }

  return (
    <main>
      <h1>Penugasan Guru</h1>

      <p>Kelola penugasan guru pada kelas.</p>

      <p>
        <Link href="/admin">Kembali ke Dashboard Administrator</Link>
      </p>

      {prerequisiteMessage && <p>{prerequisiteMessage}</p>}

      <AssignmentManagement teachers={teachers} classes={classes} assignments={assignments} />
    </main>
  );
}

export default function AssignmentsPage() {
  return (
    <Suspense fallback={<p>Memuat data penugasan guru...</p>}>
      <AssignmentsContent />
    </Suspense>
  );
}
