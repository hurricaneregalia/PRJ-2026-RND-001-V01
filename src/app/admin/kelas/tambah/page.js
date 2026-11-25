import Link from "next/link";
import { redirect } from "next/navigation";

import { connection } from "next/server";

import { createKelas } from "@/repositories/kelas-repository";
import { listKelas } from "@/repositories/kelas-repository";
import { listUsers } from "@/repositories/user-repository";

export const instant = false;

export const metadata = {
  title: "Tambah Kelas",
};

export default async function TambahKelasPage() {
  await connection();
  const users = await listUsers();
  const kelas = await listKelas();
  const activeCountByTeacher = new Map();
  kelas
    .filter((item) => item.status_kelas === "aktif")
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
    return limit > 0 && active < limit;
  });

  async function simpanKelas(formData) {
    "use server";

    await createKelas({
      kode_kelas: formData.get("kode_kelas"),
      nama_kelas: formData.get("nama_kelas"),
      pengajar_id: formData.get("pengajar_id"),
      kapasitas: Number(formData.get("kapasitas") || 0),
      status_kelas: formData.get("status_kelas") || "aktif",
    });

    redirect("/admin/kelas");
  }

  return (
    <main>
      <header>
        <h1>Tambah Kelas</h1>
        <p>Masukkan informasi kelas baru.</p>
        <p>
          <Link href="/admin">Dashboard</Link> /{" "}
          <Link href="/admin/kelas">Manajemen Kelas</Link> / Tambah Kelas
        </p>
      </header>

      <form action={simpanKelas}>
        <section>
          <p>
            <label htmlFor="kode_kelas">Kode Kelas (wajib)</label>
            <br />
            <input id="kode_kelas" name="kode_kelas" type="text" required />
          </p>
          <p>
            <label htmlFor="nama_kelas">Nama Kelas (wajib)</label>
            <br />
            <input id="nama_kelas" name="nama_kelas" type="text" required />
          </p>
          <p>
            <label htmlFor="pengajar_id">Pengajar (wajib)</label>
            <br />
            <select id="pengajar_id" name="pengajar_id" required>
              <option value="">Pilih pengajar</option>
              {availableTeachers.map((teacher) => {
                const active = activeCountByTeacher.get(teacher.user_id) || 0;
                const limit = Number(teacher.limit_kelas || 0);
                return (
                  <option key={teacher.user_id} value={teacher.user_id}>
                    {teacher.name} ({active}/{limit})
                  </option>
                );
              })}
            </select>
          </p>
          <p>
            <label htmlFor="kapasitas">
              Kapasitas Siswa (jumlah maksimum siswa dalam kelas)
            </label>
            <br />
            <input id="kapasitas" name="kapasitas" type="number" min="0" />
          </p>
          <p>
            <label htmlFor="status_kelas">Status Kelas</label>
            <br />
            <select id="status_kelas" name="status_kelas" defaultValue="aktif">
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Nonaktif</option>
            </select>
          </p>
        </section>

        <p>
          <button type="submit">Simpan Kelas</button>
        </p>
      </form>
    </main>
  );
}
