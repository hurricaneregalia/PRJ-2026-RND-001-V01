import Link from "next/link";

export const metadata = {
  title: "Detail Jadwal",
};

export default function DetailJadwalPage() {
  return (
    <main>
      <header>
        <h1>Detail Jadwal</h1>
      </header>
      <section>
        <h2>Informasi Jadwal</h2>
        <ul>
          <li>Nama dan kode kelas: Matematika A (KLS-001)</li>
          <li>Mata pelajaran: Matematika</li>
          <li>Pengajar: Budi</li>
          <li>Hari dan waktu: Senin, 08.00–09.30</li>
          <li>Periode jadwal: 01 Januari 2026 - 30 Juni 2026</li>
          <li>Ruangan: Ruang 1</li>
          <li>Status jadwal: Aktif</li>
        </ul>
        <div>
          <Link href="/admin/jadwal/3/edit">Edit</Link>
        </div>
      </section>
      <section>
        <h2>Riwayat Perubahan Jadwal</h2>
        <ul>
          <li>24 November 2026 - Jadwal dibuat oleh Admin.</li>
        </ul>
      </section>
    </main>
  );
}
