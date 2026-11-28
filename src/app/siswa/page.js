import Link from "next/link";

import { connection } from "next/server";

import StudentSearchForm from "@/components/siswa/student-search-form";
import { listAbsensi } from "@/repositories/absensi-repository";
import { listAbsensiDetail } from "@/repositories/absensi-detail-repository";
import { searchSiswa } from "@/repositories/siswa-repository";

export const instant = false;

export const metadata = {
  title: "Pencarian Absensi Siswa",
};

const PERIODE_VALUES = new Set(["30", "90", "180", "365"]);

function normalisasiPeriode(value) {
  return PERIODE_VALUES.has(value) ? value : "180";
}

function tanggalMulaiPeriode(periodeHari, today) {
  const date = new Date(today);
  date.setUTCDate(date.getUTCDate() - (Number(periodeHari) - 1));
  return date.toISOString().slice(0, 10);
}

export default async function PencarianSiswaPage({ searchParams }) {
  await connection();
  const query = await searchParams;
  const q = typeof query?.q === "string" ? query.q : "";
  const periodeHari = normalisasiPeriode(typeof query?.periode === "string" ? query.periode : "");
  const sudahCari = query?.cari === "1";

  let hasil = [];
  let terpotong = false;
  let pesan = "";

  if (sudahCari) {
    const keyword = q.trim();

    if (!keyword) {
      pesan = "tulis identitas siswa";
    } else {
      const today = new Date().toISOString().slice(0, 10);
      const tanggalMulai = tanggalMulaiPeriode(periodeHari, today);
      const absensi = await listAbsensi();
      const absensiFinalIds = new Set(absensi.filter((item) => item.status_absensi === "final" && item.tanggal >= tanggalMulai && item.tanggal <= today).map((item) => item.absensi_id));
      const siswaDenganAbsensi = new Set((await listAbsensiDetail()).filter((item) => absensiFinalIds.has(item.absensi_id)).map((item) => item.siswa_id));
      const cocok = (await searchSiswa(keyword)).filter((item) => siswaDenganAbsensi.has(item.siswa_id));

      terpotong = cocok.length > 20;
      hasil = cocok.slice(0, 20);

      if (hasil.length === 0) {
        pesan = "Siswa tidak ditemukan";
      }
    }
  }

  return (
    <main>
      <header>
        <h1>Pencarian Absensi Siswa</h1>
        <p>
          <Link href="/sekolah">Informasi Sekolah</Link>
        </p>
      </header>

      <StudentSearchForm key={JSON.stringify([q, periodeHari, sudahCari])} defaultQ={q} selectedPeriode={periodeHari} sudahCari={sudahCari}>
        {sudahCari ? (
          pesan ? (
            <p>{pesan}</p>
          ) : (
            <>
              {terpotong ? <p>Hasil dibatasi 20.</p> : null}
              <ol>
                {hasil.map((item) => (
                  <li key={item.siswa_id}>
                    <Link href={`/siswa/${item.siswa_id}?periode=${periodeHari}`}>
                      {item.nama} | {item.nis || "-"}
                    </Link>
                  </li>
                ))}
              </ol>
            </>
          )
        ) : null}
      </StudentSearchForm>
    </main>
  );
}
