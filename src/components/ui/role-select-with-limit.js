"use client";

import { useState } from "react";

export default function RoleSelectWithLimit() {
  const [role, setRole] = useState("Pengajar");

  return (
    <>
      <p>
        <label htmlFor="role">Role</label>
        <br />
        <select
          id="role"
          name="role"
          value={role}
          onChange={(event) => setRole(event.target.value)}
        >
          <option value="Admin">Admin</option>
          <option value="Pengajar">Pengajar</option>
        </select>
      </p>
      {role === "Pengajar" ? (
        <fieldset>
          <legend>Limit Kelas (khusus Pengajar)</legend>
          {[2, 3, 4, 5].map((value) => (
            <label key={value} htmlFor={`limit_kelas_${value}`}>
              <input
                id={`limit_kelas_${value}`}
                name="limit_kelas"
                type="radio"
                value={value}
                defaultChecked={value === 2}
              />{" "}
              {value} kelas
            </label>
          ))}
        </fieldset>
      ) : null}
    </>
  );
}
