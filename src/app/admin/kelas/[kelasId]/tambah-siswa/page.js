import Link from "next/link";

export const metadata = {
  title: "Tambah Siswa ke Kelas",
};

export default function TambahSiswaKelasPage() {
  const kelas = {
    kode: "KLS-001",
    nama: "Matematika A",
    mataPelajaran: "Matematika",
    pengajar: "Budi",
    jumlahSiswa: 15,
  };

  const siswa = [
    { id: 1, nis: "SW-004", nama: "Dinda", jenisKelamin: "Perempuan" },
    { id: 2, nis: "SW-005", nama: "Rudi", jenisKelamin: "Laki-laki" },
    { id: 3, nis: "SW-006", nama: "Sinta", jenisKelamin: "Perempuan" },
    { id: 4, nis: "SW-007", nama: "Andi", jenisKelamin: "Laki-laki" },
    { id: 5, nis: "SW-008", nama: "Rina", jenisKelamin: "Perempuan" },
  ];

  return (
    <main>
      <header>
        <h1>Tambah Siswa ke Kelas Matematika A</h1>
        <p>Pengajar: Bapak Budi</p>
        <Link href="/admin">Dashboard</Link> / <Link href="/admin/kelas/2">Detail Kelas</Link> / Tambah Siswa
      </header>

      <section>
        <h2>Daftar Siswa Tersedia</h2>

        <p>Pilih siswa aktif yang akan ditambahkan ke kelas ini.</p>

        <div>
          <input type="search" placeholder="Cari nama atau NIS siswa..." />
        </div>

        <p>5 siswa tersedia</p>

        <ul>
          <li>
            {" "}
            <input type="checkbox" /> No. | NIS | Jenis Kelamin{" "}
          </li>
          {siswa.map((item, index) => (
            <li key={item.id}>
              <input type="checkbox" /> {index + 1} | {item.nis} | {item.nama} | {item.jenisKelamin} |
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Ringkasan Siswa Terpilih</h2>

        <p>Belum ada siswa yang dipilih.</p>
        <p>Total siswa dipilih: 0</p>
      </section>

      <footer>
        <Link href="/admin/kelas/1">Batal</Link>

        <button type="button" disabled>
          Tambahkan Siswa (0)
        </button>
      </footer>
    </main>
  );
}
