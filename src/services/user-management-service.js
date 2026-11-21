// src/services/user-management-service.js
import "server-only";

import { USER_ROLES, USER_STATUS, USER_GENDER } from "@/config/user-config";

import { getAllUsers, getUserById, findUserByEmail, createUser, updateUser, bindGoogleIdentity } from "@/repositories/user-repository";

function validateEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function validateGender(gender) {
  return Object.values(USER_GENDER).includes(gender);
}

function validateRole(role) {
  return Object.values(USER_ROLES).includes(role);
}

export async function listUsers() {
  const users = await getAllUsers();

  return users.map(({ row_number, ...user }) => user);
}
const USER_LIST_PAGE_SIZE = 20;

const USER_LIST_SORT_FIELDS = ["full_name", "role", "account_status", "updated_at"];

function compareUserListRecords(a, b, sortBy, sortDirection) {
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

export async function listUsersPage({ filters = {}, sortBy = "updated_at", sortDirection = "desc", cursor = null } = {}) {
  const role = filters.role || "";
  const accountStatus = filters.accountStatus || "";

  if (!["", ...Object.values(USER_ROLES)].includes(role) || !["", ...Object.values(USER_STATUS)].includes(accountStatus)) {
    throw new Error("INVALID_USER_LIST_FILTER");
  }

  if (!USER_LIST_SORT_FIELDS.includes(sortBy)) {
    throw new Error("INVALID_USER_LIST_SORT");
  }

  if (!["asc", "desc"].includes(sortDirection)) {
    throw new Error("INVALID_USER_LIST_SORT_DIRECTION");
  }

  if (
    cursor !== null &&
    (typeof cursor !== "object" ||
      typeof cursor.userId !== "string" ||
      !cursor.userId ||
      typeof cursor.sortValue !== "string" ||
      cursor.sortBy !== sortBy ||
      cursor.sortDirection !== sortDirection ||
      cursor.role !== role ||
      cursor.accountStatus !== accountStatus)
  ) {
    throw new Error("INVALID_USER_LIST_CURSOR");
  }

  const allUsers = await getAllUsers();

  let users = allUsers.filter((user) => {
    if (role && user.role !== role) {
      return false;
    }

    if (accountStatus && user.account_status !== accountStatus) {
      return false;
    }

    return true;
  });

  users.sort((a, b) => compareUserListRecords(a, b, sortBy, sortDirection));

  const totalCount = users.length;

  if (cursor) {
    const cursorRecord = {
      user_id: cursor.userId,
      [sortBy]: cursor.sortValue,
    };

    users = users.filter((user) => compareUserListRecords(user, cursorRecord, sortBy, sortDirection) > 0);
  }

  const pageUsers = users.slice(0, USER_LIST_PAGE_SIZE);
  const hasMore = users.length > USER_LIST_PAGE_SIZE;

  const lastUser = pageUsers[pageUsers.length - 1];

  const nextCursor =
    hasMore && lastUser
      ? {
          userId: lastUser.user_id,
          sortValue: String(lastUser[sortBy] ?? ""),
          sortBy,
          sortDirection,
          role,
          accountStatus,
        }
      : null;

  return {
    users: pageUsers.map(({ row_number, ...user }) => user),
    totalCount,
    nextCursor,
  };
}
export async function getUserDetails(userId) {
  const user = await getUserById(userId);

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  const { row_number, ...userData } = user;

  return userData;
}

export async function registerUser(data, actorUserId) {
  if (
    !data ||
    typeof data.username !== "string" ||
    !data.username.trim() ||
    typeof data.full_name !== "string" ||
    !data.full_name.trim() ||
    !validateEmail(data.email) ||
    !validateGender(data.gender) ||
    !validateRole(data.role)
  ) {
    throw new Error("INVALID_USER_DATA");
  }

  if (typeof actorUserId !== "string" || !actorUserId.trim()) {
    throw new Error("INVALID_AUDIT_ACTOR");
  }

  const existingUser = await findUserByEmail(data.email);

  if (existingUser) {
    throw new Error("USER_EMAIL_ALREADY_EXISTS");
  }

  return createUser(
    {
      username: data.username.trim(),
      email: data.email.trim().toLowerCase(),
      full_name: data.full_name.trim(),
      gender: data.gender,
      role: data.role,
      account_status: USER_STATUS.ACTIVE,
      auth_user_id: "",
    },
    {
      actor_user_id: actorUserId,
      reason: "Pendaftaran pengguna oleh Administrator",
    },
  );
}

export async function updateUserProfile(userId, data, actorUserId) {
  if (!userId || !data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("INVALID_USER_UPDATE");
  }

  if (typeof actorUserId !== "string" || !actorUserId.trim()) {
    throw new Error("INVALID_AUDIT_ACTOR");
  }

  const existingUser = await getUserById(userId);

  if (!existingUser) {
    throw new Error("USER_NOT_FOUND");
  }

  const allowedFields = ["username", "email", "full_name", "gender", "role", "account_status"];

  const fields = Object.keys(data);

  if (fields.length === 0 || fields.some((field) => !allowedFields.includes(field))) {
    throw new Error("INVALID_USER_UPDATE_FIELD");
  }

  if (data.username !== undefined && (typeof data.username !== "string" || !data.username.trim())) {
    throw new Error("INVALID_USERNAME");
  }

  if (data.full_name !== undefined && (typeof data.full_name !== "string" || !data.full_name.trim())) {
    throw new Error("INVALID_FULL_NAME");
  }

  if (data.email !== undefined && !validateEmail(data.email)) {
    throw new Error("INVALID_EMAIL");
  }

  if (data.gender !== undefined && !validateGender(data.gender)) {
    throw new Error("INVALID_GENDER");
  }

  if (data.role !== undefined && !validateRole(data.role)) {
    throw new Error("INVALID_ROLE");
  }

  if (data.account_status !== undefined && !Object.values(USER_STATUS).includes(data.account_status)) {
    throw new Error("INVALID_ACCOUNT_STATUS");
  }

  const changesOwnRole = actorUserId === userId && data.role !== undefined && data.role !== existingUser.role;

  const deactivatesOwnAccount = actorUserId === userId && data.account_status === USER_STATUS.INACTIVE;

  if (changesOwnRole || deactivatesOwnAccount) {
    throw new Error("CANNOT_CHANGE_OWN_ADMIN_ACCESS");
  }

  const willRemoveAdminAccess =
    existingUser.role === USER_ROLES.ADMINISTRATOR &&
    existingUser.account_status === USER_STATUS.ACTIVE &&
    ((data.role !== undefined && data.role !== USER_ROLES.ADMINISTRATOR) || data.account_status === USER_STATUS.INACTIVE);

  if (willRemoveAdminAccess) {
    const users = await getAllUsers();

    const activeAdministrators = users.filter((user) => user.role === USER_ROLES.ADMINISTRATOR && user.account_status === USER_STATUS.ACTIVE);

    if (activeAdministrators.length <= 1) {
      throw new Error("LAST_ACTIVE_ADMINISTRATOR");
    }
  }

  const updates = {};

  for (const field of fields) {
    const value = data[field];

    updates[field] = typeof value === "string" ? value.trim() : value;
  }

  if (updates.email) {
    updates.email = updates.email.toLowerCase();
  }

  const roleChanged = updates.role !== undefined && updates.role !== existingUser.role;

  const statusChanged = updates.account_status !== undefined && updates.account_status !== existingUser.account_status;

  let actionType;
  let reason;

  if (roleChanged && statusChanged) {
    actionType = "USER_ROLE_AND_STATUS_CHANGED";
    reason = "Perubahan role dan status akun";
  } else if (roleChanged) {
    actionType = "USER_ROLE_CHANGED";
    reason = "Perubahan role pengguna";
  } else if (statusChanged) {
    actionType = "USER_STATUS_CHANGED";
    reason = "Perubahan status akun pengguna";
  } else {
    actionType = "USER_PROFILE_UPDATED";
    reason = "Perubahan profil pengguna oleh Administrator";
  }

  return updateUser(userId, updates, {
    actor_user_id: actorUserId,
    action_type: actionType,
    reason,
  });
}

export async function connectGoogleAccount(email, authUserId) {
  if (!validateEmail(email)) {
    throw new Error("INVALID_GOOGLE_EMAIL");
  }

  if (typeof authUserId !== "string" || !authUserId.trim()) {
    throw new Error("INVALID_GOOGLE_AUTH_ID");
  }

  return bindGoogleIdentity(email.trim().toLowerCase(), authUserId.trim());
}
