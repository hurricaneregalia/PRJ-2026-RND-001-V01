// src/app/admin/students/student-management.js

"use client";

import StudentBulkCreate from "./student-bulk-create";
import StudentList from "./student-list";

export default function StudentManagement({ students = [] }) {
  return (
    <main>
      <StudentBulkCreate />
      <StudentList students={students} />
    </main>
  );
}
