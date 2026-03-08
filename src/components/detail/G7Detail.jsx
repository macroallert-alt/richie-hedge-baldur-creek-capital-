'use client';

import { useState } from 'react';
import { COLORS } from '@/lib/constants';

// ══════════════════════════════════════════════════════════════
// STATUS & SCENARIO COLORS
// ══════════════════════════════════════════════════════════════

const STATUS_COLORS = {
  STABLE: COLORS.signalGreen,
  SHIFTING: COLORS.signalYellow,
  ELEVATED_RISK: '#F97316',          // orange
  STRUCTURAL_BREAK: COLORS.signalRed,
};

const SCENARIO_COLORS = {
  managed_decline: '#F59E0B',        // amber
  conflict_escalation: '#EF4444',    // red
  us_renewal: '#22C55E',             // green
  multipolar_chaos: '#6B7280',       // gray
};

const SCENARIO_LABELS = {
  managed_decline: 'Managed Decline',
  conflict_escalation: 'Conflict Escalation',
  us_renewal: 'US Renewal',
  multipolar_chaos: 'Multipolar Chaos',
};

const SCENARIO_SHORT = {
  managed_decline: 'Gradueller Machtübergang, Gold strukturell OW',
  conflict_escalation: 'Militärische Konfrontation, SWIFT als Waffe',
  us_renewal: 'AI-Produktivitätsrevolution rettet US-Hegemonie',
  multipolar_chaos: 'Kein Hegemon, Fragmentierung, Commodities OW',
};

const TREND_ARROWS = {
  ESCALATING: '↑', RISING: '↑', IMPROVING: '↑',
  STABLE: '→', FLAT: '→',
  'DE-ESCALATING': '↓', FALLING: '↓', DETERIORATING: '↓',
  CRITICAL: '⚠',
};

const REGIONS = ['USA', 'CHINA', 'EU', 'INDIA', 'JP_KR_TW', 'GULF', 'REST_EM'];
const REGION_LABELS = {
  USA: 'USA', CHINA: 'China', EU: 'EU', INDIA: 'India',
  JP_KR_TW: 'JP/KR/TW', GULF: 'Gulf', REST_EM: 'Rest EM',
};

const SCENARIOS = ['managed_decline', 'conflict_escalation', 'us_renewal', 'multipolar_chaos'];

// ══════════════════════════════════════════════════════════════
// MINI SPARKLINE (SVG)
// ══════════════════════════════════════════════════════════════

function Sparkline({ data, width = 80, height = 24, color = COLORS.baldurBlue }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="inline-block ml-2">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════
// POWER SCORE BAR
// ══════════════════════════════════════════════════════════════

function PowerBar({ score, maxScore = 100 }) {
  const pct = Math.max(0, Math.min(100, (score / maxScore) * 100));
  const color = score >= 60 ? COLORS.signalGreen
    : score >= 45 ? COLORS.signalYellow
    : COLORS.signalRed;
  return (
    <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: `${color}90` }} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// SEVERITY DOT ROW (for SIT)
// ══════════════════════════════════════════════════════════════

function SeverityDots({ score, max = 10 }) {
  const filled = Math.round(Math.min(max, Math.max(0, score)));
  const color = filled >= 7 ? COLORS.signalRed
    : filled >= 4 ? COLORS.signalYellow
    : COLORS.signalGreen;
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <div key={i} className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: i < filled ? color : 'rgba(255,255,255,0.1)' }} />
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// TILT COLOR
// ══════════════════════════════════════════════════════════════

function tiltColor(val) {
  if (val >= 0.3) return COLORS.signalGreen;
  if (val >= 0.1) return `${COLORS.signalGreen}90`;
  if (val <= -0.3) return COLORS.signalRed;
  if (val <= -0.1) return `${COLORS.signalRed}90`;
  return COLORS.mutedBlue;
}

function tiltLabel(val) {
  if (val >= 0.3) return 'OW';
  if (val <= -0.3) return 'UW';
  if (Math.abs(val) < 0.05) return 'N';
  return val > 0 ? 'OW' : 'UW';
}

// ══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════

