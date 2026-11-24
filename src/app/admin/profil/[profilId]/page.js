import Link from "next/link";

export const metadata = {
  title: "Lihat Profil",
};

export default function LihatProfilPage() {
  return (
    <main>
      <header>
        <h1>Lihat Profil</h1>
      </header>

      <section>
        <h2>Informasi Identitas Admin</h2>
        <ul>
          <li>Foto Profil: foto</li>
          <li>Nama Lengkap: Admin</li>
          <li>Email: admin@email.com</li>
          <li>Nomor HP: 081234567890</li>
          <li>Jabatan: Administrator</li>
          <li>Tanggal Bergabung: 01 Januari 2026</li>
        </ul>
        <p>
          <Link href="/admin/profil/2/edit">Edit</Link>
        </p>
      </section>

      <section>
        <h2>Informasi Tambahan</h2>
        <ul>
          <li>Role: Admin</li>
          <li>Status Akun: Aktif</li>
          <li>Terakhir Login: 24 November 2026, 10.00</li>
          <li>Tanggal Akun Dibuat: 01 Januari 2026</li>
          <li>Terakhir Diperbarui: 24 November 2026</li>
        </ul>
      </section>
    </main>
  );
}
