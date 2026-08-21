import "server-only";

import { cookies } from "next/headers";
import { createOpaqueToken, hashToken } from "@/lib/security";

const GUEST_COOKIE = "gx_guest";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 45;

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  };
}

export async function getGuestOwnerHash() {
  const token = (await cookies()).get(GUEST_COOKIE)?.value;
  return token ? hashToken(token) : null;
}

export async function ensureGuestOwnerHash() {
  const cookieStore = await cookies();
  const existing = cookieStore.get(GUEST_COOKIE)?.value;

  if (existing) {
    return hashToken(existing);
  }

  const token = createOpaqueToken();
  cookieStore.set(GUEST_COOKIE, token, cookieOptions());
  return hashToken(token);
}

export function participantCookieName(shareCode: string) {
  return `gx_participant_${shareCode}`;
}

export async function getParticipantToken(shareCode: string) {
  return (await cookies()).get(participantCookieName(shareCode))?.value ?? null;
}

export async function setParticipantToken(shareCode: string, token: string) {
  (await cookies()).set(participantCookieName(shareCode), token, cookieOptions());
}
