import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "./db";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db) as any,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user && user) {
        // Fetch user from database to get role
        const dbUser = await db.query.users.findFirst({
          where: eq(users.email, user.email || ""),
        });

        if (dbUser) {
          session.user.id = dbUser.id.toString();
          session.user.role = dbUser.role;
          session.user.openId = dbUser.openId;
        }
      }
      return session;
    },
    async signIn({ user, account }) {
      if (!user.email) return false;

      // Check if user exists
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, user.email),
      });

      if (!existingUser) {
        // Create new user
        await db.insert(users).values({
          email: user.email,
          name: user.name || "",
          openId: account?.providerAccountId || user.id,
          loginMethod: account?.provider || "google",
          role: "client",
          lastSignedIn: new Date(),
        });
      } else {
        // Update last signed in
        await db
          .update(users)
          .set({ lastSignedIn: new Date() })
          .where(eq(users.id, existingUser.id));
      }

      return true;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
});
