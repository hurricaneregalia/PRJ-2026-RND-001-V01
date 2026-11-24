// src/app/admin/kelas/detail/page.js

import Link from "next/link";

export const metadata = {
  title: "Detail Kelas",
};

export default function DetailKelasPage() {
  return (
    <main>
      <header>
        <h1>Detail Kelas</h1>
        <p>Informasi lengkap dan pengelolaan kelas.</p>
        <Link href="/admin">Dashboard</Link> / <Link href="/admin/kelas">Manajemen Kelas</Link> / Detail Kelas
      </header>

      <section>
        <h2>Informasi Kelas</h2>

        <ul>
          <li>Kode kelas: KLS-001</li>
          <li>Nama kelas: Matematika A</li>
          <li>Mata pelajaran: Matematika</li>
          <li>Deskripsi: Kelas bimbingan matematika dasar.</li>
          <li>Nama pengajar: Budi</li>
          <li>Jumlah siswa: 15</li>
          <li>Jadwal Kelas: Senin, 08:00 - 09:30</li>
        </ul>
      </section>
      <section>
        <h2>Daftar Siswa Terdaftar</h2>

        <p>Daftar siswa yang saat ini menjadi anggota kelas ini.</p>

        <button type="button">Keluarkan Siswa Terpilih</button>
        <Link href="/admin/kelas/3/tambah-siswa">Tambah Siswa ke Kelas</Link>

        <ul>
          <li>
            {" "}
            <input type="checkbox" />
            No. | Kode Kelas | Nama{" "}
          </li>
          <li>
            {" "}
            <input type="checkbox" /> 1 | SW-001 | Andi
          </li>
          <li>
            {" "}
            <input type="checkbox" /> 2 | SW-002 | Citra
          </li>
          <li>
            {" "}
            <input type="checkbox" /> 3 | SW-003 | Dina
          </li>
        </ul>
      </section>

      <section>
        <h2>Riwayat Absensi</h2>
        <ul>
          <li>Nama | Jadwal | Status </li>
          <li>Andi | Senin, 2 November 2026 | Hadir</li>
          <li>Citra | Senin, 9 November 2026 | Izin</li>
        </ul>
      </section>
    </main>
  );
}
