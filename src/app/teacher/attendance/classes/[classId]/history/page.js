import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import Link from "next/link";

import { requireRole } from "@/lib/authorization";
import { USER_ROLES } from "@/config/user-config";

import { getAttendanceSessionsService } from "@/services/attendance-service";
import { getClassById } from "@/repositories/class-repository";
import { getTodayWIB } from "@/lib/attendance-date-utils";
import { assertTeacherActiveAssignment } from "@/services/attendance-service-utils";

import AttendanceList from "../../../attendance-list";

async function ClassHistoryData({ classId }) {
  await connection();

  const teacher = await requireRole([USER_ROLES.TEACHER]);
  const todayWIB = getTodayWIB();

  await assertTeacherActiveAssignment(teacher.userId, classId, todayWIB);

  const classData = await getClassById(classId);

  if (!classData) {
    notFound();
  }

  const sessions = await getAttendanceSessionsService({ class_id: classId });

  const sortedSessions = [...sessions].sort((first, second) =>
    String(second.attendance_date).localeCompare(String(first.attendance_date)),
  );

  return (
    <>
      <nav>
        <Link href={`/teacher/attendance/classes/${classId}`}>Kembali ke Absensi Kelas</Link>
      </nav>

      <h2>Riwayat Absensi: {classData.class_name}</h2>

      <AttendanceList
        sessions={sortedSessions.map((session) => ({
          ...session,
          class_name: classData.class_name,
        }))}
        classes={[{ class_id: classData.class_id, class_name: classData.class_name }]}
      />
    </>
  );
}

async function ClassHistoryDataWrapper({ params }) {
  const { classId } = await params;

  return <ClassHistoryData classId={classId} />;
}

export default function TeacherClassHistoryPage({ params }) {
  return (
    <main>
      <h1>Riwayat Absensi Kelas</h1>

      <Suspense fallback={<p>Memuat riwayat absensi...</p>}>
        <ClassHistoryDataWrapper params={params} />
      </Suspense>
    </main>
  );
}