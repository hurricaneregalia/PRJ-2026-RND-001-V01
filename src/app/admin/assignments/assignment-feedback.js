// src/app/admin/assignments/assignment-feedback.js

"use client";

export default function AssignmentFeedback({ messages, bulkResults }) {
  return (
    <>
      {messages.error && <p role="alert">{messages.error}</p>}

      {messages.success && <p role="status">{messages.success}</p>}

      {bulkResults.some((item) => !item.success) && (
        <section>
          <h3>Detail Penugasan yang Gagal</h3>

          <ul>
            {bulkResults
              .filter((item) => !item.success)
              .map((item) => (
                <li key={item.assignment_id}>
                  Penugasan {item.assignment_id}: {item.reason}
                </li>
              ))}
          </ul>
        </section>
      )}
    </>
  );
}
