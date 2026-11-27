import Link from "next/link";

import { connection } from "next/server";

import { getUserById } from "@/repositories/user-repository";
import StatusBadge from "@/components/ui/status-badge";
import { formatJenisKelamin } from "@/lib/domain-labels";
import { listKelas } from "@/repositories/kelas-repository";
import { listKelasSiswa } from "@/repositories/kelas-siswa-repository";
import { listSiswa } from "@/repositories/siswa-repository";
import { listAbsensi } from "@/repositories/absensi-repository";
import { listAbsensiDetail } from "@/repositories/absensi-detail-repository";

export const instant = false;

export const metadata = {
  title: "Detail Pengguna",
};

export default async function DetailUserPage({ params }) {
  await connection();
  const { userId } = await params;
  const user = await getUserById(userId);

  if (!user) {
    return (
      <main>
        <h1>Pengguna tidak ditemukan</h1>
        <p>
          <Link href="/admin/users">Kembali ke Manajemen Pengguna</Link>
        </p>
      </main>
    );
  }

  const isPengajar = user.role === "Pengajar";
  const kelasPengajar = isPengajar ? (await listKelas()).filter((item) => item.pengajar_id === user.user_id && item.status_kelas === "aktif") : [];
  const kelasIds = new Set(kelasPengajar.map((item) => item.kelas_id));
  const memberships = isPengajar ? (await listKelasSiswa()).filter((item) => kelasIds.has(item.kelas_id) && item.status_keanggotaan === "aktif") : [];
  const siswaList = isPengajar ? await listSiswa() : [];
  const siswaById = new Map(siswaList.map((item) => [item.siswa_id, item]));
  const membershipsByKelas = new Map();
  for (const item of memberships) {
    const list = membershipsByKelas.get(item.kelas_id) || [];
    list.push(item);
    membershipsByKelas.set(item.kelas_id, list);
  }
  const absensi = await listAbsensi();
  const detail = await listAbsensiDetail();
  const finalAbsensiIds = new Set(absensi.filter((item) => item.status_absensi === "final").map((item) => item.absensi_id));
  const rekapBySiswa = new Map();
  detail.forEach((item) => {
    if (!finalAbsensiIds.has(item.absensi_id)) {
      return;
    }
    const rekap = rekapBySiswa.get(item.siswa_id) || { hadir: 0, izin: 0, sakit: 0, alfa: 0 };
    if (rekap[item.status_kehadiran] !== undefined) {
      rekap[item.status_kehadiran] += 1;
    }
    rekapBySiswa.set(item.siswa_id, rekap);
  });
  const statusKelasTersedia = user.limit_kelas - kelasPengajar.length > 0 ? "Tersedia" : "Penuh";
  return (
    <main>
      <header>
        <h1>Detail Pengguna</h1>
        <p>
          <Link href="/admin">Dashboard</Link> / <Link href="/admin/users">Manajemen Pengguna</Link> / Detail Pengguna
        </p>
      </header>

      <section>
        <h2> {user.name}</h2>
        <ul>
          <li>ID: {user.user_id}</li>
          <li>Email: {user.email || "-"}</li>
          <li>Jenis Kelamin: {formatJenisKelamin(user.jenis_kelamin)}</li>
          <li>Jenis Akun: {user.role}</li>
          <li>Status Akun: <StatusBadge value={user.account_status} /></li>
          <li>Nomor WhatsApp: {user.no_hp || "-"}</li>
          {isPengajar ? (
            <>
              <li>Limit Kelas: {user.limit_kelas ?? 0}</li>
              <li>Kelas Aktif: {kelasPengajar.length}</li>
              <li>Sisa Kuota Kelas: {user.limit_kelas - kelasPengajar.length}</li>
              <li>Status Kelas: {statusKelasTersedia}</li>
            </>
          ) : null}
        </ul>
        <p>
          <Link href={`/admin/users/${user.user_id}/edit`}>Edit</Link>
        </p>
      </section>

      {isPengajar ? (
        <section>
          <h2>Kelas</h2>
          {user.limit_kelas > 0 && kelasPengajar.length < user.limit_kelas ? (
            <p>
              <Link href={`/admin/kelas/tambah?user_id=${user.user_id}`}>Tambah Kelas</Link>
            </p>
          ) : null}
          {kelasPengajar.length === 0 ? (
            <p>Pengajar ini belum memiliki kelas aktif.</p>
          ) : (
            <ol>
              {kelasPengajar.map((kelas) => {
                const siswaKelas = (membershipsByKelas.get(kelas.kelas_id) || []).map((item) => siswaById.get(item.siswa_id)).filter((item) => Boolean(item) && item.status === "aktif");

                const jumlahLakiLaki = siswaKelas.filter((siswa) => siswa.jenis_kelamin === "L").length;

                const jumlahPerempuan = siswaKelas.filter((siswa) => siswa.jenis_kelamin === "P").length;

                const kapasitasKelasLabel = siswaKelas.length < kelas.kapasitas ? `${kelas.kapasitas - (siswaKelas.length || 0)} kursi tersedia` : "Penuh";

                return (
                  <li key={kelas.kelas_id}>
                    <Link href={`/admin/kelas/${kelas.kelas_id}`}>{kelas.nama_kelas}</Link> | Kapasitas Kelas ({siswaKelas.length}/{kelas.kapasitas}) | {kapasitasKelasLabel} | <Link href={`/admin/absensi/tambah?kelas_id=${kelas.kelas_id}`}>Isi Absensi</Link>
                    <ol>
                      {siswaKelas.map((siswa) => {
                        const rekap = rekapBySiswa.get(siswa.siswa_id) || { hadir: 0, izin: 0, sakit: 0, alfa: 0 };

                        return (
                          <li key={siswa.siswa_id}>
                            {siswa.nama} | {siswa.nis} | {formatJenisKelamin(siswa.jenis_kelamin)} | Hadir {rekap.hadir} | Izin {rekap.izin} | Sakit {rekap.sakit} | Alfa {rekap.alfa}
                          </li>
                        );
                      })}
                    </ol>
                    <ul>
                      <li>Jumlah Siswa: {siswaKelas.length}</li>
                      <li>Jumlah Laki-laki: {jumlahLakiLaki}</li>
                      <li>Jumlah Perempuan: {jumlahPerempuan}</li>
                    </ul>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      ) : (
        <></>
      )}
    </main>
  );
}
