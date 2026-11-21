export function getTodayWIB() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));

  return `${values.year}-${values.month}-${values.day}`;
}

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
