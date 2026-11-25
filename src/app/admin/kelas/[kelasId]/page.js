import Link from "next/link";

import { connection } from "next/server";

import { getKelasById } from "@/repositories/kelas-repository";
import { getUserById } from "@/repositories/user-repository";
import { listKelasSiswaByKelasId } from "@/repositories/kelas-siswa-repository";
import { listSiswa } from "@/repositories/siswa-repository";
import ClassCapacityLabel from "@/components/ui/class-capacity-label";

export const instant = false;

export const metadata = {
  title: "Detail Kelas",
};

export default async function DetailKelasPage({ params }) {
  await connection();
  const { kelasId } = await params;
  const kelas = await getKelasById(kelasId);

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

  const pengajar = await getUserById(kelas.pengajar_id);
  const memberships = await listKelasSiswaByKelasId(kelas.kelas_id);
  const activeMemberships = memberships.filter((item) => item.status_keanggotaan === "aktif");
  const siswa = await listSiswa();
  const siswaById = new Map(siswa.map((item) => [item.siswa_id, item]));

  const jumlahSiswa = activeMemberships.length;
  const jumlahLakiLaki = activeMemberships.filter((item) => siswaById.get(item.siswa_id)?.jenis_kelamin === "L").length;
  const jumlahPerempuan = activeMemberships.filter((item) => siswaById.get(item.siswa_id)?.jenis_kelamin === "P").length;

  return (
    <main>
      <header>
        <h1>Detail Kelas</h1>
        <p>
          <Link href="/admin">Dashboard</Link> / <Link href="/admin/kelas">Manajemen Kelas</Link> / Detail
        </p>
      </header>

      <section>
        <h2>Kelas {kelas.nama_kelas}</h2>
        <ul>
          <li>Kode Kelas: {kelas.kode_kelas}</li>
          <li>Pengajar: {pengajar?.name || kelas.pengajar_id}</li>
          <li>
            <ClassCapacityLabel
              namaKelas={kelas.nama_kelas}
              terisi={activeMemberships.length}
              kapasitas={kelas.kapasitas}
            />
          </li>
          <li>Status: {kelas.status_kelas}</li>
        </ul>
        <p>
          <Link href={`/admin/kelas/${kelas.kelas_id}/edit`}>Edit</Link> | <Link href={`/admin/kelas/${kelas.kelas_id}/pindah-kelas`}>Pindah Kelas</Link>
        </p>
      </section>

      <section>
        <h2>Daftar Siswa</h2>
        {activeMemberships.length === 0 ? (
          <p>Belum ada siswa aktif di kelas ini.</p>
        ) : (
          <ol>
            {activeMemberships.map((item) => {
              const siswaItem = siswaById.get(item.siswa_id);

              return (
                <li key={item.kelas_siswa_id}>
                  {siswaItem?.nis || "-"} | <Link href={`/admin/siswa/${item.siswa_id}`}>{siswaItem?.nama || item.siswa_id}</Link> | Jenis Kelamin: {siswaItem?.jenis_kelamin || "-"} | Mulai:{" "}
                  {item.tanggal_mulai}
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <section>
        <h2>Ringkasan</h2>
        <ul>
          <li>Jumlah Siswa: {jumlahSiswa}</li>
          <li>Laki-laki: {jumlahLakiLaki}</li>
          <li>Perempuan: {jumlahPerempuan}</li>
        </ul>
      </section>
    </main>
  );
}
