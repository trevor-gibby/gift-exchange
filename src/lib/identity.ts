export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

export function cleanName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function initials(value: string) {
  return cleanName(value)
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}
