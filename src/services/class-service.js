// src/services/class-service.js
import "server-only";

import { requireRole } from "@/lib/authorization";
import { CLASS_STATUS } from "@/config/class-config";
import { getAllClasses, getClassById, createClass, updateClass } from "@/repositories/class-repository";
import { bulkUpdateClassStatus } from "@/repositories/class-repository-bulk";

async function requireAdministrator() {
  return requireRole(["Administrator"]);
}

function validateClassName(className) {
  if (typeof className !== "string" || !className.trim() || className.trim().length > 100) {
    throw new Error("INVALID_CLASS_NAME");
  }

  return className.trim();
}

function validateClassStatus(status) {
  const validStatuses = Object.values(CLASS_STATUS);

  if (!validStatuses.includes(status)) {
    throw new Error("INVALID_CLASS_STATUS");
  }

  return status;
}

export async function getAllClassesService() {
  await requireAdministrator();
  const classes = await getAllClasses();

  return classes.map(({ row_number, ...classData }) => classData);
}

export async function getClassDetailsService(classId) {
  await requireAdministrator();

  if (!classId) {
    throw new Error("CLASS_ID_REQUIRED");
  }

  return getClassById(classId);
}

export async function createClassService(data) {
  const administrator = await requireAdministrator();

  const className = validateClassName(data?.class_name);
  const classStatus = validateClassStatus(data?.class_status || CLASS_STATUS.ACTIVE);

  return createClass(
    {
      class_name: className,
      class_status: classStatus,
    },
    {
      actor_user_id: administrator.userId,
      reason: data?.reason || "",
    },
  );
}

export async function updateClassService(classId, data) {
  const administrator = await requireAdministrator();

  if (!classId) {
    throw new Error("CLASS_ID_REQUIRED");
  }

  const existing = await getClassById(classId);

  if (!existing) {
    throw new Error("CLASS_NOT_FOUND");
  }

  const updatedData = {};

  if (data?.class_name !== undefined) {
    updatedData.class_name = validateClassName(data.class_name);
  }

  if (data?.class_status !== undefined) {
    updatedData.class_status = validateClassStatus(data.class_status);
  }

  if (Object.keys(updatedData).length === 0) {
    throw new Error("NO_CLASS_CHANGES");
  }

  return updateClass(classId, updatedData, {
    actor_user_id: administrator.userId,
    reason: data?.reason || "",
  });
}
export async function bulkUpdateClassStatusService(classIds, status) {
  const administrator = await requireAdministrator();

  validateClassStatus(status);

  if (!Array.isArray(classIds) || classIds.length === 0) {
    throw new Error("CLASS_IDS_REQUIRED");
  }

  return bulkUpdateClassStatus(classIds, status, {
    actor_user_id: administrator.userId,
    reason: "Bulk update status kelas",
  });
}
