import Link from 'next/link';
import BackButton from '@/components/ui/back-button';

export const metadata = {
  title: 'Tambah Kelas',
};

export default function TambahKelasPage() {
  return (
    <main>
      <header>
        <h1>Tambah Kelas</h1>
        <p>Buat kelas bimbingan belajar baru.</p>
        <p>
          <Link href="/admin">Dashboard</Link> / <Link href="/admin/kelas">Manajemen Kelas</Link> / Tambah Kelas
        </p>
      </header>

      <form>
        <section>
          <h2>Data Kelas</h2>
          <p>
            <label htmlFor="kode-kelas">Kode kelas (wajib dan unik)</label>
            <input id="kode-kelas" name="kode-kelas" type="text" required />
          </p>
          <p>
            <label htmlFor="nama-kelas">Nama kelas (wajib)</label>
            <input id="nama-kelas" name="nama-kelas" type="text" required />
          </p>
          <p>
            <label htmlFor="mata-pelajaran">Mata pelajaran (wajib)</label>
            <input id="mata-pelajaran" name="mata-pelajaran" type="text" required />
          </p>
          <p>
            <label htmlFor="deskripsi">Deskripsi kelas (opsional)</label>
            <textarea id="deskripsi" name="deskripsi" />
          </p>
          <p>
            <label htmlFor="status-kelas">Status kelas</label>
            <select id="status-kelas" name="status-kelas">
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Nonaktif</option>
            </select>
          </p>
        </section>

        <section>
          <h2>Pengajar</h2>
          <p>
            <label htmlFor="pengajar">Pilih pengajar (wajib)</label>
            <select id="pengajar" name="pengajar" required>
              <option value="">Pilih pengajar aktif</option>
              <option value="budi">Budi</option>
              <option value="siti">Siti</option>
            </select>
          </p>
          <p>Hanya tampilkan pengajar dengan status akun Aktif. Satu kelas memiliki satu pengajar utama.</p>
        </section>

        <section>
          <h2>Pemilihan Siswa</h2>
          <p>Pilih siswa dari daftar siswa aktif.</p>
          <p>Mendukung pemilihan beberapa siswa sekaligus.</p>
          <p>Pencarian berdasarkan nama atau NIS.</p>
          <p>Tampilkan daftar siswa yang sudah dipilih.</p>
          <p>Tampilkan jumlah siswa terpilih.</p>
        </section>

        <section>
          <h2>Jadwal (Opsional)</h2>
          <p>Untuk MVP, jadwal bisa dikelola melalui halaman Manajemen Jadwal secara terpisah.</p>
          <p>Jika ingin langsung membuat jadwal dari halaman ini, sediakan:</p>
          <ul>
            <li>Hari.</li>
            <li>Jam mulai.</li>
            <li>Jam selesai.</li>
          </ul>
          <p>Saya lebih menyarankan pengelolaan jadwal secara terpisah agar tidak terjadi duplikasi data.</p>
        </section>

        <section>
          <h2>Validasi</h2>
          <ul>
            <li>Kode kelas wajib diisi dan unik.</li>
            <li>Nama kelas wajib diisi.</li>
            <li>Mata pelajaran wajib dipilih.</li>
            <li>Pengajar wajib dipilih.</li>
            <li>Pengajar harus berstatus aktif.</li>
            <li>Siswa yang dipilih harus berstatus aktif.</li>
            <li>Jam selesai harus lebih besar daripada jam mulai jika jadwal ditambahkan.</li>
          </ul>
        </section>

        <p>
          <button type="submit">Simpan Kelas</button>
          <BackButton btnText="Batal" />
        </p>
      </form>
    </main>
  );
}