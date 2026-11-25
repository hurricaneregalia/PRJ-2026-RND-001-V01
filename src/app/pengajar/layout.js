import { redirect } from "next/navigation";

import { connection } from "next/server";

export const instant = false;

import { auth, signOut } from "@/auth";

import { getUserById } from "@/repositories/user-repository";
import AvatarImage from "@/components/ui/avatar-image";

export default async function PengajarLayout({ children }) {
  await connection();
  const session = await auth();
  const user = session?.user;

  if (!user || user.bootstrapPending || !["Pengajar", "Admin"].includes(user.role) || user.accountStatus !== "active") {
    redirect("/login");
  }

  const dbUser = user.id ? await getUserById(user.id) : null;

  async function logout() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <>
      <header>
        <p>{dbUser?.name || user.id}</p>
        <AvatarImage src={dbUser?.photo_url} alt={dbUser?.name || user.id} />
      </header>
      <form action={logout}>
        <button type="submit">Logout</button>
      </form>
      {children}
    </>
  );
}
