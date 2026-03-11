'use client';

import GlassCard from '@/components/shared/GlassCard';
import { COLORS } from '@/lib/constants';

export default function IntelCard({ dashboard, onNavigate }) {
  const intel = dashboard.intelligence || {};
  const divCount = intel.divergences_count || 0;
  const divs = intel.divergences || [];
  const claims = intel.high_novelty_claims || [];
  const catalysts = intel.catalyst_timeline || [];
  const sourceCards = intel.source_cards || [];

  // Phase 3 data
  const beliefState = intel.belief_state || {};
  const crossSystem = intel.cross_system || [];
  const activeThreads = intel.active_threads || [];
  const preMortems = intel.pre_mortems || [];
  const cadenceAnomalies = intel.cadence_anomalies || [];
  const expertDisagreements = intel.expert_disagreements || [];

  // Cross-system stats
  const csContradicting = crossSystem.filter(c => c.alignment === 'CONTRADICTING');
  const csDiverging = crossSystem.filter(c => c.alignment === 'DIVERGING');

  // Stripe: CONTRADICTING > high DIV count > DIV > green
  let stripeColor = COLORS.signalGreen;
  if (csContradicting.length > 0) stripeColor = COLORS.signalRed;
  else if (divCount >= 3) stripeColor = COLORS.signalOrange;
  else if (divCount >= 1 || csDiverging.length >= 3) stripeColor = COLORS.signalYellow;

  // Aggregate consensus direction
  const consensus = intel.consensus || {};
  const themes = Object.entries(consensus);
  const bullish = themes.filter(([, d]) => d.direction === 'BULLISH').length;
  const total = themes.length;

  // Source card stats
  const totalSources = sourceCards.length;
  const staleSources = sourceCards.filter(s => s.stale_warning).length;
  const activeSources = totalSources - staleSources;
  const totalClaims = sourceCards.reduce((sum, s) => sum + (s.active_claims || 0), 0);

  // Belief state: top 3 by deviation from neutral (5.0)
  const beliefEntries = Object.entries(beliefState)
    .filter(([, v]) => typeof v === 'object' && v.belief !== undefined)
    .sort((a, b) => Math.abs(b[1].belief - 5.0) - Math.abs(a[1].belief - 5.0))
    .slice(0, 3);
  const hasBeliefs = beliefEntries.length > 0;

  // Thread stats
  const threateningThreads = activeThreads.filter(t => t.portfolio_alignment === 'THREATENING');

  // Pre-Mortem high risk count
  const highRiskPMs = preMortems.filter(pm => pm.aggregate_risk === 'HIGH');

  return (
    <GlassCard variant="secondary" stripeColor={stripeColor} onClick={() => onNavigate('intel')}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-label uppercase tracking-wider text-muted-blue">🔍 Intelligence</span>
        <div className="flex items-center gap-1.5">
          {csContradicting.length > 0 && (
            <span className="text-label font-medium px-2 py-0.5 rounded bg-signal-red/20 text-signal-red">
              {csContradicting.length} CONTR
            </span>
          )}
          {divCount > 0 && (
            <span className="text-label font-medium px-2 py-0.5 rounded bg-signal-yellow/20 text-signal-yellow">
              {divCount} DIV
            </span>
          )}
        </div>
      </div>

      {/* Source Status */}
      {totalSources > 0 && (
        <div className="flex items-center gap-2 mb-2 text-caption">
          <span className="text-signal-green">{activeSources} active</span>
          {staleSources > 0 && (
            <span className="text-signal-orange">{staleSources} stale</span>
          )}
          <span className="text-muted-blue">· {totalClaims} claims</span>
        </div>
      )}

      {/* Belief State Summary (Phase 3) */}
      {hasBeliefs && (
        <div className="mb-2">
          <p className="text-caption text-muted-blue mb-1">BELIEF STATE:</p>
          <div className="space-y-0.5">
            {beliefEntries.map(([topic, b]) => {
              const score = b.belief ?? 5.0;
              const dir = score > 5.2 ? 'BULL' : score < 4.8 ? 'BEAR' : 'NEUT';
              const color = score >= 6.0 ? COLORS.signalGreen
                : score > 5.0 ? '#86efac'
                : score === 5.0 ? COLORS.mutedBlue
                : score >= 4.0 ? COLORS.signalYellow
                : COLORS.signalRed;
              return (
                <div key={topic} className="flex items-center gap-2">
                  <span className="text-caption text-ice-white/80 w-24 truncate">{topic.replace(/_/g, ' ')}</span>
                  <span className="text-caption tabular-nums font-medium" style={{ color }}>{score.toFixed(1)}</span>
                  <span className="text-caption" style={{ color }}>{dir}</span>
                  {b.stale_warning && <span className="text-caption text-signal-orange">⚠</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cross-System Status (Phase 3) */}
      {crossSystem.length > 0 && (
        <div className="mb-2">
          {csContradicting.length > 0 ? (
            <p className="text-caption text-signal-red font-medium">
              ❌ {csContradicting.length} IC-Daten Widerspruch{csContradicting.length > 1 ? 'e' : ''}
              {csDiverging.length > 0 && <span className="text-signal-yellow font-normal"> · {csDiverging.length} diverging</span>}
            </p>
          ) : csDiverging.length > 0 ? (
            <p className="text-caption text-signal-yellow font-medium">
              ⚠ {csDiverging.length} IC-Daten Divergenz{csDiverging.length > 1 ? 'en' : ''}
            </p>
          ) : (
            <p className="text-caption text-signal-green">✅ IC + V16 aligned</p>
          )}
        </div>
      )}

      {/* Threads + Pre-Mortems (Phase 2/3) */}
      {(activeThreads.length > 0 || highRiskPMs.length > 0) && (
        <div className="flex items-center gap-3 mb-2 text-caption">
          {activeThreads.length > 0 && (
            <span className="text-muted-blue">
              🧵 {activeThreads.length} thread{activeThreads.length !== 1 ? 's' : ''}
              {threateningThreads.length > 0 && (
                <span className="text-signal-red ml-1">({threateningThreads.length} ⚠)</span>
              )}
            </span>
          )}
          {highRiskPMs.length > 0 && (
            <span className="text-signal-red">
              💀 {highRiskPMs.length} HIGH risk
            </span>
          )}
        </div>
      )}

      {/* Cadence + Disagreements one-liner */}
      {(cadenceAnomalies.length > 0 || expertDisagreements.length > 0) && (
        <div className="flex items-center gap-3 mb-2 text-caption">
          {cadenceAnomalies.length > 0 && (
            <span className="text-signal-orange">📢 {cadenceAnomalies.length} cadence alert{cadenceAnomalies.length !== 1 ? 's' : ''}</span>
          )}
          {expertDisagreements.length > 0 && (
            <span className="text-signal-yellow">⚔️ {expertDisagreements.length} dissens</span>
          )}
        </div>
      )}

      {/* Consensus */}
      {total > 0 && (
        <p className="text-body text-ice-white mb-2">
          Konsens: {bullish >= total / 2 ? 'BULLISH' : 'BEARISH'} ({bullish} von {total})
        </p>
      )}

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
