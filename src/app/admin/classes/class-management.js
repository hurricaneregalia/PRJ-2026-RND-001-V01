"use client";

import { useState } from "react";
import { createClassAction, updateClassAction } from "./actions";

export default function ClassManagement({ classes }) {
  const [className, setClassName] = useState("");
  const [editingClassId, setEditingClassId] = useState("");
  const [editingClassName, setEditingClassName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreate(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const result = await createClassAction({
      class_name: className,
      class_status: "active",
    });

    setLoading(false);

    if (!result.success) {
      setMessage(result.error);
      return;
    }

    setMessage(result.message);
    setClassName("");
    window.location.reload();
  }

  async function handleUpdateName(classId) {
    if (!editingClassName.trim()) {
      setMessage("Nama kelas wajib diisi.");
      return;
    }

    setLoading(true);
    setMessage("");

    const result = await updateClassAction(classId, {
      class_name: editingClassName.trim(),
    });

    setLoading(false);

    if (!result.success) {
      setMessage(result.error);
      return;
    }

    setMessage(result.message);
    setEditingClassId("");
    setEditingClassName("");
    window.location.reload();
  }

  async function handleStatusChange(classId, status) {
    setLoading(true);
    setMessage("");

    const result = await updateClassAction(classId, {
      class_status: status,
    });

    setLoading(false);

    if (!result.success) {
      setMessage(result.error);
      return;
    }

    setMessage(result.message);
    window.location.reload();
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

      {message && <p role="status">{message}</p>}

      <section>
        <h2>Daftar Kelas</h2>

        {classes.length === 0 ? (
          <p>Belum ada data kelas.</p>
        ) : (
          <ul>
            {classes.map((item) => (
              <li key={item.class_id}>
                <section>
                  {editingClassId === item.class_id ? (
                    <>
                      <p>
                        <label>Nama Kelas</label>
                      </p>

                      <input type="text" value={editingClassName} onChange={(event) => setEditingClassName(event.target.value)} maxLength={100} required />

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
        )}
      </section>
    </main>
  );
}
