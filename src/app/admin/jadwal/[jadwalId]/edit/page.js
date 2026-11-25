import Link from "next/link";
import { redirect } from "next/navigation";

import { connection } from "next/server";

import { auth } from "@/auth";
import { listKelas } from "@/repositories/kelas-repository";
import { getJadwalById, updateJadwal } from "@/repositories/jadwal-repository";
import { HARI } from "@/lib/domain-constants";
import { recordAuditUpdate } from "@/repositories/audit-log-repository";

export const instant = false;

export const metadata = {
  title: "Edit Jadwal",
};

export default async function EditJadwalPage({ params }) {
  await connection();
  const { jadwalId } = await params;
  const jadwal = await getJadwalById(jadwalId);
  const kelas = await listKelas();

  if (!jadwal) {
    return (
      <main>
        <h1>Jadwal tidak ditemukan</h1>
        <p>
          <Link href="/admin/jadwal">Kembali ke Manajemen Jadwal</Link>
        </p>
      </main>
    );
  }

  async function simpanJadwal(formData) {
    "use server";

    const session = await auth();
    const before = await getJadwalById(jadwalId);
    const after = await updateJadwal(jadwalId, {
      kelas_id: formData.get("kelas_id"),
      hari: formData.get("hari"),
      jam_mulai: formData.get("jam_mulai"),
      jam_selesai: formData.get("jam_selesai"),
      ruangan: formData.get("ruangan"),
      status_jadwal: formData.get("status_jadwal"),
    });

    await recordAuditUpdate({
      tableName: "jadwal",
      recordId: jadwalId,
      userId: session?.user?.id || "",
      before,
      after,
      note: "Perubahan jadwal dari halaman admin",
    });

    redirect("/admin/jadwal");
  }

  return (
    <main>
      <header>
        <h1>Edit Jadwal</h1>
        <p>
          <Link href="/admin">Dashboard</Link> /{" "}
          <Link href="/admin/jadwal">Manajemen Jadwal</Link> / Edit Jadwal
        </p>
      </header>

      <form action={simpanJadwal}>
        <section>
          <p>
            <label htmlFor="kelas_id">Kelas (wajib)</label>
            <br />
            <select
              id="kelas_id"
              name="kelas_id"
              defaultValue={jadwal.kelas_id}
              required
            >
              <option value="">Pilih kelas</option>
              {kelas.map((item) => (
                <option key={item.kelas_id} value={item.kelas_id}>
                  {item.nama_kelas} ({item.kode_kelas})
                </option>
              ))}
            </select>
          </p>
          <p>
            <label htmlFor="hari">Hari (wajib)</label>
            <br />
            <select id="hari" name="hari" defaultValue={jadwal.hari} required>
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
            <input
              id="jam_mulai"
              name="jam_mulai"
              type="time"
              defaultValue={jadwal.jam_mulai}
              required
            />
          </p>
          <p>
            <label htmlFor="jam_selesai">Jam Selesai (wajib)</label>
            <br />
            <input
              id="jam_selesai"
              name="jam_selesai"
              type="time"
              defaultValue={jadwal.jam_selesai}
              required
            />
          </p>
          <p>
            <label htmlFor="ruangan">Ruangan (opsional)</label>
            <br />
            <input
              id="ruangan"
              name="ruangan"
              type="text"
              defaultValue={jadwal.ruangan}
            />
          </p>
          <p>
            <label htmlFor="status_jadwal">Status</label>
            <br />
            <select
              id="status_jadwal"
              name="status_jadwal"
              defaultValue={jadwal.status_jadwal}
            >
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Nonaktif</option>
            </select>
          </p>
        </section>

        <p>
          <button type="submit">Simpan Perubahan</button>
        </p>
      </form>
    </main>
  );
}
