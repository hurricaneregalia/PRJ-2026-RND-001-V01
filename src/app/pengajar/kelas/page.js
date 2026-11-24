import Link from "next/link";

export const metadata = {
  title: "Kelas Saya",
};

export default function KelasSayaPage() {
  return (
    <main>
      <header>
        <h1>Kelas Saya</h1>
        <p>
          <Link href="/pengajar">Dashboard</Link> / Kelas Saya
        </p>
      </header>
      <section>
        <h2>Informasi Detail Kelas</h2>
        <ul>
          <li>Nama kelas: Matematika A</li>
          <li>Mata pelajaran: Matematika</li>
          <li>Nama pengajar: Budi</li>
          <li>Jumlah siswa: 15</li>
          <li>Jadwal rutin: Senin 08.00–09.30</li>
          <li>Ruangan belajar: Ruang 1</li>
          <li>Status kelas: Aktif</li>
        </ul>
      </section>
      <section>
        <h2>Daftar Siswa</h2>
        <ul>
          <li>No | Nama | Hadir | Izin | Sakit | Alpa </li>
          <li>1. | Andi | 8 | 1 | 0 | 1</li>
          <li>2. | Citra | 7 | 2 | 1 | 0</li>
          <li>3. | Dina | 6 | 1 | 2 | 1</li>
          <li>4. | Rudi | 5 | 1 | 0 | 4</li>
        </ul>
      </section>
      <p>
        <Link href="/pengajar/kelas/3/absensi/riwayat">Riwayat Absensi</Link>
      </p>
      <p>
        <Link href="/pengajar/kelas/3/absensi/tambah">Buat Absensi</Link>
      </p>
    </main>
  );
}
