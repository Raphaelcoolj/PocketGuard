// auth.config.ts
import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isPublic = ["/login", "/register"].some((p) =>
        nextUrl.pathname.startsWith(p)
      );

      if (isPublic) return true;
      if (isLoggedIn) return true;
      return false;
    },
  },
  providers: [],
};