export const metadata = {
  title: 'Detail Siswa',
};

export default function DetailSiswaPage() {
  return (
    <main>
      <header>
        <h1>Detail Siswa</h1>
      </header>
      <section>
        <h2>Informasi Siswa</h2>
        <ul>
          <li>Foto profil: foto</li>
          <li>NIS: 2026001</li>
          <li>Nama lengkap: Andi</li>
          <li>Jenis kelamin: Laki-laki</li>
          <li>Tanggal lahir: 01 Januari 2010</li>
          <li>Alamat: Jl. Contoh No. 1</li>
          <li>Nomor HP: 08123456789</li>
          <li>Kelas yang diikuti: Matematika A</li>
          <li>Tanggal pendaftaran: 01 Januari 2026</li>
        </ul>
      </section>
      <section>
        <h2>Riwayat Absensi</h2>
        <ul>
          <li>01 Nov 2026 | Hadir</li>
          <li>02 Nov 2026 | Izin</li>
        </ul>
      </section>
    </main>
  );
}