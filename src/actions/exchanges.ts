"use server";

import { requireDatabaseFeatures } from "@/lib/features";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ensureGuestOwnerHash, setParticipantToken } from "@/lib/guest";
import { normalizeName } from "@/lib/identity";
import { createPerfectMatching } from "@/lib/matching";
import { getOwnedEvent } from "@/lib/ownership";
import { getPrisma } from "@/lib/prisma";
import { createOpaqueToken, hashToken, safePathMessage } from "@/lib/security";
import { exchangeSchema, firstZodError, participantSchema } from "@/lib/validation";

function eventPath(eventId: string, kind?: "error" | "notice", message?: string) {
  const query = kind && message ? `?${kind}=${safePathMessage(message)}` : "";
  return `/events/${eventId}${query}`;
}

async function requireDraftEvent(eventId: string) {
  const event = await getOwnedEvent(eventId);
  if (!event) redirect("/dashboard?error=Event%20not%20found");
  if (event.status !== "DRAFT") {
    redirect(eventPath(eventId, "error", "This exchange is finalized and can no longer be changed."));
  }
  return event;
}

export async function createExchangeAction(formData: FormData) {
  requireDatabaseFeatures();
  const parsed = exchangeSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    exchangeDate: formData.get("exchangeDate"),
    budgetCents: formData.get("budget"),
    isSecret: formData.get("isSecret"),
  });

  if (!parsed.success) {
    redirect(`/exchanges/new?error=${safePathMessage(firstZodError(parsed.error))}`);
  }

  const session = await auth();
  const prisma = getPrisma();
  let guestOwnerHash: string | null = null;

  if (!session?.user.id) {
    guestOwnerHash = await ensureGuestOwnerHash();
    const guestEvent = await prisma.exchangeEvent.findUnique({ where: { guestOwnerHash } });
    if (guestEvent) {
      redirect(eventPath(guestEvent.id, "notice", "Your guest exchange is already here."));
    }
  }

  const event = await prisma.exchangeEvent.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      exchangeDate: parsed.data.exchangeDate,
      budgetCents: parsed.data.budgetCents,
      isSecret: parsed.data.isSecret,
      shareCode: createOpaqueToken(12),
      ownerId: session?.user.id ?? null,
      guestOwnerHash,
    },
  });

  redirect(eventPath(event.id, "notice", "Your exchange is ready for its guest list."));
}

export async function updateExchangeAction(formData: FormData) {
  requireDatabaseFeatures();
  const eventId = String(formData.get("eventId") ?? "");
  await requireDraftEvent(eventId);

  const parsed = exchangeSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    exchangeDate: formData.get("exchangeDate"),
    budgetCents: formData.get("budget"),
    isSecret: formData.get("isSecret"),
  });

  if (!parsed.success) {
    redirect(eventPath(eventId, "error", firstZodError(parsed.error)));
  }

  await getPrisma().exchangeEvent.update({
    where: { id: eventId },
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      exchangeDate: parsed.data.exchangeDate,
      budgetCents: parsed.data.budgetCents,
      isSecret: parsed.data.isSecret,
    },
  });
  revalidatePath(eventPath(eventId));
}

export async function deleteExchangeAction(formData: FormData) {
  requireDatabaseFeatures();
  const eventId = String(formData.get("eventId") ?? "");
  const event = await getOwnedEvent(eventId);
  if (!event) redirect("/dashboard?error=Event%20not%20found");

  await getPrisma().exchangeEvent.delete({ where: { id: event.id } });
  revalidatePath("/dashboard");
  redirect("/dashboard?notice=Exchange%20deleted");
}

export async function addParticipantAction(formData: FormData) {
  requireDatabaseFeatures();
  const eventId = String(formData.get("eventId") ?? "");
  const event = await requireDraftEvent(eventId);

  if (event.participants.length >= 100) {
    redirect(eventPath(eventId, "error", "An exchange can have up to 100 participants."));
  }

  const parsed = participantSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
  });

  if (!parsed.success) {
    redirect(eventPath(eventId, "error", firstZodError(parsed.error)));
  }

  try {
    await getPrisma().participant.create({
      data: {
        eventId,
        name: parsed.data.name,
        normalizedName: normalizeName(parsed.data.name),
        email: parsed.data.email,
        normalizedEmail: parsed.data.email,
      },
    });
  } catch {
    redirect(eventPath(eventId, "error", "Participant names and emails must be unique in this exchange."));
  }

  revalidatePath(eventPath(eventId));
}

export async function removeParticipantAction(formData: FormData) {
  requireDatabaseFeatures();
  const eventId = String(formData.get("eventId") ?? "");
  const participantId = String(formData.get("participantId") ?? "");
  await requireDraftEvent(eventId);

  await getPrisma().participant.deleteMany({ where: { id: participantId, eventId } });
  revalidatePath(eventPath(eventId));
}

