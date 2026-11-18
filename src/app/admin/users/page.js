import { requireRole } from "@/lib/authorization";
import { listUsers } from "@/services/user-management-service";
import { registerUserAction } from "./actions";

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
            <input id="username" name="username" type="text" required />
          </div>

          <div>
            <label htmlFor="full_name">Nama Lengkap</label>
            <input id="full_name" name="full_name" type="text" required />
          </div>

          <div>
            <label htmlFor="email">Email Google</label>
            <input id="email" name="email" type="email" required />
          </div>

          <div>
            <label htmlFor="gender">Jenis Kelamin</label>
            <select id="gender" name="gender" defaultValue="" required>
              <option value="" disabled>
                Pilih jenis kelamin
              </option>
              <option value="Laki-laki">Laki-laki</option>
              <option value="Perempuan">Perempuan</option>
            </select>
          </div>

          <div>
            <label htmlFor="role">Role</label>
            <select id="role" name="role" defaultValue="Guru" required>
              <option value="Guru">Guru</option>
              <option value="Administrator">Administrator</option>
            </select>
          </div>

          <button type="submit">Daftarkan Pengguna</button>
        </form>
      </section>

      <section>
        <h2>Daftar Pengguna ({users.length})</h2>

        {users.length === 0 ? (
          <p>Belum ada pengguna terdaftar.</p>
        ) : (
          <ul>
            {users.map((user) => (
              <li key={user.user_id}>
                <h3>{user.full_name}</h3>

                <p>Username: {user.username}</p>
                <p>Email: {user.email}</p>
                <p>Role: {user.role}</p>
                <p>Status: {user.account_status}</p>

                <a href={`/admin/users/${encodeURIComponent(user.user_id)}`}>Lihat Detail</a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
