import "server-only";
import { getAcademicYears } from "@/repositories/academic-year-repository";

function isValidDate(value) {
  if (typeof value !== "string") {
    return false;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export async function validateAcademicYearData(data) {
  if (typeof data.academic_year_name !== "string" || !data.academic_year_name.trim() || !isValidDate(data.start_date) || !isValidDate(data.end_date) || data.start_date > data.end_date) {
    throw new Error("INVALID_ACADEMIC_YEAR_DATA");
  }

  const academicYears = await getAcademicYears();

  const hasOverlap = academicYears.some((year) => {
    if (!isValidDate(year.start_date) || !isValidDate(year.end_date)) {
      throw new Error("EXISTING_ACADEMIC_YEAR_PERIOD_INVALID");
    }

    return data.start_date <= year.end_date && data.end_date >= year.start_date;
  });

  if (hasOverlap) {
    throw new Error("ACADEMIC_YEAR_PERIOD_OVERLAP");
  }

  return {
    academic_year_name: data.academic_year_name.trim(),
    start_date: data.start_date,
    end_date: data.end_date,
  };
}
