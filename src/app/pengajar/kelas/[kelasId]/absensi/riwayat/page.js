import Link from "next/link";

export const metadata = {
  title: "Riwayat Absensi",
};

export default function RiwayatAbsensiPage() {
  return (
    <main>
      <header>
        <h1>Riwayat Absensi</h1>
        <p>
          <Link href="/pengajar">Dashboard</Link> / <Link href="/pengajar/kelas">Kelas Saya</Link> / <Link href="/pengajar/kelas/3">Detail Kelas</Link> / Riwayat Absensi
        </p>
      </header>

      <section>
        <h2>Informasi Kelas</h2>
        <ul>
          <li>Nama kelas: Matematika A</li>
          <li>Nama pengajar: Budi</li>
        </ul>
      </section>

      <section>
        <h2>Riwayat Absensi</h2>
        <ul>
          <li>Tanggal | Hadir | Izin | Sakit | Alpa | Aksi</li>
          <li>
            24 Nov 2026 | 12 | 1 | 1 | 1 | <Link href="/pengajar/kelas/3/absensi/1">Detail</Link>
          </li>
          <li>
            17 Nov 2026 | 13 | 1 | 0 | 1 | <Link href="/pengajar/kelas/3/absensi/2">Detail</Link>
          </li>
          <li>
            10 Nov 2026 | 11 | 2 | 1 | 1 | <Link href="/pengajar/kelas/3/absensi/3">Detail</Link>
          </li>
        </ul>
      </section>
    </main>
  );
}