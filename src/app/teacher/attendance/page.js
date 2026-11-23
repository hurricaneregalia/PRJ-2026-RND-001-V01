import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";

import { getTeacherAttendancePageDataService } from "@/services/attendance-page-service";

async function TeacherAttendanceClassesData() {
  await connection();

  const data = await getTeacherAttendancePageDataService();

  if (data.classes.length === 0) {
    return <p>Belum ada kelas aktif yang ditugaskan kepada Anda hari ini.</p>;
  }

  return (
    <ul>
      {data.classes.map((item) => (
        <li key={item.class_id}>
          <Link href={`/teacher/attendance/classes/${item.class_id}`}>
            {item.class_name}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function TeacherAttendancePage() {
  return (
    <main>
      <h1>Absensi Kelas</h1>

      <Suspense fallback={<p>Memuat data kelas...</p>}>
        <TeacherAttendanceClassesData />
      </Suspense>
    </main>
  );
}