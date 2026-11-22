// src/app/admin/assignments/assignment-management.js

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { createTeacherAssignmentAction, bulkEndTeacherAssignmentsAction } from "./actions";

import { getTomorrowWIB } from "./assignment-date-utils";

import { useAssignmentManagementOptions } from "./assignment-management-options";
import { useFilteredAssignments } from "./assignment-management-list";
import { useAssignmentBulkSelection } from "./assignment-management-bulk";

import AssignmentCreateForm from "./assignment-create-form";
import AssignmentFeedback from "./assignment-feedback";
import AssignmentFilters from "./assignment-filters";
import AssignmentSortControls from "./assignment-sort-controls";
import AssignmentBulkControls from "./assignment-bulk-controls";
import AssignmentList from "./assignment-list";

const PAGE_SIZE = 20;

export default function AssignmentManagement({ teachers, classes, assignments, todayWIB }) {
  const router = useRouter();
  const loadMoreRef = useRef(null);

  const [userId, setUserId] = useState("");
  const [classId, setClassId] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [reason, setReason] = useState("");

  const [messages, setMessages] = useState({});
  const [loading, setLoading] = useState(false);

  const [teacherFilter, setTeacherFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [effectiveFromFilter, setEffectiveFromFilter] = useState("");

  const [sortField, setSortField] = useState("updated_at");
  const [sortDirection, setSortDirection] = useState("desc");

  const [selectedAssignmentIds, setSelectedAssignmentIds] = useState([]);
  const [bulkEffectiveTo, setBulkEffectiveTo] = useState("");
  const [bulkResults, setBulkResults] = useState([]);

  const [pagination, setPagination] = useState({
    key: "",
    count: PAGE_SIZE,
  });

  const paginationKey = JSON.stringify([teacherFilter, classFilter, statusFilter, effectiveFromFilter, sortField, sortDirection]);

  const visibleCount = pagination.key === paginationKey ? pagination.count : PAGE_SIZE;

  const minBulkEffectiveTo = getTomorrowWIB(todayWIB);

  const { teachersWithAssignments, classesWithAssignments, availableTeachers, availableClasses, canCreateAssignment } = useAssignmentManagementOptions({
    teachers,
    classes,
    assignments,
    todayWIB,
    effectiveFrom,
  });

  const filteredAssignments = useFilteredAssignments({
    assignments,
    todayWIB,
    teacherFilter,
    classFilter,
    statusFilter,
    effectiveFromFilter,
    sortField,
    sortDirection,
  });

  const visibleAssignments = filteredAssignments.slice(0, visibleCount);

  const { selectedActiveAssignments, visibleActiveAssignments, allVisibleActiveSelected } = useAssignmentBulkSelection({
    assignments: filteredAssignments,
    visibleAssignments,
    selectedAssignmentIds,
    todayWIB,
  });

  useEffect(() => {
    const target = loadMoreRef.current;

    if (!target || visibleCount >= filteredAssignments.length) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setPagination((previous) => {
            const currentCount = previous.key === paginationKey ? previous.count : PAGE_SIZE;

            return {
              key: paginationKey,
              count: Math.min(currentCount + PAGE_SIZE, filteredAssignments.length),
            };
          });
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, [visibleCount, filteredAssignments.length, paginationKey]);

  function handleSelection(assignmentId, checked) {
    setSelectedAssignmentIds((previous) => {
      if (checked) {
        return previous.includes(assignmentId) ? previous : [...previous, assignmentId];
      }

      return previous.filter((id) => id !== assignmentId);
    });

    setBulkResults([]);
  }

  function handleSelectAll(checked) {
    const visibleIds = visibleActiveAssignments.map((assignment) => assignment.assignment_id);

    if (checked) {
      setSelectedAssignmentIds((previous) => [...new Set([...previous, ...visibleIds])]);
    } else {
      setSelectedAssignmentIds((previous) => previous.filter((id) => !visibleIds.includes(id)));
    }

    setBulkResults([]);
  }

  async function handleCreate(event) {
    event.preventDefault();

    setLoading(true);
    setMessages({});

    try {
      const result = await createTeacherAssignmentAction({
        user_id: userId,
        class_id: classId,
        effective_from: effectiveFrom,
        reason,
      });

      if (!result.success) {
        setMessages({ error: result.error });
        return;
      }

      setMessages({ success: result.message });

      setUserId("");
      setClassId("");
      setEffectiveFrom("");
      setReason("");

      router.refresh();
    } catch (error) {
      console.error("Create teacher assignment failed:", error);

      setMessages({
        error: "Terjadi kesalahan saat menyimpan penugasan.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleBulkEnd() {
    if (selectedActiveAssignments.length === 0) {
      setMessages({
        error: "Pilih minimal satu penugasan yang masih aktif.",
      });
      return;
    }

    if (!bulkEffectiveTo) {
      setMessages({
        error: "Tanggal akhir bulk wajib diisi.",
      });
      return;
    }

    if (bulkEffectiveTo < minBulkEffectiveTo) {
      setMessages({
        error: "Tanggal akhir harus setelah hari ini.",
      });
      return;
    }

    setLoading(true);
    setMessages({});
    setBulkResults([]);

    try {
      const items = selectedActiveAssignments.map((assignment) => ({
        assignment_id: assignment.assignment_id,
        effective_to: bulkEffectiveTo,
        reason: "Penugasan diakhiri secara massal oleh administrator.",
      }));

      const result = await bulkEndTeacherAssignmentsAction(items);

      if (!result || result.error) {
        setMessages({
          error: result?.error || "Gagal mengakhiri penugasan secara massal.",
        });
        return;
      }

      setBulkResults(result.results || []);

      const hasFailed = result.failed > 0;

      setMessages(
        hasFailed
          ? {
              error: `Bulk end selesai: ${result.succeeded} berhasil, ${result.failed} gagal dari ${result.total} penugasan.`,
            }
          : {
              success: `Bulk end selesai: ${result.succeeded} berhasil dari ${result.total} penugasan.`,
            },
      );

      setSelectedAssignmentIds([]);
      setBulkEffectiveTo("");

      router.refresh();
    } catch (error) {
      console.error("Bulk end teacher assignments failed:", error);

      setMessages({
        error: "Terjadi kesalahan saat bulk end penugasan.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <AssignmentCreateForm
        userId={userId}
        classId={classId}
        effectiveFrom={effectiveFrom}
        reason={reason}
        availableTeachers={availableTeachers}
        availableClasses={availableClasses}
        canCreateAssignment={canCreateAssignment}
        loading={loading}
        onUserIdChange={setUserId}
        onClassIdChange={setClassId}
        onEffectiveFromChange={setEffectiveFrom}
        onReasonChange={setReason}
        onSubmit={handleCreate}
      />

      <AssignmentFeedback messages={messages} bulkResults={bulkResults} />

      <section>
        <h2>Daftar Penugasan</h2>

        <AssignmentFilters
          teacherFilter={teacherFilter}
          classFilter={classFilter}
          statusFilter={statusFilter}
          effectiveFromFilter={effectiveFromFilter}
          teachersWithAssignments={teachersWithAssignments}
          classesWithAssignments={classesWithAssignments}
          onTeacherFilterChange={(value) => {
            setTeacherFilter(value);
            setSelectedAssignmentIds([]);
          }}
          onClassFilterChange={(value) => {
            setClassFilter(value);
            setSelectedAssignmentIds([]);
          }}
          onStatusFilterChange={(value) => {
            setStatusFilter(value);
            setSelectedAssignmentIds([]);
          }}
          onEffectiveFromFilterChange={(value) => {
            setEffectiveFromFilter(value);
            setSelectedAssignmentIds([]);
          }}
        />

        <AssignmentSortControls sortField={sortField} sortDirection={sortDirection} onSortFieldChange={setSortField} onSortDirectionChange={setSortDirection} />

        <AssignmentBulkControls
          selectedActiveCount={selectedActiveAssignments.length}
          bulkEffectiveTo={bulkEffectiveTo}
          minBulkEffectiveTo={minBulkEffectiveTo}
          loading={loading}
          onBulkEffectiveToChange={setBulkEffectiveTo}
          onBulkEnd={handleBulkEnd}
        />

        <AssignmentList
          assignments={assignments}
          filteredAssignments={filteredAssignments}
          visibleAssignments={visibleAssignments}
          selectedAssignmentIds={selectedAssignmentIds}
          allVisibleActiveSelected={allVisibleActiveSelected}
          visibleCount={visibleCount}
          loadMoreRef={loadMoreRef}
          todayWIB={todayWIB}
          onSelectAll={handleSelectAll}
          onSelectionChange={handleSelection}
        />
      </section>
    </main>
  );
}
