import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/authorization";
import { getClassDetailsService } from "@/services/class-service";

export default async function ClassDetailPage({ params }) {
  await requireRole(["Administrator"]);

  const { classId } = await params;
  const classItem = await getClassDetailsService(classId);

  if (!classItem) {
    notFound();
  }

  return (
    <main>
      <h1>Detail Kelas</h1>

      <p>
        <Link href="/admin/classes">Kembali ke Daftar Kelas</Link>
      </p>

      <section>
        <h2>{classItem.class_name}</h2>

        <p>Status: {classItem.class_status}</p>

        <p>ID Kelas: {classItem.class_id}</p>

        <p>Dibuat: {classItem.created_at}</p>

        <p>Terakhir diperbarui: {classItem.updated_at}</p>
      </section>
    </main>
  );
}
