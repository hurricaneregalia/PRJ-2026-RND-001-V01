// src/app/admin/assignments/assignment-date-utils.js

export function getTomorrowWIB(todayWIB) {
  const date = new Date(`${todayWIB}T00:00:00.000Z`);

  date.setUTCDate(date.getUTCDate() + 1);

  return date.toISOString().slice(0, 10);
}
