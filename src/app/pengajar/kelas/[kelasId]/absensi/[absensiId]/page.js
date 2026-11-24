import Link from "next/link";

export const metadata = {
  title: "Detail Absensi",
};

export default function DetailAbsensiPengajarKelasPage() {
  return (
    <main>
      <header>
        <h1>Detail Absensi</h1>
        <p>
          <Link href="/pengajar">Dashboard</Link> / <Link href="/pengajar/kelas">Kelas Saya</Link> / <Link href="/pengajar/kelas/3">Detail Kelas</Link> / Detail Absensi
        </p>
      </header>

      <section>
        <h2>Informasi Pertemuan</h2>
        <ul>
          <li>Tanggal pertemuan: 24 November 2026</li>
          <li>Ruangan: Ruang 1</li>
          <li>Status pertemuan: Selesai</li>
        </ul>
      </section>

      <section>
        <h2>Ringkasan Kehadiran</h2>
        <ul>
          <li>Hadir: 12</li>
          <li>Izin: 1</li>
          <li>Sakit: 1</li>
          <li>Alpa: 1</li>
        </ul>
      </section>

      <section>
        <h2>Daftar Siswa</h2>
        <ul>
          <li>No. | Nama Siswa | Status Kehadiran </li>
          <li>1 | Andi | Hadir </li>
          <li>2 | Citra | Izin </li>
          <li>3 | Dina | Sakit </li>
          <li>4 | Rudi | Alpa </li>
        </ul>
      </section>

      <section>
        <h2>Catatan Pengajar</h2>
        <p>Materi yang dibahas: aljabar dasar.</p>
      </section>

      <p>
        <Link href="/pengajar/kelas/3/absensi/3/edit">Edit Absensi</Link>
      </p>
    </main>
  );
}
