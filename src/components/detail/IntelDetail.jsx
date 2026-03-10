'use client';

import { useState } from 'react';
import { COLORS } from '@/lib/constants';

// ── Freshness helpers ──────────────────────────────────────────────
const FRESHNESS_CONFIG = {
  FRESH:    { label: 'FRESH',    opacity: 1.0, color: COLORS.signalGreen, bg: 'bg-signal-green/15' },
  AGING:    { label: 'AGING',    opacity: 0.8, color: COLORS.signalYellow, bg: 'bg-signal-yellow/15' },
  FADING:   { label: 'FADING',   opacity: 0.5, color: COLORS.signalOrange, bg: 'bg-signal-orange/15' },
  ARCHIVED: { label: 'ARCHIVED', opacity: 0.35, color: COLORS.fadedBlue, bg: 'bg-white/5' },
};

const TIER_CONFIG = {
  CORE:          { label: 'CORE',      color: COLORS.baldurBlue, bg: 'bg-baldur-blue/20' },
  SECONDARY:     { label: 'SECONDARY', color: COLORS.mutedBlue,  bg: 'bg-white/8' },
  NOISE_FILTER:  { label: 'NOISE',     color: COLORS.fadedBlue,  bg: 'bg-white/5' },
};

const SCORE_COLOR = (s) => s > 0 ? COLORS.signalGreen : s < 0 ? COLORS.signalRed : COLORS.mutedBlue;

function directionArrow(dir) {
  if (dir === 'BULLISH') return { arrow: '\u25B2', color: COLORS.signalGreen };
  if (dir === 'BEARISH') return { arrow: '\u25BC', color: COLORS.signalRed };
  return { arrow: '\u2014', color: COLORS.mutedBlue };
}

function daysAgoText(days) {
  if (days === null || days === undefined) return '\u2014';
  if (days === 0) return 'today';
  if (days === 1) return '1d ago';
  return `${days}d ago`;
}

function getFreshnessForClaim(claim) {
  if (claim.freshness && FRESHNESS_CONFIG[claim.freshness]) return claim.freshness;
  if (!claim.date) return 'FRESH';
  const age = Math.floor((Date.now() - new Date(claim.date).getTime()) / 86400000);
  if (age <= 2) return 'FRESH';
  if (age <= 5) return 'AGING';
  if (age <= 7) return 'FADING';
  return 'ARCHIVED';
}

