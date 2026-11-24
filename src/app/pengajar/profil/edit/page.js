import Image from "next/image";
import Link from "next/link";
import BackButton from "@/components/ui/back-button";

export const metadata = {
  title: "Edit Profil",
};

export default function EditProfilPengajarPage() {
  return (
    <main>
      <header>
        <h1>Edit Profil</h1>
        <p>
          <Link href="/pengajar">Dashboard</Link> / <Link href="/pengajar/profil/edit">Profil Saya</Link> / Edit Profil
        </p>
      </header>
      <form>
        <section>
          <h2>Informasi Profil</h2>
          <Image src="https://i.pravatar.cc/150?img=12" alt="Foto profil" width={150} height={150} />
          <p>
            <label htmlFor="foto">Foto Profil</label>
            <input id="foto" name="foto" type="file" accept="image/*" />
          </p>
          <p>
            <label htmlFor="username">Username</label>
            <input id="username" name="username" type="text" defaultValue="Budi32" />
          </p>{" "}
          <p>
            <label htmlFor="nama">Nama Lengkap</label>
            <input id="nama" name="nama" type="text" defaultValue="Budi" />
          </p>
          <p>
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" defaultValue="budi@email.com" />
          </p>
          <p>
            <label htmlFor="nomor-hp">Nomor HP</label>
            <input id="nomor-hp" name="nomor-hp" type="tel" defaultValue="08123456789" />
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
