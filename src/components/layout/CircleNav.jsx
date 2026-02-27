'use client';

import { LayoutDashboard, FileText, Shield, Radio, BarChart3, Target, Search, Globe } from 'lucide-react';
import { CIRCLES } from '@/lib/constants';
import { useCircleNotifications } from '@/hooks/useCircleNotifications';

const ICON_MAP = {
  LayoutDashboard,
  FileText,
  Shield,
  Radio,
  BarChart3,
  Target,
  Search,
  Globe,
};

export default function CircleNav({ currentPage, onNavigate, dashboard }) {
  const notifications = useCircleNotifications(dashboard);

  return (
    <nav className="circle-nav" aria-label="Navigation">
      {CIRCLES.map((circle) => {
        const Icon = ICON_MAP[circle.icon];
        const isActive = currentPage === circle.id;
        const notification = notifications[circle.id];
        const circleRoute = circle.id; // We use IDs as page keys

        return (
          <button
            key={circle.id}
            onClick={() => onNavigate(circleRoute)}
            className="flex flex-col items-center gap-1 flex-shrink-0"
            aria-label={circle.name}
            aria-current={isActive ? 'page' : undefined}
          >
            {/* Circle with icon */}
            <div className={`circle-item relative ${isActive ? 'active' : ''}`}>
              <Icon size={20} />

              {/* Notification Dot */}
              {notification && (
                <span
                  className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full animate-pulse-dot"
                  style={{ backgroundColor: notification.color }}
                  aria-label={`${circle.name} hat Benachrichtigungen`}
                />
              )}
            </div>

            {/* Label */}
            <span className={`text-caption leading-none ${
              isActive ? 'text-ice-white' : 'text-muted-blue'
            }`}>
              {circle.name}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
