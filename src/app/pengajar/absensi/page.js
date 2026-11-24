import Link from "next/link";

export const metadata = {
  title: "Absensi",
};

export default function AbsensiPengajarPage() {
  return (
    <main>
      <header>
        <h1>Absensi</h1>
        <p>
          <Link href="/pengajar">Dashboard</Link> / Absensi
        </p>
      </header>
      <section>
        <h2>Hitungan Absensi Siswa</h2>
        <ul>
          <li>No | Nama | Kelas | Hadir | Izin | Sakit | Alpa </li>
          <li>1. | Andi | Bahasa Inggris A | 8 | 1 | 0 | 1</li>
          <li>2. | Citra | Matematika A | 7 | 2 | 1 | 0</li>
          <li>3. | Dina | Bahasa Inggris A | 6 | 1 | 2 | 1</li>
          <li>4. | Rudi | Matematika A | 5 | 1 | 0 | 4</li>
        </ul>
      </section>
      <section>
        <h2>Daftar Sesi Absensi</h2>
        <ul>
          <li>Tanggal | Kelas| Siswa| Hadir | Izin | Sakit | Alpa | Aksi</li>{" "}
          <li>
            03 Des 2026 | Bahasa Inggris A | 12 | 10 | 1 | 0 | 1 | <Link href="/pengajar/kelas/3/absensi/2">Detail</Link>
          </li>
          <li>
            02 Des 2026 | Matematika A | 15 | 12 | 1 | 1 | 1 | <Link href="/pengajar/kelas/3/absensi/1">Detail</Link>
          </li>
          <li>
            01 Des 2026 | Bahasa Inggris A | 12 | 10 | 1 | 0 | 1 | <Link href="/pengajar/kelas/3/absensi/2">Detail</Link>
          </li>
          <li>
            30 Nov 2026 | Matematika A | 15 | 12 | 1 | 1 | 1 | <Link href="/pengajar/kelas/3/absensi/1">Detail</Link>
          </li>
          <li>
            29 Nov 2026 | Bahasa Inggris A | 12 | 10 | 1 | 0 | 1 | <Link href="/pengajar/kelas/3/absensi/2">Detail</Link>
          </li>
          <li>
            28 Nov 2026 | Matematika A | 15 | 12 | 1 | 1 | 1 | <Link href="/pengajar/kelas/3/absensi/1">Detail</Link>
          </li>
          <li>
            27 Nov 2026 | Bahasa Inggris A | 12 | 10 | 1 | 0 | 1 | <Link href="/pengajar/kelas/3/absensi/2">Detail</Link>
          </li>
          <li>
            26 Nov 2026 | Matematika A | 15 | 12 | 1 | 1 | 1 | <Link href="/pengajar/kelas/3/absensi/1">Detail</Link>
          </li>
          <li>
            25 Nov 2026 | Bahasa Inggris A | 12 | 10 | 1 | 0 | 1 | <Link href="/pengajar/kelas/3/absensi/2">Detail</Link>
          </li>
          <li>
            24 Nov 2026 | Matematika A | 15 | 12 | 1 | 1 | 1 | <Link href="/pengajar/kelas/3/absensi/1">Detail</Link>
          </li>{" "}
        </ul>
      </section>
    </main>
  );
}
