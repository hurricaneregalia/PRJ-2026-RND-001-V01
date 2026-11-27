import Link from "next/link";

import { connection } from "next/server";

import { getJadwalById } from "@/repositories/jadwal-repository";
import StatusBadge from "@/components/ui/status-badge";
import { getKelasById } from "@/repositories/kelas-repository";
import { getUserById } from "@/repositories/user-repository";

export const instant = false;

export const metadata = {
  title: "Detail Jadwal",
};

export default async function DetailJadwalPage({ params }) {
  await connection();
  const { jadwalId } = await params;
  const jadwal = await getJadwalById(jadwalId);

  if (!jadwal) {
    return (
      <main>
        <h1>Jadwal tidak ditemukan</h1>
        <p>
          <Link href="/admin/jadwal">Kembali ke Manajemen Jadwal</Link>
        </p>
      </main>
    );
  }

  const kelas = await getKelasById(jadwal.kelas_id);
  const pengajar = kelas ? await getUserById(kelas.pengajar_id) : null;

  return (
    <main>
      <header>
        <h1>Detail Jadwal</h1>
        <p>
          <Link href="/admin">Dashboard</Link> /{" "}
          <Link href="/admin/jadwal">Manajemen Jadwal</Link> / Detail Jadwal
        </p>
      </header>

      <section>
        <h2>Informasi Jadwal</h2>
        <ul>
          <li>ID Jadwal: {jadwal.jadwal_id}</li>
          <li>
            Kelas: {kelas?.nama_kelas || "-"} ({kelas?.kode_kelas || "-"})
          </li>
          <li>Pengajar: {pengajar?.name || "-"}</li>
          <li>Hari: {jadwal.hari}</li>
          <li>
            Waktu: {jadwal.jam_mulai}–{jadwal.jam_selesai}
          </li>
          <li>Ruangan: {jadwal.ruangan || "-"}</li>
          <li>Status: <StatusBadge value={jadwal.status_jadwal} /></li>
        </ul>
        <p>
          <Link href={`/admin/jadwal/${jadwal.jadwal_id}/edit`}>Edit</Link>
        </p>
      </section>
    </main>
  );
}
