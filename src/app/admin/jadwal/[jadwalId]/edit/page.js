import Link from 'next/link';

export const metadata = {
  title: 'Edit Jadwal',
};

export default function EditJadwalPage() {
  return (
    <main>
      <header>
        <h1>Edit Jadwal</h1>
        <p>
          <Link href="/admin">Dashboard</Link> / <Link href="/admin/jadwal">Manajemen Jadwal</Link> / Edit Jadwal
        </p>
      </header>

      <form>
        <section>
          <h2>Form Jadwal</h2>
          <p>
            <label htmlFor="kelas">Kelas</label>
            <select id="kelas" name="kelas" defaultValue="matematika-a">
              <option value="matematika-a">Matematika A</option>
              <option value="bahasa-inggris-b">Bahasa Inggris B</option>
            </select>
          </p>
          <p>
            <label htmlFor="mata-pelajaran">Mata pelajaran</label>
            <input id="mata-pelajaran" name="mata-pelajaran" type="text" defaultValue="Matematika" />
          </p>
          <p>
            <label htmlFor="pengajar">Pengajar</label>
            <input id="pengajar" name="pengajar" type="text" defaultValue="Budi" />
          </p>
          <p>
            <label htmlFor="hari">Hari</label>
            <select id="hari" name="hari" defaultValue="senin">
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
            <label htmlFor="jam-mulai">Jam mulai</label>
            <input id="jam-mulai" name="jam-mulai" type="time" defaultValue="08:00" />
          </p>
          <p>
            <label htmlFor="jam-selesai">Jam selesai</label>
            <input id="jam-selesai" name="jam-selesai" type="time" defaultValue="09:30" />
          </p>
          <p>
            <label htmlFor="tanggal-mulai">Tanggal mulai berlaku</label>
            <input id="tanggal-mulai" name="tanggal-mulai" type="date" defaultValue="2026-01-01" />
          </p>
          <p>
            <label htmlFor="tanggal-selesai">Tanggal akhir (opsional)</label>
            <input id="tanggal-selesai" name="tanggal-selesai" type="date" />
          </p>
          <p>
            <label htmlFor="ruangan">Ruangan (opsional)</label>
            <input id="ruangan" name="ruangan" type="text" defaultValue="Ruang 1" />
          </p>
          <p>
            <label htmlFor="status">Status jadwal</label>
            <select id="status" name="status" defaultValue="aktif">
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Tidak Aktif</option>
            </select>
          </p>
          <p>Kelas, mata pelajaran, dan pengajar sebaiknya saling konsisten. Jika kelas sudah memiliki pengajar dan mata pelajaran utama, keduanya bisa ditampilkan otomatis dari data kelas.</p>
        </section>

        <p>
          <button type="submit">Simpan Perubahan</button>
          <Link href="/admin/jadwal">Batal</Link>
        </p>
      </form>
    </main>
  );
}