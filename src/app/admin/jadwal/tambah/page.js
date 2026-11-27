import Link from "next/link";
import { redirect } from "next/navigation";

import { connection } from "next/server";

import { auth } from "@/auth";
import { listKelas } from "@/repositories/kelas-repository";
import { listKelasSiswa } from "@/repositories/kelas-siswa-repository";
import EntitySelect from "@/components/ui/entity-select";
import { createJadwal, listJadwal } from "@/repositories/jadwal-repository";
import { HARI } from "@/lib/domain-constants";
import { recordAuditCreate } from "@/repositories/audit-log-repository";

export const instant = false;

export const metadata = {
  title: "Tambah Jadwal",
};

export default async function TambahJadwalPage({ searchParams }) {
  await connection();
  const resolvedSearchParams = await searchParams;
  const kelas = await listKelas();
  const jadwal = await listJadwal();
  const scheduledKelasIds = new Set(jadwal.map((item) => item.kelas_id));
  const availableKelas = kelas.filter((item) => item.status_kelas === "aktif" && !scheduledKelasIds.has(item.kelas_id));
  const activeCountByKelas = new Map();
  (await listKelasSiswa())
    .filter((item) => item.status_keanggotaan === "aktif")
    .forEach((item) => {
      activeCountByKelas.set(item.kelas_id, (activeCountByKelas.get(item.kelas_id) || 0) + 1);
    });
  const selectedKelasId = typeof resolvedSearchParams?.kelas_id === "string" ? resolvedSearchParams.kelas_id : "";
  const selectedKelas = availableKelas.find((item) => item.kelas_id === selectedKelasId) ?? null;

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

  if (availableKelas.length === 0) {
    return (
      <main>
        <header>
          <h1>Semua kelas sudah memiliki jadwal</h1>
          <p>
            <Link href="/admin/kelas/tambah">Buat Kelas Baru</Link>
          </p>
        </header>
      </main>
    );
  }

  return (
    <main>
      <header>
        <h1>Tambah Jadwal</h1>
        <p>Tambahkan jadwal kegiatan belajar untuk kelas aktif.</p>
        <p>
          <Link href="/admin">Dashboard</Link> / <Link href="/admin/jadwal">Manajemen Jadwal</Link> / Tambah Jadwal
        </p>
      </header>

      <form action={simpanJadwal}>
        <section>
          <p>
            <label htmlFor="kelas_id">Kelas (wajib)</label>
            <br />
            <EntitySelect id="kelas_id" name="kelas_id" items={availableKelas} value={selectedKelasId} required placeholder="Pilih kelas aktif" valueKey="kelas_id" formatLabel={(item) => { const active = activeCountByKelas.get(item.kelas_id) || 0; const available = Number(item.kapasitas || 0) - active; return `${item.nama_kelas} Tersedia ${available} Kursi`; }} />
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
