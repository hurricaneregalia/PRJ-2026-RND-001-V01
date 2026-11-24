"use client";

export default function Error({ reset }) {
  return (
    <main>
      <h1>Terjadi kesalahan</h1>
      <p>Halaman gagal dimuat. Silakan coba lagi.</p>
      <button type="button" onClick={() => reset()}>
        Coba lagi
      </button>
    </main>
  );
}