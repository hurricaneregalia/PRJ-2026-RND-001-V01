// src/app/admin/students/student-management.js

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { createStudentAction } from "./actions";

export default function StudentManagement({ students }) {
  const router = useRouter();

  const [formData, setFormData] = useState({
    student_number: "",
    full_name: "",
    gender: "Laki-laki",
    parent_name: "",
    parent_relation: "Ibu",
    parent_whatsapp: "",
    student_status: "active",
  });

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleCreate(event) {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setMessageType("");

    try {
      const result = await createStudentAction({
        ...formData,
        student_number: formData.student_number.trim(),
        full_name: formData.full_name.trim(),
        parent_name: formData.parent_name.trim(),
        parent_whatsapp: formData.parent_whatsapp.trim(),
      });

      if (!result.success) {
        setMessage(result.error);
        setMessageType("error");
        return;
      }

      setMessage(result.message);
      setMessageType("success");

      setFormData({
        student_number: "",
        full_name: "",
        gender: "Laki-laki",
        parent_name: "",
        parent_relation: "Ibu",
        parent_whatsapp: "",
        student_status: "active",
      });

      router.refresh();
    } catch (error) {
      console.error("Create student failed:", error);
      setMessage("Terjadi kesalahan saat menambahkan siswa.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <section>
        <h2>Tambah Siswa</h2>

        <form onSubmit={handleCreate}>
          <p>
            <label htmlFor="student_number">Nomor Induk Siswa (Opsional)</label>
          </p>
          <input id="student_number" name="student_number" type="text" value={formData.student_number} onChange={handleChange} maxLength={50} />

          <p>
            <label htmlFor="full_name">Nama Lengkap</label>
          </p>
          <input id="full_name" name="full_name" type="text" value={formData.full_name} onChange={handleChange} maxLength={150} required />

          <p>
            <label htmlFor="gender">Jenis Kelamin</label>
          </p>
          <select id="gender" name="gender" value={formData.gender} onChange={handleChange} required>
            <option value="Laki-laki">Laki-laki</option>
            <option value="Perempuan">Perempuan</option>
          </select>

          <p>
            <label htmlFor="parent_name">Nama Orang Tua</label>
          </p>
          <input id="parent_name" name="parent_name" type="text" value={formData.parent_name} onChange={handleChange} maxLength={150} required />

          <p>
            <label htmlFor="parent_relation">Hubungan Orang Tua</label>
          </p>
          <select id="parent_relation" name="parent_relation" value={formData.parent_relation} onChange={handleChange} required>
            <option value="Ibu">Ibu</option>
            <option value="Ayah">Ayah</option>
          </select>

          <p>
            <label htmlFor="parent_whatsapp">Nomor WhatsApp Orang Tua</label>
          </p>
          <input id="parent_whatsapp" name="parent_whatsapp" type="tel" value={formData.parent_whatsapp} onChange={handleChange} maxLength={30} required />

          <p>
            <label htmlFor="student_status">Status Siswa</label>
          </p>
          <select id="student_status" name="student_status" value={formData.student_status} onChange={handleChange} required>
            <option value="active">Aktif</option>
            <option value="inactive">Tidak Aktif</option>
            <option value="graduated">Lulus</option>
            <option value="transferred">Pindah</option>
          </select>

          <p>
            <button type="submit" disabled={loading}>
              {loading ? "Menyimpan..." : "Tambah Siswa"}
            </button>
          </p>
        </form>
      </section>

      {message && <p role={messageType === "error" ? "alert" : "status"}>{message}</p>}

      <section>
        <h2>Daftar Siswa</h2>

        {students.length === 0 ? (
          <p>Belum ada data siswa.</p>
        ) : (
          <ul>
            {students.map((student) => (
              <li key={student.student_id}>
                <h3>{student.full_name}</h3>

                <p>Nomor Induk: {student.student_number || "-"}</p>

                <p>Status: {student.student_status}</p>

                <Link href={`/admin/students/${student.student_id}`}>Lihat Detail</Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
