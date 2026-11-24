import Link from "next/link";

export const metadata = {
  title: "Laporan",
};

export default function LaporanPage() {
  return (
    <main>
      <header>
        <h1>Laporan</h1>
        <p>Rekapitulasi dan pemantauan aktivitas pembelajaran.</p>
        <p>
          <Link href="/admin">Dashboard</Link> / Laporan
        </p>
      </header>

      <section>
        <h2>Ringkasan Statistik</h2>
        <ul>
          <li>Total siswa aktif: 120</li>
          <li>Total pengajar aktif: 12</li>
          <li>Total kelas aktif: 8</li>
          <li>Total sesi pembelajaran: 24</li>
        </ul>
      </section>

      <section>
        <h2>Ringkasan Kehadiran</h2>
        <ul>
          <li>Total hadir: 180</li>
          <li>Total izin: 12</li>
          <li>Total sakit: 8</li>
          <li>Total alpa: 6</li>
        </ul>
      </section>

      <section>
        <h2>Siswa Alpa Terbanyak</h2>
        <ul>
          <li>No. | Nama Siswa | NIS | Nama Kelas | Alpa | Ditangani | Nama Guru | Aksi</li>
          <li>
            1 | Andi | 2026001 | Matematika A | 5 | Sudah | Rudi | <Link href="/admin/laporan/hubungi-pengajar/3">Hubungi guru</Link>
          </li>
          <li>
            2 | Citra | 2026002 | Bahasa Inggris A | 4 | Belum | Andy | <Link href="/admin/laporan/hubungi-pengajar/3">Hubungi guru</Link>
          </li>
          <li>
            3 | Dina | 2026003 | Matematika A | 3 | Belum | Gofar | <Link href="/admin/laporan/hubungi-pengajar/3">Hubungi guru</Link>
          </li>
          <li>
            4 | Rudi | 2026004 | Bahasa Inggris A | 3 | Sudah | Lala | <Link href="/admin/laporan/hubungi-pengajar/3">Hubungi guru</Link>
          </li>
        </ul>
      </section>

      <section>
        <h2>Navigasi Laporan</h2>
        <ul>
          <li>
            <Link href="/admin/laporan/kehadiran-siswa">Laporan Kehadiran Siswa</Link>
          </li>
          <li>
            <Link href="/admin/laporan/kehadiran-pengajar">Laporan Kehadiran Pengajar</Link>
          </li>
          <li>
            <Link href="/admin/laporan/aktivitas-kelas">Laporan Aktivitas Kelas</Link>
          </li>
          <li>
            <Link href="/admin/laporan/rekap-pembelajaran">Laporan Rekap Pembelajaran</Link>
          </li>
        </ul>
      </section>
    </main>
  );
}
