import Link from "next/link";
import { redirect } from "next/navigation";

import { connection } from "next/server";

import { auth } from "@/auth";
import { createSiswa } from "@/repositories/siswa-repository";
import { createKelasSiswa } from "@/repositories/kelas-siswa-repository";
import { listKelas } from "@/repositories/kelas-repository";
import EntitySelect from "@/components/ui/entity-select";
import { listKelasSiswa } from "@/repositories/kelas-siswa-repository";
import ClassCapacityLabel from "@/components/ui/class-capacity-label";
import { recordAuditCreate } from "@/repositories/audit-log-repository";
import { todayDate } from "@/lib/date-time";

export const instant = false;

export const metadata = {
  title: "Tambah Siswa",
};

export default async function TambahSiswaPage() {
  await connection();
  const kelas = await listKelas();
  const memberships = await listKelasSiswa();
  const activeCountByKelas = new Map();

  memberships
    .filter((item) => item.status_keanggotaan === "aktif")
    .forEach((item) => {
      activeCountByKelas.set(item.kelas_id, (activeCountByKelas.get(item.kelas_id) || 0) + 1);
    });

  const availableKelas = kelas.filter((item) => {
    if (item.status_kelas !== "aktif") {
      return false;
    }

    const active = activeCountByKelas.get(item.kelas_id) || 0;
    return active < Number(item.kapasitas || 0);
  });

  async function simpanSiswa(formData) {
    "use server";

    const session = await auth();
    const created = await createSiswa({
      nama: formData.get("nama"),
      nis: formData.get("nis"),
      jenis_kelamin: formData.get("jenis_kelamin"),
      tanggal_lahir: formData.get("tanggal_lahir") || "",
      alamat: formData.get("alamat") || "",
      no_hp: formData.get("no_hp") || "",
      status: formData.get("status") || "aktif",
    });

    await recordAuditCreate({
      tableName: "siswa",
      recordId: created.siswa_id,
      userId: session?.user?.id || "",
      after: created,
      note: "Penambahan siswa dari halaman admin",
    });

    const kelasId = formData.get("kelas_id");

    if (kelasId) {
      const membership = await createKelasSiswa({
        kelas_id: kelasId,
        siswa_id: created.siswa_id,
        tanggal_mulai: todayDate(),
        status_keanggotaan: "aktif",
      });

      await recordAuditCreate({
        tableName: "kelas_siswa",
        recordId: membership.kelas_siswa_id,
        userId: session?.user?.id || "",
        after: membership,
        note: "Penambahan keanggotaan kelas saat siswa dibuat",
      });
    }

    redirect("/admin/siswa");
  }

  return (
    <main>
      <header>
        <h1>Tambah Siswa</h1>
        <p>Masukkan informasi siswa baru.</p>
        <p>
          <Link href="/admin">Dashboard</Link> / <Link href="/admin/siswa">Manajemen Siswa</Link> / Tambah Siswa
        </p>
      </header>

      <form action={simpanSiswa}>
        <section>
          <h2>Data Siswa</h2>
          <p>
            <label htmlFor="nama">Nama lengkap (wajib)</label>
            <br />
            <input id="nama" name="nama" type="text" required />
          </p>
          <p>
            <label htmlFor="nis">NIS (wajib dan unik)</label>
            <br />
            <input id="nis" name="nis" type="text" required />
          </p>
          <p>
            <label htmlFor="jenis_kelamin">Jenis Kelamin</label>
            <br />
            <select id="jenis_kelamin" name="jenis_kelamin" required>
              <option value="">Pilih</option>
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </select>
          </p>
          <p>
            <label htmlFor="tanggal_lahir">Tanggal Lahir</label>
            <br />
            <input id="tanggal_lahir" name="tanggal_lahir" type="date" />
          </p>
          <p>
            <label htmlFor="alamat">Alamat</label>
            <br />
            <textarea id="alamat" name="alamat" />
          </p>
          <p>
            <label htmlFor="no_hp">Nomor HP</label>
            <br />
            <input id="no_hp" name="no_hp" type="tel" />
          </p>
          <p>
            <label htmlFor="status">Status Siswa</label>
            <br />
            <select id="status" name="status" defaultValue="aktif">
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Nonaktif</option>
            </select>
          </p>
        </section>

        <section>
          <h2>Kelas</h2>
          <p>
            <label htmlFor="kelas_id">Kelas (wajib)</label>
            <br />
            <EntitySelect
              id="kelas_id"
              name="kelas_id"
              items={availableKelas}
              required
              placeholder="Pilih kelas"
              valueKey="kelas_id"
              formatLabel={(item) => {
                const active = activeCountByKelas.get(item.kelas_id) || 0;
                const available = Number(item.kapasitas || 0) - active;
                return `${item.nama_kelas} Tersedia ${available} Kursi`;
              }}
            />
          </p>
        </section>

        <p>
          <button type="submit">Simpan Siswa</button>
        </p>
      </form>
    </main>
  );
}
