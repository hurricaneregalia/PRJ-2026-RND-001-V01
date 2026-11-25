import Link from "next/link";

import { connection } from "next/server";

import { listAbsensi } from "@/repositories/absensi-repository";
import { listAbsensiDetail } from "@/repositories/absensi-detail-repository";
import { listKelas } from "@/repositories/kelas-repository";
import { listSiswa } from "@/repositories/siswa-repository";

function shiftDate(dateText, days) {
  const date = new Date(`${dateText}T00:00:00`);
  date.setDate(date.getDate() + days);
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export const instant = false;

export const metadata = {
  title: "Pemantauan Ketidakhadiran",
};

export default async function DaftarPemantauanPage() {
  await connection();
  const absensi = await listAbsensi();
  const detail = await listAbsensiDetail();
  const kelas = await listKelas();
  const siswa = await listSiswa();
  const kelasById = new Map(kelas.map((item) => [item.kelas_id, item]));
  const siswaById = new Map(siswa.map((item) => [item.siswa_id, item]));

  const periodStart = shiftDate(new Date().toISOString().slice(0, 10), -30);
  const monitored = new Map();

  for (const item of absensi) {
    if (item.tanggal < periodStart || item.status_absensi !== "final") {
      continue;
    }

    const kelasItem = kelasById.get(item.kelas_id);
    if (!kelasItem) {
      continue;
    }

    const kelasDetail = detail.filter(
      (detailItem) => detailItem.absensi_id === item.absensi_id && detailItem.status_kehadiran === "alfa",
    );

    for (const detailItem of kelasDetail) {
      const key = `${detailItem.siswa_id}|${item.kelas_id}`;
      const current = monitored.get(key) || {
        siswa_id: detailItem.siswa_id,
        kelas_id: item.kelas_id,
        jumlah_alpa: 0,
        terakhir: "",
      };
      current.jumlah_alpa += 1;
      current.terakhir = item.tanggal;
      monitored.set(key, current);
    }
  }

  const daftar = [...monitored.values()]
    .map((item) => ({
      ...item,
      siswa: siswaById.get(item.siswa_id),
      kelas: kelasById.get(item.kelas_id),
    }))
    .filter((item) => item.jumlah_alpa >= 3)
    .sort((a, b) => b.jumlah_alpa - a.jumlah_alpa);

  return (
    <main>
      <header>
        <h1>Pemantauan Ketidakhadiran</h1>
        <p>
          <Link href="/admin">Dashboard</Link> /{" "}
          <Link href="/admin/pemantauan">Pemantauan Ketidakhadiran</Link>
        </p>
        <p>
          Menampilkan siswa dengan jumlah alfa pada 30 hari terakhir, ambang minimal 3.
        </p>
      </header>

      <section>
        <h2>Daftar Pemantauan</h2>
        {daftar.length === 0 ? (
          <p>Belum ada siswa yang mencapai ambang pemantauan.</p>
        ) : (
          <ol>
            {daftar.map((item, index) => (
              <li key={`${item.siswa_id}-${item.kelas_id}`}>
                {index + 1}. {item.siswa?.nama || item.siswa_id} | NIS{" "}
                {item.siswa?.nis || "-"} | {item.kelas?.nama_kelas || item.kelas_id} |{" "}
                Jumlah Alfa: {item.jumlah_alpa} | Terakhir: {item.terakhir}
              </li>
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}
