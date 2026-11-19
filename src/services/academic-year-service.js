// src/services/academic-year-service.js

import "server-only";

import { requireRole } from "@/lib/authorization";

import {
  getAllAcademicYears,
  getAcademicYearById,
  createAcademicYear,
  updateAcademicYear,
  activateAcademicYear,
  getActiveAcademicYear,
} from "@/repositories/academic-year-repository";

function validateDatePeriod(startDate, endDate) {
  if (
    typeof startDate !== "string" ||
    typeof endDate !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(startDate) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(endDate)
  ) {
    throw new Error("INVALID_ACADEMIC_YEAR_PERIOD");
  }

  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    start.toISOString().slice(0, 10) !== startDate ||
    end.toISOString().slice(0, 10) !== endDate ||
    startDate >= endDate
  ) {
    throw new Error("INVALID_ACADEMIC_YEAR_PERIOD");
  }
}

function validateNoOverlap(
  academicYears,
  startDate,
  endDate,
  excludedAcademicYearId = null
) {
  const overlappingYear = academicYears.find((year) => {
    if (year.academic_year_id === excludedAcademicYearId) {
      return false;
    }

    return (
      startDate <= year.end_date &&
      endDate >= year.start_date
    );
  });

  if (overlappingYear) {
    throw new Error("ACADEMIC_YEAR_PERIOD_OVERLAP");
  }
}

function createAuditData(admin) {
  return {
    actor_user_id: admin.userId,
  };
}

export async function listAcademicYears() {
  await requireRole(["Administrator"]);
  return getAllAcademicYears();
}

export async function getAcademicYearDetails(academicYearId) {
  await requireRole(["Administrator"]);

  const academicYear = await getAcademicYearById(academicYearId);

  if (!academicYear) {
    throw new Error("ACADEMIC_YEAR_NOT_FOUND");
  }

  return academicYear;
}

export async function getCurrentAcademicYear() {
  await requireRole(["Administrator"]);
  return getActiveAcademicYear();
}

export async function createAcademicYearService(data) {
  const admin = await requireRole(["Administrator"]);

  if (
    !data ||
    typeof data.academic_year_name !== "string" ||
    !data.academic_year_name.trim()
  ) {
    throw new Error("INVALID_ACADEMIC_YEAR_DATA");
  }

  validateDatePeriod(data.start_date, data.end_date);

  const academicYears = await getAllAcademicYears();

  validateNoOverlap(
    academicYears,
    data.start_date,
    data.end_date
  );

  return createAcademicYear(
    {
      academic_year_name: data.academic_year_name.trim(),
      start_date: data.start_date,
      end_date: data.end_date,
    },
    createAuditData(admin)
  );
}

export async function updateAcademicYearService(
  academicYearId,
  updates
) {
  const admin = await requireRole(["Administrator"]);

  if (
    !updates ||
    typeof updates !== "object" ||
    Array.isArray(updates)
  ) {
    throw new Error("INVALID_ACADEMIC_YEAR_UPDATE");
  }

  const allowedFields = [
    "academic_year_name",
    "start_date",
    "end_date",
  ];

  for (const field of Object.keys(updates)) {
    if (!allowedFields.includes(field)) {
      throw new Error("INVALID_ACADEMIC_YEAR_UPDATE_FIELD");
    }
  }

  const existingYear = await getAcademicYearById(academicYearId);

  if (!existingYear) {
    throw new Error("ACADEMIC_YEAR_NOT_FOUND");
  }

  const activeAcademicYear = await getActiveAcademicYear();

  const isActiveAcademicYear =
    activeAcademicYear?.academic_year_id === academicYearId;

  if (
    isActiveAcademicYear &&
    (
      updates.start_date !== undefined ||
      updates.end_date !== undefined
    )
  ) {
    throw new Error("ACTIVE_ACADEMIC_YEAR_PERIOD_LOCKED");
  }

  if (
    updates.academic_year_name !== undefined &&
    (
      typeof updates.academic_year_name !== "string" ||
      !updates.academic_year_name.trim()
    )
  ) {
    throw new Error("INVALID_ACADEMIC_YEAR_NAME");
  }

  const updatedData = {
    ...existingYear,
    ...updates,
  };

  validateDatePeriod(
    updatedData.start_date,
    updatedData.end_date
  );

  const academicYears = await getAllAcademicYears();

  validateNoOverlap(
    academicYears,
    updatedData.start_date,
    updatedData.end_date,
    academicYearId
  );

  return updateAcademicYear(
    academicYearId,
    {
      ...(updates.academic_year_name !== undefined
        ? {
            academic_year_name:
              updates.academic_year_name.trim(),
          }
        : {}),
      ...(updates.start_date !== undefined
        ? { start_date: updates.start_date }
        : {}),
      ...(updates.end_date !== undefined
        ? { end_date: updates.end_date }
        : {}),
    },
    createAuditData(admin)
  );
}

export async function activateAcademicYearService(academicYearId) {
  const admin = await requireRole(["Administrator"]);

  const academicYear = await getAcademicYearById(academicYearId);

  if (!academicYear) {
    throw new Error("ACADEMIC_YEAR_NOT_FOUND");
  }

  const academicYears = await getAllAcademicYears();

  validateNoOverlap(
    academicYears,
    academicYear.start_date,
    academicYear.end_date,
    academicYearId
  );

  return activateAcademicYear(
    academicYearId,
    createAuditData(admin)
  );
}

// Validasi data tahun ajaran untuk proses inisialisasi sekolah.
export async function validateAcademicYearData(data) {
  if (
    !data ||
    typeof data.academic_year_name !== "string" ||
    !data.academic_year_name.trim()
  ) {
    throw new Error("INVALID_ACADEMIC_YEAR_DATA");
  }

  validateDatePeriod(
    data.start_date,
    data.end_date
  );

  return {
    academic_year_name: data.academic_year_name.trim(),
    start_date: data.start_date,
    end_date: data.end_date,
  };
}
