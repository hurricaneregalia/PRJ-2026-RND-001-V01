import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { createUser } from "@/repositories/user-repository";
import { recordAuditCreate } from "@/repositories/audit-log-repository";

export const metadata = {
  title: "Tambah Pengguna",
};

export default function TambahPenggunaPage() {
  async function tambahPengguna(formData) {
    "use server";

    const session = await auth();
    const name = formData.get("name");
    const email = formData.get("email");
    const noHp = formData.get("no_hp");
    const role = formData.get("role");
    const accountStatus = formData.get("account_status");

    const created = await createUser({
      auth_user_id: email,
      email,
      name,
      role,
      account_status: accountStatus,
      photo_url: "",
      no_hp: noHp,
    });

    await recordAuditCreate({
      tableName: "users",
      recordId: created.user_id,
      userId: session?.user?.id || "",
      after: created,
      note: "Penambahan pengguna dari halaman admin",
    });

    redirect("/admin/users");
  }

  return (
    <main>
      <header>
        <h1>Tambah Pengguna</h1>
        <p>Buat akun Admin atau Pengajar baru.</p>
        <p>
          <Link href="/admin">Dashboard</Link> /{" "}
          <Link href="/admin/users">Manajemen Pengguna</Link> / Tambah Pengguna
        </p>
      </header>

      <form action={tambahPengguna}>
        <section>
          <p>
            <label htmlFor="name">Nama (wajib)</label>
            <br />
            <input id="name" name="name" type="text" autoComplete="name" required />
          </p>
          <p>
            <label htmlFor="email">Email (wajib)</label>
            <br />
            <input id="email" name="email" type="email" autoComplete="email" required />
          </p>
          <p>
            <label htmlFor="no_hp">Nomor WhatsApp</label>
            <br />
            <input id="no_hp" name="no_hp" type="tel" autoComplete="tel" />
          </p>
          <p>
            <label htmlFor="role">Role</label>
            <br />
            <select id="role" name="role" defaultValue="Pengajar">
              <option value="Admin">Admin</option>
              <option value="Pengajar">Pengajar</option>
            </select>
          </p>
          <p>
            <label htmlFor="account_status">Status Akun</label>
            <br />
            <select id="account_status" name="account_status" defaultValue="active">
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
          </p>
        </section>

        <p>
          <button type="submit">Simpan Pengguna</button>
        </p>
      </form>
    </main>
  );
}
