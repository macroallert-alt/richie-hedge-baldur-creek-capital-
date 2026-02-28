'use client';

import { Settings } from 'lucide-react';

export default function Topbar({ onSettingsClick }) {
  return (
    <header className="topbar">
      <img
        src="/logo.jpeg"
        alt="Baldur Creek Capital"
        className="w-8 h-8 rounded-full object-cover"
      />

      <span className="absolute left-1/2 -translate-x-1/2 text-[16px] font-semibold text-ice-white">
        Baldur Creek Capital
      </span>

      <button
        onClick={onSettingsClick}
        className="w-8 h-8 flex items-center justify-center text-muted-blue rounded-lg
                   hover:bg-white/5 transition-colors duration-200"
        aria-label="Einstellungen"
      >
        <Settings size={18} />
      </button>
    </header>
  );
}