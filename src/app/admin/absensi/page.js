import Link from "next/link";

import { connection } from "next/server";

import { listAbsensi } from "@/repositories/absensi-repository";
import StatusBadge from "@/components/ui/status-badge";
import { listAbsensiDetail } from "@/repositories/absensi-detail-repository";
import { listKelas } from "@/repositories/kelas-repository";
import { listKelasSiswa } from "@/repositories/kelas-siswa-repository";
import { listSiswa } from "@/repositories/siswa-repository";
import ClassCapacityLabel from "@/components/ui/class-capacity-label";
import LinkDetail from "@/components/ui/link-detail";

export const instant = false;

export const metadata = {
  title: "Data Absensi",
};

export default async function DaftarAbsensiPage() {
  await connection();
  const absensi = await listAbsensi();
  const detail = await listAbsensiDetail();
  const kelas = await listKelas();
  const kelasById = new Map(kelas.map((item) => [item.kelas_id, item]));
  const memberships = await listKelasSiswa();
  const activeCountByKelas = new Map();
  const activeMembershipBySiswa = new Map(memberships.filter((item) => item.status_keanggotaan === "aktif").map((item) => [item.siswa_id, item]));
  memberships
    .filter((item) => item.status_keanggotaan === "aktif")
    .forEach((item) => {
      activeCountByKelas.set(item.kelas_id, (activeCountByKelas.get(item.kelas_id) || 0) + 1);
    });

  const siswa = await listSiswa();
  const finalAbsensiIds = new Set(absensi.filter((item) => item.status_absensi === "final").map((item) => item.absensi_id));
  const rekapBySiswa = new Map();
  detail
    .filter((item) => finalAbsensiIds.has(item.absensi_id))
    .forEach((item) => {
      const current = rekapBySiswa.get(item.siswa_id) || {
        hadir: 0,
        izin: 0,
        sakit: 0,
        alfa: 0,
      };
      if (current[item.status_kehadiran] !== undefined) {
        current[item.status_kehadiran] += 1;
      }
      rekapBySiswa.set(item.siswa_id, current);
    });
  const siswaDiurutkan = [...siswa].sort(
    (a, b) =>
      (rekapBySiswa.get(b.siswa_id)?.hadir || 0) - (rekapBySiswa.get(a.siswa_id)?.hadir || 0) ||
      String(a.nama || "").localeCompare(String(b.nama || ""), "id", {
        sensitivity: "base",
      }),
  );

  const counts = detail.reduce(
    (result, item) => {
      if (result[item.status_kehadiran] !== undefined) {
        result[item.status_kehadiran] += 1;
      }
      return result;
    },
    { hadir: 0, izin: 0, sakit: 0, alfa: 0 },
  );

  const detailCountByAbsensi = new Map();
  const countByAbsensi = new Map();
  detail.forEach((item) => {
    detailCountByAbsensi.set(item.absensi_id, (detailCountByAbsensi.get(item.absensi_id) || 0) + 1);
    const current = countByAbsensi.get(item.absensi_id) || {
      hadir: 0,
      izin: 0,
      sakit: 0,
      alfa: 0,
    };
    current[item.status_kehadiran] = (current[item.status_kehadiran] || 0) + 1;
    countByAbsensi.set(item.absensi_id, current);
  });

  return (
    <main>
      <header>
        <h1>Data Absensi</h1>
        <p>Kelola dan pantau catatan kehadiran siswa.</p>
        <p>
          <Link href="/admin">Dashboard</Link> / <Link href="/admin/absensi">Manajemen Absensi</Link>
        </p>
        <p>
          <Link href="/admin/absensi/tambah">+ Input Absensi</Link>
        </p>
      </header>

      <section>
        <h2>Statistik Utama</h2>
        <ul>
          <li>Total sesi absensi: {absensi.length}</li>
          <li>Total entri siswa: {detail.length}</li>
          <li>Hadir: {counts.hadir}</li>
          <li>Izin: {counts.izin}</li>
          <li>Sakit: {counts.sakit}</li>
          <li>Alpa: {counts.alfa}</li>
        </ul>
      </section>

      <section>
        <h2>Daftar Absensi</h2>
        {absensi.length === 0 ? (
          <p>Belum ada data absensi.</p>
        ) : (
          <ol>
            {absensi.map((item) => {
              const kelasItem = kelasById.get(item.kelas_id);
              const itemCounts = countByAbsensi.get(item.absensi_id) || {
                hadir: 0,
                izin: 0,
                sakit: 0,
                alfa: 0,
              };

              return (
                <li key={item.absensi_id}>
                  <LinkDetail href={`/admin/kelas/${item.kelas_id}`}>{kelasItem?.nama_kelas || item.kelas_id}</LinkDetail> | {item.tanggal} | {item.jam_mulai || "-"}–{item.jam_selesai || "-"} |{" "}
                  {item.topik || "-"} | {item.status_absensi ? <StatusBadge value={item.status_absensi} /> : null} | Siswa: {detailCountByAbsensi.get(item.absensi_id) || 0} | Hadir: {itemCounts.hadir}{" "}
                  | Izin: {itemCounts.izin} | Sakit: {itemCounts.sakit} | Alpa: {itemCounts.alfa} | <Link href={`/admin/absensi/${item.absensi_id}`}>Detail</Link> |{" "}
                  <Link href={`/admin/absensi/${item.absensi_id}/edit`}>Edit</Link>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <section>
        <h2>Rekap Kehadiran Siswa</h2>
        {siswa.length === 0 ? (
          <p>Belum ada siswa.</p>
        ) : (
          <ol>
            {siswaDiurutkan.map((item) => {
              const membership = activeMembershipBySiswa.get(item.siswa_id);
              const kelasItem = membership ? kelasById.get(membership.kelas_id) : null;
              const rekap = rekapBySiswa.get(item.siswa_id) || {
                hadir: 0,
                izin: 0,
                sakit: 0,
                alfa: 0,
              };

              return (
                <li key={item.siswa_id}>
                  {item.nama} | {item.nis || "-"} | {kelasItem?.nama_kelas || "-"} | Hadir: {rekap.hadir} | Izin: {rekap.izin} | Sakit: {rekap.sakit} | Alpa: {rekap.alfa} |{" "}
                  <Link href={`/admin/siswa/${item.siswa_id}`}>Detail</Link>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </main>
  );
}
