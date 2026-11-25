import Link from "next/link";

import { connection } from "next/server";

import { listAbsensi } from "@/repositories/absensi-repository";
import { listKelas } from "@/repositories/kelas-repository";
import { listJadwal } from "@/repositories/jadwal-repository";
import { listUsers } from "@/repositories/user-repository";

export const instant = false;

export const metadata = {
  title: "Laporan Kehadiran Pengajar",
};

export default async function LaporanKehadiranPengajarPage() {
  await connection();
  const users = await listUsers();
  const kelas = await listKelas();
  const jadwal = await listJadwal();
  const absensi = await listAbsensi();
  const pengajar = users.filter((user) => user.role === "Pengajar");

  const kelasByPengajar = new Map();
  kelas.forEach((item) => {
    kelasByPengajar.set(
      item.pengajar_id,
      (kelasByPengajar.get(item.pengajar_id) || 0) + 1,
    );
  });

  const jadwalByPengajar = new Map();
  const kelasById = new Map(kelas.map((item) => [item.kelas_id, item]));
  jadwal.forEach((item) => {
    const kelasItem = kelasById.get(item.kelas_id);
    if (!kelasItem) {
      return;
    }
    jadwalByPengajar.set(
      kelasItem.pengajar_id,
      (jadwalByPengajar.get(kelasItem.pengajar_id) || 0) + 1,
    );
  });

  const sesiByPengajar = new Map();
  absensi.forEach((item) => {
    sesiByPengajar.set(
      item.created_by,
      (sesiByPengajar.get(item.created_by) || 0) + 1,
    );
  });

  return (
    <main>
      <header>
        <h1>Laporan Kehadiran Pengajar</h1>
        <p>
          <Link href="/admin">Dashboard</Link> /{" "}
          <Link href="/admin/laporan">Laporan</Link> / Laporan Kehadiran Pengajar
        </p>
      </header>

      <section>
        <h2>Ringkasan</h2>
        <ul>
          <li>Total pengajar: {pengajar.length}</li>
          <li>Total jadwal mengajar: {jadwal.length}</li>
          <li>Total sesi absensi tercatat: {absensi.length}</li>
        </ul>
      </section>

      <section>
        <h2>Rekap Aktivitas Pengajar</h2>
        {pengajar.length === 0 ? (
          <p>Belum ada pengajar.</p>
        ) : (
          <ol>
            {pengajar.map((item) => (
              <li key={item.user_id}>
                {item.name} | Kelas: {kelasByPengajar.get(item.user_id) || 0} |
                Jadwal: {jadwalByPengajar.get(item.user_id) || 0} | Sesi absensi
                dicatat: {sesiByPengajar.get(item.user_id) || 0} | Status akun:{" "}
                {item.account_status}
              </li>
            ))}
          </ol>
        )}
      </section>

      <p>
        Catatan: data ini hanya menghitung sesi absensi yang dicatat oleh
        pengajar, bukan pencatatan kehadiran pengajar secara terpisah.
      </p>
    </main>
  );
}
