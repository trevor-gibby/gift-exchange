// Server-controlled deployment setting. Unset preserves the full application.
export function isLocalMode() {
  return process.env.GIFT_EXCHANGE_MODE === "local";
}

export function requireDatabaseFeatures() {
  if (isLocalMode()) throw new Error("Accounts and shared exchanges are disabled in browser-only mode.");
}
