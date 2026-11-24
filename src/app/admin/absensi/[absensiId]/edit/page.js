import Link from "next/link";

export const metadata = {
  title: "Edit Absensi",
};

export default function EditAbsensiPage() {
  return (
    <main>
      <header>
        <h1>Edit Absensi</h1>
        <p>
          <Link href="/admin">Dashboard</Link> / <Link href="/admin/absensi">Absensi</Link> / <Link href="/admin/absensi/2">Detail Absensi</Link> / Edit
        </p>
      </header>

      <section>
        <h2>Daftar Siswa</h2>
        <ul>
          <li>No. | NIS | Nama Siswa | Status Kehadiran | Keterangan</li>
          <li>1 | 2026001 | Andi | <select><option>Hadir</option><option>Izin</option><option>Sakit</option><option>Alpa</option></select> | -</li>
          <li>2 | 2026002 | Citra | <select><option>Hadir</option><option>Izin</option><option>Sakit</option><option>Alpa</option></select> | Izin keluarga</li>
          <li>3 | 2026003 | Dina | <select><option>Hadir</option><option>Izin</option><option>Sakit</option><option>Alpa</option></select> | Demam</li>
          <li>4 | 2026004 | Rudi | <select><option>Hadir</option><option>Izin</option><option>Sakit</option><option>Alpa</option></select> | Tanpa keterangan</li>
        </ul>
        <p>Semua status kehadiran harus sudah terisi berdasarkan data sebelumnya. Admin dapat mengubah status dan keterangan siswa langsung melalui tabel.</p>
      </section>

      <p>
        <button type="submit">Simpan Perubahan</button>
        <Link href="/admin/absensi/2">Batal</Link>
        <button type="button">Reset Perubahan</button>
      </p>
    </main>
  );
}
