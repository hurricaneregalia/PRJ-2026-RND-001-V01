"use server";

import { revalidatePath } from "next/cache";

import {
  getAttendanceSessionsService,
  getAttendanceSessionDetailService,
  getAttendanceRecordsService,
  getAttendanceSessionWithRecordsService,
  createAttendanceSessionService,
  updateAttendanceSessionService,
  updateAttendanceRecordStatusService,
  updateAttendanceRecordsStatusService,
  deleteAttendanceSessionService,
} from "@/services/attendance-service";
import { getTeacherAttendanceRosterPreviewService } from "@/services/attendance-page-service";
import { getTodayWIB } from "@/lib/attendance-date-utils";

const attendanceErrorMessages = {
  UNAUTHORIZED: "Anda harus masuk terlebih dahulu.",
  FORBIDDEN: "Anda tidak memiliki akses untuk tindakan ini.",
  ATTENDANCE_SESSION_ID_REQUIRED: "ID sesi absensi wajib diisi.",
  ATTENDANCE_SESSION_NOT_FOUND: "Sesi absensi tidak ditemukan.",
  ATTENDANCE_SESSION_FORBIDDEN: "Anda tidak memiliki akses ke sesi absensi ini.",
  ATTENDANCE_ATTENDANCE_ID_REQUIRED: "ID record absensi wajib diisi.",
  ATTENDANCE_RECORD_NOT_FOUND: "Record absensi tidak ditemukan.",
  ATTENDANCE_RECORD_NOT_IN_SESSION: "Record absensi tidak termasuk dalam sesi ini.",
  ATTENDANCE_RECORD_UPDATES_REQUIRED: "Pilih minimal satu perubahan status.",
  DUPLICATE_ATTENDANCE_RECORD_IDS: "Terdapat ID record absensi yang duplikat.",
  ATTENDANCE_CLASS_ID_REQUIRED: "ID kelas wajib diisi.",
  CLASS_NOT_FOUND: "Kelas tidak ditemukan.",
  CLASS_NOT_ACTIVE: "Kelas tidak aktif.",
  TEACHER_ASSIGNMENT_NOT_ACTIVE_ON_DATE: "Guru tidak memiliki penugasan aktif pada kelas dan tanggal tersebut.",
  ATTENDANCE_SESSION_DUPLICATE_IN_WEEK: "Sudah ada sesi absensi untuk guru dan kelas ini pada minggu yang sama.",
  INVALID_ATTENDANCE_DATE: "Tanggal absensi tidak valid.",
  INVALID_ATTENDANCE_LOCATION_TYPE: "Jenis lokasi tidak valid.",
  ATTENDANCE_LOCATION_NAME_REQUIRED: "Nama lokasi wajib diisi untuk kegiatan di luar kelas.",
  INVALID_ATTENDANCE_LOCATION_NAME: "Nama lokasi tidak valid.",
  INVALID_ATTENDANCE_LOCATION_NOTE: "Catatan lokasi tidak valid.",
  INVALID_ATTENDANCE_LESSON_MATERIAL: "Materi pelajaran wajib diisi dan tidak boleh melebihi 5000 karakter.",
  INVALID_ATTENDANCE_STATUS: "Status kehadiran tidak valid.",
  INVALID_AUDIT_REASON: "Alasan tidak valid atau melebihi 500 karakter.",
  ATTENDANCE_DELETE_REASON_REQUIRED: "Alasan penghapusan wajib diisi.",
  ATTENDANCE_AUDIT_REASON_REQUIRED: "Alasan audit wajib diisi.",
  ATTENDANCE_AUDIT_REASON_TOO_LONG: "Alasan audit melebihi batas panjang.",
  INVALID_ATTENDANCE_AUDIT_ACTION_TYPE: "Jenis aksi audit tidak valid.",
  INVALID_ATTENDANCE_AUDIT_DATA: "Data audit absensi tidak valid.",
  ATTENDANCE_AUDIT_HEADERS_INVALID: "Header Attendance_Audit_Logs tidak valid.",
  INVALID_ATTENDANCE_SESSION_HEADERS: "Header Attendance_Sessions tidak valid.",
  INVALID_ATTENDANCE_RECORD_HEADERS: "Header Attendance_Records tidak valid.",
  INVALID_CLASSES_HEADERS: "Header Classes tidak valid.",
  INVALID_CLASS_MEMBERS_HEADERS: "Header Class_Members tidak valid.",
  INVALID_STUDENTS_HEADERS: "Header Students tidak valid.",
  INVALID_USERS_HEADERS: "Header Users tidak valid.",
  TEACHER_ASSIGNMENT_HEADERS_INVALID: "Header Teacher_Assignments tidak valid.",
  REQUIRED_SHEET_NOT_FOUND: "Sheet yang diperlukan tidak ditemukan.",
  GOOGLE_SHEETS_SPREADSHEET_ID_MISSING: "Konfigurasi Google Sheets tidak lengkap.",
  ATTENDANCE_AUDIT_DATA_REQUIRED: "Data audit absensi wajib diisi.",
  ATTENDANCE_MEMBERSHIP_ID_REQUIRED: "ID keanggotaan kelas wajib diisi.",
  ATTENDANCE_RECORDS_DATA_REQUIRED: "Data record absensi wajib diisi.",
  ATTENDANCE_SESSION_DATE_IMMUTABLE: "Tanggal sesi absensi tidak dapat diubah.",
  ATTENDANCE_SESSION_LOOKUP_DATA_REQUIRED: "Data pencarian sesi absensi tidak lengkap.",
  ATTENDANCE_SESSION_OWNER_IMMUTABLE: "Pemilik atau kelas sesi absensi tidak dapat diubah.",
  ATTENDANCE_STUDENT_ID_REQUIRED: "ID siswa wajib diisi.",
  ATTENDANCE_STUDENT_NOT_IN_CLASS: "Siswa bukan anggota aktif kelas pada tanggal sesi.",
  DUPLICATE_ATTENDANCE_STUDENT_IDS: "Terdapat ID siswa duplikat pada data kehadiran.",
  INVALID_ATTENDANCE_STUDENT_STATUSES: "Data status kehadiran siswa tidak valid.",
  ATTENDANCE_TEACHER_USER_ID_REQUIRED: "ID guru wajib diisi.",
  INVALID_DATE: "Tanggal tidak valid.",
};

