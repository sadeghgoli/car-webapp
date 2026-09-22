import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { AuthUser } from "@/types";
import { findUserByCredentials } from "@/lib/mock-data";

declare module "next-auth" {
  interface Session {
    user: AuthUser & { isAdmin: boolean };
  }

  interface User extends AuthUser {
    isAdmin: boolean;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "SSO",
      credentials: {
        username: { label: "نام کاربری", type: "text" },
        password: { label: "رمز عبور", type: "password" },
      },
      authorize: async (credentials) => {
        const username = credentials?.username as string;
        const password = credentials?.password as string;

        if (!username || !password) return null;

        const user = findUserByCredentials(username, password);
        if (!user) return null;

        return {
          ...user,
          isAdmin: user.role === "admin",
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.userId = user.id;
        token.role = user.role;
        token.categoryIds = user.categoryIds;
        token.isAdmin = user.isAdmin;
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        Object.assign(session.user, {
          id: token.userId as string,
          name: token.name as string,
          email: token.email as string,
          role: token.role as AuthUser["role"],
          categoryIds: token.categoryIds as string[],
          isAdmin: token.isAdmin as boolean,
        });
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET ?? "dev-secret-change-in-production",
});
