import Image from "next/image";
import Link from "next/link";
import BackButton from "@/components/ui/back-button";

export const metadata = {
  title: "Edit Profil",
};

export default function EditProfilPage() {
  return (
    <main>
      <header>
        <h1>Edit Profil</h1>
        <p>
          <Link href="/admin">Dashboard</Link> / <Link href="/admin/profil/2">Lihat Profil</Link> / Edit Profil
        </p>
      </header>

      <form>
        <section>
          <h2>Informasi Identitas Admin</h2>
          <Image src="https://i.pravatar.cc/150?img=12" alt="Foto profil" width={150} height={150} />

          <p>
            <label htmlFor="foto">Foto Profil</label>
            <input id="foto" name="foto" type="file" />
          </p>
          <p>
            <label htmlFor="nama">Nama Lengkap</label>
            <input id="nama" name="nama" type="text" defaultValue="Admin" />
          </p>
          <p>
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" defaultValue="admin@email.com" />
          </p>
          <p>
            <label htmlFor="nomor-hp">Nomor HP</label>
            <input id="nomor-hp" name="nomor-hp" type="tel" defaultValue="081234567890" />
          </p>
          <p>
            <label htmlFor="jabatan">Jabatan</label>
            <select id="jabatan" name="jabatan" defaultValue="administrator">
              <option value="administrator">Administrator</option>
              <option value="pengajar">Pengajar</option>
            </select>
          </p>
          <p>
            <label htmlFor="tanggal-bergabung">Tanggal Bergabung</label>
            <input id="tanggal-bergabung" name="tanggal-bergabung" type="date" defaultValue="2026-01-01" readOnly disabled />
          </p>
        </section>

        <p>
          <button type="submit">Simpan</button>
          <BackButton btnText="Batal" />
        </p>
      </form>
    </main>
  );
}
