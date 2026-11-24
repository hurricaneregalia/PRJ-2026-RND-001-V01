import Link from 'next/link';

export const metadata = {
  title: 'Laporan Rekap Pembelajaran',
};

export default function LaporanRekapPembelajaranPage() {
  return (
    <main>
      <header>
        <h1>Laporan Rekap Pembelajaran</h1>
        <p>
          <Link href="/admin">Dashboard</Link> / <Link href="/admin/laporan">Laporan</Link> / Laporan Rekap Pembelajaran
        </p>
      </header>

      <section>
        <h2>Filter</h2>
        <ul>
          <li>Rentang tanggal.</li>
        </ul>
      </section>

      <section>
        <h2>Ringkasan</h2>
        <ul>
          <li>Total kelas aktif: 8</li>
          <li>Total siswa yang mengikuti pembelajaran: 120</li>
          <li>Total pengajar yang mengajar: 12</li>
          <li>Total sesi pembelajaran: 24</li>
          <li>Total catatan absensi: 206</li>
          <li>Rata-rata persentase kehadiran: 88%</li>
        </ul>
      </section>

      <section>
        <h2>Rekap Pembelajaran Berdasarkan Periode</h2>
        <ul>
          <li>No. | Periode | Total Sesi | Total Catatan Absensi | Rata-rata Kehadiran</li>
          <li>1 | 01 Nov 2026 - 30 Nov 2026 | 24 | 206 | 88%</li>
        </ul>
      </section>
    </main>
  );
}