export default function G7Detail({ dashboard }) {
  const g7 = dashboard?.g7 || {};
  const [dimOpen, setDimOpen] = useState(null);

  if (!g7.available) {
    return (
      <div className="py-4">
        <h1 className="text-page-title text-center">G7 World Order Monitor</h1>
        <div className="glass-card p-6 mt-4 text-center">
          <p className="text-body text-muted-blue">G7 Daten nicht verfügbar. Nächster Run ausstehend.</p>
        </div>
      </div>
    );
  }

  const ps = g7.power_scores || {};
  const gap = g7.gap || {};
  const scenarios = g7.scenarios || {};
  const probs = scenarios.probabilities || {};
  const tiltsMatrix = g7.tilts_matrix || [];
  const actionMap = g7.action_map || {};
  const overlays = g7.overlays || {};
  const sit = g7.sit || {};
  const challenge = g7.challenge || {};
  const dims = g7.dimensions || {};
  const narr = g7.narrative || {};
  const expl = g7.explanations || {};
  const psHistory = g7.power_scores_history || [];
  const overlayHistory = g7.overlay_history || [];
  const permopt = g7.permopt || {};
  const meta = g7.meta || {};

  const statusColor = STATUS_COLORS[g7.status] || COLORS.mutedBlue;

  // Extract sparkline data for a region from history
  const regionSparkline = (region) =>
    psHistory.map(h => h.scores?.[region] || 0);
  const gapSparkline = psHistory.map(h => h.gap || 0);

  // Overlay sparkline data
  const overlaySparkline = (key) =>
    overlayHistory.map(h => h[key] || 0);

  return (
    <div className="py-4 space-y-4">
      <h1 className="text-page-title text-center lg:text-page-title text-center-desktop">
        G7 World Order Monitor
      </h1>

      {/* ═══════ SECTION 1: THE WORLD RIGHT NOW ═══════ */}

      {/* Status Ampel + Headline */}
      <div className="glass-card-primary p-5 flex flex-col items-center">
        <div className="w-16 h-16 rounded-full mb-3 flex items-center justify-center"
          style={{ backgroundColor: `${statusColor}25`, border: `3px solid ${statusColor}` }}>
          <span className="text-[24px] font-bold" style={{ color: statusColor }}>
            {g7.status === 'STRUCTURAL_BREAK' ? '!' : g7.status?.charAt(0) || '?'}
          </span>
        </div>
        <span className="text-data-large tabular-nums" style={{ color: statusColor }}>
          {g7.status || '—'}
        </span>
        {g7.attention_flag && g7.attention_flag !== 'NONE' && (
          <span className="text-caption mt-1 px-2 py-0.5 rounded"
            style={{
              backgroundColor: `${statusColor}15`,
              color: statusColor,
            }}>
            Attention: {g7.attention_flag}
          </span>
        )}
      </div>

      {/* Headline */}
      {narr.headline && (
        <div className="glass-card p-4">
          <p className="text-body text-ice-white leading-relaxed">{narr.headline}</p>
        </div>
      )}

      {/* Power Scores + Gap */}
      <div className="glass-card p-4">
        <h2 className="text-section-title text-ice-white mb-3">Power Balance</h2>

        {/* USA-China Gap prominent */}
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/5">
          <div>
            <span className="text-caption text-muted-blue">USA-China Gap</span>
            <div className="flex items-center gap-2">
              <span className="text-data-large tabular-nums text-ice-white">
                {gap.value ?? '—'}
              </span>
              <span className="text-caption" style={{ color: gap.trend === 'CLOSING' ? COLORS.signalRed : COLORS.mutedBlue }}>
                {gap.trend || '—'}
              </span>
              <Sparkline data={gapSparkline} color={COLORS.baldurBlue} />
            </div>
          </div>
        </div>

        {/* Region rows */}
        <div className="space-y-3">
          {REGIONS.map(region => {
            const r = ps[region] || {};
            return (
              <div key={region} className="flex items-center gap-3">
                <span className="text-caption text-muted-blue w-16 shrink-0">
                  {REGION_LABELS[region]}
                </span>
                <div className="flex-1 min-w-0">
                  <PowerBar score={r.score || 0} />
                </div>
                <span className="text-data-small tabular-nums text-ice-white w-10 text-right">
                  {r.score ?? '—'}
                </span>
                <span className="text-caption text-muted-blue w-6 text-center">
                  {r.momentum > 0.3 ? '▲' : r.momentum < -0.3 ? '▼' : '►'}
                </span>
                <Sparkline data={regionSparkline(region)} width={60} height={18} />
              </div>
            );
          })}
        </div>

        {/* Phase labels */}
        <div className="mt-3 pt-3 border-t border-white/5 flex flex-wrap gap-2">
          {REGIONS.map(region => {
            const r = ps[region] || {};
            return (
              <span key={region} className="text-[10px] text-faded-blue">
                {REGION_LABELS[region]}: {r.phase || '—'}
              </span>
            );
          })}
        </div>
      </div>

      {/* Power Balance Explanation */}
      {expl.power_gap && (
        <div className="glass-card p-4">
          <p className="text-body text-ice-white leading-relaxed whitespace-pre-line">
            {expl.power_gap}
          </p>
        </div>
      )}

      {/* ═══════ SECTION 2: SCENARIO LANDSCAPE ═══════ */}

      <div className="glass-card p-4">
        <h2 className="text-section-title text-ice-white mb-3">Szenario-Landschaft</h2>

        {/* Probability bars */}
        <div className="space-y-2 mb-4">
          {SCENARIOS.map(s => {
            const prob = probs[s] || 0;
            const pct = Math.round(prob * 100);
            const isDominant = s === scenarios.dominant;
            return (
              <div key={s}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: SCENARIO_COLORS[s] }} />
                    <span className={`text-caption ${isDominant ? 'text-ice-white font-medium' : 'text-muted-blue'}`}>
                      {SCENARIO_LABELS[s]}
                    </span>
                    {isDominant && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-baldur-blue/20 text-baldur-blue font-medium">
                        DOMINANT
                      </span>
                    )}
                  </div>
                  <span className="text-data-small tabular-nums text-ice-white">{pct}%</span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: `${SCENARIO_COLORS[s]}80` }} />
                </div>
                <p className="text-[10px] text-faded-blue mt-0.5">{SCENARIO_SHORT[s]}</p>
              </div>
            );
          })}
        </div>

        {/* Confidence + Source */}
        <div className="flex gap-4 text-caption text-muted-blue pt-2 border-t border-white/5">
          <span>Confidence: <span className="text-ice-white">{scenarios.confidence || '—'}</span></span>
          <span>Source: <span className="text-ice-white">{scenarios.probability_source || '—'}</span></span>
          {scenarios.interim_flag && (
            <span className="text-signal-yellow">INTERIM</span>
          )}
        </div>
      </div>

      {/* Tilts Heatmap */}
      <div className="glass-card p-4">
        <h2 className="text-section-title text-ice-white mb-3">Asset Tilts</h2>

        {/* Header row */}
        <div className="grid grid-cols-7 gap-1 mb-1 text-[10px] text-faded-blue text-center">
          <span className="text-left">Asset</span>
          <span>MD</span><span>CE</span><span>UR</span><span>MC</span>
          <span>Tilt</span><span>Dir</span>
        </div>

        {/* Asset rows */}
        <div className="space-y-1">
          {tiltsMatrix.map(row => (
            <div key={row.asset} className="grid grid-cols-7 gap-1 items-center py-1">
              <span className="text-caption text-ice-white font-medium">{row.asset}</span>
              {SCENARIOS.map(s => {
                const val = row[s] || 0;
                return (
                  <div key={s} className="text-center">
                    <span className="text-[10px] tabular-nums px-1 py-0.5 rounded"
                      style={{
                        backgroundColor: `${tiltColor(val)}15`,
                        color: tiltColor(val),
                      }}>
                      {val > 0 ? '+' : ''}{val.toFixed(1)}
                    </span>
                  </div>
                );
              })}
              <span className="text-data-small tabular-nums text-center"
                style={{ color: tiltColor(row.composite) }}>
                {row.composite > 0 ? '+' : ''}{row.composite?.toFixed(3)}
              </span>
              <span className="text-[10px] text-center font-medium"
                style={{ color: tiltColor(row.composite) }}>
                {tiltLabel(row.composite)}
              </span>
            </div>
          ))}
        </div>

        {/* PermOpt */}
        {permopt.total_pct > 0 && (
          <div className="mt-3 pt-3 border-t border-white/5">
            <div className="flex items-center gap-2">
              <span className="text-caption text-muted-blue">PermOpt:</span>
              <span className="text-data-small tabular-nums text-ice-white">{permopt.total_pct}%</span>
              <span className="text-caption text-faded-blue">
                über {permopt.assets?.length || 0} Assets (DDI {permopt.ddi_level || '—'})
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Scenario Implications Text */}
      {narr.scenario_implications && (
        <div className="glass-card p-4">
          <p className="text-body text-ice-white leading-relaxed whitespace-pre-line">
            {narr.scenario_implications}
          </p>
        </div>
      )}

      {/* Action Map (collapsible per scenario) */}
      <div className="glass-card p-4">
        <h2 className="text-section-title text-ice-white mb-3">Szenario-Aktionen</h2>
        <div className="space-y-2">
          {SCENARIOS.map(s => {
            const am = actionMap[s] || {};
            return (
              <div key={s} className="border-l-2 pl-3 py-1"
                style={{ borderColor: SCENARIO_COLORS[s] }}>
                <span className="text-caption font-medium" style={{ color: SCENARIO_COLORS[s] }}>
                  {am.label || SCENARIO_LABELS[s]}
                </span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {(am.overweight || []).map(a => (
                    <span key={a} className="text-[10px] px-1.5 py-0.5 rounded bg-signal-green/10 text-signal-green">
                      OW {a}
                    </span>
                  ))}
                  {(am.underweight || []).map(a => (
                    <span key={a} className="text-[10px] px-1.5 py-0.5 rounded bg-signal-red/10 text-signal-red">
                      UW {a}
                    </span>
                  ))}
                  {(am.vetos || []).map(a => (
                    <span key={a} className="text-[10px] px-1.5 py-0.5 rounded bg-signal-red/20 text-signal-red font-medium">
                      ⚠ VETO {a}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══════ SECTION 3: STRESS INDICATORS ═══════ */}

      <div className="glass-card p-4">
        <h2 className="text-section-title text-ice-white mb-3">Stress Indikatoren</h2>

        <div className="grid grid-cols-2 gap-3">
          {/* SCSI */}
          <div className="bg-white/5 rounded-lg p-3">
            <span className="text-[10px] text-faded-blue block mb-1">SCSI</span>
            <div className="flex items-center gap-2">
              <span className="text-data-medium tabular-nums text-ice-white">
                {overlays.scsi?.value ?? '—'}
              </span>
              <span className="text-caption" style={{
                color: overlays.scsi?.trend === 'RISING' ? COLORS.signalYellow : COLORS.mutedBlue
              }}>
                {TREND_ARROWS[overlays.scsi?.trend] || '→'} {overlays.scsi?.trend || '—'}
              </span>
            </div>
            <Sparkline data={overlaySparkline('scsi')} width={70} height={16}
              color={overlays.scsi?.trend === 'RISING' ? COLORS.signalYellow : COLORS.baldurBlue} />
          </div>

          {/* DDI */}
          <div className="bg-white/5 rounded-lg p-3">
            <span className="text-[10px] text-faded-blue block mb-1">DDI</span>
            <div className="flex items-center gap-2">
              <span className="text-data-medium tabular-nums text-ice-white">
                {overlays.ddi?.value ?? '—'}
              </span>
              <span className="text-caption" style={{
                color: overlays.ddi?.trend === 'RISING' ? COLORS.signalYellow : COLORS.mutedBlue
              }}>
                {TREND_ARROWS[overlays.ddi?.trend] || '→'} {overlays.ddi?.trend || '—'}
              </span>
            </div>
            <Sparkline data={overlaySparkline('ddi')} width={70} height={16}
              color={overlays.ddi?.trend === 'RISING' ? COLORS.signalYellow : COLORS.baldurBlue} />
          </div>

          {/* FDP USA */}
          <div className="bg-white/5 rounded-lg p-3">
            <span className="text-[10px] text-faded-blue block mb-1">FDP USA</span>
            <div className="flex items-center gap-2">
              <span className="text-data-medium tabular-nums text-ice-white">
                {overlays.fdp_usa?.value ?? '—'}
              </span>
            </div>
            <Sparkline data={overlaySparkline('fdp_usa')} width={70} height={16} />
          </div>

          {/* EWI */}
          <div className="bg-white/5 rounded-lg p-3">
            <span className="text-[10px] text-faded-blue block mb-1">EWI</span>
            <div className="flex items-center gap-2">
              <span className="text-data-medium tabular-nums text-ice-white">
                {overlays.ewi?.active_signals ?? 0}/10
              </span>
              <span className="text-caption" style={{
                color: overlays.ewi?.severity === 'HIGH' ? COLORS.signalRed
                  : overlays.ewi?.severity === 'MEDIUM' ? COLORS.signalYellow
                  : COLORS.mutedBlue
              }}>
                {overlays.ewi?.severity || '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay Explanation (connected narrative) */}
      {(expl.scsi || expl.ddi || expl.fdp || expl.ewi) && (
        <div className="glass-card p-4">
          <p className="text-body text-ice-white leading-relaxed whitespace-pre-line">
            {[expl.scsi, expl.ddi, expl.fdp, expl.ewi].filter(Boolean).join(' ')}
          </p>
        </div>
      )}

      {/* ═══════ SECTION 4: SANCTIONS & GEOPOLITICAL RISK ═══════ */}

      <div className="glass-card p-4">
        <h2 className="text-section-title text-ice-white mb-3">Sanctions & Geopolitical Risk</h2>

        {/* Global Status */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-caption text-muted-blue">Global:</span>
          <span className="text-data-medium font-medium" style={{
            color: sit.global_trend === 'CRITICAL' ? COLORS.signalRed
              : sit.global_trend === 'ESCALATING' ? '#F97316'
              : sit.global_trend === 'DE-ESCALATING' ? COLORS.signalGreen
              : COLORS.mutedBlue,
          }}>
            {sit.global_trend || '—'}
          </span>
          {sit.dominant_driver && (
            <span className="text-caption text-ice-white">— {sit.dominant_driver}</span>
          )}
        </div>

        {/* Region severity table */}
        <div className="space-y-2">
          {REGIONS.map(region => {
            const sev = sit.severity_by_region?.[region] ?? 0;
            const highlight = sit.highlights?.[region] || '';
            return (
              <div key={region} className="flex items-center gap-3">
                <span className="text-caption text-muted-blue w-16 shrink-0">
                  {REGION_LABELS[region]}
                </span>
                <SeverityDots score={sev} />
                <span className="text-data-small tabular-nums text-ice-white w-8">
                  {sev.toFixed(1)}
                </span>
                <span className="text-[10px] text-faded-blue truncate flex-1">
                  {highlight}
                </span>
              </div>
            );
          })}
        </div>

        {/* Portfolio Vetos */}
        {sit.portfolio_vetos?.length > 0 && (
          <div className="mt-3 pt-3 border-t border-white/5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-caption text-signal-red font-medium">⚠ Veto Watch:</span>
              {sit.portfolio_vetos.map(v => (
                <span key={v} className="text-[10px] px-2 py-0.5 rounded bg-signal-red/15 text-signal-red font-medium">
                  {v}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ═══════ SECTION 5: CHALLENGE ═══════ */}

      <div className="glass-card p-4" style={{ borderLeft: `3px solid ${COLORS.signalRed}40` }}>
        <h2 className="text-section-title text-ice-white mb-3" style={{ color: '#F97316' }}>
          ⚠ Challenge
        </h2>

        {/* Counter-Narrative */}
        {challenge.counter_narrative && (
          <div className="mb-3">
            <span className="text-[10px] text-faded-blue block mb-1">COUNTER-NARRATIVE</span>
            <p className="text-body text-ice-white leading-relaxed whitespace-pre-line">
              {typeof challenge.counter_narrative === 'string'
                ? challenge.counter_narrative
                : challenge.counter_narrative.narrative || challenge.counter_narrative.counter_argument || JSON.stringify(challenge.counter_narrative)}
            </p>
          </div>
        )}

        {/* Unasked Question */}
        {challenge.unasked_question && (
          <div className="mb-3 pt-3 border-t border-white/5">
            <span className="text-[10px] text-faded-blue block mb-1">UNASKED QUESTION</span>
            <p className="text-body text-signal-yellow leading-relaxed">
              {challenge.unasked_question}
            </p>
          </div>
        )}

        {/* Stress Test */}
        {challenge.stress_test_result && (
          <div className="pt-3 border-t border-white/5">
            <span className="text-[10px] text-faded-blue block mb-1">THESIS STRESS TEST</span>
            <p className="text-caption text-muted-blue leading-relaxed">
              {challenge.stress_test_result}
            </p>
          </div>
        )}
      </div>

      {/* Weekly Shift + Portfolio Context narrative */}
      {(narr.weekly_shift || narr.portfolio_context) && (
        <div className="glass-card p-4">
          {narr.weekly_shift && (
            <div className="mb-3">
              <h2 className="text-section-title text-ice-white mb-2">Wöchentliche Verschiebung</h2>
              <p className="text-body text-ice-white leading-relaxed whitespace-pre-line">
                {narr.weekly_shift}
              </p>
            </div>
          )}
          {narr.portfolio_context && (
            <div className={narr.weekly_shift ? 'pt-3 border-t border-white/5' : ''}>
              <h2 className="text-section-title text-ice-white mb-2">Portfolio-Kontext</h2>
              <p className="text-body text-ice-white leading-relaxed whitespace-pre-line">
                {narr.portfolio_context}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ═══════ SECTION 6: DIMENSION DEEP DIVE ═══════ */}

      <div className="glass-card p-4">
        <h2 className="text-section-title text-ice-white mb-3">Dimension Deep Dive</h2>
        <div className="space-y-1">
          {Object.entries(dims).map(([dimKey, dimData]) => {
            const isOpen = dimOpen === dimKey;
            const scores = dimData?.scores || {};
            const usaScore = scores.USA ?? 0;
            const chinaScore = scores.CHINA ?? 0;

            return (
              <div key={dimKey} className="overflow-hidden">
                <button
                  onClick={() => setDimOpen(isOpen ? null : dimKey)}
                  className="w-full text-left py-2 flex items-center gap-3"
                >
                  <span className="text-caption text-muted-blue w-40 shrink-0">
                    {dimData?.label || dimKey}
                  </span>
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-[10px] text-faded-blue w-8">USA</span>
                    <span className="text-data-small tabular-nums text-ice-white w-8 text-right">
                      {usaScore.toFixed?.(1) ?? '—'}
                    </span>
                    <span className="text-[10px] text-faded-blue w-8 ml-2">CHN</span>
                    <span className="text-data-small tabular-nums text-ice-white w-8 text-right">
                      {chinaScore.toFixed?.(1) ?? '—'}
                    </span>
                    <span className="text-[10px] text-faded-blue ml-2">
                      Gap {((usaScore || 0) - (chinaScore || 0)).toFixed(1)}
                    </span>
                  </div>
                  <span className="text-muted-blue text-caption transition-transform duration-200"
                    style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                    ▼
                  </span>
                </button>

                {isOpen && (
                  <div className="pb-3 pl-4">
                    <div className="grid grid-cols-7 gap-2 text-center">
                      {REGIONS.map(r => (
                        <div key={r}>
                          <span className="text-[10px] text-faded-blue block">
                            {REGION_LABELS[r]}
                          </span>
                          <span className="text-data-small tabular-nums text-ice-white">
                            {(scores[r] ?? 0).toFixed?.(1) ?? '—'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Status Explanation */}
      {expl.status && (
        <div className="glass-card p-4">
          <p className="text-caption text-muted-blue leading-relaxed">{expl.status}</p>
        </div>
      )}

      {/* Meta */}
      <div className="text-center text-[10px] text-faded-blue py-2">
        {meta.last_run} • {meta.run_type} • {meta.duration_s}s
      </div>
    </div>
  );
}
