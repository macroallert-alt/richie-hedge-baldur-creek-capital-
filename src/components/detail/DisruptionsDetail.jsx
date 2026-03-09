'use client';

import { useState } from 'react';
import {
  COLORS,
  REGIME_COLORS,
  DISRUPTION_PHASE_COLORS,
  DISRUPTION_STATUS_COLORS,
  DISRUPTION_THREAT_COLORS,
  DISRUPTION_ALERT_COLORS,
  CONVICTION_COLORS,
  DECISION_STATUS_COLORS,
  CONFIDENCE_COLORS,
  EFFECT_DIRECTION_DISPLAY,
  CROWDING_ALERT_COLORS,
  ASYMMETRY_LABEL_COLORS,
  G7_RELATIONSHIP_COLORS,
  getReadinessColor,
  getAsymmetryColor,
} from '@/lib/constants';

// ═══════════════════════════════════════════════════════
// S-KURVE CHART
// ═══════════════════════════════════════════════════════
function SCurveChart({ trends }) {
  const curvePoints = [];
  for (let x = 0; x <= 100; x += 2) {
    const y = 100 / (1 + Math.exp(-0.08 * (x - 50)));
    curvePoints.push({ x, y });
  }

  const inflectionLeft = 25;
  const inflectionRight = 45;
  const activeTrends = trends.filter(t => t.status === 'ACTIVE' || t.status === 'WATCH');

  return (
    <div className="relative w-full h-64 bg-[#0D1B2A] rounded-lg border border-[#1E3A5F] overflow-hidden">
      <div
        className="absolute top-0 bottom-0 opacity-10"
        style={{ left: `${inflectionLeft}%`, width: `${inflectionRight - inflectionLeft}%`, backgroundColor: COLORS.signalYellow }}
      />
      <div className="absolute top-1/2 text-xs opacity-30" style={{ left: `${(inflectionLeft + inflectionRight) / 2}%`, transform: 'translate(-50%, -50%)' }}>
        <span style={{ color: COLORS.signalYellow }}>INFLECTION ZONE</span>
      </div>
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polyline fill="none" stroke={COLORS.fadedBlue} strokeWidth="0.5" strokeDasharray="2,2"
          points={curvePoints.map(p => `${p.x},${100 - p.y}`).join(' ')} />
      </svg>
      {activeTrends.map((t) => {
        const x = t.s_curve_x || t.maturity;
        const y = 100 / (1 + Math.exp(-0.08 * (x - 50)));
        const size = Math.max(8, Math.min(20, (t.relevance || 50) / 5));
        const momColor = t.momentum > 60 ? COLORS.signalGreen : t.momentum > 40 ? COLORS.signalYellow : COLORS.signalRed;
        return (
          <div key={t.id} className="absolute flex flex-col items-center"
            style={{ left: `${x}%`, bottom: `${y}%`, transform: 'translate(-50%, 50%)' }}>
            <div className="rounded-full border-2"
              style={{ width: size, height: size, backgroundColor: momColor, borderColor: DISRUPTION_STATUS_COLORS[t.status] || COLORS.mutedBlue, opacity: 0.9 }} />
            <span className="text-[9px] mt-0.5 whitespace-nowrap" style={{ color: COLORS.iceWhite }}>{t.id}</span>
          </div>
        );
      })}
      <div className="absolute bottom-1 left-1 text-[9px]" style={{ color: COLORS.fadedBlue }}>EMERGING</div>
      <div className="absolute bottom-1 right-1 text-[9px]" style={{ color: COLORS.fadedBlue }}>MAINSTREAM</div>
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px]" style={{ color: COLORS.fadedBlue }}>Maturity &rarr;</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// REGIME BADGE (wiederverwendbar)
// ═══════════════════════════════════════════════════════
function RegimeBadge({ regimeContext }) {
  if (!regimeContext) return null;
  const regime = regimeContext.current_regime;
  const color = REGIME_COLORS[regime] || COLORS.signalYellow;
  const rules = regimeContext.regime_rules || {};
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ color, backgroundColor: `${color}20`, border: `1px solid ${color}40` }}>
        V16: {regime}
      </span>
      {rules.sizing_multiplier < 1 && (
        <span className="text-[10px]" style={{ color: COLORS.mutedBlue }}>
          Sizing &times;{rules.sizing_multiplier} | Min Conv {rules.min_conviction_threshold} | Min Asym {rules.min_asymmetry_threshold}:1
        </span>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// TREND ROW (erweitert um Conviction + Asymmetrie)
// ═══════════════════════════════════════════════════════
function TrendRow({ trend, isExpanded, onToggle, convictionData, payoffData, g7Refs }) {
  const t = trend;
  const phaseColor = DISRUPTION_PHASE_COLORS[t.phase] || COLORS.mutedBlue;
  const statusColor = DISRUPTION_STATUS_COLORS[t.status] || COLORS.mutedBlue;
  const isInflection = t.inflection_score > 70;
  const velArrow = t.velocity === 'HIGH' ? '\u2191' : t.velocity === 'MEDIUM' ? '\u2192' : '\u00B7';
  const conv = convictionData || {};
  const convColor = CONVICTION_COLORS[conv.label] || COLORS.mutedBlue;
  const trendG7 = (g7Refs || []).filter(r => r.disruption_trend_id === t.id);

  return (
    <div className="border-b border-[#1E3A5F]">
      <button onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-[#0D1B2A]/50 transition-colors">
        <span className="text-xs font-mono w-6" style={{ color: COLORS.fadedBlue }}>{isExpanded ? '\u25BC' : '\u25B6'}</span>
        <span className="text-sm font-medium flex-1 min-w-0 truncate" style={{ color: COLORS.iceWhite }}>
          {t.id} {t.name}
          {trendG7.length > 0 && <span className="ml-1 text-[10px]" style={{ color: COLORS.baldurBlue }}> \uD83C\uDF10 G7</span>}
        </span>
        {conv.conviction > 0 && (
          <span className="text-xs font-mono w-8 text-right font-bold" style={{ color: convColor }}>{conv.conviction}</span>
        )}
        <span className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ color: phaseColor }}>{t.phase}</span>
        <span className="text-xs font-mono w-8 text-right" style={{ color: COLORS.iceWhite }}>{t.maturity}</span>
        <span className="text-xs font-mono w-10 text-right" style={{ color: t.momentum > 60 ? COLORS.signalGreen : COLORS.signalYellow }}>
          {t.momentum} {velArrow}
        </span>
        <span className="text-xs font-mono w-8 text-right"
          style={{ color: isInflection ? COLORS.signalYellow : COLORS.iceWhite, fontWeight: isInflection ? 'bold' : 'normal' }}>
          {t.inflection_score}{isInflection ? ' \u26A1' : ''}
        </span>
        <span className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ color: statusColor }}>{t.status}</span>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 pt-1 space-y-3" style={{ backgroundColor: '#0A1628' }}>
          {t.headline && <p className="text-sm italic" style={{ color: COLORS.iceWhite }}>{t.headline}</p>}

          {/* Conviction Breakdown */}
          {conv.conviction > 0 && (
            <div>
              <div className="text-xs font-bold mb-1" style={{ color: convColor }}>
                Conviction: {conv.conviction} &mdash; {conv.label}
              </div>
              <div className="flex h-3 rounded overflow-hidden bg-[#1E3A5F]">
                <div style={{ width: `${(conv.components?.momentum_contrib || 0)}%`, backgroundColor: COLORS.baldurBlue }} title="Momentum" />
                <div style={{ width: `${(conv.components?.inflection_contrib || 0)}%`, backgroundColor: COLORS.signalYellow }} title="Inflection" />
                <div style={{ width: `${(conv.components?.crowding_inv_contrib || 0)}%`, backgroundColor: COLORS.signalGreen }} title="Crowding Inv" />
                <div style={{ width: `${(conv.components?.regime_fit_contrib || 0)}%`, backgroundColor: COLORS.signalOrange }} title="Regime Fit" />
              </div>
              <div className="flex gap-3 mt-1 text-[10px]" style={{ color: COLORS.mutedBlue }}>
                <span><span style={{ color: COLORS.baldurBlue }}>{'\u25A0'}</span> Mom {conv.components?.momentum_contrib?.toFixed(1)}</span>
                <span><span style={{ color: COLORS.signalYellow }}>{'\u25A0'}</span> Infl {conv.components?.inflection_contrib?.toFixed(1)}</span>
                <span><span style={{ color: COLORS.signalGreen }}>{'\u25A0'}</span> Crowd {conv.components?.crowding_inv_contrib?.toFixed(1)}</span>
                <span><span style={{ color: COLORS.signalOrange }}>{'\u25A0'}</span> Regime {conv.components?.regime_fit_contrib?.toFixed(1)}</span>
              </div>
              {conv.regime_fit_reason && (
                <div className="text-[10px] mt-1 italic" style={{ color: COLORS.mutedBlue }}>{conv.regime_fit_reason}</div>
              )}
            </div>
          )}

          {/* Asymmetric Payoff */}
          {payoffData && (
            <div>
              <div className="text-xs font-bold mb-1" style={{ color: COLORS.iceWhite }}>
                PAYOFF ASYMMETRIE: <span style={{ color: getAsymmetryColor(payoffData.ratio) }}>{payoffData.ratio?.toFixed(1)} : 1</span>
                {' '}<span className="px-1 py-0.5 rounded text-[10px]"
                  style={{ color: ASYMMETRY_LABEL_COLORS[payoffData.ratio_label] || COLORS.mutedBlue }}>
                  {payoffData.ratio_label}
                </span>
              </div>
              {/* Asymmetrie-Bar */}
              <div className="flex items-center h-5 rounded overflow-hidden bg-[#1E3A5F]">
                <div className="h-full flex items-center justify-end pr-1 text-[9px] font-mono"
                  style={{ width: `${Math.min(50, Math.abs(payoffData.bear_return_pct || 0))}%`, backgroundColor: `${COLORS.signalRed}60`, color: COLORS.iceWhite }}>
                  {payoffData.bear_return_pct}%
                </div>
                <div className="w-px h-full" style={{ backgroundColor: COLORS.iceWhite }} />
                <div className="h-full flex items-center pl-1 text-[9px] font-mono"
                  style={{ width: `${Math.min(50, Math.abs(payoffData.bull_return_pct || 0))}%`, backgroundColor: `${COLORS.signalGreen}60`, color: COLORS.iceWhite }}>
                  +{payoffData.bull_return_pct}%
                </div>
              </div>
              {/* Szenarien */}
              <div className="mt-1 space-y-0.5 text-[10px]">
                <div style={{ color: COLORS.signalGreen }}>
                  {'\uD83D\uDFE2'} Bull ({payoffData.probability_bull}%): {payoffData.bull_scenario}
                </div>
                <div style={{ color: COLORS.mutedBlue }}>
                  {'\u26AA'} Base ({payoffData.probability_base}%): {payoffData.base_scenario}
                </div>
                <div style={{ color: COLORS.signalRed }}>
                  {'\uD83D\uDD34'} Bear ({payoffData.probability_bear}%): {payoffData.bear_scenario}
                </div>
              </div>
              {/* Expected Value */}
              {payoffData.probability_bull && payoffData.probability_bear && payoffData.probability_base && (
                <div className="text-[10px] mt-1" style={{ color: COLORS.mutedBlue }}>
                  Expected Value:{' '}
                  {(() => {
                    const baseMid = (payoffData.bull_return_pct + payoffData.bear_return_pct) / 2;
                    const ev = (payoffData.probability_bull / 100 * payoffData.bull_return_pct)
                      + (payoffData.probability_base / 100 * baseMid)
                      + (payoffData.probability_bear / 100 * payoffData.bear_return_pct);
                    return <span style={{ color: ev >= 0 ? COLORS.signalGreen : COLORS.signalRed, fontWeight: 'bold' }}>{ev >= 0 ? '+' : ''}{ev.toFixed(1)}%</span>;
                  })()}
                </div>
              )}
            </div>
          )}

          {/* Bull / Bear Cases */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {t.bull_case && (
              <div className="p-2 rounded border border-[#1E3A5F]">
                <div className="text-xs font-bold mb-1" style={{ color: COLORS.signalGreen }}>BULL CASE</div>
                <p className="text-xs" style={{ color: COLORS.iceWhite }}>{t.bull_case}</p>
              </div>
            )}
            {t.bear_case && (
              <div className="p-2 rounded border border-[#1E3A5F]">
                <div className="text-xs font-bold mb-1" style={{ color: COLORS.signalRed }}>BEAR CASE</div>
                <p className="text-xs" style={{ color: COLORS.iceWhite }}>{t.bear_case}</p>
              </div>
            )}
          </div>

          {/* Scores Grid */}
          <div className="flex flex-wrap gap-3 text-xs" style={{ color: COLORS.mutedBlue }}>
            <span>Relevance: <span style={{ color: COLORS.iceWhite }}>{t.relevance}</span></span>
            <span>Hype: <span style={{ color: COLORS.iceWhite }}>{t.hype}</span></span>
            <span>Crowding: <span style={{ color: COLORS.iceWhite }}>{t.crowding}</span></span>
            <span>Acceleration: <span style={{ color: COLORS.iceWhite }}>{t.acceleration}</span></span>
            <span>Velocity: <span style={{ color: COLORS.iceWhite }}>{t.velocity}</span></span>
            {t.model_risk && t.model_risk !== 'NONE' && (
              <span>Model Risk: <span style={{ color: COLORS.signalOrange }}>{t.model_risk}</span></span>
            )}
          </div>

          {/* Top ETF + Historical Analogy */}
          <div className="flex flex-wrap gap-4 text-xs" style={{ color: COLORS.mutedBlue }}>
            {t.top_etf && <span>Top ETF: <span className="font-mono" style={{ color: COLORS.baldurBlue }}>{t.top_etf}</span></span>}
            {t.historical_analogy && <span>Analogie: <span style={{ color: COLORS.iceWhite }}>{t.historical_analogy}</span></span>}
          </div>

          {/* G7 Cross-References */}
          {trendG7.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs font-bold" style={{ color: COLORS.baldurBlue }}>{'\uD83C\uDF10'} G7 Verbindungen</div>
              {trendG7.map((ref, i) => (
                <div key={i} className="text-[10px] pl-2 border-l-2" style={{ borderColor: G7_RELATIONSHIP_COLORS[ref.relationship] || COLORS.mutedBlue }}>
                  <span style={{ color: G7_RELATIONSHIP_COLORS[ref.relationship] }}>{ref.relationship}</span>
                  {' '}<span style={{ color: COLORS.iceWhite }}>{ref.g7_event_title}</span>
                  {' '}<span style={{ color: COLORS.mutedBlue }}>({ref.g7_country})</span>
                  {ref.description && <div className="mt-0.5" style={{ color: COLORS.mutedBlue }}>{ref.description}</div>}
                </div>
              ))}
            </div>
          )}

          {/* Exposure */}
          {typeof t.portfolio_exposure_pct === 'number' && (
            <div className="text-xs" style={{ color: COLORS.mutedBlue }}>
              Portfolio Exposure:{' '}
              <span style={{ color: t.is_blind_spot ? COLORS.signalRed : COLORS.iceWhite }}>
                {(t.portfolio_exposure_pct * 100).toFixed(1)}%{t.is_blind_spot && ' \u2014 BLIND SPOT'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// REGIME HEATMAP
// ═══════════════════════════════════════════════════════
function RegimeHeatmap({ heatmap }) {
  if (!heatmap || !heatmap.matrix) return null;
  const regimes = heatmap.regimes || ['EXPANSION', 'TRANSITION', 'CONTRACTION', 'CRISIS'];
  const current = heatmap.current_regime;
  const entries = Object.entries(heatmap.matrix);

  function getCellColor(score) {
    if (score >= 70) return COLORS.signalGreen;
    if (score >= 50) return COLORS.signalYellow;
    if (score >= 30) return COLORS.signalOrange;
    return COLORS.signalRed;
  }

  return (
    <div className="rounded-lg border border-[#1E3A5F] p-3" style={{ backgroundColor: '#0D1B2A' }}>
      <div className="text-sm font-bold mb-2" style={{ color: COLORS.iceWhite }}>REGIME-OVERLAY HEATMAP</div>
      <div className="overflow-x-auto">
        <table className="w-full text-[10px]">
          <thead>
            <tr>
              <th className="text-left py-1 pr-2" style={{ color: COLORS.fadedBlue }}>Trend</th>
              {regimes.map(r => (
                <th key={r} className="text-center py-1 px-2" style={{
                  color: r === current ? COLORS.iceWhite : COLORS.fadedBlue,
                  backgroundColor: r === current ? `${REGIME_COLORS[r]}20` : 'transparent',
                  fontWeight: r === current ? 'bold' : 'normal',
                }}>{r}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.map(([tid, data]) => (
              <tr key={tid} className="border-t border-[#1E3A5F]/50">
                <td className="py-1 pr-2 font-mono" style={{ color: COLORS.iceWhite }}>{tid} {data.name}</td>
                {regimes.map(r => {
                  const score = data.scores?.[r] || 0;
                  const isCurrent = r === current;
                  return (
                    <td key={r} className="text-center py-1 px-2 font-mono"
                      style={{
                        color: getCellColor(score),
                        backgroundColor: isCurrent ? `${REGIME_COLORS[r]}10` : 'transparent',
                        fontWeight: isCurrent ? 'bold' : 'normal',
                      }}>{score}</td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="text-[10px] mt-2 text-center" style={{ color: COLORS.fadedBlue }}>
        Aktuelles Regime: <span style={{ color: REGIME_COLORS[current] || COLORS.signalYellow, fontWeight: 'bold' }}>{current}</span> (hervorgehobene Spalte)
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// CROWDING vs MOMENTUM SCATTER (SVG)
// ═══════════════════════════════════════════════════════
function CrowdingMomentumScatter({ trends }) {
  const activeTrends = trends.filter(t => t.status === 'ACTIVE' || t.status === 'WATCH');
  if (activeTrends.length === 0) return null;

  const w = 300, h = 200;
  const pad = 30;

  return (
    <div className="rounded-lg border border-[#1E3A5F] p-3" style={{ backgroundColor: '#0D1B2A' }}>
      <div className="text-sm font-bold mb-2" style={{ color: COLORS.iceWhite }}>CROWDING vs. MOMENTUM</div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ maxHeight: 220 }}>
        {/* Quadranten */}
        <rect x={pad} y={pad} width={(w - 2 * pad) / 2} height={(h - 2 * pad) / 2} fill={`${COLORS.signalRed}08`} />
        <rect x={pad + (w - 2 * pad) / 2} y={pad} width={(w - 2 * pad) / 2} height={(h - 2 * pad) / 2} fill={`${COLORS.signalOrange}08`} />
        <rect x={pad} y={pad + (h - 2 * pad) / 2} width={(w - 2 * pad) / 2} height={(h - 2 * pad) / 2} fill={`${COLORS.fadedBlue}08`} />
        <rect x={pad + (w - 2 * pad) / 2} y={pad + (h - 2 * pad) / 2} width={(w - 2 * pad) / 2} height={(h - 2 * pad) / 2} fill={`${COLORS.signalGreen}08`} />
        {/* Quadrant Labels */}
        <text x={pad + 4} y={pad + 12} fontSize="7" fill={COLORS.signalRed} opacity="0.5">EXIT ZONE</text>
        <text x={w - pad - 4} y={pad + 12} fontSize="7" fill={COLORS.signalOrange} opacity="0.5" textAnchor="end">CROWDING RISK</text>
        <text x={pad + 4} y={h - pad - 4} fontSize="7" fill={COLORS.fadedBlue} opacity="0.5">DORMANT</text>
        <text x={w - pad - 4} y={h - pad - 4} fontSize="7" fill={COLORS.signalGreen} opacity="0.5" textAnchor="end">SWEET SPOT</text>
        {/* Achsen */}
        <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke={COLORS.fadedBlue} strokeWidth="0.5" />
        <line x1={pad} y1={pad} x2={pad} y2={h - pad} stroke={COLORS.fadedBlue} strokeWidth="0.5" />
        <text x={w / 2} y={h - 4} fontSize="7" fill={COLORS.fadedBlue} textAnchor="middle">Momentum &rarr;</text>
        <text x={4} y={h / 2} fontSize="7" fill={COLORS.fadedBlue} textAnchor="middle" transform={`rotate(-90, 8, ${h / 2})`}>Crowding &rarr;</text>
        {/* Mittellinien */}
        <line x1={pad + (w - 2 * pad) / 2} y1={pad} x2={pad + (w - 2 * pad) / 2} y2={h - pad} stroke={COLORS.fadedBlue} strokeWidth="0.3" strokeDasharray="3,3" />
        <line x1={pad} y1={pad + (h - 2 * pad) / 2} x2={w - pad} y2={pad + (h - 2 * pad) / 2} stroke={COLORS.fadedBlue} strokeWidth="0.3" strokeDasharray="3,3" />
        {/* Danger Zone (Crowding >75) */}
        <rect x={pad} y={pad} width={w - 2 * pad} height={(h - 2 * pad) * 0.25} fill={COLORS.signalRed} opacity="0.05" />
        {/* Dots */}
        {activeTrends.map((t) => {
          const cx = pad + (t.momentum / 100) * (w - 2 * pad);
          const cy = h - pad - (t.crowding / 100) * (h - 2 * pad);
          const r = 6;
          const dotColor = DISRUPTION_PHASE_COLORS[t.phase] || COLORS.mutedBlue;
          return (
            <g key={t.id}>
              <circle cx={cx} cy={cy} r={r} fill={dotColor} opacity="0.8" stroke={DISRUPTION_STATUS_COLORS[t.status]} strokeWidth="1.5" />
              <text x={cx} y={cy - r - 2} fontSize="7" fill={COLORS.iceWhite} textAnchor="middle">{t.id}</text>
            </g>
          );
        })}
      </svg>
      <div className="text-[10px] mt-1 text-center" style={{ color: COLORS.fadedBlue }}>
        Sweet Spot: Hohe Momentum + Niedrige Crowding (rechts unten)
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════
export default function DisruptionsDetail({ dashboard }) {
  const [expandedTrend, setExpandedTrend] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [view, setView] = useState('scurve');
  const [briefingOpen, setBriefingOpen] = useState(true);
  const [openSections, setOpenSections] = useState({ 0: true });
  const [dmSort, setDmSort] = useState('asymmetry');
  const [convergenceOpen, setConvergenceOpen] = useState(false);

  const dis = dashboard?.disruptions;
  if (!dis) {
    return (
      <div className="text-center py-12" style={{ color: COLORS.fadedBlue }}>
        <p className="text-lg">Disruptions Monitor</p>
        <p className="text-sm mt-2">Keine Daten verf&uuml;gbar. N&auml;chster Scan: Sonntag 07:00 UTC.</p>
      </div>
    );
  }

  const trends = dis.trends || [];
  const activeWatch = trends.filter(t => t.status === 'ACTIVE' || t.status === 'WATCH');
  const parkedArchived = trends.filter(t => t.status === 'PARKED' || t.status === 'ARCHIVED');
  const displayTrends = showAll ? trends : activeWatch;
  const blindSpots = dis.blind_spots || [];
  const threats = dis.threats || [];
  const contrarian = dis.contrarian_alerts || [];
  const causalChains = dis.causal_chains_highlights || [];
  const dependencies = dis.dependencies_highlight || [];
  const modelRisks = dis.model_risk_alerts || [];
  const convergenceZones = dis.convergence_zones || [];
  const meta = dis.meta || {};

  // Phase A Daten
  const briefing = dis.briefing;
  const decisionMatrix = dis.decision_matrix || [];
  const regimeContext = dis.regime_context;
  const convictionScores = dis.conviction_scores || {};
  const payoffs = dis.asymmetric_payoffs || {};
  const crowdingAlerts = dis.crowding_alerts || [];
  const vulnerabilityWatchlist = dis.vulnerability_watchlist || [];
  const regimeHeatmap = dis.regime_heatmap;
  const g7CrossRefs = dis.g7_cross_references || [];

  const readinessColor = getReadinessColor(dis.readiness_score);

  // Decision Matrix sortieren
  const sortedDM = [...decisionMatrix].sort((a, b) => {
    if (dmSort === 'conviction') return (b.conviction || 0) - (a.conviction || 0);
    return (b.asymmetry || 0) - (a.asymmetry || 0);
  });

  const toggleSection = (idx) => setOpenSections(prev => ({ ...prev, [idx]: !prev[idx] }));

  return (
    <div className="space-y-4">

      {/* ══════ SEKTION 0: CONVERGENCE BANNER ══════ */}
      {dis.convergence_active && convergenceZones.length > 0 && (
        <div className="rounded-lg border" style={{ backgroundColor: `${COLORS.signalGreen}15`, borderColor: `${COLORS.signalGreen}40` }}>
          <button onClick={() => setConvergenceOpen(!convergenceOpen)}
            className="w-full p-3 flex items-center gap-2 text-left">
            <span className="text-lg">{'\uD83D\uDFE2'}</span>
            <div className="flex-1">
              <div className="text-sm font-bold" style={{ color: COLORS.signalGreen }}>
                CONVERGENCE ZONE {convergenceOpen ? '\u25B2' : '\u25BC'}
              </div>
              {convergenceZones.map((cz, i) => (
                <div key={i} className="text-xs mt-0.5" style={{ color: COLORS.iceWhite }}>
                  {cz.description || cz.trends?.join(' + ')}
                </div>
              ))}
            </div>
          </button>
          {/* Second Order Effects Detail */}
          {convergenceOpen && convergenceZones.some(z => z.second_order_effects?.length > 0) && (
            <div className="px-3 pb-3 space-y-3">
              {convergenceZones.filter(z => z.second_order_effects?.length > 0).map((z, zi) => (
                <div key={zi} className="border-t border-[#1E3A5F]/50 pt-2">
                  <div className="text-xs font-bold mb-1" style={{ color: COLORS.iceWhite }}>
                    {z.trends?.join(' + ')}
                  </div>
                  {/* Primary Effects */}
                  {z.primary_effects?.length > 0 && (
                    <div className="mb-2">
                      <div className="text-[10px] font-bold mb-0.5" style={{ color: COLORS.mutedBlue }}>DIREKTE EFFEKTE</div>
                      {z.primary_effects.map((pe, pi) => (
                        <div key={pi} className="text-[10px] flex items-center gap-1">
                          <span className="font-mono" style={{ color: COLORS.baldurBlue }}>{pe.asset}</span>
                          <span style={{ color: EFFECT_DIRECTION_DISPLAY[pe.direction]?.color }}>
                            {EFFECT_DIRECTION_DISPLAY[pe.direction]?.arrow}
                          </span>
                          <span style={{ color: COLORS.iceWhite }}>{pe.mechanism}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Second Order Effects */}
                  <div className="text-[10px] font-bold mb-0.5" style={{ color: COLORS.baldurBlue }}>ZWEITRUNDENEFFEKTE</div>
                  {z.second_order_effects.map((soe, si) => (
                    <div key={si} className="pl-2 py-1 mb-1 border-l-2 text-[10px]"
                      style={{ borderColor: EFFECT_DIRECTION_DISPLAY[soe.direction]?.color || COLORS.mutedBlue }}>
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="font-mono font-bold" style={{ color: COLORS.baldurBlue }}>{soe.asset}</span>
                        <span style={{ color: EFFECT_DIRECTION_DISPLAY[soe.direction]?.color }}>
                          {EFFECT_DIRECTION_DISPLAY[soe.direction]?.arrow} {soe.direction}
                        </span>
                        <span className="px-1 rounded" style={{ color: CONFIDENCE_COLORS[soe.confidence], backgroundColor: `${CONFIDENCE_COLORS[soe.confidence]}15` }}>
                          {soe.confidence}
                        </span>
                        <span className="font-mono" style={{ color: COLORS.signalYellow }}>{soe.timeframe}</span>
                      </div>
                      <div style={{ color: COLORS.iceWhite }}>{soe.mechanism}</div>
                    </div>
                  ))}
                  {/* Net Portfolio Impact */}
                  {z.net_portfolio_impact && (
                    <div className="mt-1 p-2 rounded text-[10px] font-bold" style={{
                      backgroundColor: z.net_portfolio_impact.toLowerCase().includes('negativ') ? `${COLORS.signalRed}15` : `${COLORS.signalGreen}15`,
                      color: z.net_portfolio_impact.toLowerCase().includes('negativ') ? COLORS.signalRed : COLORS.signalGreen,
                    }}>
                      {z.net_portfolio_impact}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════ SEKTION 1: BRIEFING CARD ══════ */}
      {briefing && (
        <div className="rounded-lg border border-[#1E3A5F]" style={{ backgroundColor: '#0D1B2A' }}>
          <button onClick={() => setBriefingOpen(!briefingOpen)}
            className="w-full p-4 flex items-start justify-between text-left">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs" style={{ color: COLORS.fadedBlue }}>{'\uD83D\uDCCB'} WEEKLY INTELLIGENCE BRIEFING &mdash; {briefing.date}</span>
                {briefingOpen ? <span className="text-xs" style={{ color: COLORS.fadedBlue }}>{'\u25B2'}</span> : <span className="text-xs" style={{ color: COLORS.fadedBlue }}>{'\u25BC'}</span>}
              </div>
              <div className="text-lg font-bold" style={{ color: COLORS.iceWhite }}>{briefing.headline}</div>
              {/* Key Changes */}
              {briefing.key_changes_this_week?.length > 0 && (
                <div className="mt-2 space-y-0.5">
                  {briefing.key_changes_this_week.map((change, i) => {
                    const isUp = change.includes('hochgestuft') || change.includes('ACTIVE') || change.includes('+');
                    const isDown = change.includes('Verlust') || change.includes('-') || change.includes('herabgestuft');
                    const prefix = isUp ? '\u2191' : isDown ? '\u2193' : '\u25CF';
                    const prefixColor = isUp ? COLORS.signalGreen : isDown ? COLORS.signalRed : COLORS.signalYellow;
                    return (
                      <div key={i} className="text-xs" style={{ color: COLORS.iceWhite }}>
                        <span style={{ color: prefixColor }}>{prefix}</span> {change}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <RegimeBadge regimeContext={regimeContext} />
          </button>
          {/* Sections Accordion */}
          {briefingOpen && briefing.sections?.length > 0 && (
            <div className="px-4 pb-4 space-y-1">
              {briefing.sections.map((sec, i) => (
                <div key={i} className="border border-[#1E3A5F]/50 rounded">
                  <button onClick={() => toggleSection(i)}
                    className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-[#1E3A5F]/20 transition-colors">
                    <span className="text-[10px]" style={{ color: COLORS.fadedBlue }}>{openSections[i] ? '\u25BC' : '\u25B6'}</span>
                    <span className="text-sm font-bold" style={{ color: COLORS.baldurBlue }}>{sec.title}</span>
                  </button>
                  {openSections[i] && (
                    <div className="px-3 pb-3 text-sm leading-relaxed" style={{ color: COLORS.iceWhite }}>
                      {sec.content}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════ SEKTION 2: DECISION MATRIX ══════ */}
      {sortedDM.length > 0 && (
        <div className="rounded-lg border border-[#1E3A5F] overflow-hidden" style={{ backgroundColor: '#0D1B2A' }}>
          <div className="flex items-center justify-between px-3 py-2 border-b border-[#1E3A5F]">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold" style={{ color: COLORS.iceWhite }}>{'\u2694\uFE0F'} DECISION MATRIX</span>
              <RegimeBadge regimeContext={regimeContext} />
            </div>
            <div className="flex gap-1">
              <button onClick={() => setDmSort('asymmetry')}
                className="text-[10px] px-2 py-0.5 rounded"
                style={{ color: dmSort === 'asymmetry' ? COLORS.baldurBlue : COLORS.fadedBlue, backgroundColor: dmSort === 'asymmetry' ? '#1E3A5F' : 'transparent' }}>
                Asymmetrie
              </button>
              <button onClick={() => setDmSort('conviction')}
                className="text-[10px] px-2 py-0.5 rounded"
                style={{ color: dmSort === 'conviction' ? COLORS.baldurBlue : COLORS.fadedBlue, backgroundColor: dmSort === 'conviction' ? '#1E3A5F' : 'transparent' }}>
                Conviction
              </button>
            </div>
          </div>
          {/* Regime Warning */}
          {regimeContext && regimeContext.regime_rules?.sizing_multiplier < 1 && (
            <div className="px-3 py-1.5 text-xs border-b border-[#1E3A5F]" style={{
              backgroundColor: regimeContext.regime_rules.sizing_multiplier === 0 ? `${COLORS.signalRed}15` : `${COLORS.signalYellow}15`,
              color: regimeContext.regime_rules.sizing_multiplier === 0 ? COLORS.signalRed : COLORS.signalYellow,
            }}>
              {regimeContext.regime_rules.sizing_multiplier === 0
                ? '\uD83D\uDED1 CRISIS REGIME \u2014 Keine neuen Disruption-Trades empfohlen.'
                : `\u26A0 ${regimeContext.current_regime} \u2014 Sizing automatisch auf ${regimeContext.regime_rules.sizing_multiplier * 100}% reduziert.`}
            </div>
          )}
          {/* Table Header */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 text-[10px] uppercase tracking-wider border-b border-[#1E3A5F]" style={{ color: COLORS.fadedBlue }}>
            <span className="flex-1">Trend</span>
            <span className="w-10 text-center">Conv</span>
            <span className="w-12 text-center">Asym</span>
            <span className="w-10 text-center">Time</span>
            <span className="w-12 text-center">Instr</span>
            <span className="w-16 text-center">Size</span>
            <span className="flex-1">Trigger</span>
            <span className="w-16 text-center">Status</span>
          </div>
          {/* Rows */}
          {sortedDM.map((dm, i) => {
            const convColor = CONVICTION_COLORS[dm.conviction_label] || COLORS.mutedBlue;
            const asymColor = getAsymmetryColor(dm.asymmetry || 0);
            const statusColor = DECISION_STATUS_COLORS[dm.status] || COLORS.mutedBlue;
            const isAdjusted = dm.sizing_regime_adjusted_pct !== dm.sizing_hint_pct;
            return (
              <div key={i} className="border-b border-[#1E3A5F]/50">
                {/* Desktop Row */}
                <div className="hidden lg:flex items-center gap-2 px-3 py-2 text-xs hover:bg-[#0A1628]/50">
                  <span className="flex-1 font-medium truncate" style={{ color: COLORS.iceWhite }}>{dm.trend_id} {dm.trend_name}</span>
                  <span className="w-10 text-center font-mono font-bold" style={{ color: convColor }}>{dm.conviction}</span>
                  <span className="w-12 text-center font-mono" style={{ color: asymColor }}>{dm.asymmetry?.toFixed(1)}:1</span>
                  <span className="w-10 text-center font-mono" style={{ color: COLORS.mutedBlue }}>{dm.timeframe}</span>
                  <span className="w-12 text-center font-mono" style={{ color: COLORS.baldurBlue }}>{dm.instrument}</span>
                  <span className="w-16 text-center font-mono">
                    {isAdjusted ? (
                      <span>
                        <span style={{ color: COLORS.fadedBlue, textDecoration: 'line-through' }}>{dm.sizing_hint_pct}%</span>
                        {' '}<span style={{ color: COLORS.signalYellow, fontWeight: 'bold' }}>{dm.sizing_regime_adjusted_pct}%</span>
                      </span>
                    ) : (
                      <span style={{ color: COLORS.iceWhite }}>{dm.sizing_hint_pct}%</span>
                    )}
                  </span>
                  <span className="flex-1 truncate" style={{ color: COLORS.mutedBlue }}>{dm.trigger_event}</span>
                  <span className="w-16 text-center px-1.5 py-0.5 rounded text-[10px] font-bold"
                    style={{ color: statusColor, backgroundColor: `${statusColor}15` }}>
                    {dm.status === 'WATCH_FOR_TRIGGER' ? 'WATCH' : dm.status}
                  </span>
                </div>
                {/* Mobile Card */}
                <div className="lg:hidden p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium" style={{ color: COLORS.iceWhite }}>{dm.trend_id} {dm.trend_name}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                      style={{ color: statusColor, backgroundColor: `${statusColor}15` }}>
                      {dm.status === 'WATCH_FOR_TRIGGER' ? 'WATCH' : dm.status}
                    </span>
                  </div>
                  <div className="flex gap-3 text-xs">
                    <span style={{ color: convColor }}>Conv: {dm.conviction}</span>
                    <span style={{ color: asymColor }}>Asym: {dm.asymmetry?.toFixed(1)}:1</span>
                    <span className="font-mono" style={{ color: COLORS.baldurBlue }}>{dm.instrument}</span>
                    <span style={{ color: COLORS.signalYellow }}>{dm.sizing_regime_adjusted_pct || dm.sizing_hint_pct}%</span>
                  </div>
                  <div className="text-[10px]" style={{ color: COLORS.mutedBlue }}>{dm.trigger_event}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ══════ SEKTION 3: READINESS SCORE ══════ */}
      <div className="rounded-lg p-4 border border-[#1E3A5F]" style={{ backgroundColor: '#0D1B2A' }}>
        <div className="flex items-baseline gap-3">
          <span className="text-xs uppercase tracking-wider" style={{ color: COLORS.fadedBlue }}>Disruption Readiness</span>
          <span className="text-3xl font-bold font-mono" style={{ color: readinessColor }}>{dis.readiness_score}</span>
          <span className="text-sm font-mono" style={{ color: readinessColor }}>{dis.readiness_label}</span>
          {regimeContext && <RegimeBadge regimeContext={regimeContext} />}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs" style={{ color: COLORS.mutedBlue }}>
          <span><span style={{ color: COLORS.signalGreen }}>{dis.active_trends_count}</span> Active</span>
          <span><span style={{ color: COLORS.signalYellow }}>{dis.watch_trends_count}</span> Watch</span>
          <span><span style={{ color: blindSpots.length > 0 ? COLORS.signalRed : COLORS.iceWhite }}>{dis.blind_spots_count}</span> Blind Spots</span>
          <span><span style={{ color: threats.length > 0 ? COLORS.signalOrange : COLORS.iceWhite }}>{dis.threats_count}</span> Threats</span>
          <span><span style={{ color: dis.convergence_active ? COLORS.signalGreen : COLORS.iceWhite }}>{convergenceZones.length}</span> Convergence</span>
        </div>
      </div>

      {/* ══════ SEKTION 4: REGIME HEATMAP ══════ */}
      {regimeHeatmap && <RegimeHeatmap heatmap={regimeHeatmap} />}

      {/* ══════ SEKTION 5: CROWDING vs MOMENTUM SCATTER ══════ */}
      <CrowdingMomentumScatter trends={trends} />

      {/* ══════ SEKTION 6: S-KURVE / NETZWERK ══════ */}
      <div className="rounded-lg border border-[#1E3A5F] overflow-hidden" style={{ backgroundColor: '#0D1B2A' }}>
        <div className="flex border-b border-[#1E3A5F]">
          <button onClick={() => setView('scurve')}
            className="flex-1 py-2 text-xs font-medium text-center transition-colors"
            style={{ color: view === 'scurve' ? COLORS.baldurBlue : COLORS.fadedBlue, backgroundColor: view === 'scurve' ? '#1E3A5F' : 'transparent' }}>
            S-Kurve
          </button>
          <button onClick={() => setView('network')}
            className="flex-1 py-2 text-xs font-medium text-center transition-colors"
            style={{ color: view === 'network' ? COLORS.baldurBlue : COLORS.fadedBlue, backgroundColor: view === 'network' ? '#1E3A5F' : 'transparent' }}>
            Netzwerk
          </button>
        </div>
        <div className="p-3">
          {view === 'scurve' ? (
            <SCurveChart trends={trends} />
          ) : (
            <div className="space-y-2">
              {dependencies.length > 0 ? dependencies.map((dep, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="font-mono font-bold" style={{ color: COLORS.baldurBlue }}>{dep.from}</span>
                  <span style={{ color: COLORS.fadedBlue }}>{'\u2192'}</span>
                  <span className="font-mono font-bold" style={{ color: COLORS.baldurBlue }}>{dep.to}</span>
                  <span className="px-1 py-0.5 rounded text-[10px]" style={{
                    color: dep.type === 'THREATENS' ? COLORS.signalRed : COLORS.signalGreen,
                    backgroundColor: dep.type === 'THREATENS' ? `${COLORS.signalRed}15` : `${COLORS.signalGreen}15`,
                  }}>{dep.type}</span>
                  <span className="flex-1 truncate" style={{ color: COLORS.mutedBlue }}>{dep.description}</span>
                </div>
              )) : (
                <p className="text-xs" style={{ color: COLORS.fadedBlue }}>Keine Dependencies vorhanden.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ══════ SEKTION 7: TREND-TABELLE ══════ */}
      <div className="rounded-lg border border-[#1E3A5F] overflow-hidden" style={{ backgroundColor: '#0D1B2A' }}>
        <div className="flex items-center gap-2 px-3 py-2 text-[10px] uppercase tracking-wider border-b border-[#1E3A5F]" style={{ color: COLORS.fadedBlue }}>
          <span className="w-6" />
          <span className="flex-1">Trend</span>
          <span className="w-8 text-center">Conv</span>
          <span className="w-20 text-center">Phase</span>
          <span className="w-8 text-right">Mat</span>
          <span className="w-10 text-right">Mom</span>
          <span className="w-8 text-right">Infl</span>
          <span className="w-16 text-right">Status</span>
        </div>
        {displayTrends.map((t) => (
          <TrendRow key={t.id} trend={t}
            isExpanded={expandedTrend === t.id}
            onToggle={() => setExpandedTrend(expandedTrend === t.id ? null : t.id)}
            convictionData={convictionScores[t.id]}
            payoffData={payoffs[t.id]}
            g7Refs={g7CrossRefs}
          />
        ))}
        {parkedArchived.length > 0 && (
          <button onClick={() => setShowAll(!showAll)}
            className="w-full py-2 text-xs text-center hover:bg-[#1E3A5F]/30 transition-colors"
            style={{ color: COLORS.baldurBlue }}>
            {showAll ? 'Nur Active/Watch anzeigen' : `Alle anzeigen (+${parkedArchived.length} Parked/Archived)`}
          </button>
        )}
      </div>

      {/* ══════ SEKTION 8: BLIND SPOT ALERTS ══════ */}
      {blindSpots.length > 0 && (
        <div className="rounded-lg border p-3 space-y-3" style={{ backgroundColor: '#0D1B2A', borderColor: `${COLORS.signalRed}40` }}>
          <div className="text-sm font-bold" style={{ color: COLORS.signalRed }}>{'\u26A0'} BLIND SPOTS ({blindSpots.length})</div>
          {blindSpots.map((bs, i) => (
            <div key={i} className="pl-2 border-l-2" style={{ borderColor: COLORS.signalRed }}>
              <div className="text-sm font-medium" style={{ color: COLORS.iceWhite }}>
                {bs.category} {bs.name} &mdash; <span style={{ color: COLORS.signalRed }}>KEIN EXPOSURE ({((bs.exposure_pct || 0) * 100).toFixed(1)}%)</span>
              </div>
              {bs.urgency && (
                <div className="text-xs mt-0.5" style={{ color: COLORS.mutedBlue }}>
                  Urgency: <span style={{ color: bs.urgency === 'HIGH' ? COLORS.signalRed : COLORS.signalYellow }}>{bs.urgency}</span>
                </div>
              )}
              {bs.recommended_etfs?.length > 0 && (
                <div className="text-xs mt-0.5" style={{ color: COLORS.mutedBlue }}>
                  Empfohlene ETFs: <span className="font-mono" style={{ color: COLORS.baldurBlue }}>{bs.recommended_etfs.join(', ')}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ══════ SEKTION 9: CROWDING DANGER ALERTS ══════ */}
      {crowdingAlerts.length > 0 && (
        <div className="rounded-lg border p-3 space-y-3" style={{ backgroundColor: '#0D1B2A', borderColor: `${COLORS.signalOrange}40` }}>
          <div className="text-sm font-bold" style={{ color: COLORS.signalOrange }}>{'\uD83D\uDD25'} CROWDING DANGER ALERTS ({crowdingAlerts.length})</div>
          {crowdingAlerts.map((ca, i) => (
            <div key={i} className="pl-2 border-l-2" style={{ borderColor: CROWDING_ALERT_COLORS[ca.alert_level] || COLORS.signalOrange }}>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold" style={{ color: COLORS.iceWhite }}>{ca.trend_name}</span>
                <span className="text-lg font-mono font-bold" style={{ color: COLORS.signalRed }}>{ca.crowding}</span>
                <span className="text-xs" style={{ color: ca.momentum_4w_delta < 0 ? COLORS.signalRed : COLORS.signalYellow }}>
                  Mom {ca.momentum_4w_delta >= 0 ? '+' : ''}{ca.momentum_4w_delta}
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${ca.alert_level === 'DANGER' ? 'animate-pulse' : ''}`}
                  style={{ color: CROWDING_ALERT_COLORS[ca.alert_level], backgroundColor: `${CROWDING_ALERT_COLORS[ca.alert_level]}15` }}>
                  {ca.alert_level}
                </span>
              </div>
              {/* Crowding Gauge */}
              <div className="mt-1 h-2 rounded-full overflow-hidden bg-[#1E3A5F]">
                <div className="h-full rounded-full" style={{
                  width: `${ca.crowding}%`,
                  background: `linear-gradient(to right, ${COLORS.signalGreen}, ${COLORS.signalYellow} 50%, ${COLORS.signalRed})`,
                }} />
              </div>
              <div className="text-xs italic mt-1" style={{ color: COLORS.iceWhite }}>{ca.description}</div>
              {ca.recommendation && <div className="text-xs font-bold mt-0.5" style={{ color: COLORS.signalYellow }}>{ca.recommendation}</div>}
              {ca.historical_parallel && <div className="text-[10px] italic mt-0.5" style={{ color: COLORS.mutedBlue }}>{ca.historical_parallel}</div>}
            </div>
          ))}
        </div>
      )}

      {/* ══════ SEKTION 10: VULNERABILITY WATCHLIST ══════ */}
      {vulnerabilityWatchlist.length > 0 && (
        <div className="rounded-lg border p-3 space-y-3" style={{ backgroundColor: '#0D1B2A', borderColor: `${COLORS.signalOrange}40` }}>
          <div className="text-sm font-bold" style={{ color: COLORS.signalOrange }}>{'\uD83D\uDEE1\uFE0F'} VULNERABILITY WATCHLIST</div>
          <div className="text-xs" style={{ color: COLORS.mutedBlue }}>Assets in deinem Portfolio die durch Disruptions bedroht werden</div>
          {vulnerabilityWatchlist.map((v, i) => (
            <div key={i} className="pl-2 border-l-2 space-y-1" style={{ borderColor: DISRUPTION_THREAT_COLORS[v.aggregate_threat_level] || COLORS.signalOrange }}>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono font-bold" style={{ color: COLORS.iceWhite }}>{v.asset}</span>
                <span className="text-xs" style={{ color: COLORS.mutedBlue }}>{v.asset_name}</span>
                <span className="text-[10px] px-1 py-0.5 rounded font-mono" style={{ color: COLORS.signalYellow, backgroundColor: `${COLORS.signalYellow}15` }}>
                  {v.v16_weight_pct}% im Portfolio
                </span>
                <span className="text-[10px] px-1 py-0.5 rounded font-bold"
                  style={{ color: DISRUPTION_THREAT_COLORS[v.aggregate_threat_level], backgroundColor: `${DISRUPTION_THREAT_COLORS[v.aggregate_threat_level]}15` }}>
                  {v.aggregate_threat_level}
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {v.threatening_trends?.map((tt, ti) => (
                  <span key={ti} className="text-[10px] px-1.5 py-0.5 rounded" style={{ color: COLORS.iceWhite, backgroundColor: '#1E3A5F' }}>
                    {tt.trend_id} {tt.trend_name}
                    <span className="ml-1" style={{ color: CONFIDENCE_COLORS[tt.threat_confidence] }}>{tt.threat_confidence}</span>
                  </span>
                ))}
              </div>
              {v.recommendation && <div className="text-xs font-bold" style={{ color: COLORS.signalYellow }}>{v.recommendation}</div>}
              {v.hedge_instrument && <div className="text-xs font-mono" style={{ color: COLORS.baldurBlue }}>{v.hedge_instrument}</div>}
            </div>
          ))}
        </div>
      )}

      {/* ══════ SEKTION 11: THREAT MAP ══════ */}
      {threats.length > 0 && (
        <div className="rounded-lg border p-3 space-y-3" style={{ backgroundColor: '#0D1B2A', borderColor: `${COLORS.signalOrange}40` }}>
          <div className="text-sm font-bold" style={{ color: COLORS.signalOrange }}>{'\u26A0'} THREATS ({threats.length})</div>
          {threats.map((th, i) => (
            <div key={i} className="pl-2 border-l-2" style={{ borderColor: DISRUPTION_THREAT_COLORS[th.threat_level] || COLORS.signalOrange }}>
              <div className="text-sm font-medium" style={{ color: COLORS.iceWhite }}>
                {th.category} {th.name} {'\u2192'} {th.threatened_asset}
                {th.v16_weight && <span style={{ color: COLORS.mutedBlue }}> ({(th.v16_weight * 100).toFixed(1)}% im Portfolio)</span>}
              </div>
              <div className="text-xs mt-0.5" style={{ color: COLORS.mutedBlue }}>
                Threat Level: <span style={{ color: DISRUPTION_THREAT_COLORS[th.threat_level] || COLORS.signalYellow }}>{th.threat_level}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══════ SEKTION 12: G7 CROSS-REFERENCES ══════ */}
      {g7CrossRefs.length > 0 && (
        <div className="rounded-lg border border-[#1E3A5F] p-3 space-y-2" style={{ backgroundColor: '#0D1B2A' }}>
          <div className="text-sm font-bold" style={{ color: COLORS.baldurBlue }}>{'\uD83C\uDF10'} G7 CROSS-REFERENCES ({g7CrossRefs.length})</div>
          {g7CrossRefs.map((ref, i) => (
            <div key={i} className="flex items-center gap-2 text-xs flex-wrap">
              <span className="px-1.5 py-0.5 rounded font-mono" style={{ color: COLORS.signalYellow, backgroundColor: `${COLORS.signalYellow}15` }}>
                {ref.disruption_trend_id} {ref.disruption_trend_name}
              </span>
              <span style={{ color: G7_RELATIONSHIP_COLORS[ref.relationship] || COLORS.mutedBlue }}>{'\u2192'} {ref.relationship}</span>
              <span className="px-1.5 py-0.5 rounded" style={{ color: COLORS.baldurBlue, backgroundColor: `${COLORS.baldurBlue}15` }}>
                {ref.g7_country}: {ref.g7_event_title}
              </span>
              {ref.description && <div className="w-full text-[10px] pl-4" style={{ color: COLORS.mutedBlue }}>{ref.description}</div>}
              {ref.impact_on_portfolio && <div className="w-full text-[10px] pl-4" style={{ color: COLORS.iceWhite }}>{ref.impact_on_portfolio}</div>}
            </div>
          ))}
        </div>
      )}

      {/* ══════ SEKTION 13: CONTRARIAN ALERTS ══════ */}
      {contrarian.length > 0 && (
        <div className="rounded-lg border p-3 space-y-3" style={{ backgroundColor: '#0D1B2A', borderColor: `${COLORS.signalGreen}40` }}>
          <div className="text-sm font-bold" style={{ color: COLORS.signalGreen }}>{'\uD83D\uDFE2'} CONTRARIAN OPPORTUNITIES ({contrarian.length})</div>
          {contrarian.map((ca, i) => (
            <div key={i} className="pl-2 border-l-2" style={{ borderColor: DISRUPTION_ALERT_COLORS[ca.alert_level] || COLORS.mutedBlue }}>
              <div className="text-sm font-medium" style={{ color: COLORS.iceWhite }}>
                {ca.sector} (<span className="font-mono" style={{ color: COLORS.baldurBlue }}>{ca.etf}</span>)
                {' \u2014 '}<span style={{ color: DISRUPTION_ALERT_COLORS[ca.alert_level] || COLORS.mutedBlue }}>{ca.alert_level}</span>
              </div>
              <div className="text-xs mt-0.5" style={{ color: COLORS.mutedBlue }}>Tailwind: {ca.tailwind_source}</div>
              {ca.thesis_short && <div className="text-xs mt-0.5 italic" style={{ color: COLORS.iceWhite }}>{ca.thesis_short}</div>}
            </div>
          ))}
        </div>
      )}

      {/* ══════ SEKTION 14: CAUSAL CHAINS ══════ */}
      {causalChains.length > 0 && (
        <div className="rounded-lg border border-[#1E3A5F] p-3 space-y-2" style={{ backgroundColor: '#0D1B2A' }}>
          <div className="text-sm font-bold" style={{ color: COLORS.baldurBlue }}>CAUSAL CHAINS ({causalChains.length})</div>
          {causalChains.map((cc, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2 text-xs py-1 border-b border-[#1E3A5F] last:border-0">
              <span className="font-medium" style={{ color: COLORS.iceWhite }}>{cc.trend}</span>
              <span style={{ color: COLORS.fadedBlue }}>:</span>
              <span style={{ color: COLORS.mutedBlue }}>{cc.current_step}</span>
              <span style={{ color: COLORS.signalYellow }}>{'\u2192'}</span>
              <span style={{ color: COLORS.iceWhite }}>{cc.next_step}</span>
              <span className="text-[10px] px-1 py-0.5 rounded" style={{ color: COLORS.signalYellow, backgroundColor: `${COLORS.signalYellow}15` }}>{cc.timing}</span>
              {cc.instruments?.length > 0 && (
                <span className="font-mono" style={{ color: COLORS.baldurBlue }}>[{cc.instruments.join(', ')}]</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ══════ SEKTION 15: MODEL RISK ALERTS ══════ */}
      {modelRisks.length > 0 && (
        <div className="rounded-lg border border-[#1E3A5F] p-3 space-y-1" style={{ backgroundColor: '#0D1B2A' }}>
          <div className="text-sm font-bold" style={{ color: COLORS.signalOrange }}>MODEL RISK ({modelRisks.length})</div>
          {modelRisks.map((mr, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className="font-mono" style={{ color: COLORS.iceWhite }}>{mr.category}</span>
              <span style={{ color: COLORS.mutedBlue }}>{mr.name}</span>
              <span className="px-1 py-0.5 rounded text-[10px]" style={{
                color: mr.model_risk === 'PARADIGM' ? COLORS.signalRed : mr.model_risk === 'STRUCTURAL' ? COLORS.signalOrange : COLORS.signalYellow,
                backgroundColor: mr.model_risk === 'PARADIGM' ? `${COLORS.signalRed}15` : mr.model_risk === 'STRUCTURAL' ? `${COLORS.signalOrange}15` : `${COLORS.signalYellow}15`,
              }}>{mr.model_risk}</span>
            </div>
          ))}
        </div>
      )}

      {/* ══════ SEKTION 20: META ══════ */}
      <div className="text-xs text-center py-2" style={{ color: COLORS.fadedBlue }}>
        Letzter Scan: {dis.date}
        {meta.categories_scanned && ` \u2022 ${meta.categories_scanned} Kategorien`}
        {meta.sources_total && ` \u2022 ${meta.sources_total} Quellen`}
        {meta.avg_source_quality && ` \u2022 Avg Quality: ${meta.avg_source_quality}`}
        {meta.next_run && ` \u2022 N\u00E4chster Scan: ${meta.next_run}`}
      </div>
    </div>
  );
}
