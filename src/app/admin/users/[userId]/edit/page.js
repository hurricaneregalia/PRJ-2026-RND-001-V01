import Link from "next/link";
import { redirect } from "next/navigation";

import { connection } from "next/server";

import { auth } from "@/auth";
import { getUserById, updateUser } from "@/repositories/user-repository";
import { recordAuditUpdate } from "@/repositories/audit-log-repository";
import RoleSelectWithLimit from "@/components/ui/role-select-with-limit";

export const instant = false;

export const metadata = {
  title: "Edit Pengguna",
};

export default async function EditPenggunaPage({ params }) {
  await connection();
  const { userId } = await params;
  const user = await getUserById(userId);

  if (!user) {
    return (
      <main>
        <h1>Pengguna tidak ditemukan</h1>
        <p>
          <Link href="/admin/users">Kembali ke Manajemen Pengguna</Link>
        </p>
      </main>
    );
  }

  async function simpanPengguna(formData) {
    "use server";

    const session = await auth();
    const before = await getUserById(userId);
    const nextEmail = formData.get("email");
    const update = {
      name: formData.get("name"),
      email: nextEmail,
      role: formData.get("role"),
      account_status: formData.get("account_status"),
      no_hp: formData.get("no_hp"),
      limit_kelas: Number(formData.get("limit_kelas") || 0),
    };

    if (before?.auth_user_id && before.auth_user_id === before.email) {
      update.auth_user_id = nextEmail;
    }

    const after = await updateUser(userId, update);

    await recordAuditUpdate({
      tableName: "users",
      recordId: userId,
      userId: session?.user?.id || "",
      before,
      after,
      note: "Perubahan pengguna dari halaman admin",
    });

    redirect("/admin/users");
  }

  return (
    <main>
      <header>
        <h1>Edit Pengguna</h1>
        <p>Ubah informasi akun pengguna.</p>
        <p>
          <Link href="/admin">Dashboard</Link> /{" "}
          <Link href="/admin/users">Manajemen Pengguna</Link> / Edit Pengguna
        </p>
      </header>

      <form action={simpanPengguna}>
        <section>
          <p>
            <label htmlFor="name">Nama (wajib)</label>
            <br />
            <input
              id="name"
              name="name"
              type="text"
              defaultValue={user.name}
              autoComplete="name"
              required
            />
          </p>
          <p>
            <label htmlFor="email">Email (wajib)</label>
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
            <label htmlFor="account_status">Status Akun</label>
            <br />
            <select
              id="account_status"
              name="account_status"
              defaultValue={user.account_status}
            >
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
          </p>
          <p>
            <label htmlFor="no_hp">Nomor WhatsApp</label>
            <br />
            <input
              id="no_hp"
              name="no_hp"
              type="tel"
              defaultValue={user.no_hp}
              autoComplete="tel"
            />
          </p>
          <RoleSelectWithLimit user={user} />
        </section>

        <p>
          <button type="submit">Simpan Perubahan</button>
        </p>
      </form>
    </main>
  );
}
