export const PUBLIC_DUMMY_STUDENTS = [
  {
    student_id: "STU-001",
    student_name: "Budi Santoso",
    student_status: "active",
    class_name: "Kelas 7A",
    teacher_name: "Guru A",
    attendance: [
      { date: "2026-11-01", status: "Hadir", academic_year_id: "2026/2027" },
      { date: "2026-11-02", status: "Sakit", academic_year_id: "2026/2027" },
      { date: "2026-11-03", status: "Izin", academic_year_id: "2026/2027" },
      { date: "2026-11-04", status: "Alpa", academic_year_id: "2026/2027" },
    ],
  },
  {
    student_id: "STU-002",
    student_name: "Budi Santoso",
    student_status: "active",
    class_name: "Kelas 7B",
    teacher_name: "Guru B",
    attendance: [
      { date: "2026-11-01", status: "Hadir", academic_year_id: "2026/2027" },
      { date: "2026-11-05", status: "Hadir", academic_year_id: "2026/2027" },
    ],
  },
  {
    student_id: "STU-003",
    student_name: "Ani Wijaya",
    student_status: "graduated",
    class_name: "Kelas 8A",
    teacher_name: "Guru C",
    attendance: [
      { date: "2026-10-15", status: "Hadir", academic_year_id: "2026/2027" },
      { date: "2026-10-16", status: "Sakit", academic_year_id: "2026/2027" },
    ],
  },
  {
    student_id: "STU-004",
    student_name: "Citra Lestari",
    student_status: "transferred",
    class_name: "Kelas 9A",
    teacher_name: "Guru D",
    attendance: [
      { date: "2026-09-10", status: "Izin", academic_year_id: "2025/2026" },
      { date: "2026-09-11", status: "Alpa", academic_year_id: "2025/2026" },
    ],
  },
];

export const PUBLIC_DUMMY_ACADEMIC_YEARS = ["2025/2026", "2026/2027"];
