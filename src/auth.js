import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

import {
  createUser,
  findUserByEmail,
  findUserByAuthId,
  isUserBootstrapAvailable,
  updateUser,
} from "@/repositories/user-repository";

import { recordAuditLogin, recordAuditLogout } from "@/repositories/audit-log-repository";

import { connectGoogleAccount } from "@/services/user-management-service";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,

  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],

  session: {
    strategy: "jwt",
  },

  events: {
    async signOut({ token }) {
      const userId = token?.userId || token?.authUserId;

      if (userId) {
        await recordAuditLogout({
          tableName: "users",
          recordId: userId,
          userId,
          note: "Logout pengguna",
        });
      }
    },
  },

  callbacks: {
    async signIn({ profile }) {
      const authUserId = profile?.sub;
      const email = profile?.email;
      const emailVerified = profile?.email_verified;

      if (!authUserId || !email || emailVerified !== true) {
        return false;
      }

      try {
        const user = await findUserByAuthId(authUserId);

        if (user) {
          if (profile?.picture && !user.photo_url) {
            await updateUser(user.user_id, { photo_url: profile.picture });
          }

          if (user.account_status === "active") {
            await recordAuditLogin({
              tableName: "users",
              recordId: user.user_id,
              userId: user.user_id,
              note: "Login pengguna",
            });
          }

          return user.account_status === "active";
        }

        if (await isUserBootstrapAvailable()) {
          const created = await createUser({
            auth_user_id: authUserId,
            email,
            name: profile?.name || email,
            role: "Admin",
            account_status: "active",
            photo_url: profile?.picture || "",
          });

          await recordAuditLogin({
            tableName: "users",
            recordId: created.user_id,
            userId: created.user_id,
            note: "Login bootstrap admin pertama",
          });

          return true;
        }

        const existingByEmail = await findUserByEmail(email);

        if (existingByEmail) {
          await connectGoogleAccount(email, authUserId, profile?.picture || "");

          if (existingByEmail.account_status === "active") {
            await recordAuditLogin({
              tableName: "users",
              recordId: existingByEmail.user_id,
              userId: existingByEmail.user_id,
              note: "Login pengguna",
            });
          }
        }

        return Boolean(existingByEmail && existingByEmail.account_status === "active");
      } catch (error) {
        console.error("Google sign-in validation failed:", error?.message);
        return false;
      }
    },

    async jwt({ token, account, profile }) {
      const authUserId = profile?.sub || account?.providerAccountId || token.authUserId;

      if (!authUserId) {
        return token;
      }

      const dbUser = await findUserByAuthId(authUserId);

      if (dbUser) {
        if (dbUser.account_status !== "active") {
          return {};
        }

        token.userId = dbUser.user_id;
        token.role = dbUser.role;
        token.accountStatus = dbUser.account_status;
        token.authUserId = authUserId;
        token.bootstrapPending = false;

        return token;
      }

      if (await isUserBootstrapAvailable()) {
        token.authUserId = authUserId;
        token.bootstrapPending = true;

        return token;
      }

      return {};
    },

    async session({ session, token }) {
      if (token.bootstrapPending) {
        session.user.authUserId = token.authUserId;
        session.user.bootstrapPending = true;

        return session;
      }

      if (token.userId) {
        session.user.id = token.userId;
        session.user.role = token.role;
        session.user.accountStatus = token.accountStatus;
        session.user.authUserId = token.authUserId;
        session.user.bootstrapPending = false;
      }

      return session;
    },
  },
});
