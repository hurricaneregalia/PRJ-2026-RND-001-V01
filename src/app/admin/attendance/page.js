import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";

import { requireRole } from "@/lib/authorization";
import { USER_ROLES } from "@/config/user-config";

import { getAttendanceSessionsService } from "@/services/attendance-service";
import { getAllClassesService } from "@/services/class-service";
import { listUsers } from "@/services/user-management-service";

import AttendanceManagement from "./attendance-management";

async function AdminAttendanceData() {
  await connection();

  await requireRole(["Administrator"]);

  const [sessions, classes, users] = await Promise.all([
    getAttendanceSessionsService({}),
    getAllClassesService(),
    listUsers(),
  ]);

  const teachers = users.filter((user) => user.role === USER_ROLES.TEACHER);

  return (
    <AttendanceManagement
      sessions={sessions}
      classes={classes}
      teachers={teachers}
    />
  );
}

export default function AdminAttendancePage() {
  return (
    <main>
      <nav>
        <Link href="/admin">Kembali ke Dashboard</Link>
      </nav>

      <h1>Manajemen Absensi</h1>

      <Suspense fallback={<p>Memuat data absensi...</p>}>
        <AdminAttendanceData />
      </Suspense>
    </main>
  );
}