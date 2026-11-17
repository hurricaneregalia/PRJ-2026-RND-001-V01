import { signOut } from "@/auth";

export default function LogoutPage() {
  return (
    <main>
      <h1>Logout</h1>
      <p>Apakah kamu yakin ingin keluar dari akun?</p>

      <form
        action={async () => {
          "use server";
          await signOut({
            redirectTo: "/login",
          });
        }}
      >
        <button type="submit">Keluar</button>
      </form>
    </main>
  );
}
