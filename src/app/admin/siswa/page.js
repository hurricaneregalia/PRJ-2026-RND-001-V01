import Link from 'next/link';

export const metadata = {
  title: 'Data Siswa',
};

export default function DaftarSiswaPage() {
  return (
    <main>
      <header>
        <h1>Data Siswa</h1>
        <p>Kelola informasi dan data siswa bimbingan belajar.</p>
        <p><Link href="/admin/siswa/tambah">+ Tambah Siswa</Link></p>
      </header>

      <section>
        <h2>Ringkasan</h2>
        <ul>
          <li>Total Siswa: 120</li>
          <li>Siswa Aktif: 110</li>
          <li>Siswa Nonaktif: 10</li>
        </ul>
      </section>

      <section>
        <h2>Pencarian dan Filter</h2>
        <ul>
          <li>Pencarian berdasarkan nama atau nomor induk.</li>
          <li>Filter status siswa (Aktif / Nonaktif).</li>
          <li>Filter kelas.</li>
        </ul>
      </section>

      <section>
        <h2>Tabel Data Siswa</h2>
        <ul>
          <li>No. | Nama | NIS | Jenis Kelamin | Kelas | Status | Aksi</li>
          <li>1 | Andi | 2026001 | Laki-laki | Matematika A | Aktif | <Link href="/admin/siswa/detail">Detail</Link> | <Link href="/admin/siswa/edit">Edit</Link> | Hapus</li>
          <li>2 | Citra | 2026002 | Perempuan | Bahasa Inggris B | Aktif | <Link href="/admin/siswa/detail">Detail</Link> | <Link href="/admin/siswa/edit">Edit</Link> | Hapus</li>
        </ul>
      </section>

      <section>
        <h2>Aksi</h2>
        <ul>
          <li>Detail: Melihat informasi lengkap siswa.</li>
          <li>Edit: Mengubah informasi siswa.</li>
          <li>Hapus / Nonaktifkan: Menghapus atau menonaktifkan data siswa.</li>
        </ul>
      </section>

      <section>
        <h2>Detail Siswa</h2>
        <ul>
          <li>Foto profil.</li>
          <li>NIS.</li>
          <li>Nama lengkap.</li>
          <li>Jenis kelamin.</li>
          <li>Tanggal lahir.</li>
          <li>Alamat.</li>
          <li>Nomor HP.</li>
          <li>Kelas yang diikuti.</li>
          <li>Tanggal pendaftaran.</li>
          <li>Riwayat absensi.</li>
        </ul>
      </section>

      <section>
        <h2>Akses Cepat</h2>
        <ul>
          <li><Link href="/admin/siswa/tambah">Tambah Siswa</Link></li>
          <li><Link href="/admin/laporan">Lihat Laporan Absensi</Link></li>
          <li><Link href="/admin/kelas">Kelola Kelas</Link></li>
        </ul>
      </section>
    </main>
  );
}