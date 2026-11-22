// src/repositories/user-repository-read.js
import "server-only";

import { getUsersData, normalizeEmail, normalizeAuthUserId } from "./user-repository-core";

export async function isUserBootstrapAvailable() {
  // Bootstrap hanya diperbolehkan di lingkungan development.
  if (process.env.NODE_ENV !== "development") {
    return false;
  }

  const users = await getUsersData();

  return users.length === 0;
}

export async function getAllUsers() {
  return getUsersData();
}

export async function getUserById(userId) {
  const users = await getUsersData();

  return users.find((user) => user.user_id === userId) || null;
}

export async function findUserByEmail(email) {
  const users = await getUsersData();

  const normalizedEmail = normalizeEmail(email);

  return users.find((user) => normalizeEmail(user.email) === normalizedEmail) || null;
}

export async function findUserByAuthId(authUserId) {
  const users = await getUsersData();

  const normalizedAuthUserId = normalizeAuthUserId(authUserId);

  return users.find((user) => normalizeAuthUserId(user.auth_user_id) === normalizedAuthUserId && normalizedAuthUserId !== "") || null;
}
