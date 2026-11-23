"use client";

export const ATTENDANCE_STATUS_OPTIONS = [
  { value: "Hadir", label: "Hadir" },
  { value: "Sakit", label: "Sakit" },
  { value: "Izin", label: "Izin" },
  { value: "Alpa", label: "Alpa" },
];

export function validateAttendanceCreateForm(form) {
  const errors = [];

  if (!form.classId) {
    errors.push("Pilih kelas terlebih dahulu.");
  }

  if (!form.lessonMaterial.trim()) {
    errors.push("Materi pelajaran wajib diisi.");
  } else if (form.lessonMaterial.trim().length > 5000) {
    errors.push("Materi pelajaran tidak boleh melebihi 5000 karakter.");
  }

  if (form.locationType === "OUTSIDE_CLASS" && !form.locationName.trim()) {
    errors.push("Nama lokasi wajib diisi untuk kegiatan di luar kelas.");
  }

  if (form.locationName.trim().length > 150) {
    errors.push("Nama lokasi tidak boleh melebihi 150 karakter.");
  }

  if (form.locationNote.trim().length > 1000) {
    errors.push("Catatan lokasi tidak boleh melebihi 1000 karakter.");
  }

  return errors;
}

export function buildStudentStatuses(roster, statuses) {
  const result = [];

  roster.forEach((student) => {
    const status = statuses[student.student_id] || "Hadir";

    if (status !== "Hadir") {
      result.push({
        student_id: student.student_id,
        status,
      });
    }
  });

  return result;
}