// src/app/admin/students/student-bulk-create.js

"use client";

import { useState } from "react";

import { createStudentsBulkAction } from "./actions";

const createEmptyStudent = () => ({
  student_number: "",
  full_name: "",
  gender: "Laki-laki",
  parent_name: "",
  parent_relation: "Ibu",
  parent_whatsapp: "",
});

const FIELD_LABELS = {
  student_number: "Nomor Induk Siswa",
  full_name: "Nama Lengkap",
  gender: "Jenis Kelamin",
  parent_name: "Nama Orang Tua",
  parent_relation: "Hubungan Orang Tua",
  parent_whatsapp: "Nomor WhatsApp Orang Tua",
};

const REQUIRED_FIELDS = ["full_name", "gender", "parent_name", "parent_relation", "parent_whatsapp"];

function validateStudent(student) {
  const errors = {};

  for (const field of REQUIRED_FIELDS) {
    if (!String(student[field] || "").trim()) {
      errors[field] = `${FIELD_LABELS[field]} wajib diisi.`;
    }
  }

  if (student.gender && !["Laki-laki", "Perempuan"].includes(student.gender)) {
    errors.gender = "Jenis kelamin tidak valid.";
  }

  if (student.parent_relation && !["Ibu", "Ayah"].includes(student.parent_relation)) {
    errors.parent_relation = "Hubungan orang tua tidak valid.";
  }

  if (student.student_number.length > 50) {
    errors.student_number = "Nomor induk maksimal 50 karakter.";
  }

  if (student.full_name.trim().length > 150) {
    errors.full_name = "Nama lengkap maksimal 150 karakter.";
  }

  if (student.parent_name.trim().length > 150) {
    errors.parent_name = "Nama orang tua maksimal 150 karakter.";
  }

  if (student.parent_whatsapp.trim().length > 30) {
    errors.parent_whatsapp = "Nomor WhatsApp maksimal 30 karakter.";
  }

  return errors;
}

