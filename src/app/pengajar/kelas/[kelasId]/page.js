import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { connection } from "next/server";

import { auth } from "@/auth";

import StatusBadge from "@/components/ui/status-badge";
import {
  addAbsensiCount,
  collectFinalAbsensiDetail,
  createAbsensiCounts,
} from "@/lib/teacher-dashboard-recap";
import { listAbsensiByKelasId } from "@/repositories/absensi-repository";
import { listAbsensiDetail } from "@/repositories/absensi-detail-repository";
import { listJadwalByKelasId } from "@/repositories/jadwal-repository";
import { listKelasSiswaByKelasId } from "@/repositories/kelas-siswa-repository";
import { listSiswa } from "@/repositories/siswa-repository";
import { getUserById } from "@/repositories/user-repository";
import { getKelasForPengajar } from "@/services/teacher-scope-service";

export const metadata = {
  title: "Detail Kelas",
};

export const instant = false;

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

export default async function DetailKelasPengajarPage({ params }) {
  await connection();
  const user = await requirePengajar();
  const { kelasId } = await params;
  const kelasResult = await getKelasForPengajar(user.id, kelasId);

  if (kelasResult.status !== "ok") {
    notFound();
  }

  const kelas = kelasResult.data;
  const [pengajar, memberships, jadwal, siswa, absensi, detail] = await Promise.all([
    getUserById(kelas.pengajar_id),
    listKelasSiswaByKelasId(kelas.kelas_id),
    listJadwalByKelasId(kelas.kelas_id),
    listSiswa(),
    listAbsensiByKelasId(kelas.kelas_id),
    listAbsensiDetail(),
  ]);

  const activeMemberships = memberships.filter((item) => item.status_keanggotaan === "aktif");
  const jadwalAktif = jadwal.filter((item) => item.status_jadwal === "aktif");
  const siswaById = new Map(siswa.map((item) => [item.siswa_id, item]));
  const finalRows = collectFinalAbsensiDetail({
    absensi,
    detail,
    kelasId: kelas.kelas_id,
  });
  const countsBySiswa = new Map();

  for (const row of finalRows) {
    const counts = countsBySiswa.get(row.siswa_id) || createAbsensiCounts();
    addAbsensiCount(counts, row.status_kehadiran);
    countsBySiswa.set(row.siswa_id, counts);
  }

  const daftarSiswa = activeMemberships
    .map((item) => {
      const siswaItem = siswaById.get(item.siswa_id);

      return {
        kelasSiswaId: item.kelas_siswa_id,
        nama: siswaItem?.nama || item.siswa_id,
        counts: countsBySiswa.get(item.siswa_id) || createAbsensiCounts(),
      };
    })
    .sort((left, right) => left.nama.localeCompare(right.nama));

  return (
    <main>
      <header>
        <h1>Detail Kelas</h1>
        <p>
          <Link href="/pengajar">Dashboard</Link> / <Link href="/pengajar/kelas">Kelas Saya</Link> / Detail Kelas
        </p>
      </header>
      <section>
        <h2>Informasi Detail Kelas</h2>
        <ul>
          <li>Nama kelas: {kelas.nama_kelas}</li>
          <li>Mata pelajaran: -</li>
          <li>Nama pengajar: {pengajar?.name || kelas.pengajar_id}</li>
          <li>Jumlah siswa: {activeMemberships.length}</li>
          <li>Jadwal rutin: {formatJadwal(jadwalAktif)}</li>
          <li>Ruangan belajar: {jadwalAktif.find((item) => item.ruangan)?.ruangan || "-"}</li>
          <li>
            Status kelas: <StatusBadge value={kelas.status_kelas} />
          </li>
        </ul>
      </section>
      <section>
        <h2>Daftar Siswa</h2>
        <ul>
          <li>No | Nama | Hadir | Izin | Sakit | Alpa </li>
          {daftarSiswa.length === 0 ? (
            <li>Belum ada siswa aktif di kelas ini.</li>
          ) : (
            daftarSiswa.map((item, index) => (
              <li key={item.kelasSiswaId}>
                {index + 1}. | {item.nama} | {item.counts.hadir} | {item.counts.izin} | {item.counts.sakit} | {item.counts.alfa}
              </li>
            ))
          )}
        </ul>
      </section>
      <p>
        <Link href={`/pengajar/kelas/${kelas.kelas_id}/absensi/riwayat`}>Riwayat Absensi</Link>
      </p>
      {kelas.status_kelas === "aktif" ? (
        <p>
          <Link href={`/pengajar/kelas/${kelas.kelas_id}/absensi/tambah`}>Buat Absensi</Link>
        </p>
      ) : (
        <p>Penulisan absensi tidak tersedia untuk kelas nonaktif.</p>
      )}
    </main>
  );
}
