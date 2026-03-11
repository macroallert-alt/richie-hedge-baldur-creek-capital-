'use client';

import { useState } from 'react';
import GlassCard from '@/components/shared/GlassCard';
import { COLORS } from '@/lib/constants';

// ===== HELPERS =====

function zoneColor(zone) {
  if (zone === 'CALM') return COLORS.signalGreen;
  if (zone === 'ELEVATED') return COLORS.signalYellow;
  if (zone === 'STRESS') return COLORS.signalOrange;
  if (zone === 'PANIC') return COLORS.signalRed;
  return COLORS.mutedBlue;
}

function velArrow(vel) {
  if (vel == null || vel === 0) return '→';
  return vel > 0 ? '▲' : '▼';
}

function velColor(vel) {
  if (vel == null || vel === 0) return COLORS.mutedBlue;
  return vel > 0 ? COLORS.signalGreen : COLORS.signalRed;
}

function heatmapColor(severity) {
  if (severity === 'DIREKT') return COLORS.signalRed;
  if (severity === 'INDIREKT') return COLORS.signalYellow;
  if (severity === 'SAFE_HAVEN') return COLORS.signalYellow;
  if (severity === 'MINIMAL') return COLORS.signalGreen;
  return COLORS.mutedBlue;
}

function heatmapEmoji(severity) {
  if (severity === 'DIREKT') return '🔴';
  if (severity === 'INDIREKT') return '🟡';
  if (severity === 'SAFE_HAVEN') return '🟡';
  if (severity === 'MINIMAL') return '🟢';
  return '⚪';
}

// ===== SECTION COMPONENT =====

function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-2 border-b border-white/10"
      >
        <span className="text-label uppercase tracking-wider text-muted-blue">{title}</span>
        <span className="text-caption text-muted-blue">{open ? '▾' : '▸'}</span>
      </button>
      {open && <div className="pt-3">{children}</div>}
    </div>
  );
}

// ===== MAIN COMPONENT =====

