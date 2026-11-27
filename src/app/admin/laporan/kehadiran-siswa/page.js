import Link from "next/link";

import { connection } from "next/server";

import { listAbsensi } from "@/repositories/absensi-repository";
import { listAbsensiDetail } from "@/repositories/absensi-detail-repository";
import { listSiswa } from "@/repositories/siswa-repository";
import AdminDataTable from "@/components/ui/admin-data-table";

export const instant = false;

export const metadata = {
  title: "Laporan Kehadiran Siswa",
};

export default async function LaporanKehadiranSiswaPage() {
  await connection();
  const absensi = await listAbsensi();
  const finalAbsensiIds = new Set(
    absensi
      .filter((item) => item.status_absensi === "final")
      .map((item) => item.absensi_id),
  );
  const detail = (await listAbsensiDetail()).filter((item) =>
    finalAbsensiIds.has(item.absensi_id),
  );
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

  const rows = [...perSiswa.entries()].map(([siswaId, item]) => {
    const siswaItem = siswaById.get(siswaId);
    const studentPercentage =
      item.total === 0 ? 0 : Math.round((item.hadir / item.total) * 1000) / 10;

    return {
      id: siswaId,
      nis: siswaItem?.nis || "-",
      nama: siswaItem?.nama || siswaId,
      sesi: item.total,
      hadir: item.hadir,
      izin: item.izin,
      sakit: item.sakit,
      alfa: item.alfa,
      persentase: `${studentPercentage}%`,
    };
  });

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
        <AdminDataTable
          emptyMessage="Belum ada data kehadiran siswa."
          rowKey={(item) => item.id}
          columns={[
            { key: "nis", header: "NIS" },
            { key: "nama", header: "Nama" },
            { key: "sesi", header: "Sesi" },
            { key: "hadir", header: "Hadir" },
            { key: "izin", header: "Izin" },
            { key: "sakit", header: "Sakit" },
            { key: "alfa", header: "Alpa" },
            { key: "persentase", header: "Persentase" },
          ]}
          rows={rows}
        />
      </section>
    </main>
  );
}
