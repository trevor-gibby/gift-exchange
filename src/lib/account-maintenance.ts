import "server-only";

import { getPrisma } from "@/lib/prisma";
import { inactiveAccountCutoff } from "@/lib/retention";

export async function deleteInactiveAccounts(now = new Date()) {
  return getPrisma().user.deleteMany({
    where: { lastActiveAt: { lt: inactiveAccountCutoff(now) } },
  });
}
