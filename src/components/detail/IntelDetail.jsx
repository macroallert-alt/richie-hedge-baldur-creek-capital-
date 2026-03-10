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

  // Conviction bar width (0-10 scale -> 0-100%)
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
        {/* Row 1: Hypothesis + Status */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <p className="text-body font-medium text-ice-white line-clamp-2 flex-1">
            {thread.core_hypothesis || thread.thread_id}
          </p>
          <span className={`text-caption px-1.5 py-0.5 rounded shrink-0 ${status.bg}`} style={{ color: status.color }}>
            {status.label}
          </span>
        </div>

        {/* Row 2: Direction + Alignment + Sources */}
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

        {/* Row 3: Conviction bar */}
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-caption text-muted-blue w-16 shrink-0">Conv:</span>
          <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${convPct}%`, backgroundColor: convColor }}
            />
          </div>
          <span className="text-data-small tabular-nums w-8 text-right" style={{ color: convColor }}>
            {conviction.toFixed(1)}
          </span>
        </div>

        {/* Row 4: Assets + Topics */}
        <div className="flex flex-wrap gap-1">
          {(thread.affected_assets || []).slice(0, 6).map((a) => (
            <span key={a} className="text-caption px-1.5 py-0.5 rounded bg-baldur-blue/10 text-baldur-blue">
              {a}
            </span>
          ))}
          {(thread.topics || []).slice(0, 3).map((t) => (
            <span key={t} className="text-caption px-1.5 py-0.5 rounded bg-white/5 text-muted-blue">
              {t.replace(/_/g, ' ')}
            </span>
          ))}
        </div>

        {/* Row 5: Portfolio relevance + date */}
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

        {/* Expand indicator */}
        <p className="text-caption text-muted-blue/50 text-right mt-1">
          {expanded ? '▲ collapse' : '▼ details'}
        </p>
      </div>

      {/* Expanded: Threatened positions + sources */}
      {expanded && (
        <div className="border-t border-white/5 px-3 pb-3 pt-2 space-y-2">
          {/* Sources list */}
          {thread.sources && thread.sources.length > 0 && (
            <div>
              <span className="text-caption text-muted-blue">Sources: </span>
              <span className="text-caption text-ice-white/70">
                {thread.sources.join(', ')}
              </span>
            </div>
          )}

          {/* Threatened positions */}
          {thread.threatened_positions && thread.threatened_positions.length > 0 && (
            <div className="rounded-lg bg-signal-red/5 border border-signal-red/15 p-2">
              <span className="text-caption text-signal-red font-medium">Threatened Positions: </span>
              <span className="text-caption text-signal-red/80">
                {thread.threatened_positions.map(p =>
                  `${p.asset} (${p.weight_pct}%)`
                ).join(', ')}
              </span>
            </div>
          )}

          {/* Thread metadata */}
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
        {/* Row 1: Asset + Weight + Aggregate Risk */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span className="text-body font-medium text-ice-white">{pm.asset}</span>
            <span className="text-data-small tabular-nums text-muted-blue">{pm.v16_weight_pct}%</span>
          </div>
          <span className={`text-caption font-medium px-1.5 py-0.5 rounded ${riskCfg.bg}`} style={{ color: riskCfg.color }}>
            RISK: {pm.aggregate_risk}
          </span>
        </div>

        {/* Row 2: Scenario summary pills */}
        <div className="flex flex-wrap gap-1.5 mb-1.5">
          {scenarios.map((s, i) => {
            const probCfg = PROBABILITY_CONFIG[s.probability_label] || PROBABILITY_CONFIG.LOW;
            const catLabel = CATEGORY_LABELS[s.failure_category]?.short || s.failure_category;
            return (
              <span
                key={i}
                className={`text-caption px-1.5 py-0.5 rounded ${probCfg.bg}`}
                style={{ color: probCfg.color }}
              >
                {catLabel} ({s.probability_label})
              </span>
            );
          })}
        </div>

        {/* Row 3: Top scenario description */}
        {scenarios[0] && (
          <p className="text-caption text-ice-white/70 line-clamp-2">
            {scenarios[0].description}
          </p>
        )}

        {/* Generated date */}
        {pm.generated_at && (
          <p className="text-caption text-muted-blue/50 mt-1">
            Generated: {pm.generated_at}
          </p>
        )}

        <p className="text-caption text-muted-blue/50 text-right mt-1">
          {expanded ? '▲ collapse' : `▼ ${scenarios.length} scenarios`}
        </p>
      </div>

      {/* Expanded: All scenarios */}
      {expanded && (
        <div className="border-t border-white/5 px-3 pb-3 pt-2 space-y-3">
          {scenarios.map((s, i) => {
            const probCfg = PROBABILITY_CONFIG[s.probability_label] || PROBABILITY_CONFIG.LOW;
            const catInfo = CATEGORY_LABELS[s.failure_category] || { short: '?', desc: '' };
            return (
              <div key={i} className="rounded-lg bg-white/[0.02] border border-white/5 p-2.5">
                {/* Scenario header */}
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className={`text-caption font-medium px-1.5 py-0.5 rounded ${probCfg.bg}`}
                    style={{ color: probCfg.color }}>
                    {s.probability_label}
                  </span>
                  <span className="text-caption px-1.5 py-0.5 rounded bg-white/5 text-muted-blue">
                    {catInfo.short}
                  </span>
                  {s.portfolio_impact && (
                    <span className="text-caption text-signal-red ml-auto">{s.portfolio_impact}</span>
                  )}
                </div>

                {/* Description */}
                <p className="text-body text-ice-white mb-1.5">{s.description}</p>

                {/* Early warning */}
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

// ── Main Component ─────────────────────────────────────────────────
export default function IntelDetail({ dashboard }) {
  const intel = dashboard?.intelligence || {};
  const consensus = intel.consensus || {};
  const divergences = intel.divergences || [];
  const claims = intel.high_novelty_claims || [];
  const catalysts = intel.catalyst_timeline || [];
  const sourceCards = intel.source_cards || [];
  const activeThreads = intel.active_threads || [];
  const preMortems = intel.pre_mortems || [];
  const cadenceAnomalies = intel.cadence_anomalies || [];

  // Source card stats for summary
  const totalSources = sourceCards.length;
  const staleSources = sourceCards.filter(s => s.stale_warning).length;
  const activeSources = totalSources - staleSources;
  const totalClaims = sourceCards.reduce((sum, s) => sum + (s.active_claims || 0), 0);

  // Thread stats
  const threateningThreads = activeThreads.filter(t => t.portfolio_alignment === 'THREATENING');

  return (
    <div className="py-4 space-y-4">
      <h1 className="text-page-title text-center lg:text-page-title text-center-desktop">Intelligence Center</h1>

      {/* ── Priority Alerts (Cadence Anomalies + Threatening Threads) ─ */}
      {(cadenceAnomalies.length > 0 || threateningThreads.length > 0) && (
        <div className="glass-card p-4">
          <h2 className="text-section-title text-ice-white mb-2">Priority Alerts</h2>
          <div className="space-y-2">
            {/* Threatening threads */}
            {threateningThreads.map((t) => (
              <div key={t.thread_id} className="flex items-start gap-2 rounded-lg bg-signal-red/5 border border-signal-red/15 p-2">
                <span className="text-caption text-signal-red shrink-0 mt-0.5">⚠</span>
                <div>
                  <p className="text-caption text-signal-red font-medium">
                    THREATENING: {t.core_hypothesis?.slice(0, 100)}
                  </p>
                  <p className="text-caption text-muted-blue">
                    Conv: {t.conviction?.toFixed(1)} · {t.source_count} sources ·
                    {(t.threatened_positions || []).map(p => ` ${p.asset} ${p.weight_pct}%`).join(',')}
                  </p>
                </div>
              </div>
            ))}

            {/* Cadence anomalies */}
            {cadenceAnomalies.map((a, i) => {
              const cfg = CADENCE_LEVEL_CONFIG[a.anomaly_level] || CADENCE_LEVEL_CONFIG.ELEVATED;
              return (
                <div key={i} className={`flex items-start gap-2 rounded-lg p-2 ${cfg.bg} border`}
                  style={{ borderColor: `${cfg.color}30` }}>
                  <span className="text-caption shrink-0 mt-0.5" style={{ color: cfg.color }}>📢</span>
                  <div>
                    <p className="text-caption font-medium" style={{ color: cfg.color }}>
                      CADENCE {a.anomaly_level}: {a.source_name}
                    </p>
                    <p className="text-caption text-muted-blue">
                      {a.actual_posts_7d} posts in 7d (baseline {a.baseline_posts_week}/week, {a.cadence_ratio}x)
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <InfoBox>
            <p><strong>Priority Alerts</strong> zeigen ungewöhnliche Aktivität die Aufmerksamkeit erfordert.</p>
            <p className="mt-1"><span style={{ color: COLORS.signalRed }}>⚠ THREATENING</span> — Ein Narrativ-Thread gefährdet eine aktuelle Portfolio-Position.</p>
            <p className="mt-1"><span style={{ color: COLORS.signalOrange }}>📢 CADENCE</span> — Eine Quelle publiziert deutlich häufiger als normal. ELEVATED = 1.5x, HIGH = 2x, EXTREME = 3x der Baseline.</p>
          </InfoBox>
        </div>
      )}

      {/* ── Narrative Threads (V2 Phase 2) ─────────────────────── */}
      {activeThreads.length > 0 && (
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-section-title text-ice-white">
              Narrative Threads ({activeThreads.length})
            </h2>
          </div>

          <InfoBox>
            <p><strong>Threads</strong> verfolgen Investment-Thesen die sich über mehrere Quellen und Zeit aufbauen.</p>
            <p className="mt-1"><strong>Status:</strong> <span style={{ color: COLORS.mutedBlue }}>SEED</span> (1 Quelle) → <span style={{ color: COLORS.signalYellow }}>BUILDING</span> (2+ Quellen) → <span style={{ color: COLORS.signalGreen }}>ESTABLISHED</span> (3+ bestätigt) → <span style={{ color: COLORS.signalOrange }}>FADING</span> (keine neue Evidenz)</p>
            <p className="mt-1"><strong>Conviction (0-10):</strong> Gewichtete Expertise der stärksten Quelle (35%), Quellendiversität (20%), Datenbestätigung (20%), Frische (15%), Trend (10%).</p>
            <p className="mt-1"><strong>Alignment:</strong> <span style={{ color: COLORS.signalGreen }}>✓ CONFIRMING</span> = unterstützt Position · <span style={{ color: COLORS.signalRed }}>⚠ THREATENING</span> = gefährdet Position · <span style={{ color: COLORS.baldurBlue }}>★ OPPORTUNITY</span> = nicht im Portfolio · <span style={{ color: COLORS.signalYellow }}>◐ MIXED</span> = beides</p>
            <p className="mt-1"><span style={{ color: COLORS.signalRed }}>⚡ CHALLENGED</span> = Ein Experte widerspricht der Thread-Richtung.</p>
          </InfoBox>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {activeThreads.map((thread) => (
              <ThreadCard key={thread.thread_id} thread={thread} />
            ))}
          </div>
        </div>
      )}

      {/* ── Position Pre-Mortems (V2 Phase 2) ──────────────────── */}
      {preMortems.length > 0 && (
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-section-title text-ice-white">
              Position Pre-Mortems ({preMortems.length})
            </h2>
          </div>

          <InfoBox>
            <p><strong>Pre-Mortems</strong> identifizieren wie aktuelle Portfolio-Positionen (&gt;10% Gewicht) scheitern könnten. Jede Position hat 2-4 Failure-Szenarien.</p>
            <p className="mt-1"><strong>Aggregate Risk:</strong> <span style={{ color: COLORS.signalRed }}>HIGH</span> = mindestens 1 Szenario mit hoher Wahrscheinlichkeit · <span style={{ color: COLORS.signalYellow }}>MEDIUM</span> = mittlere Wahrscheinlichkeit · <span style={{ color: COLORS.signalGreen }}>LOW</span> = alle niedrig</p>
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

      {/* ── Source Cards (V2 Phase 1) ─────────────────────────── */}
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

      {/* ── IC Konsens (V1 — beibehalten) ────────────────────── */}
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

      {/* ── Divergenzen (V1 — beibehalten) ───────────────────── */}
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

      {/* ── Catalyst Timeline (V1 — beibehalten) ────────────── */}
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
