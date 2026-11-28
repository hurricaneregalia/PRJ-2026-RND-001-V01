import Link from "next/link";
import { redirect } from "next/navigation";

import { connection } from "next/server";

import { auth } from "@/auth";
import { getUserById } from "@/repositories/user-repository";
import { getInformasiSekolah } from "@/services/sekolah-service";
import { simpanInformasiSekolahAction } from "@/app/admin/sekolah/actions";

export const instant = false;

export const metadata = {
  title: "Lengkapi Informasi Sekolah",
};

const DEFAULT_LOGO = "/images/logo-sekolah.svg";

async function requireAdmin() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/login");
  }

  const dbUser = await getUserById(userId);

  if (
    session.user.role !== "Admin" ||
    session.user.accountStatus !== "active" ||
    dbUser?.role !== "Admin" ||
    dbUser?.account_status !== "active"
  ) {
    redirect("/login");
  }
}

export default async function TambahInformasiSekolahPage() {
  await connection();
  await requireAdmin();

  if (await getInformasiSekolah()) {
    redirect("/admin/sekolah/edit");
  }

  return (
    <main>
      <header>
        <h1>Lengkapi Informasi Sekolah</h1>
        <p>
          <Link href="/admin/sekolah">Kelola Informasi Sekolah</Link>
        </p>
      </header>

      <form action={simpanInformasiSekolahAction}>
        <section>
          <p>
            <label htmlFor="nama_sekolah">Nama Sekolah (wajib)</label>
            <br />
            <input id="nama_sekolah" name="nama_sekolah" type="text" required maxLength={200} />
          </p>
          <p>
            <label htmlFor="alamat">Alamat (wajib)</label>
            <br />
            <input id="alamat" name="alamat" type="text" required maxLength={500} />
          </p>
          <p>
            <label htmlFor="no_hp">Nomor HP (wajib)</label>
            <br />
            <input id="no_hp" name="no_hp" type="tel" required maxLength={30} />
          </p>
          <p>
            <label htmlFor="logo">URL Logo Sekolah</label>
            <br />
            <input id="logo" name="logo" type="text" maxLength={1000} defaultValue={DEFAULT_LOGO} />
          </p>
          <p>
            <label htmlFor="email">Email Sekolah (wajib)</label>
            <br />
            <input id="email" name="email" type="email" required maxLength={320} />
          </p>
        </section>

        <p>
          <button type="submit">Simpan Informasi Sekolah</button>
        </p>
      </form>
    </main>
  );
}
