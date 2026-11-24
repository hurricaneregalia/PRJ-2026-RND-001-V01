import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Profil Saya",
};

export default function ProfilPengajarPage() {
  return (
    <main>
      <header>
        <h1>Profil Saya</h1>
        <p>
          <Link href="/pengajar">Dashboard</Link> / Profil Saya
        </p>
      </header>
      <section>
        <h2>Informasi Profil</h2>
        <Image src="https://i.pravatar.cc/150?img=12" alt="Foto profil" width={150} height={150} />
        <ul>
          <li>Nama: Budi</li>
          <li>Email: budi@email.com</li>
          <li>Nomor HP: 08123456789</li>
          <li>Jabatan: Pengajar</li>
        </ul>
        <p>
          <Link href="/pengajar/profil/edit">Edit</Link>
        </p>
      </section>
    </main>
  );
}
