'use client';

import { useState } from 'react';
import { G7_REGIME_COLORS, DIRECTION_DISPLAY, COLORS } from '@/lib/constants';

export default function G7Detail({ dashboard }) {
  const g7 = dashboard?.g7_summary;
  const [openScenario, setOpenScenario] = useState(null);

  if (!g7) return <div className="py-4"><p className="text-muted-blue">G7 Daten nicht verfügbar</p></div>;

  const regimeColor = G7_REGIME_COLORS[g7.active_regime] || COLORS.mutedBlue;
  const regions = g7.regions || [];
  const scenarios = g7.scenarios || [];
  const flags = g7.attention_flags || [];

  return (
    <div className="py-4 space-y-4">
      <h1 className="text-page-title lg:text-page-title-desktop">G7 World Order</h1>

      {/* Regime Status */}
      <div className="glass-card-primary p-4 flex flex-col items-center">
        <div className="w-16 h-16 rounded-full mb-2 flex items-center justify-center"
          style={{ backgroundColor: `${regimeColor}20`, border: `2px solid ${regimeColor}` }}>
          <span className="text-[24px] font-bold" style={{ color: regimeColor }}>{g7.active_regime}</span>
        </div>
        <span className="text-data-medium text-ice-white">{g7.regime_label}</span>
        <span className="text-caption text-muted-blue mt-1">
          Last Full Run: {g7.last_full_run_date} • Interim: {g7.last_interim_date}
        </span>
      </div>

      {/* EWI Progress Bar */}
      <div className="glass-card p-4">
        <h2 className="text-section-title text-ice-white mb-3">Escalation Warning Index</h2>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-data-large tabular-nums text-ice-white">{g7.ewi_score}</span>
          <span className="text-data-small text-muted-blue">{g7.ewi_label}</span>
        </div>
        <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${g7.ewi_score}%`,
              backgroundColor: g7.ewi_score > 70 ? COLORS.signalRed : g7.ewi_score > 40 ? COLORS.signalYellow : COLORS.signalGreen,
            }} />
        </div>
      </div>

      {/* Attention Flags */}
      {flags.length > 0 && (
        <div className="glass-card p-4">
          <h2 className="text-section-title text-ice-white mb-3">⚠ Attention Flags</h2>
          <div className="space-y-2">
            {flags.map((f, i) => (
              <div key={i} className="border-l-2 border-signal-yellow/50 pl-3">
                <p className="text-body text-ice-white">{f}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scenarios (Accordions) */}
      <div className="glass-card p-4">
        <h2 className="text-section-title text-ice-white mb-3">Szenarien</h2>
        <div className="space-y-2">
          {scenarios.map((s, i) => (
            <div key={i} className="bg-white/3 rounded-lg overflow-hidden">
              <button
                onClick={() => setOpenScenario(openScenario === i ? null : i)}
                className="w-full text-left p-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="text-body text-ice-white">{s.name}</span>
                  <span className="text-data-small tabular-nums text-baldur-blue">
                    {Math.round(s.probability * 100)}%
                  </span>
                </div>
                <span className="text-muted-blue transition-transform duration-200"
                  style={{ transform: openScenario === i ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  ▼
                </span>
              </button>
              {openScenario === i && (
                <div className="px-3 pb-3">
                  <p className="text-body text-muted-blue">{s.description}</p>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mt-2">
                    <div className="h-full rounded-full bg-baldur-blue/50"
                      style={{ width: `${s.probability * 100}%` }} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Regions */}
      <div className="glass-card p-4">
        <h2 className="text-section-title text-ice-white mb-3">Regionen</h2>
        <div className="space-y-2">
          {regions.map((r) => {
            const dir = DIRECTION_DISPLAY[r.trend] || DIRECTION_DISPLAY.STABLE;
            return (
              <div key={r.name} className="flex items-center gap-3">
                <span className="text-body w-6">{r.flag}</span>
                <span className="text-body text-ice-white w-16">{r.name}</span>
                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-baldur-blue/40" style={{ width: `${r.score}%` }} />
                </div>
                <span className="text-data-small tabular-nums text-ice-white w-8 text-right">{r.score}</span>
                <span className="text-caption w-3" style={{ color: dir.color }}>{dir.arrow}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
