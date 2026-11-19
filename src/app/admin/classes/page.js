import Link from "next/link";
import { requireRole } from "@/lib/authorization";

export default async function AdminPage() {
  await requireRole(["Administrator"]);

  return (
    <main>
      <h1>Dashboard Administrator</h1>

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
