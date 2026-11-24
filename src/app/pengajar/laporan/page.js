import Link from 'next/link';

export const metadata = {
  title: 'Laporan',
};

export default function LaporanPengajarPage() {
  return (
    <main>
      <header>
        <h1>Laporan</h1>
        <p>
          <Link href="/pengajar">Dashboard</Link> / Laporan
        </p>
      </header>
      <section>
        <h2>Ringkasan</h2>
        <ul>
          <li>Total sesi: 8</li>
          <li>Total hadir: 100</li>
          <li>Total izin: 8</li>
          <li>Total sakit: 4</li>
          <li>Total alpa: 2</li>
          <li>Persentase kehadiran: 89%</li>
        </ul>
      </section>
    </main>
  );
}