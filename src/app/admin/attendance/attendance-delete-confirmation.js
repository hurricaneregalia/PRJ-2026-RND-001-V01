"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { deleteAttendanceSessionAction } from "./actions";

export default function AttendanceDeleteConfirmation({ sessionId, open, onClose }) {
  const router = useRouter();

  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) {
    return null;
  }

  async function handleConfirm() {
    if (!reason.trim()) {
      setError("Alasan penghapusan wajib diisi.");
      return;
    }

    if (reason.trim().length > 500) {
      setError("Alasan penghapusan tidak boleh melebihi 500 karakter.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await deleteAttendanceSessionAction(sessionId, reason.trim());

      if (!result.success) {
        setError(result.error || "Gagal menghapus sesi absensi.");
        return;
      }

      router.push("/admin/attendance");
      router.refresh();
    } catch (error) {
      console.error("Delete attendance session failed:", error);
      setError("Terjadi kesalahan saat menghapus sesi absensi.");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    if (loading) {
      return;
    }

    setReason("");
    setError("");
    onClose();
  }

  return (
    <div role="dialog" aria-modal="true">
      <section>
        <h2>Hapus Sesi Absensi</h2>

        <p>Peringatan: penghapusan tidak dapat dibatalkan.</p>

        <div>
          <label htmlFor="deleteReason">Alasan Penghapusan</label>
          <textarea
            id="deleteReason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={500}
            rows={4}
            required
            disabled={loading}
          />
        </div>

        {error && <p role="alert">{error}</p>}

        <div>
          <button type="button" onClick={handleClose} disabled={loading}>
            Batal
          </button>
          <button type="button" onClick={handleConfirm} disabled={loading || !reason.trim()}>
            {loading ? "Menghapus..." : "Konfirmasi Hapus"}
          </button>
        </div>
      </section>
    </div>
  );
}