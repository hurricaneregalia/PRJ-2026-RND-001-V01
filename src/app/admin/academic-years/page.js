// src/app/admin/academic-years/page.js
import Link from "next/link";

import { requireRole } from "@/lib/authorization";

import { listAcademicYears, getCurrentAcademicYear } from "@/services/academic-year-service";

export default async function AcademicYearsPage() {
  await requireRole(["Administrator"]);

  const [academicYears, activeAcademicYear] = await Promise.all([listAcademicYears(), getCurrentAcademicYear()]);

  const activeAcademicYearId = activeAcademicYear?.academic_year_id || "";

  return (
    <main>
      <h1>Manajemen Tahun Ajaran</h1>

      <p>Kelola daftar tahun ajaran dan tentukan tahun ajaran yang sedang digunakan sekolah.</p>

      <p>
        <Link href="/admin">Kembali ke Dashboard Administrator</Link>
      </p>

      <section>
        <h2>Tahun Ajaran Aktif</h2>

        {activeAcademicYear ? (
          <>
            <h3>{activeAcademicYear.academic_year_name}</h3>

            <p>Tanggal Mulai: {activeAcademicYear.start_date}</p>

            <p>Tanggal Berakhir: {activeAcademicYear.end_date}</p>

            <p>Status: Aktif</p>
          </>
        ) : (
          <p>Belum ada tahun ajaran aktif.</p>
        )}
      </section>

      <section>
        <h2>Daftar Tahun Ajaran</h2>

        {academicYears.length === 0 ? (
          <p>Belum ada data tahun ajaran.</p>
        ) : (
          <ul>
            {academicYears.map((year) => {
              const isActive = year.academic_year_id === activeAcademicYearId;

              return (
                <li key={year.academic_year_id}>
                  <section>
                    <h3>{year.academic_year_name}</h3>

                    <p>Tanggal Mulai: {year.start_date}</p>

                    <p>Tanggal Berakhir: {year.end_date}</p>

                    <p>Status: {isActive ? "Aktif" : "Tidak Aktif"}</p>

                    <p>Keterangan: {isActive ? "Sedang digunakan" : "Tidak digunakan"}</p>
                  </section>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
