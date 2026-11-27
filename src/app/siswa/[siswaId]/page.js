import { connection } from "next/server";

import { listAbsensi } from "@/repositories/absensi-repository";
import { listAbsensiDetail } from "@/repositories/absensi-detail-repository";
import { getKelasById } from "@/repositories/kelas-repository";
import { findActiveKelasSiswaBySiswaId } from "@/repositories/kelas-siswa-repository";
import { getSiswaById } from "@/repositories/siswa-repository";
import { getUserById } from "@/repositories/user-repository";

export const instant = false;

export const metadata = {
  title: "Detail Siswa",
};

const PERIODE_VALUES = new Set(["30", "90", "180", "365"]);

function normalisasiPeriode(value) {
  return PERIODE_VALUES.has(value) ? value : "180";
}

function tanggalMulaiPeriode(periodeHari, today) {
  const date = new Date(today);
  date.setUTCDate(date.getUTCDate() - (Number(periodeHari) - 1));
  return date.toISOString().slice(0, 10);
}

export default async function SiswaPublikPage({ params, searchParams }) {
  await connection();
  const { siswaId } = await params;
  const query = await searchParams;
  const periodeHari = normalisasiPeriode(
    typeof query?.periode === "string" ? query.periode : "",
  );

  const siswa = await getSiswaById(siswaId);

  if (!siswa) {
    return (
      <main>
        <h1>Siswa tidak ditemukan</h1>
      </main>
    );
  }

  const membership = await findActiveKelasSiswaBySiswaId(siswaId);
  const kelas = membership ? await getKelasById(membership.kelas_id) : null;
  const pengajar = kelas?.pengajar_id
    ? await getUserById(kelas.pengajar_id)
    : null;

  const today = new Date().toISOString().slice(0, 10);
  const tanggalMulai = tanggalMulaiPeriode(periodeHari, today);

  const absensi = await listAbsensi();
  const detail = await listAbsensiDetail();
  const absensiFinalById = new Map(
    absensi
      .filter(
        (item) =>
          item.status_absensi === "final" &&
          item.tanggal >= tanggalMulai &&
          item.tanggal <= today,
      )
      .map((item) => [item.absensi_id, item]),
  );
  const absensiDetail = detail.filter(
    (item) =>
      item.siswa_id === siswaId && absensiFinalById.has(item.absensi_id),
  );
  const rekapKehadiran = absensiDetail.reduce(
    (result, item) => {
      if (result[item.status_kehadiran] !== undefined) {
        result[item.status_kehadiran] += 1;
      }
      return result;
    },
    { hadir: 0, izin: 0, sakit: 0, alfa: 0 },
  );
  const riwayat = [...absensiFinalById.values()]
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
      </header>

      <section>
        <h2>Informasi Siswa</h2>
        <ul>
          <li>NIS: {siswa.nis || "-"}</li>
          <li>Nama lengkap: {siswa.nama}</li>
          <li>Jenis kelamin: {siswa.jenis_kelamin || "-"}</li>
          <li>Kelas yang diikuti: {kelas?.nama_kelas || "-"}</li>
          <li>Nama Guru: {pengajar?.name || "-"}</li>
        </ul>
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
