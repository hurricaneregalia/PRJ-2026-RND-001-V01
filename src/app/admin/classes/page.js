// src/app/admin/classes/page.js

import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";

import { getAllClassesService } from "@/services/class-service";
import ClassManagement from "./class-management";

async function ClassesData() {
  await connection();

  const classes = await getAllClassesService();

  return <ClassManagement classes={classes} />;
}

export default function ClassesPage() {
  return (
    <main>
      <nav>
        <Link href="/admin">Kembali ke Dashboard</Link>
      </nav>

      <h1>Manajemen Kelas</h1>

      <Suspense fallback={<p>Memuat data kelas...</p>}>
        <ClassesData />
      </Suspense>
    </main>
  );
}
