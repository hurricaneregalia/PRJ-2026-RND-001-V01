import Link from "next/link";

export const metadata = {
  title: "Data Kelas",
};

export default function DaftarKelasPage() {
  return (
    <main>
      <header>
        <h1>Data Kelas</h1>
        <p>Kelola kelas bimbingan belajar.</p>
        <Link href="/admin">Dashboard</Link> / Kelas
        <p>
          <Link href="/admin/kelas/tambah">+ Tambah Kelas</Link>
        </p>
      </header>

      <section>
        <h2>Ringkasan</h2>
        <ul>
          <li>Total Kelas: 8</li>
          <li>Kelas Aktif: 7</li>
          <li>Total Siswa Terdaftar: 120</li>
        </ul>
      </section>

      <section>
        <h2>Pencarian dan Filter</h2>
        <ul>
          <li>Pencarian berdasarkan nama atau kode kelas.</li>
          <li>Filter status (Aktif / Nonaktif).</li>
          <li>Filter pengajar.</li>
        </ul>
      </section>

      <section>
        <h2>Tabel Data Kelas</h2>
        <ul>
          <li>No. | Kode Kelas | Nama Kelas | Pengajar | Jumlah Siswa | Status | Aksi</li>
          <li>
            1 | KLS-001 | Matematika A | Budi | 15 | Aktif | <Link href="/admin/kelas/2">Detail</Link> | <Link href="/admin/kelas/edit">Edit</Link> | Hapus
          </li>
          <li>
            2 | KLS-002 | Bahasa Inggris B | Siti | 12 | Aktif | <Link href="/admin/kelas/2">Detail</Link> | <Link href="/admin/kelas/edit">Edit</Link> | Hapus
          </li>
        </ul>
      </section>

      <section>
        <h2>Detail Kelas</h2>
        <ul>
          <li>Kode dan nama kelas.</li>
          <li>Mata pelajaran.</li>
          <li>Deskripsi kelas.</li>
          <li>Nama pengajar.</li>
          <li>Daftar siswa.</li>
          <li>Jumlah siswa.</li>
          <li>Jadwal kelas.</li>
          <li>Status kelas.</li>
        </ul>
      </section>

      <section>
        <h2>Aksi</h2>
        <ul>
          <li>Detail: Melihat informasi lengkap kelas.</li>
          <li>Edit: Mengubah informasi kelas.</li>
          <li>Hapus: Menghapus kelas jika belum memiliki keterkaitan data penting.</li>
          <li>Nonaktifkan: Menonaktifkan kelas tanpa menghilangkan riwayatnya.</li>
        </ul>
      </section>
    </main>
  );
}
