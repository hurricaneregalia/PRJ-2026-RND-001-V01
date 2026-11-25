import Link from "next/link";
import { redirect } from "next/navigation";

import { connection } from "next/server";

import { auth } from "@/auth";
import { getAbsensiById, updateAbsensi } from "@/repositories/absensi-repository";
import {
  listAbsensiDetailByAbsensiId,
  updateAbsensiDetail,
} from "@/repositories/absensi-detail-repository";
import { getKelasById } from "@/repositories/kelas-repository";
import { getSiswaById } from "@/repositories/siswa-repository";
import { KEHADIRAN_STATUSES } from "@/lib/domain-constants";
import { recordAuditUpdate } from "@/repositories/audit-log-repository";

export const instant = false;

export const metadata = {
  title: "Edit Absensi",
};

export default async function EditAbsensiPage({ params }) {
  await connection();
  const { absensiId } = await params;
  const absensi = await getAbsensiById(absensiId);

  if (!absensi) {
    return (
      <main>
        <h1>Absensi tidak ditemukan</h1>
        <p>
          <Link href="/admin/absensi">Kembali ke Manajemen Absensi</Link>
        </p>
      </main>
    );
  }

  const detail = await listAbsensiDetailByAbsensiId(absensiId);
  const kelas = await getKelasById(absensi.kelas_id);
  const siswaList = await Promise.all(
    detail.map(async (item) => ({
      detail: item,
      siswa: await getSiswaById(item.siswa_id),
    })),
  );

  async function simpanAbsensi(formData) {
    "use server";

    const session = await auth();
    const before = await getAbsensiById(absensiId);
    const after = await updateAbsensi(absensiId, {
      tanggal: formData.get("tanggal"),
      jam_mulai: formData.get("jam_mulai"),
      jam_selesai: formData.get("jam_selesai"),
      topik: formData.get("topik"),
      status_absensi: formData.get("status_absensi"),
    });

    for (const item of detail) {
      await updateAbsensiDetail(item.absensi_detail_id, {
        status_kehadiran:
          formData.get(`status_${item.absensi_detail_id}`) ||
          item.status_kehadiran,
        catatan: formData.get(`catatan_${item.absensi_detail_id}`) || "",
        updated_by: session?.user?.id || "",
      });
    }

    await recordAuditUpdate({
      tableName: "absensi",
      recordId: absensiId,
      userId: session?.user?.id || "",
      before,
      after,
      note: "Perubahan absensi dari halaman admin",
    });

    redirect(`/admin/absensi/${absensiId}`);
  }

  return (
    <main>
      <header>
        <h1>Edit Absensi</h1>
        <p>
          <Link href="/admin">Dashboard</Link> /{" "}
          <Link href="/admin/absensi">Manajemen Absensi</Link> / Edit Absensi
        </p>
      </header>

      <form action={simpanAbsensi}>
        <section>
          <h2>Informasi Sesi</h2>
          <p>Kelas: {kelas?.nama_kelas || absensi.kelas_id}</p>
          <p>
            <label htmlFor="tanggal">Tanggal</label>
            <br />
            <input
              id="tanggal"
              name="tanggal"
              type="date"
              defaultValue={absensi.tanggal}
              required
            />
          </p>
          <p>
            <label htmlFor="jam_mulai">Jam Mulai</label>
            <br />
            <input
              id="jam_mulai"
              name="jam_mulai"
              type="time"
              defaultValue={absensi.jam_mulai}
            />
          </p>
          <p>
            <label htmlFor="jam_selesai">Jam Selesai</label>
            <br />
            <input
              id="jam_selesai"
              name="jam_selesai"
              type="time"
              defaultValue={absensi.jam_selesai}
            />
          </p>
          <p>
            <label htmlFor="topik">Topik</label>
            <br />
            <input
              id="topik"
              name="topik"
              type="text"
              defaultValue={absensi.topik}
            />
          </p>
          <p>
            <label htmlFor="status_absensi">Status Absensi</label>
            <br />
            <select
              id="status_absensi"
              name="status_absensi"
              defaultValue={absensi.status_absensi}
            >
              <option value="draft">Draft</option>
              <option value="final">Final</option>
            </select>
          </p>
        </section>

        <section>
          <h2>Kehadiran Siswa</h2>
          {siswaList.length === 0 ? (
            <p>Belum ada data kehadiran siswa.</p>
          ) : (
            <ol>
              {siswaList.map(({ detail: item, siswa }) => (
                <li key={item.absensi_detail_id}>
                  {siswa?.nis || "-"} | {siswa?.nama || item.siswa_id} |{" "}
                  <label htmlFor={`status_${item.absensi_detail_id}`}>
                    Status
                  </label>{" "}
                  <select
                    id={`status_${item.absensi_detail_id}`}
                    name={`status_${item.absensi_detail_id}`}
                    defaultValue={item.status_kehadiran}
                  >
                    {KEHADIRAN_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>{" "}
                  <label htmlFor={`catatan_${item.absensi_detail_id}`}>
                    Catatan
                  </label>{" "}
                  <input
                    id={`catatan_${item.absensi_detail_id}`}
                    name={`catatan_${item.absensi_detail_id}`}
                    type="text"
                    defaultValue={item.catatan}
                  />
                </li>
              ))}
            </ol>
          )}
        </section>

        <p>
          <button type="submit">Simpan Perubahan</button>
        </p>
      </form>
    </main>
  );
}
