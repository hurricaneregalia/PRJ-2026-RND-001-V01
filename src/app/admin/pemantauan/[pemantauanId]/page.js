import Link from "next/link";
import { redirect } from "next/navigation";

import { connection } from "next/server";

import { auth } from "@/auth";
import {
  getPemantauanById,
  updatePemantauan,
} from "@/repositories/pemantauan-ketidakhadiran-repository";
import { getSiswaById } from "@/repositories/siswa-repository";
import { getKelasById } from "@/repositories/kelas-repository";
import { listRiwayatKontakByPemantauanId } from "@/repositories/riwayat-kontak-repository";
import ContactHistoryList from "@/components/ui/contact-history-list";
import { todayDate } from "@/lib/date-time";
import { recordAuditUpdate } from "@/repositories/audit-log-repository";

export const instant = false;

export const metadata = {
  title: "Detail Pemantauan",
};

export default async function DetailPemantauanPage({ params }) {
  await connection();
  const { pemantauanId } = await params;
  const pemantauan = await getPemantauanById(pemantauanId);

  if (!pemantauan) {
    return (
      <main>
        <h1>Pemantauan tidak ditemukan</h1>
        <p>
          <Link href="/admin/pemantauan">Kembali ke Pemantauan</Link>
        </p>
      </main>
    );
  }

  const siswa = await getSiswaById(pemantauan.siswa_id);
  const kelas = await getKelasById(pemantauan.kelas_id);
  const riwayat = await listRiwayatKontakByPemantauanId(pemantauan.pemantauan_id);
  const riwayatTerurut = [...riwayat].sort((left, right) => String(right.tanggal_kontak).localeCompare(String(left.tanggal_kontak)));

  async function selesaikanPemantauan() {
    "use server";

    const session = await auth();
    const before = await getPemantauanById(pemantauanId);
    const after = await updatePemantauan(pemantauanId, {
      status_pemantauan: "selesai",
      tanggal_selesai: todayDate(),
    });

    await recordAuditUpdate({
      tableName: "pemantauan_ketidakhadiran",
      recordId: pemantauanId,
      userId: session?.user?.id || "",
      before,
      after,
      note: "Penyelesaian pemantauan ketidakhadiran",
    });

    redirect(`/admin/pemantauan/${pemantauanId}`);
  }

  return (
    <main>
      <header>
        <h1>Detail Pemantauan</h1>
        <p>
          <Link href="/admin">Dashboard</Link> /{" "}
          <Link href="/admin/pemantauan">Pemantauan Ketidakhadiran</Link> / Detail
        </p>
      </header>

      <section>
        <h2>Informasi Pemantauan</h2>
        <ul>
          <li>ID: {pemantauan.pemantauan_id}</li>
          <li>Siswa: {siswa?.nama || pemantauan.siswa_id}</li>
          <li>NIS: {siswa?.nis || "-"}</li>
          <li>Kelas: {kelas?.nama_kelas || pemantauan.kelas_id}</li>
          <li>Tanggal Mulai: {pemantauan.tanggal_mulai}</li>
          <li>Tanggal Selesai: {pemantauan.tanggal_selesai || "-"}</li>
          <li>Jumlah Alpa Terakhir: {pemantauan.jumlah_alpa_terakhir}</li>
          <li>Status: {pemantauan.status_pemantauan}</li>
        </ul>
      </section>

      {pemantauan.status_pemantauan === "aktif" ? (
        <form action={selesaikanPemantauan}>
          <p>
            <button type="submit">Selesaikan Pemantauan</button>
          </p>
        </form>
      ) : null}

      <section>
        <h2>Riwayat Kontak</h2>
        <ContactHistoryList riwayat={riwayatTerurut} />
      </section>
    </main>
  );
}
