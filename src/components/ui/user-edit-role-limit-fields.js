"use client";

import { useState } from "react";

export default function UserEditRoleLimitFields({ user }) {
  const [role, setRole] = useState(user?.role || "Pengajar");
  const [limitKelas, setLimitKelas] = useState(user?.limit_kelas ?? 2);

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
        <p>
          <label htmlFor="limit_kelas">Limit Kelas (khusus Pengajar)</label>
          <br />
          <input
            id="limit_kelas"
            name="limit_kelas"
            type="number"
            min="0"
            value={limitKelas}
            onChange={(event) => setLimitKelas(Number(event.target.value || 0))}
          />
        </p>
      ) : null}
    </>
  );
}
