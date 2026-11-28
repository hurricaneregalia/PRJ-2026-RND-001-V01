import Link from "next/link";

import { notFound, redirect } from "next/navigation";

import { connection } from "next/server";

import { auth } from "@/auth";

import FormatDate from "@/components/ui/format-date";
import StatusBadge from "@/components/ui/status-badge";
import {
  addAbsensiCount,
  collectFinalAbsensiDetail,
  createAbsensiCounts,
} from "@/lib/teacher-dashboard-recap";
import { listAbsensiDetailByAbsensiId } from "@/repositories/absensi-detail-repository";
import { listJadwalByKelasId } from "@/repositories/jadwal-repository";
import { listSiswa } from "@/repositories/siswa-repository";
import { getAbsensiForPengajar, getKelasForPengajar } from "@/services/teacher-scope-service";

export const instant = false;

export const metadata = {
  title: "Detail Absensi",
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

export default async function DetailAbsensiPengajarKelasPage({ params }) {
  await connection();
  const user = await requirePengajar();
  const { kelasId, absensiId } = await params;
  const absensiResult = await getAbsensiForPengajar(user.id, kelasId, absensiId);

  if (absensiResult.status !== "ok" || absensiResult.data.status_absensi !== "final") {
    notFound();
  }

  const kelasResult = await getKelasForPengajar(user.id, kelasId);

  if (kelasResult.status !== "ok") {
    notFound();
  }

  const absensi = absensiResult.data;
  const kelas = kelasResult.data;
  const [detail, siswa, jadwal] = await Promise.all([
    listAbsensiDetailByAbsensiId(absensi.absensi_id),
    listSiswa(),
    listJadwalByKelasId(kelas.kelas_id),
  ]);

  const finalRows = collectFinalAbsensiDetail({
    absensi: [absensi],
    detail,
    kelasId: kelas.kelas_id,
  });
  const siswaById = new Map(siswa.map((item) => [item.siswa_id, item]));
  const counts = createAbsensiCounts();

  for (const row of finalRows) {
    addAbsensiCount(counts, row.status_kehadiran);
  }

  const daftarSiswa = finalRows
    .map((row) => ({
      absensiDetailId: row.absensi_detail_id,
      nama: siswaById.get(row.siswa_id)?.nama || row.siswa_id,
      status: row.status_kehadiran,
    }))
    .sort((left, right) => left.nama.localeCompare(right.nama));

  const jadwalAktif = jadwal.filter((item) => item.status_jadwal === "aktif");
  const jadwalSesi =
    jadwalAktif.find((item) => item.jadwal_id === absensi.jadwal_id) || null;
  const ruangan = jadwalSesi?.ruangan || jadwalAktif.find((item) => item.ruangan)?.ruangan || "-";

  return (
    <main>
      <header>
        <h1>Detail Absensi</h1>
        <p>
          <Link href="/pengajar">Dashboard</Link> / <Link href="/pengajar/kelas">Kelas Saya</Link> /{" "}
          <Link href={`/pengajar/kelas/${kelas.kelas_id}`}>Detail Kelas</Link> /{" "}
          <Link href={`/pengajar/kelas/${kelas.kelas_id}/absensi/riwayat`}>Riwayat Absensi</Link> / Detail Absensi
        </p>
      </header>

      <section>
        <h2>Informasi Pertemuan</h2>
        <ul>
          <li>Tanggal pertemuan: <FormatDate tanggal={absensi.tanggal} /></li>
          <li>Ruangan: {ruangan}</li>
          <li>Status pertemuan: <StatusBadge value={absensi.status_absensi} /></li>
        </ul>
      </section>

      <section>
        <h2>Ringkasan Kehadiran</h2>
        <ul>
          <li>Hadir: {counts.hadir}</li>
          <li>Izin: {counts.izin}</li>
          <li>Sakit: {counts.sakit}</li>
          <li>Alpa: {counts.alfa}</li>
        </ul>
      </section>

      <section>
        <h2>Daftar Siswa</h2>
        <ul>
          <li>No. | Nama Siswa | Status Kehadiran </li>
          {daftarSiswa.length === 0 ? (
            <li>Belum ada data kehadiran.</li>
          ) : (
            daftarSiswa.map((item, index) => (
              <li key={item.absensiDetailId || `${item.nama}-${index}`}>
                {index + 1} | {item.nama} | <StatusBadge value={item.status} />
              </li>
            ))
          )}
        </ul>
      </section>

      <section>
        <h2>Catatan Pengajar</h2>
        <p>Materi yang dibahas: {absensi.topik || "-"}</p>
      </section>

      {kelas.status_kelas === "aktif" ? (
        <p>
          <Link href={`/pengajar/kelas/${kelas.kelas_id}/absensi/${absensi.absensi_id}/edit`}>
            Edit Absensi
          </Link>
        </p>
      ) : null}
    </main>
  );
}
