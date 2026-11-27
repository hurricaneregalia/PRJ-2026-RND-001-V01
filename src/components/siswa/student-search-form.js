"use client";

import { useEffect, useState, useTransition } from "react";

import { useRouter } from "next/navigation";

const PERIODE_OPTIONS = [
  { value: "30", label: "30 hari terakhir" },
  { value: "90", label: "3 bulan terakhir" },
  { value: "180", label: "6 bulan terakhir" },
  { value: "365", label: "1 tahun terakhir" },
];

export default function StudentSearchForm({ defaultQ = "", selectedPeriode = "180", sudahCari = false, children }) {
  const [q, setQ] = useState(defaultQ);
  const [periode, setPeriode] = useState(selectedPeriode);
  const [siap, setSiap] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    if (sudahCari) {
      const navigation = performance.getEntriesByType("navigation")[0];

      if (navigation?.type === "reload") {
        router.replace("/siswa");
        return;
      }
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSiap(true);
  }, [sudahCari, router]);

  const dirty = q !== defaultQ || periode !== selectedPeriode;

  function handleSubmit(event) {
    event.preventDefault();

    const params = new URLSearchParams({
      cari: "1",
      q,
      periode,
    });

    startTransition(() => {
      router.push(`/siswa?${params.toString()}`);
    });
  }

  return (
    <>
      <section>
        <form method="get" onSubmit={handleSubmit}>
          <input type="hidden" name="cari" value="1" />
          <p>
            <label htmlFor="q">Masukan informasi siswa</label>
            <br />
            <input id="q" name="q" type="search" value={q} onChange={(event) => setQ(event.target.value)} />
          </p>
          <p>Pencarian dilakukan berdasarkan NIS dan nama siswa.</p>
          <fieldset>
            <legend>Periode Absensi</legend>
            {PERIODE_OPTIONS.map((option) => (
              <label key={option.value} htmlFor={`periode_${option.value}`}>
                <input id={`periode_${option.value}`} type="radio" name="periode" value={option.value} checked={periode === option.value} onChange={(event) => setPeriode(event.target.value)} />{" "}
                {option.label}
              </label>
            ))}
          </fieldset>
          <button type="submit" disabled={isPending}>
            Cari
          </button>
        </form>
      </section>

      {siap ? (
        isPending ? (
          <p>Mencari...</p>
        ) : (
          <>
            {sudahCari && dirty ? <p>Filter atau kata kunci berubah. Tekan Cari untuk memperbarui hasil.</p> : null}
            {children}
          </>
        )
      ) : null}
    </>
  );
}
