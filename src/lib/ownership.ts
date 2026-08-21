import "server-only";

import { auth } from "@/auth";
import { getGuestOwnerHash } from "@/lib/guest";
import { getPrisma } from "@/lib/prisma";

export async function ownerFilter() {
  const [session, guestOwnerHash] = await Promise.all([auth(), getGuestOwnerHash()]);
  const conditions: Array<{ ownerId: string } | { guestOwnerHash: string }> = [];

  if (session?.user.id) conditions.push({ ownerId: session.user.id });
  if (guestOwnerHash) conditions.push({ guestOwnerHash });

  return { session, guestOwnerHash, conditions };
}

export async function getOwnedEvent(eventId: string) {
  const { conditions } = await ownerFilter();
  if (conditions.length === 0) return null;

  return getPrisma().exchangeEvent.findFirst({
    where: { id: eventId, OR: conditions },
    include: {
      participants: {
        orderBy: [{ name: "asc" }, { createdAt: "asc" }],
        include: {
          exclusionsAsGiver: { select: { recipientId: true } },
          assignmentAsGiver: {
            select: { recipient: { select: { id: true, name: true } } },
          },
        },
      },
      _count: { select: { assignments: true } },
    },
  });
}

export async function claimGuestExchange(userId: string) {
  const guestOwnerHash = await getGuestOwnerHash();
  if (!guestOwnerHash) return;

  await getPrisma().exchangeEvent.updateMany({
    where: { guestOwnerHash },
    data: { ownerId: userId, guestOwnerHash: null },
  });
}
