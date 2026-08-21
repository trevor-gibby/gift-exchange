import { describe, expect, it } from "vitest";
import { googleUserFromProfile, hasVerifiedGoogleEmail } from "@/lib/oauth";

describe("hasVerifiedGoogleEmail", () => {
  it("accepts a Google profile with an explicitly verified email", () => {
    expect(hasVerifiedGoogleEmail({ email: "person@example.com", email_verified: true })).toBe(true);
  });

  it("rejects unverified, missing, and malformed verification claims", () => {
    expect(hasVerifiedGoogleEmail({ email: "person@example.com", email_verified: false })).toBe(false);
    expect(hasVerifiedGoogleEmail({ email: "person@example.com" })).toBe(false);
    expect(hasVerifiedGoogleEmail({ email: "person@example.com", email_verified: "true" })).toBe(false);
    expect(hasVerifiedGoogleEmail({ email: "", email_verified: true })).toBe(false);
  });

  it("normalizes the Google email before Auth.js looks up an existing account", () => {
    expect(
      googleUserFromProfile({
        sub: "google-id",
        name: "Taylor Example",
        email: " Taylor@Example.COM ",
        picture: "https://example.com/avatar.png",
      }),
    ).toEqual({
      id: "google-id",
      name: "Taylor Example",
      email: "taylor@example.com",
      image: "https://example.com/avatar.png",
    });
  });
});
