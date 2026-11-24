import Link from "next/link";

export const metadata = {
  title: "Detail Kelas",
};

export default function DetailKelasPengajarPage() {
  return (
    <main>
      <header>
        <h1>Detail Kelas</h1>
        <p>
          <Link href="/pengajar">Dashboard</Link> / <Link href="/pengajar/kelas">Kelas Saya</Link> / Detail Kelas
        </p>
      </header>

      <section>
        <h2>Informasi Kelas</h2>
        <ul>
          <li>Nama kelas: Matematika A</li>
          <li>Mata pelajaran: Matematika</li>
          <li>Nama pengajar: Budi</li>
          <li>Jumlah siswa: 15</li>
        </ul>
        <Link href="/pengajar/kelas/3/absensi/tambah">Buat Absensi Baru</Link>
      </section>
      <section>
        <h2>Riwayat Pertemuan</h2>
        <ul>
          <li>Tanggal | Hadir | Izin | Sakit | Alpa | Aksi</li>{" "}
          <li>
            24 November 2026 | 12 | 1 | 1 | 1 | <Link href="/pengajar/kelas/3/absensi/1">Lihat Absensi</Link>
          </li>{" "}
          <li>
            17 November 2026 | 12 | 1 | 1 | 1 | <Link href="/pengajar/kelas/3/absensi/2">Lihat Absensi</Link>
          </li>{" "}
          <li>
            10 November 2026 | 12 | 1 | 1 | 1 | <Link href="/pengajar/kelas/3/absensi/3">Lihat Absensi</Link>
          </li>
        </ul>
      </section>
    </main>
  );
}
