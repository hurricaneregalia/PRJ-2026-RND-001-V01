import Link from "next/link";

import { connection } from "next/server";

import { listJadwal } from "@/repositories/jadwal-repository";
import { listKelas } from "@/repositories/kelas-repository";
import { listUsers } from "@/repositories/user-repository";

export const instant = false;

export const metadata = {
  title: "Manajemen Jadwal",
};

export default async function DaftarJadwalPage() {
  await connection();
  const jadwal = await listJadwal();
  const kelas = await listKelas();
  const users = await listUsers();
  const kelasById = new Map(kelas.map((item) => [item.kelas_id, item]));
  const userById = new Map(users.map((item) => [item.user_id, item]));
  const aktif = jadwal.filter((item) => item.status_jadwal === "aktif");
  const nonaktif = jadwal.filter((item) => item.status_jadwal !== "aktif");
  const kelasIds = new Set(jadwal.map((item) => item.kelas_id));

  return (
    <main>
      <header>
        <h1>Manajemen Jadwal</h1>
        <p>
          <Link href="/admin">Dashboard</Link> /{" "}
          <Link href="/admin/jadwal">Manajemen Jadwal</Link>
        </p>
        <p>Kelola jadwal kegiatan belajar seluruh kelas.</p>
        <p>
          <Link href="/admin/jadwal/tambah">+ Tambah Jadwal</Link>
        </p>
      </header>

      <section>
        <h2>Ringkasan</h2>
        <ul>
          <li>Total jadwal: {jadwal.length}</li>
          <li>Jadwal aktif: {aktif.length}</li>
          <li>Jadwal tidak aktif: {nonaktif.length}</li>
          <li>Jumlah kelas yang memiliki jadwal: {kelasIds.size}</li>
        </ul>
      </section>

      <section>
        <h2>Daftar Jadwal</h2>
        {jadwal.length === 0 ? (
          <p>Belum ada jadwal.</p>
        ) : (
          <ol>
            {jadwal.map((item) => {
              const kelasItem = kelasById.get(item.kelas_id);
              const pengajar = kelasItem
                ? userById.get(kelasItem.pengajar_id)
                : null;

              return (
                <li key={item.jadwal_id}>
                  {kelasItem?.nama_kelas || item.kelas_id} |{" "}
                  {pengajar?.name || "-"} | {item.hari} | {item.jam_mulai}–
                  {item.jam_selesai} | {item.ruangan || "-"} |{" "}
                  {item.status_jadwal} |{" "}
                  <Link href={`/admin/jadwal/${item.jadwal_id}`}>Detail</Link> |{" "}
                  <Link href={`/admin/jadwal/${item.jadwal_id}/edit`}>Edit</Link>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </main>
  );
}
