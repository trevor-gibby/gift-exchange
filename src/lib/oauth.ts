import { normalizeEmail } from "@/lib/identity";

export function hasVerifiedGoogleEmail(profile: unknown): profile is { email: string; email_verified: true } {
  if (!profile || typeof profile !== "object") return false;

  const candidate = profile as Record<string, unknown>;
  return (
    candidate.email_verified === true &&
    typeof candidate.email === "string" &&
    candidate.email.trim().length > 0
  );
}

export function googleUserFromProfile(profile: {
  sub: string;
  name: string;
  email: string;
  picture?: string;
}) {
  return {
    id: profile.sub,
    name: profile.name,
    email: normalizeEmail(profile.email),
    image: profile.picture,
  };
}
