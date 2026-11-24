import Link from "next/link";
import BackButton from "@/components/ui/back-button";

export const metadata = {
  title: "Edit Absensi",
};

export default function EditAbsensiPengajarPage() {
  return (
    <main>
      <header>
        <h1>Edit Absensi</h1>
        <p>
          <Link href="/pengajar">Dashboard</Link> / <Link href="/pengajar/kelas">Kelas Saya</Link> / <Link href="/pengajar/kelas/3">Detail Kelas</Link> /{" "}
          <Link href="/pengajar/kelas/3/absensi/3">Detail Absensi</Link> / Edit
        </p>
      </header>

      <section>
        <h2>Daftar Siswa</h2>
        <ul>
          <li>No. | Nama Siswa | Status Kehadiran</li>
          <li>
            1 | Andi |{" "}
            <select>
              <option>Hadir</option>
              <option>Izin</option>
              <option>Sakit</option>
              <option>Alpa</option>
            </select>
          </li>
          <li>
            2 | Citra |{" "}
            <select>
              <option>Hadir</option>
              <option>Izin</option>
              <option>Sakit</option>
              <option>Alpa</option>
            </select>
          </li>
          <li>
            3 | Dina |{" "}
            <select>
              <option>Hadir</option>
              <option>Izin</option>
              <option>Sakit</option>
              <option>Alpa</option>
            </select>
          </li>
          <li>
            4 | Rudi |{" "}
            <select>
              <option>Hadir</option>
              <option>Izin</option>
              <option>Sakit</option>
              <option>Alpa</option>
            </select>
          </li>
        </ul>
      </section>

      <section>
        <h2>Catatan Pertemuan</h2>
        <p>
          <label htmlFor="materi">Materi yang dibahas</label>
          <input id="materi" name="materi" type="text" defaultValue="Aljabar dasar" />
        </p>
        <p>
          <label htmlFor="catatan">Catatan singkat pengajar</label>
          <textarea id="catatan" name="catatan" defaultValue="Pertemuan berjalan lancar." />
        </p>
      </section>

      <button type="submit">Simpan Perubahan</button>
      <p>
        <BackButton btnText="Batal" />
      </p>
    </main>
  );
}
