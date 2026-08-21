export const ACCOUNT_INACTIVITY_YEARS = 5;

export function inactiveAccountCutoff(now = new Date()) {
  const cutoff = new Date(now);
  cutoff.setUTCFullYear(cutoff.getUTCFullYear() - ACCOUNT_INACTIVITY_YEARS);
  return cutoff;
}
