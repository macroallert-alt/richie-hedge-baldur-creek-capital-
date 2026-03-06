'use client';

import { getScoreColor, getStabilityColor, DIRECTION_DISPLAY, LAYER_FULL_NAMES, FRAGILITY_COLORS, COLORS } from '@/lib/constants';

export default function LayersDetail({ dashboard }) {
  const layers = dashboard?.layers || {};
  const scores = layers.layer_scores || {};
  const stability = layers.regime_stability_pct ?? 0;
  const fragility = layers.fragility_state || '—';
  const fragData = layers.fragility_data || {};
  const stabilityColor = getStabilityColor(stability);

  return (
    <div className="py-4 space-y-4">
      <h1 className="text-page-title text-center lg:text-page-title text-center-desktop">Layer Scores</h1>

      {/* Overview */}
      <div className="glass-card-primary p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-caption text-muted-blue block">System Regime</span>
            <span className="text-data-large text-ice-white">{layers.system_regime?.replace(/_/g, ' ') || '—'}</span>
          </div>
          <div className="text-right">
            <span className="text-caption text-muted-blue block">Fragility</span>
            <span className="text-data-medium" style={{ color: FRAGILITY_COLORS[fragility] || COLORS.mutedBlue }}>
              {fragility}
            </span>
          </div>
        </div>

        {/* Stability Bar */}
        <div className="mb-2">
          <div className="flex items-center justify-between text-caption text-muted-blue mb-1">
            <span>Regime Stability</span>
            <span className="tabular-nums" style={{ color: stabilityColor }}>{stability}%</span>
          </div>
          <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${stability}%`, backgroundColor: stabilityColor }} />
          </div>
        </div>

        {/* Fragility Data */}
        <div className="grid grid-cols-3 gap-3 mt-3">
          <div className="text-center">
            <span className="text-caption text-muted-blue block">HHI</span>
            <span className="text-data-small tabular-nums text-ice-white">{fragData.hhi?.toFixed(2) ?? '—'}</span>
          </div>
          <div className="text-center">
            <span className="text-caption text-muted-blue block">Breadth</span>
            <span className="text-data-small tabular-nums text-ice-white">{fragData.breadth?.toFixed(2) ?? '—'}</span>
          </div>
          <div className="text-center">
            <span className="text-caption text-muted-blue block">SPY-RSP Δ</span>
            <span className="text-data-small tabular-nums text-ice-white">{fragData.spy_rsp_delta?.toFixed(2) ?? '—'}</span>
          </div>
        </div>
      </div>

      {/* 8 Layer Cards */}
      <div className="space-y-3">
        {Object.entries(scores).map(([key, raw]) => {
          const score = typeof raw === 'number' ? raw : (raw?.score ?? 0);
          const direction = typeof raw === 'object' ? raw?.direction : null;
          const rawConviction = typeof raw === 'object' ? raw?.conviction : null;
          const conviction = typeof rawConviction === 'object' ? (rawConviction?.composite || rawConviction?.level || '—') : rawConviction;
          const scoreColor = getScoreColor(score);
          const dir = DIRECTION_DISPLAY[direction] || DIRECTION_DISPLAY.STABLE;

          return (
            <div key={key} className="glass-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-section-title text-ice-white">{LAYER_FULL_NAMES[key] || key}</span>
                <div className="flex items-center gap-2">
                  <span className="text-data-medium tabular-nums" style={{ color: scoreColor }}>{score.toFixed(1)}</span>
                  <span className="text-body" style={{ color: dir.color }}>{dir.arrow}</span>
                </div>
              </div>

              {/* Score Bar */}
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden mb-2">
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.abs(score) * 10}%`, backgroundColor: scoreColor }} />
              </div>

              <div className="flex items-center justify-between text-caption">
                <span className="text-muted-blue">Direction: <span style={{ color: dir.color }}>{direction || '—'}</span></span>
                <span className="text-muted-blue">Conviction: {conviction || '—'}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
