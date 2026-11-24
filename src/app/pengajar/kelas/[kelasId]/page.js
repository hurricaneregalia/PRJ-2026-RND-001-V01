import Link from "next/link";

export const metadata = {
  title: "Detail Kelas",
};

export const instant = false;

const kelasData = {
  "2": {
    nama: "Bahasa Inggris A",
    mataPelajaran: "Bahasa Inggris",
    pengajar: "Budi",
    jumlahSiswa: 12,
    jadwalRutin: "Senin 10.00–11.30",
    ruangan: "Ruang 2",
    status: "Aktif",
    siswa: [
      { no: 1, nama: "Andi", hadir: 8, izin: 1, sakit: 0, alpa: 1 },
      { no: 2, nama: "Dina", hadir: 6, izin: 1, sakit: 2, alpa: 1 },
    ],
  },
  "3": {
    nama: "Matematika A",
    mataPelajaran: "Matematika",
    pengajar: "Budi",
    jumlahSiswa: 15,
    jadwalRutin: "Senin 08.00–09.30",
    ruangan: "Ruang 1",
    status: "Aktif",
    siswa: [
      { no: 1, nama: "Andi", hadir: 8, izin: 1, sakit: 0, alpa: 1 },
      { no: 2, nama: "Citra", hadir: 7, izin: 2, sakit: 1, alpa: 0 },
      { no: 3, nama: "Dina", hadir: 6, izin: 1, sakit: 2, alpa: 1 },
      { no: 4, nama: "Rudi", hadir: 5, izin: 1, sakit: 0, alpa: 4 },
    ],
  },
};

export default async function DetailKelasPengajarPage({ params }) {
  const { kelasId } = await params;
  const kelas = kelasData[kelasId] ?? kelasData["3"];

  return (
    <main>
      <header>
        <h1>Detail Kelas</h1>
        <p>
          <Link href="/pengajar">Dashboard</Link> / <Link href="/pengajar/kelas">Kelas Saya</Link> / Detail Kelas
        </p>
      </header>
      <section>
        <h2>Informasi Detail Kelas</h2>
        <ul>
          <li>Nama kelas: {kelas.nama}</li>
          <li>Mata pelajaran: {kelas.mataPelajaran}</li>
          <li>Nama pengajar: {kelas.pengajar}</li>
          <li>Jumlah siswa: {kelas.jumlahSiswa}</li>
          <li>Jadwal rutin: {kelas.jadwalRutin}</li>
          <li>Ruangan belajar: {kelas.ruangan}</li>
          <li>Status kelas: {kelas.status}</li>
        </ul>
      </section>
      <section>
        <h2>Daftar Siswa</h2>
        <ul>
          <li>No | Nama | Hadir | Izin | Sakit | Alpa </li>
          {kelas.siswa.map((s) => (
            <li key={s.no}>
              {s.no}. | {s.nama} | {s.hadir} | {s.izin} | {s.sakit} | {s.alpa}
            </li>
          ))}
        </ul>
      </section>
      <p>
        <Link href={`/pengajar/kelas/${kelasId}/absensi/riwayat`}>Riwayat Absensi</Link>
      </p>
      <p>
        <Link href={`/pengajar/kelas/${kelasId}/absensi/tambah`}>Buat Absensi</Link>
      </p>
    </main>
  );
}