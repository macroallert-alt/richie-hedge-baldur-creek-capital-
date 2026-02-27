'use client';

import { useState, useEffect } from 'react';
import { formatTimestamp, getRelativeTime } from '@/lib/time-utils';
import { useDashboardContext } from '@/context/DashboardContext';

export default function TimestampBar() {
  const { dashboard, lastFetched } = useDashboardContext();
  const [relativeTime, setRelativeTime] = useState('');

  // Update relative time every 30 seconds
  useEffect(() => {
    const update = () => {
      if (lastFetched) {
        setRelativeTime(getRelativeTime(lastFetched));
      }
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [lastFetched]);

  if (!dashboard) return null;

  return (
    <div className="timestamp-bar">
      Stand: {formatTimestamp(dashboard.generated_at)}
      {relativeTime && ` • Aktualisiert ${relativeTime}`}
    </div>
  );
}
