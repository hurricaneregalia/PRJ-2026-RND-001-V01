// src/app/admin/classes/[classId]/page.js

import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getClassDetailsService } from "@/services/class-service";

async function ClassDetailData({ params }) {
  await connection();

  const { classId } = await params;
  const classItem = await getClassDetailsService(classId);

  if (!classItem) {
    notFound();
  }

  return (
    <section>
      <h2>{classItem.class_name}</h2>

      <p>Status: {classItem.class_status}</p>

      <p>ID Kelas: {classItem.class_id}</p>

      <p>Dibuat: {classItem.created_at}</p>

      <p>Terakhir diperbarui: {classItem.updated_at}</p>
    </section>
  );
}

export default function ClassDetailPage({ params }) {
  return (
    <main>
      <h1>Detail Kelas</h1>

      <p>
        <Link href="/admin/classes">Kembali ke Daftar Kelas</Link>
      </p>

      <Suspense fallback={<p>Memuat detail kelas...</p>}>
        <ClassDetailData params={params} />
      </Suspense>
    </main>
  );
}
