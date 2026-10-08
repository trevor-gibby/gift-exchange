"use server";

import { requireDatabaseFeatures } from "@/lib/features";

import { AuthError } from "next-auth";
import { compare, hash } from "bcryptjs";
import { redirect } from "next/navigation";
import { auth, signIn, signOut } from "@/auth";
import { sendPasswordResetEmail } from "@/lib/email";
import { issueEmailVerification } from "@/lib/email-verification";
import { normalizeEmail } from "@/lib/identity";
import { getPrisma } from "@/lib/prisma";
import { createOpaqueToken, hashToken } from "@/lib/security";
import {
  credentialsSchema,
  firstZodError,
  passwordSchema,
  registrationSchema,
} from "@/lib/validation";

export type FormState = {
  error?: string;
  message?: string;
  developmentResetUrl?: string;
  developmentVerificationUrl?: string;
  verificationRequired?: boolean;
};

export async function loginAction(_state: FormState, formData: FormData): Promise<FormState> {
  requireDatabaseFeatures();
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) return { error: "Enter a valid email and password." };

  const existingUser = await getPrisma().user.findUnique({
    where: { email: parsed.data.email },
    select: { emailVerified: true, passwordHash: true },
  });

  if (existingUser?.passwordHash && !existingUser.emailVerified) {
    return {
      error: "Verify your email before logging in.",
      verificationRequired: true,
    };
  }

  try {
    await signIn("credentials", {
      ...parsed.data,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "That email and password combination was not recognized." };
    }
    throw error;
  }

  return {};
}

export async function registerAction(_state: FormState, formData: FormData): Promise<FormState> {
  requireDatabaseFeatures();
  const parsed = registrationSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) return { error: firstZodError(parsed.error) };

  const prisma = getPrisma();
  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) return { error: "An account already exists for that email." };

  const passwordHash = await hash(parsed.data.password, 12);

  try {
    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash,
      },
    });

    try {
      const verification = await issueEmailVerification(user);
      return {
        message: "Account created. Check your email to verify it before logging in.",
        developmentVerificationUrl:
          !verification.delivered && process.env.NODE_ENV !== "production"
            ? verification.verificationUrl
            : undefined,
      };
    } catch {
      return {
        error: "Your account was created, but the verification email could not be sent. Use the resend page to try again.",
        verificationRequired: true,
      };
    }
  } catch {
    return { error: "An account already exists for that email." };
  }
}

export async function requestEmailVerificationAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  requireDatabaseFeatures();
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const parsed = credentialsSchema.shape.email.safeParse(email);
  const response: FormState = {
    message: "If that email needs verification, a new link is on its way.",
  };

  if (!parsed.success) return response;

  const prisma = getPrisma();
  const user = await prisma.user.findUnique({
    where: { email: parsed.data },
    select: { id: true, email: true, emailVerified: true },
  });
  if (!user || user.emailVerified) return response;

  const recentToken = await prisma.emailVerificationToken.findFirst({
    where: { userId: user.id, createdAt: { gt: new Date(Date.now() - 60_000) } },
    select: { id: true },
  });
  if (recentToken) return response;

  try {
    const verification = await issueEmailVerification(user);
    if (!verification.delivered && process.env.NODE_ENV !== "production") {
      response.developmentVerificationUrl = verification.verificationUrl;
    }
  } catch {
    return { error: "The verification email could not be sent. Please try again shortly." };
  }

  return response;
}

export async function verifyEmailAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  requireDatabaseFeatures();
  const token = String(formData.get("token") ?? "");
  if (!token) return { error: "This verification link is invalid." };

  const prisma = getPrisma();
  const tokenRecord = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash: hashToken(token) },
  });

  if (!tokenRecord || tokenRecord.usedAt || tokenRecord.expiresAt <= new Date()) {
    return { error: "This verification link is invalid or has expired." };
  }

  try {
    await prisma.$transaction(async (transaction) => {
      const claimed = await transaction.emailVerificationToken.updateMany({
        where: {
          id: tokenRecord.id,
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: { usedAt: new Date() },
      });

      if (claimed.count !== 1) throw new Error("VERIFICATION_TOKEN_ALREADY_USED");

      await transaction.user.update({
        where: { id: tokenRecord.userId },
        data: { emailVerified: new Date() },
      });
    });
  } catch {
    return { error: "This verification link is invalid or has expired." };
  }

  redirect("/login?verified=1");
}

