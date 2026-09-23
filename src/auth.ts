import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { AuthUser } from "@/types";
import { SsoRequestError, verifyLoginOtp } from "@/lib/sso-login";

class SsoLoginError extends CredentialsSignin {
  constructor(message: string) {
    super();
    this.code = message;
  }
}

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
        melliCode: { label: "کد ملی", type: "text" },
        phoneNumber: { label: "شماره همراه", type: "text" },
        otpCode: { label: "کد تایید", type: "text" },
      },
      authorize: async (credentials) => {
        try {
          return await verifyLoginOtp(
            String(credentials?.melliCode ?? ""),
            String(credentials?.phoneNumber ?? ""),
            String(credentials?.otpCode ?? ""),
          );
        } catch (error) {
          const message =
            error instanceof SsoRequestError
              ? error.message
              : "کد تایید نامعتبر است";
          throw new SsoLoginError(message);
        }
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
