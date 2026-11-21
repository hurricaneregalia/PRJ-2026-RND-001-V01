// src/app/admin/classes/[classId]/class-membership-actions.js

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { createClassMembershipsBulkAction, moveClassMembershipsBulkAction } from "../../students/actions";

export function useClassMembershipActions(classId, today) {
  const router = useRouter();

  const [isPending, startTransition] = useTransition();

  const [message, setMessage] = useState(null);

  const [selectedPlacementIds, setSelectedPlacementIds] = useState([]);
  const [selectedMoveIds, setSelectedMoveIds] = useState([]);

  const [placementReason, setPlacementReason] = useState("");
  const [moveReason, setMoveReason] = useState("");
  const [targetClassId, setTargetClassId] = useState("");

  const [placementResult, setPlacementResult] = useState(null);
  const [moveResult, setMoveResult] = useState(null);

  function handleSelection(setter, studentId, checked) {
    setter((current) => {
      if (checked) {
        return current.includes(studentId) ? current : [...current, studentId];
      }

      return current.filter((id) => id !== studentId);
    });
  }

  function handleSelectAll(setter, studentIds, checked) {
    setter(checked ? [...studentIds] : []);
  }

  function handleBulkPlacement(event) {
    event.preventDefault();

    if (selectedPlacementIds.length === 0) {
      setMessage({
        type: "error",
        text: "Pilih minimal satu siswa untuk ditempatkan.",
      });
      return;
    }

    const input = {
      student_ids: selectedPlacementIds,
      class_id: classId,
      effective_from: today,
      reason: placementReason,
    };

    setMessage(null);
    setPlacementResult(null);

    startTransition(async () => {
      try {
        const result = await createClassMembershipsBulkAction(input);

        setPlacementResult(result);
        setSelectedPlacementIds([]);
        setPlacementReason("");

        setMessage({
          type: "success",
          text: "Proses penempatan siswa selesai.",
        });

        router.refresh();
      } catch (error) {
        setMessage({
          type: "error",
          text: error?.message || "Bulk penempatan gagal.",
        });
      }
    });
  }

  function handleBulkMove(event) {
    event.preventDefault();

    if (selectedMoveIds.length === 0) {
      setMessage({
        type: "error",
        text: "Pilih minimal satu siswa untuk dipindahkan.",
      });
      return;
    }

    if (!targetClassId) {
      setMessage({
        type: "error",
        text: "Pilih kelas tujuan pemindahan.",
      });
      return;
    }

    const input = {
      student_ids: selectedMoveIds,
      new_class_id: targetClassId,
      reason: moveReason,
    };

    setMessage(null);
    setMoveResult(null);

    startTransition(async () => {
      try {
        const result = await moveClassMembershipsBulkAction(input);

        setMoveResult(result);
        setSelectedMoveIds([]);
        setMoveReason("");
        setTargetClassId("");

        setMessage({
          type: "success",
          text: "Proses pemindahan siswa selesai.",
        });

        router.refresh();
      } catch (error) {
        setMessage({
          type: "error",
          text: error?.message || "Bulk pemindahan gagal.",
        });
      }
    });
  }

  return {
    isPending,
    message,

    selectedPlacementIds,
    setSelectedPlacementIds,

    selectedMoveIds,
    setSelectedMoveIds,

    placementReason,
    setPlacementReason,

    moveReason,
    setMoveReason,

    targetClassId,
    setTargetClassId,

    placementResult,
    moveResult,

    handleSelection,
    handleSelectAll,
    handleBulkPlacement,
    handleBulkMove,
  };
}
