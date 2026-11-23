import { getTodayWIB } from "@/lib/attendance-date-utils";

export function isMembershipActive(membership, today) {
  return membership.effective_from <= today && (!membership.effective_to || membership.effective_to >= today);
}

export function getStudentName(students, studentId) {
  return students.find((student) => student.student_id === studentId)?.full_name || "Siswa tidak ditemukan";
}

export function getStudentNumber(students, studentId) {
  return students.find((student) => student.student_id === studentId)?.student_number || "-";
}

export function getSkippedReason(item) {
  return item.reason || item.message || item.skip_reason || item.error || "Tidak dapat diproses.";
}
