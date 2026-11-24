import Link from 'next/link';

export const metadata = {
  title: 'Data Absensi',
};

export default function DaftarAbsensiPage() {
  return (
    <main>
      <header>
        <h1>Data Absensi</h1>
        <p>Kelola dan pantau catatan kehadiran siswa.</p>
        <p><Link href="/admin/laporan">Rekap Absensi</Link></p>
      </header>

      <section>
        <h2>Statistik Utama</h2>
        <ul>
          <li>Total Siswa: 15</li>
          <li>Hadir: 12</li>
          <li>Izin: 1</li>
          <li>Sakit: 1</li>
          <li>Alpa: 1</li>
        </ul>
      </section>

      <section>
        <h2>Filter</h2>
        <ul>
          <li>Tanggal atau rentang tanggal.</li>
          <li>Kelas.</li>
          <li>Pengajar.</li>
          <li>Hari.</li>
          <li>Status kehadiran (Hadir, Izin, Sakit, Alpa).</li>
        </ul>
      </section>

      <section>
        <h2>Daftar Absensi</h2>
        <ul>
          <li>No. | Kelas | Tanggal | Jam | Pengajar | Jumlah Siswa | Hadir | Izin | Sakit | Alpa | Aksi</li>
          <li>1 | Matematika A | 24 Nov 2026 | 08.00–09.30 | Budi | 15 | 12 | 1 | 1 | 1 | <Link href="/admin/absensi/1">Detail absensi</Link></li>
          <li>2 | Bahasa Inggris A | 25 Nov 2026 | 10.00–11.30 | Sinta | 12 | 10 | 1 | 0 | 1 | <Link href="/admin/absensi/2">Detail absensi</Link></li>
        </ul>
      </section>

      <section>
        <h2>Detail Sesi Absensi</h2>
        <ul>
          <li>Informasi kelas dan pengajar.</li>
          <li>Tanggal dan waktu pertemuan.</li>
          <li>Daftar seluruh siswa dalam kelas.</li>
          <li>Status kehadiran masing-masing siswa.</li>
          <li>Catatan atau keterangan absensi.</li>
          <li>Waktu pencatatan.</li>
          <li>Nama pengajar yang mencatat absensi.</li>
        </ul>
      </section>
    </main>
  );
}