import Link from "next/link";

import { connection } from "next/server";

import { getUserById } from "@/repositories/user-repository";

export const instant = false;

export const metadata = {
  title: "Detail Pengguna",
};

export default async function DetailUserPage({ params }) {
  await connection();
  const { userId } = await params;
  const user = await getUserById(userId);

  if (!user) {
    return (
      <main>
        <h1>Pengguna tidak ditemukan</h1>
        <p>
          <Link href="/admin/users">Kembali ke Manajemen Pengguna</Link>
        </p>
      </main>
    );
  }

  return (
    <main>
      <header>
        <h1>Detail Pengguna</h1>
        <p>
          <Link href="/admin">Dashboard</Link> /{" "}
          <Link href="/admin/users">Manajemen Pengguna</Link> / Detail Pengguna
        </p>
      </header>

      <section>
        <h2>Informasi Pengguna</h2>
        <ul>
          <li>ID: {user.user_id}</li>
          <li>Nama: {user.name}</li>
          <li>Email: {user.email || "-"}</li>
          <li>Role: {user.role}</li>
          <li>Status Akun: {user.account_status}</li>
          <li>Nomor WhatsApp: {user.no_hp || "-"}</li>
          <li>Limit Kelas: {user.limit_kelas ?? 0}</li>
        </ul>
        <p>
          <Link href={`/admin/users/${user.user_id}/edit`}>Edit</Link>
        </p>
      </section>
    </main>
  );
}
