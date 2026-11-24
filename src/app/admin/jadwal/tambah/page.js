import Link from 'next/link';
import BackButton from '@/components/ui/back-button';

export const metadata = {
  title: 'Tambah Jadwal',
};

export default function TambahJadwalPage() {
  return (
    <main>
      <header>
        <h1>Tambah Jadwal</h1>
        <p>Tambahkan jadwal kegiatan belajar untuk kelas yang tersedia.</p>
        <p>
          <Link href="/admin">Dashboard</Link> / <Link href="/admin/jadwal">Manajemen Jadwal</Link> / Tambah Jadwal
        </p>
      </header>

      <form>
        <section>
          <h2>Data Jadwal</h2>
          <p>
            <label htmlFor="nama-jadwal">Nama Jadwal (opsional)</label>
            <input id="nama-jadwal" name="nama-jadwal" type="text" placeholder="Jadwal Matematika A" />
          </p>
          <p>
            <label htmlFor="kelas">Kelas</label>
            <select id="kelas" name="kelas" required>
              <option value="">Pilih kelas aktif</option>
              <option value="matematika-a">Matematika A</option>
              <option value="bahasa-inggris-b">Bahasa Inggris B</option>
            </select>
          </p>
          <p>
            <label htmlFor="mata-pelajaran">Mata Pelajaran</label>
            <input id="mata-pelajaran" name="mata-pelajaran" type="text" readOnly defaultValue="Matematika" />
          </p>
          <p>
            <label htmlFor="pengajar">Pengajar</label>
            <input id="pengajar" name="pengajar" type="text" readOnly defaultValue="Budi" />
          </p>
          <p>
            <label htmlFor="hari">Hari</label>
            <select id="hari" name="hari" required>
              <option value="">Pilih hari</option>
              <option value="senin">Senin</option>
              <option value="selasa">Selasa</option>
              <option value="rabu">Rabu</option>
              <option value="kamis">Kamis</option>
              <option value="jumat">Jumat</option>
              <option value="sabtu">Sabtu</option>
              <option value="minggu">Minggu</option>
            </select>
          </p>
          <p>
            <label htmlFor="jam-mulai">Jam Mulai</label>
            <input id="jam-mulai" name="jam-mulai" type="time" required />
          </p>
          <p>
            <label htmlFor="jam-selesai">Jam Selesai</label>
            <input id="jam-selesai" name="jam-selesai" type="time" required />
          </p>
          <p>
            <label htmlFor="tanggal-mulai">Tanggal Mulai</label>
            <input id="tanggal-mulai" name="tanggal-mulai" type="date" required />
          </p>
          <p>
            <label htmlFor="tanggal-selesai">Tanggal Selesai (opsional)</label>
            <input id="tanggal-selesai" name="tanggal-selesai" type="date" />
          </p>
          <p>
            <label htmlFor="ruangan">Ruangan (opsional)</label>
            <input id="ruangan" name="ruangan" type="text" />
          </p>
          <p>
            <label htmlFor="status">Status</label>
            <select id="status" name="status">
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Tidak Aktif</option>
            </select>
          </p>
        </section>

        <section>
          <h2>Catatan</h2>
          <ul>
            <li>Kelas sebaiknya dipilih dari daftar kelas aktif.</li>
            <li>Pengajar dan mata pelajaran dapat ditampilkan otomatis berdasarkan kelas.</li>
            <li>Jika kelas hanya memiliki satu pengajar utama, Admin tidak perlu memilih pengajar secara terpisah.</li>
            <li>Tanggal selesai dapat dikosongkan jika jadwal berlaku terus-menerus.</li>
            <li>Ruangan bersifat opsional jika kegiatan dilakukan secara daring atau tidak memiliki ruang tetap.</li>
          </ul>
        </section>

        <section>
          <h2>Ringkasan</h2>
          <ul>
            <li>Kelas dan mata pelajaran.</li>
            <li>Nama pengajar.</li>
            <li>Hari dan waktu.</li>
            <li>Periode jadwal.</li>
            <li>Ruangan.</li>
          </ul>
        </section>

        <p>
          <button type="submit">Simpan Jadwal</button>
          <BackButton btnText="Batal" />
        </p>
      </form>
    </main>
  );
}