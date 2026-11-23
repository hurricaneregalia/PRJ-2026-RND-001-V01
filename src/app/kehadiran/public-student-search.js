"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function PublicStudentSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");

  function handleSubmit(event) {
    event.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    params.set("q", query);
    router.push(`/kehadiran?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="publicStudentSearch">Cari nama siswa</label>
      <input
        id="publicStudentSearch"
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Masukkan nama siswa"
      />
      <button type="submit">Cari</button>
    </form>
  );
}
