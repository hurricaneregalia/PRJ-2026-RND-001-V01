import Link from "next/link";

import { connection } from "next/server";

import { listAbsensiDetail } from "@/repositories/absensi-detail-repository";
import { listSiswa } from "@/repositories/siswa-repository";

export const instant = false;

export const metadata = {
  title: "Laporan Kehadiran Siswa",
};

export default async function LaporanKehadiranSiswaPage() {
  await connection();
  const detail = await listAbsensiDetail();
  const siswa = await listSiswa();
  const siswaById = new Map(siswa.map((item) => [item.siswa_id, item]));

  const perSiswa = new Map();
  detail.forEach((item) => {
    const current = perSiswa.get(item.siswa_id) || {
      total: 0,
      hadir: 0,
      izin: 0,
      sakit: 0,
      alfa: 0,
    };
    current.total += 1;
    current[item.status_kehadiran] = (current[item.status_kehadiran] || 0) + 1;
    perSiswa.set(item.siswa_id, current);
  });

  const totals = detail.reduce(
    (result, item) => {
      result[item.status_kehadiran] = (result[item.status_kehadiran] || 0) + 1;
      return result;
    },
    { hadir: 0, izin: 0, sakit: 0, alfa: 0 },
  );
  const persentase =
    detail.length === 0
      ? 0
      : Math.round((totals.hadir / detail.length) * 1000) / 10;

  return (
    <main>
      <header>
        <h1>Laporan Kehadiran Siswa</h1>
        <p>
          <Link href="/admin">Dashboard</Link> /{" "}
          <Link href="/admin/laporan">Laporan</Link> / Laporan Kehadiran Siswa
        </p>
      </header>

      <section>
        <h2>Ringkasan</h2>
        <ul>
          <li>Total hadir: {totals.hadir}</li>
          <li>Total izin: {totals.izin}</li>
          <li>Total sakit: {totals.sakit}</li>
          <li>Total alpa: {totals.alfa}</li>
          <li>Persentase kehadiran: {persentase}%</li>
        </ul>
      </section>

      <section>
        <h2>Rekap Kehadiran Siswa</h2>
        {perSiswa.size === 0 ? (
          <p>Belum ada data kehadiran siswa.</p>
        ) : (
          <ol>
            {[...perSiswa.entries()].map(([siswaId, item]) => {
              const siswaItem = siswaById.get(siswaId);
              const studentPercentage =
                item.total === 0
                  ? 0
                  : Math.round((item.hadir / item.total) * 1000) / 10;

              return (
                <li key={siswaId}>
                  {siswaItem?.nis || "-"} | {siswaItem?.nama || siswaId} |
                  Sesi: {item.total} | Hadir: {item.hadir} | Izin: {item.izin} |
                  Sakit: {item.sakit} | Alpa: {item.alfa} |{" "}
                  {studentPercentage}%
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </main>
  );
}
