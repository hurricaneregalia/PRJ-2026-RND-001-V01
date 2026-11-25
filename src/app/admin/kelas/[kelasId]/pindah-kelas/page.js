import Link from "next/link";

import BackButton from "@/components/ui/back-button";
import NoteBox from "@/components/layout/note-box";

export const metadata = {
  title: "Pindah Kelas dari Kelas",
};

const KELAS_ASAL = {
  kelas_id: "KLS-0001",
  kode_kelas: "MAT-A",
  nama_kelas: "Matematika A",
  pengajar: "Budi Santoso",
  jadwal: "Senin, 08:00 - 09:30",
  ruangan: "R-101",
  kapasitas: 20,
  jumlah_siswa: 15,
  status_kelas: "aktif",
};

const ANGGOTA_AKTIF = [
  {
    kelas_siswa_id: "KRS-0001",
    siswa_id: "SIS-0001",
    nis: "2026001",
    nama: "Andi Pratama",
    jenis_kelamin: "Laki-laki",
    tanggal_mulai: "05 Januari 2026",
    status_keanggotaan: "aktif",
  },
  {
    kelas_siswa_id: "KRS-0002",
    siswa_id: "SIS-0002",
    nis: "2026002",
    nama: "Citra Lestari",
    jenis_kelamin: "Perempuan",
    tanggal_mulai: "05 Januari 2026",
    status_keanggotaan: "aktif",
  },
  {
    kelas_siswa_id: "KRS-0003",
    siswa_id: "SIS-0003",
    nis: "2026003",
    nama: "Dina Maulida",
    jenis_kelamin: "Perempuan",
    tanggal_mulai: "05 Januari 2026",
    status_keanggotaan: "aktif",
  },
  {
    kelas_siswa_id: "KRS-0004",
    siswa_id: "SIS-0004",
    nis: "2026004",
    nama: "Fajar Nugroho",
    jenis_kelamin: "Laki-laki",
    tanggal_mulai: "12 Januari 2026",
    status_keanggotaan: "aktif",
  },
  {
    kelas_siswa_id: "KRS-0005",
    siswa_id: "SIS-0005",
    nis: "2026005",
    nama: "Gita Permata",
    jenis_kelamin: "Perempuan",
    tanggal_mulai: "12 Januari 2026",
    status_keanggotaan: "aktif",
  },
  {
    kelas_siswa_id: "KRS-0006",
    siswa_id: "SIS-0006",
    nis: "2026006",
    nama: "Hendra Wijaya",
    jenis_kelamin: "Laki-laki",
    tanggal_mulai: "19 Januari 2026",
    status_keanggotaan: "aktif",
  },
];

