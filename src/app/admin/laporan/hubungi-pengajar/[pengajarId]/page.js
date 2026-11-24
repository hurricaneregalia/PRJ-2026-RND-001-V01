import Link from "next/link";

export const metadata = {
  title: "Hubungi Pengajar",
};

const pesanDefault =
  "Halo Bapak Rudi,\n\n" +
  "Kami ingin informasikan bahwa siswa bernama Andi (NIS: 2026001) kelas Matematika A memiliki status (Alpa) sebanyak 5 kali.\n\n" +
  "Mohon bantuan Bapak untuk memperhatikan kondisi siswa tersebut dan melakukan tindak lanjut agar kehadirannya dalam pembelajaran dapat lebih baik.\n\n" +
  "Terima kasih atas perhatian dan kerja samanya.";

export default function HubungiPengajarPage() {
  return (
    <main>
      <header>
        <h1>Hubungi Pengajar</h1>
        <p>
          <Link href="/admin">Dashboard</Link> / <Link href="/admin/laporan">Laporan</Link> / Hubungi Pengajar
        </p>
      </header>

      <section>
        <h2>Informasi Penerima Pesan</h2>
        <ul>
          <li>Nama Pengajar: Rudi</li>
          <li>Nomor WhatsApp: 081234567890</li>
          <li>Jenis kelamin: Laki-laki</li>
        </ul>
      </section>

      <section>
        <h2>Informasi Siswa</h2>
        <ul>
          <li>Nama Siswa: Andi</li>
          <li>NIS: 2026001</li>
          <li>Kelas: Matematika A</li>
          <li>Jumlah Alpa: 5 kali</li>
          <li>Periode: November 2026</li>
          <li>Jenis kelamin: Laki-laki</li>
        </ul>
      </section>

      <section>
        <h2>Pesan</h2>
        <textarea defaultValue={pesanDefault} rows={10} cols={60} />
      </section>

      <p>
        <a href="https://wa.me/6281234567890?text=Halo%20Bapak%20Rudi" target="_blank" rel="noreferrer">
          Kirim melalui WhatsApp
        </a>
        <Link href="/admin/laporan">Batal</Link>
      </p>
    </main>
  );
}
