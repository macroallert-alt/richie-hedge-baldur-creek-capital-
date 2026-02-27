'use client';

import GlassCard from '@/components/shared/GlassCard';
import { G7_REGIME_COLORS, COLORS, DIRECTION_DISPLAY } from '@/lib/constants';

export default function G7Card({ dashboard, onNavigate }) {
  const g7 = dashboard.g7_summary;
  if (!g7) return null;

  const regimeColor = G7_REGIME_COLORS[g7.active_regime] || COLORS.mutedBlue;
  const regions = g7.regions || [];
  const scenarios = g7.scenarios || [];
  const topScenario = scenarios[0];

  return (
    <GlassCard variant="secondary" stripeColor={regimeColor} onClick={() => onNavigate('g7')}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-label uppercase tracking-wider text-muted-blue">🌍 G7 World Order</span>
        <span className="text-label font-medium px-2 py-0.5 rounded"
          style={{ backgroundColor: `${regimeColor}20`, color: regimeColor }}>
          {g7.active_regime} — {g7.regime_label}
        </span>
      </div>

      {/* EWI Score */}
      <div className="flex items-center gap-3 mb-3">
        <div>
          <span className="text-caption text-muted-blue block">EWI</span>
          <span className="text-data-medium tabular-nums text-ice-white">{g7.ewi_score}</span>
          <span className="text-caption text-muted-blue ml-1">{g7.ewi_label}</span>
        </div>
        <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-signal-yellow/60" style={{ width: `${g7.ewi_score}%` }} />
        </div>
      </div>

      {/* Regions (compact) */}
      <div className="flex flex-wrap gap-2 mb-3">
        {regions.slice(0, 5).map((r) => {
          const dir = DIRECTION_DISPLAY[r.trend] || DIRECTION_DISPLAY.STABLE;
          return (
            <div key={r.name} className="flex items-center gap-1 text-caption">
              <span>{r.flag}</span>
              <span className="text-ice-white tabular-nums">{r.score}</span>
              <span style={{ color: dir.color }}>{dir.arrow}</span>
            </div>
          );
        })}
      </div>

      {/* Top Scenario */}
      {topScenario && (
        <p className="text-caption text-muted-blue">
          Top: {topScenario.name} ({Math.round(topScenario.probability * 100)}%)
        </p>
      )}

      {/* Attention Flags */}
      {g7.attention_flags?.length > 0 && (
        <p className="text-caption text-signal-yellow mt-1">
          ⚠ {g7.attention_flags[0].slice(0, 80)}...
        </p>
      )}

      <p className="text-caption text-muted-blue text-right mt-2">Details →</p>
    </GlassCard>
  );
}
