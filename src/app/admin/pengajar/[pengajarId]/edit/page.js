import Link from 'next/link';

export const metadata = {
  title: 'Edit Pengajar',
};

export default function EditPengajarPage() {
  return (
    <main>
      <header>
        <h1>Edit Pengajar</h1>
        <p>
          <Link href="/admin">Dashboard</Link> / <Link href="/admin/pengajar">Manajemen Pengajar</Link> / Edit Pengajar
        </p>
      </header>

      <form>
        <section>
          <h2>Informasi Pribadi</h2>
          <p>Semua field otomatis terisi dengan data pengajar sebelumnya.</p>
          <p>
            <label htmlFor="nama">Nama lengkap</label>
            <input id="nama" name="nama" type="text" defaultValue="Budi" />
          </p>
          <p>
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" defaultValue="budi@email.com" />
          </p>
          <p>
            <label htmlFor="nomor-hp">Nomor HP</label>
            <input id="nomor-hp" name="nomor-hp" type="tel" defaultValue="08123456789" />
          </p>
          <p>
            <label htmlFor="foto">Foto profil</label>
            <input id="foto" name="foto" type="file" />
          </p>
        </section>

        <section>
          <h2>Informasi Akun</h2>
          <p>
            <label htmlFor="username">Username (jika digunakan)</label>
            <input id="username" name="username" type="text" defaultValue="budi" />
          </p>
          <p>
            <label htmlFor="password-baru">Password baru (opsional)</label>
            <input id="password-baru" name="password-baru" type="password" />
          </p>
          <p>
            <label htmlFor="konfirmasi-password-baru">Konfirmasi password baru (opsional)</label>
            <input id="konfirmasi-password-baru" name="konfirmasi-password-baru" type="password" />
          </p>
          <p>Password dikosongkan secara default. Jika tidak diubah, password lama tetap berlaku.</p>
        </section>

        <section>
          <h2>Status Akun</h2>
          <p>
            <input id="aktif" name="status" type="radio" value="aktif" defaultChecked />
            <label htmlFor="aktif">Aktif</label>
          </p>
          <p>
            <input id="nonaktif" name="status" type="radio" value="nonaktif" />
            <label htmlFor="nonaktif">Nonaktif</label>
          </p>
        </section>

        <section>
          <h2>Informasi Tambahan (Read Only)</h2>
          <ul>
            <li>Tanggal akun dibuat: 01 Januari 2026</li>
            <li>Terakhir diperbarui: 23 November 2026</li>
            <li>Jumlah kelas yang diajar: 3</li>
          </ul>
        </section>

        <p>
          <button type="submit">Simpan Perubahan</button>
          <Link href="/admin/pengajar">Batal</Link>
        </p>
      </form>
    </main>
  );
}