import Link from "next/link";

import { connection } from "next/server";

import { listAbsensi } from "@/repositories/absensi-repository";
import { listJadwal } from "@/repositories/jadwal-repository";
import { listKelas } from "@/repositories/kelas-repository";
import { listKelasSiswa } from "@/repositories/kelas-siswa-repository";
import { listUsers } from "@/repositories/user-repository";
import StatusBadge from "@/components/ui/status-badge";
import AdminDataTable from "@/components/ui/admin-data-table";

export const instant = false;

export const metadata = {
  title: "Laporan Aktivitas Kelas",
};

export default async function LaporanAktivitasKelasPage() {
  await connection();
  const kelas = await listKelas();
  const absensi = (await listAbsensi()).filter(
    (item) => item.status_absensi === "final",
  );
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

  const rows = kelas.map((item) => ({
    id: item.kelas_id,
    nama: item.nama_kelas,
    kode: item.kode_kelas,
    pengajar: userById.get(item.pengajar_id)?.name || item.pengajar_id,
    siswaAktif: studentsByKelas.get(item.kelas_id) || 0,
    jadwal: jadwalByKelas.get(item.kelas_id) || 0,
    sesi: sessionsByKelas.get(item.kelas_id) || 0,
    status: item.status_kelas,
  }));

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
        <AdminDataTable
          emptyMessage="Belum ada kelas."
          rowKey={(item) => item.id}
          columns={[
            { key: "nama", header: "Nama Kelas" },
            { key: "kode", header: "Kode" },
            { key: "pengajar", header: "Pengajar" },
            { key: "siswaAktif", header: "Siswa Aktif" },
            { key: "jadwal", header: "Jadwal" },
            { key: "sesi", header: "Sesi Absensi" },
            { key: "status", header: "Status", render: (item) => <StatusBadge value={item.status} /> },
          ]}
          rows={rows}
        />
      </section>
    </main>
  );
}
