'use client';

import { MessageCircle } from 'lucide-react';
import { useNudges } from '@/hooks/useNudges';

export default function AgentRBubble({ dashboard, onClick }) {
  const nudges = useNudges(dashboard);
  const hasP0 = nudges.length > 0;

  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-bubble w-14 h-14 lg:w-[60px] lg:h-[60px]
                 rounded-full bg-baldur-blue shadow-lg shadow-baldur-blue/25
                 flex items-center justify-center
                 hover:bg-blue-500 transition-colors duration-200
                 active:scale-95"
      aria-label="Agent R öffnen"
    >
      {/* Icon */}
      <div className="relative">
        <MessageCircle size={24} className="text-white" />
        <span className="absolute -top-1 -right-1 text-[10px] font-bold text-white">R</span>
      </div>

      {/* Notification Dot for P0 Nudges */}
      {hasP0 && (
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-signal-red
                        border-2 border-navy-deep animate-pulse-dot" />
      )}
    </button>
  );
}
