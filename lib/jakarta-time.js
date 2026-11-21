export function buildJakartaScheduleAt(date, time, leadMinutes = 40) {
  const safeDate = String(date || "").trim();
  const safeTime = String(time || "").trim();

  if (!safeDate || !safeTime) {
    return undefined;
  }

  const match = safeDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const timeMatch = safeTime.match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!match || !timeMatch) {
    return undefined;
  }

  const [, year, month, day] = match;
  const [, hour, minute, second = "00"] = timeMatch;

  // Customer inputs are WIB (UTC+7). Lalamove expects UTC timestamps ending in Z.
  const utcMillis = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour) - 7,
    Number(minute),
    Number(second)
  );

  const adjustedMillis = utcMillis - Math.max(0, Number(leadMinutes) || 0) * 60 * 1000;

  return new Date(adjustedMillis).toISOString();
}
