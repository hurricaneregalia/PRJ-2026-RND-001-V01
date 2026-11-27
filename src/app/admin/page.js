import Link from "next/link";

import { connection } from "next/server";

import { listAbsensi } from "@/repositories/absensi-repository";
import { listAbsensiDetail } from "@/repositories/absensi-detail-repository";
import { listKelas } from "@/repositories/kelas-repository";
import { listKelasSiswa } from "@/repositories/kelas-siswa-repository";
import { listSiswa } from "@/repositories/siswa-repository";
import MonitoringList from "@/components/ui/monitoring-list";
import { listJadwal } from "@/repositories/jadwal-repository";
import { listUsers } from "@/repositories/user-repository";
import CapacityInfo from "@/components/ui/capacity-info";
import LinkDetail from "@/components/ui/link-detail";
import ClassCard from "@/components/ui/class-card";
import AdminList from "@/components/ui/admin-list";
import ClassCapacityLabel from "@/components/ui/class-capacity-label";

import { todayDate } from "@/lib/date-time";
import TeacherCapacityLabel from "@/components/ui/teacher-capacity-label";

export const instant = false;

export const metadata = {
  title: "Admin Dashboard",
};

function shiftDate(dateText, days) {
  const date = new Date(`${dateText}T00:00:00`);
  date.setDate(date.getDate() + days);
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export default async function AdminDashboardPage() {
  await connection();
  const absensi = await listAbsensi();
  const detail = await listAbsensiDetail();
  const kelas = await listKelas();
  const finalAbsensiIds = new Set(absensi.filter((item) => item.status_absensi === "final").map((item) => item.absensi_id));
  const detailFinal = detail.filter((item) => finalAbsensiIds.has(item.absensi_id));
  const memberships = await listKelasSiswa();
  const siswa = await listSiswa();
  const users = await listUsers();
  const userById = new Map(users.map((item) => [item.user_id, item]));
  const siswaById = new Map(siswa.map((item) => [item.siswa_id, item]));
  const kelasById = new Map(kelas.map((item) => [item.kelas_id, item]));
  const jadwal = await listJadwal();
  const jadwalByKelasId = new Map(jadwal.map((item) => [item.kelas_id, item]));
  const kelasTanpaJadwal = kelas.filter((item) => item.status_kelas === "aktif" && !jadwalByKelasId.has(item.kelas_id));

  const counts = detailFinal.reduce(
    (result, item) => {
      result[item.status_kehadiran] = (result[item.status_kehadiran] || 0) + 1;
      return result;
    },
    { hadir: 0, izin: 0, sakit: 0, alfa: 0 },
  );
  const totalKehadiran = detailFinal.length;
  const persentaseByStatus =
    totalKehadiran === 0
      ? { hadir: 0, izin: 0, sakit: 0, alfa: 0 }
      : {
          hadir: Math.round((counts.hadir / totalKehadiran) * 1000) / 10,
          izin: Math.round((counts.izin / totalKehadiran) * 1000) / 10,
          sakit: Math.round((counts.sakit / totalKehadiran) * 1000) / 10,
          alfa: Math.round((counts.alfa / totalKehadiran) * 1000) / 10,
        };

  const detailByAbsensi = new Map();
  detailFinal.forEach((item) => {
    const current = detailByAbsensi.get(item.absensi_id) || {
      hadir: 0,
      izin: 0,
      sakit: 0,
      alfa: 0,
      total: 0,
    };
    current.total += 1;
    current[item.status_kehadiran] = (current[item.status_kehadiran] || 0) + 1;
    detailByAbsensi.set(item.absensi_id, current);
  });

  const today = todayDate();
  const absensiHariIni = absensi.filter((item) => item.tanggal === today && item.status_absensi === "final");
  const countsHariIni = absensiHariIni.reduce(
    (result, item) => {
      const current = detailByAbsensi.get(item.absensi_id) || {
        hadir: 0,
        izin: 0,
        sakit: 0,
        alfa: 0,
        total: 0,
      };
      result.hadir += current.hadir;
      result.izin += current.izin;
      result.sakit += current.sakit;
      result.alfa += current.alfa;
      result.total += current.total;
      return result;
    },
    { hadir: 0, izin: 0, sakit: 0, alfa: 0, total: 0 },
  );
  const persentaseHariIni = countsHariIni.total === 0 ? 0 : Math.round((countsHariIni.hadir / countsHariIni.total) * 1000) / 10;

  const teachers = users.filter((item) => item.role === "Pengajar");
  const totalLimitKelas = teachers.reduce((total, item) => total + (Number(item.limit_kelas) || 0), 0);
  const activeCountByKelas = new Map();
  const activeCountByTeacher = new Map();

  memberships
    .filter((item) => item.status_keanggotaan === "aktif")
    .forEach((item) => {
      activeCountByKelas.set(item.kelas_id, (activeCountByKelas.get(item.kelas_id) || 0) + 1);
    });

  kelas
    .filter((item) => item.status_kelas === "aktif")
    .forEach((item) => {
      activeCountByTeacher.set(item.pengajar_id, (activeCountByTeacher.get(item.pengajar_id) || 0) + 1);
    });

  const periodStart = shiftDate(today, -30);
  const monitored = new Map();

  for (const item of absensi) {
    if (item.tanggal < periodStart || item.status_absensi !== "final") {
      continue;
    }

    const kelasItem = kelasById.get(item.kelas_id);
    if (!kelasItem) {
      continue;
    }

    const kelasDetail = detail.filter((detailItem) => detailItem.absensi_id === item.absensi_id && detailItem.status_kehadiran === "alfa");

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

  const daftarPemantauan = [...monitored.values()]
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
        <h1>Dashboard</h1>
        <p>
          <Link href="/admin/users">Manajemen Pengguna</Link>
        </p>
        <p>
          <Link href="/admin/profil">Profil Saya</Link>
        </p>
        <p>
          <Link href="/admin/kelas">Manajemen Kelas</Link>
        </p>
        <p>
          <Link href="/admin/siswa">Manajemen Siswa</Link>
        </p>
        <p>
          <Link href="/admin/pemantauan">Pemantauan Ketidakhadiran</Link>
        </p>
      </header>
      <section>
        <h2>Grafik Absensi Siswa</h2>
        {detailFinal.length === 0 ? (
          <p>Belum ada data absensi.</p>
        ) : (
          <ul>
            <li>Hadir: {persentaseByStatus.hadir}%</li>
            <li>Izin: {persentaseByStatus.izin}%</li>
            <li>Sakit: {persentaseByStatus.sakit}%</li>
            <li>Alfa: {persentaseByStatus.alfa}%</li>
          </ul>
        )}
      </section>
      <section>
        <h2>Statistik Utama</h2>
        <ul>
          <li>Total Siswa: {siswa.length}</li>
          <li>Total Pengajar: {teachers.length}</li>
          <li>Total Kelas: {totalLimitKelas}</li>
          <li>Kelas Aktif: {kelas.length}</li>
          <li>Kelas Belum Aktif: {totalLimitKelas - kelas.length}</li>
          <li>Tingkat Kehadiran Hari Ini: {persentaseHariIni}%</li>
        </ul>
      </section>

      <section>
        <h2>Daftar Kelas Aktif</h2>
        {kelas.length === 0 ? (
          <p>Belum ada kelas.</p>
        ) : (
          <ol>
            {kelas.map((item) => {
              const jadwal = jadwalByKelasId.has(item.kelas_id)
                ? `${jadwalByKelasId.get(item.kelas_id).hari} ${jadwalByKelasId.get(item.kelas_id).jam_mulai}–${jadwalByKelasId.get(item.kelas_id).jam_selesai}`
                : null;

              return (
                <li key={item.kelas_id}>
                  <ClassCard kelas={item} href={`/admin/kelas/${item.kelas_id}`} jumlahSiswa={activeCountByKelas.get(item.kelas_id) || 0} jadwal={jadwal} />
                </li>
              );
            })}
          </ol>
        )}
      </section>
      {kelasTanpaJadwal.length > 0 ? (
        <section>
          <h2>Belum Ada Jadwal</h2>
          <AdminList
            items={kelasTanpaJadwal}
            emptyMessage="Belum ada kelas aktif tanpa jadwal."
            renderItem={(item) => (
              <>
                <Link href={`/admin/kelas/${item.kelas_id}`}>{item.nama_kelas}</Link> | <ClassCapacityLabel terisi={activeCountByKelas.get(item.kelas_id) || 0} kapasitas={item.kapasitas} /> |{" "}
                <Link href={`/admin/jadwal/tambah?kelas_id=${item.kelas_id}`}>Buat Jadwal</Link>
              </>
            )}
          />
        </section>
      ) : null}
      <section>
        <h2>Daftar Guru</h2>
        {teachers.length === 0 ? (
          <p>Belum ada pengajar.</p>
        ) : (
          <AdminList
            items={teachers}
            emptyMessage="Belum ada pengajar."
            renderItem={(item) => (
              <>
                <LinkDetail href={`/admin/users/${item.user_id}`}>{item.name}</LinkDetail> | <TeacherCapacityLabel terisi={activeCountByTeacher.get(item.user_id) || 0} limit={item.limit_kelas} />
              </>
            )}
          />
        )}
      </section>

      <section>
        <h2>Pemantauan Siswa</h2>
        {daftarPemantauan.length === 0 ? (
          <p>Belum ada siswa yang mencapai ambang pemantauan.</p>
        ) : (
          <MonitoringList
            items={daftarPemantauan}
            actions={(item) => <Link href={`/admin/laporan/hubungi-pengajar/${item.kelas?.pengajar_id}?siswaId=${item.siswa_id}&kelasId=${item.kelas_id}`}>Hubungi Pengajar</Link>}
          />
        )}
      </section>

      <section>
        <h2>Akses Cepat</h2>
        <ul>
          <li>
            <Link href="/admin/absensi"> Absensi</Link>
          </li>
          <li>
            <Link href="/admin/siswa"> Siswa</Link>
          </li>
          <li>
            <Link href="/admin/pengajar/"> Pengajar</Link>
          </li>
          <li>
            <Link href="/admin/kelas/"> Kelas</Link>
          </li>
          <li>
            <Link href="/admin/jadwal/">Jadwal</Link>
          </li>
          <li>
            <Link href="/admin/laporan">Lihat Laporan Absensi</Link>
          </li>
        </ul>
      </section>
    </main>
  );
}
