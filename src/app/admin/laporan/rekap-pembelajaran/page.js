import Link from "next/link";

import { connection } from "next/server";

import { listAbsensi } from "@/repositories/absensi-repository";
import { listAbsensiDetail } from "@/repositories/absensi-detail-repository";
import AdminDataTable from "@/components/ui/admin-data-table";

export const instant = false;

export const metadata = {
  title: "Laporan Rekap Pembelajaran",
};

export default async function LaporanRekapPembelajaranPage() {
  await connection();
  const absensi = (await listAbsensi()).filter(
    (item) => item.status_absensi === "final",
  );
  const finalAbsensiIds = new Set(absensi.map((item) => item.absensi_id));
  const detail = (await listAbsensiDetail()).filter((item) =>
    finalAbsensiIds.has(item.absensi_id),
  );
  const absensiById = new Map(absensi.map((item) => [item.absensi_id, item]));

  const perDate = new Map();
  detail.forEach((item) => {
    const absensiItem = absensiById.get(item.absensi_id);
    if (!absensiItem) {
      return;
    }
    const current = perDate.get(absensiItem.tanggal) || {
      sesi: new Set(),
      total: 0,
      hadir: 0,
    };
    current.sesi.add(absensiItem.absensi_id);
    current.total += 1;
    if (item.status_kehadiran === "hadir") {
      current.hadir += 1;
    }
    perDate.set(absensiItem.tanggal, current);
  });

  const totals = detail.reduce(
    (result, item) => {
      result.total += 1;
      if (item.status_kehadiran === "hadir") {
        result.hadir += 1;
      }
      return result;
    },
    { total: 0, hadir: 0 },
  );
  const average =
    totals.total === 0 ? 0 : Math.round((totals.hadir / totals.total) * 1000) / 10;

  const rows = [...perDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([tanggal, item]) => ({
      tanggal,
      sesi: item.sesi.size,
      total: item.total,
      persentase: `${item.total === 0 ? 0 : Math.round((item.hadir / item.total) * 1000) / 10}%`,
    }));

  return (
    <main>
      <header>
        <h1>Laporan Rekap Pembelajaran</h1>
        <p>
          <Link href="/admin">Dashboard</Link> /{" "}
          <Link href="/admin/laporan">Laporan</Link> / Laporan Rekap Pembelajaran
        </p>
      </header>

      <section>
        <h2>Ringkasan</h2>
        <ul>
          <li>Total sesi pembelajaran: {absensi.length}</li>
          <li>Total catatan absensi: {detail.length}</li>
          <li>Rata-rata persentase kehadiran: {average}%</li>
        </ul>
      </section>

      <section>
        <h2>Rekap Pembelajaran Berdasarkan Periode</h2>
        <AdminDataTable
          emptyMessage="Belum ada data pembelajaran."
          rowKey={(item) => item.tanggal}
          columns={[
            { key: "tanggal", header: "Tanggal" },
            { key: "sesi", header: "Total Sesi" },
            { key: "total", header: "Total Catatan Absensi" },
            { key: "persentase", header: "Rata-rata Kehadiran" },
          ]}
          rows={rows}
        />
      </section>
    </main>
  );
}
