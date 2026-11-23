export const metadata = {
  title: 'Detail Pengajar',
};

export default function DetailPengajarPage() {
  return (
    <main>
      <header>
        <h1>Detail Pengajar</h1>
      </header>
      <section>
        <h2>Informasi Profil</h2>
        <ul>
          <li>Nama: Budi</li>
          <li>Email: budi@email.com</li>
          <li>No. HP: 08123456789</li>
          <li>Status: Aktif</li>
        </ul>
      </section>
      <section>
        <h2>Daftar Kelas yang Diajar</h2>
        <ul>
          <li>Matematika A</li>
          <li>Matematika B</li>
        </ul>
      </section>
      <section>
        <h2>Jadwal Mengajar</h2>
        <ul>
          <li>Senin 08:00 - 09:30 | Matematika A</li>
        </ul>
      </section>
      <section>
        <h2>Ringkasan Absensi Kelas yang Diajar</h2>
        <ul>
          <li>Hadir: 87%</li>
          <li>Izin: 5%</li>
          <li>Sakit: 4%</li>
          <li>Alfa: 4%</li>
        </ul>
      </section>
    </main>
  );
}