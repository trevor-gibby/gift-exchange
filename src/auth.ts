import { requireDatabaseFeatures } from "@/lib/features";
import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import { googleUserFromProfile, hasVerifiedGoogleEmail } from "@/lib/oauth";
import { getPrisma } from "@/lib/prisma";
import { credentialsSchema } from "@/lib/validation";

const providers: NextAuthConfig["providers"] = [
  Credentials({
    name: "Email and password",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(rawCredentials) {
      const parsed = credentialsSchema.safeParse(rawCredentials);
      if (!parsed.success) return null;

      const user = await getPrisma().user.findUnique({
        where: { email: parsed.data.email },
      });

      if (!user?.passwordHash || !user.emailVerified) return null;

      const valid = await compare(parsed.data.password, user.passwordHash);
      if (!valid) return null;

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      };
    },
  }),
];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      // Google supplies an email_verified claim. The signIn callback below requires
      // it before Auth.js may link a matching email/password account.
      allowDangerousEmailAccountLinking: true,
      profile: googleUserFromProfile,
    }),
  );
}

export const authConfig = {
  providers,
  session: { strategy: "jwt" },
  cookies: {
    sessionToken: {
      // Isolate the rebuild from stale Auth.js cookies created by earlier versions of the app.
      name: "gift-exchange.v1.session-token",
    },
  },
  pages: { signIn: "/login" },
  trustHost: true,
  events: {
    async linkAccount({ user, account, profile }) {
      if (account.provider !== "google" || !hasVerifiedGoogleEmail(profile)) return;

      await getPrisma().user.update({
        where: { id: user.id },
        data: { emailVerified: new Date(), lastActiveAt: new Date() },
      });
    },
  },
  callbacks: {
    signIn({ account, profile }) {
      if (account?.provider !== "google") return true;
      return hasVerifiedGoogleEmail(profile);
    },
    async jwt({ token, user }) {
      if (user?.id) token.sub = user.id;

      if (!token.sub) return token;
      if (!user?.id && token.authVersion === undefined) return null;

      const prisma = getPrisma();
      const account = await prisma.user.findUnique({
        where: { id: token.sub },
        select: { authVersion: true, lastActiveAt: true },
      });

      if (!account) return null;
      if (token.authVersion !== undefined && token.authVersion !== account.authVersion) return null;

      token.authVersion = account.authVersion;
      if (account.lastActiveAt < new Date(Date.now() - 24 * 60 * 60 * 1000)) {
        await prisma.user.update({
          where: { id: token.sub },
          data: { lastActiveAt: new Date() },
        });
      }

      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) session.user.id = token.sub;
      return session;
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(() => {
  requireDatabaseFeatures();
  return { ...authConfig, adapter: PrismaAdapter(getPrisma()) };
});
