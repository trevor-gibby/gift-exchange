import { z } from "zod";
import { cleanName, normalizeEmail } from "@/lib/identity";

export const passwordSchema = z
  .string()
  .min(12, "Use at least 12 characters.")
  .max(128, "Use no more than 128 characters.")
  .regex(/[a-z]/, "Add a lowercase letter.")
  .regex(/[A-Z]/, "Add an uppercase letter.")
  .regex(/[0-9]/, "Add a number.")
  .regex(/[^A-Za-z0-9]/, "Add a symbol.");

export const registrationSchema = z.object({
  name: z.string().transform(cleanName).pipe(z.string().min(2).max(80)),
  email: z.string().transform(normalizeEmail).pipe(z.email()),
  password: passwordSchema,
});

export const credentialsSchema = z.object({
  email: z.string().transform(normalizeEmail).pipe(z.email()),
  password: z.string().min(1),
});

export const exchangeSchema = z.object({
  name: z.string().transform(cleanName).pipe(z.string().min(3).max(80)),
  description: z
    .string()
    .trim()
    .max(500)
    .transform((value) => value || null),
  exchangeDate: z
    .string()
    .trim()
    .refine((value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value), "Choose a valid date.")
    .transform((value) => (value ? new Date(`${value}T12:00:00.000Z`) : null)),
  budgetCents: z
    .string()
    .trim()
    .refine((value) => !value || /^\d+(\.\d{1,2})?$/.test(value), "Use a valid amount.")
    .transform((value) => (value ? Math.round(Number(value) * 100) : null))
    .refine((value) => value === null || (value >= 0 && value <= 10_000_00), "Budget must be between $0 and $10,000."),
  isSecret: z.enum(["secret", "open"]).transform((value) => value === "secret"),
});

export const participantSchema = z.object({
  name: z.string().transform(cleanName).pipe(z.string().min(2).max(80)),
  email: z
    .string()
    .trim()
    .transform((value) => (value ? normalizeEmail(value) : null))
    .pipe(z.email().nullable()),
});

export function firstZodError(error: z.ZodError) {
  return error.issues[0]?.message ?? "Please check the form and try again.";
}
