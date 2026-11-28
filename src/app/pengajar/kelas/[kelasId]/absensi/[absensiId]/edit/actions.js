"use server";

import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { ABSENSI_STATUSES } from "@/lib/domain-constants";
import { listAbsensiDetailByAbsensiId } from "@/repositories/absensi-detail-repository";
import { updateTeacherAbsensiBatch } from "@/services/teacher-absensi-batch-service";
import { parseTeacherAbsensiEditForm } from "@/services/teacher-absensi-edit-input";
import {
  getAbsensiForPengajar,
  getKelasForPengajar,
} from "@/services/teacher-scope-service";

const ACCEPTED_STATUSES = new Set(["ok", "already_applied"]);

export async function simpanEditAbsensiPengajar(kelasId, absensiId, formData) {
  const session = await auth();
  const user = session?.user;

  if (
    !user?.id ||
    user.role !== "Pengajar" ||
    user.accountStatus !== "active" ||
    user.bootstrapPending
  ) {
    redirect("/pengajar");
  }

  const kelasResult = await getKelasForPengajar(user.id, kelasId, {
    requireActive: true,
  });

  if (kelasResult.status !== "ok") {
    redirect("/pengajar");
  }

  const absensiResult = await getAbsensiForPengajar(user.id, kelasId, absensiId);

  if (
    absensiResult.status !== "ok" ||
    absensiResult.data.status_absensi !== ABSENSI_STATUSES[0]
  ) {
    redirect("/pengajar");
  }

  const details = await listAbsensiDetailByAbsensiId(absensiId);
  const parsed = parseTeacherAbsensiEditForm(
    formData,
    details.map((item) => item.absensi_detail_id),
  );

  if (parsed.status !== "ok") {
    redirect("/pengajar");
  }

  const result = await updateTeacherAbsensiBatch({
    kelasId,
    absensiId,
    ...parsed.data,
  });

  if (!ACCEPTED_STATUSES.has(result.status)) {
    redirect("/pengajar");
  }

  const status =
    result.status === "already_applied"
      ? "already_applied"
      : result.data?.unchanged
        ? "unchanged"
        : "ok";
  redirect(
    `/pengajar/kelas/${encodeURIComponent(kelasId)}/absensi/${encodeURIComponent(absensiId)}/edit?status=${status}`,
  );
}
