// src/app/admin/classes/[classId]/class-membership-management.js

"use client";

import { getTodayWIB } from "@/lib/attendance-date-utils";
import { isMembershipActive } from "./class-membership-helpers";

import { useClassMembershipActions } from "./class-membership-actions";

import ClassMembershipPlacement from "./class-membership-placement";
import ClassMembershipMovement from "./class-membership-movement";

export default function ClassMembershipManagement({ classId, students = [], memberships = [], classes = [] }) {
  const today = getTodayWIB();

  const actions = useClassMembershipActions(classId, today);

  const activeMemberships = memberships.filter((membership) => isMembershipActive(membership, today));

  const studentsWithActiveMembership = new Set(activeMemberships.map((membership) => membership.student_id));

  const classMembers = activeMemberships.filter((membership) => membership.class_id === classId);

  const placementStudents = students.filter((student) => student.student_status === "active" && !studentsWithActiveMembership.has(student.student_id));

  const targetClasses = classes.filter((item) => item.class_status === "active" && item.class_id !== classId);

  return (
    <section>
      <h2>Pengelolaan Anggota Kelas</h2>

      <p>Tanggal efektif: {today} (WIB)</p>

      {actions.message && (
        <p
          role="status"
          aria-live="polite"
          style={{
            color: actions.message.type === "success" ? "green" : "red",
          }}
        >
          {actions.message.text}
        </p>
      )}

      <ClassMembershipPlacement
        placementStudents={placementStudents}
        students={students}
        studentsWithActiveMembership={studentsWithActiveMembership}
        selectedIds={actions.selectedPlacementIds}
        setSelectedIds={actions.setSelectedPlacementIds}
        placementReason={actions.placementReason}
        setPlacementReason={actions.setPlacementReason}
        handleSelection={actions.handleSelection}
        handleSelectAll={actions.handleSelectAll}
        handleBulkPlacement={actions.handleBulkPlacement}
        isPending={actions.isPending}
        result={actions.placementResult}
      />

      <ClassMembershipMovement
        classMembers={classMembers}
        students={students}
        targetClasses={targetClasses}
        selectedIds={actions.selectedMoveIds}
        setSelectedIds={actions.setSelectedMoveIds}
        targetClassId={actions.targetClassId}
        setTargetClassId={actions.setTargetClassId}
        moveReason={actions.moveReason}
        setMoveReason={actions.setMoveReason}
        handleSelection={actions.handleSelection}
        handleSelectAll={actions.handleSelectAll}
        handleBulkMove={actions.handleBulkMove}
        isPending={actions.isPending}
        result={actions.moveResult}
      />
    </section>
  );
}
