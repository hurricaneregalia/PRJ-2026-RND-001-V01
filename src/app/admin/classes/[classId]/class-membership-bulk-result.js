// src/app/admin/classes/[classId]/class-membership-bulk-result.js
"use client";

import { getStudentName, getSkippedReason } from "./class-membership-helpers";

export default function ClassMembershipBulkResult({ result, students }) {
  if (!result) return null;

  return (
    <section aria-live="polite">
      <h4>Hasil Pemrosesan</h4>

      <p>Berhasil: {result.processed_count ?? result.processed?.length ?? 0}</p>

      <p>Dilewati: {result.skipped_count ?? result.skipped?.length ?? 0}</p>

      {result.processed?.length > 0 && (
        <div>
          <h5>Siswa Berhasil Diproses</h5>

          <ul>
            {result.processed.map((item, index) => (
              <li key={item.student_id || index}>{item.student_name || getStudentName(students, item.student_id)}</li>
            ))}
          </ul>
        </div>
      )}

      {result.skipped?.length > 0 && (
        <div>
          <h5>Siswa Dilewati</h5>

          <ul>
            {result.skipped.map((item, index) => (
              <li key={item.student_id || index}>
                <strong>{item.student_name || getStudentName(students, item.student_id)}</strong>

                <p>Alasan: {getSkippedReason(item)}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
