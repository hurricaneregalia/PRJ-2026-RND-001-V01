import Link from "next/link";
import BackButton from "@/components/ui/back-button";

export const metadata = {
  title: "Edit Kelas",
};

export default function EditKelasPage() {
  return (
    <main>
      <header>
        <h1>Edit Kelas</h1>
        <p>Ubah informasi kelas, pengajar, dan daftar siswa.</p>
        <p>
          <Link href="/admin">Dashboard</Link> / <Link href="/admin/kelas">Manajemen Kelas</Link> / Edit Kelas
        </p>
      </header>

      <form>
        <section>
          <h2>Informasi Kelas</h2>
          <p>
            <label htmlFor="kode-kelas">Kode Kelas (wajib, unik)</label>
            <input id="kode-kelas" name="kode-kelas" type="text" defaultValue="KLS-001" />
          </p>
          <p>
            <label htmlFor="nama-kelas">Nama Kelas (wajib)</label>
            <input id="nama-kelas" name="nama-kelas" type="text" defaultValue="Matematika A" />
          </p>
          <p>
            <label htmlFor="mata-pelajaran">Mata Pelajaran (wajib)</label>
            <input id="mata-pelajaran" name="mata-pelajaran" type="text" defaultValue="Matematika" />
          </p>
          <p>
            <label htmlFor="deskripsi">Deskripsi (opsional)</label>
            <textarea id="deskripsi" name="deskripsi" defaultValue="Kelas bimbingan matematika dasar." />
          </p>
          <p>
            <label htmlFor="status-kelas">Status Kelas</label>
            <select id="status-kelas" name="status-kelas" defaultValue="aktif">
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Tidak Aktif</option>
            </select>
          </p>
        </section>

        <section>
          <h2>Informasi Pengajar</h2>
          <p>
            <label htmlFor="pengajar">Pilih Pengajar</label>
            <select id="pengajar" name="pengajar" defaultValue="budi">
              <option value="budi">Budi (aktif)</option>
              <option value="siti">Siti (aktif)</option>
            </select>
          </p>
          <p>Tampilkan pengajar yang saat ini ditugaskan. Pilihan hanya dari akun pengajar yang aktif.</p>
        </section>

        <section>
          <h2>Daftar Siswa</h2>
          <p>Kolom pencarian berdasarkan nama atau NIS.</p>
          <p>Daftar siswa yang tersedia.</p>
          <p>Pilihan beberapa siswa sekaligus.</p>
          <p>Daftar siswa yang sudah terdaftar di kelas tersebut.</p>
          <p>Jumlah siswa terpilih.</p>
        </section>

        <section>
          <h2>Informasi Tambahan</h2>
          <ul>
            <li>Tanggal kelas dibuat: 01 Januari 2026</li>
            <li>Terakhir diperbarui: 24 November 2026</li>
          </ul>
        </section>

        <p>
          <BackButton btnText="Batal" />
          <button type="submit">Simpan Perubahan</button>
        </p>
      </form>
    </main>
  );
}
