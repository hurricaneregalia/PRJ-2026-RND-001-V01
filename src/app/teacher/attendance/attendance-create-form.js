"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  getAttendanceRosterPreviewAction,
  createAttendanceSessionAction,
} from "./actions";
import { ATTENDANCE_STATUS_OPTIONS, validateAttendanceCreateForm, buildStudentStatuses } from "./attendance-utils";

export default function AttendanceCreateForm({ classes = [], fixedClassId = "", initialRoster = null }) {
  const router = useRouter();
  const [classId, setClassId] = useState(fixedClassId || (classes.length === 1 ? classes[0].class_id : ""));
  const [roster, setRoster] = useState(initialRoster || []);
  const [statuses, setStatuses] = useState(() => {
    const initial = {};
    (initialRoster || []).forEach((student) => {
      initial[student.student_id] = student.status || "Hadir";
    });
    return initial;
  });
  const [previewCompleted, setPreviewCompleted] = useState(Boolean(initialRoster));
  const requestIdRef = useRef(0);
  const [locationType, setLocationType] = useState("IN_CLASS");
  const [locationName, setLocationName] = useState("");
  const [locationNote, setLocationNote] = useState("");
  const [lessonMaterial, setLessonMaterial] = useState("");

  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  async function handlePreview() {
    setPreviewError("");
    setSubmitError("");
    setSubmitSuccess("");
    setPreviewCompleted(false);

    if (!classId) {
      setPreviewError("Pilih kelas terlebih dahulu.");
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setLoadingPreview(true);

    try {
      const result = await getAttendanceRosterPreviewAction(classId);

      if (requestId !== requestIdRef.current) {
        return;
      }

      if (!result.success) {
        setPreviewError(result.error || "Gagal memuat preview roster.");
        setRoster([]);
        setStatuses({});
        setPreviewCompleted(false);
        return;
      }

      const students = result.data?.students || [];
      setRoster(students);

      const initialStatuses = {};
      students.forEach((student) => {
        initialStatuses[student.student_id] = student.status || "Hadir";
      });
      setStatuses(initialStatuses);
      setPreviewCompleted(true);
    } catch (error) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      console.error("Preview roster failed:", error);
      setPreviewError("Terjadi kesalahan saat memuat preview roster.");
      setRoster([]);
      setStatuses({});
      setPreviewCompleted(false);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoadingPreview(false);
      }
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setSubmitError("");
    setSubmitSuccess("");

    if (!previewCompleted) {
      setSubmitError("Preview roster wajib dimuat sebelum menyimpan sesi.");
      return;
    }

    const formErrors = validateAttendanceCreateForm({
      classId,
      locationType,
      locationName,
      locationNote,
      lessonMaterial,
    });

    if (formErrors.length > 0) {
      setSubmitError(formErrors.join(" "));
      return;
    }

    setLoadingSubmit(true);

    try {
      const result = await createAttendanceSessionAction({
        class_id: classId,
        location_type: locationType,
        location_name: locationName,
        location_note: locationNote,
        lesson_material: lessonMaterial,
        student_statuses: buildStudentStatuses(roster, statuses),
      });

      if (!result.success) {
        setSubmitError(result.error || "Gagal membuat sesi absensi.");
        return;
      }

      setSubmitSuccess(result.message || "Sesi absensi berhasil dibuat.");
      router.refresh();

      setClassId("");
      setRoster([]);
      setStatuses({});
      setPreviewCompleted(false);
      setLocationType("IN_CLASS");
      setLocationName("");
      setLocationNote("");
      setLessonMaterial("");
    } catch (error) {
      console.error("Create attendance session failed:", error);
      setSubmitError("Terjadi kesalahan saat menyimpan sesi absensi.");
    } finally {
      setLoadingSubmit(false);
    }
  }

  return (
    <section>
      <h2>Buat Sesi Absensi</h2>

      <form onSubmit={handleSubmit}>
        {!fixedClassId && (
          <div>
            <label htmlFor="classId">Kelas</label>
            <select
              id="classId"
              value={classId}
              onChange={(event) => {
                setClassId(event.target.value);
                setRoster([]);
                setStatuses({});
                setPreviewCompleted(false);
                setPreviewError("");
                setSubmitError("");
                setSubmitSuccess("");
              }}
              required
            >
              <option value="">Pilih kelas</option>
              {classes.map((item) => (
                <option key={item.class_id} value={item.class_id}>
                  {item.class_name}
                </option>
              ))}
            </select>
          </div>
        )}

        {!fixedClassId && !initialRoster && (
          <div>
            <button type="button" onClick={handlePreview} disabled={loadingPreview || !classId}>
              {loadingPreview ? "Memuat..." : "Muat Preview Roster"}
            </button>
          </div>
        )}

        {previewError && <p role="alert">{previewError}</p>}

        {previewCompleted && (
          <>
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

            {roster.length === 0 && <p>Tidak ada siswa aktif pada kelas ini.</p>}

            {roster.length > 0 && (
            <section>
              <h3>Daftar Siswa</h3>

              <ul>
                {roster.map((student) => (
                  <li key={student.student_id}>
                    <p>{student.full_name || student.student_id}</p>
                    <p>Nomor Induk: {student.student_number || "-"}</p>

                    <label htmlFor={`status-${student.student_id}`}>Status</label>
                    <select
                      id={`status-${student.student_id}`}
                      value={statuses[student.student_id] || "Hadir"}
                      onChange={(event) =>
                        setStatuses((previous) => ({
                          ...previous,
                          [student.student_id]: event.target.value,
                        }))
                      }
                    >
                      {ATTENDANCE_STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </li>
                ))}
              </ul>
            </section>
            )}

            <div>
              <button type="submit" disabled={loadingSubmit}>
                {loadingSubmit ? "Menyimpan..." : "Simpan Sesi Absensi"}
              </button>
            </div>
          </>
        )}

        {submitError && <p role="alert">{submitError}</p>}
        {submitSuccess && <p role="status">{submitSuccess}</p>}
      </form>
    </section>
  );
}