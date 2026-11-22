// src/app/admin/students/actions.js
"use server";

import { revalidatePath } from "next/cache";

import { createStudentService, createStudentsBulkService, updateStudentService } from "@/services/student-service";

import {
  createClassMembershipService,
  moveStudentToClassService,
  endClassMembershipService,
  createClassMembershipsService,
  moveClassMembershipsService,
  endClassMembershipsService,
} from "@/services/class-member-service";

const membershipErrorMessages = {
  CLASS_ID_REQUIRED: "ID kelas wajib diisi.",
  INVALID_CLASS_MEMBER_DATA: "Data keanggotaan tidak valid.",
  STUDENT_ID_REQUIRED: "ID siswa wajib diisi.",
  STUDENT_IDS_REQUIRED: "Pilih minimal satu siswa.",
  DUPLICATE_STUDENT_IDS: "ID siswa duplikat.",
  INVALID_STUDENT_IDS: "ID siswa tidak valid.",
  STUDENT_NOT_FOUND: "Siswa tidak ditemukan.",
  STUDENT_NOT_ACTIVE: "Siswa tidak aktif.",
  CLASS_NOT_FOUND: "Kelas tidak ditemukan.",
  CLASS_NOT_ACTIVE: "Kelas tidak aktif.",
  INVALID_EFFECTIVE_FROM: "Tanggal mulai tidak valid.",
  INVALID_EFFECTIVE_TO: "Tanggal akhir tidak valid.",
  INVALID_EFFECTIVE_DATE: "Tanggal efektif tidak valid.",
  MEMBERSHIP_ID_REQUIRED: "ID keanggotaan wajib diisi.",
  CLASS_MEMBERSHIP_NOT_FOUND: "Keanggotaan kelas tidak ditemukan.",
  MEMBERSHIP_ALREADY_ENDED: "Keanggotaan sudah diakhiri.",
  INVALID_MEMBERSHIP_DATE_RANGE: "Rentang tanggal keanggotaan tidak valid.",
  STUDENT_MEMBERSHIP_DATE_OVERLAP: "Tanggal keanggotaan bertumpuk.",
  DATA_KEANGGOTAAN_TIDAK_KONSISTEN: "Data keanggotaan tidak konsisten.",
  TIDAK_MEMILIKI_KEANGGOTAAN_KELAS_AKTIF: "Tidak memiliki keanggotaan kelas aktif.",
  SUDAH_MENJADI_ANGGOTA_KELAS_TUJUAN: "Sudah menjadi anggota kelas tujuan.",
  SUDAH_MEMILIKI_KEANGGOTAAN_KELAS_LAIN: "Sudah memiliki keanggotaan kelas lain.",
  TANGGAL_PEMINDAHAN_TIDAK_VALID: "Tanggal pemindahan tidak valid.",
  REQUIRED_SHEET_NOT_FOUND: "Sheet yang diperlukan tidak ditemukan.",
  GOOGLE_SHEETS_SPREADSHEET_ID_MISSING: "Konfigurasi Google Sheets tidak lengkap.",
};

function getMembershipErrorMessage(code) {
  if (membershipErrorMessages[code]) {
    return membershipErrorMessages[code];
  }

  if (typeof code === "string" && /^[A-Z_]+$/.test(code)) {
    return "Gagal memproses siswa.";
  }

  return code || "Terjadi kesalahan. Silakan coba lagi.";
}

function parseBulkStudentError(error) {
  const message = error?.message || "";

  const duplicateExisting = message.match(/^STUDENT_BULK_DUPLICATE_EXISTING:(\d+)$/);

  if (duplicateExisting) {
    return {
      success: false,
      code: "DUPLICATE_EXISTING",
      row_index: Number(duplicateExisting[1]) - 1,
      message: "Nomor induk sudah digunakan siswa lain.",
    };
  }

  const duplicateInput = message.match(/^STUDENT_BULK_DUPLICATE_INPUT:(\d+)$/);

  if (duplicateInput) {
    return {
      success: false,
      code: "DUPLICATE_INPUT",
      row_index: Number(duplicateInput[1]) - 1,
      message: "Nomor induk duplikat dalam formulir.",
    };
  }

  const invalidData = message.match(/^STUDENT_BULK_INVALID_DATA:(\d+):(.+)$/);

  if (invalidData) {
    return {
      success: false,
      code: "INVALID_DATA",
      row_index: Number(invalidData[1]) - 1,
      message: invalidData[2],
    };
  }

  return null;
}

