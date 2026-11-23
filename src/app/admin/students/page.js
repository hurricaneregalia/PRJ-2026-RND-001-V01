// src/app/admin/students/page.js

import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";

import { getAllStudentsService } from "@/services/student-service";
import { getAllClassMembersService } from "@/services/class-member-service";
import { getAllClassesService } from "@/services/class-service";
import { getAllTeacherAssignmentsService } from "@/services/teacher-assignment-service";

import StudentManagement from "./student-management";

import { getTodayWIB } from "@/lib/attendance-date-utils";

function isActiveOnDate(record, today) {
  return record.effective_from <= today && (!record.effective_to || record.effective_to >= today);
}

async function StudentsData() {
  await connection();

  const [students, memberships, classes, teacherAssignments] = await Promise.all([getAllStudentsService(), getAllClassMembersService(), getAllClassesService(), getAllTeacherAssignmentsService()]);

  const today = getTodayWIB();

  const classMap = new Map(classes.map((item) => [item.class_id, item]));

  const activeMemberships = memberships.filter((membership) => isActiveOnDate(membership, today));

  const activeTeacherAssignments = teacherAssignments.filter((assignment) => isActiveOnDate(assignment, today));

  const membershipMap = new Map();

  for (const membership of activeMemberships) {
    if (!membershipMap.has(membership.student_id)) {
      membershipMap.set(membership.student_id, membership);
    }
  }

  const teacherMap = new Map();

  for (const assignment of activeTeacherAssignments) {
    if (!teacherMap.has(assignment.class_id)) {
      teacherMap.set(assignment.class_id, assignment);
    }
  }

  const enrichedStudents = students.map((student) => {
    const membership = membershipMap.get(student.student_id);

    if (!membership) {
      return {
        ...student,
        active_class_id: null,
        active_class_name: null,
        active_teacher_name: null,
      };
    }

    const classData = classMap.get(membership.class_id);
    const teacher = teacherMap.get(membership.class_id);

    return {
      ...student,
      active_class_id: membership.class_id,
      active_class_name: classData?.class_name || "Nama kelas tidak ditemukan",
      active_teacher_name: teacher?.teacher_name || "Belum ada guru aktif",
    };
  });

  return <StudentManagement students={enrichedStudents} />;
}

export default function StudentsPage() {
  return (
    <main>
      <nav>
        <Link href="/admin">Kembali ke Dashboard</Link>
      </nav>

      <h1>Manajemen Siswa</h1>

      <Suspense fallback={<p>Memuat data siswa...</p>}>
        <StudentsData />
      </Suspense>
    </main>
  );
}
