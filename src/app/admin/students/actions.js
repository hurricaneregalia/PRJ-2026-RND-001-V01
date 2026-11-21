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
  const result = await createClassMembershipService(input);

  revalidatePath("/admin/students");
  revalidatePath("/admin/classes");

  return result;
}

export async function moveStudentToClassAction(input) {
  const result = await moveStudentToClassService(input);

  revalidatePath("/admin/students");
  revalidatePath(`/admin/students/${input.student_id}`);
  revalidatePath("/admin/classes");

  return result;
}

export async function endClassMembershipAction(membershipId, effectiveTo, reason) {
  const result = await endClassMembershipService(membershipId, effectiveTo, reason);

  revalidatePath("/admin/students");
  revalidatePath("/admin/classes");

  return result;
}

export async function createClassMembershipsBulkAction(input) {
  const result = await createClassMembershipsService(input);

  revalidatePath("/admin/students");
  revalidatePath("/admin/classes");

  return result;
}

export async function moveClassMembershipsBulkAction(input) {
  const result = await moveClassMembershipsService(input);

  revalidatePath("/admin/students");
  revalidatePath("/admin/classes");

  return result;
}

export async function endClassMembershipsBulkAction(input) {
  const result = await endClassMembershipsService(input);

  revalidatePath("/admin/students");
  revalidatePath("/admin/classes");

  return result;
}
