export type MatchParticipant = {
  id: string;
  excludedRecipientIds?: readonly string[];
};

export type Match = {
  giverId: string;
  recipientId: string;
};

function shuffled<T>(items: readonly T[], random: () => number) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [copy[index], copy[target]] = [copy[target], copy[index]];
  }

  return copy;
}

export function createPerfectMatching(
  participants: readonly MatchParticipant[],
  random: () => number = Math.random,
): Match[] | null {
  if (participants.length < 2 || new Set(participants.map(({ id }) => id)).size !== participants.length) {
    return null;
  }

  const forbidden = new Map(
    participants.map((participant) => [
      participant.id,
      new Set([participant.id, ...(participant.excludedRecipientIds ?? [])]),
    ]),
  );
  const giverIds = participants.map(({ id }) => id);
  const recipientIds = new Set(giverIds);
  const chosen = new Map<string, string>();

  function availableRecipients(giverId: string, available: Set<string>) {
    const blocked = forbidden.get(giverId) ?? new Set<string>();
    return [...available].filter((recipientId) => !blocked.has(recipientId));
  }

  function solve(unassignedGivers: string[], available: Set<string>): boolean {
    if (unassignedGivers.length === 0) return true;

    const rankedGivers = shuffled(unassignedGivers, random)
      .map((giverId) => ({
        giverId,
        options: availableRecipients(giverId, available),
      }))
      .sort((a, b) => a.options.length - b.options.length);
    const current = rankedGivers[0];

    if (!current || current.options.length === 0) return false;

    const remainingGivers = unassignedGivers.filter((id) => id !== current.giverId);

    for (const recipientId of shuffled(current.options, random)) {
      const nextAvailable = new Set(available);
      nextAvailable.delete(recipientId);

      const impossible = remainingGivers.some(
        (giverId) => availableRecipients(giverId, nextAvailable).length === 0,
      );

      if (impossible) continue;

      chosen.set(current.giverId, recipientId);
      if (solve(remainingGivers, nextAvailable)) return true;
      chosen.delete(current.giverId);
    }

    return false;
  }

  if (!solve(giverIds, recipientIds)) return null;

  return giverIds.map((giverId) => ({
    giverId,
    recipientId: chosen.get(giverId)!,
  }));
}
