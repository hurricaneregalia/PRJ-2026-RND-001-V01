import { redirect } from "next/navigation";

import { connection } from "next/server";

export const instant = false;

export const metadata = {
  title: "Pemantauan Ketidakhadiran",
};

export default async function TambahPemantauanPage() {
  await connection();
  redirect("/admin/pemantauan");
}
