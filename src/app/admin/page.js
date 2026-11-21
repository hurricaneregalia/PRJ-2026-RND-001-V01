// src/app/admin/page.js

import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { requireRole } from "@/lib/authorization";

async function AdminDashboardContent() {
  await connection();

  await requireRole(["Administrator"]);

  return (
    <main>
      <h1>Dashboard Administrator</h1>

      <p>Selamat datang di halaman administrasi sekolah.</p>

      <nav>
        <ul>
          <li>
            <Link href="/admin/users">Manajemen Pengguna</Link>
          </li>

          <li>
            <Link href="/admin/classes">Manajemen Kelas</Link>
          </li>

          <li>
            <Link href="/admin/assignments">Penugasan Guru</Link>
          </li>
          <li>
            <Link href="/admin/students">Manajemen Siswa</Link>
          </li>
        </ul>
      </nav>
    </main>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<p>Memuat dashboard administrator...</p>}>
      <AdminDashboardContent />
    </Suspense>
  );
}
