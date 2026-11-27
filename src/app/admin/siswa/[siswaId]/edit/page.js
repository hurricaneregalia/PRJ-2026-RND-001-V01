import Link from "next/link";
import { redirect } from "next/navigation";

import { connection } from "next/server";

import { auth } from "@/auth";
import { getSiswaById, updateSiswa } from "@/repositories/siswa-repository";
import {
  createKelasSiswa,
  findActiveKelasSiswaBySiswaId,
  listKelasSiswa,
  closeKelasSiswa,
  updateKelasSiswa,
} from "@/repositories/kelas-siswa-repository";
import { getKelasById, listKelas } from "@/repositories/kelas-repository";
import EntitySelect from "@/components/ui/entity-select";
import ClassCapacityLabel from "@/components/ui/class-capacity-label";
import {
  recordAuditCreate,
  recordAuditUpdate,
} from "@/repositories/audit-log-repository";
import { todayDate } from "@/lib/date-time";

export const instant = false;

export const metadata = {
  title: "Edit Data Siswa",
};

export default async function EditSiswaPage({ params }) {
  await connection();
  const { siswaId } = await params;
  const siswa = await getSiswaById(siswaId);

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

  const membership = await findActiveKelasSiswaBySiswaId(siswaId);
  const currentKelas = membership
    ? await getKelasById(membership.kelas_id)
    : null;
  const kelas = await listKelas();
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

  const availableKelas = kelas.filter((item) => {
    if (item.status_kelas !== "aktif") {
      return false;
    }

    if (item.kelas_id === currentKelas?.kelas_id) {
      return true;
    }

    const active = activeCountByKelas.get(item.kelas_id) || 0;
    return active < Number(item.kapasitas || 0);
  });

  async function simpanSiswa(formData) {
    "use server";

    const session = await auth();
    const before = await getSiswaById(siswaId);
    const after = await updateSiswa(siswaId, {
      nama: formData.get("nama"),
      nis: formData.get("nis"),
      jenis_kelamin: formData.get("jenis_kelamin"),
      tanggal_lahir: formData.get("tanggal_lahir") || "",
      alamat: formData.get("alamat") || "",
      no_hp: formData.get("no_hp") || "",
      status: formData.get("status"),
    });

    await recordAuditUpdate({
      tableName: "siswa",
      recordId: siswaId,
      userId: session?.user?.id || "",
      before,
      after,
      note: "Perubahan siswa dari halaman admin",
    });

    const selectedKelasId = formData.get("kelas_id");
    const activeMembership = await findActiveKelasSiswaBySiswaId(siswaId);

    if (activeMembership?.kelas_id !== selectedKelasId) {
      if (activeMembership) {
        const newMembership = await createKelasSiswa({
          kelas_id: selectedKelasId,
          siswa_id: siswaId,
          tanggal_mulai: todayDate(),
          status_keanggotaan: "pending",
        });

        await closeKelasSiswa(activeMembership.kelas_siswa_id, todayDate());
        await updateKelasSiswa(newMembership.kelas_siswa_id, {
          status_keanggotaan: "aktif",
        });

        await recordAuditCreate({
          tableName: "kelas_siswa",
          recordId: newMembership.kelas_siswa_id,
          userId: session?.user?.id || "",
          after: newMembership,
          note: "Perpindahan kelas saat edit siswa",
        });
      } else {
        const newMembership = await createKelasSiswa({
          kelas_id: selectedKelasId,
          siswa_id: siswaId,
          tanggal_mulai: todayDate(),
          status_keanggotaan: "aktif",
        });

        await recordAuditCreate({
          tableName: "kelas_siswa",
          recordId: newMembership.kelas_siswa_id,
          userId: session?.user?.id || "",
          after: newMembership,
          note: "Penambahan keanggotaan kelas saat edit siswa",
        });
      }
    }

    redirect(`/admin/siswa/${siswaId}`);
  }

  return (
    <main>
      <header>
        <h1>Edit Data Siswa</h1>
        <p>Perbarui informasi siswa.</p>
        <p>
          <Link href="/admin">Dashboard</Link> /{" "}
          <Link href="/admin/siswa">Manajemen Siswa</Link> / Edit Siswa
        </p>
      </header>

      <form action={simpanSiswa}>
        <section>
          <p>
            <label htmlFor="nama">Nama lengkap (wajib)</label>
            <br />
            <input
              id="nama"
              name="nama"
              type="text"
              defaultValue={siswa.nama}
              required
            />
          </p>
          <p>
            <label htmlFor="nis">NIS (wajib)</label>
            <br />
            <input
              id="nis"
              name="nis"
              type="text"
              defaultValue={siswa.nis}
              required
            />
          </p>
          <p>
            <label htmlFor="jenis_kelamin">Jenis Kelamin</label>
            <br />
            <select
              id="jenis_kelamin"
              name="jenis_kelamin"
              defaultValue={siswa.jenis_kelamin}
            >
              <option value="">Pilih</option>
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </select>
          </p>
          <p>
            <label htmlFor="tanggal_lahir">Tanggal Lahir</label>
            <br />
            <input
              id="tanggal_lahir"
              name="tanggal_lahir"
              type="date"
              defaultValue={siswa.tanggal_lahir}
            />
          </p>
          <p>
            <label htmlFor="alamat">Alamat</label>
            <br />
            <textarea id="alamat" name="alamat" defaultValue={siswa.alamat} />
          </p>
          <p>
            <label htmlFor="no_hp">Nomor HP</label>
            <br />
            <input
              id="no_hp"
              name="no_hp"
              type="tel"
              defaultValue={siswa.no_hp}
            />
          </p>
          <p>
            <label htmlFor="status">Status Siswa</label>
            <br />
            <select id="status" name="status" defaultValue={siswa.status}>
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
              value={currentKelas?.kelas_id || ""}
              required
              placeholder="Pilih kelas dengan kapasitas tersedia"
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
          <button type="submit">Simpan Perubahan</button>
        </p>
      </form>
    </main>
  );
}
