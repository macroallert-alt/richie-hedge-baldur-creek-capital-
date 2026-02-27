'use client';

import GlassCard from '@/components/shared/GlassCard';
import { getStabilityColor, getScoreColor, DIRECTION_DISPLAY, LAYER_SHORT_NAMES, FRAGILITY_COLORS, COLORS } from '@/lib/constants';

export default function LayerScoresCard({ dashboard, onNavigate }) {
  const layers = dashboard.layers || {};
  const scores = layers.layer_scores || {};
  const stability = layers.regime_stability_pct ?? 0;
  const stripeColor = getStabilityColor(stability);

  return (
    <GlassCard variant="standard" stripeColor={stripeColor} onClick={() => onNavigate('layers')}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-label uppercase tracking-wider text-muted-blue">📊 Layers</span>
        <span className="text-label font-medium px-2 py-0.5 rounded" style={{
          backgroundColor: `${stripeColor}20`,
          color: stripeColor,
        }}>
          {stability}% ✓
        </span>
      </div>

      {/* Layer Rows */}
      <div className="space-y-1.5 mb-3">
        {Object.entries(scores).map(([key, data]) => {
          const scoreColor = getScoreColor(data.score);
          const dir = DIRECTION_DISPLAY[data.direction] || DIRECTION_DISPLAY.STABLE;
          return (
            <div key={key} className="flex items-center gap-1.5">
              <span className="text-caption text-muted-blue w-24 truncate">
                {LAYER_SHORT_NAMES[key] || key}
              </span>
              <span className="text-data-small tabular-nums w-8 text-right" style={{ color: scoreColor }}>
                {data.score.toFixed(1)}
              </span>
              <span className="text-caption w-3 text-center" style={{ color: dir.color }}>{dir.arrow}</span>
              <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${data.score * 10}%`, backgroundColor: scoreColor }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Regime + Fragility */}
      <div className="text-caption text-muted-blue space-y-0.5">
        <p>Regime: {layers.system_regime?.replace(/_/g, ' ') || '—'}</p>
        <p>
          Fragility:{' '}
          <span style={{ color: FRAGILITY_COLORS[layers.fragility_state] || COLORS.mutedBlue }}>
            {layers.fragility_state || '—'}
          </span>
        </p>
      </div>

      <p className="text-caption text-muted-blue text-right mt-2">Details →</p>
    </GlassCard>
  );
}
