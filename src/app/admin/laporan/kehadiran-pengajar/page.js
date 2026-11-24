import Link from 'next/link';

export const metadata = {
  title: 'Laporan Kehadiran Pengajar',
};

export default function LaporanKehadiranPengajarPage() {
  return (
    <main>
      <header>
        <h1>Laporan Kehadiran Pengajar</h1>
        <p>
          <Link href="/admin">Dashboard</Link> / <Link href="/admin/laporan">Laporan</Link> / Laporan Kehadiran Pengajar
        </p>
      </header>

      <section>
        <h2>Filter</h2>
        <ul>
          <li>Rentang tanggal.</li>
          <li>Pengajar.</li>
        </ul>
      </section>

      <section>
        <h2>Ringkasan</h2>
        <ul>
          <li>Total pengajar: 12</li>
          <li>Total jadwal mengajar: 8</li>
          <li>Total sesi terlaksana: 20</li>
          <li>Total sesi belum terlaksana: 4</li>
        </ul>
      </section>

      <section>
        <h2>Rekap Aktivitas Pengajar</h2>
        <ul>
          <li>No. | Pengajar | Total Jadwal | Sesi Terlaksana | Sesi Belum Terlaksana</li>
          <li>1 | Budi | 3 | 6 | 1</li>
          <li>2 | Sinta | 2 | 4 | 1</li>
        </ul>
      </section>

      <p>Catatan: Jangan menyimpulkan kehadiran pengajar hanya berdasarkan absensi siswa. Data laporan ini membutuhkan pencatatan kehadiran atau pelaksanaan sesi pengajar.</p>
    </main>
  );
}