import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { createAdministrator } from "./actions";

export const instant = false;

export default async function SetupAdminPage({ searchParams }) {
  if (process.env.NODE_ENV !== "development") {
    redirect("/login");
  }

  const session = await auth();

  if (!session?.user?.bootstrapPending || !session.user.authUserId) {
    redirect("/");
  }

  const params = await searchParams;
  const error = params?.error;
  const success = params?.success;

  const errorMessages = {
    INVALID_ADMIN_DATA: "Data Administrator tidak valid.",
    USERS_HEADER_NOT_FOUND: "Header Users tidak ditemukan.",
    USERS_HEADER_INVALID: "Struktur header Users tidak sesuai.",
    ADMIN_BOOTSTRAP_ALREADY_USED: "Administrator pertama sudah dibuat.",
    BOOTSTRAP_FAILED: "Terjadi kesalahan saat membuat Administrator.",
  };

  return (
    <main>
      <h1>Inisialisasi Administrator</h1>

      <p>Akun Google: {session.user.email}</p>

      {success === "1" && <p>Administrator berhasil dibuat.</p>}

      {error && <p>{errorMessages[error] || "Terjadi kesalahan."}</p>}

      <form action={createAdministrator}>
        <div>
          <label htmlFor="username">Username</label>
          <input id="username" name="username" type="text" autoComplete="username" required />{" "}
        </div>

        <div>
          <label htmlFor="gender">Jenis Kelamin</label>
          <select id="gender" name="gender" required defaultValue="">
            <option value="" disabled>
              Pilih jenis kelamin
            </option>
            <option value="Laki-laki">Laki-laki</option>
            <option value="Perempuan">Perempuan</option>
          </select>
        </div>

        <button type="submit">Buat Administrator</button>
      </form>
    </main>
  );
}
