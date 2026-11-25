import Link from "next/link";

import BackButton from "@/components/ui/back-button";
import NoteBox from "@/components/layout/note-box";

export const metadata = {
  title: "Pindah Kelas Siswa",
};

const SISWA = {
  siswa_id: "SIS-0001",
  nis: "2026001",
  nama: "Andi Pratama",
  jenis_kelamin: "Laki-laki",
  tanggal_lahir: "01 Januari 2010",
  no_hp: "0812-3456-7890",
  status: "aktif",
};

const KELAS_SAAT_INI = {
  kelas_id: "KLS-0001",
  kode_kelas: "MAT-A",
  nama_kelas: "Matematika A",
  pengajar: "Budi Santoso",
  jadwal: "Senin, 08:00 - 09:30",
  ruangan: "R-101",
  kapasitas: 20,
  jumlah_siswa: 15,
  status_kelas: "aktif",
  kelas_siswa_id: "KRS-0001",
  tanggal_mulai: "05 Januari 2026",
  status_keanggotaan: "aktif",
};

export default function PindahKelasSiswaPage() {
  return (
    <main>
      <header>
        <h1>Pindah Kelas Siswa</h1>
        <p>Halaman statis untuk evaluasi UI pemindahan kelas individual. Data yang ditampilkan adalah ilustrasi.</p>
        <p>
          <Link href="/admin">Dashboard</Link> / <Link href="/admin/siswa">Manajemen Siswa</Link> / <Link href="/admin/siswa/SIS-0001">Detail Siswa</Link> / Pindah Kelas
        </p>
      </header>

      <section aria-labelledby="identitas-siswa">
        <h2 id="identitas-siswa">Identitas Siswa</h2>
        <ul>
          <li>
            <strong>Nama:</strong> {SISWA.nama}
          </li>
          <li>
            <strong>NIS:</strong> {SISWA.nis}
          </li>
          <li>
            <strong>ID siswa:</strong> {SISWA.siswa_id}
          </li>
          <li>
            <strong>Jenis kelamin:</strong> {SISWA.jenis_kelamin}
          </li>
          <li>
            <strong>Tanggal lahir:</strong> {SISWA.tanggal_lahir}
          </li>
          <li>
            <strong>Nomor HP:</strong> {SISWA.no_hp}
          </li>
          <li>
            <strong>Status siswa:</strong> {SISWA.status}
          </li>
        </ul>
      </section>

      <section aria-labelledby="kelas-saat-ini">
        <h2 id="kelas-saat-ini">Kelas Saat Ini</h2>
        <ul>
          <li>
            <strong>Kode kelas:</strong> {KELAS_SAAT_INI.kode_kelas}
          </li>
          <li>
            <strong>Nama kelas:</strong> {KELAS_SAAT_INI.nama_kelas}
          </li>
          <li>
            <strong>Pengajar:</strong> {KELAS_SAAT_INI.pengajar}
          </li>
          <li>
            <strong>Jadwal:</strong> {KELAS_SAAT_INI.jadwal}
          </li>
          <li>
            <strong>Ruangan:</strong> {KELAS_SAAT_INI.ruangan}
          </li>
          <li>
            <strong>Kapasitas:</strong> {KELAS_SAAT_INI.jumlah_siswa} dari {KELAS_SAAT_INI.kapasitas} siswa
          </li>
          <li>
            <strong>Status kelas:</strong> {KELAS_SAAT_INI.status_kelas}
          </li>
        </ul>
      </section>

      <section aria-labelledby="keanggotaan-saat-ini">
        <h2 id="keanggotaan-saat-ini">Informasi Keanggotaan</h2>
        <ul>
          <li>
            <strong>ID keanggotaan:</strong> {KELAS_SAAT_INI.kelas_siswa_id}
          </li>
          <li>
            <strong>Tanggal mulai:</strong> {KELAS_SAAT_INI.tanggal_mulai}
          </li>
          <li>
            <strong>Status keanggotaan:</strong> {KELAS_SAAT_INI.status_keanggotaan}
          </li>
          <li>
            <strong>Tanggal selesai:</strong> Belum ada
          </li>
        </ul>
      </section>

      <section aria-labelledby="rencana-pemindahan-siswa">
        <h2 id="rencana-pemindahan-siswa">Rencana Pemindahan</h2>

        <p>
          <label htmlFor="kelas-tujuan-siswa">Kelas tujuan</label>
          <br />
          <select id="kelas-tujuan-siswa" defaultValue="KLS-0002">
            <option value="KLS-0002">ENG-B - Bahasa Inggris B (Siti Aminah)</option>
            <option value="KLS-0003">IPA-A - IPA Dasar A (Rina Wati)</option>
            <option value="KLS-0004">MAT-B - Matematika B (Budi Santoso)</option>
          </select>
        </p>

        <p>
          <label htmlFor="tanggal-efektif-siswa">Tanggal efektif pemindahan</label>
          <br />
          <input id="tanggal-efektif-siswa" type="date" defaultValue="2026-11-25" />
        </p>

        <section aria-labelledby="ringkasan-pindah-kelas-siswa">
          <h3 id="ringkasan-pindah-kelas-siswa">Ringkasan Pemindahan</h3>
          <dl>
            <dt>Kelas asal</dt>
            <dd>MAT-A - Matematika A</dd>
            <dt>Kelas tujuan</dt>
            <dd>ENG-B - Bahasa Inggris B</dd>
            <dt>Pengajar kelas tujuan</dt>
            <dd>Siti Aminah</dd>
            <dt>Jadwal kelas tujuan</dt>
            <dd>Selasa, 10:00 - 11:30</dd>
            <dt>Ruangan kelas tujuan</dt>
            <dd>R-102</dd>
            <dt>Tanggal efektif</dt>
            <dd>2026-11-25</dd>
            <dt>Dampak keanggotaan</dt>
            <dd>Keanggotaan lama menjadi selesai; keanggotaan baru menjadi aktif.</dd>
          </dl>
        </section>

        <p>
          <button type="button">Konfirmasi Pemindahan</button> <BackButton btnText="Batal" />
        </p>

        <p>Pratinjau konfirmasi: Matematika A ke Bahasa Inggris B pada 2026-11-25. Tidak ada data yang dikirim atau disimpan.</p>
      </section>

      <section>
        <NoteBox
          text={
            <ol>
              <li>Riwayat keanggotaan kelas lama tidak dihapus.</li>
              <li>Setelah pemindahan, keanggotaan lama menjadi selesai dan keanggotaan baru menjadi aktif.</li>
              <li>Absensi historis tetap merujuk kelas saat absensi dibuat.</li>
              <li>Halaman ini belum menjalankan pemindahan atau menyimpan data ke Google Spreadsheet.</li>
            </ol>
          }
        />
      </section>
    </main>
  );
}
