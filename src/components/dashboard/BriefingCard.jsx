'use client';

import GlassCard from '@/components/shared/GlassCard';
import { COLORS } from '@/lib/constants';

export default function BriefingCard({ dashboard, onNavigate }) {
  const nl = dashboard.newsletter || {};
  const scores = nl.composite_scores || {};
  const tact = scores.tactical || {};
  const pos = scores.positional || {};
  const struct = scores.structural || {};
  const integrity = nl.data_integrity;
  const coherence = nl.pipeline_coherence;
  const oneThing = nl.one_thing || '';
  const anchorType = nl.anchor_type || '';
  const warningCount = nl.warning_count || 0;
  const breakingCount = nl.breaking_news_count || 0;

  // Zone helpers
  const zoneColor = (zone) => {
    if (zone === 'CALM') return COLORS.signalGreen;
    if (zone === 'ELEVATED') return COLORS.signalYellow;
    if (zone === 'STRESS') return COLORS.signalOrange;
    if (zone === 'PANIC') return COLORS.signalRed;
    return COLORS.mutedBlue;
  };

  const zoneEmoji = (zone) => {
    if (zone === 'CALM') return '🟢';
    if (zone === 'ELEVATED') return '🟡';
    if (zone === 'STRESS') return '🟠';
    if (zone === 'PANIC') return '🔴';
    return '⚪';
  };

  // Stripe color: lowest composite zone
  const lowestScore = Math.min(
    tact.score ?? 100,
    pos.score ?? 100,
    struct.score ?? 100,
  );
  let stripeColor = COLORS.signalGreen;
  if (lowestScore < 30) stripeColor = COLORS.signalRed;
  else if (lowestScore < 50) stripeColor = COLORS.signalOrange;
  else if (lowestScore < 70) stripeColor = COLORS.signalYellow;

  // If no newsletter data yet
  if (!nl.date) {
    return (
      <GlassCard variant="secondary" stripeColor={COLORS.mutedBlue} onClick={() => onNavigate('briefing')}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-label uppercase tracking-wider text-muted-blue">📰 Daily Briefing</span>
        </div>
        <p className="text-caption text-muted-blue">Newsletter noch nicht generiert.</p>
        <p className="text-caption text-muted-blue text-right mt-2">Details →</p>
      </GlassCard>
    );
  }

  return (
    <GlassCard variant="secondary" stripeColor={stripeColor} onClick={() => onNavigate('briefing')}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-label uppercase tracking-wider text-muted-blue">📰 Daily Briefing</span>
        <div className="flex items-center gap-1.5">
          {anchorType === 'CRITICAL' && (
            <span className="text-label font-medium px-2 py-0.5 rounded bg-signal-red/20 text-signal-red">
              CRITICAL
            </span>
          )}
          {warningCount > 0 && (
            <span className="text-label font-medium px-2 py-0.5 rounded bg-signal-yellow/20 text-signal-yellow">
              {warningCount} ⚠
            </span>
          )}
          {breakingCount > 0 && (
            <span className="text-label font-medium px-2 py-0.5 rounded bg-signal-red/20 text-signal-red">
              {breakingCount} 📰
            </span>
          )}
        </div>
      </div>

      {/* One Thing */}
      {oneThing && (
        <p className="text-body text-ice-white mb-3 leading-snug">
          &ldquo;{oneThing.length > 100 ? oneThing.slice(0, 100) + '...' : oneThing}&rdquo;
        </p>
      )}

      {/* Composite Scores */}
      <div className="flex items-center gap-3 mb-2">
        {[
          { label: 'TACT', data: tact },
          { label: 'POS', data: pos },
          { label: 'STR', data: struct },
        ].map(({ label, data }) => (
          <div key={label} className="flex items-center gap-1">
            <span className="text-caption text-muted-blue">{label}:</span>
            <span className="text-caption tabular-nums font-medium" style={{ color: zoneColor(data.zone) }}>
              {data.score ?? '—'}
            </span>
            {data.velocity != null && data.velocity !== 0 && (
              <span className="text-caption" style={{ color: data.velocity < 0 ? COLORS.signalRed : COLORS.signalGreen }}>
                {data.velocity > 0 ? '▲' : '▼'}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Regime + Coherence */}
      <div className="flex items-center gap-2 mb-2 text-caption">
        <span className="text-ice-white/80">
          {dashboard.v16?.regime || '—'}
        </span>
        <span className="text-muted-blue">·</span>
        {coherence != null && (
          <span style={{ color: coherence < 50 ? COLORS.signalRed : coherence < 70 ? COLORS.signalYellow : COLORS.signalGreen }}>
            Pipeline {coherence}%
          </span>
        )}
        {integrity != null && (
          <>
            <span className="text-muted-blue">·</span>
            <span style={{ color: integrity < 70 ? COLORS.signalRed : integrity < 90 ? COLORS.signalYellow : COLORS.signalGreen }}>
              Data {integrity}%
            </span>
          </>
        )}
      </div>

      <p className="text-caption text-muted-blue text-right mt-1">Details →</p>
    </GlassCard>
  );
}
