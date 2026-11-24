import Link from "next/link";

export const metadata = {
  title: "Detail Absensi",
};

export default function DetailAbsensiPage() {
  return (
    <main>
      <header>
        <h1>Detail Absensi</h1>
        <p>
          <Link href="/admin">Dashboard</Link> / <Link href="/admin/absensi">Absensi</Link> / Detail Absensi
        </p>
      </header>

      <section>
        <h2>Informasi Utama</h2>
        <ul>
          <li>Kelas: Matematika 7A</li>
          <li>Mata Pelajaran: Matematika</li>
          <li>Pengajar: Budi Santoso</li>
          <li>Hari: Senin</li>
          <li>Tanggal: 23 November 2026</li>
          <li>Waktu: 15.30–17.00</li>
          <li>Ruangan: Ruang 2</li>
          <li>Status Absensi: Sudah Dicatat</li>
        </ul>
      </section>

      <section>
        <h2>Statistik</h2>
        <ul>
          <li>Total siswa: 20</li>
          <li>Hadir: 16</li>
          <li>Izin: 2</li>
          <li>Sakit: 1</li>
          <li>Alpa: 1</li>
        </ul>
      </section>

      <section>
        <h2>Daftar Siswa</h2>
        <ul>
          <li>No. | NIS | Nama Siswa | Status | Waktu Dicatat | Keterangan</li>
          <li>1 | 2026001 | Andi | Hadir | 15.35 | -</li>
          <li>2 | 2026002 | Citra | Izin | 15.36 | Izin keluarga</li>
          <li>3 | 2026003 | Dina | Sakit | 15.37 | Demam</li>
          <li>4 | 2026004 | Rudi | Alpa | 15.38 | Tanpa keterangan</li>
        </ul>
        <Link href="/admin/absensi/3/edit">Edit</Link>
      </section>

      <section>
        <h2>Informasi Pencatatan</h2>
        <ul>
          <li>Dicatat oleh: Budi Santoso</li>
          <li>Waktu pencatatan: 23 November 2026, 15.40</li>
          <li>Terakhir diperbarui: 23 November 2026, 16.00</li>
          <li>Diperbarui oleh: Admin</li>
        </ul>
      </section>
    </main>
  );
}
