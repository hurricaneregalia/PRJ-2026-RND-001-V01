"use client";

import { useState } from "react";

export default function RoleSelectWithLimit({ user }) {
  const [role, setRole] = useState(user?.role || "Pengajar");
  const [limitKelas, setLimitKelas] = useState(Number(user?.limit_kelas ?? 2) || 2);

  return (
    <>
      <p>
        <label htmlFor="role">Role</label>
        <br />
        <select id="role" name="role" value={role} onChange={(event) => setRole(event.target.value)}>
          <option value="Admin">Admin</option>
          <option value="Pengajar">Pengajar</option>
        </select>
      </p>
      {role === "Pengajar" ? (
        <fieldset>
          <legend>Limit Kelas (khusus Pengajar)</legend>
          {[2, 3, 4, 5].map((value) => (
            <label key={value} htmlFor={`limit_kelas_${value}`}>
              <input id={`limit_kelas_${value}`} name="limit_kelas" type="radio" value={value} checked={value === limitKelas} onChange={() => setLimitKelas(value)} /> {value} kelas
            </label>
          ))}
        </fieldset>
      ) : null}
    </>
  );
}
