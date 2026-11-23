import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import Link from "next/link";

import { getAttendanceSessionPageDataService } from "@/services/attendance-page-service";
import AttendanceEditForm from "../attendance-edit-form";

async function AttendanceSessionData({ sessionId }) {
  await connection();

  const data = await getAttendanceSessionPageDataService(sessionId);

  if (!data?.session) {
    notFound();
  }

  return <AttendanceEditForm session={data.session} records={data.records} />;
}

async function AttendanceSessionDataWrapper({ params }) {
  const { sessionId } = await params;

  return <AttendanceSessionData sessionId={sessionId} />;
}

export default function AdminAttendanceDetailPage({ params }) {
  return (
    <main>
      <nav>
        <Link href="/admin/attendance">Kembali ke Daftar Absensi</Link>
      </nav>

      <h1>Detail Sesi Absensi</h1>

      <Suspense fallback={<p>Memuat detail sesi absensi...</p>}>
        <AttendanceSessionDataWrapper params={params} />
      </Suspense>
    </main>
  );
}