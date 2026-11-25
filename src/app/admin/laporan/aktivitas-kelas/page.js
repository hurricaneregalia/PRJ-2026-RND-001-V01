import Link from "next/link";

import { connection } from "next/server";

import { listAbsensi } from "@/repositories/absensi-repository";
import { listJadwal } from "@/repositories/jadwal-repository";
import { listKelas } from "@/repositories/kelas-repository";
import { listKelasSiswa } from "@/repositories/kelas-siswa-repository";
import { listUsers } from "@/repositories/user-repository";

export const instant = false;

export const metadata = {
  title: "Laporan Aktivitas Kelas",
};

export default async function LaporanAktivitasKelasPage() {
  await connection();
  const kelas = await listKelas();
  const absensi = await listAbsensi();
  const jadwal = await listJadwal();
  const kelasSiswa = await listKelasSiswa();
  const users = await listUsers();
  const userById = new Map(users.map((item) => [item.user_id, item]));

  const sessionsByKelas = new Map();
  absensi.forEach((item) => {
    sessionsByKelas.set(
      item.kelas_id,
      (sessionsByKelas.get(item.kelas_id) || 0) + 1,
    );
  });
  const jadwalByKelas = new Map();
  jadwal.forEach((item) => {
    jadwalByKelas.set(item.kelas_id, (jadwalByKelas.get(item.kelas_id) || 0) + 1);
  });
  const studentsByKelas = new Map();
  kelasSiswa
    .filter((item) => item.status_keanggotaan === "aktif")
    .forEach((item) => {
      studentsByKelas.set(
        item.kelas_id,
        (studentsByKelas.get(item.kelas_id) || 0) + 1,
      );
    });

  const activeKelas = kelas.filter((item) => item.status_kelas === "aktif");

  return (
    <main>
      <header>
        <h1>Laporan Aktivitas Kelas</h1>
        <p>
          <Link href="/admin">Dashboard</Link> /{" "}
          <Link href="/admin/laporan">Laporan</Link> / Laporan Aktivitas Kelas
        </p>
      </header>

      <section>
        <h2>Ringkasan</h2>
        <ul>
          <li>Total kelas aktif: {activeKelas.length}</li>
          <li>Total sesi pembelajaran: {absensi.length}</li>
          <li>Total jadwal: {jadwal.length}</li>
        </ul>
      </section>

      <section>
        <h2>Rekap Aktivitas Kelas</h2>
        {kelas.length === 0 ? (
          <p>Belum ada kelas.</p>
        ) : (
          <ol>
            {kelas.map((item) => (
              <li key={item.kelas_id}>
                {item.nama_kelas} ({item.kode_kelas}) | Pengajar:{" "}
                {userById.get(item.pengajar_id)?.name || item.pengajar_id} |
                Siswa aktif: {studentsByKelas.get(item.kelas_id) || 0} | Jadwal:{" "}
                {jadwalByKelas.get(item.kelas_id) || 0} | Sesi absensi:{" "}
                {sessionsByKelas.get(item.kelas_id) || 0} | Status:{" "}
                {item.status_kelas}
              </li>
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}
