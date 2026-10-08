import { afterEach, describe, expect, it, vi } from "vitest";
import { isLocalMode, requireDatabaseFeatures } from "@/lib/features";

afterEach(() => vi.unstubAllEnvs());

describe("deployment mode", () => {
  it("preserves the full app by default and when explicitly enabled", () => {
    vi.stubEnv("GIFT_EXCHANGE_MODE", undefined);
    expect(isLocalMode()).toBe(false);
    expect(requireDatabaseFeatures).not.toThrow();
    vi.stubEnv("GIFT_EXCHANGE_MODE", "database");
    expect(isLocalMode()).toBe(false);
  });
  it("blocks server operations in local mode", () => {
    vi.stubEnv("GIFT_EXCHANGE_MODE", "local");
    expect(isLocalMode()).toBe(true);
    expect(requireDatabaseFeatures).toThrow(/disabled/);
  });
});