export default function BriefingDetail({ dashboard }) {
  const nl = dashboard.newsletter || {};
  const fullNl = dashboard._newsletter_full || nl;

  // Try to get full newsletter data from latest.json newsletter block
  const scores = fullNl.composite_scores || nl.composite_scores || {};
  const tact = scores.tactical || {};
  const pos = scores.positional || {};
  const struct = scores.structural || {};

  const oneThing = fullNl.one_thing || nl.one_thing || '';
  const regimeCtx = fullNl.regime_context || {};
  const regimeInterp = fullNl.regime_interpretation || '';
  const portfolioAttr = fullNl.portfolio_attribution || {};
  const riskHeatmap = fullNl.risk_heatmap || {};
  const indicators = fullNl.indicators || {};
  const coherence = fullNl.pipeline_coherence || {};
  const scenarios = fullNl.scenarios || [];
  const behavioral = fullNl.behavioral || {};
  const againstYou = fullNl.against_you || {};
  const epistemic = fullNl.epistemic_status || {};
  const catalysts = fullNl.catalysts_48h || [];
  const intelDigest = fullNl.intelligence_digest || {};
  const breakingNews = fullNl.breaking_news || [];
  const warnings = fullNl.warning_triggers || [];
  const dataIntegrity = fullNl.data_integrity || {};
  const anchorType = fullNl.anchor_type || nl.anchor_type || '';

  // No data state
  if (!nl.date && !fullNl.date) {
    return (
      <div className="p-4">
        <GlassCard>
          <p className="text-body text-muted-blue">Newsletter noch nicht generiert. Erster Run nach Pipeline-Deployment.</p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-2 pb-24">
      {/* HEADER */}
      <GlassCard>
        <div className="flex items-center justify-between mb-2">
          <span className="text-section-title text-ice-white">
            📰 Daily Briefing — {fullNl.date || nl.date || ''}
          </span>
          {anchorType && (
            <span
              className="text-label font-medium px-2 py-0.5 rounded"
              style={{
                backgroundColor: anchorType === 'CRITICAL' ? 'rgba(239,68,68,0.2)' :
                                 anchorType === 'NORMAL' ? 'rgba(234,179,8,0.2)' : 'rgba(34,197,94,0.2)',
                color: anchorType === 'CRITICAL' ? COLORS.signalRed :
                       anchorType === 'NORMAL' ? COLORS.signalYellow : COLORS.signalGreen,
              }}
            >
              {anchorType}
            </span>
          )}
        </div>

        {/* One Thing */}
        {oneThing && (
          <p className="text-body text-ice-white leading-relaxed mb-3 italic">
            &ldquo;{oneThing}&rdquo;
          </p>
        )}

        {/* Composite Scores */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          {[
            { label: 'TACTICAL', sub: '0-24h', data: tact },
            { label: 'POSITIONAL', sub: '1-2W', data: pos },
            { label: 'STRUCTURAL', sub: '1-3M', data: struct },
          ].map(({ label, sub, data }) => (
            <div key={label} className="rounded-lg p-3 text-center" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid ${zoneColor(data.zone)}33` }}>
              <p className="text-caption text-muted-blue mb-1">{label}</p>
              <p className="text-xl tabular-nums font-bold" style={{ color: zoneColor(data.zone) }}>
                {data.score ?? '—'}
              </p>
              <p className="text-caption font-medium" style={{ color: zoneColor(data.zone) }}>
                {data.zone || '—'}
              </p>
              <p className="text-caption mt-1">
                <span style={{ color: velColor(data.velocity) }}>
                  {velArrow(data.velocity)} {data.velocity != null ? `${data.velocity > 0 ? '+' : ''}${data.velocity}` : ''}
                </span>
                {data.acceleration != null && data.acceleration !== 0 && (
                  <span className="text-muted-blue ml-1">
                    acc:{data.acceleration > 0 ? '+' : ''}{data.acceleration}
                  </span>
                )}
              </p>
            </div>
          ))}
        </div>

        {/* Data Integrity */}
        {dataIntegrity.score != null && (
          <div className="flex items-center gap-2 text-caption">
            <span className="text-muted-blue">Data Integrity:</span>
            <span style={{
              color: dataIntegrity.score >= 90 ? COLORS.signalGreen :
                     dataIntegrity.score >= 70 ? COLORS.signalYellow : COLORS.signalRed,
            }}>
              {dataIntegrity.score}%
            </span>
            {dataIntegrity.stale_feeds?.length > 0 && (
              <span className="text-muted-blue">
                ({dataIntegrity.stale_feeds.map(f => f.name).join(', ')} stale)
              </span>
            )}
          </div>
        )}
      </GlassCard>

      {/* WARNING TRIGGERS */}
      {warnings.length > 0 && (
        <GlassCard stripeColor={COLORS.signalOrange}>
          <Section title="⚠ Warning Triggers" defaultOpen={true}>
            <div className="space-y-2">
              {warnings.map((w, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-caption text-ice-white">{w.description}</span>
                  <span className="text-caption font-medium text-signal-red">{w.penalty}</span>
                </div>
              ))}
            </div>
          </Section>
        </GlassCard>
      )}

      {/* REGIME CONTEXT */}
      <GlassCard>
        <Section title="Regime Context">
          <p className="text-body text-ice-white mb-1">
            V16: <span className="font-medium">{regimeCtx.v16_regime || dashboard.v16?.regime || '—'}</span>
            {regimeCtx.regime_duration_days != null && (
              <span className="text-muted-blue"> (seit {regimeCtx.regime_duration_days}d)</span>
            )}
          </p>
          {regimeCtx.fragility_state && (
            <p className="text-caption text-muted-blue mb-1">
              Fragility: {regimeCtx.fragility_state}
            </p>
          )}
          {regimeInterp && (
            <p className="text-caption text-ice-white/80 mt-2">{regimeInterp}</p>
          )}
        </Section>
      </GlassCard>

      {/* RISK HEATMAP */}
      {riskHeatmap.positions?.length > 0 && (
        <GlassCard>
          <Section title="Risk Heatmap">
            <div className="overflow-x-auto">
              <table className="text-caption w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-1 pr-3 text-muted-blue"></th>
                    {(riskHeatmap.risk_factors || []).map((f, i) => (
                      <th key={i} className="text-center py-1 px-2 text-muted-blue">{f}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {riskHeatmap.positions.map((pos, ri) => (
                    <tr key={pos} className="border-b border-white/5">
                      <td className="py-1.5 pr-3 text-ice-white font-medium">{pos}</td>
                      {(riskHeatmap.matrix?.[ri] || []).map((sev, ci) => (
                        <td key={ci} className="text-center py-1.5 px-2">
                          <span>{heatmapEmoji(sev)}</span>
                          <span className="ml-1 text-caption" style={{ color: heatmapColor(sev) }}>
                            {sev === 'DIREKT' ? 'DIR' : sev === 'INDIREKT' ? 'IND' :
                             sev === 'SAFE_HAVEN' ? 'SH' : sev === 'MINIMAL' ? 'MIN' : '?'}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        </GlassCard>
      )}

      {/* INDICATORS */}
      {(indicators.core?.length > 0 || indicators.regime_sensitive?.length > 0) && (
        <GlassCard>
          <Section title="Indikatoren">
            {indicators.core?.length > 0 && (
              <div className="mb-3">
                <p className="text-caption text-muted-blue mb-2">KERN:</p>
                <div className="space-y-1.5">
                  {indicators.core.map((ind, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-caption text-ice-white/80 w-24 truncate">{ind.name}</span>
                      <span className="text-caption tabular-nums text-ice-white">
                        {ind.value != null ? (typeof ind.value === 'number' && ind.value > 1e6
                          ? `$${(ind.value / 1e12).toFixed(2)}T`
                          : ind.value) : '—'}
                      </span>
                      <span className="text-caption tabular-nums" style={{
                        color: (ind.normalized ?? 50) < 30 ? COLORS.signalRed :
                               (ind.normalized ?? 50) < 50 ? COLORS.signalYellow : COLORS.signalGreen,
                      }}>
                        {ind.normalized != null ? `${ind.normalized}` : '—'}
                      </span>
                      {ind.alert && <span className="text-caption text-signal-red">⚠</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {indicators.regime_sensitive?.length > 0 && (
              <div>
                <p className="text-caption text-muted-blue mb-2">REGIME-SENSITIV:</p>
                <div className="space-y-1.5">
                  {indicators.regime_sensitive.map((ind, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-caption text-ice-white/80 w-24 truncate">{ind.name}</span>
                      <span className="text-caption tabular-nums text-ice-white">{ind.value ?? '—'}</span>
                      <span className="text-caption tabular-nums" style={{
                        color: (ind.normalized ?? 50) < 30 ? COLORS.signalRed :
                               (ind.normalized ?? 50) < 50 ? COLORS.signalYellow : COLORS.signalGreen,
                      }}>
                        {ind.normalized ?? '—'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Section>
        </GlassCard>
      )}

      {/* SCENARIOS */}
      {scenarios.length > 0 && (
        <GlassCard>
          <Section title="Szenarien">
            <div className="space-y-3">
              {scenarios.map((s, i) => (
                <div key={i} className="rounded-lg p-3" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-caption font-medium text-ice-white">
                      Szenario {s.id}
                    </span>
                    <span className="text-caption tabular-nums font-medium" style={{
                      color: s.probability_pct >= 40 ? COLORS.signalYellow : COLORS.mutedBlue,
                    }}>
                      {s.probability_pct}%
                    </span>
                  </div>
                  <p className="text-caption text-ice-white/80 mb-1">{s.description}</p>
                  <p className="text-caption text-muted-blue">
                    Impact: {s.portfolio_impact} · Composite: {s.composite_impact} · Action: {s.action}
                  </p>
                </div>
              ))}
            </div>
          </Section>
        </GlassCard>
      )}

      {/* AGAINST YOU */}
      {againstYou.positions?.length > 0 && (
        <GlassCard stripeColor={COLORS.signalRed}>
          <Section title="⚔ Was gegen dich läuft">
            <div className="space-y-2 mb-3">
              {againstYou.positions.map((p, i) => (
                <div key={i}>
                  <p className="text-caption text-ice-white font-medium">{p.asset} ({p.probability_pct}%):</p>
                  <p className="text-caption text-ice-white/80">{p.top_risk || p.mechanism}</p>
                </div>
              ))}
            </div>
            {againstYou.if_wrong_summary && (
              <div className="rounded-lg p-2" style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}>
                <p className="text-caption text-signal-red font-medium">IF WRONG:</p>
                <p className="text-caption text-ice-white/80">{againstYou.if_wrong_summary}</p>
              </div>
            )}
          </Section>
        </GlassCard>
      )}

      {/* PIPELINE COHERENCE */}
      <GlassCard>
        <Section title="Pipeline Coherence" defaultOpen={false}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-body tabular-nums font-medium" style={{
              color: (coherence.score ?? 100) < 50 ? COLORS.signalRed :
                     (coherence.score ?? 100) < 70 ? COLORS.signalYellow : COLORS.signalGreen,
            }}>
              {coherence.score ?? '—'}%
            </span>
          </div>
          {coherence.subsystems && (
            <div className="space-y-1 mb-2">
              {Object.entries(coherence.subsystems).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between">
                  <span className="text-caption text-muted-blue capitalize">{k.replace(/_/g, ' ')}</span>
                  <span className="text-caption text-ice-white">{v}</span>
                </div>
              ))}
            </div>
          )}
          {coherence.divergences?.length > 0 && (
            <div className="mt-2">
              {coherence.divergences.map((d, i) => (
                <p key={i} className="text-caption text-signal-yellow">⚠ {d.type}: {d.detail}</p>
              ))}
            </div>
          )}
        </Section>
      </GlassCard>

      {/* BEHAVIORAL SAFEGUARDS */}
      {behavioral.anchoring_alerts?.length > 0 && (
        <GlassCard>
          <Section title="Behavioral Safeguards" defaultOpen={false}>
            {behavioral.anchoring_alerts.map((a, i) => (
              <div key={i} className="mb-2 rounded-lg p-2" style={{ backgroundColor: 'rgba(234,179,8,0.08)' }}>
                <p className="text-caption text-signal-yellow font-medium">ANCHORING:</p>
                <p className="text-caption text-ice-white/80">{a.question}</p>
              </div>
            ))}
            {behavioral.inaction_tracker && (
              <p className="text-caption text-muted-blue">
                Status: {behavioral.inaction_tracker.status}
              </p>
            )}
            {behavioral.system_action && (
              <p className="text-caption text-ice-white mt-1">
                System Action: <span className="font-medium">{behavioral.system_action}</span>
              </p>
            )}
          </Section>
        </GlassCard>
      )}

      {/* EPISTEMIC STATUS */}
      <GlassCard>
        <Section title="Epistemic Status" defaultOpen={false}>
          <div className="space-y-1.5">
            {epistemic.data_quality && (
              <div className="flex items-center justify-between">
                <span className="text-caption text-muted-blue">Data Quality</span>
                <span className="text-caption" style={{
                  color: epistemic.data_quality === 'GOOD' ? COLORS.signalGreen :
                         epistemic.data_quality === 'DEGRADED' ? COLORS.signalYellow : COLORS.signalOrange,
                }}>
                  {epistemic.data_quality}
                </span>
              </div>
            )}
            {epistemic.system_conviction && (
              <div className="flex items-center justify-between">
                <span className="text-caption text-muted-blue">System Conviction</span>
                <span className="text-caption text-ice-white">{epistemic.system_conviction}</span>
              </div>
            )}
            {epistemic.blind_spots?.length > 0 && (
              <div className="mt-2">
                <p className="text-caption text-muted-blue mb-1">Blind Spots:</p>
                {epistemic.blind_spots.map((b, i) => (
                  <p key={i} className="text-caption text-signal-yellow">· {b}</p>
                ))}
              </div>
            )}
          </div>
        </Section>
      </GlassCard>

      {/* CATALYSTS 48H */}
      {catalysts.length > 0 && (
        <GlassCard>
          <Section title="Catalysts 48h">
            <div className="space-y-1.5">
              {catalysts.map((c, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-caption text-ice-white">
                    {c.date} — {c.event}
                  </span>
                  <span className="text-caption font-medium" style={{
                    color: c.impact === 'HIGH' ? COLORS.signalRed : COLORS.signalYellow,
                  }}>
                    {c.impact}
                  </span>
                </div>
              ))}
            </div>
          </Section>
        </GlassCard>
      )}

      {/* INTELLIGENCE DIGEST */}
      <GlassCard>
        <Section title="Intelligence Digest" defaultOpen={false}>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-caption text-muted-blue">IC Richtung</span>
              <span className="text-caption font-medium" style={{
                color: intelDigest.ic_net_direction === 'BEARISH' ? COLORS.signalRed :
                       intelDigest.ic_net_direction === 'BULLISH' ? COLORS.signalGreen : COLORS.mutedBlue,
              }}>
                {intelDigest.ic_net_direction || '—'}
              </span>
            </div>
            {intelDigest.pre_mortem_high_count > 0 && (
              <p className="text-caption text-signal-red">
                💀 {intelDigest.pre_mortem_high_count} HIGH risk Pre-Mortems
              </p>
            )}
            {intelDigest.active_threads > 0 && (
              <p className="text-caption text-muted-blue">
                🧵 {intelDigest.active_threads} Thread{intelDigest.active_threads !== 1 ? 's' : ''}
                {intelDigest.threatening_threads > 0 && (
                  <span className="text-signal-red ml-1">({intelDigest.threatening_threads} ⚠)</span>
                )}
              </p>
            )}
          </div>
        </Section>
      </GlassCard>

      {/* BREAKING NEWS */}
      {breakingNews.length > 0 && (
        <GlassCard stripeColor={COLORS.signalRed}>
          <Section title="📰 Breaking News">
            <div className="space-y-2">
              {breakingNews.map((b, i) => (
                <div key={i}>
                  <div className="flex items-center gap-2">
                    <span className="text-caption font-medium" style={{
                      color: b.impact === 'HIGH' ? COLORS.signalRed : COLORS.signalYellow,
                    }}>
                      [{b.impact}]
                    </span>
                    <span className="text-caption text-ice-white">{b.title}</span>
                  </div>
                  <p className="text-caption text-muted-blue ml-4">{b.source} · {b.category}</p>
                </div>
              ))}
            </div>
          </Section>
        </GlassCard>
      )}
    </div>
  );
}
