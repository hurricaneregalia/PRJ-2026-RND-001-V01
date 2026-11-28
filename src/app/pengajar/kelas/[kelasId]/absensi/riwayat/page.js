import Link from "next/link";

import { notFound, redirect } from "next/navigation";

import { connection } from "next/server";

import { auth } from "@/auth";

import FormatDate from "@/components/ui/format-date";
import {
  addAbsensiCount,
  collectFinalAbsensiDetail,
  createAbsensiCounts,
} from "@/lib/teacher-dashboard-recap";
import { listAbsensiByKelasId } from "@/repositories/absensi-repository";
import { listAbsensiDetail } from "@/repositories/absensi-detail-repository";
import { getUserById } from "@/repositories/user-repository";
import { getKelasForPengajar } from "@/services/teacher-scope-service";

export const instant = false;

export const metadata = {
  title: "Riwayat Absensi",
};

async function requirePengajar() {
  const session = await auth();
  const user = session?.user;

  if (!user || user.bootstrapPending || user.accountStatus !== "active") {
    redirect("/login");
  }

  if (user.role === "Admin") {
    redirect("/admin");
  }

  if (user.role !== "Pengajar") {
    redirect("/login");
  }

  return user;
}

export default async function RiwayatAbsensiPage({ params }) {
  await connection();
  const user = await requirePengajar();
  const { kelasId } = await params;
  const kelasResult = await getKelasForPengajar(user.id, kelasId);

  if (kelasResult.status !== "ok") {
    notFound();
  }

  const kelas = kelasResult.data;
  const [pengajar, absensi, detail] = await Promise.all([
    getUserById(kelas.pengajar_id),
    listAbsensiByKelasId(kelas.kelas_id),
    listAbsensiDetail(),
  ]);

  const finalRows = collectFinalAbsensiDetail({
    absensi,
    detail,
    kelasId: kelas.kelas_id,
  });
  const countsByAbsensi = new Map();

  for (const row of finalRows) {
    const counts = countsByAbsensi.get(row.absensi_id) || createAbsensiCounts();
    addAbsensiCount(counts, row.status_kehadiran);
    countsByAbsensi.set(row.absensi_id, counts);
  }

  const riwayat = absensi
    .filter((item) => item.status_absensi === "final")
    .map((item) => ({
      ...item,
      counts: countsByAbsensi.get(item.absensi_id) || createAbsensiCounts(),
    }))
    .sort(
      (left, right) =>
        String(right.tanggal || "").localeCompare(String(left.tanggal || "")) ||
        String(left.absensi_id || "").localeCompare(String(right.absensi_id || "")),
    );

  return (
    <main>
      <header>
        <h1>Riwayat Absensi</h1>
        <p>
          <Link href="/pengajar">Dashboard</Link> / <Link href="/pengajar/kelas">Kelas Saya</Link> /{" "}
          <Link href={`/pengajar/kelas/${kelas.kelas_id}`}>Detail Kelas</Link> / Riwayat Absensi
        </p>
      </header>

      <section>
        <h2>Informasi Kelas</h2>
        <ul>
          <li>Nama kelas: {kelas.nama_kelas}</li>
          <li>Nama pengajar: {pengajar?.name || kelas.pengajar_id}</li>
        </ul>
      </section>

      <section>
        <h2>Riwayat Absensi</h2>
        <ul>
          <li>Tanggal | Hadir | Izin | Sakit | Alpa | Aksi</li>
          {riwayat.length === 0 ? (
            <li>Belum ada riwayat absensi final.</li>
          ) : (
            riwayat.map((item) => (
              <li key={item.absensi_id}>
                <FormatDate tanggal={item.tanggal} /> | {item.counts.hadir} | {item.counts.izin} |{" "}
                {item.counts.sakit} | {item.counts.alfa} |{" "}
                <Link href={`/pengajar/kelas/${kelas.kelas_id}/absensi/${item.absensi_id}`}>
                  Detail
                </Link>
              </li>
            ))
          )}
        </ul>
      </section>
    </main>
  );
}
