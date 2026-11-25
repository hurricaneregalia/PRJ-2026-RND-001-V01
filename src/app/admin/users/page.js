import Link from "next/link";

import { listUsers } from "@/repositories/user-repository";

import { connection } from "next/server";

export const instant = false;

export const metadata = {
  title: "Manajemen Pengguna",
};

export default async function ManajemenPenggunaPage() {
  await connection();
  const users = await listUsers();

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
          <ul>
            {users.map((user) => (
              <li key={user.user_id}>
                {user.user_id} | {user.name} | {user.email} | {user.role} | {user.account_status} | <Link href={`/admin/users/${user.user_id}/edit`}>Edit</Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
