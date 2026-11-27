import Link from "next/link";

import { connection } from "next/server";

import { getSiswaById } from "@/repositories/siswa-repository";
import { findActiveKelasSiswaBySiswaId } from "@/repositories/kelas-siswa-repository";
import { listAbsensi } from "@/repositories/absensi-repository";
import { listAbsensiDetail } from "@/repositories/absensi-detail-repository";
import { getKelasById } from "@/repositories/kelas-repository";

export const instant = false;

export const metadata = {
  title: "Detail Siswa",
};

export default async function DetailSiswaPage({ params }) {
  await connection();
  const { siswaId } = await params;
  const siswa = await getSiswaById(siswaId);
  const membership = await findActiveKelasSiswaBySiswaId(siswaId);
  const kelas = membership ? await getKelasById(membership.kelas_id) : null;
  const absensi = await listAbsensi();
  const detail = await listAbsensiDetail();
  const absensiDetail = detail.filter((item) => item.siswa_id === siswaId);
  const finalAbsensiIds = new Set(
    absensi
      .filter((item) => item.status_absensi === "final")
      .map((item) => item.absensi_id),
  );
  const rekapKehadiran = absensiDetail
    .filter((item) => finalAbsensiIds.has(item.absensi_id))
    .reduce(
      (result, item) => {
        if (result[item.status_kehadiran] !== undefined) {
          result[item.status_kehadiran] += 1;
        }
        return result;
      },
      { hadir: 0, izin: 0, sakit: 0, alfa: 0 },
    );

  if (!siswa) {
    return (
      <main>
        <h1>Siswa tidak ditemukan</h1>
        <p>
          <Link href="/admin/siswa">Kembali ke Manajemen Siswa</Link>
        </p>
      </main>
    );
  }

  const riwayat = absensi
    .filter((item) =>
      absensiDetail.some(
        (detailItem) => detailItem.absensi_id === item.absensi_id,
      ),
    )
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal));

  return (
    <main>
      <header>
        <h1>Detail Siswa</h1>
        <p>
          <Link href="/admin">Dashboard</Link> /{" "}
          <Link href="/admin/siswa">Manajemen Siswa</Link> / Detail Siswa
        </p>
      </header>

      <section>
        <h2>Informasi Siswa</h2>
        <ul>
          <li>NIS: {siswa.nis || "-"}</li>
          <li>Nama lengkap: {siswa.nama}</li>
          <li>Jenis kelamin: {siswa.jenis_kelamin || "-"}</li>
          <li>Tanggal lahir: {siswa.tanggal_lahir || "-"}</li>
          <li>Alamat: {siswa.alamat || "-"}</li>
          <li>Nomor HP: {siswa.no_hp || "-"}</li>
          <li>Status: {siswa.status}</li>
          <li>
            Kelas yang diikuti: {kelas?.nama_kelas || "-"}
          </li>
        </ul>
        <p>
          <Link href={`/admin/siswa/${siswaId}/edit`}>Edit</Link>
        </p>
      </section>

      <section>
        <h2>Rekap Kehadiran</h2>
        <ul>
          <li>Hadir: {rekapKehadiran.hadir}</li>
          <li>Izin: {rekapKehadiran.izin}</li>
          <li>Sakit: {rekapKehadiran.sakit}</li>
          <li>Alpa: {rekapKehadiran.alfa}</li>
        </ul>
      </section>

      <section>
        <h2>Riwayat Absensi</h2>
        {riwayat.length === 0 ? (
          <p>Belum ada riwayat absensi.</p>
        ) : (
          <ol>
            {riwayat.map((item) => {
              const status = absensiDetail.find(
                (detailItem) => detailItem.absensi_id === item.absensi_id,
              )?.status_kehadiran;

              return (
                <li key={item.absensi_id}>
                  {item.tanggal} | {status || "-"}
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </main>
  );
}
