// src/app/admin/students/student-list.js

"use client";

import { useMemo, useState } from "react";
import StudentListControls from "./student-list-controls";

const STATUS_LABELS = {
  active: "Aktif",
  inactive: "Tidak Aktif",
  graduated: "Lulus",
  transferred: "Pindah",
};

export default function StudentList({ students = [] }) {
  const [filters, setFilters] = useState({
    classId: "",
    teacher: "",
    status: "",
  });

  const [sortBy, setSortBy] = useState("default");
  const [sortDirection, setSortDirection] = useState("asc");

  const classes = useMemo(() => {
    const uniqueClasses = new Map();

    students.forEach((student) => {
      if (student.active_class_id && student.active_class_name) {
        uniqueClasses.set(student.active_class_id, student.active_class_name);
      }
    });

    return Array.from(uniqueClasses, ([class_id, class_name]) => ({
      class_id,
      class_name,
    })).sort((a, b) => a.class_name.localeCompare(b.class_name, "id"));
  }, [students]);

  const teachers = useMemo(
    () =>
      Array.from(
        new Set(
          students
            .map((student) => student.active_teacher_name)
            .filter(Boolean)
            .filter((name) => name !== "Belum ada guru aktif"),
        ),
      ).sort((a, b) => a.localeCompare(b, "id")),
    [students],
  );

  const filteredStudents = useMemo(() => {
    const result = students.filter((student) => {
      if (filters.classId === "none" && student.active_class_id) {
        return false;
      }

      if (filters.classId && filters.classId !== "none" && student.active_class_id !== filters.classId) {
        return false;
      }

      if (filters.teacher === "none" && student.active_class_id && student.active_teacher_name !== "Belum ada guru aktif") {
        return false;
      }

      if (filters.teacher && filters.teacher !== "none" && student.active_teacher_name !== filters.teacher) {
        return false;
      }

      if (filters.status && student.student_status !== filters.status) {
        return false;
      }

      return true;
    });

    if (sortBy === "default") {
      return result;
    }

    const sortGetters = {
      class: (student) => student.active_class_name || "",
      teacher: (student) => student.active_teacher_name || "",
      status: (student) => STATUS_LABELS[student.student_status] || "",
    };

    const getValue = sortGetters[sortBy];

    if (!getValue) {
      return result;
    }

    return [...result].sort((a, b) => {
      const comparison = getValue(a).localeCompare(getValue(b), "id");

      return sortDirection === "desc" ? -comparison : comparison;
    });
  }, [students, filters, sortBy, sortDirection]);

  return (
    <section>
      <h2>Daftar Siswa</h2>

      <StudentListControls
        classes={classes}
        teachers={teachers}
        filters={filters}
        setFilters={setFilters}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortDirection={sortDirection}
        setSortDirection={setSortDirection}
      />

      <p>
        Menampilkan {filteredStudents.length} dari {students.length} siswa.
      </p>

      {filteredStudents.length === 0 ? (
        <p>Tidak ada siswa yang sesuai dengan filter.</p>
      ) : (
        <ul>
          {filteredStudents.map((student) => (
            <li key={student.student_id}>
              <h3>{student.full_name}</h3>

              <p>Nomor Induk: {student.student_number || "-"}</p>

              <p>Status: {STATUS_LABELS[student.student_status] || student.student_status}</p>

              {student.active_class_id ? (
                <>
                  <p>Kelas: {student.active_class_name}</p>
                  <p>Guru: {student.active_teacher_name}</p>

                  <a href={`/admin/classes/${student.active_class_id}`}>Lihat Kelas</a>
                </>
              ) : (
                <p>Belum memiliki kelas aktif.</p>
              )}

              <p>
                <a href={`/admin/students/${student.student_id}`}>Lihat Detail Siswa</a>
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
