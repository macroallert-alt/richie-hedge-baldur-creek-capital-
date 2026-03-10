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
  if (dir === 'BULLISH') return { arrow: '▲', color: COLORS.signalGreen };
  if (dir === 'BEARISH') return { arrow: '▼', color: COLORS.signalRed };
  return { arrow: '—', color: COLORS.mutedBlue };
}

function daysAgoText(days) {
  if (days === null || days === undefined) return '—';
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

// ── Belief Score → human-readable direction label ─────────────────
function beliefLabel(score) {
  if (score >= 7.5) return 'STRONG BULL';
  if (score >= 6.0) return 'BULLISH';
  if (score > 5.0)  return 'LEAN BULL';
  if (score === 5.0) return 'NEUTRAL';
  if (score >= 4.0) return 'LEAN BEAR';
  if (score >= 2.5) return 'BEARISH';
  return 'STRONG BEAR';
}

function beliefColor(score) {
  if (score >= 6.0) return COLORS.signalGreen;
  if (score > 5.0)  return '#86efac'; // light green
  if (score === 5.0) return COLORS.mutedBlue;
  if (score >= 4.0) return COLORS.signalYellow;
  if (score >= 2.5) return COLORS.signalOrange;
  return COLORS.signalRed;
}

// Uncertainty → confidence label (inverted for readability)
function confidenceLabel(uncertainty) {
  if (uncertainty <= 0.25) return { label: 'HIGH', color: COLORS.signalGreen };
  if (uncertainty <= 0.45) return { label: 'MEDIUM', color: COLORS.signalYellow };
  if (uncertainty <= 0.65) return { label: 'LOW', color: COLORS.signalOrange };
  return { label: 'VERY LOW', color: COLORS.signalRed };
}

// ── Thread Config ─────────────────────────────────────────────────
const THREAD_STATUS_CONFIG = {
  SEED:        { label: 'SEED',        color: COLORS.mutedBlue,    bg: 'bg-white/8' },
  BUILDING:    { label: 'BUILDING',    color: COLORS.signalYellow, bg: 'bg-signal-yellow/15' },
  ESTABLISHED: { label: 'ESTABLISHED', color: COLORS.signalGreen,  bg: 'bg-signal-green/15' },
  FADING:      { label: 'FADING',      color: COLORS.signalOrange, bg: 'bg-signal-orange/15' },
};

const ALIGNMENT_CONFIG = {
  CONFIRMING:  { label: 'CONFIRMING',  color: COLORS.signalGreen,  icon: '✓' },
  THREATENING: { label: 'THREATENING', color: COLORS.signalRed,    icon: '⚠' },
  MIXED:       { label: 'MIXED',       color: COLORS.signalYellow, icon: '◐' },
  OPPORTUNITY: { label: 'OPPORTUNITY', color: COLORS.baldurBlue,   icon: '★' },
  NEUTRAL:     { label: 'NEUTRAL',     color: COLORS.mutedBlue,    icon: '—' },
};

// ── Pre-Mortem Config ─────────────────────────────────────────────
const RISK_CONFIG = {
  HIGH:   { color: COLORS.signalRed,    bg: 'bg-signal-red/15' },
  MEDIUM: { color: COLORS.signalYellow, bg: 'bg-signal-yellow/15' },
  LOW:    { color: COLORS.signalGreen,  bg: 'bg-signal-green/15' },
};

const PROBABILITY_CONFIG = {
  HIGH:   { color: COLORS.signalRed,    bg: 'bg-signal-red/10' },
  MEDIUM: { color: COLORS.signalYellow, bg: 'bg-signal-yellow/10' },
  LOW:    { color: COLORS.mutedBlue,    bg: 'bg-white/5' },
};

const CATEGORY_LABELS = {
  MACRO_REGIME_SHIFT: { short: 'REGIME',    desc: 'Makro-Umfeld dreht gegen Position' },
  NARRATIVE_COLLAPSE: { short: 'NARRATIVE', desc: 'Investment-These erweist sich als falsch' },
  LIQUIDITY_FLOW:     { short: 'FLOW',      desc: 'Positionierung zu crowded / Flows drehen' },
  EXTERNAL_SHOCK:     { short: 'SHOCK',     desc: 'Geopolitik, Policy oder Black Swan' },
  CORRELATION_BREAK:  { short: 'CORR',      desc: 'Historische Korrelationen brechen' },
};

// ── Cadence Anomaly Config ────────────────────────────────────────
const CADENCE_LEVEL_CONFIG = {
  EXTREME:  { color: COLORS.signalRed,    bg: 'bg-signal-red/15' },
  HIGH:     { color: COLORS.signalOrange, bg: 'bg-signal-orange/15' },
  ELEVATED: { color: COLORS.signalYellow, bg: 'bg-signal-yellow/15' },
};

// ── Cross-System Alignment Config ─────────────────────────────────
const CS_ALIGNMENT_CONFIG = {
  CONFIRMING:    { label: 'CONFIRMING',    color: COLORS.signalGreen,  icon: '✅' },
  DIVERGING:     { label: 'DIVERGING',     color: COLORS.signalYellow, icon: '⚠️' },
  CONTRADICTING: { label: 'CONTRADICTING', color: COLORS.signalRed,    icon: '❌' },
};

// ── Info Box Component ────────────────────────────────────────────
function InfoBox({ children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-3">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="text-caption text-muted-blue/60 hover:text-muted-blue transition-colors flex items-center gap-1"
      >
        <span className="text-sm">ℹ️</span>
        <span>{open ? 'Legende ausblenden' : 'Was ist das?'}</span>
      </button>
      {open && (
        <div className="mt-2 rounded-lg bg-white/[0.03] border border-white/8 p-3 text-caption text-muted-blue leading-relaxed">
          {children}
        </div>
      )}
    </div>
  );
}

// ── Section Header with subtitle ──────────────────────────────────
function SectionHeader({ title, subtitle, badge, badgeColor }) {
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between">
        <h2 className="text-section-title text-ice-white">{title}</h2>
        {badge && (
          <span className="text-caption font-medium px-2 py-0.5 rounded"
            style={{ color: badgeColor || COLORS.mutedBlue, backgroundColor: `${badgeColor || COLORS.mutedBlue}20` }}>
            {badge}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="text-caption text-muted-blue/70 mt-0.5">{subtitle}</p>
      )}
    </div>
  );
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
              ⚠ STALE
            </span>
          ) : (
            <>
              <span className="text-data-small font-medium" style={{ color: dir.color }}>
                {dir.arrow} {card.direction || '—'}
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
          {expanded ? '▲ collapse' : '▼ expand'}
        </p>
      </div>

      {/* Expanded View */}
      {expanded && (
        <div className="border-t border-white/5 px-3 pb-3 pt-2">
          {/* Source metadata */}
          <div className="grid grid-cols-2 gap-2 text-caption text-muted-blue mb-2">
            <span>Bias: {card.known_bias > 0 ? '+' : ''}{card.known_bias ?? '—'}</span>
            <span>Intensity: {card.intensity ?? '—'}</span>
            <span>Last: {card.latest_content_date || '—'}</span>
            <span>Claims: {card.active_claims || 0}</span>
          </div>

          {/* Stale detail */}
          {isStale && (
            <div className="rounded-lg bg-signal-orange/10 border border-signal-orange/20 p-2 mb-2">
              <p className="text-caption text-signal-orange">
                ⚠ No new content for {daysSince} days. Claims are carried forward with decay.
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

          {/* All claims with freshness badges */}
          {card.claims && card.claims.length > 0 && (
            <div className="mt-2 space-y-2">
              <span className="text-caption text-muted-blue">All Claims ({card.claims.length}):</span>
              {card.claims.map((c, i) => {
                const fCfg = FRESHNESS_CONFIG[c.freshness] || FRESHNESS_CONFIG.FRESH;
                const cDir = directionArrow(c.direction);
                return (
                  <div key={i} className="rounded-lg bg-white/[0.02] border border-white/5 p-2" style={{ opacity: fCfg.opacity }}>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-caption px-1.5 py-0.5 rounded ${fCfg.bg}`} style={{ color: fCfg.color }}>
                        {fCfg.label}
                      </span>
                      <span className="text-caption" style={{ color: cDir.color }}>
                        {cDir.arrow} {c.direction}
                      </span>
                      <span className="text-caption text-muted-blue">Nov: {c.novelty_score}</span>
                      {c.content_date && (
                        <span className="text-caption text-muted-blue ml-auto">{c.content_date}</span>
                      )}
                    </div>
                    <p className="text-caption text-ice-white/80">&quot;{c.claim_text}&quot;</p>
                    {c.topics && c.topics.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {c.topics.map((t) => (
                          <span key={t} className="text-caption px-1 py-0.5 rounded bg-white/5 text-muted-blue/70" style={{ fontSize: '0.65rem' }}>
                            {t.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Thread Card ───────────────────────────────────────────────────
function ThreadCard({ thread }) {
  const [expanded, setExpanded] = useState(false);
  const status = THREAD_STATUS_CONFIG[thread.status] || THREAD_STATUS_CONFIG.SEED;
  const alignment = ALIGNMENT_CONFIG[thread.portfolio_alignment] || ALIGNMENT_CONFIG.NEUTRAL;
  const dir = directionArrow(thread.direction);
  const conviction = thread.conviction ?? 0;

  const convPct = Math.min(Math.max(conviction * 10, 0), 100);
  const convColor = conviction >= 7 ? COLORS.signalGreen
    : conviction >= 4 ? COLORS.signalYellow
    : COLORS.mutedBlue;

  return (
    <div
      className="rounded-xl border border-white/8 bg-white/[0.03] hover:bg-white/[0.06] transition-colors cursor-pointer"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <p className="text-body font-medium text-ice-white line-clamp-2 flex-1">
            {thread.core_hypothesis || thread.thread_id}
          </p>
          <span className={`text-caption px-1.5 py-0.5 rounded shrink-0 ${status.bg}`} style={{ color: status.color }}>
            {status.label}
          </span>
        </div>

        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span className="text-data-small font-medium" style={{ color: dir.color }}>
            {dir.arrow} {thread.direction || '—'}
          </span>
          <span className="text-caption px-1.5 py-0.5 rounded" style={{
            color: alignment.color,
            backgroundColor: `${alignment.color}15`,
          }}>
            {alignment.icon} {alignment.label}
          </span>
          {thread.challenged && (
            <span className="text-caption px-1.5 py-0.5 rounded bg-signal-red/15 text-signal-red">
              ⚡ CHALLENGED
            </span>
          )}
          <span className="text-caption text-muted-blue ml-auto">
            {thread.source_count || 0} source{(thread.source_count || 0) !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-caption text-muted-blue w-16 shrink-0">Conv:</span>
          <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all"
              style={{ width: `${convPct}%`, backgroundColor: convColor }} />
          </div>
          <span className="text-data-small tabular-nums w-8 text-right" style={{ color: convColor }}>
            {conviction.toFixed(1)}
          </span>
        </div>

        <div className="flex flex-wrap gap-1">
          {(thread.affected_assets || []).slice(0, 6).map((a) => (
            <span key={a} className="text-caption px-1.5 py-0.5 rounded bg-baldur-blue/10 text-baldur-blue">{a}</span>
          ))}
          {(thread.topics || []).slice(0, 3).map((t) => (
            <span key={t} className="text-caption px-1.5 py-0.5 rounded bg-white/5 text-muted-blue">
              {t.replace(/_/g, ' ')}
            </span>
          ))}
        </div>

        {(thread.portfolio_relevance_score > 0 || thread.last_evidence_date) && (
          <div className="flex items-center gap-3 mt-1.5 text-caption text-muted-blue">
            {thread.portfolio_relevance_score > 0 && (
              <span>Relevance: {thread.portfolio_relevance_score.toFixed(1)}</span>
            )}
            {thread.last_evidence_date && (
              <span className="ml-auto">Last evidence: {thread.last_evidence_date}</span>
            )}
          </div>
        )}

        <p className="text-caption text-muted-blue/50 text-right mt-1">
          {expanded ? '▲ collapse' : '▼ details'}
        </p>
      </div>

      {expanded && (
        <div className="border-t border-white/5 px-3 pb-3 pt-2 space-y-2">
          {thread.sources && thread.sources.length > 0 && (
            <div>
              <span className="text-caption text-muted-blue">Sources: </span>
              <span className="text-caption text-ice-white/70">{thread.sources.join(', ')}</span>
            </div>
          )}
          {thread.threatened_positions && thread.threatened_positions.length > 0 && (
            <div className="rounded-lg bg-signal-red/5 border border-signal-red/15 p-2">
              <span className="text-caption text-signal-red font-medium">Threatened Positions: </span>
              <span className="text-caption text-signal-red/80">
                {thread.threatened_positions.map(p => `${p.asset} (${p.weight_pct}%)`).join(', ')}
              </span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2 text-caption text-muted-blue">
            <span>Created: {thread.created_at || '—'}</span>
            <span>Thread ID: {thread.thread_id || '—'}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Pre-Mortem Card ───────────────────────────────────────────────
function PreMortemCard({ pm }) {
  const [expanded, setExpanded] = useState(false);
  const riskCfg = RISK_CONFIG[pm.aggregate_risk] || RISK_CONFIG.LOW;
  const scenarios = pm.failure_scenarios || [];

  return (
    <div
      className="rounded-xl border border-white/8 bg-white/[0.03] hover:bg-white/[0.06] transition-colors cursor-pointer"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="p-3">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span className="text-body font-medium text-ice-white">{pm.asset}</span>
            <span className="text-data-small tabular-nums text-muted-blue">{pm.v16_weight_pct}%</span>
          </div>
          <span className={`text-caption font-medium px-1.5 py-0.5 rounded ${riskCfg.bg}`} style={{ color: riskCfg.color }}>
            RISK: {pm.aggregate_risk}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-1.5">
          {scenarios.map((s, i) => {
            const probCfg = PROBABILITY_CONFIG[s.probability_label] || PROBABILITY_CONFIG.LOW;
            const catLabel = CATEGORY_LABELS[s.failure_category]?.short || s.failure_category;
            return (
              <span key={i} className={`text-caption px-1.5 py-0.5 rounded ${probCfg.bg}`}
                style={{ color: probCfg.color }}>
                {catLabel} ({s.probability_label})
              </span>
            );
          })}
        </div>

        {scenarios[0] && (
          <p className="text-caption text-ice-white/70 line-clamp-2">{scenarios[0].description}</p>
        )}

        {pm.generated_at && (
          <p className="text-caption text-muted-blue/50 mt-1">Generated: {pm.generated_at}</p>
        )}

        <p className="text-caption text-muted-blue/50 text-right mt-1">
          {expanded ? '▲ collapse' : `▼ ${scenarios.length} scenarios`}
        </p>
      </div>

      {expanded && (
        <div className="border-t border-white/5 px-3 pb-3 pt-2 space-y-3">
          {scenarios.map((s, i) => {
            const probCfg = PROBABILITY_CONFIG[s.probability_label] || PROBABILITY_CONFIG.LOW;
            const catInfo = CATEGORY_LABELS[s.failure_category] || { short: '?', desc: '' };
            return (
              <div key={i} className="rounded-lg bg-white/[0.02] border border-white/5 p-2.5">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className={`text-caption font-medium px-1.5 py-0.5 rounded ${probCfg.bg}`}
                    style={{ color: probCfg.color }}>{s.probability_label}</span>
                  <span className="text-caption px-1.5 py-0.5 rounded bg-white/5 text-muted-blue">
                    {catInfo.short}
                  </span>
                  {s.portfolio_impact && (
                    <span className="text-caption text-signal-red ml-auto">{s.portfolio_impact}</span>
                  )}
                </div>
                <p className="text-body text-ice-white mb-1.5">{s.description}</p>
                {s.early_warning_indicator && (
                  <div className="rounded bg-white/[0.03] p-2 mb-1.5">
                    <span className="text-caption text-muted-blue">⚡ Early Warning: </span>
                    <span className="text-caption text-ice-white/70">{s.early_warning_indicator}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// =====================================================================
// MAIN COMPONENT
// =====================================================================
export default function IntelDetail({ dashboard }) {
  const intel = dashboard?.intelligence || {};

  // V1 data
  const consensus = intel.consensus || {};
  const divergences = intel.divergences || [];
  const claims = intel.high_novelty_claims || [];
  const catalysts = intel.catalyst_timeline || [];

  // V2 Phase 1
  const sourceCards = intel.source_cards || [];

  // V2 Phase 2
  const activeThreads = intel.active_threads || [];
  const preMortems = intel.pre_mortems || [];
  const cadenceAnomalies = intel.cadence_anomalies || [];

  // V2 Phase 3
  const beliefState = intel.belief_state || {};
  const beliefShifts = intel.belief_shifts || [];
  const staleBeliefs = intel.stale_beliefs || [];
  const crossSystem = intel.cross_system || [];
  const expertDisagreements = intel.expert_disagreements || [];
  const silenceMap = intel.silence_map || [];
  const intelligenceGaps = intel.intelligence_gaps || [];

  // Source card stats
  const totalSources = sourceCards.length;
  const staleSources = sourceCards.filter(s => s.stale_warning).length;
  const activeSources = totalSources - staleSources;
  const totalClaims = sourceCards.reduce((sum, s) => sum + (s.active_claims || 0), 0);

  // Thread stats
  const threateningThreads = activeThreads.filter(t => t.portfolio_alignment === 'THREATENING');

  // Belief state stats
  const beliefTopics = Object.entries(beliefState);
  const hasBeliefData = beliefTopics.length > 0;

  // Cross-system stats
  const csContradicting = crossSystem.filter(c => c.alignment === 'CONTRADICTING');
  const csDiverging = crossSystem.filter(c => c.alignment === 'DIVERGING');

  // Silence map: only show HIGH priority
  const highPrioritySilence = silenceMap.filter(s => s.priority === 'HIGH');

  // Intelligence gaps: sorted by priority
  const sortedGaps = [...intelligenceGaps].sort((a, b) => {
    const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    return (order[a.priority] ?? 9) - (order[b.priority] ?? 9);
  });

  return (
    <div className="py-4 space-y-4">
      <h1 className="text-page-title text-center lg:text-page-title text-center-desktop">Intelligence Center</h1>

      {/* ── 1. Priority Alerts (Cadence + Threatening Threads + Cross-System Contradictions) ─ */}
      {(cadenceAnomalies.length > 0 || threateningThreads.length > 0 || csContradicting.length > 0) && (
        <div className="glass-card p-4 border-l-4 border-signal-red">
          <SectionHeader
            title="Priority Alerts"
            subtitle="Signale die sofortige Aufmerksamkeit erfordern"
          />

          <div className="space-y-2">
            {/* Cross-System Contradictions as priority alerts */}
            {csContradicting.map((cs, i) => (
              <div key={`cs-${i}`} className="flex items-start gap-2 rounded-lg bg-signal-red/5 border border-signal-red/15 p-2.5">
                <span className="text-body shrink-0">❌</span>
                <div className="flex-1 min-w-0">
                  <span className="text-caption font-medium text-signal-red">IC-DATEN WIDERSPRUCH: </span>
                  <span className="text-caption text-ice-white">{(cs.topic || '').replace(/_/g, ' ')}</span>
                  <p className="text-caption text-muted-blue mt-0.5">
                    IC sagt {cs.ic_direction || '?'} — V16 Daten sagen {cs.v16_direction || '?'}
                  </p>
                </div>
              </div>
            ))}

            {/* Threatening threads */}
            {threateningThreads.map((t) => (
              <div key={t.thread_id} className="flex items-start gap-2 rounded-lg bg-signal-red/5 border border-signal-red/15 p-2.5">
                <span className="text-body shrink-0">⚠️</span>
                <div className="flex-1 min-w-0">
                  <span className="text-caption font-medium text-signal-red">THREATENING THREAD: </span>
                  <span className="text-caption text-ice-white">{(t.core_hypothesis || '').slice(0, 120)}</span>
                  <p className="text-caption text-muted-blue mt-0.5">
                    Conv: {(t.conviction || 0).toFixed(1)} · {t.source_count || 0} sources ·
                    {t.threatened_positions?.map(p => ` ${p.asset} ${p.weight_pct}%`).join(',')}
                  </p>
                </div>
              </div>
            ))}

            {/* Cadence anomalies */}
            {cadenceAnomalies.map((a, i) => {
              const lvl = CADENCE_LEVEL_CONFIG[a.anomaly_level] || CADENCE_LEVEL_CONFIG.ELEVATED;
              return (
                <div key={i} className="flex items-start gap-2 rounded-lg bg-white/[0.03] border border-white/8 p-2.5">
                  <span className="text-body shrink-0">📢</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-caption font-medium" style={{ color: lvl.color }}>
                      CADENCE {a.anomaly_level}:
                    </span>
                    <span className="text-caption text-ice-white ml-1">
                      {a.source_name || a.source_id}
                    </span>
                    <p className="text-caption text-muted-blue mt-0.5">
                      {a.actual_posts_7d} posts in 7d (normal: {a.baseline_posts_week}/w, {a.cadence_ratio}x)
                      {a.topics?.length > 0 && ` · ${a.topics.slice(0, 3).map(t => t.replace(/_/g, ' ')).join(', ')}`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 2. Belief State Dashboard (Phase 3) ──────────────────── */}
      <div className="glass-card p-4">
        <SectionHeader
          title="Belief State"
          subtitle="Kumulatives Weltbild des Systems — Score 0-10, über 5 = bullish, unter 5 = bearish"
          badge={hasBeliefData ? `${beliefTopics.length} Topics` : null}
          badgeColor={COLORS.baldurBlue}
        />

        <InfoBox>
          <p><strong>Belief Score</strong> ist ein Bayesian-gewichteter Durchschnitt aller IC-Quellen. Jede neue These verschiebt den Score inkrementell. Ältere Evidenz decayed langsam Richtung neutral (5.0).</p>
          <p className="mt-1"><strong>Confidence</strong> zeigt wie einig sich die Quellen sind. HIGH = wenig Widerspruch. LOW = starke Gegenargumente vorhanden.</p>
          <p className="mt-1"><strong>Stale</strong> (orange) = keine neue Evidenz seit 7+ Tagen bei niedriger Confidence — Belief wird unsicherer.</p>
        </InfoBox>

        {hasBeliefData ? (
          <div className="space-y-1.5">
            {/* Sort: biggest deviation from neutral first */}
            {beliefTopics
              .sort((a, b) => Math.abs(b[1].belief - 5.0) - Math.abs(a[1].belief - 5.0))
              .map(([topic, b]) => {
                const score = b.belief ?? 5.0;
                const unc = b.uncertainty ?? 0.5;
                const conf = confidenceLabel(unc);
                const bColor = beliefColor(score);
                const bLabel = beliefLabel(score);
                const isStale = b.stale_warning === true;
                // Bar: 0-10 scale mapped to 0-100%, neutral at 50%
                const barPct = (score / 10) * 100;

                return (
                  <div key={topic} className={`rounded-lg p-2.5 ${isStale ? 'bg-signal-orange/5 border border-signal-orange/15' : 'bg-white/[0.03] border border-white/5'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      {/* Topic name */}
                      <span className="text-caption text-ice-white font-medium w-28 shrink-0 truncate">
                        {topic.replace(/_/g, ' ')}
                      </span>
                      {/* Score + direction label */}
                      <span className="text-data-small tabular-nums font-medium w-8 text-right" style={{ color: bColor }}>
                        {score.toFixed(1)}
                      </span>
                      <span className="text-caption font-medium w-24" style={{ color: bColor }}>
                        {bLabel}
                      </span>
                      {/* Confidence badge */}
                      <span className="text-caption px-1.5 py-0.5 rounded ml-auto"
                        style={{ color: conf.color, backgroundColor: `${conf.color}15` }}>
                        Conf: {conf.label}
                      </span>
                      {/* Stale warning */}
                      {isStale && (
                        <span className="text-caption text-signal-orange">⚠ STALE</span>
                      )}
                    </div>
                    {/* Visual bar: neutral line at 50% */}
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden relative">
                      <div className="absolute top-0 h-full w-px bg-white/20" style={{ left: '50%' }} />
                      {score >= 5.0 ? (
                        <div className="absolute top-0 h-full rounded-full"
                          style={{ left: '50%', width: `${barPct - 50}%`, backgroundColor: bColor, opacity: 0.6 }} />
                      ) : (
                        <div className="absolute top-0 h-full rounded-full"
                          style={{ right: '50%', width: `${50 - barPct}%`, backgroundColor: bColor, opacity: 0.6 }} />
                      )}
                    </div>
                    {/* Evidence count */}
                    <div className="flex items-center gap-3 mt-1 text-caption text-muted-blue/60">
                      <span>{b.evidence_count || 0} evidence total</span>
                      {b.last_evidence_date && <span>Last: {b.last_evidence_date}</span>}
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <p className="text-caption text-muted-blue/60 italic">
            Belief State wird nach dem nächsten IC-Run mit Phase 3 verfügbar sein.
          </p>
        )}

        {/* Belief shifts (if any) */}
        {beliefShifts.length > 0 && (
          <div className="mt-3 rounded-lg bg-baldur-blue/5 border border-baldur-blue/15 p-2.5">
            <p className="text-caption font-medium text-baldur-blue mb-1">Signifikante Belief Shifts (letzte 24h):</p>
            {beliefShifts.map((s, i) => (
              <p key={i} className="text-caption text-ice-white/80">
                <span className="font-medium">{(s.topic || '').replace(/_/g, ' ')}</span>
                {' '}{s.old_belief?.toFixed(1)} → {s.new_belief?.toFixed(1)}
                {' '}({s.magnitude > 0 ? '+' : ''}{s.magnitude?.toFixed(1)})
                {s.cause && <span className="text-muted-blue"> — {s.cause}</span>}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* ── 3. Cross-System Confirmation (Phase 3) ───────────────── */}
      {crossSystem.length > 0 && (
        <div className="glass-card p-4">
          <SectionHeader
            title="Cross-System Check"
            subtitle="Stimmen IC-Quellen (qualitativ) und V16-Daten (quantitativ) überein?"
            badge={csContradicting.length > 0 ? `${csContradicting.length} CONTRADICTING` : csDiverging.length > 0 ? `${csDiverging.length} DIVERGING` : 'ALL ALIGNED'}
            badgeColor={csContradicting.length > 0 ? COLORS.signalRed : csDiverging.length > 0 ? COLORS.signalYellow : COLORS.signalGreen}
          />

          <InfoBox>
            <p><strong>CONFIRMING</strong> = IC-Quellen und V16-Daten zeigen in dieselbe Richtung. Hohe Konfidenz.</p>
            <p className="mt-1"><strong>DIVERGING</strong> = Einer neutral, der andere hat Richtung. Beobachten — einer wird sich anpassen.</p>
            <p className="mt-1"><strong>CONTRADICTING</strong> = IC und Daten zeigen in entgegengesetzte Richtungen. Einer ist falsch — kritisch prüfen.</p>
          </InfoBox>

          <div className="space-y-1">
            {/* Sort: CONTRADICTING first, then DIVERGING, then CONFIRMING */}
            {[...crossSystem]
              .sort((a, b) => {
                const order = { CONTRADICTING: 0, DIVERGING: 1, CONFIRMING: 2 };
                return (order[a.alignment] ?? 9) - (order[b.alignment] ?? 9);
              })
              .map((cs, i) => {
                const cfg = CS_ALIGNMENT_CONFIG[cs.alignment] || CS_ALIGNMENT_CONFIG.CONFIRMING;
                const icDir = directionArrow(cs.ic_direction);
                const v16Dir = directionArrow(cs.v16_direction);
                return (
                  <div key={i} className="flex items-center gap-2 rounded-lg bg-white/[0.02] border border-white/5 p-2">
                    <span className="text-sm shrink-0">{cfg.icon}</span>
                    <span className="text-caption text-ice-white font-medium w-28 shrink-0 truncate">
                      {(cs.topic || '').replace(/_/g, ' ')}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-caption text-muted-blue">IC:</span>
                      <span className="text-caption" style={{ color: icDir.color }}>{icDir.arrow} {cs.ic_direction || '—'}</span>
                    </div>
                    <span className="text-caption text-muted-blue/40">vs</span>
                    <div className="flex items-center gap-1">
                      <span className="text-caption text-muted-blue">V16:</span>
                      <span className="text-caption" style={{ color: v16Dir.color }}>{v16Dir.arrow} {cs.v16_direction || '—'}</span>
                    </div>
                    <span className="text-caption font-medium ml-auto" style={{ color: cfg.color }}>
                      {cfg.label}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ── 4. Expert Disagreements (Phase 3) ────────────────────── */}
      <div className="glass-card p-4">
        <SectionHeader
          title="Expert Disagreements"
          subtitle="Hochrangige Experten die sich zum selben Thema widersprechen"
          badge={expertDisagreements.length > 0 ? `${expertDisagreements.length} aktiv` : null}
          badgeColor={COLORS.signalYellow}
        />

        <InfoBox>
          <p>Ein Disagreement entsteht wenn zwei Quellen mit <strong>Expertise ≥ 6</strong> im selben Topic entgegengesetzte Richtungen vertreten. Nur echte Inter-Source-Dissense — keine Quelle gegen sich selbst.</p>
          <p className="mt-1"><strong>Portfolio Exposure</strong> zeigt wie stark das Portfolio vom Ausgang betroffen ist. HIGH = über 20% Gewicht in betroffenen Assets.</p>
          <p className="mt-1"><strong>Second Derivative</strong> zeigt ob eine Seite ihre Conviction ändert — oft ein Frühindikator für die Auflösung.</p>
        </InfoBox>

        {expertDisagreements.length > 0 ? (
          <div className="space-y-3">
            {expertDisagreements.map((d, i) => {
              const exposureCfg = { HIGH: COLORS.signalRed, MEDIUM: COLORS.signalYellow, LOW: COLORS.mutedBlue, NONE: COLORS.fadedBlue };
              const expColor = exposureCfg[d.portfolio_exposure] || COLORS.fadedBlue;
              return (
                <div key={i} className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
                  {/* Topic + Exposure */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-body">⚔️</span>
                      <span className="text-body font-medium text-ice-white">
                        {(d.topic || '').replace(/_/g, ' ')}
                      </span>
                    </div>
                    <span className="text-caption px-1.5 py-0.5 rounded"
                      style={{ color: expColor, backgroundColor: `${expColor}15` }}>
                      Exposure: {d.portfolio_exposure || 'NONE'}
                    </span>
                  </div>

                  {/* Side A vs Side B */}
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    {/* Bullish side */}
                    <div className="rounded-lg bg-signal-green/5 border border-signal-green/15 p-2">
                      <p className="text-caption text-signal-green font-medium mb-0.5">
                        ▲ BULLISH — {d.side_a?.source_id || '?'}
                      </p>
                      <p className="text-caption text-muted-blue">
                        Expertise: {d.side_a?.expertise || '?'}/10 · Intensity: {d.side_a?.intensity || '?'}
                      </p>
                      {d.side_a?.conviction_trend && d.side_a.conviction_trend !== 'STABLE' && (
                        <p className="text-caption mt-0.5" style={{
                          color: d.side_a.conviction_trend === 'RISING' ? COLORS.signalGreen : COLORS.signalOrange
                        }}>
                          Conviction: {d.side_a.conviction_trend}
                        </p>
                      )}
                      {d.side_a?.claim_text && (
                        <p className="text-caption text-ice-white/60 mt-1 line-clamp-2">&quot;{d.side_a.claim_text}&quot;</p>
                      )}
                    </div>

                    {/* Bearish side */}
                    <div className="rounded-lg bg-signal-red/5 border border-signal-red/15 p-2">
                      <p className="text-caption text-signal-red font-medium mb-0.5">
                        ▼ BEARISH — {d.side_b?.source_id || '?'}
                      </p>
                      <p className="text-caption text-muted-blue">
                        Expertise: {d.side_b?.expertise || '?'}/10 · Intensity: {d.side_b?.intensity || '?'}
                      </p>
                      {d.side_b?.conviction_trend && d.side_b.conviction_trend !== 'STABLE' && (
                        <p className="text-caption mt-0.5" style={{
                          color: d.side_b.conviction_trend === 'RISING' ? COLORS.signalGreen : COLORS.signalOrange
                        }}>
                          Conviction: {d.side_b.conviction_trend}
                        </p>
                      )}
                      {d.side_b?.claim_text && (
                        <p className="text-caption text-ice-white/60 mt-1 line-clamp-2">&quot;{d.side_b.claim_text}&quot;</p>
                      )}
                    </div>
                  </div>

                  {/* Second derivative signal */}
                  {d.second_derivative_signal && (
                    <p className="text-caption text-baldur-blue italic">
                      📊 {d.second_derivative_signal}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-caption text-muted-blue/60 italic">
            Keine aktiven Expert-Disagreements — alle hochrangigen Quellen sind sich derzeit einig.
          </p>
        )}
      </div>

      {/* ── 5. Narrative Threads (Phase 2) ───────────────────────── */}
      {activeThreads.length > 0 && (
        <div className="glass-card p-4">
          <SectionHeader
            title="Narrative Threads"
            subtitle="Thesen die sich über mehrere Quellen und Zeit aufbauen — sortiert nach Portfolio-Relevanz"
            badge={`${activeThreads.length} active`}
            badgeColor={COLORS.baldurBlue}
          />

          <InfoBox>
            <p><strong>Status:</strong> SEED (1 Quelle) → BUILDING (2+ Quellen) → ESTABLISHED (3+ unabhängige Quellen) → FADING (keine neue Evidenz)</p>
            <p className="mt-1"><strong>Conviction (0-10):</strong> Gewichteter Score aus Expertise (35%), Source Diversity (20%), Datenbestätigung (20%), Frische (15%), Trend (10%)</p>
            <p className="mt-1"><strong>Alignment:</strong> <span style={{ color: COLORS.signalGreen }}>CONFIRMING</span> = stützt Position · <span style={{ color: COLORS.signalRed }}>THREATENING</span> = gefährdet Position · <span style={{ color: COLORS.signalYellow }}>MIXED</span> = ambivalent · <span style={{ color: COLORS.baldurBlue }}>OPPORTUNITY</span> = nicht im Portfolio</p>
            <p className="mt-1"><strong>⚡ CHALLENGED:</strong> Eine Quelle mit Expertise ≥ 6 argumentiert gegen den Thread.</p>
          </InfoBox>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {activeThreads.map((t) => (
              <ThreadCard key={t.thread_id} thread={t} />
            ))}
          </div>
        </div>
      )}

      {/* ── 6. Position Pre-Mortems (Phase 2) ────────────────────── */}
      {preMortems.length > 0 && (
        <div className="glass-card p-4">
          <SectionHeader
            title="Position Pre-Mortems"
            subtitle="Wie könnten aktuelle Positionen (>10% Gewicht) scheitern? 2-4 Failure-Szenarien pro Position"
          />

          <InfoBox>
            <p><strong>Aggregate Risk:</strong> <span style={{ color: COLORS.signalRed }}>HIGH</span> = mindestens 1 Szenario mit hoher Wahrscheinlichkeit · <span style={{ color: COLORS.signalYellow }}>MEDIUM</span> = mittlere Wahrscheinlichkeit · <span style={{ color: COLORS.signalGreen }}>LOW</span> = alle niedrig</p>
            <p className="mt-1"><strong>Kategorien:</strong> REGIME = Makro-Umfeld dreht · NARRATIVE = These falsch · FLOW = Positionierung/Flows · SHOCK = Geopolitik/Black Swan · CORR = Korrelation bricht</p>
            <p className="mt-1"><strong>⚡ Early Warning:</strong> Konkretes, beobachtbares Signal das anzeigt dass dieses Szenario eintritt.</p>
          </InfoBox>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {preMortems.map((pm) => (
              <PreMortemCard key={pm.asset} pm={pm} />
            ))}
          </div>
        </div>
      )}

      {/* ── 7. Source Cards (Phase 1) ────────────────────────────── */}
      {sourceCards.length > 0 && (
        <div className="glass-card p-4">
          <SectionHeader
            title="Source Cards"
            subtitle="Alle IC-Quellen mit aktuellem Status, Claims und Freshness"
            badge={staleSources > 0 ? `${staleSources} stale` : null}
            badgeColor={staleSources > 0 ? COLORS.signalOrange : null}
          />

          <div className="flex items-center gap-3 text-caption mb-3">
            <span className="text-signal-green">{activeSources} active</span>
            {staleSources > 0 && <span className="text-signal-orange">{staleSources} stale</span>}
            <span className="text-muted-blue">{totalClaims} claims total</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sourceCards.map((card) => (
              <SourceCard key={card.source_id} card={card} />
            ))}
          </div>
        </div>
      )}

      {/* ── 8. Intelligence Gaps (Phase 3) ───────────────────────── */}
      <div className="glass-card p-4">
        <SectionHeader
          title="Intelligence Gaps"
          subtitle="Offene Fragen die das System automatisch aus Beliefs, Disagreements und Pre-Mortems generiert"
          badge={sortedGaps.filter(g => g.priority === 'HIGH').length > 0
            ? `${sortedGaps.filter(g => g.priority === 'HIGH').length} HIGH`
            : null}
          badgeColor={COLORS.signalRed}
        />

        <InfoBox>
          <p>Intelligence Gaps entstehen automatisch wenn das System Wissenslücken erkennt: Expert-Dissense ohne Auflösung, Pre-Mortem-Szenarien ohne Gegenargument, Topics ohne Coverage bei Portfolio-Relevanz, oder Beliefs die veralten.</p>
          <p className="mt-1"><strong>Assigned Sources</strong> sind die Quellen mit der höchsten Expertise für diese Frage — sobald sie sich äußern, wird der Gap geschlossen.</p>
        </InfoBox>

        {sortedGaps.length > 0 ? (
          <div className="space-y-2">
            {sortedGaps.map((gap, i) => {
              const priColor = gap.priority === 'HIGH' ? COLORS.signalRed
                : gap.priority === 'MEDIUM' ? COLORS.signalYellow : COLORS.mutedBlue;
              return (
                <div key={i} className="rounded-lg bg-white/[0.03] border border-white/5 p-2.5">
                  <div className="flex items-start gap-2">
                    <span className="text-caption font-medium px-1.5 py-0.5 rounded shrink-0"
                      style={{ color: priColor, backgroundColor: `${priColor}15` }}>
                      {gap.priority || 'LOW'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-caption text-ice-white">{gap.question || gap.gap_id || '?'}</p>
                      <div className="flex items-center gap-2 mt-1 text-caption text-muted-blue/60 flex-wrap">
                        {gap.generated_by && (
                          <span>Quelle: {gap.generated_by}</span>
                        )}
                        {gap.topics && gap.topics.length > 0 && (
                          <span>· {gap.topics.map(t => t.replace(/_/g, ' ')).join(', ')}</span>
                        )}
                      </div>
                      {gap.assigned_sources && gap.assigned_sources.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {gap.assigned_sources.map((s, j) => (
                            <span key={j} className="text-caption px-1.5 py-0.5 rounded bg-white/5 text-muted-blue">
                              {s.source_id} ({s.expertise}/10)
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-caption text-muted-blue/60 italic">
            Keine offenen Intelligence Gaps — alle kritischen Fragen sind beantwortet oder haben ausreichend Coverage.
          </p>
        )}
      </div>

      {/* ── 9. Silence Map (Phase 3) ─────────────────────────────── */}
      <div className="glass-card p-4">
        <SectionHeader
          title="Silence Map"
          subtitle="Portfolio-relevante Themen über die keine IC-Quelle spricht — blinde Flecken"
          badge={highPrioritySilence.length > 0 ? `${highPrioritySilence.length} blind spots` : null}
          badgeColor={highPrioritySilence.length > 0 ? COLORS.signalOrange : null}
        />

        <InfoBox>
          <p>Die Silence Map prüft ob alle für das Portfolio relevanten Themen von IC-Quellen abgedeckt werden.</p>
          <p className="mt-1"><strong>SILENT</strong> = keine einzige Quelle hat Claims zu diesem Thema. <strong>FADING COVERAGE</strong> = nur noch alte Claims vorhanden. <strong>COVERAGE LOST</strong> = hatte Coverage, jetzt alle archiviert.</p>
          <p className="mt-1">Stille bei Portfolio-relevanten Themen ist ein Warnsignal — entweder wissen die Quellen nichts (schlecht) oder der Markt bewegt sich ohne narratives Fundament (fragil).</p>
        </InfoBox>

        {silenceMap.length > 0 ? (
          <div className="space-y-2">
            {silenceMap.map((s, i) => {
              const isHigh = s.priority === 'HIGH';
              return (
                <div key={i} className={`rounded-lg p-2.5 ${isHigh ? 'bg-signal-orange/5 border border-signal-orange/15' : 'bg-white/[0.03] border border-white/5'}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-body shrink-0">🔇</span>
                    <span className="text-caption font-medium text-ice-white">
                      {(s.topic || '').replace(/_/g, ' ')}
                    </span>
                    <span className="text-caption px-1.5 py-0.5 rounded"
                      style={{
                        color: isHigh ? COLORS.signalOrange : COLORS.mutedBlue,
                        backgroundColor: isHigh ? `${COLORS.signalOrange}15` : 'rgba(255,255,255,0.05)',
                      }}>
                      {s.silence_type || 'SILENT'}
                    </span>
                    {isHigh && (
                      <span className="text-caption text-signal-orange font-medium ml-auto">HIGH</span>
                    )}
                  </div>
                  {s.portfolio_assets && s.portfolio_assets.length > 0 && (
                    <p className="text-caption text-muted-blue mt-1">
                      Portfolio-Assets: {s.portfolio_assets.join(', ')}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-caption text-muted-blue/60 italic">
            Keine Coverage-Lücken erkannt — alle Portfolio-relevanten Themen werden von IC-Quellen abgedeckt.
          </p>
        )}
      </div>

      {/* ── 10. IC Konsens (V1 — beibehalten) ────────────────────── */}
      {Object.keys(consensus).length > 0 && (
        <div className="glass-card p-4">
          <SectionHeader
            title="IC Konsens"
            subtitle="Gewichteter Konsens aller Quellen pro Thema — positiv = bullish, negativ = bearish"
          />
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

      {/* ── 11. Divergenzen (V1 — beibehalten) ───────────────────── */}
      {divergences.length > 0 && (
        <div className="glass-card p-4">
          <SectionHeader
            title="Divergenzen"
            subtitle="Wo IC-Quellen und quantitative Daten in unterschiedliche Richtungen zeigen"
            badge={`${divergences.length}`}
            badgeColor={COLORS.signalYellow}
          />
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

      {/* ── 12. High Novelty Claims (V1 + Freshness Badges) ──────── */}
      {claims.length > 0 && (
        <div className="glass-card p-4">
          <SectionHeader
            title="High Novelty Claims"
            subtitle="Claims mit überdurchschnittlicher Neuigkeit — sortiert nach Novelty-Score"
          />
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

      {/* ── 13. Catalyst Timeline (V1 — beibehalten) ────────────── */}
      {catalysts.length > 0 && (
        <div className="glass-card p-4">
          <SectionHeader
            title="Catalyst Timeline"
            subtitle="Bevorstehende Events die Markt-Impact haben könnten"
          />
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
