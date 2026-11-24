import Link from 'next/link';

export const metadata = {
  title: 'Laporan Kehadiran Siswa',
};

export default function LaporanKehadiranSiswaPage() {
  return (
    <main>
      <header>
        <h1>Laporan Kehadiran Siswa</h1>
        <p>
          <Link href="/admin">Dashboard</Link> / <Link href="/admin/laporan">Laporan</Link> / Laporan Kehadiran Siswa
        </p>
      </header>

      <section>
        <h2>Filter</h2>
        <ul>
          <li>Rentang tanggal.</li>
          <li>Kelas.</li>
          <li>Status kehadiran.</li>
        </ul>
      </section>

      <section>
        <h2>Ringkasan</h2>
        <ul>
          <li>Total hadir: 180</li>
          <li>Total izin: 12</li>
          <li>Total sakit: 8</li>
          <li>Total alpa: 6</li>
          <li>Persentase kehadiran: 88%</li>
        </ul>
      </section>

      <section>
        <h2>Rekap Kehadiran Siswa</h2>
        <ul>
          <li>No. | NIS | Nama Siswa | Kelas | Total Sesi | Hadir | Izin | Sakit | Alpa | Persentase Kehadiran</li>
          <li>1 | 2026001 | Andi | Matematika A | 8 | 7 | 1 | 0 | 0 | 87.5%</li>
          <li>2 | 2026002 | Citra | Bahasa Inggris A | 6 | 5 | 1 | 0 | 0 | 83.3%</li>
        </ul>
      </section>
    </main>
  );
}