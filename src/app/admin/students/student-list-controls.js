// src/app/admin/students/student-list-controls.js

"use client";

export default function StudentListControls({ classes = [], teachers = [], filters, setFilters, sortBy, setSortBy, sortDirection, setSortDirection }) {
  return (
    <section>
      <h3>Filter dan Pengurutan</h3>

      <p>
        <label htmlFor="filter-class">Filter Kelas</label>
      </p>
      <select
        id="filter-class"
        value={filters.classId}
        onChange={(event) =>
          setFilters((current) => ({
            ...current,
            classId: event.target.value,
          }))
        }
      >
        <option value="">Semua Kelas</option>
        {classes.map((item) => (
          <option key={item.class_id} value={item.class_id}>
            {item.class_name}
          </option>
        ))}
        <option value="none">Belum memiliki kelas aktif</option>
      </select>

      <p>
        <label htmlFor="filter-teacher">Filter Guru</label>
      </p>
      <select
        id="filter-teacher"
        value={filters.teacher}
        onChange={(event) =>
          setFilters((current) => ({
            ...current,
            teacher: event.target.value,
          }))
        }
      >
        <option value="">Semua Guru</option>
        {teachers.map((teacher) => (
          <option key={teacher} value={teacher}>
            {teacher}
          </option>
        ))}
        <option value="none">Belum ada guru aktif</option>
      </select>

      <p>
        <label htmlFor="filter-status">Filter Status</label>
      </p>
      <select
        id="filter-status"
        value={filters.status}
        onChange={(event) =>
          setFilters((current) => ({
            ...current,
            status: event.target.value,
          }))
        }
      >
        <option value="">Semua Status</option>
        <option value="active">Aktif</option>
        <option value="inactive">Tidak Aktif</option>
        <option value="graduated">Lulus</option>
        <option value="transferred">Pindah</option>
      </select>

      <p>
        <label htmlFor="sort-students">Urutkan Berdasarkan</label>
      </p>
      <select id="sort-students" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
        <option value="default">Urutan Input</option>
        <option value="class">Kelas</option>
        <option value="teacher">Guru</option>
        <option value="status">Status</option>
      </select>

      <p>
        <label htmlFor="sort-direction">Arah Pengurutan</label>
      </p>
      <select id="sort-direction" value={sortDirection} onChange={(event) => setSortDirection(event.target.value)} disabled={sortBy === "default"}>
        <option value="asc">Ascending (A–Z)</option>
        <option value="desc">Descending (Z–A)</option>
      </select>

      <p>
        <button
          type="button"
          onClick={() => {
            setFilters({
              classId: "",
              teacher: "",
              status: "",
            });
            setSortBy("default");
            setSortDirection("asc");
          }}
        >
          Reset Filter dan Pengurutan
        </button>
      </p>
    </section>
  );
}
