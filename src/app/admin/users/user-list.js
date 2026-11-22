"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

const PAGE_SIZE = 20;

const SORT_FIELDS = ["full_name", "role", "account_status", "updated_at"];

function compareUsers(a, b, sortBy, sortDirection) {
  const aValue = String(a[sortBy] ?? "");
  const bValue = String(b[sortBy] ?? "");

  const comparison = aValue.localeCompare(bValue, "id", {
    sensitivity: "base",
    numeric: true,
  });

  if (comparison !== 0) {
    return sortDirection === "desc" ? -comparison : comparison;
  }

  return String(a.user_id).localeCompare(String(b.user_id));
}

export default function UserList({ initialUsers = [] }) {
  const [roleFilter, setRoleFilter] = useState("");
  const [accountStatusFilter, setAccountStatusFilter] = useState("");

  const [sortBy, setSortBy] = useState("updated_at");
  const [sortDirection, setSortDirection] = useState("desc");

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const sentinelRef = useRef(null);

  const filteredUsers = useMemo(() => {
    return initialUsers.filter((user) => {
      if (roleFilter && user.role !== roleFilter) {
        return false;
      }

      if (accountStatusFilter && user.account_status !== accountStatusFilter) {
        return false;
      }

      return true;
    });
  }, [initialUsers, roleFilter, accountStatusFilter]);

  const sortedUsers = useMemo(() => {
    if (!SORT_FIELDS.includes(sortBy)) {
      return filteredUsers;
    }

    return [...filteredUsers].sort((a, b) => compareUsers(a, b, sortBy, sortDirection));
  }, [filteredUsers, sortBy, sortDirection]);

  const displayedUsers = useMemo(() => {
    return sortedUsers.slice(0, visibleCount);
  }, [sortedUsers, visibleCount]);

  const handleRoleChange = useCallback((value) => {
    setRoleFilter(value);
    setVisibleCount(PAGE_SIZE);
  }, []);

  const handleStatusChange = useCallback((value) => {
    setAccountStatusFilter(value);
    setVisibleCount(PAGE_SIZE);
  }, []);

  const handleSortByChange = useCallback((value) => {
    setSortBy(value);
    setVisibleCount(PAGE_SIZE);
  }, []);

  const handleSortDirectionChange = useCallback((value) => {
    setSortDirection(value);
    setVisibleCount(PAGE_SIZE);
  }, []);

  useEffect(() => {
    const sentinel = sentinelRef.current;

    if (!sentinel || displayedUsers.length >= sortedUsers.length) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          observer.disconnect();

          setVisibleCount((current) => Math.min(current + PAGE_SIZE, sortedUsers.length));
        }
      },
      {
        rootMargin: "200px",
        threshold: 0,
      },
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [displayedUsers.length, sortedUsers.length]);

  return (
    <section>
      <div>
        <h2>Daftar Pengguna ({sortedUsers.length})</h2>

        <div>
          <label>
            <span>Filter Role</span>

            <select id="role-filter" name="role-filter" value={roleFilter} onChange={(event) => handleRoleChange(event.target.value)}>
              <option value="">Semua Role</option>
              <option value="Administrator">Administrator</option>
              <option value="Guru">Guru</option>
            </select>
          </label>

          <label>
            <span>Filter Status</span>

            <select id="account-status-filter" name="account-status-filter" value={accountStatusFilter} onChange={(event) => handleStatusChange(event.target.value)}>
              <option value="">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
          </label>

          <label>
            <span>Urutkan Berdasarkan</span>

            <select id="sort-by" name="sort-by" value={sortBy} onChange={(event) => handleSortByChange(event.target.value)}>
              <option value="updated_at">Terakhir Diperbarui</option>
              <option value="full_name">Nama Lengkap</option>
              <option value="role">Role</option>
              <option value="account_status">Status Akun</option>
            </select>
          </label>

          <label>
            <span>Arah Pengurutan</span>

            <select id="sort-direction" name="sort-direction" value={sortDirection} onChange={(event) => handleSortDirectionChange(event.target.value)}>
              <option value="desc">Menurun (DESC)</option>
              <option value="asc">Menaik (ASC)</option>
            </select>
          </label>
        </div>
      </div>

      {sortedUsers.length === 0 && <p>Tidak ada pengguna yang ditemukan.</p>}

      <ul>
        {displayedUsers.map((user, index) => (
          <li key={user.user_id}>
            <div>
              <p>{index + 1}</p>
              <p>{user.full_name}</p>

              <p>Username: {user.username}</p>

              <p>Email: {user.email}</p>

              <p>Role: {user.role}</p>

              <p>Status: {user.account_status}</p>
            </div>

            <Link href={`/admin/users/${encodeURIComponent(user.user_id)}`}>Detail</Link>
          </li>
        ))}
      </ul>

      {displayedUsers.length < sortedUsers.length && <div ref={sentinelRef} aria-hidden="true" />}

      {sortedUsers.length > 0 && displayedUsers.length === sortedUsers.length && <p>Semua pengguna telah ditampilkan.</p>}
    </section>
  );
}
