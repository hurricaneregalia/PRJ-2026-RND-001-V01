"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { getAttendanceSessionsAction } from "./actions";
import AttendanceFilters from "./attendance-filters";
import AttendanceList from "./attendance-list";

const PAGE_SIZE = 20;

export default function AttendanceManagement({ sessions = [], classes = [], teachers = [] }) {
  const router = useRouter();
  const loadMoreRef = useRef(null);
  const requestIdRef = useRef(0);

  const academicYears = Array.from(new Set(sessions.map((item) => item.academic_year_id).filter(Boolean))).sort();

  const [filters, setFilters] = useState({
    classId: "",
    teacherUserId: "",
    attendanceDate: "",
    locationType: "",
    academicYearId: "",
  });

  const [filteredSessions, setFilteredSessions] = useState(sessions);
  const [messages, setMessages] = useState({});
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ key: "", count: PAGE_SIZE });

  const paginationKey = JSON.stringify(filters);
  const visibleCount = pagination.key === paginationKey ? pagination.count : PAGE_SIZE;
  const visibleSessions = filteredSessions.slice(0, visibleCount);

  useEffect(() => {
    const target = loadMoreRef.current;

    if (!target) {
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && visibleCount < filteredSessions.length) {
        setPagination({ key: paginationKey, count: visibleCount + PAGE_SIZE });
      }
    });

    observer.observe(target);

    return () => observer.disconnect();
  }, [visibleCount, filteredSessions.length, paginationKey]);

  async function handleApplyFilters() {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setLoading(true);
    setMessages({});

    try {
      const result = await getAttendanceSessionsAction({
        class_id: filters.classId,
        teacher_user_id: filters.teacherUserId,
        attendance_date: filters.attendanceDate,
        location_type: filters.locationType,
        academic_year_id: filters.academicYearId,
      });

      if (requestId !== requestIdRef.current) {
        return;
      }

      if (!result.success) {
        setMessages({ error: result.error });
        return;
      }

      setFilteredSessions(result.data || []);
      setPagination({ key: paginationKey, count: PAGE_SIZE });
    } catch (error) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      console.error("Get attendance sessions failed:", error);
      setMessages({ error: "Terjadi kesalahan saat memuat data absensi." });
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }

  function handleResetFilters() {
    setFilters({
      classId: "",
      teacherUserId: "",
      attendanceDate: "",
      locationType: "",
      academicYearId: "",
    });
    setFilteredSessions(sessions);
    setPagination({ key: "", count: PAGE_SIZE });
    setMessages({});
  }

  return (
    <main>
      <AttendanceFilters
        classes={classes}
        teachers={teachers}
        academicYears={academicYears}
        filters={filters}
        setFilters={setFilters}
      />

      <div>
        <button type="button" onClick={handleApplyFilters} disabled={loading}>
          {loading ? "Memuat..." : "Terapkan Filter"}
        </button>
        <button type="button" onClick={handleResetFilters} disabled={loading}>
          Reset Filter
        </button>
        <button type="button" onClick={() => router.refresh()} disabled={loading}>
          Muat Ulang
        </button>
      </div>

      {messages.error && <p role="alert">{messages.error}</p>}

      <AttendanceList sessions={visibleSessions} classes={classes} teachers={teachers} />

      {visibleCount < filteredSessions.length && (
        <div ref={loadMoreRef}>
          <p>Memuat lebih banyak...</p>
        </div>
      )}

      <p>
        Menampilkan {visibleSessions.length} dari {filteredSessions.length} sesi.
      </p>
    </main>
  );
}