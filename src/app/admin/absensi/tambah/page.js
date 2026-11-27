import Link from "next/link";
import { redirect } from "next/navigation";

import { connection } from "next/server";

import { auth } from "@/auth";
import { createAbsensi } from "@/repositories/absensi-repository";
import { createAbsensiDetail } from "@/repositories/absensi-detail-repository";
import { listKelas } from "@/repositories/kelas-repository";
import EntitySelect from "@/components/ui/entity-select";
import {
  listKelasSiswa,
  listKelasSiswaByKelasId,
} from "@/repositories/kelas-siswa-repository";
import { listSiswa } from "@/repositories/siswa-repository";
import { listJadwal } from "@/repositories/jadwal-repository";
import { KEHADIRAN_STATUSES } from "@/lib/domain-constants";
import { recordAuditCreate } from "@/repositories/audit-log-repository";
import ClassCapacityLabel from "@/components/ui/class-capacity-label";

export const instant = false;

export const metadata = {
  title: "Input Absensi",
};

export default async function TambahAbsensiPage({ searchParams }) {
  await connection();
  const params = await searchParams;
  const selectedKelasId =
    typeof params?.kelas_id === "string"
      ? params.kelas_id
      : typeof params?.kelasId === "string"
        ? params.kelasId
        : "";
  const kelas = await listKelas();
  const activeKelas = kelas
    .filter((item) => item.status_kelas === "aktif")
    .sort((a, b) =>
      String(a.nama_kelas || "").localeCompare(String(b.nama_kelas || ""), "id", {
        sensitivity: "base",
      }),
    );
  const selectedKelas = activeKelas.find(
    (item) => item.kelas_id === selectedKelasId,
  );
  const memberships = await listKelasSiswa();
  const activeCountByKelas = new Map();

  memberships
    .filter((item) => item.status_keanggotaan === "aktif")
    .forEach((item) => {
      activeCountByKelas.set(
        item.kelas_id,
        (activeCountByKelas.get(item.kelas_id) || 0) + 1,
      );
    });

  const jadwal = await listJadwal();
  const selectedJadwal = selectedKelas
    ? jadwal.find((item) => item.kelas_id === selectedKelas.kelas_id)
    : null;

  let students = [];

  if (selectedKelas) {
    const memberships = await listKelasSiswaByKelasId(selectedKelas.kelas_id);
    const activeMemberships = memberships.filter(
      (item) => item.status_keanggotaan === "aktif",
    );
    const siswa = await listSiswa();
    const siswaById = new Map(siswa.map((item) => [item.siswa_id, item]));
    students = activeMemberships
      .map((membership) => siswaById.get(membership.siswa_id))
      .filter(Boolean);
  }

  async function simpanAbsensi(formData) {
    "use server";

    const session = await auth();
    const created = await createAbsensi({
      kelas_id: formData.get("kelas_id"),
      jadwal_id: "",
      tanggal: formData.get("tanggal"),
      jam_mulai: formData.get("jam_mulai"),
      jam_selesai: formData.get("jam_selesai"),
      topik: formData.get("topik"),
      status_absensi: "final",
      created_by: session?.user?.id || "",
    });

    await recordAuditCreate({
      tableName: "absensi",
      recordId: created.absensi_id,
      userId: session?.user?.id || "",
      after: created,
      note: "Penambahan absensi dari halaman admin",
    });

    for (const student of students) {
      await createAbsensiDetail({
        absensi_id: created.absensi_id,
        siswa_id: student.siswa_id,
        status_kehadiran: formData.get(`status_${student.siswa_id}`) || "alfa",
        catatan: formData.get(`catatan_${student.siswa_id}`) || "",
        updated_by: session?.user?.id || "",
      });
    }

    redirect(`/admin/absensi/${created.absensi_id}`);
  }

  return (
    <main>
      <header>
        <h1>Input Absensi</h1>
        <p>Pilih kelas, lalu catat kehadiran siswa.</p>
        <p>
          <Link href="/admin">Dashboard</Link> /{" "}
          <Link href="/admin/absensi">Manajemen Absensi</Link> / Input Absensi
        </p>
      </header>

      <section>
        <h2>Pilih Kelas</h2>
        <form method="get">
          <p>
            <label htmlFor="kelasId">Kelas</label>
            <br />
            <EntitySelect
              id="kelasId"
              name="kelasId"
              items={activeKelas}
              value={selectedKelasId}
              placeholder="Pilih kelas aktif"
              labelKey="nama_kelas"
              valueKey="kelas_id"
            />
          </p>
          <p>
            <button type="submit">Tampilkan Siswa</button>
          </p>
        </form>
      </section>

      {selectedKelas && students.length === 0 ? (
        <section>
          <h2>Tidak Dapat Mengisi Absensi</h2>
          <p>Belum ada siswa yang masuk kelas {selectedKelas.nama_kelas}. Tambahkan siswa ke kelas ini terlebih dahulu sebelum mengisi absensi.</p>
        </section>
      ) : selectedKelas ? (
        <form action={simpanAbsensi}>
          <input type="hidden" name="kelas_id" value={selectedKelas.kelas_id} />
          <section>
            <h2>Informasi Sesi</h2>
            <p>
              Kelas: {selectedKelas.nama_kelas} ({selectedKelas.kode_kelas})
            </p>
            <p>
              <label htmlFor="tanggal">Tanggal (wajib)</label>
              <br />
              <input id="tanggal" name="tanggal" type="date" required />
            </p>
            <p>
              <label htmlFor="jam_mulai">Jam Mulai</label>
              <br />
              <input
                id="jam_mulai"
                name="jam_mulai"
                type="time"
                defaultValue={selectedJadwal?.jam_mulai || ""}
              />
            </p>
            <p>
              <label htmlFor="jam_selesai">Jam Selesai</label>
              <br />
              <input id="jam_selesai" name="jam_selesai" type="time" />
            </p>
            <p>
              <label htmlFor="topik">Topik</label>
              <br />
              <input id="topik" name="topik" type="text" />
            </p>
          </section>

          <section>
            <h2>Kehadiran Siswa</h2>
            {students.length === 0 ? (
              <p>Belum ada siswa aktif di kelas ini.</p>
            ) : (
              <ol>
                {students.map((student) => (
                  <li key={student.siswa_id}>
                    {student.nis || "-"} | {student.nama} |{" "}
                    <label htmlFor={`status_${student.siswa_id}`}>Status</label>{" "}
                    <select
                      id={`status_${student.siswa_id}`}
                      name={`status_${student.siswa_id}`}
                      defaultValue="hadir"
                    >
                      {KEHADIRAN_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>{" "}
                    <label htmlFor={`catatan_${student.siswa_id}`}>Catatan</label>{" "}
                    <input
                      id={`catatan_${student.siswa_id}`}
                      name={`catatan_${student.siswa_id}`}
                      type="text"
                    />
                  </li>
                ))}
              </ol>
            )}
          </section>

          <p>
            <button type="submit">Simpan Absensi</button>
          </p>
        </form>
      ) : (
        <p>Pilih kelas terlebih dahulu untuk menampilkan daftar siswa.</p>
      )}
    </main>
  );
}
