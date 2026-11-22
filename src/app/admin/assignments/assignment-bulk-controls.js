// src/app/admin/assignments/assignment-bulk-controls.js

"use client";

export default function AssignmentBulkControls({ selectedActiveCount, bulkEffectiveTo, minBulkEffectiveTo, loading, onBulkEffectiveToChange, onBulkEnd }) {
  return (
    <section>
      <h3>Akhiri Penugasan Massal</h3>

      <p>{selectedActiveCount} penugasan aktif dipilih.</p>

      <p>
        <label htmlFor="bulkEffectiveTo">Tanggal Akhir</label>
      </p>

      <input id="bulkEffectiveTo" type="date" min={minBulkEffectiveTo} value={bulkEffectiveTo} onChange={(event) => onBulkEffectiveToChange(event.target.value)} />

      <p>
        <button type="button" disabled={loading || selectedActiveCount === 0} onClick={onBulkEnd}>
          {loading ? "Memproses..." : "Akhiri Penugasan Terpilih"}
        </button>
      </p>
    </section>
  );
}
