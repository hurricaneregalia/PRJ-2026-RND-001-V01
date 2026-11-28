import Link from "next/link";
import { redirect } from "next/navigation";

import { connection } from "next/server";

import { auth } from "@/auth";

import AvatarImage from "@/components/ui/avatar-image";
import { todayDate } from "@/lib/date-time";
import { buildTeacherDashboardData } from "@/lib/teacher-dashboard-recap";
import { listAbsensi } from "@/repositories/absensi-repository";
import { listAbsensiDetail } from "@/repositories/absensi-detail-repository";
import { listJadwal } from "@/repositories/jadwal-repository";
import { listKelasSiswa } from "@/repositories/kelas-siswa-repository";
import { listSiswa } from "@/repositories/siswa-repository";
import { getUserById } from "@/repositories/user-repository";
import {
  getKelasIdsForPengajar,
  listKelasForPengajar,
} from "@/services/teacher-scope-service";

export const instant = false;

export const metadata = {
  title: "Dashboard Pengajar",
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

function formatJadwal(items) {
  if (!items || items.length === 0) {
    return "-";
  }

  return items
    .map((item) => `${item.hari || "-"} ${item.jam_mulai || "-"}–${item.jam_selesai || "-"}`)
    .join(", ");
}

export default async function DashboardPengajarPage() {
  await connection();
  const user = await requirePengajar();

  const [
    userRecord,
    activeKelasResult,
    allOwnedKelasResult,
    ownedKelasIdsResult,
    memberships,
    siswa,
    jadwal,
    absensi,
    detail,
  ] = await Promise.all([
    getUserById(user.id),
    listKelasForPengajar(user.id),
    listKelasForPengajar(user.id, { includeNonaktif: true }),
    getKelasIdsForPengajar(user.id),
    listKelasSiswa(),
    listSiswa(),
    listJadwal(),
    listAbsensi(),
    listAbsensiDetail(),
  ]);

  const activeKelas = activeKelasResult.status === "ok" ? activeKelasResult.data : [];
  const allOwnedKelas = allOwnedKelasResult.status === "ok" ? allOwnedKelasResult.data : [];
  const ownedKelasIds = ownedKelasIdsResult.status === "ok" ? ownedKelasIdsResult.data : [];
  const { activeCountByKelas, jadwalByKelas, recapSiswa } = buildTeacherDashboardData({
    activeKelas,
    allOwnedKelas,
    ownedKelasIds,
    memberships,
    siswa,
    jadwal,
    absensi,
    detail,
  });

  return (
    <main>
      <header>
        <h1>Dashboard Pengajar</h1>
        <p>Selamat datang, {userRecord?.name || user.id}</p>
        <p>Hari ini: {todayDate()}</p>
        <AvatarImage src={userRecord?.photo_url} alt={userRecord?.name || user.id} />
        <p>{userRecord?.name || user.id}</p>
      </header>

      <section>
        <h2>Kelas</h2>
        <ul>
          <li>No | Kelas | Pelajaran | Waktu | Siswa | Aksi</li>
          {activeKelas.length === 0 ? (
            <li>Belum ada kelas aktif.</li>
          ) : (
            activeKelas.map((item, index) => (
              <li key={item.kelas_id}>
                {index + 1} | {item.nama_kelas} | - | {formatJadwal(jadwalByKelas.get(item.kelas_id))} |{" "}
                {activeCountByKelas.get(item.kelas_id) || 0} | <Link href={`/pengajar/kelas/${item.kelas_id}`}>Lihat Kelas</Link>
              </li>
            ))
          )}
        </ul>
      </section>

      <section>
        <h2>Siswa</h2>
        <ul>
          <li>No | Nama | Kelas | Hadir | Izin | Sakit | Alpa </li>
          {recapSiswa.length === 0 ? (
            <li>Belum ada rekap absensi.</li>
          ) : (
            recapSiswa.map((item, index) => (
              <li key={item.key}>
                {index + 1}. | {item.nama} | {item.namaKelas} | {item.counts.hadir} | {item.counts.izin} | {item.counts.sakit} | {item.counts.alfa}
              </li>
            ))
          )}
        </ul>
      </section>

      <nav>
        <ul>
          <li>
            <Link href="/pengajar/absensi">Absensi Lengkap</Link>
          </li>
          <li>
            <Link href="/pengajar/laporan">Laporan</Link>
          </li>
          <li>
            <Link href="/pengajar/profil">Profil</Link>
          </li>
          <li>
            <Link href="/sekolah">Informasi Sekolah</Link>
          </li>
          <li>
            <Link href="/login">Keluar</Link>
          </li>
        </ul>
      </nav>
    </main>
  );
}
