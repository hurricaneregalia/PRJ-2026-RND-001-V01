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

        if (!result || result.error) {
          setMessage({
            type: "error",
            text: result?.error || "Bulk penempatan gagal.",
          });
          return;
        }

        const processedCount = result?.processed_count ?? result?.processed?.length ?? 0;
        const skippedCount = result?.skipped_count ?? result?.skipped?.length ?? 0;

        setPlacementResult(result);
        setSelectedPlacementIds([]);
        setPlacementReason("");

        if (processedCount === 0) {
          setMessage({
            type: "error",
            text: `Proses penempatan siswa selesai: 0 diproses, ${skippedCount} dilewati.`,
          });
        } else if (skippedCount === 0) {
          setMessage({
            type: "success",
            text: `Proses penempatan siswa selesai: ${processedCount} diproses, 0 dilewati.`,
          });
        } else {
          setMessage({
            type: "success",
            text: `Proses penempatan siswa sebagian: ${processedCount} diproses, ${skippedCount} dilewati.`,
          });
        }

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

        if (!result || result.error) {
          setMessage({
            type: "error",
            text: result?.error || "Bulk pemindahan gagal.",
          });
          return;
        }

        const processedCount = result?.processed_count ?? result?.processed?.length ?? 0;
        const skippedCount = result?.skipped_count ?? result?.skipped?.length ?? 0;

        setMoveResult(result);
        setSelectedMoveIds([]);
        setMoveReason("");
        setTargetClassId("");

        if (processedCount === 0) {
          setMessage({
            type: "error",
            text: `Proses pemindahan siswa selesai: 0 diproses, ${skippedCount} dilewati.`,
          });
        } else if (skippedCount === 0) {
          setMessage({
            type: "success",
            text: `Proses pemindahan siswa selesai: ${processedCount} diproses, 0 dilewati.`,
          });
        } else {
          setMessage({
            type: "success",
            text: `Proses pemindahan siswa sebagian: ${processedCount} diproses, ${skippedCount} dilewati.`,
          });
        }

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
