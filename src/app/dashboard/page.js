import { connection } from "next/server";
import { redirect } from "next/navigation";

import { auth } from "@/auth";

export const instant = false;

export default async function DashboardRedirectPage() {
  await connection();
  const session = await auth();
  const user = session?.user;

  if (!user || user.bootstrapPending) {
    redirect("/login");
  }

  if (user.role === "Admin") {
    redirect("/admin");
  }

  if (user.role === "Pengajar") {
    redirect("/pengajar");
  }

  redirect("/login");
}
