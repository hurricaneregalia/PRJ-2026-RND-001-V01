import { notFound } from "next/navigation";
import { requireRole } from "@/lib/authorization";
import { getUserDetails } from "@/services/user-management-service";
import { updateUserAction } from "../actions";

export const instant = false;

export default async function UserDetailPage({ params, searchParams }) {
  await requireRole(["Administrator"]);

  const { userId } = await params;

  let user;

  try {
    user = await getUserDetails(userId);
  } catch (error) {
    if (error.message === "USER_NOT_FOUND") {
      notFound();
    }

    throw error;
  }

  const query = await searchParams;

  const errorMessages = {
    INVALID_USER_UPDATE: "Data perubahan tidak valid.",
    INVALID_USER_UPDATE_FIELD: "Kolom perubahan tidak diizinkan.",
    INVALID_USERNAME: "Username tidak valid.",
    INVALID_FULL_NAME: "Nama lengkap tidak valid.",
    INVALID_EMAIL: "Email tidak valid.",
    INVALID_GENDER: "Jenis kelamin tidak valid.",
    INVALID_ROLE: "Role tidak valid.",
    INVALID_ACCOUNT_STATUS: "Status akun tidak valid.",
    USER_EMAIL_ALREADY_EXISTS: "Email sudah digunakan pengguna lain.",
    CANNOT_CHANGE_OWN_ADMIN_ACCESS: "Kamu tidak dapat mengubah akses Administrator milik sendiri.",
    LAST_ACTIVE_ADMINISTRATOR: "Administrator aktif terakhir tidak dapat dinonaktifkan atau diturunkan role-nya.",
    USER_UPDATE_FAILED: "Perubahan data pengguna gagal.",
  };

  return (
    <main>
      <h1>Detail Pengguna</h1>

      {query?.success === "updated" && <p>Data pengguna berhasil diperbarui.</p>}

      {query?.error && <p>{errorMessages[query.error] || "Terjadi kesalahan."}</p>}

      <p>ID Pengguna: {user.user_id}</p>

      <form action={updateUserAction}>
        <input type="hidden" name="user_id" value={user.user_id} />

        <div>
          <label htmlFor="username">Username</label>
          <input id="username" name="username" type="text" defaultValue={user.username} required />
        </div>

        <div>
          <label htmlFor="full_name">Nama Lengkap</label>
          <input id="full_name" name="full_name" type="text" defaultValue={user.full_name} required />
        </div>

        <div>
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" defaultValue={user.email} required />
        </div>

        <div>
          <label htmlFor="gender">Jenis Kelamin</label>
          <select id="gender" name="gender" defaultValue={user.gender} required>
            <option value="Laki-laki">Laki-laki</option>
            <option value="Perempuan">Perempuan</option>
          </select>
        </div>

        <div>
          <label htmlFor="role">Role</label>
          <select id="role" name="role" defaultValue={user.role} required>
            <option value="Guru">Guru</option>
            <option value="Administrator">Administrator</option>
          </select>
        </div>

        <div>
          <label htmlFor="account_status">Status Akun</label>
          <select id="account_status" name="account_status" defaultValue={user.account_status} required>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </div>

        <button type="submit">Simpan Perubahan</button>
      </form>

      <p>
        <a href="/admin/users">Kembali ke Daftar Pengguna</a>
      </p>
    </main>
  );
}
