import "server-only";

import { sendEmailVerificationEmail } from "@/lib/email";
import { getPrisma } from "@/lib/prisma";
import { createOpaqueToken, hashToken } from "@/lib/security";

const VERIFICATION_LIFETIME_MS = 24 * 60 * 60 * 1000;

export async function issueEmailVerification(user: { id: string; email: string }) {
  const token = createOpaqueToken();
  const expiresAt = new Date(Date.now() + VERIFICATION_LIFETIME_MS);
  const prisma = getPrisma();

  await prisma.$transaction([
    prisma.emailVerificationToken.deleteMany({ where: { userId: user.id } }),
    prisma.emailVerificationToken.create({
      data: { userId: user.id, tokenHash: hashToken(token), expiresAt },
    }),
  ]);

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const verificationUrl = `${appUrl}/verify-email/${token}`;
  const delivered = await sendEmailVerificationEmail(user.email, verificationUrl);

  return { delivered, verificationUrl };
}
