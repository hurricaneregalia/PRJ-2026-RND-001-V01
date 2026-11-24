import Link from "next/link";
import BackButton from "@/components/ui/back-button";

export const metadata = {
  title: "Buat Absensi",
};

export default function BuatAbsensiPage() {
  return (
    <main>
      <header>
        <h1>Buat Absensi</h1>
        <p>
          <Link href="/pengajar">Dashboard</Link> / <Link href="/pengajar/kelas">Kelas Saya</Link> / <Link href="/pengajar/kelas/3">Detail Kelas</Link> / Buat Absensi
        </p>
      </header>

      <form>
        <section>
          <h2>Daftar Siswa</h2>
          <ul>
            <li>No. | Nama Siswa | Status Kehadiran | Keterangan</li>
            <li>
              1 | Andi |{" "}
              <select>
                <option>Hadir</option>
                <option>Izin</option>
                <option>Sakit</option>
                <option>Alpa</option>
              </select>{" "}
              | -
            </li>
            <li>
              2 | Citra |{" "}
              <select>
                <option>Hadir</option>
                <option>Izin</option>
                <option>Sakit</option>
                <option>Alpa</option>
              </select>{" "}
              | Izin keluarga
            </li>
          </ul>
        </section>

        <section>
          <h2>Catatan Pertemuan</h2>
          <p>
            <label htmlFor="materi">Materi yang dibahas</label>
            <input id="materi" name="materi" type="text" />
          </p>
          <p>
            <label htmlFor="catatan">Catatan singkat pengajar</label>
            <textarea id="catatan" name="catatan" />
          </p>
        </section>

        <p>
          <BackButton btnText="Batal" />
          <button type="submit">Simpan Absensi</button>
        </p>
      </form>
    </main>
  );
}
