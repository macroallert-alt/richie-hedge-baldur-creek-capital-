/**
 * Formats a UTC ISO string to display format.
 * "2026-02-27T07:05:12Z" → "27. Feb 2026, 07:05 UTC"
 */
export function formatTimestamp(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
  const day = d.getUTCDate();
  const month = months[d.getUTCMonth()];
  const year = d.getUTCFullYear();
  const hours = String(d.getUTCHours()).padStart(2, '0');
  const minutes = String(d.getUTCMinutes()).padStart(2, '0');
  return `${day}. ${month} ${year}, ${hours}:${minutes} UTC`;
}

/**
 * Returns relative time string.
 * "vor 3 Min", "vor 1 Std", "vor 2 Tagen"
 */
export function getRelativeTime(date) {
  if (!date) return '';
  const now = Date.now();
  const then = date instanceof Date ? date.getTime() : new Date(date).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'gerade eben';
  if (diffMin < 60) return `vor ${diffMin}m`;
  if (diffHr < 24) return `vor ${diffHr}h`;
  if (diffDay === 1) return 'GESTERN';
  return `vor ${diffDay} Tagen`;
}

/**
 * Format a date string to short German format.
 * "2026-02-10" → "10. Feb"
 */
export function formatDateShort(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
  return `${d.getUTCDate()}. ${months[d.getUTCMonth()]}`;
}