export async function saveExclusionsAction(formData: FormData) {
  requireDatabaseFeatures();
  const eventId = String(formData.get("eventId") ?? "");
  const giverId = String(formData.get("giverId") ?? "");
  const event = await requireDraftEvent(eventId);
  const participantIds = new Set(event.participants.map(({ id }) => id));

  if (!participantIds.has(giverId)) {
    redirect(eventPath(eventId, "error", "Participant not found."));
  }

  const recipientIds = [...new Set(formData.getAll("recipientId").map(String))].filter(
    (recipientId) => participantIds.has(recipientId) && recipientId !== giverId,
  );

  const prisma = getPrisma();
  await prisma.$transaction([
    prisma.exclusion.deleteMany({ where: { eventId, giverId } }),
    prisma.exclusion.createMany({
      data: recipientIds.map((recipientId) => ({ eventId, giverId, recipientId })),
    }),
  ]);

  revalidatePath(eventPath(eventId));
}

export async function finalizeExchangeAction(formData: FormData) {
  requireDatabaseFeatures();
  const eventId = String(formData.get("eventId") ?? "");
  const ownedEvent = await requireDraftEvent(eventId);

  const prisma = getPrisma();

  try {
    await prisma.$transaction(
      async (transaction) => {
        const event = await transaction.exchangeEvent.findUnique({
          where: { id: eventId },
          include: {
            participants: {
              include: { exclusionsAsGiver: { select: { recipientId: true } } },
            },
          },
        });

        if (!event || event.status !== "DRAFT") throw new Error("NOT_DRAFT");
        if (event.participants.length < 2) throw new Error("TOO_FEW");

        const matches = createPerfectMatching(
          event.participants.map((participant) => ({
            id: participant.id,
            excludedRecipientIds: participant.exclusionsAsGiver.map(({ recipientId }) => recipientId),
          })),
        );

        if (!matches) throw new Error("IMPOSSIBLE");

        await transaction.assignment.createMany({
          data: matches.map((match) => ({ eventId, ...match })),
        });

        const finalized = await transaction.exchangeEvent.updateMany({
          where: { id: eventId, status: "DRAFT" },
          data: { status: "FINALIZED", finalizedAt: new Date() },
        });

        if (finalized.count !== 1) throw new Error("NOT_DRAFT");
      },
      { isolationLevel: "Serializable" },
    );
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const message =
      code === "TOO_FEW"
        ? "Add at least two participants before drawing names."
        : code === "IMPOSSIBLE"
          ? "Those exclusions cannot produce a complete exchange. Adjust them and try again."
          : "The exchange could not be finalized. Please try again.";
    redirect(eventPath(eventId, "error", message));
  }

  revalidatePath(eventPath(eventId));
  revalidatePath(`/join/${ownedEvent.shareCode}`);
  redirect(
    eventPath(
      eventId,
      "notice",
      ownedEvent.isSecret
        ? "The draw is complete. Matches are now ready to reveal!"
        : "The draw is complete. The full assignment list is now public!",
    ),
  );
}

export async function joinExchangeAction(formData: FormData) {
  requireDatabaseFeatures();
  const shareCode = String(formData.get("shareCode") ?? "");
  const joinPath = `/join/${shareCode}`;
  const parsed = participantSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
  });

  if (!parsed.success) {
    redirect(`${joinPath}?error=${safePathMessage(firstZodError(parsed.error))}`);
  }

  const prisma = getPrisma();
  const event = await prisma.exchangeEvent.findUnique({
    where: { shareCode },
    include: { participants: true },
  });

  if (!event) redirect("/join?error=Exchange%20not%20found");
  if (!event.isSecret) {
    redirect(`${joinPath}?notice=${safePathMessage("This public draw never requires participant sign-in.")}`);
  }

  const normalizedName = normalizeName(parsed.data.name);
  const participant = event.participants.find((candidate) => {
    if (parsed.data.email && candidate.normalizedEmail === parsed.data.email) return true;
    return candidate.normalizedName === normalizedName;
  });

  if (participant?.accessTokenHash) {
    redirect(`${joinPath}?error=${safePathMessage("That participant has already claimed their spot.")}`);
  }

  if (!participant && event.status === "FINALIZED") {
    redirect(`${joinPath}?error=${safePathMessage("The draw is finalized. Enter the same name or email on the organizer's guest list.")}`);
  }

  if (!participant && event.participants.length >= 100) {
    redirect(`${joinPath}?error=${safePathMessage("This exchange has reached its participant limit.")}`);
  }

  const accessToken = createOpaqueToken();
  const accessTokenHash = hashToken(accessToken);

  try {
    if (participant) {
      await prisma.participant.update({
        where: { id: participant.id },
        data: {
          accessTokenHash,
          claimedAt: new Date(),
          email: participant.email ?? parsed.data.email,
          normalizedEmail: participant.normalizedEmail ?? parsed.data.email,
        },
      });
    } else {
      await prisma.participant.create({
        data: {
          eventId: event.id,
          name: parsed.data.name,
          normalizedName,
          email: parsed.data.email,
          normalizedEmail: parsed.data.email,
          accessTokenHash,
          claimedAt: new Date(),
        },
      });
    }
  } catch {
    redirect(`${joinPath}?error=${safePathMessage("That name or email is already on the guest list.")}`);
  }

  await setParticipantToken(shareCode, accessToken);
  revalidatePath(joinPath);
  redirect(`${joinPath}?notice=${safePathMessage("Your spot is saved on this device.")}`);
}
