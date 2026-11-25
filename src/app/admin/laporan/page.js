import Link from "next/link";

import { connection } from "next/server";

import { listAbsensi } from "@/repositories/absensi-repository";
import { listAbsensiDetail } from "@/repositories/absensi-detail-repository";
import { listKelas } from "@/repositories/kelas-repository";
import { listSiswa } from "@/repositories/siswa-repository";
import { listUsers } from "@/repositories/user-repository";

export const instant = false;

export const metadata = {
  title: "Laporan",
};

export default async function LaporanPage() {
  await connection();
  const absensi = await listAbsensi();
  const detail = await listAbsensiDetail();
  const kelas = await listKelas();
  const siswa = await listSiswa();
  const users = await listUsers();
  const kelasById = new Map(kelas.map((item) => [item.kelas_id, item]));
  const absensiById = new Map(absensi.map((item) => [item.absensi_id, item]));

  const counts = detail.reduce(
    (result, item) => {
      result[item.status_kehadiran] = (result[item.status_kehadiran] || 0) + 1;
      return result;
    },
    { hadir: 0, izin: 0, sakit: 0, alfa: 0 },
  );
  const totalKehadiran = detail.length;
  const persentaseHadir =
    totalKehadiran === 0
      ? 0
      : Math.round((counts.hadir / totalKehadiran) * 1000) / 10;

  const perKelas = new Map();
  detail.forEach((item) => {
    const absensiItem = absensiById.get(item.absensi_id);
    if (!absensiItem) {
      return;
    }
    const current = perKelas.get(absensiItem.kelas_id) || {
      hadir: 0,
      izin: 0,
      sakit: 0,
      alfa: 0,
      total: 0,
    };
    current[item.status_kehadiran] = (current[item.status_kehadiran] || 0) + 1;
    current.total += 1;
    perKelas.set(absensiItem.kelas_id, current);
  });

  return (
    <main>
      <header>
        <h1>Laporan</h1>
        <p>Rekapitulasi kehadiran berdasarkan data absensi.</p>
        <p>
          <Link href="/admin">Dashboard</Link> / Laporan
        </p>
      </header>

      <section>
        <h2>Ringkasan Statistik</h2>
        <ul>
          <li>Total siswa: {siswa.length}</li>
          <li>Total pengajar: {users.filter((user) => user.role === "Pengajar").length}</li>
          <li>Total kelas: {kelas.length}</li>
          <li>Total sesi absensi: {absensi.length}</li>
          <li>Total entri kehadiran: {detail.length}</li>
        </ul>
      </section>

      <section>
        <h2>Ringkasan Kehadiran</h2>
        <ul>
          <li>Total hadir: {counts.hadir}</li>
          <li>Total izin: {counts.izin}</li>
          <li>Total sakit: {counts.sakit}</li>
          <li>Total alpa: {counts.alfa}</li>
          <li>Persentase kehadiran: {persentaseHadir}%</li>
        </ul>
      </section>

      <section>
        <h2>Rekap per Kelas</h2>
        {perKelas.size === 0 ? (
          <p>Belum ada data absensi.</p>
        ) : (
          <ol>
            {[...perKelas.entries()].map(([kelasId, item]) => (
              <li key={kelasId}>
                {kelasById.get(kelasId)?.nama_kelas || kelasId} | Sesi:{" "}
                {item.total} | Hadir: {item.hadir} | Izin: {item.izin} | Sakit:{" "}
                {item.sakit} | Alpa: {item.alfa}
              </li>
            ))}
          </ol>
        )}
      </section>

      <section>
        <h2>Navigasi Laporan</h2>
        <ul>
          <li>
            <Link href="/admin/laporan/kehadiran-siswa">
              Laporan Kehadiran Siswa
            </Link>
          </li>
          <li>
            <Link href="/admin/laporan/kehadiran-pengajar">
              Laporan Kehadiran Pengajar
            </Link>
          </li>
          <li>
            <Link href="/admin/laporan/aktivitas-kelas">
              Laporan Aktivitas Kelas
            </Link>
          </li>
          <li>
            <Link href="/admin/laporan/rekap-pembelajaran">
              Laporan Rekap Pembelajaran
            </Link>
          </li>
        </ul>
      </section>
    </main>
  );
}
