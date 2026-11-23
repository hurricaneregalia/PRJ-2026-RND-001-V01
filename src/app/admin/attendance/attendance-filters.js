"use client";

export default function AttendanceFilters({
  classes = [],
  teachers = [],
  academicYears = [],
  filters,
  setFilters,
}) {
  return (
    <section>
      <h2>Filter Absensi</h2>

      <div>
        <label htmlFor="classId">Kelas</label>
        <select
          id="classId"
          value={filters.classId}
          onChange={(event) => setFilters((previous) => ({ ...previous, classId: event.target.value }))}
        >
          <option value="">Semua kelas</option>
          {classes.map((item) => (
            <option key={item.class_id} value={item.class_id}>
              {item.class_name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="teacherUserId">Guru</label>
        <select
          id="teacherUserId"
          value={filters.teacherUserId}
          onChange={(event) => setFilters((previous) => ({ ...previous, teacherUserId: event.target.value }))}
        >
          <option value="">Semua guru</option>
          {teachers.map((item) => (
            <option key={item.user_id} value={item.user_id}>
              {item.full_name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="attendanceDate">Tanggal</label>
        <input
          id="attendanceDate"
          type="date"
          value={filters.attendanceDate}
          onChange={(event) => setFilters((previous) => ({ ...previous, attendanceDate: event.target.value }))}
        />
      </div>

      <div>
        <label htmlFor="locationType">Jenis Lokasi</label>
        <select
          id="locationType"
          value={filters.locationType}
          onChange={(event) => setFilters((previous) => ({ ...previous, locationType: event.target.value }))}
        >
          <option value="">Semua jenis lokasi</option>
          <option value="IN_CLASS">Dalam kelas</option>
          <option value="OUTSIDE_CLASS">Luar kelas</option>
        </select>
      </div>

      <div>
        <label htmlFor="academicYearId">Tahun Ajaran</label>
        <select
          id="academicYearId"
          value={filters.academicYearId}
          onChange={(event) => setFilters((previous) => ({ ...previous, academicYearId: event.target.value }))}
        >
          <option value="">Semua tahun ajaran</option>
          {academicYears.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
    </section>
  );
}