export async function createStudentAction(input) {
  const student = await createStudentService(input);

  revalidatePath("/admin/students");

  return {
    success: true,
    message: "Siswa berhasil ditambahkan.",
    student,
  };
}

export async function createStudentsBulkAction(dataList, reason = "") {
  try {
    const result = await createStudentsBulkService(dataList, reason);

    revalidatePath("/admin/students");
    revalidatePath("/admin/classes");

    return {
      success: true,
      message: `${result.length} siswa berhasil ditambahkan.`,
      processed_count: result.length,
      students: result,
    };
  } catch (error) {
    const validationError = parseBulkStudentError(error);

    if (validationError) {
      return validationError;
    }

    throw error;
  }
}

export async function updateStudentAction(studentId, input) {
  try {
    const result = await updateStudentService(studentId, input);

    revalidatePath("/admin/students");
    revalidatePath(`/admin/students/${studentId}`);

    return {
      success: true,
      result,
    };
  } catch (error) {
    if (error?.message === "STUDENT_STATUS_REASON_REQUIRED") {
      return {
        success: false,
        code: "STUDENT_STATUS_REASON_REQUIRED",
        message: "Alasan wajib diisi ketika status siswa diubah menjadi Tidak Aktif.",
      };
    }

    throw error;
  }
}

export async function createClassMembershipAction(input) {
  try {
    const result = await createClassMembershipService(input);

    revalidatePath("/admin/students");
    revalidatePath("/admin/classes");

    return result;
  } catch (error) {
    console.error("Create class membership failed:", error);

    return {
      success: false,
      error: getMembershipErrorMessage(error?.message),
    };
  }
}

export async function moveStudentToClassAction(input) {
  try {
    const result = await moveStudentToClassService(input);

    revalidatePath("/admin/students");
    revalidatePath(`/admin/students/${input.student_id}`);
    revalidatePath("/admin/classes");

    return result;
  } catch (error) {
    console.error("Move student to class failed:", error);

    return {
      success: false,
      error: getMembershipErrorMessage(error?.message),
    };
  }
}

export async function endClassMembershipAction(membershipId, effectiveTo, reason) {
  try {
    const result = await endClassMembershipService(membershipId, effectiveTo, reason);

    revalidatePath("/admin/students");
    revalidatePath("/admin/classes");

    return result;
  } catch (error) {
    console.error("End class membership failed:", error);

    return {
      success: false,
      error: getMembershipErrorMessage(error?.message),
    };
  }
}

export async function createClassMembershipsBulkAction(input) {
  try {
    const result = await createClassMembershipsService(input);

    const mappedResult = {
      ...result,
      skipped: (result?.skipped || []).map((item) => ({
        ...item,
        reason: item?.reason ? getMembershipErrorMessage(item.reason) : item?.reason,
      })),
    };

    revalidatePath("/admin/students");
    revalidatePath("/admin/classes");

    return mappedResult;
  } catch (error) {
    console.error("Bulk create class memberships failed:", error);

    return {
      success: false,
      error: getMembershipErrorMessage(error?.message),
    };
  }
}

export async function moveClassMembershipsBulkAction(input) {
  try {
    const result = await moveClassMembershipsService(input);

    const mappedResult = {
      ...result,
      skipped: (result?.skipped || []).map((item) => ({
        ...item,
        reason: item?.reason ? getMembershipErrorMessage(item.reason) : item?.reason,
      })),
    };

    revalidatePath("/admin/students");
    revalidatePath("/admin/classes");

    return mappedResult;
  } catch (error) {
    console.error("Bulk move class memberships failed:", error);

    return {
      success: false,
      error: getMembershipErrorMessage(error?.message),
    };
  }
}

export async function endClassMembershipsBulkAction(input) {
  try {
    const result = await endClassMembershipsService(input);

    const mappedResult = {
      ...result,
      skipped: (result?.skipped || []).map((item) => ({
        ...item,
        reason: item?.reason ? getMembershipErrorMessage(item.reason) : item?.reason,
      })),
    };

    revalidatePath("/admin/students");
    revalidatePath("/admin/classes");

    return mappedResult;
  } catch (error) {
    console.error("Bulk end class memberships failed:", error);

    return {
      success: false,
      error: getMembershipErrorMessage(error?.message),
    };
  }
}
