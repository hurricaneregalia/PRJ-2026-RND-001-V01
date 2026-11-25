import { findUserByEmail, updateUser } from "@/repositories/user-repository";

export async function connectGoogleAccount(email, authUserId, photoUrl = "") {
  if (!email || !authUserId) {
    throw new Error("email and authUserId are required");
  }

  const user = await findUserByEmail(email);

  if (!user) {
    return null;
  }

  if (user.auth_user_id === authUserId) {
    if (photoUrl && !user.photo_url) {
      return updateUser(user.user_id, { photo_url: photoUrl });
    }

    return user;
  }

  const isTemporaryAuthId =
    !user.auth_user_id ||
    user.auth_user_id === user.email ||
    user.auth_user_id.includes("@");

  if (!isTemporaryAuthId && user.auth_user_id !== authUserId) {
    throw new Error("authUserId does not match existing user");
  }

  const update = { auth_user_id: authUserId };

  if (photoUrl && !user.photo_url) {
    update.photo_url = photoUrl;
  }

  return updateUser(user.user_id, update);
}
