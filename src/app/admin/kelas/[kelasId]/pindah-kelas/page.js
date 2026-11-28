import Link from "next/link";
import { redirect } from "next/navigation";

import { connection } from "next/server";

import { auth } from "@/auth";
import BackButton from "@/components/ui/back-button";
import StatusBadge from "@/components/ui/status-badge";
import NoteBox from "@/components/layout/note-box";
import { getKelasById, listKelas } from "@/repositories/kelas-repository";
import EntitySelect from "@/components/ui/entity-select";
import {
  listKelasSiswa,
  listKelasSiswaByKelasId,
} from "@/repositories/kelas-siswa-repository";
import { listSiswa } from "@/repositories/siswa-repository";
import ClassCapacityLabel from "@/components/ui/class-capacity-label";
import { getUserById } from "@/repositories/user-repository";
import { transferStudents } from "@/services/class-transfer-service";
import { todayDate } from "@/lib/date-time";
import { recordAuditAdmin } from "@/repositories/audit-log-repository";

export const instant = false;

export const metadata = {
  title: "Pindah Kelas",
};

export default async function PindahKelasKelasPage({ params }) {
  await connection();
  const { kelasId } = await params;
  const kelasAsal = await getKelasById(kelasId);
  const memberships = kelasAsal ? await listKelasSiswaByKelasId(kelasAsal.kelas_id) : [];
  const siswaList = await listSiswa();
  const siswaById = new Map(siswaList.map((item) => [item.siswa_id, item]));
  const allKelas = await listKelas();
  const allMemberships = await listKelasSiswa();
  const activeCountByKelas = new Map();

  allMemberships
    .filter((item) => item.status_keanggotaan === "aktif")
    .forEach((item) => {
      activeCountByKelas.set(
        item.kelas_id,
        (activeCountByKelas.get(item.kelas_id) || 0) + 1,
      );
    });

  const targetKelas = allKelas.filter(
    (item) =>
      item.status_kelas === "aktif" &&
      item.kelas_id !== kelasAsal?.kelas_id &&
      (activeCountByKelas.get(item.kelas_id) || 0) < Number(item.kapasitas || 0),
  );

  if (!kelasAsal) {
    return (
      <main>
        <h1>Kelas tidak ditemukan</h1>
        <p>
          <Link href="/admin/kelas">Kembali ke Manajemen Kelas</Link>
        </p>
      </main>
    );
  }

  const activeMemberships = memberships.filter((item) => item.status_keanggotaan === "aktif");
  const pengajar = await getUserById(kelasAsal.pengajar_id);

  async function simpanPemindahan(formData) {
    "use server";

    const session = await auth();
    const selectedIds = [...formData.keys()]
      .filter((key) => key.startsWith("siswa_"))
      .map((key) => formData.get(key))
      .filter(Boolean);

    const batch = await transferStudents({
      kelasAsalId: kelasId,
      kelasTujuanId: formData.get("kelas_tujuan_id"),
      tanggalPemindahan: formData.get("tanggal_pemindahan") || todayDate(),
      dilakukanOleh: session?.user?.id || "",
      siswaIds: selectedIds,
    });

    await recordAuditAdmin({
      tableName: "pemindahan_kelas",
      recordId: batch.pemindahan_id,
      userId: session?.user?.id || "",
      after: batch,
      note: "Pemindahan kelas batch",
    });

    redirect(`/admin/kelas/${kelasId}`);
  }

  return (
    <main>
      <header>
        <h1>Pindah Kelas</h1>
        <p>
          <Link href="/admin">Dashboard</Link> / <Link href="/admin/kelas">Manajemen Kelas</Link> / <Link href={`/admin/kelas/${kelasId}`}>Detail Kelas</Link> / Pindah Kelas
        </p>
      </header>

      <section aria-labelledby="anggota-aktif">
        <h2 id="anggota-aktif">Siswa Kelas {kelasAsal.nama_kelas}</h2>
        <ul>
          {activeMemberships.map((anggota) => (
            <li key={anggota.kelas_siswa_id}>
              <label>
                <input type="checkbox" form="transfer-form" name={`siswa_${anggota.siswa_id}`} value={anggota.siswa_id} /> {siswaById.get(anggota.siswa_id)?.nama || anggota.siswa_id} | NIS{" "}
                {siswaById.get(anggota.siswa_id)?.nis || "-"} | Status <StatusBadge value={anggota.status_keanggotaan} labels={{ pending: "Pending", selesai: "Selesai", dibatalkan: "Dibatalkan" }} />
              </label>
            </li>
          ))}
        </ul>
      </section>

      <form id="transfer-form" action={simpanPemindahan}>
        <section aria-labelledby="rencana-pemindahan">
          <h2 id="rencana-pemindahan">Rencana Pemindahan</h2>

          <p>
            <label htmlFor="kelas_tujuan_id">Kelas Tujuan</label>
            <br />
            <EntitySelect
              id="kelas_tujuan_id"
              name="kelas_tujuan_id"
              items={targetKelas}
              required
              placeholder="Pilih kelas tujuan"
              valueKey="kelas_id"
              formatLabel={(item) => {
                const active = activeCountByKelas.get(item.kelas_id) || 0;
                const available = Number(item.kapasitas || 0) - active;
                return `${item.nama_kelas} Tersedia ${available} Kursi`;
              }}
            />
          </p>

          <p>
            <label htmlFor="tanggal_pemindahan">Tanggal Efektif Pemindahan</label>
            <br />
            <input id="tanggal_pemindahan" name="tanggal_pemindahan" type="date" defaultValue={todayDate()} />
          </p>

          <p>
            <button type="submit">Konfirmasi Pemindahan</button>
          </p>
        </section>
      </form>
    </main>
  );
}
