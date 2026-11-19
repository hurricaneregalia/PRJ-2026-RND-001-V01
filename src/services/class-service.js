import "server-only";

import { requireRole } from "@/lib/authorization";
import { CLASS_STATUS } from "@/config/class-config";
import { getAllClasses, getClassById, createClass, updateClass } from "@/repositories/class-repository";

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
  return getAllClasses();
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

  return updateClass(classId, updatedData, {
    actor_user_id: administrator.userId,
    reason: data?.reason || "",
  });
}
