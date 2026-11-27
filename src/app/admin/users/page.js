import Link from "next/link";

import { listKelas } from "@/repositories/kelas-repository";
import { listUsers } from "@/repositories/user-repository";
import StatusBadge from "@/components/ui/status-badge";

import { connection } from "next/server";
import CapacityInfo from "@/components/ui/capacity-info";

export const instant = false;

export const metadata = {
  title: "Manajemen Pengguna",
};

export default async function ManajemenPenggunaPage() {
  await connection();
  const users = await listUsers();
  const kelas = await listKelas();
  const activeCountByTeacher = new Map();

  kelas
    .filter((item) => item.status_kelas === "aktif")
    .forEach((item) => {
      activeCountByTeacher.set(
        item.pengajar_id,
        (activeCountByTeacher.get(item.pengajar_id) || 0) + 1,
      );
    });

  return (
    <main>
      <header>
        <h1>Manajemen Pengguna</h1>
        <p>Kelola akun Admin dan Pengajar.</p>
        <p>
          <Link href="/admin">Dashboard</Link> / <Link href="/admin/users">Manajemen Pengguna</Link>
        </p>
        <p>
          <Link href="/admin/users/tambah">+ Tambah Pengguna</Link>
        </p>
      </header>

      <section>
        <h2>Daftar Pengguna</h2>
        {users.length === 0 ? (
          <p>Belum ada pengguna.</p>
        ) : (
          <ol>
            {users.map((user) => (
              <li key={user.user_id}>
                {user.user_id} | {user.role === "Pengajar" ? (
                  <CapacityInfo
                    item={user.name}
                    count={activeCountByTeacher.get(user.user_id) || 0}
                    max={user.limit_kelas}
                  />
                ) : user.name} | {user.role} |{" "}
                {user.account_status ? <StatusBadge value={user.account_status} /> : null} | <Link href={`/admin/users/${user.user_id}`}>Detail</Link> | <Link href={`/admin/users/${user.user_id}/edit`}>Edit</Link>
              </li>
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}
