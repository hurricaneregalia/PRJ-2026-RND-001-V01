"use server";

import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getUserById } from "@/repositories/user-repository";
import { simpanInformasiSekolah } from "@/services/sekolah-service";

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

  return userId;
}

export async function simpanInformasiSekolahAction(formData) {
  const actorId = await requireAdmin();

  await simpanInformasiSekolah({
    data: {
      nama_sekolah: formData.get("nama_sekolah"),
      alamat: formData.get("alamat"),
      no_hp: formData.get("no_hp"),
      logo: formData.get("logo"),
      email: formData.get("email"),
    },
    actorId,
  });

  redirect("/admin/sekolah");
}
