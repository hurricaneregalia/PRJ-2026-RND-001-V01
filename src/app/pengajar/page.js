import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Dashboard Pengajar",
};

export default function DashboardPengajarPage() {
  return (
    <main>
      <header>
        <h1>Dashboard Pengajar</h1>
        <p>Selamat datang, Budi</p>
        <p>Hari ini: Senin, 24 November 2026</p>
        <Image src="https://i.pravatar.cc/150?img=12" alt="Foto profil" width={150} height={150} />
        <p>Budi</p>
      </header>

      <section>
        <h2>Kelas</h2>
        <ul>
          <li>No | Kelas | Pelajaran | Waktu | Siswa | Aksi</li>
          <li>
            1 | Matematika A | Matematika | Selasa 10.00–11.30 |15 | <Link href="/pengajar/kelas">Lihat Kelas</Link>
          </li>
          <li>
            2 | Bahasa Inggris A | Bahasa Inggris | Senin 10.00–11.30 | 12 | <Link href="/pengajar/kelas">Lihat Kelas</Link>
          </li>
        </ul>
      </section>

      <section>
        <h2>Siswa</h2>
        <ul>
          <li>No | Nama | Kelas | Hadir | Izin | Sakit | Alpa </li>
          <li>1. | Andi | Bahasa Inggris A | 8 | 1 | 0 | 1</li>
          <li>2. | Citra | Matematika A | 7 | 2 | 1 | 0</li>
          <li>3. | Dina | Bahasa Inggris A | 6 | 1 | 2 | 1</li>
          <li>4. | Rudi | Matematika A | 5 | 1 | 0 | 4</li>
        </ul>
      </section>

      <nav>
        <ul>
          <li>
            <Link href="/pengajar/absensi">Absensi Lengkap</Link>
          </li>
          <li>
            <Link href="/pengajar/laporan">Laporan</Link>
          </li>
          <li>
            <Link href="/pengajar/profil">Profil</Link>
          </li>
          <li>
            <Link href="/login">Keluar</Link>
          </li>
        </ul>
      </nav>
    </main>
  );
}
