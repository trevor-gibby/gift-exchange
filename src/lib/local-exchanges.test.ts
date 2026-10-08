import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  finalizeLocalExchange, readLocalExchanges, removeLocalParticipant, saveLocalParticipant,
  serializeLocalExchanges, setLocalExclusion, updateLocalDetails, type LocalExchange,
} from "@/lib/local-exchanges";

function draft(): LocalExchange {
  let event: LocalExchange = { id: randomUUID(), name: "Friendsmas", description: null, exchangeDate: null,
    budgetCents: null, status: "DRAFT", participants: [], assignments: [] };
  for (const name of ["Alex", "Blair", "Casey"]) event = saveLocalParticipant(event, name, randomUUID());
  return event;
}

describe("browser-only exchanges", () => {
  it("persists a valid exclusion-aware complete draw", () => {
    let event = draft();
    const [alex, blair] = event.participants;
    event = setLocalExclusion(event, alex.id, blair.id, true);
    const finalized = finalizeLocalExchange(event, () => 0.4);
    expect(finalized.assignments).toHaveLength(3);
    expect(finalized.assignments.find(({ giverId }) => giverId === alex.id)?.recipientId).not.toBe(blair.id);
    expect(new Set(finalized.assignments.map(({ recipientId }) => recipientId)).size).toBe(3);
    expect(readLocalExchanges(serializeLocalExchanges([finalized]))).toEqual([finalized]);
  });
  it("does not change the draft when constraints make matching impossible", () => {
    let event = draft();
    const [alex, blair, casey] = event.participants;
    event = setLocalExclusion(event, alex.id, blair.id, true);
    event = setLocalExclusion(event, alex.id, casey.id, true);
    const saved = serializeLocalExchanges([event]);
    expect(() => finalizeLocalExchange(event, Math.random)).toThrow(/impossible/);
    expect(serializeLocalExchanges([event])).toBe(saved);
  });
  it("locks every edit and repeated finalization after drawing", () => {
    const event = finalizeLocalExchange(draft(), Math.random);
    const [alex, blair] = event.participants;
    expect(() => saveLocalParticipant(event, "New name", alex.id)).toThrow(/locked/);
    expect(() => removeLocalParticipant(event, alex.id)).toThrow(/locked/);
    expect(() => setLocalExclusion(event, alex.id, blair.id, true)).toThrow(/locked/);
    expect(() => updateLocalDetails(event, new FormData())).toThrow(/locked/);
    expect(() => finalizeLocalExchange(event, Math.random)).toThrow(/locked/);
  });
  it("normalizes names and rejects duplicates when adding or editing", () => {
    const event = draft();
    expect(() => saveLocalParticipant(event, " ALEX ", randomUUID())).toThrow(/unique/);
    expect(() => saveLocalParticipant(event, "alex", event.participants[1].id)).toThrow(/unique/);
    expect(saveLocalParticipant(event, " Alex   Rivera ", event.participants[0].id).participants[0].name).toBe("Alex Rivera");
  });
  it("cleans directional exclusions when a participant is removed", () => {
    let event = draft();
    const [alex, blair] = event.participants;
    event = setLocalExclusion(event, alex.id, blair.id, true);
    event = removeLocalParticipant(event, blair.id);
    expect(event.participants[0].excludedRecipientIds).toEqual([]);
    expect(() => setLocalExclusion(event, alex.id, blair.id, true)).toThrow(/Choose/);
    expect(() => setLocalExclusion(event, alex.id, alex.id, true)).toThrow(/Choose/);
  });
  it("rejects unreadable, unsupported, or invalid persisted data", () => {
    expect(readLocalExchanges("")).toEqual([]);
    expect(() => readLocalExchanges("broken")).toThrow();
    expect(() => readLocalExchanges('{"version":2,"exchanges":[]}')).toThrow();
    const event = finalizeLocalExchange(draft(), Math.random);
    event.assignments[0].recipientId = event.assignments[0].giverId;
    expect(() => serializeLocalExchanges([event])).toThrow();
  });
  it("limits exchanges to 100 participants", () => {
    let event = draft();
    for (let index = 3; index < 100; index++) event = saveLocalParticipant(event, `Person ${index}`, randomUUID());
    expect(() => saveLocalParticipant(event, "One too many", randomUUID())).toThrow(/100/);
  });
});
