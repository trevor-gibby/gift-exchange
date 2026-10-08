import { handlers } from "@/auth";
import { isLocalMode } from "@/lib/features";
import type { NextRequest } from "next/server";

function disabled() {
  return Response.json({ error: "Accounts are disabled in browser-only mode." }, { status: 404 });
}

export const GET = (request: NextRequest) => isLocalMode() ? disabled() : handlers.GET(request);
export const POST = (request: NextRequest) => isLocalMode() ? disabled() : handlers.POST(request);
