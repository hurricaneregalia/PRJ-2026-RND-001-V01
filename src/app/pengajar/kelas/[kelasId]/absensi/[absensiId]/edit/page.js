import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { connection } from "next/server";

import { auth } from "@/auth";

import BackButton from "@/components/ui/back-button";
import FormatDate from "@/components/ui/format-date";
import { nowTimestamp } from "@/lib/date-time";
import { KEHADIRAN_STATUSES } from "@/lib/domain-constants";
import { listAbsensiDetailByAbsensiId } from "@/repositories/absensi-detail-repository";
import { listSiswa } from "@/repositories/siswa-repository";
import {
  getAbsensiForPengajar,
  getKelasForPengajar,
} from "@/services/teacher-scope-service";

import { simpanEditAbsensiPengajar } from "./actions";

export const instant = false;

export const metadata = {
  title: "Edit Absensi",
};

const RESULT_MESSAGES = {
  ok: "Perubahan absensi berhasil disimpan.",
  already_applied: "Perubahan absensi sudah tersimpan sebelumnya.",
  unchanged: "Tidak ada perubahan yang perlu disimpan.",
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

export default async function EditAbsensiPengajarPage({ params, searchParams }) {
  await connection();
  const user = await requirePengajar();
  const { kelasId, absensiId } = await params;
  const kelasResult = await getKelasForPengajar(user.id, kelasId, {
    requireActive: true,
  });
  const absensiResult = await getAbsensiForPengajar(user.id, kelasId, absensiId);

  if (
    kelasResult.status !== "ok" ||
    absensiResult.status !== "ok" ||
    absensiResult.data.status_absensi !== "final"
  ) {
    notFound();
  }

  const kelas = kelasResult.data;
  const absensi = absensiResult.data;
  const [detail, siswa] = await Promise.all([
    listAbsensiDetailByAbsensiId(absensiId),
    listSiswa(),
  ]);
  const siswaById = new Map(siswa.map((item) => [item.siswa_id, item]));
  const daftarSiswa = detail
    .map((item) => {
      const siswaData = siswaById.get(item.siswa_id);

      return {
        absensiDetailId: item.absensi_detail_id,
        nis: siswaData?.nis || "-",
        nama: siswaData?.nama || item.siswa_id,
        statusKehadiran: item.status_kehadiran,
        catatan: item.catatan || "",
      };
    })
    .sort((left, right) => left.nama.localeCompare(right.nama));

  const { status } = await searchParams;
  const pesanHasil = RESULT_MESSAGES[status] || "";
  const operationId = globalThis.crypto.randomUUID();
  const operationTimestamp = nowTimestamp();

  return (
    <main>
      <header>
        <h1>Edit Absensi</h1>
        <p>
          <Link href="/pengajar">Dashboard</Link> /{" "}
          <Link href="/pengajar/kelas">Kelas Saya</Link> /{" "}
          <Link href={`/pengajar/kelas/${kelasId}`}>Detail Kelas</Link> /{" "}
          <Link href={`/pengajar/kelas/${kelasId}/absensi/${absensiId}`}>
            Detail Absensi
          </Link>{" "}
          / Edit
        </p>
      </header>

      {pesanHasil && <p aria-live="polite">{pesanHasil}</p>}

      <form action={simpanEditAbsensiPengajar.bind(null, kelasId, absensiId)}>
        <input type="hidden" name="operationId" value={operationId} />
        <input type="hidden" name="operationTimestamp" value={operationTimestamp} />
        <input type="hidden" name="auditIds" value={JSON.stringify({})} />

        <section>
          <h2>Absensi Kelas: {kelas.nama_kelas || kelas.kelas_id}</h2>
          <p>
            Tanggal Absensi: <FormatDate tanggal={absensi.tanggal} />
          </p>
          <p>
            Waktu: {absensi.jam_mulai || "-"} - {absensi.jam_selesai || "-"}
          </p>
          <p>
            <label htmlFor="topik">Topik</label>
            <br />
            <input
              id="topik"
              name="topik"
              type="text"
              maxLength={500}
              defaultValue={absensi.topik || ""}
            />
          </p>
        </section>

        <section>
          <h2>Kehadiran Siswa</h2>
          {daftarSiswa.length === 0 ? (
            <p>Belum ada data kehadiran siswa.</p>
          ) : (
            <ol>
              {daftarSiswa.map((item) => (
                <li key={item.absensiDetailId}>
                  <input
                    type="hidden"
                    name="absensiDetailId"
                    value={item.absensiDetailId}
                  />
                  {item.nis} | {item.nama} |{" "}
                  <label htmlFor={`status_${item.absensiDetailId}`}>
                    Status Kehadiran
                  </label>{" "}
                  <select
                    id={`status_${item.absensiDetailId}`}
                    name={`status_${item.absensiDetailId}`}
                    defaultValue={item.statusKehadiran}
                  >
                    {KEHADIRAN_STATUSES.map((statusKehadiran) => (
                      <option key={statusKehadiran} value={statusKehadiran}>
                        {statusKehadiran}
                      </option>
                    ))}
                  </select>{" "}
                  <label htmlFor={`catatan_${item.absensiDetailId}`}>
                    Catatan
                  </label>{" "}
                  <input
                    id={`catatan_${item.absensiDetailId}`}
                    name={`catatan_${item.absensiDetailId}`}
                    type="text"
                    maxLength={500}
                    defaultValue={item.catatan}
                  />
                </li>
              ))}
            </ol>
          )}
        </section>

        <p>
          <button type="submit" disabled={daftarSiswa.length === 0}>
            Simpan Perubahan
          </button>
        </p>
      </form>

      <p>
        <BackButton btnText="Batal" />
      </p>
    </main>
  );
}
