import Image from 'next/image';
import Link from 'next/link';

export const metadata = {
  title: 'Tambah Pengajar',
};

export default function TambahPengajarPage() {
  return (
    <main>
      <header>
        <h1>Tambah Pengajar</h1>
        <p>Tambahkan pengajar baru ke dalam sistem.</p>
        <p>
          <Link href="/admin">Dashboard</Link> / <Link href="/admin/pengajar">Manajemen Pengajar</Link> / Tambah Pengajar
        </p>
      </header>

      <form>
        <section>
          <h2>Data Pengajar</h2>
          <Image src="https://i.pravatar.cc/150?img=12" alt="Foto profil" width={150} height={150} />
          <p>
            <label htmlFor="nama">Nama lengkap (wajib)</label>
            <input id="nama" name="nama" type="text" required />
          </p>
          <p>
            <label htmlFor="email">Email (wajib dan unik)</label>
            <input id="email" name="email" type="email" required />
          </p>
          <p>
            <label htmlFor="nomor-hp">Nomor HP (wajib)</label>
            <input id="nomor-hp" name="nomor-hp" type="tel" required />
          </p>
          <p>
            <label htmlFor="foto">Foto profil (opsional)</label>
            <input id="foto" name="foto" type="file" />
          </p>
        </section>

        <section>
          <h2>Data Akun</h2>
          <p>
            <label htmlFor="username">Username (opsional, jika login menggunakan username)</label>
            <input id="username" name="username" type="text" />
          </p>
          <p>
            <label htmlFor="password">Password (wajib)</label>
            <input id="password" name="password" type="password" required minLength={8} />
          </p>
          <p>
            <label htmlFor="konfirmasi-password">Konfirmasi password (wajib)</label>
            <input id="konfirmasi-password" name="konfirmasi-password" type="password" required minLength={8} />
          </p>
          <fieldset>
            <legend>Status Akun</legend>
            <p>
              <input id="aktif" name="status" type="radio" value="aktif" defaultChecked />
              <label htmlFor="aktif">Aktif (default)</label>
            </p>
            <p>
              <input id="nonaktif" name="status" type="radio" value="nonaktif" />
              <label htmlFor="nonaktif">Nonaktif</label>
            </p>
          </fieldset>
          <p>Saran: Untuk akun baru, gunakan status Aktif secara default.</p>
        </section>

        <section>
          <h2>Validasi</h2>
          <ul>
            <li>Nama tidak boleh kosong.</li>
            <li>Email harus memiliki format valid dan belum digunakan.</li>
            <li>Nomor HP harus memiliki format valid.</li>
            <li>Password minimal 8 karakter.</li>
            <li>Konfirmasi password harus sama.</li>
          </ul>
          <p>Tampilkan pesan kesalahan jika penyimpanan gagal.</p>
          <p>Tampilkan notifikasi jika berhasil.</p>
        </section>

        <p>
          <button type="submit">Simpan Pengajar</button>
          <Link href="/admin/pengajar">Batal</Link>
        </p>
      </form>
    </main>
  );
}