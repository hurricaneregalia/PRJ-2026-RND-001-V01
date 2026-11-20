ini maksud kamu?
// src/app/admin/classes/class-management.js

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { createClassAction, updateClassAction } from "./actions";

export default function ClassManagement({ classes }) {
  const router = useRouter();

  const [className, setClassName] = useState("");
  const [editingClassId, setEditingClassId] = useState("");
  const [editingClassName, setEditingClassName] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);

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

      <section>
        <h2>Daftar Kelas</h2>

        {classes.length === 0 ? (
          <p>Belum ada data kelas.</p>
        ) : (
          <ul>
            {classes.map((item) => (
              <li key={item.class_id}>
                <section>
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
        )}
      </section>
    </main>
  );
}

daftar file yang pernah kamu minta si stage 7:

1. src/repositories/class-repository.js
2. src/services/class-service.js
3. src/services/teacher-assignment-service.js
4. src/lib/authorization.js
5. src/repositories/class-member-repository.js SUDAH DIMINTA 2 KALI, BERARTI KAMU LUPA FILE INI
6. src/repositories/student-repository.js SUDAH DIMINTA 2 KALI, BERARTI KAMU LUPA FILE INI
7. src/services/student-service.js
8. src/app/admin/classes/page.js
9. src/app/admin/classes/class-management.js
10. src/repositories/class-member-repository.js
