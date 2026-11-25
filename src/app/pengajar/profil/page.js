import Link from "next/link";

import { connection } from "next/server";

import { auth } from "@/auth";
import AvatarImage from "@/components/ui/avatar-image";
import { getUserById } from "@/repositories/user-repository";

export const instant = false;

export const metadata = {
  title: "Profil Saya",
};

export default async function ProfilPengajarPage() {
  await connection();
  const session = await auth();
  const user = session?.user?.id ? await getUserById(session.user.id) : null;

  if (!user) {
    return (
      <main>
        <h1>Profil Saya</h1>
        <p>Profil tidak ditemukan.</p>
        <p>
          <Link href="/pengajar">Dashboard</Link>
        </p>
      </main>
    );
  }

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
        <AvatarImage src={user.photo_url} alt={user.name} />
        <ul>
          <li>Nama: {user.name}</li>
          <li>Email: {user.email}</li>
          <li>Nomor HP: {user.no_hp || "-"}</li>
          <li>Jabatan: {user.role}</li>
        </ul>
        <p>
          <Link href="/pengajar/profil/edit">Edit</Link>
        </p>
      </section>
    </main>
  );
}
