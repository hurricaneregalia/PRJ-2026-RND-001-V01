import Link from "next/link";

import { connection } from "next/server";

import { listKelas } from "@/repositories/kelas-repository";
import TeacherCapacityLabel from "@/components/ui/teacher-capacity-label";
import { listKelasSiswa } from "@/repositories/kelas-siswa-repository";
import { listUsers } from "@/repositories/user-repository";
import LinkDetail from "@/components/ui/link-detail";
import CapacityInfo from "@/components/ui/capacity-info";
import ClassCapacityLabel from "@/components/ui/class-capacity-label";
import StatusBadge from "@/components/ui/status-badge";

export const instant = false;

export const metadata = {
  title: "Data Kelas",
};

export default async function DaftarKelasPage() {
  await connection();
  const kelas = await listKelas();
  const memberships = await listKelasSiswa();
  const users = await listUsers();
  const userById = new Map(users.map((item) => [item.user_id, item]));
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

  return (
    <main>
      <header>
        <h1>Data Kelas</h1>
        <p>Kelola kelas bimbingan.</p>
        <p>
          <Link href="/admin">Dashboard</Link> / <Link href="/admin/kelas">Manajemen Kelas</Link>
        </p>
        <p>
          <Link href="/admin/kelas/tambah">+ Tambah Kelas</Link>
        </p>
      </header>

      <section>
        <h2>Daftar Kelas</h2>
        {kelas.length === 0 ? (
          <p>Belum ada kelas.</p>
        ) : (
          <ol>
            {kelas.map((item) => {
              const pengajar = userById.get(item.pengajar_id);

              return (
                <li key={item.kelas_id}>
                  <LinkDetail href={`/admin/kelas/${item.kelas_id}`}>{item.nama_kelas}</LinkDetail> | <ClassCapacityLabel terisi={activeCountByKelas.get(item.kelas_id) || 0} kapasitas={item.kapasitas} /> | {pengajar ? (
                    <>
                      <LinkDetail href={`/admin/users/${pengajar.user_id}`}>{pengajar.name}</LinkDetail> | <TeacherCapacityLabel terisi={activeCountByTeacher.get(pengajar.user_id) || 0} limit={pengajar.limit_kelas} />
                    </>
                  ) : "-"}
                  | {item.status_kelas ? <StatusBadge value={item.status_kelas} /> : null} | <Link href={`/admin/kelas/${item.kelas_id}`}>Detail</Link> |{" "}
                  <Link href={`/admin/kelas/${item.kelas_id}/edit`}>Edit</Link>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </main>
  );
}
