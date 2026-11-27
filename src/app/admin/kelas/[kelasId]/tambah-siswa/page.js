import Link from "next/link";
import { redirect } from "next/navigation";

import { connection } from "next/server";

import { auth } from "@/auth";
import BackButton from "@/components/ui/back-button";
import ClassCapacityLabel from "@/components/ui/class-capacity-label";
import { getKelasById } from "@/repositories/kelas-repository";
import {
  createKelasSiswa,
  listKelasSiswa,
} from "@/repositories/kelas-siswa-repository";
import { listSiswa } from "@/repositories/siswa-repository";
import { getUserById } from "@/repositories/user-repository";
import { recordAuditCreate } from "@/repositories/audit-log-repository";
import { todayDate } from "@/lib/date-time";

export const instant = false;

export const metadata = {
  title: "Tambah Siswa ke Kelas",
};

export default async function TambahSiswaKelasPage({ params }) {
  await connection();
  const { kelasId } = await params;
  const kelas = await getKelasById(kelasId);

  if (!kelas) {
    return (
      <main>
        <h1>Kelas tidak ditemukan</h1>
        <p>
          <Link href="/admin/kelas">Kembali ke Manajemen Kelas</Link>
        </p>
      </main>
    );
  }

  const pengajar = await getUserById(kelas.pengajar_id);
  const siswa = await listSiswa();
  const memberships = await listKelasSiswa();
  const activeSiswaIds = new Set(
    memberships
      .filter((item) => item.status_keanggotaan === "aktif")
      .map((item) => item.siswa_id),
  );
  const jumlahTerisi = memberships.filter(
    (item) => item.kelas_id === kelas.kelas_id && item.status_keanggotaan === "aktif",
  ).length;
  const kapasitas = Number(kelas.kapasitas || 0);
  const kapasitasPenuh = jumlahTerisi >= kapasitas;
  const kelasAktif = kelas.status_kelas === "aktif";
  const bisaMenambah = kelasAktif && !kapasitasPenuh;
  const siswaTersedia = siswa.filter(
    (item) => item.status === "aktif" && !activeSiswaIds.has(item.siswa_id),
  );

  async function simpanSiswa(formData) {
    "use server";

    const session = await auth();
    const selectedIds = [...formData.keys()]
      .filter((key) => key.startsWith("siswa_"))
      .map((key) => formData.get(key))
      .filter(Boolean);

    const kelasTujuan = await getKelasById(kelasId);
    const semuaMembership = await listKelasSiswa();
    const terisi = semuaMembership.filter(
      (item) => item.kelas_id === kelasId && item.status_keanggotaan === "aktif",
    ).length;

    if (
      !kelasTujuan ||
      kelasTujuan.status_kelas !== "aktif" ||
      terisi >= Number(kelasTujuan.kapasitas || 0)
    ) {
      redirect(`/admin/kelas/${kelasId}`);
    }

    const siswaAktifIds = new Set(
      semuaMembership
        .filter((item) => item.status_keanggotaan === "aktif")
        .map((item) => item.siswa_id),
    );
    const validIds = selectedIds.filter((siswaId) => !siswaAktifIds.has(siswaId));

    for (const siswaId of validIds) {
      const membership = await createKelasSiswa({
        kelas_id: kelasId,
        siswa_id: siswaId,
        tanggal_mulai: todayDate(),
        status_keanggotaan: "aktif",
      });

      await recordAuditCreate({
        tableName: "kelas_siswa",
        recordId: membership.kelas_siswa_id,
        userId: session?.user?.id || "",
        after: membership,
        note: "Penambahan siswa ke kelas dari halaman tambah siswa",
      });
    }

    redirect(`/admin/kelas/${kelasId}`);
  }

  return (
    <main>
      <header>
        <h1>Tambah Siswa ke Kelas {kelas.nama_kelas}</h1>
        <p>
          <Link href="/admin">Dashboard</Link> /{" "}
          <Link href="/admin/kelas">Manajemen Kelas</Link> /{" "}
          <Link href={`/admin/kelas/${kelas.kelas_id}`}>Detail Kelas</Link> / Tambah Siswa
        </p>
        <p>Pengajar: {pengajar?.name || kelas.pengajar_id}</p>
        <p>
          <ClassCapacityLabel
            namaKelas={kelas.nama_kelas}
            terisi={jumlahTerisi}
            kapasitas={kelas.kapasitas}
          />{" "}
          | {kelas.status_kelas}
        </p>
      </header>

      {!kelasAktif ? (
        <p>
          Kelas ini tidak aktif. Penambahan siswa tidak dapat dilakukan. Gunakan{" "}
          <Link href={`/admin/kelas/${kelas.kelas_id}/pindah-kelas`}>Pindah Kelas</Link> untuk
          memindahkan siswa.
        </p>
      ) : kapasitasPenuh ? (
        <p>
          Kapasitas kelas sudah penuh. Penambahan siswa tidak dapat dilakukan. Gunakan{" "}
          <Link href={`/admin/kelas/${kelas.kelas_id}/pindah-kelas`}>Pindah Kelas</Link> untuk
          memindahkan siswa.
        </p>
      ) : null}

      <section>
        <h2>Daftar Siswa Tersedia</h2>
        {siswaTersedia.length === 0 ? (
          <p>Belum ada siswa yang memenuhi syarat untuk ditambahkan.</p>
        ) : (
          <form action={simpanSiswa}>
            <p>Pilih siswa aktif yang akan ditambahkan ke kelas ini.</p>
            <p>{siswaTersedia.length} siswa tersedia</p>
            <ul>
              {siswaTersedia.map((item, index) => (
                <li key={item.siswa_id}>
                  <label>
                    <input
                      type="checkbox"
                      name={`siswa_${item.siswa_id}`}
                      value={item.siswa_id}
                      disabled={!bisaMenambah}
                    />{" "}
                    {index + 1} | {item.nis || "-"} | {item.nama} | {item.jenis_kelamin || "-"}
                  </label>
                </li>
              ))}
            </ul>
            <footer>
              <BackButton btnText="Batal" />
              <button type="submit" disabled={!bisaMenambah}>
                Tambahkan Siswa
              </button>
            </footer>
          </form>
        )}
        {siswaTersedia.length === 0 ? (
          <footer>
            <BackButton btnText="Kembali" />
          </footer>
        ) : null}
      </section>
    </main>
  );
}
