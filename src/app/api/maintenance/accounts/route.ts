import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { deleteInactiveAccounts } from "@/lib/account-maintenance";

export const dynamic = "force-dynamic";

function secretsMatch(received: string, expected: string) {
  const receivedBytes = Buffer.from(received);
  const expectedBytes = Buffer.from(expected);
  return receivedBytes.length === expectedBytes.length && timingSafeEqual(receivedBytes, expectedBytes);
}

async function runAccountMaintenance(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (!cronSecret || !authorization?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const suppliedSecret = authorization.slice("Bearer ".length);
  if (!secretsMatch(suppliedSecret, cronSecret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await deleteInactiveAccounts();
  return NextResponse.json({ deletedAccounts: result.count });
}

export const GET = runAccountMaintenance;
export const POST = runAccountMaintenance;
