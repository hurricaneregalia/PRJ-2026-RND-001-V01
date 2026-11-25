import Link from "next/link";
import { redirect } from "next/navigation";

import { connection } from "next/server";

import { auth } from "@/auth";
import { listKelas } from "@/repositories/kelas-repository";
import { createJadwal, listJadwal } from "@/repositories/jadwal-repository";
import { HARI } from "@/lib/domain-constants";
import { recordAuditCreate } from "@/repositories/audit-log-repository";

export const instant = false;

export const metadata = {
  title: "Tambah Jadwal",
};

export default async function TambahJadwalPage() {
  await connection();
  const kelas = await listKelas();
  const jadwal = await listJadwal();
  const scheduledKelasIds = new Set(jadwal.map((item) => item.kelas_id));
  const availableKelas = kelas.filter(
    (item) =>
      item.status_kelas === "aktif" &&
      !scheduledKelasIds.has(item.kelas_id),
  );

  async function simpanJadwal(formData) {
    "use server";

    const session = await auth();
    const created = await createJadwal({
      kelas_id: formData.get("kelas_id"),
      hari: formData.get("hari"),
      jam_mulai: formData.get("jam_mulai"),
      jam_selesai: formData.get("jam_selesai"),
      ruangan: formData.get("ruangan"),
      status_jadwal: formData.get("status_jadwal") || "aktif",
    });

    await recordAuditCreate({
      tableName: "jadwal",
      recordId: created.jadwal_id,
      userId: session?.user?.id || "",
      after: created,
      note: "Penambahan jadwal dari halaman admin",
    });

    redirect("/admin/jadwal");
  }

  return (
    <main>
      <header>
        <h1>Tambah Jadwal</h1>
        <p>Tambahkan jadwal kegiatan belajar untuk kelas aktif.</p>
        <p>
          <Link href="/admin">Dashboard</Link> /{" "}
          <Link href="/admin/jadwal">Manajemen Jadwal</Link> / Tambah Jadwal
        </p>
      </header>

      <form action={simpanJadwal}>
        <section>
          <p>
            <label htmlFor="kelas_id">Kelas (wajib)</label>
            <br />
            <select id="kelas_id" name="kelas_id" required>
              <option value="">Pilih kelas aktif</option>
              {availableKelas.map((item) => (
                <option key={item.kelas_id} value={item.kelas_id}>
                  {item.nama_kelas}
                </option>
              ))}
            </select>
          </p>
          <p>
            <label htmlFor="hari">Hari (wajib)</label>
            <br />
            <select id="hari" name="hari" required defaultValue="">
              <option value="">Pilih hari</option>
              {HARI.map((hari) => (
                <option key={hari} value={hari}>
                  {hari}
                </option>
              ))}
            </select>
          </p>
          <p>
            <label htmlFor="jam_mulai">Jam Mulai (wajib)</label>
            <br />
            <input id="jam_mulai" name="jam_mulai" type="time" required />
          </p>
          <p>
            <label htmlFor="jam_selesai">Jam Selesai (wajib)</label>
            <br />
            <input id="jam_selesai" name="jam_selesai" type="time" required />
          </p>
          <p>
            <label htmlFor="ruangan">Ruangan (opsional)</label>
            <br />
            <input id="ruangan" name="ruangan" type="text" />
          </p>
          <p>
            <label htmlFor="status_jadwal">Status</label>
            <br />
            <select id="status_jadwal" name="status_jadwal" defaultValue="aktif">
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Nonaktif</option>
            </select>
          </p>
        </section>

        <p>
          <button type="submit">Simpan Jadwal</button>
        </p>
      </form>
    </main>
  );
}
