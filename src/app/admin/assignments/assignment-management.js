"use client";

import { useState } from "react";

import { createTeacherAssignmentAction, endTeacherAssignmentAction } from "./actions";

function getTodayWIB() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function getAssignmentStatus(assignment, today) {
  if (assignment.effective_to) {
    return "Berakhir";
  }

  if (assignment.effective_from > today) {
    return "Belum dimulai";
  }

  return "Masih aktif";
}

export default function AssignmentManagement({ teachers, classes, assignments }) {
  const [userId, setUserId] = useState("");
  const [classId, setClassId] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [reason, setReason] = useState("");

  const [endDates, setEndDates] = useState({});
  const [messages, setMessages] = useState({});
  const [loading, setLoading] = useState(false);

  const today = getTodayWIB();

  const canCreateAssignment = teachers.length > 0 && classes.length > 0;

  async function handleCreate(event) {
    event.preventDefault();

    setLoading(true);
    setMessages({});

    const result = await createTeacherAssignmentAction({
      user_id: userId,
      class_id: classId,
      effective_from: effectiveFrom,
      reason,
    });

    setLoading(false);

    if (!result.success) {
      setMessages({ error: result.error });
      return;
    }

    setMessages({ success: result.message });

    setUserId("");
    setClassId("");
    setEffectiveFrom("");
    setReason("");

    window.location.reload();
  }

  async function handleEnd(assignmentId) {
    const effectiveTo = endDates[assignmentId];

    if (!effectiveTo) {
      setMessages({
        error: "Tanggal akhir penugasan wajib diisi.",
      });
      return;
    }

    setLoading(true);
    setMessages({});

    const result = await endTeacherAssignmentAction(assignmentId, effectiveTo, "Penugasan diakhiri oleh administrator.");

    setLoading(false);

    if (!result.success) {
      setMessages({ error: result.error });
      return;
    }

    setMessages({ success: result.message });

    window.location.reload();
  }

  return (
    <main>
      <section>
        <h2>Tambah Penugasan Guru</h2>

        {!canCreateAssignment ? (
          <p>Formulir penugasan belum tersedia karena guru aktif atau kelas aktif belum tersedia.</p>
        ) : (
          <form onSubmit={handleCreate}>
            <p>
              <label htmlFor="teacher">Guru</label>
            </p>

            <select id="teacher" value={userId} onChange={(event) => setUserId(event.target.value)} required>
              <option value="">Pilih guru</option>

              {teachers.map((teacher) => (
                <option key={teacher.user_id} value={teacher.user_id}>
                  {teacher.full_name}
                </option>
              ))}
            </select>

            <p>
              <label htmlFor="class">Kelas</label>
            </p>

            <select id="class" value={classId} onChange={(event) => setClassId(event.target.value)} required>
              <option value="">Pilih kelas</option>

              {classes.map((item) => (
                <option key={item.class_id} value={item.class_id}>
                  {item.class_name}
                </option>
              ))}
            </select>

            <p>
              <label htmlFor="effectiveFrom">Tanggal Mulai</label>
            </p>

            <input id="effectiveFrom" type="date" value={effectiveFrom} onChange={(event) => setEffectiveFrom(event.target.value)} required />

            <p>
              <label htmlFor="reason">Keterangan</label>
            </p>

            <textarea id="reason" value={reason} onChange={(event) => setReason(event.target.value)} />

            <p>
              <button type="submit" disabled={loading}>
                {loading ? "Menyimpan..." : "Simpan Penugasan"}
              </button>
            </p>
          </form>
        )}
      </section>

      {messages.error && <p role="alert">{messages.error}</p>}

      {messages.success && <p role="status">{messages.success}</p>}

      <section>
        <h2>Daftar Penugasan</h2>

        {assignments.length === 0 ? (
          <p>Belum ada penugasan guru.</p>
        ) : (
          <ul>
            {assignments.map((assignment) => (
              <li key={assignment.assignment_id}>
                <section>
                  <h3>{assignment.teacher_name}</h3>

                  <p>Kelas: {assignment.class_name}</p>

                  <p>Mulai: {assignment.effective_from}</p>

                  <p>Berakhir: {assignment.effective_to || "-"}</p>

                  <p>Status: {getAssignmentStatus(assignment, today)}</p>

                  {!assignment.effective_to && (
                    <>
                      <p>
                        <label htmlFor={`end-${assignment.assignment_id}`}>Tanggal Akhir Penugasan</label>
                      </p>

                      <input
                        id={`end-${assignment.assignment_id}`}
                        type="date"
                        min={assignment.effective_from}
                        value={endDates[assignment.assignment_id] || ""}
                        onChange={(event) =>
                          setEndDates((previous) => ({
                            ...previous,
                            [assignment.assignment_id]: event.target.value,
                          }))
                        }
                      />

                      <p>
                        <button type="button" disabled={loading} onClick={() => handleEnd(assignment.assignment_id)}>
                          Akhiri Penugasan
                        </button>
                      </p>
                    </>
                  )}
                </section>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
