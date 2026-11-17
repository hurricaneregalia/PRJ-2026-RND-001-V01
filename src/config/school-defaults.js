export const SCHOOL_DEFAULTS = {
  school_id: "",
  school_name: "Nama Sekolah",
  school_address: "Alamat Sekolah",
  school_phone: "",
  school_email: "",
  school_logo_url: "",
  principal_name: "Nama Kepala Sekolah",
  active_academic_year_id: "",
  academic_year_name: "Tahun Ajaran",
};

export function getSchoolDisplayData(schoolInformation = null) {
  return {
    ...SCHOOL_DEFAULTS,
    ...(schoolInformation || {}),
    school_name: schoolInformation?.school_name?.trim() || SCHOOL_DEFAULTS.school_name,
    school_address: schoolInformation?.school_address?.trim() || SCHOOL_DEFAULTS.school_address,
    principal_name: schoolInformation?.principal_name?.trim() || SCHOOL_DEFAULTS.principal_name,
    school_phone: schoolInformation?.school_phone?.trim() || SCHOOL_DEFAULTS.school_phone,
    school_email: schoolInformation?.school_email?.trim() || SCHOOL_DEFAULTS.school_email,
    school_logo_url: schoolInformation?.school_logo_url?.trim() || SCHOOL_DEFAULTS.school_logo_url,
  };
}
