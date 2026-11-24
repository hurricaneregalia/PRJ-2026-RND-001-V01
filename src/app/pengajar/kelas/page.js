import Link from "next/link";

export const metadata = {
  title: "Kelas Saya",
};

export default function KelasSayaPage() {
  return (
    <main>
      <header>
        <h1>Kelas Saya</h1>
        <p>
          <Link href="/pengajar">Dashboard</Link> / Kelas Saya
        </p>
      </header>
      <section>
        <h2>Daftar Kelas</h2>
        <ul>
          <li>No | Nama Kelas | Mata Pelajaran | Jadwal Rutin | Jumlah Siswa | Aksi</li>
          <li>
            1 | Matematika A | Matematika | Senin 08.00–09.30 | 15 |{" "}
            <Link href="/pengajar/kelas/3">Lihat Kelas</Link>
          </li>
          <li>
            2 | Bahasa Inggris A | Bahasa Inggris | Senin 10.00–11.30 | 12 |{" "}
            <Link href="/pengajar/kelas/2">Lihat Kelas</Link>
          </li>
        </ul>
      </section>
    </main>
  );
}