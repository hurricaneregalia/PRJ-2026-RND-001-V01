import Link from 'next/link';

export const metadata = {
  title: 'Laporan Aktivitas Kelas',
};

export default function LaporanAktivitasKelasPage() {
  return (
    <main>
      <header>
        <h1>Laporan Aktivitas Kelas</h1>
        <p>
          <Link href="/admin">Dashboard</Link> / <Link href="/admin/laporan">Laporan</Link> / Laporan Aktivitas Kelas
        </p>
      </header>

      <section>
        <h2>Filter</h2>
        <ul>
          <li>Rentang tanggal.</li>
          <li>Kelas.</li>
          <li>Pengajar.</li>
        </ul>
      </section>

      <section>
        <h2>Ringkasan</h2>
        <ul>
          <li>Total kelas aktif: 8</li>
          <li>Total sesi pembelajaran: 24</li>
          <li>Total sesi yang sudah memiliki absensi: 20</li>
          <li>Total sesi yang belum memiliki absensi: 4</li>
        </ul>
      </section>

      <section>
        <h2>Rekap Aktivitas Kelas</h2>
        <ul>
          <li>No. | Nama Kelas | Mata Pelajaran | Pengajar | Jumlah Siswa | Total Jadwal | Sesi Terlaksana | Sesi Belum Terlaksana</li>
          <li>1 | Matematika A | Matematika | Budi | 15 | 8 | 7 | 1</li>
          <li>2 | Bahasa Inggris A | Bahasa Inggris | Sinta | 12 | 6 | 5 | 1</li>
        </ul>
      </section>
    </main>
  );
}