// ── Source Card (collapsed + expanded) ─────────────────────────────
function SourceCard({ card }) {
  const [expanded, setExpanded] = useState(false);
  const tier = TIER_CONFIG[card.tier] || TIER_CONFIG.SECONDARY;
  const dir = directionArrow(card.direction);
  const signal = card.bias_adjusted_signal ?? 0;
  const isStale = card.stale_warning === true;
  const daysSince = card.days_since_content;

  return (
    <div
      className="rounded-xl border border-white/8 bg-white/[0.03] hover:bg-white/[0.06] transition-colors cursor-pointer"
      onClick={() => setExpanded(!expanded)}
    >
      {/* Collapsed View */}
      <div className="p-3">
        {/* Row 1: Name + Tier */}
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-body font-medium text-ice-white truncate mr-2">
            {card.source_name || card.source_id}
          </span>
          <span className={`text-caption px-1.5 py-0.5 rounded ${tier.bg}`} style={{ color: tier.color }}>
            {tier.label}
          </span>
        </div>

        {/* Row 2: Direction + Signal + Stale/Freshness */}
        <div className="flex items-center gap-2 mb-1.5">
          {isStale ? (
            <span className="text-caption font-medium px-1.5 py-0.5 rounded bg-signal-orange/20 text-signal-orange">
              STALE
            </span>
          ) : (
            <>
              <span className="text-data-small font-medium" style={{ color: dir.color }}>
                {dir.arrow} {card.direction || '\u2014'}
              </span>
              <span className="text-data-small tabular-nums" style={{ color: SCORE_COLOR(signal) }}>
                {signal > 0 ? '+' : ''}{signal}
              </span>
            </>
          )}
          <span className="text-caption text-muted-blue ml-auto">
            {daysAgoText(daysSince)}
          </span>
        </div>

        {/* Row 3: Claims count + freshness breakdown */}
        <div className="flex items-center gap-2 text-caption text-muted-blue">
          <span>{card.active_claims || 0} claims</span>
          {card.freshness_breakdown && (
            <>
              <span>·</span>
              {card.freshness_breakdown.FRESH > 0 && (
                <span style={{ color: COLORS.signalGreen }}>{card.freshness_breakdown.FRESH} fresh</span>
              )}
              {card.freshness_breakdown.AGING > 0 && (
                <span style={{ color: COLORS.signalYellow }}>{card.freshness_breakdown.AGING} aging</span>
              )}
              {card.freshness_breakdown.FADING > 0 && (
                <span style={{ color: COLORS.signalOrange }}>{card.freshness_breakdown.FADING} fading</span>
              )}
            </>
          )}
        </div>

        {/* Row 4: Top Claim (truncated) */}
        {card.top_claim && (
          <p className="text-caption text-ice-white/70 mt-1.5 line-clamp-2">
            &quot;{card.top_claim}&quot;
          </p>
        )}

        {/* Row 5: Topics */}
        {card.topics && card.topics.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {card.topics.map((t) => (
              <span key={t} className="text-caption px-1.5 py-0.5 rounded bg-white/5 text-muted-blue">
                {t.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        )}

        {/* Expand indicator */}
        <p className="text-caption text-muted-blue/50 text-right mt-1">
          {expanded ? '\u25B2 collapse' : '\u25BC expand'}
        </p>
      </div>

      {/* Expanded View */}
      {expanded && (
        <div className="border-t border-white/5 px-3 pb-3 pt-2">
          {/* Source metadata */}
          <div className="grid grid-cols-2 gap-2 text-caption text-muted-blue mb-2">
            <span>Bias: {card.known_bias > 0 ? '+' : ''}{card.known_bias ?? '\u2014'}</span>
            <span>Intensity: {card.intensity ?? '\u2014'}</span>
            <span>Last: {card.latest_content_date || '\u2014'}</span>
            <span>Claims: {card.active_claims || 0}</span>
          </div>

          {/* Stale detail */}
          {isStale && (
            <div className="rounded-lg bg-signal-orange/10 border border-signal-orange/20 p-2 mb-2">
              <p className="text-caption text-signal-orange">
                No new content for {daysSince} days. Claims are carried forward with decay.
              </p>
            </div>
          )}

          {/* All topics with full names */}
          {card.topics && card.topics.length > 0 && (
            <div className="mb-2">
              <span className="text-caption text-muted-blue">Topics: </span>
              <span className="text-caption text-ice-white/70">
                {card.topics.map(t => t.replace(/_/g, ' ')).join(', ')}
              </span>
            </div>
          )}

          {/* All Claims List */}
          {card.claims && card.claims.length > 0 && (
            <div className="mt-3 space-y-2">
              <span className="text-caption text-muted-blue">All Claims ({card.claims.length}):</span>
              {card.claims.map((cl, idx) => {
                const clFresh = FRESHNESS_CONFIG[cl.freshness] || FRESHNESS_CONFIG.FRESH;
                return (
                  <div key={idx} className="rounded-lg bg-white/[0.02] border border-white/5 p-2" style={{ opacity: clFresh.opacity }}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-caption px-1 py-0.5 rounded ${clFresh.bg}`} style={{ color: clFresh.color }}>
                        {clFresh.label}
                      </span>
                      <span className="text-caption text-muted-blue">{cl.content_date}</span>
                      <span className="text-caption text-muted-blue">N:{cl.novelty_score}</span>
                      {cl.direction && (
                        <span className="text-caption" style={{ color: cl.direction === "BULLISH" ? COLORS.signalGreen : cl.direction === "BEARISH" ? COLORS.signalRed : COLORS.mutedBlue }}>
                          {cl.direction === "BULLISH" ? "\u25B2" : cl.direction === "BEARISH" ? "\u25BC" : "\u2014"} {cl.intensity}
                        </span>
                      )}
                    </div>
                    <p className="text-caption text-ice-white/80">{cl.claim_text}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* No claims fallback */}
          {(!card.claims || card.claims.length === 0) && card.top_claim && (
            <div className="mt-2">
              <span className="text-caption text-muted-blue">Top Claim: </span>
              <p className="text-caption text-ice-white/80 mt-0.5">&quot;{card.top_claim}&quot;</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────
export default function IntelDetail({ dashboard }) {
  const intel = dashboard?.intelligence || {};
  const consensus = intel.consensus || {};
  const divergences = intel.divergences || [];
  const claims = intel.high_novelty_claims || [];
  const catalysts = intel.catalyst_timeline || [];
  const sourceCards = intel.source_cards || [];

  // Source card stats for summary
  const totalSources = sourceCards.length;
  const staleSources = sourceCards.filter(s => s.stale_warning).length;
  const activeSources = totalSources - staleSources;
  const totalClaims = sourceCards.reduce((sum, s) => sum + (s.active_claims || 0), 0);

  return (
    <div className="py-4 space-y-4">
      <h1 className="text-page-title text-center lg:text-page-title text-center-desktop">Intelligence Center</h1>

      {/* ── Source Cards (V2) ─────────────────────────────────── */}
      {sourceCards.length > 0 && (
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-section-title text-ice-white">Source Cards</h2>
            <div className="flex items-center gap-3 text-caption">
              <span className="text-signal-green">{activeSources} active</span>
              {staleSources > 0 && (
                <span className="text-signal-orange">{staleSources} stale</span>
              )}
              <span className="text-muted-blue">{totalClaims} claims</span>
            </div>
          </div>

          {/* Grid: 1 col mobile, 2 col tablet, 3 col desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sourceCards.map((card) => (
              <SourceCard key={card.source_id} card={card} />
            ))}
          </div>
        </div>
      )}

      {/* ── IC Konsens (V1) ────────────────────────────────────── */}
      {Object.keys(consensus).length > 0 && (
        <div className="glass-card p-4">
          <h2 className="text-section-title text-ice-white mb-3">IC Konsens</h2>
          <div className="space-y-2">
            {Object.entries(consensus).map(([theme, data]) => {
              const score = data?.score ?? 0;
              return (
                <div key={theme} className="flex items-center gap-2">
                  <span className="text-data-small text-ice-white w-32 truncate">{theme.replace(/_/g, ' ')}</span>
                  <span className="text-data-small tabular-nums w-10 text-right" style={{ color: SCORE_COLOR(score) }}>
                    {score > 0 ? '+' : ''}{score.toFixed(1)}
                  </span>
                  <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden relative">
                    <div className="absolute top-0 h-full w-px bg-white/10" style={{ left: '50%' }} />
                    {score > 0 ? (
                      <div className="absolute top-0 h-full bg-signal-green/40 rounded-full"
                        style={{ left: '50%', width: `${Math.min(score * 10, 50)}%` }} />
                    ) : (
                      <div className="absolute top-0 h-full bg-signal-red/40 rounded-full"
                        style={{ right: '50%', width: `${Math.min(Math.abs(score) * 10, 50)}%` }} />
                    )}
                  </div>
                  <span className="text-caption text-muted-blue w-8 text-right">{data.sources}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Divergenzen (V1) ───────────────────────────────────── */}
      {divergences.length > 0 && (
        <div className="glass-card p-4">
          <h2 className="text-section-title text-ice-white mb-3">Divergenzen ({divergences.length})</h2>
          <div className="space-y-4">
            {divergences.map((div, i) => (
              <div key={i} className="border-l-2 border-signal-yellow/50 pl-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-data-small font-medium text-signal-yellow">{div.theme}</span>
                  <span className="text-caption text-muted-blue">Magnitude: {div.magnitude.toFixed(2)}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 my-2">
                  <div className="bg-white/3 rounded-lg p-2 text-center">
                    <span className="text-caption text-muted-blue block">IC Signal</span>
                    <span className="text-data-medium tabular-nums" style={{ color: SCORE_COLOR(div.ic_signal) }}>
                      {div.ic_signal > 0 ? '+' : ''}{div.ic_signal}
                    </span>
                    <span className="text-caption text-muted-blue block">
                      {div.ic_top_contributors?.join(', ')}
                    </span>
                  </div>
                  <div className="bg-white/3 rounded-lg p-2 text-center">
                    <span className="text-caption text-muted-blue block">DC Signal</span>
                    <span className="text-data-medium tabular-nums" style={{ color: SCORE_COLOR(div.dc_signal) }}>
                      {div.dc_signal > 0 ? '+' : ''}{div.dc_signal}
                    </span>
                    <span className="text-caption text-muted-blue block">{div.dc_source_field}</span>
                  </div>
                </div>

                <p className="text-caption text-muted-blue italic">{div.interpretation_hint}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── High Novelty Claims (V1 + Freshness Badges) ──────── */}
      {claims.length > 0 && (
        <div className="glass-card p-4">
          <h2 className="text-section-title text-ice-white mb-3">High Novelty Claims</h2>
          <div className="space-y-3">
            {claims.map((c, i) => {
              const freshness = getFreshnessForClaim(c);
              const fConfig = FRESHNESS_CONFIG[freshness] || FRESHNESS_CONFIG.FRESH;
              return (
                <div key={i} className="border-l-2 border-baldur-blue/50 pl-3" style={{ opacity: fConfig.opacity }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-caption px-1.5 py-0.5 rounded ${fConfig.bg}`} style={{ color: fConfig.color }}>
                      {fConfig.label}
                    </span>
                    {c.theme && (
                      <span className="text-caption text-muted-blue">{c.theme.replace(/_/g, ' ')}</span>
                    )}
                  </div>
                  <p className="text-body text-ice-white">{c.claim}</p>
                  <div className="flex items-center gap-3 mt-1 text-caption text-muted-blue">
                    <span>{c.source}</span>
                    {c.date && <span>{c.date}</span>}
                    <span>Novelty: {c.novelty}</span>
                    <span>Signal: {c.signal > 0 ? '+' : ''}{c.signal}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Catalyst Timeline (V1) ────────────────────────────── */}
      {catalysts.length > 0 && (
        <div className="glass-card p-4">
          <h2 className="text-section-title text-ice-white mb-3">Catalyst Timeline</h2>
          <div className="space-y-2">
            {catalysts.map((c, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className={`text-data-small tabular-nums w-6 text-right ${
                  c.days_until <= 1 ? 'text-signal-red' : c.days_until <= 3 ? 'text-signal-yellow' : 'text-muted-blue'
                }`}>
                  {c.days_until}d
                </span>
                <div className="flex-1">
                  <span className="text-body text-ice-white">{c.event}</span>
                  <span className="text-caption text-muted-blue ml-2">{c.date}</span>
                </div>
                <span className={`text-caption px-1.5 py-0.5 rounded ${
                  c.impact === 'HIGH' ? 'bg-signal-red/20 text-signal-red' : 'bg-signal-yellow/20 text-signal-yellow'
                }`}>{c.impact}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}