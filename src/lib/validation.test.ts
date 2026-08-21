import { describe, expect, it } from "vitest";
import { exchangeSchema } from "@/lib/validation";

describe("exchangeSchema", () => {
  it("maps the form budget to Prisma's budgetCents field", () => {
    const result = exchangeSchema.parse({
      name: "Family Christmas",
      description: "",
      exchangeDate: "2026-12-25",
      budgetCents: "100.00",
      isSecret: "secret",
    });

    expect(result).toEqual({
      name: "Family Christmas",
      description: null,
      exchangeDate: new Date("2026-12-25T12:00:00.000Z"),
      budgetCents: 10_000,
      isSecret: true,
    });
    expect(result).not.toHaveProperty("budget");
  });

  it("allows an exchange without a budget", () => {
    const result = exchangeSchema.parse({
      name: "Office Exchange",
      description: "A small team draw",
      exchangeDate: "",
      budgetCents: "",
      isSecret: "open",
    });

    expect(result.budgetCents).toBeNull();
    expect(result.exchangeDate).toBeNull();
    expect(result.isSecret).toBe(false);
  });
});
