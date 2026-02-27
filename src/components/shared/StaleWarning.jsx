'use client';

import { formatTimestamp, getRelativeTime } from '@/lib/time-utils';

export default function StaleWarning({ dashboard }) {
  const age = getRelativeTime(dashboard?.generated_at);
  const timestamp = formatTimestamp(dashboard?.generated_at);
  const ageMs = Date.now() - new Date(dashboard?.generated_at).getTime();
  const isCritical = ageMs > 48 * 60 * 60 * 1000;

  return (
    <div className={`stale-warning ${isCritical ? '!bg-red-500/15 !border-red-500/30 !text-signal-red' : ''}`}>
      {isCritical ? '❌' : '⚠️'} DATEN {isCritical ? 'KRITISCH ' : ''}VERALTET — Pipeline nicht gelaufen.
      Stand: {timestamp} ({age})
    </div>
  );
}
