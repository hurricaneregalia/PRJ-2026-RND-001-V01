import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";

import { connection } from "next/server";

export const instant = false;

import { auth, signOut } from "@/auth";

import { getUserById } from "@/repositories/user-repository";
import { getInformasiSekolah } from "@/services/sekolah-service";
import AvatarImage from "@/components/ui/avatar-image";

const DEFAULT_LOGO = "/images/logo-sekolah.svg";

export default async function AdminLayout({ children }) {
  await connection();
  const session = await auth();
  const user = session?.user;

  if (!user || user.bootstrapPending || user.role !== "Admin" || user.accountStatus !== "active") {
    redirect("/login");
  }

  const dbUser = user.id ? await getUserById(user.id) : null;
  const sekolah = await getInformasiSekolah();

  async function logout() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <>
      <header>
        <p>
          <Link href="/admin/">
            <Image src={sekolah?.logo || DEFAULT_LOGO} alt={sekolah?.nama_sekolah || "Logo sekolah"} width={40} height={40} unoptimized />{" "}
            {sekolah?.nama_sekolah || "Informasi sekolah belum tersedia."}
          </Link>
        </p>
        <p>{dbUser?.name || user.id}</p>
        <AvatarImage src={dbUser?.photo_url} alt={dbUser?.name || user.id} />
      </header>
      <form action={logout}>
        <button type="submit">Logout</button>
      </form>
      {children}
      <footer>{sekolah?.nama_sekolah || "Informasi sekolah belum tersedia."}</footer>
    </>
  );
}
