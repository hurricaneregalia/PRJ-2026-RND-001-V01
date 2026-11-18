// src/app/admin/page.js

import { requireRole } from "@/lib/authorization";
import { getSchoolInformation } from "@/repositories/school-information-repository";

export const instant = false;

export default async function AdminPage() {
  const user = await requireRole(["Administrator"]);
  const school = await getSchoolInformation();

  return (
    <main>
      <h1>Dashboard Administrator</h1>

      <p>Selamat datang, {user.fullName}.</p>

      <h2>Informasi Sekolah</h2>

      <p>Nama Sekolah: {school.school_name}</p>
      <p>Alamat: {school.school_address}</p>
      <p>Kepala Sekolah: {school.principal_name}</p>

      <h2>Administrasi</h2>

      <nav>
        <ul>
          <li>
            <a href="/admin/users">Manajemen Pengguna</a>
          </li>
        </ul>
      </nav>

      <p>Sistem berhasil diinisialisasi dan siap untuk pengembangan fitur administrasi.</p>
    </main>
  );
}
