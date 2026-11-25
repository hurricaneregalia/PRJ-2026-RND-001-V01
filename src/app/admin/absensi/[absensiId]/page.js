import Link from "next/link";

import { connection } from "next/server";

import { getAbsensiById } from "@/repositories/absensi-repository";
import { listAbsensiDetailByAbsensiId } from "@/repositories/absensi-detail-repository";
import { getKelasById } from "@/repositories/kelas-repository";
import { getSiswaById } from "@/repositories/siswa-repository";
import { getUserById } from "@/repositories/user-repository";

export const instant = false;

export const metadata = {
  title: "Detail Absensi",
};

export default async function DetailAbsensiPage({ params }) {
  await connection();
  const { absensiId } = await params;
  const absensi = await getAbsensiById(absensiId);

  if (!absensi) {
    return (
      <main>
        <h1>Absensi tidak ditemukan</h1>
        <p>
          <Link href="/admin/absensi">Kembali ke Manajemen Absensi</Link>
        </p>
      </main>
    );
  }

  const detail = await listAbsensiDetailByAbsensiId(absensiId);
  const kelas = await getKelasById(absensi.kelas_id);
  const pencatat = absensi.created_by
    ? await getUserById(absensi.created_by)
    : null;
  const siswaList = await Promise.all(
    detail.map(async (item) => ({
      detail: item,
      siswa: await getSiswaById(item.siswa_id),
    })),
  );
  const counts = detail.reduce(
    (result, item) => {
      result[item.status_kehadiran] = (result[item.status_kehadiran] || 0) + 1;
      return result;
    },
    { hadir: 0, izin: 0, sakit: 0, alfa: 0 },
  );

  return (
    <main>
      <header>
        <h1>Detail Absensi</h1>
        <p>
          <Link href="/admin">Dashboard</Link> /{" "}
          <Link href="/admin/absensi">Manajemen Absensi</Link> / Detail Absensi
        </p>
      </header>

      <section>
        <h2>Informasi Utama</h2>
        <ul>
          <li>ID Absensi: {absensi.absensi_id}</li>
          <li>Kelas: {kelas?.nama_kelas || absensi.kelas_id}</li>
          <li>Tanggal: {absensi.tanggal}</li>
          <li>
            Waktu: {absensi.jam_mulai || "-"}–{absensi.jam_selesai || "-"}
          </li>
          <li>Topik: {absensi.topik || "-"}</li>
          <li>Status Absensi: {absensi.status_absensi}</li>
          <li>Dicatat oleh: {pencatat?.name || "-"}</li>
        </ul>
      </section>

      <section>
        <h2>Statistik</h2>
        <ul>
          <li>Total siswa: {detail.length}</li>
          <li>Hadir: {counts.hadir}</li>
          <li>Izin: {counts.izin}</li>
          <li>Sakit: {counts.sakit}</li>
          <li>Alpa: {counts.alfa}</li>
        </ul>
      </section>

      <section>
        <h2>Daftar Siswa</h2>
        {siswaList.length === 0 ? (
          <p>Belum ada data kehadiran siswa.</p>
        ) : (
          <ol>
            {siswaList.map(({ detail: item, siswa }) => (
              <li key={item.absensi_detail_id}>
                {siswa?.nis || "-"} | {siswa?.nama || item.siswa_id} |{" "}
                {item.status_kehadiran} | {item.catatan || "-"}
              </li>
            ))}
          </ol>
        )}
        <p>
          <Link href={`/admin/absensi/${absensi.absensi_id}/edit`}>
            Edit Status
          </Link>
        </p>
      </section>
    </main>
  );
}
