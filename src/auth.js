import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

import { findUserByAuthId, isUserBootstrapAvailable } from "@/repositories/user-repository";

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

  callbacks: {
    async signIn({ profile }) {
      const authUserId = profile?.sub;

      if (!authUserId) {
        return false;
      }

      const user = await findUserByAuthId(authUserId);

      if (user) {
        return user.account_status === "active";
      }

      return await isUserBootstrapAvailable();
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
