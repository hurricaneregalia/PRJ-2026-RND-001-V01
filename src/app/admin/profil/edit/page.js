import Link from "next/link";
import { redirect } from "next/navigation";

import { connection } from "next/server";

import { auth } from "@/auth";
import BackButton from "@/components/ui/back-button";
import { getUserById, updateUser } from "@/repositories/user-repository";

export const instant = false;

export const metadata = {
  title: "Edit Profil",
};

export default async function EditProfilAdminPage() {
  await connection();
  const session = await auth();
  const user = session?.user?.id ? await getUserById(session.user.id) : null;

  if (!user) {
    return (
      <main>
        <h1>Edit Profil</h1>
        <p>Profil tidak ditemukan.</p>
        <p>
          <Link href="/admin">Dashboard</Link>
        </p>
      </main>
    );
  }

  async function simpanProfil(formData) {
    "use server";

    const session = await auth();
    if (!session?.user?.id) {
      redirect("/login");
    }

    await updateUser(session.user.id, {
      name: formData.get("name"),
      email: formData.get("email"),
      no_hp: formData.get("no_hp"),
    });

    redirect("/admin/profil");
  }

  return (
    <main>
      <header>
        <h1>Edit Profil</h1>
        <p>
          <Link href="/admin">Dashboard</Link> /{" "}
          <Link href="/admin/profil">Profil Saya</Link> / Edit Profil
        </p>
      </header>

      <form action={simpanProfil}>
        <section>
          <p>
            <label htmlFor="nama">Nama Lengkap</label>
            <br />
            <input
              id="nama"
              name="name"
              type="text"
              defaultValue={user.name}
              autoComplete="name"
              required
            />
          </p>
          <p>
            <label htmlFor="email">Email</label>
            <br />
            <input
              id="email"
              name="email"
              type="email"
              defaultValue={user.email}
              autoComplete="email"
              required
            />
          </p>
          <p>
            <label htmlFor="nomor-hp">Nomor HP</label>
            <br />
            <input
              id="nomor-hp"
              name="no_hp"
              type="tel"
              defaultValue={user.no_hp}
              autoComplete="tel"
            />
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
