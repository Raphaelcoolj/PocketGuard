// auth.config.ts
import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.onboardingComplete = (user as any).onboardingComplete;
        token.currency = (user as any).currency;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.onboardingComplete = token.onboardingComplete as boolean;
        session.user.currency = token.currency as string;
        session.user.role = token.role as string;
      }
      return session;
    },
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
} satisfies NextAuthConfig;