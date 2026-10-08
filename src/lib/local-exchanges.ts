import { z } from "zod";
import { normalizeName } from "@/lib/identity";
import { createPerfectMatching } from "@/lib/matching";
import { exchangeSchema, participantSchema } from "@/lib/validation";

export const LOCAL_EXCHANGES_KEY = "gift-exchange.local.v1";
export const LOCAL_EXCHANGES_CHANGED = "gift-exchange:local-changed";

const localExchangeSchema = z.object({
  id: z.uuid(),
  name: z.string().min(3).max(80),
  description: z.string().max(500).nullable(),
  exchangeDate: z.iso.datetime().nullable(),
  budgetCents: z.number().int().min(0).max(1_000_000).nullable(),
  status: z.enum(["DRAFT", "FINALIZED"]),
  participants: z.array(z.object({
    id: z.uuid(),
    name: z.string().min(2).max(80),
    excludedRecipientIds: z.array(z.uuid()).max(99),
  })).max(100),
  assignments: z.array(z.object({ giverId: z.uuid(), recipientId: z.uuid() })).max(100),
}).superRefine((event, ctx) => {
  const ids = new Set(event.participants.map(({ id }) => id));
  const names = new Set(event.participants.map(({ name }) => normalizeName(name)));
  const validParticipants = ids.size === event.participants.length && names.size === ids.size &&
    event.participants.every((person) => person.excludedRecipientIds.every((id) => ids.has(id) && id !== person.id));
  const validAssignments = event.status === "DRAFT" ? event.assignments.length === 0 :
    event.participants.length >= 2 && event.assignments.length === ids.size &&
    new Set(event.assignments.map(({ giverId }) => giverId)).size === ids.size &&
    new Set(event.assignments.map(({ recipientId }) => recipientId)).size === ids.size &&
    event.assignments.every(({ giverId, recipientId }) => ids.has(giverId) && ids.has(recipientId) &&
      giverId !== recipientId && !event.participants.find(({ id }) => id === giverId)?.excludedRecipientIds.includes(recipientId));
  if (!validParticipants || !validAssignments) ctx.addIssue({ code: "custom", message: "Invalid saved exchange." });
});

const storageSchema = z.object({ version: z.literal(1), exchanges: z.array(localExchangeSchema) })
  .refine(({ exchanges }) => new Set(exchanges.map(({ id }) => id)).size === exchanges.length);

export type LocalExchange = z.infer<typeof localExchangeSchema>;

export function readLocalExchanges(raw: string) {
  return raw ? storageSchema.parse(JSON.parse(raw)).exchanges : [];
}

export function serializeLocalExchanges(exchanges: LocalExchange[]) {
  return JSON.stringify(storageSchema.parse({ version: 1, exchanges }));
}

export function localExchangeDetails(formData: FormData) {
  const data = exchangeSchema.parse({
    name: formData.get("name"), description: formData.get("description"),
    exchangeDate: formData.get("exchangeDate"), budgetCents: formData.get("budget"), isSecret: "open",
  });
  return {
    name: data.name, description: data.description,
    exchangeDate: data.exchangeDate?.toISOString() ?? null, budgetCents: data.budgetCents,
  };
}

function requireDraft(event: LocalExchange) {
  if (event.status !== "DRAFT") throw new Error("This exchange is finalized. Participants and exclusions are locked.");
}

export function updateLocalDetails(event: LocalExchange, formData: FormData): LocalExchange {
  requireDraft(event);
  return { ...event, ...localExchangeDetails(formData) };
}

export function saveLocalParticipant(event: LocalExchange, name: string, id: string): LocalExchange {
  requireDraft(event);
  const participant = participantSchema.parse({ name, email: "" });
  const existing = event.participants.some((person) => person.id === id);
  if (!existing && event.participants.length >= 100) throw new Error("An exchange can have up to 100 participants.");
  if (event.participants.some((person) => person.id !== id && normalizeName(person.name) === normalizeName(participant.name))) {
    throw new Error("Each participant needs a unique name.");
  }
  return { ...event, participants: existing
    ? event.participants.map((person) => person.id === id ? { ...person, name: participant.name } : person)
    : [...event.participants, { id, name: participant.name, excludedRecipientIds: [] }] };
}

export function removeLocalParticipant(event: LocalExchange, id: string): LocalExchange {
  requireDraft(event);
  return { ...event, participants: event.participants.filter((person) => person.id !== id)
    .map((person) => ({ ...person, excludedRecipientIds: person.excludedRecipientIds.filter((recipientId) => recipientId !== id) })) };
}

export function setLocalExclusion(event: LocalExchange, giverId: string, recipientId: string, blocked: boolean): LocalExchange {
  requireDraft(event);
  if (giverId === recipientId || !event.participants.some(({ id }) => id === giverId) ||
    !event.participants.some(({ id }) => id === recipientId)) throw new Error("Choose participants in this exchange.");
  return { ...event, participants: event.participants.map((person) => person.id === giverId ? {
    ...person, excludedRecipientIds: blocked ? [...new Set([...person.excludedRecipientIds, recipientId])]
      : person.excludedRecipientIds.filter((id) => id !== recipientId),
  } : person) };
}

export function finalizeLocalExchange(event: LocalExchange, random: () => number): LocalExchange {
  requireDraft(event);
  if (event.participants.length < 2) throw new Error("Add at least two participants before drawing names.");
  const assignments = createPerfectMatching(event.participants, random);
  if (!assignments) throw new Error("These exclusions make a complete draw impossible. Adjust the rules and try again.");
  return { ...event, status: "FINALIZED", assignments };
}
