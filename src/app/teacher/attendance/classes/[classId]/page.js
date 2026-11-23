import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import Link from "next/link";

import { requireRole } from "@/lib/authorization";
import { USER_ROLES } from "@/config/user-config";

import { getTeacherAttendanceRosterPreviewService } from "@/services/attendance-page-service";
import { getAttendanceSessionsService } from "@/services/attendance-service";
import { getTodayWIB, getWeekRangeWIB } from "@/lib/attendance-date-utils";

import AttendanceCreateForm from "../../attendance-create-form";

async function ClassAttendanceData({ classId }) {
  await connection();

  const teacher = await requireRole([USER_ROLES.TEACHER]);
  const todayWIB = getTodayWIB();
  const { weekStart, weekEnd } = getWeekRangeWIB(todayWIB);

  const rosterData = await getTeacherAttendanceRosterPreviewService(classId, todayWIB);

  if (!rosterData) {
    notFound();
  }

  const sessions = await getAttendanceSessionsService({ class_id: classId });
  const existingWeeklySession = sessions.find((session) => {
    return (
      session.teacher_user_id === teacher.userId &&
      session.attendance_date >= weekStart &&
      session.attendance_date <= weekEnd
    );
  });

  return (
    <>
      <h2>{rosterData.class_name}</h2>
      <p>Tanggal absensi (WIB): {rosterData.attendance_date}</p>

      {existingWeeklySession ? (
        <section>
          <p>Absensi minggu ini sudah dibuat.</p>
          <p>
            <Link href={`/teacher/attendance/${existingWeeklySession.session_id}`}>
              Lihat Detail Sesi
            </Link>
          </p>
        </section>
      ) : (
        <AttendanceCreateForm
          fixedClassId={rosterData.class_id}
          initialRoster={rosterData.students}
          classes={[{ class_id: rosterData.class_id, class_name: rosterData.class_name }]}
        />
      )}

      <nav>
        <Link href={`/teacher/attendance/classes/${classId}/history`}>
          Lihat Riwayat Absensi Kelas
        </Link>
      </nav>
    </>
  );
}

async function ClassAttendanceDataWrapper({ params }) {
  const { classId } = await params;

  return <ClassAttendanceData classId={classId} />;
}

export default function TeacherClassAttendancePage({ params }) {
  return (
    <main>
      <nav>
        <Link href="/teacher/attendance">Kembali ke Daftar Kelas</Link>
      </nav>

      <h1>Absensi Kelas</h1>

      <Suspense fallback={<p>Memuat data absensi kelas...</p>}>
        <ClassAttendanceDataWrapper params={params} />
      </Suspense>
    </main>
  );
}