import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import Link from "next/link";

import { getClassDetailsService, getAllClassesService } from "@/services/class-service";

import { getAllClassMembersService } from "@/services/class-member-service";
import { getAllStudentsService } from "@/services/student-service";

import ClassMembershipManagement from "./class-membership-management";

async function ClassDetailData({ params }) {
  const { classId } = await params;

  await connection();

  const [classDetails, memberships, students, classes] = await Promise.all([getClassDetailsService(classId), getAllClassMembersService(), getAllStudentsService(), getAllClassesService()]);

  if (!classDetails) {
    notFound();
  }

  return (
    <main>
      <nav>
        <Link href="/admin/classes">Kembali ke Daftar Kelas</Link>
      </nav>

      <section>
        <h1>{classDetails.class_name}</h1>

        <p>Status: {classDetails.class_status}</p>
        <p>ID Kelas: {classDetails.class_id}</p>
        <p>Dibuat: {classDetails.created_at}</p>
        <p>Terakhir diperbarui: {classDetails.updated_at}</p>
      </section>

      <ClassMembershipManagement classId={classDetails.class_id} students={students} memberships={memberships} classes={classes} />
    </main>
  );
}

export default function ClassDetailPage({ params }) {
  return (
    <Suspense fallback={<p>Memuat detail kelas...</p>}>
      <ClassDetailData params={params} />
    </Suspense>
  );
}
