'use client';

import GlassCard from '@/components/shared/GlassCard';
import { COLORS } from '@/lib/constants';

const STATUS_COLORS = {
  STABLE: COLORS.signalGreen,
  SHIFTING: COLORS.signalYellow,
  ELEVATED_RISK: COLORS.signalOrange,
  STRUCTURAL_BREAK: COLORS.signalRed,
};

const REGION_LABELS = {
  USA: '🇺🇸', CHINA: '🇨🇳', EU: '🇪🇺', INDIA: '🇮🇳',
  JP_KR_TW: '🇯🇵', GULF: '🇸🇦', REST_EM: '🌍',
};

const SCENARIO_LABELS = {
  managed_decline: 'Managed Decline',
  conflict_escalation: 'Conflict Escalation',
  us_renewal: 'US Renewal',
  multipolar_chaos: 'Multipolar Chaos',
};

export default function G7Card({ dashboard, onNavigate }) {
  const g7 = dashboard?.g7;

  // Graceful degradation: no g7 block yet
  if (!g7 || !g7.available) {
    return (
      <GlassCard variant="secondary" stripeColor={COLORS.mutedBlue} onClick={() => onNavigate('g7')}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-label uppercase tracking-wider text-muted-blue">🌍 G7 World Order</span>
          <span className="text-label text-muted-blue">PENDING</span>
        </div>
        <p className="text-caption text-muted-blue">G7 Daten werden geladen...</p>
      </GlassCard>
    );
  }

  const statusColor = STATUS_COLORS[g7.status] || COLORS.mutedBlue;
  const ps = g7.power_scores || {};
  const gap = g7.gap || {};
  const scenarios = g7.scenarios || {};
  const probs = scenarios.probabilities || {};
  const sit = g7.sit || {};
  const narr = g7.narrative || {};

  // Find dominant scenario
  const dominant = scenarios.dominant || 'managed_decline';
  const dominantPct = Math.round((probs[dominant] || 0) * 100);

  // Top 3 regions by score
  const regionEntries = Object.entries(ps)
    .map(([r, d]) => ({ region: r, score: d.score || 0, momentum: d.momentum || 0 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return (
    <GlassCard variant="secondary" stripeColor={statusColor} onClick={() => onNavigate('g7')}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-label uppercase tracking-wider text-muted-blue">🌍 G7 World Order</span>
        <span className="text-label font-medium px-2 py-0.5 rounded"
          style={{ backgroundColor: `${statusColor}20`, color: statusColor }}>
          {g7.status}
        </span>
      </div>

      {/* Gap + Dominant Scenario */}
      <div className="flex items-center gap-4 mb-3">
        <div>
          <span className="text-caption text-muted-blue block">USA-China Gap</span>
          <span className="text-data-medium tabular-nums text-ice-white">{gap.value ?? '—'}</span>
          <span className="text-caption text-muted-blue ml-1">{gap.trend || ''}</span>
        </div>
        <div>
          <span className="text-caption text-muted-blue block">Dominant</span>
          <span className="text-data-small text-ice-white">{SCENARIO_LABELS[dominant] || dominant}</span>
          <span className="text-caption text-baldur-blue ml-1">{dominantPct}%</span>
        </div>
      </div>

      {/* Region scores compact */}
      <div className="flex flex-wrap gap-2 mb-3">
        {regionEntries.map((r) => (
          <div key={r.region} className="flex items-center gap-1 text-caption">
            <span>{REGION_LABELS[r.region] || r.region}</span>
            <span className="text-ice-white tabular-nums">{r.score.toFixed(1)}</span>
            <span style={{ color: r.momentum > 0.3 ? COLORS.signalGreen : r.momentum < -0.3 ? COLORS.signalRed : COLORS.mutedBlue }}>
              {r.momentum > 0.3 ? '↑' : r.momentum < -0.3 ? '↓' : '→'}
            </span>
          </div>
        ))}
      </div>

      {/* SIT Global */}
      {sit.global_trend && sit.global_trend !== 'STABLE' && (
        <p className="text-caption text-signal-yellow mb-1">
          ⚠ SIT: {sit.global_trend} {sit.dominant_driver ? `— ${sit.dominant_driver}` : ''}
        </p>
      )}

      {/* Headline truncated */}
      {narr.headline && (
        <p className="text-caption text-muted-blue line-clamp-2">{narr.headline}</p>
      )}

      <p className="text-caption text-muted-blue text-right mt-2">Details →</p>
    </GlassCard>
  );
}
