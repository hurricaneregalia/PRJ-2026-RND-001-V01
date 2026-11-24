import Link from "next/link";

export const metadata = {
  title: "Data Pengajar",
};

export default function DaftarPengajarPage() {
  return (
    <main>
      <header>
        <h1>Data Pengajar</h1>
        <p>
          <Link href="/admin">Dashboard</Link> / <Link href="/admin/pengajar">Manajemen Pengajar</Link>
        </p>
        <p>Kelola informasi dan akun pengajar.</p>
        <p>
          <Link href="/admin/pengajar/tambah">+ Tambah Pengajar</Link>
        </p>
      </header>

      <section>
        <h2>Statistik Pengajar</h2>
        <ul>
          <li>Total Pengajar: 12</li>
          <li>Pengajar Aktif: 10</li>
          <li>Pengajar Nonaktif: 2</li>
        </ul>
      </section>

      <section>
        <h2>Pencarian dan Filter</h2>
        <ul>
          <li>Pencarian berdasarkan nama atau email.</li>
          <li>Filter status akun (Aktif / Nonaktif).</li>
        </ul>
      </section>

      <section>
        <h2>Tabel Data Pengajar</h2>
        <ul>
          <li>No. | Nama | Email | Kelas | Status | Aksi</li>
          <li>
            1 | Budi | budi@email.com | 3 | Aktif | <Link href="/admin/pengajar/3">Detail</Link> | <Link href="/admin/pengajar/3/edit">Edit</Link> | Hapus
          </li>
          <li>
            2 | Siti | siti@email.com | 2 | Aktif | <Link href="/admin/pengajar/3">Detail</Link> | <Link href="/admin/pengajar/3/edit">Edit</Link> | Hapus
          </li>
        </ul>
      </section>

      <section>
        <h2>Tambah Pengajar</h2>
        <ul>
          <li>Nama lengkap.</li>
          <li>Email.</li>
          <li>Nomor HP.</li>
          <li>Password awal.</li>
          <li>Foto profil (opsional).</li>
          <li>Status akun.</li>
        </ul>
      </section>

      <section>
        <h2>Edit Pengajar</h2>
        <ul>
          <li>Nama lengkap.</li>
          <li>Email.</li>
          <li>Nomor HP.</li>
          <li>Foto profil.</li>
          <li>Status akun.</li>
          <li>Password memiliki fitur reset tersendiri.</li>
        </ul>
      </section>

      <section>
        <h2>Detail Pengajar</h2>
        <ul>
          <li>Informasi profil.</li>
          <li>Status akun.</li>
          <li>Daftar kelas yang diajar.</li>
          <li>Jadwal mengajar.</li>
          <li>Ringkasan absensi kelas yang diajar.</li>
        </ul>
      </section>
    </main>
  );
}
