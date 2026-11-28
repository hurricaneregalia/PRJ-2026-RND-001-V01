import Link from "next/link";

import { redirect } from "next/navigation";

import { connection } from "next/server";

import { auth } from "@/auth";

import FormatDate from "@/components/ui/format-date";
import {
  addAbsensiCount,
  buildTeacherDashboardData,
  collectFinalAbsensiDetail,
  createAbsensiCounts,
} from "@/lib/teacher-dashboard-recap";
import { listAbsensi } from "@/repositories/absensi-repository";
import { listAbsensiDetail } from "@/repositories/absensi-detail-repository";
import { listSiswa } from "@/repositories/siswa-repository";
import {
  getKelasIdsForPengajar,
  listKelasForPengajar,
} from "@/services/teacher-scope-service";

export const instant = false;

export const metadata = {
  title: "Absensi",
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

export default async function AbsensiPengajarPage() {
  await connection();
  const user = await requirePengajar();

  const [ownedKelasIdsResult, allOwnedKelasResult, siswa, absensi, detail] = await Promise.all([
    getKelasIdsForPengajar(user.id),
    listKelasForPengajar(user.id, { includeNonaktif: true }),
    listSiswa(),
    listAbsensi(),
    listAbsensiDetail(),
  ]);

  const ownedKelasIds =
    ownedKelasIdsResult.status === "ok" ? ownedKelasIdsResult.data : [];
  const allOwnedKelas =
    allOwnedKelasResult.status === "ok" ? allOwnedKelasResult.data : [];
  const ownedKelasIdSet = new Set(ownedKelasIds);
  const kelasById = new Map(allOwnedKelas.map((item) => [item.kelas_id, item]));

  const { recapSiswa } = buildTeacherDashboardData({
    activeKelas: [],
    allOwnedKelas,
    ownedKelasIds,
    memberships: [],
    siswa,
    jadwal: [],
    absensi,
    detail,
  });

  const finalRows = collectFinalAbsensiDetail({
    absensi,
    detail,
    ownedKelasIds,
  });
  const countsByAbsensi = new Map();
  const siswaCountByAbsensi = new Map();

  for (const row of finalRows) {
    const counts = countsByAbsensi.get(row.absensi_id) || createAbsensiCounts();
    addAbsensiCount(counts, row.status_kehadiran);
    countsByAbsensi.set(row.absensi_id, counts);
    siswaCountByAbsensi.set(
      row.absensi_id,
      (siswaCountByAbsensi.get(row.absensi_id) || 0) + 1,
    );
  }

  const daftarAbsensi = absensi
    .filter(
      (item) => item.status_absensi === "final" && ownedKelasIdSet.has(item.kelas_id),
    )
    .map((item) => ({
      ...item,
      namaKelas: kelasById.get(item.kelas_id)?.nama_kelas || item.kelas_id,
      jumlahSiswa: siswaCountByAbsensi.get(item.absensi_id) || 0,
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
        <h1>Absensi</h1>
        <p>
          <Link href="/pengajar">Dashboard</Link> / Absensi
        </p>
      </header>

      <section>
        <h2>Hitungan Absensi Siswa</h2>
        <ul>
          <li>No | Nama | Kelas | Hadir | Izin | Sakit | Alpa </li>
          {recapSiswa.length === 0 ? (
            <li>Belum ada rekap absensi.</li>
          ) : (
            recapSiswa.map((item, index) => (
              <li key={item.key}>
                {index + 1}. | {item.nama} | {item.namaKelas} | {item.counts.hadir} |{" "}
                {item.counts.izin} | {item.counts.sakit} | {item.counts.alfa}
              </li>
            ))
          )}
        </ul>
      </section>

      <section>
        <h2>Daftar Sesi Absensi</h2>
        <ul>
          <li>Tanggal | Kelas| Siswa| Hadir | Izin | Sakit | Alpa | Aksi</li>{" "}
          {daftarAbsensi.length === 0 ? (
            <li>Belum ada sesi absensi final.</li>
          ) : (
            daftarAbsensi.map((item) => (
              <li key={item.absensi_id}>
                <FormatDate tanggal={item.tanggal} /> | {item.namaKelas} | {item.jumlahSiswa} |{" "}
                {item.counts.hadir} | {item.counts.izin} | {item.counts.sakit} | {item.counts.alfa} |{" "}
                <Link href={`/pengajar/kelas/${item.kelas_id}/absensi/${item.absensi_id}`}>
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
