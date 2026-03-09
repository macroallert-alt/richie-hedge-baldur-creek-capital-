'use client';

import { useState } from 'react';
import {
  COLORS,
  DISRUPTION_PHASE_COLORS,
  DISRUPTION_STATUS_COLORS,
  DISRUPTION_THREAT_COLORS,
  DISRUPTION_ALERT_COLORS,
  getReadinessColor,
} from '@/lib/constants';

// ═══════════════════════════════════════════════════════
// S-KURVE CHART (Recharts ScatterChart)
// ═══════════════════════════════════════════════════════
function SCurveChart({ trends }) {
  // Berechne S-Kurve Linie (Logistic)
  const curvePoints = [];
  for (let x = 0; x <= 100; x += 2) {
    const y = 100 / (1 + Math.exp(-0.08 * (x - 50)));
    curvePoints.push({ x, y });
  }

  // Inflection Zone: Maturity 25-45
  const inflectionLeft = 25;
  const inflectionRight = 45;

  const activeTrends = trends.filter(t => t.status === 'ACTIVE' || t.status === 'WATCH');

  return (
    <div className="relative w-full h-64 bg-[#0D1B2A] rounded-lg border border-[#1E3A5F] overflow-hidden">
      {/* Inflection Zone Background */}
      <div
        className="absolute top-0 bottom-0 opacity-10"
        style={{
          left: `${inflectionLeft}%`,
          width: `${inflectionRight - inflectionLeft}%`,
          backgroundColor: COLORS.signalYellow,
        }}
      />
      <div
        className="absolute top-1/2 text-xs opacity-30"
        style={{ left: `${(inflectionLeft + inflectionRight) / 2}%`, transform: 'translate(-50%, -50%)' }}
      >
        <span style={{ color: COLORS.signalYellow }}>INFLECTION ZONE</span>
      </div>

      {/* S-Kurve Linie via SVG */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polyline
          fill="none"
          stroke={COLORS.fadedBlue}
          strokeWidth="0.5"
          strokeDasharray="2,2"
          points={curvePoints.map(p => `${p.x},${100 - p.y}`).join(' ')}
        />
      </svg>

      {/* Trend Dots */}
      {activeTrends.map((t) => {
        const x = t.s_curve_x || t.maturity;
        const y = 100 / (1 + Math.exp(-0.08 * (x - 50)));
        const size = Math.max(8, Math.min(20, (t.relevance || 50) / 5));
        const momColor = t.momentum > 60 ? COLORS.signalGreen
          : t.momentum > 40 ? COLORS.signalYellow
          : COLORS.signalRed;

        return (
          <div
            key={t.id}
            className="absolute flex flex-col items-center"
            style={{
              left: `${x}%`,
              bottom: `${y}%`,
              transform: 'translate(-50%, 50%)',
            }}
          >
            <div
              className="rounded-full border-2"
              style={{
                width: size,
                height: size,
                backgroundColor: momColor,
                borderColor: DISRUPTION_STATUS_COLORS[t.status] || COLORS.mutedBlue,
                opacity: 0.9,
              }}
            />
            <span className="text-[9px] mt-0.5 whitespace-nowrap" style={{ color: COLORS.iceWhite }}>
              {t.id}
            </span>
          </div>
        );
      })}

      {/* Achsen Labels */}
      <div className="absolute bottom-1 left-1 text-[9px]" style={{ color: COLORS.fadedBlue }}>EMERGING</div>
      <div className="absolute bottom-1 right-1 text-[9px]" style={{ color: COLORS.fadedBlue }}>MAINSTREAM</div>
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px]" style={{ color: COLORS.fadedBlue }}>Maturity →</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// TREND ROW (aufklappbar)
// ═══════════════════════════════════════════════════════
function TrendRow({ trend, isExpanded, onToggle }) {
  const t = trend;
  const phaseColor = DISRUPTION_PHASE_COLORS[t.phase] || COLORS.mutedBlue;
  const statusColor = DISRUPTION_STATUS_COLORS[t.status] || COLORS.mutedBlue;
  const isInflection = t.inflection_score > 70;
  const velArrow = t.velocity === 'HIGH' ? '↑' : t.velocity === 'MEDIUM' ? '→' : '·';

  return (
    <div className="border-b border-[#1E3A5F]">
      {/* Header Row */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-[#0D1B2A]/50 transition-colors"
      >
        <span className="text-xs font-mono w-6" style={{ color: COLORS.fadedBlue }}>
          {isExpanded ? '▼' : '▶'}
        </span>
        <span className="text-sm font-medium flex-1 min-w-0 truncate" style={{ color: COLORS.iceWhite }}>
          {t.id} {t.name}
        </span>
        <span className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ color: phaseColor }}>
          {t.phase}
        </span>
        <span className="text-xs font-mono w-8 text-right" style={{ color: COLORS.iceWhite }}>
          {t.maturity}
        </span>
        <span className="text-xs font-mono w-10 text-right" style={{ color: t.momentum > 60 ? COLORS.signalGreen : COLORS.signalYellow }}>
          {t.momentum} {velArrow}
        </span>
        <span
          className="text-xs font-mono w-8 text-right"
          style={{
            color: isInflection ? COLORS.signalYellow : COLORS.iceWhite,
            fontWeight: isInflection ? 'bold' : 'normal',
          }}
        >
          {t.inflection_score}{isInflection ? ' ⚡' : ''}
        </span>
        <span
          className="text-xs px-1.5 py-0.5 rounded font-mono"
          style={{ color: statusColor }}
        >
          {t.status}
        </span>
      </button>

      {/* Expanded Detail */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-1 space-y-3" style={{ backgroundColor: '#0A1628' }}>
          {/* Headline */}
          {t.headline && (
            <p className="text-sm italic" style={{ color: COLORS.iceWhite }}>{t.headline}</p>
          )}

          {/* Bull / Bear */}
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
            {t.top_etf && (
              <span>Top ETF: <span className="font-mono" style={{ color: COLORS.baldurBlue }}>{t.top_etf}</span></span>
            )}
            {t.historical_analogy && (
              <span>Analogie: <span style={{ color: COLORS.iceWhite }}>{t.historical_analogy}</span></span>
            )}
          </div>

          {/* Exposure */}
          {typeof t.portfolio_exposure_pct === 'number' && (
            <div className="text-xs" style={{ color: COLORS.mutedBlue }}>
              Portfolio Exposure:{' '}
              <span style={{ color: t.is_blind_spot ? COLORS.signalRed : COLORS.iceWhite }}>
                {(t.portfolio_exposure_pct * 100).toFixed(1)}%
                {t.is_blind_spot && ' — BLIND SPOT'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════
export default function DisruptionsDetail({ dashboard }) {
  const [expandedTrend, setExpandedTrend] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [view, setView] = useState('scurve'); // 'scurve' | 'network'

  const dis = dashboard?.disruptions;
  if (!dis) {
    return (
      <div className="text-center py-12" style={{ color: COLORS.fadedBlue }}>
        <p className="text-lg">Disruptions Monitor</p>
        <p className="text-sm mt-2">Keine Daten verfügbar. Nächster Scan: Sonntag 07:00 UTC.</p>
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

  const readinessColor = getReadinessColor(dis.readiness_score);

  return (
    <div className="space-y-4">

      {/* ══════ SEKTION 0: CONVERGENCE BANNER ══════ */}
      {dis.convergence_active && convergenceZones.length > 0 && (
        <div
          className="rounded-lg p-3 border animate-pulse"
          style={{
            backgroundColor: `${COLORS.signalGreen}15`,
            borderColor: `${COLORS.signalGreen}40`,
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">🟢</span>
            <div>
              <div className="text-sm font-bold" style={{ color: COLORS.signalGreen }}>CONVERGENCE ZONE</div>
              {convergenceZones.map((cz, i) => (
                <div key={i} className="text-xs mt-0.5" style={{ color: COLORS.iceWhite }}>
                  {cz.description || cz.trends?.join(' + ')}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════ SEKTION 1: READINESS SCORE ══════ */}
      <div className="rounded-lg p-4 border border-[#1E3A5F]" style={{ backgroundColor: '#0D1B2A' }}>
        <div className="flex items-baseline gap-3">
          <span className="text-xs uppercase tracking-wider" style={{ color: COLORS.fadedBlue }}>
            Disruption Readiness
          </span>
          <span className="text-3xl font-bold font-mono" style={{ color: readinessColor }}>
            {dis.readiness_score}
          </span>
          <span className="text-sm font-mono" style={{ color: readinessColor }}>
            {dis.readiness_label}
          </span>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs" style={{ color: COLORS.mutedBlue }}>
          <span><span style={{ color: COLORS.signalGreen }}>{dis.active_trends_count}</span> Active</span>
          <span><span style={{ color: COLORS.signalYellow }}>{dis.watch_trends_count}</span> Watch</span>
          <span><span style={{ color: blindSpots.length > 0 ? COLORS.signalRed : COLORS.iceWhite }}>{dis.blind_spots_count}</span> Blind Spots</span>
          <span><span style={{ color: threats.length > 0 ? COLORS.signalOrange : COLORS.iceWhite }}>{dis.threats_count}</span> Threats</span>
          <span><span style={{ color: dis.convergence_active ? COLORS.signalGreen : COLORS.iceWhite }}>{convergenceZones.length}</span> Convergence</span>
        </div>
      </div>

      {/* ══════ SEKTION 2: S-KURVE / NETZWERK ══════ */}
      <div className="rounded-lg border border-[#1E3A5F] overflow-hidden" style={{ backgroundColor: '#0D1B2A' }}>
        {/* Toggle */}
        <div className="flex border-b border-[#1E3A5F]">
          <button
            onClick={() => setView('scurve')}
            className="flex-1 py-2 text-xs font-medium text-center transition-colors"
            style={{
              color: view === 'scurve' ? COLORS.baldurBlue : COLORS.fadedBlue,
              backgroundColor: view === 'scurve' ? '#1E3A5F' : 'transparent',
            }}
          >
            S-Kurve
          </button>
          <button
            onClick={() => setView('network')}
            className="flex-1 py-2 text-xs font-medium text-center transition-colors"
            style={{
              color: view === 'network' ? COLORS.baldurBlue : COLORS.fadedBlue,
              backgroundColor: view === 'network' ? '#1E3A5F' : 'transparent',
            }}
          >
            Netzwerk
          </button>
        </div>

        <div className="p-3">
          {view === 'scurve' ? (
            <SCurveChart trends={trends} />
          ) : (
            /* Netzwerk-Ansicht: Dependencies als Liste (Etappe 4 = D3 Force Graph) */
            <div className="space-y-2">
              {dependencies.length > 0 ? dependencies.map((dep, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="font-mono font-bold" style={{ color: COLORS.baldurBlue }}>{dep.from}</span>
                  <span style={{ color: COLORS.fadedBlue }}>→</span>
                  <span className="font-mono font-bold" style={{ color: COLORS.baldurBlue }}>{dep.to}</span>
                  <span className="px-1 py-0.5 rounded text-[10px]" style={{
                    color: dep.type === 'THREATENS' ? COLORS.signalRed : COLORS.signalGreen,
                    backgroundColor: dep.type === 'THREATENS' ? `${COLORS.signalRed}15` : `${COLORS.signalGreen}15`,
                  }}>
                    {dep.type}
                  </span>
                  <span className="flex-1 truncate" style={{ color: COLORS.mutedBlue }}>{dep.description}</span>
                </div>
              )) : (
                <p className="text-xs" style={{ color: COLORS.fadedBlue }}>Keine Dependencies vorhanden.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ══════ SEKTION 3: TREND-TABELLE ══════ */}
      <div className="rounded-lg border border-[#1E3A5F] overflow-hidden" style={{ backgroundColor: '#0D1B2A' }}>
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2 text-[10px] uppercase tracking-wider border-b border-[#1E3A5F]" style={{ color: COLORS.fadedBlue }}>
          <span className="w-6" />
          <span className="flex-1">Trend</span>
          <span className="w-20 text-center">Phase</span>
          <span className="w-8 text-right">Mat</span>
          <span className="w-10 text-right">Mom</span>
          <span className="w-8 text-right">Infl</span>
          <span className="w-16 text-right">Status</span>
        </div>

        {/* Rows */}
        {displayTrends.map((t) => (
          <TrendRow
            key={t.id}
            trend={t}
            isExpanded={expandedTrend === t.id}
            onToggle={() => setExpandedTrend(expandedTrend === t.id ? null : t.id)}
          />
        ))}

        {/* Show All Toggle */}
        {parkedArchived.length > 0 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full py-2 text-xs text-center hover:bg-[#1E3A5F]/30 transition-colors"
            style={{ color: COLORS.baldurBlue }}
          >
            {showAll ? `Nur Active/Watch anzeigen` : `Alle anzeigen (+${parkedArchived.length} Parked/Archived)`}
          </button>
        )}
      </div>

      {/* ══════ SEKTION 4: BLIND SPOT ALERTS ══════ */}
      {blindSpots.length > 0 && (
        <div className="rounded-lg border p-3 space-y-3" style={{
          backgroundColor: '#0D1B2A',
          borderColor: `${COLORS.signalRed}40`,
        }}>
          <div className="text-sm font-bold" style={{ color: COLORS.signalRed }}>
            ⚠ BLIND SPOTS ({blindSpots.length})
          </div>
          {blindSpots.map((bs, i) => (
            <div key={i} className="pl-2 border-l-2" style={{ borderColor: COLORS.signalRed }}>
              <div className="text-sm font-medium" style={{ color: COLORS.iceWhite }}>
                {bs.category} {bs.name} — <span style={{ color: COLORS.signalRed }}>KEIN EXPOSURE ({((bs.exposure_pct || 0) * 100).toFixed(1)}%)</span>
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

      {/* ══════ SEKTION 5: THREAT MAP ══════ */}
      {threats.length > 0 && (
        <div className="rounded-lg border p-3 space-y-3" style={{
          backgroundColor: '#0D1B2A',
          borderColor: `${COLORS.signalOrange}40`,
        }}>
          <div className="text-sm font-bold" style={{ color: COLORS.signalOrange }}>
            ⚠ THREATS ({threats.length})
          </div>
          {threats.map((th, i) => (
            <div key={i} className="pl-2 border-l-2" style={{ borderColor: DISRUPTION_THREAT_COLORS[th.threat_level] || COLORS.signalOrange }}>
              <div className="text-sm font-medium" style={{ color: COLORS.iceWhite }}>
                {th.category} {th.name} → {th.threatened_asset}
                {th.cluster_name && <span style={{ color: COLORS.mutedBlue }}> — {th.cluster_name}</span>}
                {th.v16_weight && <span style={{ color: COLORS.mutedBlue }}> ({(th.v16_weight * 100).toFixed(1)}% im Portfolio)</span>}
              </div>
              <div className="text-xs mt-0.5" style={{ color: COLORS.mutedBlue }}>
                Threat Level: <span style={{ color: DISRUPTION_THREAT_COLORS[th.threat_level] || COLORS.signalYellow }}>{th.threat_level}</span>
              </div>
              {th.reason && (
                <div className="text-xs mt-0.5 italic" style={{ color: COLORS.iceWhite }}>&quot;{th.reason}&quot;</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ══════ SEKTION 6: CONTRARIAN ALERTS ══════ */}
      {contrarian.length > 0 && (
        <div className="rounded-lg border p-3 space-y-3" style={{
          backgroundColor: '#0D1B2A',
          borderColor: `${COLORS.signalGreen}40`,
        }}>
          <div className="text-sm font-bold" style={{ color: COLORS.signalGreen }}>
            🟢 CONTRARIAN OPPORTUNITIES ({contrarian.length})
          </div>
          {contrarian.map((ca, i) => (
            <div key={i} className="pl-2 border-l-2" style={{ borderColor: DISRUPTION_ALERT_COLORS[ca.alert_level] || COLORS.mutedBlue }}>
              <div className="text-sm font-medium" style={{ color: COLORS.iceWhite }}>
                {ca.sector} (<span className="font-mono" style={{ color: COLORS.baldurBlue }}>{ca.etf}</span>)
                {' — '}
                <span style={{ color: DISRUPTION_ALERT_COLORS[ca.alert_level] || COLORS.mutedBlue }}>{ca.alert_level}</span>
              </div>
              <div className="text-xs mt-0.5" style={{ color: COLORS.mutedBlue }}>
                Tailwind: {ca.tailwind_source}
              </div>
              {ca.thesis_short && (
                <div className="text-xs mt-0.5 italic" style={{ color: COLORS.iceWhite }}>{ca.thesis_short}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ══════ SEKTION 6b: CAUSAL CHAINS ══════ */}
      {causalChains.length > 0 && (
        <div className="rounded-lg border border-[#1E3A5F] p-3 space-y-2" style={{ backgroundColor: '#0D1B2A' }}>
          <div className="text-sm font-bold" style={{ color: COLORS.baldurBlue }}>
            CAUSAL CHAINS ({causalChains.length})
          </div>
          {causalChains.map((cc, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2 text-xs py-1 border-b border-[#1E3A5F] last:border-0">
              <span className="font-medium" style={{ color: COLORS.iceWhite }}>{cc.trend}</span>
              <span style={{ color: COLORS.fadedBlue }}>:</span>
              <span style={{ color: COLORS.mutedBlue }}>{cc.current_step}</span>
              <span style={{ color: COLORS.signalYellow }}>→</span>
              <span style={{ color: COLORS.iceWhite }}>{cc.next_step}</span>
              <span className="text-[10px] px-1 py-0.5 rounded" style={{ color: COLORS.signalYellow, backgroundColor: `${COLORS.signalYellow}15` }}>
                {cc.timing}
              </span>
              {cc.instruments?.length > 0 && (
                <span className="font-mono" style={{ color: COLORS.baldurBlue }}>
                  [{cc.instruments.join(', ')}]
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ══════ SEKTION 6c: MODEL RISK ALERTS ══════ */}
      {modelRisks.length > 0 && (
        <div className="rounded-lg border border-[#1E3A5F] p-3 space-y-1" style={{ backgroundColor: '#0D1B2A' }}>
          <div className="text-sm font-bold" style={{ color: COLORS.signalOrange }}>
            MODEL RISK ({modelRisks.length})
          </div>
          {modelRisks.map((mr, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className="font-mono" style={{ color: COLORS.iceWhite }}>{mr.category}</span>
              <span style={{ color: COLORS.mutedBlue }}>{mr.name}</span>
              <span className="px-1 py-0.5 rounded text-[10px]" style={{
                color: mr.model_risk === 'PARADIGM' ? COLORS.signalRed : mr.model_risk === 'STRUCTURAL' ? COLORS.signalOrange : COLORS.signalYellow,
                backgroundColor: mr.model_risk === 'PARADIGM' ? `${COLORS.signalRed}15` : mr.model_risk === 'STRUCTURAL' ? `${COLORS.signalOrange}15` : `${COLORS.signalYellow}15`,
              }}>
                {mr.model_risk}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ══════ SEKTION 8: META ══════ */}
      <div className="text-xs text-center py-2" style={{ color: COLORS.fadedBlue }}>
        Letzter Scan: {dis.date}
        {meta.categories_scanned && ` • ${meta.categories_scanned} Kategorien`}
        {meta.sources_total && ` • ${meta.sources_total} Quellen`}
        {meta.avg_source_quality && ` • Avg Quality: ${meta.avg_source_quality}`}
        {meta.next_run && ` • Nächster Scan: ${meta.next_run}`}
      </div>
    </div>
  );
}
