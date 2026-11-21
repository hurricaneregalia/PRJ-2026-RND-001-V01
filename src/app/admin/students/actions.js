// src/app/admin/students/actions.js

"use server";

import { revalidatePath } from "next/cache";

import { createStudentService, updateStudentService } from "@/services/student-service";

import {
  createClassMembershipService,
  moveStudentToClassService,
  endClassMembershipService,
  createClassMembershipsService,
  moveClassMembershipsService,
  endClassMembershipsService,
} from "@/services/class-member-service";

export async function createStudentAction(input) {
  const student = await createStudentService(input);

  revalidatePath("/admin/students");

  return {
    success: true,
    message: "Siswa berhasil ditambahkan.",
    student,
  };
}

export async function updateStudentAction(studentId, input) {
  const result = await updateStudentService(studentId, input);

  revalidatePath("/admin/students");
  revalidatePath(`/admin/students/${studentId}`);

  return result;
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
