"use client";

import { useState } from "react";

import AttendanceCreateForm from "./attendance-create-form";
import AttendanceList from "./attendance-list";

export default function AttendanceManagement({ todayWIB, classes = [], sessions = [] }) {
  const [selectedClassId, setSelectedClassId] = useState("");

  const selectedClass = classes.find((item) => item.class_id === selectedClassId) || null;
  const hasSessionThisWeek = selectedClass?.has_session_this_week === true;

  return (
    <main>
      <p>Tanggal hari ini (WIB): {todayWIB}</p>

      <section>
        <h2>Kelas yang Ditugaskan Hari Ini</h2>

        {classes.length === 0 ? (
          <p>Belum ada kelas aktif yang ditugaskan kepada Anda hari ini.</p>
        ) : (
          <ul>
            {classes.map((item) => (
              <li key={item.class_id}>
                <button type="button" onClick={() => setSelectedClassId(item.class_id)}>
                  {item.class_name}
                </button>

                {item.has_session_this_week ? (
                  <span> (sudah ada sesi minggu ini)</span>
                ) : (
                  <span> (belum ada sesi minggu ini)</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {selectedClass && (
        <section>
          <h2>Pembuatan Sesi: {selectedClass.class_name}</h2>

          {hasSessionThisWeek ? (
            <p>Sesi untuk kelas ini pada minggu ini sudah dibuat. Pilih kelas lain atau lihat daftar sesi.</p>
          ) : (
            <AttendanceCreateForm key={selectedClass.class_id} classes={[selectedClass]} />
          )}
        </section>
      )}

      <AttendanceList sessions={sessions} />

    </main>
  );
}