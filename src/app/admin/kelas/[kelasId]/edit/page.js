import Link from "next/link";
import { redirect } from "next/navigation";

import { connection } from "next/server";

import { getKelasById, listKelas, updateKelas } from "@/repositories/kelas-repository";
import { listUsers } from "@/repositories/user-repository";

export const instant = false;

export const metadata = {
  title: "Edit Kelas",
};

export default async function EditKelasPage({ params }) {
  await connection();
  const { kelasId } = await params;
  const kelas = await getKelasById(kelasId);
  const users = await listUsers();
  const allKelas = await listKelas();
  const activeCountByTeacher = new Map();
  allKelas
    .filter((item) => item.status_kelas === "aktif" && item.kelas_id !== kelasId)
    .forEach((item) => {
      activeCountByTeacher.set(
        item.pengajar_id,
        (activeCountByTeacher.get(item.pengajar_id) || 0) + 1,
      );
    });
  const availableTeachers = users.filter((user) => {
    if (user.role !== "Pengajar") {
      return false;
    }

    const limit = Number(user.limit_kelas || 0);
    const active = activeCountByTeacher.get(user.user_id) || 0;
    if (user.user_id === kelas?.pengajar_id) {
      return true;
    }

    return limit > 0 && active < limit;
  });

  if (!kelas) {
    return (
      <main>
        <h1>Kelas tidak ditemukan</h1>
        <p>
          <Link href="/admin/kelas">Kembali ke Manajemen Kelas</Link>
        </p>
      </main>
    );
  }

  async function simpanKelas(formData) {
    "use server";

    await updateKelas(kelasId, {
      kode_kelas: formData.get("kode_kelas"),
      nama_kelas: formData.get("nama_kelas"),
      pengajar_id: formData.get("pengajar_id"),
      kapasitas: Number(formData.get("kapasitas") || 0),
      status_kelas: formData.get("status_kelas"),
    });

    redirect(`/admin/kelas/${kelasId}`);
  }

  return (
    <main>
      <header>
        <h1>Edit Kelas</h1>
        <p>
          <Link href="/admin">Dashboard</Link> /{" "}
          <Link href="/admin/kelas">Manajemen Kelas</Link> / Edit
        </p>
      </header>

      <form action={simpanKelas}>
        <section>
          <p>
            <label htmlFor="kode_kelas">Kode Kelas (wajib)</label>
            <br />
            <input
              id="kode_kelas"
              name="kode_kelas"
              type="text"
              defaultValue={kelas.kode_kelas}
              required
            />
          </p>
          <p>
            <label htmlFor="nama_kelas">Nama Kelas (wajib)</label>
            <br />
            <input
              id="nama_kelas"
              name="nama_kelas"
              type="text"
              defaultValue={kelas.nama_kelas}
              required
            />
          </p>
          <p>
            <label htmlFor="pengajar_id">Pengajar (wajib)</label>
            <br />
            <select
              id="pengajar_id"
              name="pengajar_id"
              defaultValue={kelas.pengajar_id}
              required
            >
              <option value="">Pilih pengajar</option>
              {availableTeachers.map((teacher) => {
                const active = activeCountByTeacher.get(teacher.user_id) || 0;
                const limit = Number(teacher.limit_kelas || 0);
                const displayActive =
                  teacher.user_id === kelas?.pengajar_id ? active + 1 : active;
                return (
                  <option key={teacher.user_id} value={teacher.user_id}>
                    {teacher.name} ({displayActive}/{limit})
                  </option>
                );
              })}
            </select>
          </p>
          <p>
            <label htmlFor="kapasitas">Kapasitas</label>
            <br />
            <input
              id="kapasitas"
              name="kapasitas"
              type="number"
              min="0"
              defaultValue={kelas.kapasitas}
            />
          </p>
          <p>
            <label htmlFor="status_kelas">Status Kelas</label>
            <br />
            <select
              id="status_kelas"
              name="status_kelas"
              defaultValue={kelas.status_kelas}
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
