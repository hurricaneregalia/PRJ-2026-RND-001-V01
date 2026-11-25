import Link from "next/link";

import { signIn } from "@/auth";

export const metadata = {
  title: "Login",
};

export default function LoginPage() {
  async function loginWithGoogle() {
    "use server";
    await signIn("google", { redirectTo: "/dashboard" });
  }

  return (
    <main>
      <header>
        <h1>Sistem Informasi Bimbingan Belajar</h1>
        <p>Platform pengelolaan kegiatan belajar, jadwal, dan kehadiran.</p>
      </header>

      <section>
        <h2>Selamat Datang</h2>
        <p>Silakan masuk menggunakan akun Google Anda untuk melanjutkan.</p>
        <form action={loginWithGoogle}>
          <button type="submit">Masuk dengan Google</button>
        </form>
      </section>

      <section>
        <ul>
          <li>Gunakan akun Google yang telah memiliki izin akses.</li>
        </ul>
      </section>

      <footer>
        <p>© 2026 Sistem Informasi Bimbingan Belajar</p>
        <p>Hubungi administrator jika mengalami kendala saat masuk.</p>
      </footer>
    </main>
  );
}
