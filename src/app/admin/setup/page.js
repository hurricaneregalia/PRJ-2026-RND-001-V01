import { redirect } from "next/navigation";
import { requireRole } from "@/lib/authorization";
import { getSchoolInformationRecord } from "@/repositories/school-information-repository";
import { initializeSchoolAction } from "./actions";

export const instant = false;

export default async function AdminSetupPage({ searchParams }) {
  await requireRole(["Administrator"]);

  const school = await getSchoolInformationRecord();
  const params = await searchParams;

  if (school) {
    redirect("/admin");
  }

  const errorMessages = {
    INVALID_INITIALIZATION_DATA: "Data inisialisasi tidak lengkap.",
    INVALID_SCHOOL_INFORMATION: "Informasi sekolah tidak valid.",
    INVALID_ACADEMIC_YEAR_DATA: "Data tahun ajaran tidak valid.",
    ACADEMIC_YEAR_PERIOD_OVERLAP: "Periode tahun ajaran bertumpang tindih.",
    EXISTING_ACADEMIC_YEAR_PERIOD_INVALID: "Periode tahun ajaran lama tidak valid.",
    ACADEMIC_YEARS_ALREADY_EXIST: "Data tahun ajaran sudah tersedia.",
    SCHOOL_INFORMATION_ALREADY_EXISTS: "Informasi sekolah sudah tersedia.",
    SCHOOL_INFORMATION_HEADERS_NOT_FOUND: "Header School_Information tidak ditemukan.",
    SCHOOL_INFORMATION_HEADERS_INVALID: "Struktur School_Information tidak sesuai.",
    ACADEMIC_YEAR_HEADERS_NOT_FOUND: "Header Academic_Years tidak ditemukan.",
    ACADEMIC_YEAR_HEADERS_INVALID: "Struktur Academic_Years tidak sesuai.",
    INITIALIZATION_SHEET_NOT_FOUND: "Sheet database tidak ditemukan.",
    INITIALIZATION_IN_PROGRESS: "Proses inisialisasi sedang berlangsung.",
    INITIALIZATION_FAILED: "Inisialisasi gagal. Periksa database dan server.",
  };

  return (
    <main>
      <h1>Inisialisasi Sekolah</h1>

      <p>Lengkapi informasi sekolah dan tahun ajaran pertama untuk mulai menggunakan sistem.</p>

      {params?.success === "1" && <p>Inisialisasi sekolah berhasil.</p>}

      {params?.error && <p>{errorMessages[params.error] || "Terjadi kesalahan."}</p>}

      <form action={initializeSchoolAction}>
        <h2>Informasi Sekolah</h2>

        <div>
          <label htmlFor="school_name">Nama Sekolah</label>
          <input id="school_name" name="school_name" type="text" required />
        </div>

        <div>
          <label htmlFor="school_address">Alamat Sekolah</label>
          <textarea id="school_address" name="school_address" required />
        </div>

        <div>
          <label htmlFor="school_phone">Nomor Telepon</label>
          <input id="school_phone" name="school_phone" type="text" />
        </div>

        <div>
          <label htmlFor="school_email">Email Sekolah</label>
          <input id="school_email" name="school_email" type="email" />
        </div>

        <div>
          <label htmlFor="school_logo_url">URL Logo Sekolah</label>
          <input id="school_logo_url" name="school_logo_url" type="url" />
        </div>

        <div>
          <label htmlFor="principal_name">Nama Kepala Sekolah</label>
          <input id="principal_name" name="principal_name" type="text" />
        </div>

        <h2>Tahun Ajaran Pertama</h2>

        <div>
          <label htmlFor="academic_year_name">Nama Tahun Ajaran</label>
          <input id="academic_year_name" name="academic_year_name" type="text" placeholder="2026/2027" required />
        </div>

        <div>
          <label htmlFor="start_date">Tanggal Mulai</label>
          <input id="start_date" name="start_date" type="date" required />
        </div>

        <div>
          <label htmlFor="end_date">Tanggal Berakhir</label>
          <input id="end_date" name="end_date" type="date" required />
        </div>

        <button type="submit">Simpan Inisialisasi</button>
      </form>
    </main>
  );
}
