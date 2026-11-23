// src/lib/attendance-date-utils.js

export function getTodayWIB() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return `${values.year}-${values.month}-${values.day}`;
}

function parseAttendanceDate(attendanceDate) {
  if (typeof attendanceDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(attendanceDate)) {
    throw new Error("INVALID_ATTENDANCE_DATE");
  }

  const date = new Date(`${attendanceDate}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== attendanceDate) {
    throw new Error("INVALID_ATTENDANCE_DATE");
  }

  return date;
}

export function getAcademicYearId(attendanceDate) {
  const date = parseAttendanceDate(attendanceDate);
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;

  const academicStartYear = month >= 7 ? year : year - 1;

  return `${academicStartYear}/${academicStartYear + 1}`;
}

export function getWeekRangeWIB(attendanceDate) {
  const date = parseAttendanceDate(attendanceDate);
  const dayOfWeek = date.getUTCDay();
  const daysFromMonday = (dayOfWeek + 6) % 7;

  const monday = new Date(date);
  monday.setUTCDate(date.getUTCDate() - daysFromMonday);

  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);

  return {
    weekStart: monday.toISOString().slice(0, 10),
    weekEnd: sunday.toISOString().slice(0, 10),
  };
}

export function isTodayWIB(attendanceDate) {
  parseAttendanceDate(attendanceDate);

  return attendanceDate === getTodayWIB();
}
