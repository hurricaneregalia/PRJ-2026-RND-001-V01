import Link from "next/link";

import { connection } from "next/server";

import StatusBadge from "@/components/ui/status-badge";
import { listSiswa } from "@/repositories/siswa-repository";
import { listKelasSiswa } from "@/repositories/kelas-siswa-repository";
import { listKelas } from "@/repositories/kelas-repository";
import { listUsers } from "@/repositories/user-repository";

export const instant = false;

export const metadata = {
  title: "Data Siswa",
};

export default async function DaftarSiswaPage() {
  await connection();
  const siswa = await listSiswa();
  const memberships = await listKelasSiswa();
  const kelas = await listKelas();
  const users = await listUsers();
  const kelasById = new Map(kelas.map((item) => [item.kelas_id, item]));
  const userById = new Map(users.map((item) => [item.user_id, item]));
  const activeMembershipBySiswa = new Map(
    memberships
      .filter((item) => item.status_keanggotaan === "aktif")
      .map((item) => [item.siswa_id, item]),
  );

  return (
    <main>
      <header>
        <h1>Data Siswa</h1>
        <p>Kelola data siswa.</p>
        <p>
          <Link href="/admin">Dashboard</Link> /{" "}
          <Link href="/admin/siswa">Manajemen Siswa</Link>
        </p>
        <p>
          <Link href="/admin/siswa/tambah">+ Tambah Siswa</Link>
        </p>
      </header>

      <section>
        <h2>Daftar Siswa</h2>
        {siswa.length === 0 ? (
          <p>Belum ada siswa.</p>
        ) : (
          <ol>
            {siswa.map((item) => {
              const membership = activeMembershipBySiswa.get(item.siswa_id);
              const kelasItem = membership
                ? kelasById.get(membership.kelas_id)
                : null;
              const pengajar = kelasItem
                ? userById.get(kelasItem.pengajar_id)
                : null;

              return (
                <li key={item.siswa_id}>
                  {item.nis || "-"} | {item.nama} |{" "}
                  {kelasItem ? (
                    <Link href={`/admin/kelas/${kelasItem.kelas_id}`}>
                      {kelasItem.nama_kelas}
                    </Link>
                  ) : (
                    "-"
                  )}{" "}
                  |{" "}
                  {pengajar ? (
                    <Link href={`/admin/users/${pengajar.user_id}`}>
                      {pengajar.name}
                    </Link>
                  ) : (
                    "-"
                  )}{" "}
                  | <StatusBadge value={item.status} /> |{" "}
                  <Link href={`/admin/siswa/${item.siswa_id}`}>Detail</Link> |{" "}
                  <Link href={`/admin/siswa/${item.siswa_id}/edit`}>Edit</Link>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </main>
  );
}
