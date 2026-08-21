import { describe, expect, it } from "vitest";
import { inactiveAccountCutoff } from "@/lib/retention";

describe("inactiveAccountCutoff", () => {
  it("returns the same instant five calendar years earlier", () => {
    expect(inactiveAccountCutoff(new Date("2031-08-15T18:30:00.000Z"))).toEqual(
      new Date("2026-08-15T18:30:00.000Z"),
    );
  });
});
