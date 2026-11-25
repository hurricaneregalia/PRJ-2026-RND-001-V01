import Link from "next/link";
import { redirect } from "next/navigation";

import { connection } from "next/server";

import { auth } from "@/auth";
import BackButton from "@/components/ui/back-button";
import NoteBox from "@/components/layout/note-box";
import { getSiswaById } from "@/repositories/siswa-repository";
import {
  findActiveKelasSiswaBySiswaId,
  listKelasSiswa,
} from "@/repositories/kelas-siswa-repository";
import ClassCapacityLabel from "@/components/ui/class-capacity-label";
import { getKelasById, listKelas } from "@/repositories/kelas-repository";
import { transferStudents } from "@/services/class-transfer-service";
import { todayDate } from "@/lib/date-time";
import { recordAuditAdmin } from "@/repositories/audit-log-repository";

export const instant = false;

export const metadata = {
  title: "Pindah Kelas Siswa",
};

export default async function PindahKelasSiswaPage({ params }) {
  await connection();
  const { siswaId } = await params;
  const siswa = await getSiswaById(siswaId);
  const membership = await findActiveKelasSiswaBySiswaId(siswaId);
  const kelasSekarang = membership
    ? await getKelasById(membership.kelas_id)
    : null;
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
      item.kelas_id !== kelasSekarang?.kelas_id &&
      (activeCountByKelas.get(item.kelas_id) || 0) < Number(item.kapasitas || 0),
  );

  if (!siswa) {
    return (
      <main>
        <h1>Siswa tidak ditemukan</h1>
        <p>
          <Link href="/admin/siswa">Kembali ke Manajemen Siswa</Link>
        </p>
      </main>
    );
  }

  async function simpanPemindahan(formData) {
    "use server";

    const session = await auth();
    const targetKelasId = formData.get("kelas_tujuan_id");

    const batch = await transferStudents({
      kelasAsalId: kelasSekarang?.kelas_id || "",
      kelasTujuanId: targetKelasId,
      tanggalPemindahan: formData.get("tanggal_pemindahan") || todayDate(),
      dilakukanOleh: session?.user?.id || "",
      siswaIds: [siswaId],
    });

    await recordAuditAdmin({
      tableName: "pemindahan_kelas",
      recordId: batch.pemindahan_id,
      userId: session?.user?.id || "",
      after: batch,
      note: "Pemindahan kelas individual",
    });

    redirect(`/admin/siswa/${siswaId}`);
  }

  return (
    <main>
      <header>
        <h1>Pindah Kelas Siswa</h1>
        <p>Halaman pemindahan individual siswa.</p>
        <p>
          <Link href="/admin">Dashboard</Link> /{" "}
          <Link href="/admin/siswa">Manajemen Siswa</Link> /{" "}
          <Link href={`/admin/siswa/${siswaId}`}>Detail Siswa</Link> / Pindah
          Kelas
        </p>
      </header>

      <section>
        <h2>Identitas Siswa</h2>
        <ul>
          <li>Nama: {siswa.nama}</li>
          <li>NIS: {siswa.nis || "-"}</li>
          <li>Status: {siswa.status}</li>
        </ul>
      </section>

      <section>
        <h2>Kelas Saat Ini</h2>
        {kelasSekarang ? (
          <ul>
            <li>Kelas: {kelasSekarang.nama_kelas}</li>
            <li>ID: {kelasSekarang.kelas_id}</li>
            <li>Status: {kelasSekarang.status_kelas}</li>
          </ul>
        ) : (
          <p>Belum ada keanggotaan aktif.</p>
        )}
      </section>

      <section>
        <h2>Rencana Pemindahan</h2>
        <form id="transfer-form" action={simpanPemindahan}>
          <p>
            <label htmlFor="kelas_tujuan_id">Kelas Tujuan</label>
            <br />
            <select
              id="kelas_tujuan_id"
              name="kelas_tujuan_id"
              required
            >
              <option value="">Pilih kelas tujuan</option>
              {targetKelas.map((item) => {
                const active = activeCountByKelas.get(item.kelas_id) || 0;
                return (
                  <option key={item.kelas_id} value={item.kelas_id}>
                    <ClassCapacityLabel
                      namaKelas={item.nama_kelas}
                      terisi={active}
                      kapasitas={item.kapasitas}
                    />
                  </option>
                );
              })}
            </select>
          </p>

          <p>
            <label htmlFor="tanggal_pemindahan">Tanggal Efektif Pemindahan</label>
            <br />
            <input
              id="tanggal_pemindahan"
              name="tanggal_pemindahan"
              type="date"
              defaultValue={todayDate()}
            />
          </p>

          <p>
            <button type="submit">Konfirmasi Pemindahan</button>
          </p>
        </form>
      </section>

      <NoteBox
        text={
          <ol>
            <li>Riwayat keanggotaan kelas lama tidak dihapus.</li>
            <li>Setelah pemindahan, keanggotaan lama menjadi selesai dan keanggotaan baru menjadi aktif.</li>
            <li>Absensi historis tetap merujuk kelas saat absensi dibuat.</li>
          </ol>
        }
      />
    </main>
  );
}
