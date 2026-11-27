import Link from "next/link";
import { redirect } from "next/navigation";

import { connection } from "next/server";

import { auth } from "@/auth";
import { getAbsensiById, updateAbsensi } from "@/repositories/absensi-repository";
import { listAbsensiDetailByAbsensiId, updateAbsensiDetail } from "@/repositories/absensi-detail-repository";
import { getKelasById } from "@/repositories/kelas-repository";
import { getSiswaById } from "@/repositories/siswa-repository";
import { KEHADIRAN_STATUSES } from "@/lib/domain-constants";
import { recordAuditUpdate } from "@/repositories/audit-log-repository";
import FormatDate from "@/components/ui/format-date";

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
      tanggal: before?.tanggal ?? absensi.tanggal,
      jam_mulai: before?.jam_mulai ?? absensi.jam_mulai,
      jam_selesai: before?.jam_selesai ?? absensi.jam_selesai,
      topik: formData.get("topik"),
      status_absensi: "final",
    });

    for (const item of detail) {
      await updateAbsensiDetail(item.absensi_detail_id, {
        status_kehadiran: formData.get(`status_${item.absensi_detail_id}`) || item.status_kehadiran,
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
          <Link href="/admin">Dashboard</Link> / <Link href="/admin/absensi">Manajemen Absensi</Link> / Edit Absensi
        </p>
      </header>

      <form action={simpanAbsensi}>
        <section>
          <h2>Absensi Kelas: {kelas?.nama_kelas || absensi.kelas_id}</h2>
          <p>
            Tanggal Absensi: <FormatDate tanggal={absensi.tanggal} />
          </p>
          <p>
            Waktu: {absensi.jam_mulai} - {absensi.jam_selesai}
          </p>

          <p>
            <label htmlFor="topik">Topik</label>
            <br />
            <input id="topik" name="topik" type="text" defaultValue={absensi.topik} />
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
                  {siswa?.nis || "-"} | {siswa?.nama || item.siswa_id} | <label htmlFor={`status_${item.absensi_detail_id}`}>Status</label>{" "}
                  <select id={`status_${item.absensi_detail_id}`} name={`status_${item.absensi_detail_id}`} defaultValue={item.status_kehadiran}>
                    {KEHADIRAN_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>{" "}
                  <label htmlFor={`catatan_${item.absensi_detail_id}`}>Catatan</label>{" "}
                  <input id={`catatan_${item.absensi_detail_id}`} name={`catatan_${item.absensi_detail_id}`} type="text" defaultValue={item.catatan} />
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
