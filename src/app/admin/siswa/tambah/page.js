import Link from "next/link";
import BackButton from "@/components/ui/back-button";

export const metadata = {
  title: "Tambah Siswa",
};

export default function TambahSiswaPage() {
  return (
    <main>
      <header>
        <h1>Tambah Siswa</h1>
        <p>Masukkan informasi siswa baru.</p>
        <p>
          <Link href="/admin">Dashboard</Link> / <Link href="/admin/siswa">Manajemen Siswa</Link> / Tambah Siswa
        </p>
      </header>

      <form>
        <section>
          <h2>Data Siswa</h2>

          <p>
            <label htmlFor="nis">NIS (wajib dan unik)</label>
            <input id="nis" name="nis" type="text" required />
          </p>
          <p>
            <label htmlFor="nama">Nama lengkap (wajib)</label>
            <input id="nama" name="nama" type="text" required />
          </p>
          <p>
            <label htmlFor="jenis-kelamin">Jenis kelamin</label>
            <select id="jenis-kelamin" name="jenis-kelamin" required>
              <option value="">Pilih</option>
              <option value="laki-laki">Laki-laki</option>
              <option value="perempuan">Perempuan</option>
            </select>
          </p>
          <p>
            <label htmlFor="tempat-lahir">Tempat lahir (opsional)</label>
            <input id="tempat-lahir" name="tempat-lahir" type="text" />
          </p>
          <p>
            <label htmlFor="tanggal-lahir">Tanggal lahir (opsional)</label>
            <input id="tanggal-lahir" name="tanggal-lahir" type="date" />
          </p>
          <p>
            <label htmlFor="nomor-hp">Nomor HP (opsional)</label>
            <input id="nomor-hp" name="nomor-hp" type="tel" />
          </p>
          <p>
            <label htmlFor="alamat">Alamat (opsional)</label>
            <textarea id="alamat" name="alamat" />
          </p>
        </section>

        <section>
          <h2>Data Pendaftaran</h2>
          <p>
            <label htmlFor="kelas">Kelas</label>
            <select id="kelas" name="kelas">
              <option value="">Pilih kelas</option>
              <option value="matematika-a">Matematika A</option>
              <option value="bahasa-inggris-b">Bahasa Inggris B</option>
            </select>
          </p>
          <p>
            <label htmlFor="tanggal-pendaftaran">Tanggal pendaftaran</label>
            <input id="tanggal-pendaftaran" name="tanggal-pendaftaran" type="date" />
          </p>
          <p>
            <label htmlFor="status">Status siswa</label>
            <select id="status" name="status">
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Nonaktif</option>
            </select>
          </p>
        </section>

        <section>
          <h2>Informasi Orang Tua (MVP)</h2>
          <p>
            <label htmlFor="nama-ortu">Nama orang tua</label>
            <input id="nama-ortu" name="nama-ortu" type="text" />
          </p>
          <p>
            <label htmlFor="hp-ortu">Nomor HP orang tua</label>
            <input id="hp-ortu" name="hp-ortu" type="tel" />
          </p>
          <p>Untuk kebutuhan pengembangan berikutnya. Untuk MVP, bagian ini boleh disediakan sebagai informasi tambahan tanpa membuat akun orang tua.</p>
        </section>

        <section>
          <h2>Validasi</h2>
          <ul>
            <li>NIS wajib diisi dan tidak boleh duplikat.</li>
            <li>Nama lengkap wajib diisi.</li>
            <li>Jenis kelamin wajib dipilih.</li>
            <li>Kelas wajib dipilih jika pendaftaran langsung memasukkan siswa ke kelas.</li>
            <li>Tanggal lahir tidak boleh melebihi tanggal saat ini.</li>
            <li>Tampilkan notifikasi ketika penyimpanan berhasil atau gagal.</li>
          </ul>
        </section>

        <p>
          <button type="submit">Simpan Siswa</button>
          <BackButton btnText="Batal" />
        </p>
      </form>
    </main>
  );
}
