import { signIn } from "@/auth";

export default function LoginPage() {
  return (
    <main>
      <h1>Login</h1>

      <p>Masuk menggunakan akun Google. Jika belum ada Administrator, akun Google pertama akan digunakan untuk proses inisialisasi.</p>

      <form
        action={async () => {
          "use server";

          await signIn("google", {
            redirectTo: "/",
          });
        }}
      >
        <button type="submit">Login dengan Google</button>
      </form>
    </main>
  );
}
