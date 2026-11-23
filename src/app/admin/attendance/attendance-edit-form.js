"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  updateAttendanceSessionAction,
  updateAttendanceRecordStatusAction,
} from "./actions";
import AttendanceDeleteConfirmation from "./attendance-delete-confirmation";

const STATUS_OPTIONS = [
  { value: "Hadir", label: "Hadir" },
  { value: "Sakit", label: "Sakit" },
  { value: "Izin", label: "Izin" },
  { value: "Alpa", label: "Alpa" },
];

export default function AttendanceEditForm({ session, records = [] }) {
  const router = useRouter();

  const [locationType, setLocationType] = useState(session.location_type || "IN_CLASS");
  const [locationName, setLocationName] = useState(session.location_name || "");
  const [locationNote, setLocationNote] = useState(session.location_note || "");
  const [lessonMaterial, setLessonMaterial] = useState(session.lesson_material || "");

  const [savedStatuses, setSavedStatuses] = useState(() => {
    const initial = {};
    records.forEach((record) => {
      initial[record.attendance_id] = record.status || "Hadir";
    });
    return initial;
  });

  const [statuses, setStatuses] = useState(() => {
    const initial = {};
    records.forEach((record) => {
      initial[record.attendance_id] = record.status || "Hadir";
    });
    return initial;
  });

  const [savingSession, setSavingSession] = useState(false);
  const [savingRow, setSavingRow] = useState("");
  const [sessionError, setSessionError] = useState("");
  const [sessionSuccess, setSessionSuccess] = useState("");
  const [rowErrors, setRowErrors] = useState({});
  const [rowSuccess, setRowSuccess] = useState({});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  function validateSessionForm() {
    const errors = [];

    if (locationType === "OUTSIDE_CLASS" && !locationName.trim()) {
      errors.push("Nama lokasi wajib diisi untuk kegiatan di luar kelas.");
    }

    if (locationName.trim().length > 150) {
      errors.push("Nama lokasi tidak boleh melebihi 150 karakter.");
    }

    if (locationNote.trim().length > 1000) {
      errors.push("Catatan lokasi tidak boleh melebihi 1000 karakter.");
    }

    if (!lessonMaterial.trim()) {
      errors.push("Materi pelajaran wajib diisi.");
    } else if (lessonMaterial.trim().length > 5000) {
      errors.push("Materi pelajaran tidak boleh melebihi 5000 karakter.");
    }

    return errors;
  }

  async function handleSessionSubmit(event) {
    event.preventDefault();

    setSessionError("");
    setSessionSuccess("");

    const validationErrors = validateSessionForm();

    if (validationErrors.length > 0) {
      setSessionError(validationErrors.join(" "));
      return;
    }

    setSavingSession(true);

    try {
      const result = await updateAttendanceSessionAction(session.session_id, {
        location_type: locationType,
        location_name: locationName,
        location_note: locationNote,
        lesson_material: lessonMaterial,
      });

      if (!result.success) {
        setSessionError(result.error || "Gagal memperbarui informasi sesi.");
        return;
      }

      setSessionSuccess("Informasi sesi berhasil diperbarui.");
      router.refresh();
    } catch (error) {
      console.error("Update attendance session failed:", error);
      setSessionError("Terjadi kesalahan saat menyimpan informasi sesi.");
    } finally {
      setSavingSession(false);
    }
  }

  async function handleRowSave(attendanceId) {
    const newStatus = statuses[attendanceId];
    const savedStatus = savedStatuses[attendanceId];

    if (newStatus === savedStatus) {
      return;
    }

    setSavingRow(attendanceId);
    setRowErrors((previous) => ({ ...previous, [attendanceId]: "" }));
    setRowSuccess((previous) => ({ ...previous, [attendanceId]: "" }));

    try {
      const result = await updateAttendanceRecordStatusAction(attendanceId, newStatus, "");

      if (!result.success) {
        setRowErrors((previous) => ({
          ...previous,
          [attendanceId]: result.error || "Gagal memperbarui status kehadiran.",
        }));
        return;
      }

      setSavedStatuses((previous) => ({
        ...previous,
        [attendanceId]: newStatus,
      }));
      setRowSuccess((previous) => ({
        ...previous,
        [attendanceId]: "Status berhasil diperbarui.",
      }));
    } catch (error) {
      console.error("Update attendance record status failed:", error);
      setRowErrors((previous) => ({
        ...previous,
        [attendanceId]: "Terjadi kesalahan saat menyimpan status kehadiran.",
      }));
    } finally {
      setSavingRow("");
    }
  }

  return (
    <section>
      <h2>Informasi Sesi</h2>

      <form onSubmit={handleSessionSubmit}>
        <div>
          <label htmlFor="locationType">Jenis Lokasi</label>
          <select
            id="locationType"
            value={locationType}
            onChange={(event) => setLocationType(event.target.value)}
            required
          >
            <option value="IN_CLASS">Dalam kelas</option>
            <option value="OUTSIDE_CLASS">Luar kelas</option>
          </select>
        </div>

        {locationType === "OUTSIDE_CLASS" && (
          <div>
            <label htmlFor="locationName">Nama Lokasi</label>
            <input
              id="locationName"
              type="text"
              value={locationName}
              onChange={(event) => setLocationName(event.target.value)}
              maxLength={150}
              required
            />
          </div>
        )}

        <div>
          <label htmlFor="locationNote">Catatan Lokasi</label>
          <textarea
            id="locationNote"
            value={locationNote}
            onChange={(event) => setLocationNote(event.target.value)}
            maxLength={1000}
            rows={3}
          />
        </div>

        <div>
          <label htmlFor="lessonMaterial">Materi Pelajaran</label>
          <textarea
            id="lessonMaterial"
            value={lessonMaterial}
            onChange={(event) => setLessonMaterial(event.target.value)}
            maxLength={5000}
            rows={4}
            required
          />
        </div>

        {sessionError && <p role="alert">{sessionError}</p>}
        {sessionSuccess && <p role="status">{sessionSuccess}</p>}

        <div>
          <button type="submit" disabled={savingSession}>
            {savingSession ? "Menyimpan..." : "Simpan Informasi Sesi"}
          </button>
        </div>
      </form>

      <h2>Daftar Siswa</h2>

      {records.length === 0 ? (
        <p>Tidak ada record siswa pada sesi ini.</p>
      ) : (
        <ul>
          {records.map((record) => {
            const currentStatus = statuses[record.attendance_id] || "Hadir";
            const savedStatus = savedStatuses[record.attendance_id] || "Hadir";
            const isChanged = currentStatus !== savedStatus;
            const isSaving = savingRow === record.attendance_id;

            return (
              <li key={record.attendance_id}>
                <p>{record.student_name || record.student_id}</p>
                <p>Nomor Induk: {record.student_number || "-"}</p>

                <label htmlFor={`status-${record.attendance_id}`}>Status</label>
                <select
                  id={`status-${record.attendance_id}`}
                  value={currentStatus}
                  onChange={(event) =>
                    setStatuses((previous) => ({
                      ...previous,
                      [record.attendance_id]: event.target.value,
                    }))
                  }
                  disabled={isSaving}
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => handleRowSave(record.attendance_id)}
                  disabled={!isChanged || isSaving}
                >
                  {isSaving ? "Menyimpan..." : "Simpan"}
                </button>

                {rowErrors[record.attendance_id] && (
                  <p role="alert">{rowErrors[record.attendance_id]}</p>
                )}
                {rowSuccess[record.attendance_id] && (
                  <p role="status">{rowSuccess[record.attendance_id]}</p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    <div>
        <button type="button" onClick={() => setShowDeleteDialog(true)}>
          Hapus Sesi
        </button>
      </div>

      <AttendanceDeleteConfirmation
        sessionId={session.session_id}
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
      />
    </section>
  );
}