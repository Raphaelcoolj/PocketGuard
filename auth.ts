// auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        await connectDB();
        const user = await User.findOne({ email: credentials.email }).select(
          "+password",
        );
        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password,
        );
        if (!isValid) return null;

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          image: user.image ?? null,
          onboardingComplete: user.onboardingComplete,
          currency: user.currency,
          role: user.role || "user",
        };
      },
    }),
  ],
  callbacks: {
    // Inside jwt callback:
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.onboardingComplete = (user as any).onboardingComplete;
        token.currency = (user as any).currency;
        token.role = (user as any).role;
      }
      return token;
    },

    // Inside session callback:
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.onboardingComplete = token.onboardingComplete as boolean;
        session.user.currency = token.currency as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
});