export async function requestPasswordResetAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  requireDatabaseFeatures();
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const parsed = credentialsSchema.shape.email.safeParse(email);
  const response: FormState = {
    message: "If that email has an account, a reset link is on its way.",
  };

  if (!parsed.success) return response;

  const prisma = getPrisma();
  const user = await prisma.user.findUnique({ where: { email: parsed.data } });
  if (!user?.passwordHash || !user.emailVerified) return response;

  const token = createOpaqueToken();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.$transaction([
    prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    }),
    prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash: hashToken(token), expiresAt },
    }),
  ]);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const resetUrl = `${appUrl}/reset-password/${token}`;
  const delivered = await sendPasswordResetEmail(user.email, resetUrl);

  if (!delivered && process.env.NODE_ENV !== "production") {
    response.developmentResetUrl = resetUrl;
  }

  return response;
}

export async function resetPasswordAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  requireDatabaseFeatures();
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const parsedPassword = passwordSchema.safeParse(password);

  if (!token || !parsedPassword.success) {
    return { error: parsedPassword.success ? "This reset link is invalid." : firstZodError(parsedPassword.error) };
  }

  const prisma = getPrisma();
  const tokenRecord = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
  });

  if (!tokenRecord || tokenRecord.usedAt || tokenRecord.expiresAt <= new Date()) {
    return { error: "This reset link is invalid or has expired." };
  }

  const passwordHash = await hash(parsedPassword.data, 12);

  try {
    await prisma.$transaction(async (transaction) => {
      const claimed = await transaction.passwordResetToken.updateMany({
        where: {
          id: tokenRecord.id,
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: { usedAt: new Date() },
      });

      if (claimed.count !== 1) throw new Error("RESET_TOKEN_ALREADY_USED");

      await transaction.user.update({
        where: { id: tokenRecord.userId },
        data: { passwordHash, authVersion: { increment: 1 } },
      });
    });
  } catch {
    return { error: "This reset link is invalid or has expired." };
  }

  redirect("/login?reset=1");
}

export async function changePasswordAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  requireDatabaseFeatures();
  const session = await auth();
  if (!session?.user.id) redirect("/login");

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const parsedPassword = passwordSchema.safeParse(newPassword);

  if (!parsedPassword.success) return { error: firstZodError(parsedPassword.error) };
  if (newPassword !== confirmPassword) return { error: "The new passwords do not match." };

  const prisma = getPrisma();
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });
  if (!user) redirect("/login");

  if (user.passwordHash) {
    const currentPasswordValid = await compare(currentPassword, user.passwordHash);
    if (!currentPasswordValid) return { error: "Your current password is incorrect." };

    if (await compare(newPassword, user.passwordHash)) {
      return { error: "Choose a new password you have not already been using." };
    }
  }

  const passwordHash = await hash(parsedPassword.data, 12);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: session.user.id },
      data: { passwordHash, authVersion: { increment: 1 } },
    }),
    prisma.passwordResetToken.updateMany({
      where: { userId: session.user.id, usedAt: null },
      data: { usedAt: new Date() },
    }),
  ]);

  await signOut({ redirectTo: "/login?passwordChanged=1" });
  return {};
}

export async function deleteAccountAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  requireDatabaseFeatures();
  const session = await auth();
  if (!session?.user.id) redirect("/login");

  if (String(formData.get("confirmation") ?? "") !== "DELETE") {
    return { error: "Type DELETE exactly to confirm account deletion." };
  }

  const prisma = getPrisma();
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });
  if (!user) redirect("/login");

  if (user.passwordHash) {
    const password = String(formData.get("password") ?? "");
    if (!(await compare(password, user.passwordHash))) {
      return { error: "Your password is incorrect." };
    }
  }

  await prisma.user.delete({ where: { id: session.user.id } });
  await signOut({ redirectTo: "/login?deleted=1" });
  return {};
}

export async function googleSignInAction() {
  requireDatabaseFeatures();
  await signIn("google", { redirectTo: "/dashboard" });
}

export async function signOutAction() {
  requireDatabaseFeatures();
  await signOut({ redirectTo: "/" });
}
