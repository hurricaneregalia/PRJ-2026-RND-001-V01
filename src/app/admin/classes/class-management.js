// src/app/admin/classes/class-management.js
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { createClassAction, updateClassAction, bulkUpdateClassStatusAction } from "./actions";

export default function ClassManagement({ classes }) {
  const router = useRouter();

  const [className, setClassName] = useState("");
  const [editingClassId, setEditingClassId] = useState("");
  const [editingClassName, setEditingClassName] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);

  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState("updated_at");
  const [sortDirection, setSortDirection] = useState("desc");
  const [selectedClassIds, setSelectedClassIds] = useState([]);
  const [bulkStatus, setBulkStatus] = useState("inactive");
  const [bulkResults, setBulkResults] = useState([]);

  const filteredClasses = useMemo(() => {
    const filtered = classes.filter((item) => {
      return statusFilter === "all" || item.class_status === statusFilter;
    });

    return filtered.sort((a, b) => {
      const comparison = String(a[sortField] || "").localeCompare(String(b[sortField] || ""), "id", { sensitivity: "base", numeric: true });

      if (comparison !== 0) {
        return sortDirection === "asc" ? comparison : -comparison;
      }

      return String(a.class_id).localeCompare(String(b.class_id));
    });
  }, [classes, statusFilter, sortField, sortDirection]);

  function handleSelection(classId, checked) {
    setSelectedClassIds((current) => {
      if (checked) {
        return current.includes(classId) ? current : [...current, classId];
      }

      return current.filter((id) => id !== classId);
    });

    setBulkResults([]);
  }

  function handleSelectAll(checked) {
    if (checked) {
      setSelectedClassIds(filteredClasses.map((item) => item.class_id));
    } else {
      setSelectedClassIds([]);
    }

    setBulkResults([]);
  }

  async function handleCreate(event) {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setMessageType("");

    try {
      const result = await createClassAction({
        class_name: className,
        class_status: "active",
      });

      if (!result.success) {
        setMessage(result.error);
        setMessageType("error");
        return;
      }

      setMessage(result.message);
      setMessageType("success");
      setClassName("");

      router.refresh();
    } catch (error) {
      console.error("Create class failed:", error);
      setMessage("Terjadi kesalahan saat membuat kelas.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateName(classId) {
    if (!editingClassName.trim()) {
      setMessage("Nama kelas wajib diisi.");
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("");
    setMessageType("");

    try {
      const result = await updateClassAction(classId, {
        class_name: editingClassName.trim(),
      });

      if (!result.success) {
        setMessage(result.error);
        setMessageType("error");
        return;
      }

      setMessage(result.message);
      setMessageType("success");

      setEditingClassId("");
      setEditingClassName("");

      router.refresh();
    } catch (error) {
      console.error("Update class name failed:", error);
      setMessage("Terjadi kesalahan saat mengubah nama kelas.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(classId, status) {
    setLoading(true);
    setMessage("");
    setMessageType("");

    try {
      const result = await updateClassAction(classId, {
        class_status: status,
      });

      if (!result.success) {
        setMessage(result.error);
        setMessageType("error");
        return;
      }

      setMessage(result.message);
      setMessageType("success");

      router.refresh();
    } catch (error) {
      console.error("Update class status failed:", error);
      setMessage("Terjadi kesalahan saat mengubah status kelas.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  async function handleBulkStatusChange() {
    if (selectedClassIds.length === 0) {
      setMessage("Pilih minimal satu kelas.");
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("");
    setMessageType("");
    setBulkResults([]);

    try {
      const result = await bulkUpdateClassStatusAction(selectedClassIds, bulkStatus);

      if (!result || result.error) {
        setMessage(result?.error || "Gagal memperbarui status kelas.");
        setMessageType("error");
        return;
      }

      setBulkResults(result.results || []);
      setMessage(`Bulk update selesai: ${result.succeeded} berhasil, ${result.failed} gagal dari ${result.total} kelas.`);
      setMessageType(result.failed > 0 ? "error" : "success");

      setSelectedClassIds([]);
      router.refresh();
    } catch (error) {
      console.error("Bulk update class status failed:", error);
      setMessage("Terjadi kesalahan saat bulk update status kelas.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <section>
        <h2>Tambah Kelas</h2>

        <form onSubmit={handleCreate}>
          <p>
            <label htmlFor="className">Nama Kelas</label>
          </p>

          <input id="className" type="text" value={className} onChange={(event) => setClassName(event.target.value)} maxLength={100} required />

          <p>
            <button type="submit" disabled={loading}>
              {loading ? "Menyimpan..." : "Tambah Kelas"}
            </button>
          </p>
        </form>
      </section>

      {message && <p role={messageType === "error" ? "alert" : "status"}>{message}</p>}

      {bulkResults.some((item) => !item.success) && (
        <section>
          <h3>Detail Kelas yang Gagal Diperbarui</h3>
          <ul>
            {bulkResults
              .filter((item) => !item.success)
              .map((item) => (
                <li key={item.class_id}>
                  Kelas {item.class_id}: {item.reason}
                </li>
              ))}
          </ul>
        </section>
      )}

      <section>
        <h2>Daftar Kelas</h2>

        <p>
          <label htmlFor="classStatusFilter">Filter Status</label>
        </p>

        <select
          id="classStatusFilter"
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value);
            setSelectedClassIds([]);
          }}
        >
          <option value="all">Semua Status</option>
          <option value="active">Aktif</option>
          <option value="inactive">Tidak Aktif</option>
        </select>

        <p>
          <label htmlFor="classSortField">Urutkan Berdasarkan</label>
        </p>

        <select id="classSortField" value={sortField} onChange={(event) => setSortField(event.target.value)}>
          <option value="updated_at">Terakhir Diperbarui</option>
          <option value="class_name">Nama Kelas</option>
          <option value="class_status">Status</option>
        </select>

        <p>
          <label htmlFor="classSortDirection">Arah Pengurutan</label>
        </p>

        <select id="classSortDirection" value={sortDirection} onChange={(event) => setSortDirection(event.target.value)}>
          <option value="desc">Menurun</option>
          <option value="asc">Menaik</option>
        </select>

        <section>
          <h3>Ubah Status Massal</h3>

          <p>
            <label htmlFor="bulkClassStatus">Status Tujuan</label>
          </p>

          <select id="bulkClassStatus" value={bulkStatus} onChange={(event) => setBulkStatus(event.target.value)}>
            <option value="active">Aktif</option>
            <option value="inactive">Tidak Aktif</option>
          </select>

          <p>{selectedClassIds.length} kelas dipilih.</p>

          <button type="button" disabled={loading || selectedClassIds.length === 0} onClick={handleBulkStatusChange}>
            {loading ? "Memproses..." : "Terapkan Status ke Kelas Terpilih"}
          </button>
        </section>

        {classes.length === 0 ? (
          <p>Belum ada data kelas.</p>
        ) : (
          <>
            <p>
              <label>
                <input
                  type="checkbox"
                  checked={filteredClasses.length > 0 && filteredClasses.every((item) => selectedClassIds.includes(item.class_id))}
                  onChange={(event) => handleSelectAll(event.target.checked)}
                />
                Pilih Semua Kelas yang Ditampilkan
              </label>
            </p>

            <ul>
              {filteredClasses.map((item) => (
                <li key={item.class_id}>
                  <section>
                    <p>
                      <label>
                        <input type="checkbox" checked={selectedClassIds.includes(item.class_id)} onChange={(event) => handleSelection(item.class_id, event.target.checked)} />
                        Pilih Kelas
                      </label>
                    </p>

                    <p>
                      <Link href={`/admin/classes/${item.class_id}`}>Lihat Detail</Link>
                    </p>

                    {editingClassId === item.class_id ? (
                      <>
                        <p>
                          <label htmlFor={`edit-${item.class_id}`}>Nama Kelas</label>
                        </p>

                        <input id={`edit-${item.class_id}`} type="text" value={editingClassName} onChange={(event) => setEditingClassName(event.target.value)} maxLength={100} required />

                        <p>
                          <button type="button" disabled={loading} onClick={() => handleUpdateName(item.class_id)}>
                            Simpan Perubahan
                          </button>

                          <button
                            type="button"
                            disabled={loading}
                            onClick={() => {
                              setEditingClassId("");
                              setEditingClassName("");
                            }}
                          >
                            Batal
                          </button>
                        </p>
                      </>
                    ) : (
                      <>
                        <h3>{item.class_name}</h3>

                        <p>Status: {item.class_status}</p>

                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => {
                            setEditingClassId(item.class_id);
                            setEditingClassName(item.class_name);
                            setMessage("");
                            setMessageType("");
                          }}
                        >
                          Ubah Nama Kelas
                        </button>

                        <button type="button" disabled={loading} onClick={() => handleStatusChange(item.class_id, item.class_status === "active" ? "inactive" : "active")}>
                          {item.class_status === "active" ? "Nonaktifkan Kelas" : "Aktifkan Kelas"}
                        </button>
                      </>
                    )}
                  </section>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </main>
  );
}
