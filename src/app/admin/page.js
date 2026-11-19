// src/app/admin/page.js

import Link from "next/link";
import { requireRole } from "@/lib/authorization";

export default async function AdminDashboardPage() {
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
        </ul>
      </nav>
    </main>
  );
}
