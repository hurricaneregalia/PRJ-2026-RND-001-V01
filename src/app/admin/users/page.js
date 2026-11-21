import { requireRole } from "@/lib/authorization";
import { listUsers } from "@/services/user-management-service";
import { registerUserAction } from "./actions";
import UserList from "./user-list";

export const instant = false;

export default async function UsersPage({ searchParams }) {
  await requireRole(["Administrator"]);

  const users = await listUsers();
  const params = await searchParams;

  const errorMessages = {
    INVALID_USER_DATA: "Data pengguna tidak valid.",
    USER_EMAIL_ALREADY_EXISTS: "Email sudah terdaftar.",
    GOOGLE_ID_ALREADY_LINKED: "Identitas Google sudah digunakan.",
    USER_REGISTRATION_FAILED: "Pendaftaran pengguna gagal.",
  };

  return (
    <main>
      <h1>Manajemen Pengguna</h1>

      <p>Kelola akun Administrator dan Guru yang memiliki akses ke sistem.</p>

      {params?.success === "created" && <p>Pengguna berhasil didaftarkan.</p>}

      {params?.error && <p>{errorMessages[params.error] || "Terjadi kesalahan."}</p>}

      <section>
        <h2>Tambah Pengguna</h2>

        <form action={registerUserAction}>
          <div>
            <label htmlFor="username">Username</label>
            <input id="username" name="username" type="text" autoComplete="username" required />
          </div>

          <div>
            <label htmlFor="full_name">Nama Lengkap</label>
            <input id="full_name" name="full_name" type="text" autoComplete="name" required />
          </div>

          <div>
            <label htmlFor="email">Email Google</label>
            <input id="email" name="email" type="email" autoComplete="email" required />
          </div>

          <div>
            <label htmlFor="gender">Jenis Kelamin</label>
            <select id="gender" name="gender" autoComplete="off" defaultValue="" required>
              <option value="" disabled>
                Pilih jenis kelamin
              </option>
              <option value="Laki-laki">Laki-laki</option>
              <option value="Perempuan">Perempuan</option>
            </select>
          </div>

          <div>
            <label htmlFor="role">Role</label>
            <select id="role" name="role" autoComplete="off" defaultValue="Guru" required>
              <option value="Guru">Guru</option>
              <option value="Administrator">Administrator</option>
            </select>
          </div>

          <button type="submit">Daftarkan Pengguna</button>
        </form>
      </section>

      <UserList initialUsers={users} />
    </main>
  );
}
