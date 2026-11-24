import Link from "next/link";

export const metadata = {
  title: "Manajemen Jadwal",
};

export default function DaftarJadwalPage() {
  return (
    <main>
      <header>
        <h1>Manajemen Jadwal</h1>
        <p>Kelola jadwal kegiatan belajar seluruh kelas.</p>
        <p>
          <Link href="/admin/jadwal/tambah">+ Tambah Jadwal</Link>
        </p>
      </header>

      <section>
        <h2>Ringkasan</h2>
        <ul>
          <li>Total jadwal: 8</li>
          <li>Jadwal aktif: 7</li>
          <li>Jadwal tidak aktif: 1</li>
          <li>Jumlah kelas yang memiliki jadwal: 6</li>
        </ul>
      </section>

      <section>
        <h2>Pencarian dan Filter</h2>
        <ul>
          <li>Pencarian berdasarkan nama kelas atau pengajar.</li>
          <li>Filter hari.</li>
          <li>Filter kelas.</li>
          <li>Filter pengajar.</li>
          <li>Filter status jadwal.</li>
        </ul>
      </section>

      <section>
        <h2>Daftar Jadwal</h2>
        <ul>
          <li>No. | Kelas | Pengajar | Hari | Waktu | Ruangan | Status | Aksi</li>
          <li>
            1 | Matematika A | Budi | Senin | 08.00–09.30 | Ruang 1 | Aktif | <Link href="/admin/jadwal/detail">Detail</Link>
          </li>
          <li>
            2 | Bahasa Inggris A | Sinta | Selasa | 10.00–11.30 | Ruang 2 | Aktif | <Link href="/admin/jadwal/detail">Detail</Link>
          </li>
        </ul>
      </section>

      <section>
        <h2>Detail Jadwal</h2>
        <ul>
          <li>Nama dan kode kelas.</li>
          <li>Mata pelajaran.</li>
          <li>Pengajar.</li>
          <li>Hari dan waktu.</li>
          <li>Periode jadwal.</li>
          <li>Ruangan.</li>
          <li>Status jadwal.</li>
          <li>Riwayat perubahan jadwal.</li>
        </ul>
      </section>
    </main>
  );
}
