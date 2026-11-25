import Link from "next/link";

import { connection } from "next/server";

import { listAbsensi } from "@/repositories/absensi-repository";
import { listAbsensiDetail } from "@/repositories/absensi-detail-repository";
import { listKelas } from "@/repositories/kelas-repository";

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
    detailCountByAbsensi.set(
      item.absensi_id,
      (detailCountByAbsensi.get(item.absensi_id) || 0) + 1,
    );
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
          <Link href="/admin">Dashboard</Link> /{" "}
          <Link href="/admin/absensi">Manajemen Absensi</Link>
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
                  {kelasItem?.nama_kelas || item.kelas_id} | {item.tanggal} |{" "}
                  {item.jam_mulai || "-"}–{item.jam_selesai || "-"} |{" "}
                  {item.topik || "-"} | {item.status_absensi} | Siswa:{" "}
                  {detailCountByAbsensi.get(item.absensi_id) || 0} | Hadir:{" "}
                  {itemCounts.hadir} | Izin: {itemCounts.izin} | Sakit:{" "}
                  {itemCounts.sakit} | Alpa: {itemCounts.alfa} |{" "}
                  <Link href={`/admin/absensi/${item.absensi_id}`}>Detail</Link> |{" "}
                  <Link href={`/admin/absensi/${item.absensi_id}/edit`}>Edit</Link>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </main>
  );
}