export default function StudentBulkCreate() {
  const [rows, setRows] = useState([createEmptyStudent()]);
  const [errors, setErrors] = useState({});
  const [duplicateErrors, setDuplicateErrors] = useState({});
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  function updateRow(index, field, value) {
    setRows((current) => current.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row)));

    setErrors((current) => ({
      ...current,
      [index]: {
        ...current[index],
        [field]: undefined,
      },
    }));

    setDuplicateErrors({});
    setMessage("");
    setMessageType("");
  }

  function addRow() {
    setRows((current) => [...current, createEmptyStudent()]);
  }

  function removeRow(index) {
    if (rows.length === 1) return;

    setRows((current) => current.filter((_, rowIndex) => rowIndex !== index));

    setErrors({});
    setDuplicateErrors({});
  }

  function validateRows() {
    const nextErrors = {};
    const nextDuplicateErrors = {};
    const seenNumbers = new Map();

    rows.forEach((student, index) => {
      const rowErrors = validateStudent(student);

      if (Object.keys(rowErrors).length > 0) {
        nextErrors[index] = rowErrors;
      }

      const studentNumber = student.student_number.trim().toLowerCase();

      if (studentNumber) {
        if (seenNumbers.has(studentNumber)) {
          const firstIndex = seenNumbers.get(studentNumber);

          nextDuplicateErrors[firstIndex] = "Nomor induk duplikat dalam formulir.";

          nextDuplicateErrors[index] = "Nomor induk duplikat dalam formulir.";
        } else {
          seenNumbers.set(studentNumber, index);
        }
      }
    });

    setErrors(nextErrors);
    setDuplicateErrors(nextDuplicateErrors);

    return Object.keys(nextErrors).length === 0 && Object.keys(nextDuplicateErrors).length === 0;
  }

  async function handleCreate(event) {
    event.preventDefault();

    setMessage("");
    setMessageType("");

    if (!validateRows()) {
      setMessage("Periksa kembali data siswa yang belum valid.");
      setMessageType("error");
      return;
    }

    setLoading(true);

    try {
      const dataList = rows.map((student) => ({
        ...student,
        student_number: student.student_number.trim(),
        full_name: student.full_name.trim(),
        parent_name: student.parent_name.trim(),
        parent_whatsapp: student.parent_whatsapp.trim(),
      }));

      const result = await createStudentsBulkAction(dataList, reason.trim());

      if (!result.success) {
        if (result.code === "DUPLICATE_EXISTING" || result.code === "DUPLICATE_INPUT") {
          setDuplicateErrors({
            [result.row_index]: result.message,
          });
        } else if (result.code === "INVALID_DATA") {
          setErrors({
            [result.row_index]: {
              full_name: result.message,
            },
          });
        }

        setMessage(result.message || "Data siswa tidak valid.");
        setMessageType("error");
        return;
      }

      setMessage(result.message);
      setMessageType("success");

      setRows([createEmptyStudent()]);
      setErrors({});
      setDuplicateErrors({});
      setReason("");
    } catch (error) {
      console.error("Bulk create students failed:", error);

      setMessage("Terjadi kesalahan sistem saat menyimpan data siswa. Isian tetap dipertahankan.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <h2>Tambah Siswa</h2>

      <form onSubmit={handleCreate}>
        {rows.map((student, index) => (
          <fieldset
            key={index}
            disabled={loading}
            style={{
              marginBottom: "1.5rem",
              padding: "1rem",
            }}
          >
            <legend>Siswa {index + 1}</legend>

            <p>
              <label htmlFor={`student_number_${index}`}>Nomor Induk Siswa (Opsional)</label>
            </p>

            <input id={`student_number_${index}`} type="text" value={student.student_number} onChange={(event) => updateRow(index, "student_number", event.target.value)} maxLength={50} />

            {duplicateErrors[index] && <p role="alert">{duplicateErrors[index]}</p>}

            {errors[index]?.student_number && <p role="alert">{errors[index].student_number}</p>}

            <p>
              <label htmlFor={`full_name_${index}`}>Nama Lengkap</label>
            </p>

            <input id={`full_name_${index}`} type="text" value={student.full_name} onChange={(event) => updateRow(index, "full_name", event.target.value)} maxLength={150} />

            {errors[index]?.full_name && <p role="alert">{errors[index].full_name}</p>}

            <p>
              <label htmlFor={`gender_${index}`}>Jenis Kelamin</label>
            </p>

            <select id={`gender_${index}`} value={student.gender} onChange={(event) => updateRow(index, "gender", event.target.value)}>
              <option value="Laki-laki">Laki-laki</option>
              <option value="Perempuan">Perempuan</option>
            </select>

            {errors[index]?.gender && <p role="alert">{errors[index].gender}</p>}

            <p>
              <label htmlFor={`parent_name_${index}`}>Nama Orang Tua</label>
            </p>

            <input id={`parent_name_${index}`} type="text" value={student.parent_name} onChange={(event) => updateRow(index, "parent_name", event.target.value)} maxLength={150} />

            {errors[index]?.parent_name && <p role="alert">{errors[index].parent_name}</p>}

            <p>
              <label htmlFor={`parent_relation_${index}`}>Hubungan Orang Tua</label>
            </p>

            <select id={`parent_relation_${index}`} value={student.parent_relation} onChange={(event) => updateRow(index, "parent_relation", event.target.value)}>
              <option value="Ibu">Ibu</option>
              <option value="Ayah">Ayah</option>
            </select>

            {errors[index]?.parent_relation && <p role="alert">{errors[index].parent_relation}</p>}

            <p>
              <label htmlFor={`parent_whatsapp_${index}`}>Nomor WhatsApp Orang Tua</label>
            </p>

            <input id={`parent_whatsapp_${index}`} type="tel" value={student.parent_whatsapp} onChange={(event) => updateRow(index, "parent_whatsapp", event.target.value)} maxLength={30} />

            {errors[index]?.parent_whatsapp && <p role="alert">{errors[index].parent_whatsapp}</p>}

            {rows.length > 1 && (
              <p>
                <button type="button" onClick={() => removeRow(index)} disabled={loading}>
                  Hapus Baris
                </button>
              </p>
            )}
          </fieldset>
        ))}

        <p>
          <button type="button" onClick={addRow} disabled={loading}>
            Tambah Baris
          </button>
        </p>

        <p>
          <label htmlFor="bulk_reason">Keterangan (Opsional)</label>
        </p>

        <textarea id="bulk_reason" value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} disabled={loading} />

        <p>
          <button type="submit" disabled={loading}>
            {loading ? "Menyimpan..." : `Simpan Semua (${rows.length} siswa)`}
          </button>
        </p>
      </form>

      {message && <p role={messageType === "error" ? "alert" : "status"}>{message}</p>}
    </section>
  );
}
