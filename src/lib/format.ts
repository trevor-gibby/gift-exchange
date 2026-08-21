export function formatDate(value: Date | null) {
  if (!value) return "Date to be decided";
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(value);
}

export function formatDateInput(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : "";
}

export function formatBudget(value: number | null) {
  if (value === null) return "No budget set";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value / 100);
}

export function formatBudgetInput(value: number | null) {
  return value === null ? "" : (value / 100).toFixed(2);
}
