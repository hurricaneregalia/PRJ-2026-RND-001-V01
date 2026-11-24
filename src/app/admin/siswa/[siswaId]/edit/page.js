import Link from "next/link";

export const metadata = {
  title: "Edit Data Siswa",
};

export default function EditSiswaPage() {
  return (
    <main>
      <header>
        <h1>Edit Data Siswa</h1>
        <p>Perbarui informasi siswa.</p>
        <p>
          <Link href="/admin">Dashboard</Link> / <Link href="/admin/siswa">Manajemen Siswa</Link> / Edit Siswa
        </p>
      </header>

      <form>
        <section>
          <h2>Data Siswa</h2>
          <p>Semua field otomatis terisi berdasarkan data siswa sebelumnya.</p>

          <p>
            <label htmlFor="nis">NIS (unik)</label>
            <input id="nis" name="nis" type="text" defaultValue="2026001" />
          </p>
          <p>
            <label htmlFor="nama">Nama lengkap</label>
            <input id="nama" name="nama" type="text" defaultValue="Andi" />
          </p>
          <p>
            <label htmlFor="jenis-kelamin">Jenis kelamin</label>
            <select id="jenis-kelamin" name="jenis-kelamin" defaultValue="laki-laki">
              <option value="laki-laki">Laki-laki</option>
              <option value="perempuan">Perempuan</option>
            </select>
          </p>
          <p>
            <label htmlFor="tempat-lahir">Tempat lahir</label>
            <input id="tempat-lahir" name="tempat-lahir" type="text" defaultValue="Jakarta" />
          </p>
          <p>
            <label htmlFor="tanggal-lahir">Tanggal lahir</label>
            <input id="tanggal-lahir" name="tanggal-lahir" type="date" defaultValue="2010-01-01" />
          </p>
          <p>
            <label htmlFor="nomor-hp">Nomor HP</label>
            <input id="nomor-hp" name="nomor-hp" type="tel" defaultValue="08123456789" />
          </p>
          <p>
            <label htmlFor="alamat">Alamat</label>
            <textarea id="alamat" name="alamat" defaultValue="Jl. Contoh No. 1" />
          </p>
        </section>

        <section>
          <h2>Data Pendaftaran</h2>
          <p>
            <label htmlFor="kelas">Kelas yang diikuti</label>
            <select id="kelas" name="kelas" defaultValue="matematika-a">
              <option value="matematika-a">Matematika A</option>
              <option value="bahasa-inggris-b">Bahasa Inggris B</option>
            </select>
          </p>
          <p>
            <label htmlFor="tanggal-pendaftaran">Tanggal pendaftaran</label>
            <input id="tanggal-pendaftaran" name="tanggal-pendaftaran" type="date" defaultValue="2026-01-01" />
          </p>
          <p>
            <label htmlFor="status">Status siswa</label>
            <select id="status" name="status" defaultValue="aktif">
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Nonaktif</option>
            </select>
          </p>
        </section>

        <section>
          <h2>Informasi Orang Tua</h2>
          <p>
            <label htmlFor="nama-ortu">Nama orang tua</label>
            <input id="nama-ortu" name="nama-ortu" type="text" defaultValue="Bapak Andi" />
          </p>
          <p>
            <label htmlFor="hp-ortu">Nomor HP orang tua</label>
            <input id="hp-ortu" name="hp-ortu" type="tel" defaultValue="08111222333" />
          </p>
        </section>

        <section>
          <h2>Validasi</h2>
          <ul>
            <li>NIS tidak boleh kosong atau duplikat dengan siswa lain.</li>
            <li>Nama lengkap wajib diisi.</li>
            <li>Jenis kelamin wajib dipilih.</li>
            <li>Kelas harus berasal dari daftar kelas yang tersedia.</li>
            <li>Tanggal lahir tidak boleh melebihi tanggal saat ini.</li>
            <li>Tampilkan notifikasi berhasil atau gagal.</li>
          </ul>
        </section>

        <p>
          <button type="submit">Simpan Perubahan</button>
          <Link href="/admin/siswa">Batal</Link>
        </p>
      </form>
    </main>
  );
}
