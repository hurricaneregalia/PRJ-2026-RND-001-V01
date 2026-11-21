"use client";

import { useState } from "react";
import { updateStudentAction } from "./actions";

export default function StudentEditForm({ student }) {
  const [studentStatus, setStudentStatus] = useState(student.student_status || "");
  const [feedback, setFeedback] = useState("");

  const reasonRequired = studentStatus === "inactive" && student.student_status !== "inactive";

  async function handleSubmit(formData) {
    setFeedback("");

    const result = await updateStudentAction(student.student_id, {
      student_number: formData.get("student_number") || "",
      full_name: formData.get("full_name"),
      gender: formData.get("gender"),
      parent_name: formData.get("parent_name"),
      parent_relation: formData.get("parent_relation"),
      parent_whatsapp: formData.get("parent_whatsapp"),
      student_status: studentStatus,
      reason: formData.get("reason") || "",
    });

    if (result?.success) {
      setFeedback("Perubahan data siswa berhasil disimpan.");
      return;
    }

    setFeedback(result?.message || "Perubahan data siswa gagal disimpan.");
  }

  return (
    <form action={handleSubmit}>
      <div>
        <label htmlFor="student_number">Nomor Induk Siswa</label>
        <input id="student_number" name="student_number" type="text" defaultValue={student.student_number || ""} />
      </div>

      <div>
        <label htmlFor="full_name">Nama Lengkap</label>
        <input id="full_name" name="full_name" type="text" defaultValue={student.full_name || ""} required />
      </div>

      <div>
        <label htmlFor="gender">Jenis Kelamin</label>
        <select id="gender" name="gender" defaultValue={student.gender || ""} required>
          <option value="">Pilih jenis kelamin</option>
          <option value="Laki-laki">Laki-laki</option>
          <option value="Perempuan">Perempuan</option>
        </select>
      </div>

      <div>
        <label htmlFor="parent_name">Nama Orang Tua</label>
        <input id="parent_name" name="parent_name" type="text" defaultValue={student.parent_name || ""} required />
      </div>

      <div>
        <label htmlFor="parent_relation">Hubungan Orang Tua</label>
        <select id="parent_relation" name="parent_relation" defaultValue={student.parent_relation || ""} required>
          <option value="">Pilih hubungan</option>
          <option value="Ibu">Ibu</option>
          <option value="Ayah">Ayah</option>
        </select>
      </div>

      <div>
        <label htmlFor="parent_whatsapp">WhatsApp Orang Tua</label>
        <input id="parent_whatsapp" name="parent_whatsapp" type="text" defaultValue={student.parent_whatsapp || ""} required />
      </div>

      <div>
        <label htmlFor="student_status">Status Siswa</label>
        <select id="student_status" name="student_status" value={studentStatus} onChange={(event) => setStudentStatus(event.target.value)} required>
          <option value="active">Aktif</option>
          <option value="inactive">Tidak Aktif</option>
          <option value="graduated">Lulus</option>
          <option value="transferred">Pindah</option>
        </select>
      </div>

      <div>
        <label htmlFor="reason">
          Alasan perubahan status
          {reasonRequired ? " (wajib)" : " (opsional)"}
        </label>
        <textarea id="reason" name="reason" rows={3} maxLength={500} required={reasonRequired} placeholder="Contoh: Siswa berhenti sementara karena alasan keluarga." />
      </div>

      {feedback && <p role="status">{feedback}</p>}

      <button type="submit">Simpan Perubahan</button>
    </form>
  );
}