function getAttendanceErrorMessage(code) {
  if (typeof code !== "string" || !code) {
    return "Terjadi kesalahan. Silakan coba lagi.";
  }

  const baseCode = code.split(":")[0];

  if (attendanceErrorMessages[baseCode]) {
    return attendanceErrorMessages[baseCode];
  }

  return "Terjadi kesalahan. Silakan coba lagi.";
}

function normalizeFilters(filters) {
  if (filters && typeof filters === "object" && !Array.isArray(filters)) {
    return filters;
  }

  return {};
}

export async function getAttendanceSessionsAction(filters = {}) {
  try {
    const data = await getAttendanceSessionsService(normalizeFilters(filters));

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("Get attendance sessions failed:", error);

    return {
      success: false,
      error: getAttendanceErrorMessage(error?.message),
    };
  }
}

export async function getAttendanceSessionDetailAction(sessionId) {
  try {
    const data = await getAttendanceSessionDetailService(sessionId);

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("Get attendance session detail failed:", error);

    return {
      success: false,
      error: getAttendanceErrorMessage(error?.message),
    };
  }
}

export async function getAttendanceRecordsAction(sessionId) {
  try {
    const data = await getAttendanceRecordsService(sessionId);

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("Get attendance records failed:", error);

    return {
      success: false,
      error: getAttendanceErrorMessage(error?.message),
    };
  }
}

export async function getAttendanceSessionWithRecordsAction(sessionId) {
  try {
    const data = await getAttendanceSessionWithRecordsService(sessionId);

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("Get attendance session with records failed:", error);

    return {
      success: false,
      error: getAttendanceErrorMessage(error?.message),
    };
  }
}

export async function createAttendanceSessionAction(data) {
  try {
    const result = await createAttendanceSessionService(data);

    revalidatePath("/admin/attendance");
    revalidatePath("/teacher/attendance");

    return {
      success: true,
      data: result,
      message: "Sesi absensi berhasil dibuat.",
    };
  } catch (error) {
    console.error("Create attendance session failed:", error);

    return {
      success: false,
      error: getAttendanceErrorMessage(error?.message),
    };
  }
}

export async function updateAttendanceSessionAction(sessionId, data) {
  try {
    const result = await updateAttendanceSessionService(sessionId, data);

    revalidatePath("/admin/attendance");
    revalidatePath("/teacher/attendance");

    return {
      success: true,
      data: result,
      message: "Informasi sesi absensi berhasil diperbarui.",
    };
  } catch (error) {
    console.error("Update attendance session failed:", error);

    return {
      success: false,
      error: getAttendanceErrorMessage(error?.message),
    };
  }
}

export async function updateAttendanceRecordStatusAction(attendanceId, status, reason = "") {
  try {
    const result = await updateAttendanceRecordStatusService(attendanceId, status, reason);

    revalidatePath("/admin/attendance");
    revalidatePath("/teacher/attendance");

    return {
      success: true,
      data: result,
      message: "Status kehadiran berhasil diperbarui.",
    };
  } catch (error) {
    console.error("Update attendance record status failed:", error);

    return {
      success: false,
      error: getAttendanceErrorMessage(error?.message),
    };
  }
}

export async function updateAttendanceRecordsStatusAction(sessionId, updates, reason = "") {
  try {
    const result = await updateAttendanceRecordsStatusService(sessionId, updates, reason);

    revalidatePath("/admin/attendance");
    revalidatePath("/teacher/attendance");

    return {
      success: true,
      data: result,
      message: "Status kehadiran berhasil diperbarui.",
    };
  } catch (error) {
    console.error("Update attendance records status failed:", error);

    return {
      success: false,
      error: getAttendanceErrorMessage(error?.message),
    };
  }
}

export async function getAttendanceRosterPreviewAction(classId) {
  try {
    const data = await getTeacherAttendanceRosterPreviewService(classId, getTodayWIB());

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("Get attendance roster preview failed:", error);

    return {
      success: false,
      error: getAttendanceErrorMessage(error?.message),
    };
  }
}

export async function deleteAttendanceSessionAction(sessionId, reason) {
  try {
    const result = await deleteAttendanceSessionService(sessionId, reason);

    revalidatePath("/admin/attendance");
    revalidatePath("/teacher/attendance");

    return {
      success: true,
      data: result,
      message: "Sesi absensi berhasil dihapus.",
    };
  } catch (error) {
    console.error("Delete attendance session failed:", error);

    return {
      success: false,
      error: getAttendanceErrorMessage(error?.message),
    };
  }
}