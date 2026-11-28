import Link from "next/link";
import { redirect } from "next/navigation";

import { connection } from "next/server";

import { auth } from "@/auth";

import { listJadwal } from "@/repositories/jadwal-repository";
import { listKelasSiswa } from "@/repositories/kelas-siswa-repository";
import { listKelasForPengajar } from "@/services/teacher-scope-service";

export const instant = false;

export const metadata = {
  title: "Kelas Saya",
};

async function requirePengajar() {
  const session = await auth();
  const user = session?.user;

  if (!user || user.bootstrapPending || user.accountStatus !== "active") {
    redirect("/login");
  }

  if (user.role === "Admin") {
    redirect("/admin");
  }

  if (user.role !== "Pengajar") {
    redirect("/login");
  }

  return user;
}

function formatJadwal(items) {
  if (!items || items.length === 0) {
    return "-";
  }

  return items
    .map((item) => `${item.hari || "-"} ${item.jam_mulai || "-"}–${item.jam_selesai || "-"}`)
    .join(", ");
}

export default async function KelasSayaPage() {
  await connection();
  const user = await requirePengajar();

  const [kelasResult, memberships, jadwal] = await Promise.all([
    listKelasForPengajar(user.id),
    listKelasSiswa(),
    listJadwal(),
  ]);

  const ownedKelas = kelasResult.status === "ok" ? kelasResult.data : [];
  const ownedKelasIds = new Set(ownedKelas.map((item) => item.kelas_id));
  const activeCountByKelas = new Map();
  const jadwalByKelas = new Map();

  for (const item of memberships) {
    if (item.status_keanggotaan !== "aktif" || !ownedKelasIds.has(item.kelas_id)) {
      continue;
    }

    activeCountByKelas.set(item.kelas_id, (activeCountByKelas.get(item.kelas_id) || 0) + 1);
  }

  for (const item of jadwal) {
    if (item.status_jadwal !== "aktif" || !ownedKelasIds.has(item.kelas_id)) {
      continue;
    }

    const current = jadwalByKelas.get(item.kelas_id) || [];
    current.push(item);
    jadwalByKelas.set(item.kelas_id, current);
  }

  return (
    <main>
      <header>
        <h1>Kelas Saya</h1>
        <p>
          <Link href="/pengajar">Dashboard</Link> / Kelas Saya
        </p>
      </header>
      <section>
        <h2>Daftar Kelas</h2>
        <ul>
          <li>No | Nama Kelas | Mata Pelajaran | Jadwal Rutin | Jumlah Siswa | Aksi</li>
          {ownedKelas.length === 0 ? (
            <li>Belum ada kelas aktif.</li>
          ) : (
            ownedKelas.map((item, index) => (
              <li key={item.kelas_id}>
                {index + 1} | {item.nama_kelas} | - | {formatJadwal(jadwalByKelas.get(item.kelas_id))} |{" "}
                {activeCountByKelas.get(item.kelas_id) || 0} |{" "}
                <Link href={`/pengajar/kelas/${item.kelas_id}`}>Lihat Kelas</Link>
              </li>
            ))
          )}
        </ul>
      </section>
    </main>
  );
}
