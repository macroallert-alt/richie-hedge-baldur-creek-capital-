'use client';

import GlassCard from '@/components/shared/GlassCard';
import { COLORS } from '@/lib/constants';

export default function IntelCard({ dashboard, onNavigate }) {
  const intel = dashboard.intelligence || {};
  const divCount = intel.divergences_count || 0;
  const divs = intel.divergences || [];
  const claims = intel.high_novelty_claims || [];
  const catalysts = intel.catalyst_timeline || [];

  // Stripe per Spec §4.9
  let stripeColor = COLORS.signalGreen;
  if (divCount >= 3) stripeColor = COLORS.signalOrange;
  else if (divCount >= 1) stripeColor = COLORS.signalYellow;

  // Aggregate consensus direction
  const consensus = intel.consensus || {};
  const themes = Object.entries(consensus);
  const bullish = themes.filter(([, d]) => d.direction === 'BULLISH').length;
  const total = themes.length;

  return (
    <GlassCard variant="secondary" stripeColor={stripeColor} onClick={() => onNavigate('intel')}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-label uppercase tracking-wider text-muted-blue">🔍 Intelligence</span>
        {divCount > 0 && (
          <span className="text-label font-medium px-2 py-0.5 rounded bg-signal-yellow/20 text-signal-yellow">
            {divCount} DIV
          </span>
        )}
      </div>

      {/* Consensus */}
      <p className="text-body text-ice-white mb-2">
        Konsens: {bullish >= total / 2 ? 'BULLISH' : 'BEARISH'} ({bullish} von {total})
      </p>

      {/* Top Divergence */}
      {divs[0] && (
        <div className="mb-2">
          <p className="text-caption text-signal-yellow font-medium">DIVERGENZ: {divs[0].theme}</p>
          <p className="text-caption text-muted-blue">
            IC {divs[0].ic_signal > 0 ? 'bullish' : 'bearish'} ({divs[0].ic_signal > 0 ? '+' : ''}{divs[0].ic_signal}) vs DC {divs[0].dc_signal > 0 ? 'bullish' : 'bearish'} ({divs[0].dc_signal > 0 ? '+' : ''}{divs[0].dc_signal})
          </p>
        </div>
      )}

      {/* Top Claim */}
      {claims[0] && (
        <div className="mb-2">
          <p className="text-caption text-muted-blue">TOP CLAIM:</p>
          <p className="text-caption text-ice-white">"{claims[0].claim?.slice(0, 80)}"</p>
          <p className="text-caption text-muted-blue">— {claims[0].source} (Novelty: {claims[0].novelty})</p>
        </div>
      )}

      {/* Catalysts */}
      {catalysts.length > 0 && (
        <p className="text-caption text-muted-blue">
          Catalysts: {catalysts.slice(0, 2).map(c => `${c.event} (${c.days_until}d)`).join(', ')}
        </p>
      )}

      <p className="text-caption text-muted-blue text-right mt-2">Details →</p>
    </GlassCard>
  );
}
