import "server-only";
import { auth } from "@/auth";
import { findUserByAuthId } from "@/repositories/user-repository";

export async function requireAuth() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED");
  }

  const user = await findUserByAuthId(session.user.authUserId);

  if (!user || user.account_status !== "active") {
    throw new Error("UNAUTHORIZED");
  }

  return {
    userId: user.user_id,
    role: user.role,
    fullName: user.full_name,
  };
}

export async function requireRole(allowedRoles) {
  const user = await requireAuth();

  if (!allowedRoles.includes(user.role)) {
    throw new Error("FORBIDDEN");
  }

  return user;
}
