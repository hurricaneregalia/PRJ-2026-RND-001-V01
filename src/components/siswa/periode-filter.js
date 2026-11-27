"use client";

import { usePathname, useRouter } from "next/navigation";

const PERIODE_OPTIONS = [
  { value: "30", label: "30 hari terakhir" },
  { value: "90", label: "3 bulan terakhir" },
  { value: "180", label: "6 bulan terakhir" },
  { value: "365", label: "1 tahun terakhir" },
];

export default function PeriodeFilter({ selected }) {
  const pathname = usePathname();
  const router = useRouter();

  function handleChange(event) {
    const value = event.target.value;

    router.push(value === "30" ? pathname : `${pathname}?periode=${value}`);
  }

  return (
    <fieldset>
      <legend>Periode</legend>
      {PERIODE_OPTIONS.map((option) => (
        <label key={option.value} htmlFor={`periode_${option.value}`}>
          <input
            id={`periode_${option.value}`}
            type="radio"
            name="periode"
            value={option.value}
            checked={selected === option.value}
            onChange={handleChange}
          />{" "}
          {option.label}
        </label>
      ))}
    </fieldset>
  );
}