export default function PindahKelasKelasPage() {
  return (
    <main>
      <header>
        <h1>Pindah Kelas dari Kelas</h1>
        <p>Halaman statis untuk evaluasi UI pemindahan beberapa siswa dari satu kelas. Data yang ditampilkan adalah ilustrasi.</p>
        <p>
          <Link href="/admin">Dashboard</Link> / <Link href="/admin/kelas">Manajemen Kelas</Link> / <Link href="/admin/kelas/KLS-0001">Detail Kelas</Link> / Pindah Kelas
        </p>
      </header>

      <section aria-labelledby="identitas-kelas-asal">
        <h2 id="identitas-kelas-asal">Identitas Kelas Asal</h2>
        <ul>
          <li>
            <strong>Kode kelas:</strong> {KELAS_ASAL.kode_kelas}
          </li>
          <li>
            <strong>Nama kelas:</strong> {KELAS_ASAL.nama_kelas}
          </li>
          <li>
            <strong>ID kelas:</strong> {KELAS_ASAL.kelas_id}
          </li>
          <li>
            <strong>Pengajar:</strong> {KELAS_ASAL.pengajar}
          </li>
          <li>
            <strong>Jadwal:</strong> {KELAS_ASAL.jadwal}
          </li>
          <li>
            <strong>Ruangan:</strong> {KELAS_ASAL.ruangan}
          </li>
          <li>
            <strong>Kapasitas:</strong> {KELAS_ASAL.jumlah_siswa} dari {KELAS_ASAL.kapasitas} siswa
          </li>
          <li>
            <strong>Status kelas:</strong> {KELAS_ASAL.status_kelas}
          </li>
        </ul>
      </section>

      <section aria-labelledby="anggota-aktif">
        <h2 id="anggota-aktif">Daftar Siswa Aktif</h2>
        <p>Hanya siswa dengan status keanggotaan aktif yang dapat dipilih untuk dipindahkan.</p>
        <ul>
          {ANGGOTA_AKTIF.map((anggota) => (
            <li key={anggota.kelas_siswa_id}>
              {anggota.nama} | NIS {anggota.nis} | ID {anggota.siswa_id} | Keanggotaan {anggota.kelas_siswa_id} | Status {anggota.status_keanggotaan} | Mulai {anggota.tanggal_mulai}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="rencana-pemindahan">
        <h2 id="rencana-pemindahan">Rencana Pemindahan</h2>

        <fieldset>
          <legend>Pilih siswa yang dipindahkan</legend>
          <p>Jumlah siswa terpilih: 3 dari {ANGGOTA_AKTIF.length}</p>
          <ul>
            <li>
              <input type="checkbox" defaultChecked readOnly /> Andi Pratama | NIS 2026001 | ID SIS-0001 | Keanggotaan KRS-0001 | Status aktif
            </li>
            <li>
              <input type="checkbox" defaultChecked readOnly /> Citra Lestari | NIS 2026002 | ID SIS-0002 | Keanggotaan KRS-0002 | Status aktif
            </li>
            <li>
              <input type="checkbox" defaultChecked readOnly /> Dina Maulida | NIS 2026003 | ID SIS-0003 | Keanggotaan KRS-0003 | Status aktif
            </li>
            <li>
              <input type="checkbox" readOnly /> Fajar Nugroho | NIS 2026004 | ID SIS-0004 | Keanggotaan KRS-0004 | Status aktif
            </li>
            <li>
              <input type="checkbox" readOnly /> Gita Permata | NIS 2026005 | ID SIS-0005 | Keanggotaan KRS-0005 | Status aktif
            </li>
            <li>
              <input type="checkbox" readOnly /> Hendra Wijaya | NIS 2026006 | ID SIS-0006 | Keanggotaan KRS-0006 | Status aktif
            </li>
          </ul>
        </fieldset>

        <p>
          <label htmlFor="kelas-tujuan-kelas">Kelas tujuan</label>
          <br />
          <select id="kelas-tujuan-kelas" defaultValue="KLS-0002">
            <option value="KLS-0002">ENG-B - Bahasa Inggris B (Siti Aminah)</option>
            <option value="KLS-0003">IPA-A - IPA Dasar A (Rina Wati)</option>
            <option value="KLS-0004">MAT-B - Matematika B (Budi Santoso)</option>
          </select>
        </p>

        <p>
          <label htmlFor="tanggal-efektif-kelas">Tanggal efektif pemindahan</label>
          <br />
          <input id="tanggal-efektif-kelas" type="date" defaultValue="2026-11-25" />
        </p>

        <section aria-labelledby="ringkasan-pindah-kelas-kelas">
          <h3 id="ringkasan-pindah-kelas-kelas">Ringkasan Pemindahan</h3>
          <dl>
            <dt>Kelas asal</dt>
            <dd>MAT-A - Matematika A</dd>
            <dt>Kelas tujuan</dt>
            <dd>ENG-B - Bahasa Inggris B</dd>
            <dt>Jumlah siswa terpilih</dt>
            <dd>3 siswa</dd>
            <dt>Daftar siswa terpilih</dt>
            <dd>Andi Pratama (2026001), Citra Lestari (2026002), Dina Maulida (2026003)</dd>
            <dt>Pengajar kelas tujuan</dt>
            <dd>Siti Aminah</dd>
            <dt>Jadwal kelas tujuan</dt>
            <dd>Selasa, 10:00 - 11:30</dd>
            <dt>Ruangan kelas tujuan</dt>
            <dd>R-102</dd>
            <dt>Tanggal efektif</dt>
            <dd>2026-11-25</dd>
            <dt>Dampak keanggotaan</dt>
            <dd>Keanggotaan lama setiap siswa terpilih menjadi selesai; keanggotaan baru menjadi aktif.</dd>
          </dl>
        </section>

        <p>
          <button type="button">Konfirmasi Pemindahan</button> <BackButton btnText="Batal" />
        </p>

        <p>Pratinjau konfirmasi: 3 siswa dari Matematika A ke Bahasa Inggris B pada 2026-11-25. Tidak ada data yang dikirim atau disimpan.</p>
      </section>

      <NoteBox
        text={
          <ol>
            <li>Hanya boleh menampilkan daftar siswa yang aktif saja di kelas ini</li>
            <li>Riwayat keanggotaan kelas lama tidak dihapus.</li>
            <li>Setelah pemindahan, keanggotaan lama menjadi selesai dan keanggotaan baru menjadi aktif.</li>
            <li>Setiap siswa diproses terpisah; kegagalan satu siswa tidak membatalkan siswa lain.</li>
            <li>Absensi historis tetap merujuk kelas saat absensi dibuat.</li>
            <li>Halaman ini belum menjalankan pemindahan atau menyimpan data ke Google Spreadsheet.</li>
          </ol>
        }
      />
    </main>
  );
}
