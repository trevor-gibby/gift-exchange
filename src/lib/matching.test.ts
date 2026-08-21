import { describe, expect, it } from "vitest";
import { createPerfectMatching, type MatchParticipant } from "./matching";

function sequenceRandom(values: number[]) {
  let index = 0;
  return () => values[index++ % values.length] ?? 0.5;
}

function expectValid(participants: MatchParticipant[], matches: ReturnType<typeof createPerfectMatching>) {
  expect(matches).not.toBeNull();
  expect(matches).toHaveLength(participants.length);
  expect(new Set(matches!.map(({ giverId }) => giverId)).size).toBe(participants.length);
  expect(new Set(matches!.map(({ recipientId }) => recipientId)).size).toBe(participants.length);

  for (const match of matches!) {
    const participant = participants.find(({ id }) => id === match.giverId)!;
    expect(match.recipientId).not.toBe(match.giverId);
    expect(participant.excludedRecipientIds ?? []).not.toContain(match.recipientId);
  }
}

describe("createPerfectMatching", () => {
  it("creates a complete one-to-one exchange", () => {
    const participants = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }];
    expectValid(participants, createPerfectMatching(participants, sequenceRandom([0.9, 0.2, 0.6])));
  });

  it("honors directional exclusions", () => {
    const participants = [
      { id: "a", excludedRecipientIds: ["b", "c"] },
      { id: "b", excludedRecipientIds: ["c"] },
      { id: "c", excludedRecipientIds: ["d"] },
      { id: "d", excludedRecipientIds: ["a"] },
    ];
    expectValid(participants, createPerfectMatching(participants, sequenceRandom([0.1, 0.8, 0.4])));
  });

  it("reports impossible constraints", () => {
    const participants = [
      { id: "a", excludedRecipientIds: ["b", "c"] },
      { id: "b" },
      { id: "c" },
    ];
    expect(createPerfectMatching(participants)).toBeNull();
  });

  it("rejects fewer than two or duplicate participants", () => {
    expect(createPerfectMatching([{ id: "a" }])).toBeNull();
    expect(createPerfectMatching([{ id: "a" }, { id: "a" }])).toBeNull();
  });
});
