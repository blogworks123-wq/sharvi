export const BIRTHDAY_AT = Date.parse('2026-10-03T00:00:00+05:30');
export function countdownAt(now = Date.now()) {
  const total = Math.max(0, Math.ceil((BIRTHDAY_AT - now) / 1000));
  return { days: Math.floor(total / 86400), hours: Math.floor(total / 3600) % 24, minutes: Math.floor(total / 60) % 60, seconds: total % 60, complete: now >= BIRTHDAY_AT };
}
