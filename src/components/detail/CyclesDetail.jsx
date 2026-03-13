'use client';

import { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, ReferenceArea, ReferenceLine,
} from 'recharts';
import GlassCard from '@/components/shared/GlassCard';
import {
  COLORS,
  CYCLE_ALIGNMENT_COLORS,
  CYCLE_PHASE_COLORS,
  CYCLE_TIER_COLORS,
} from '@/lib/constants';

// ===== CONSTANTS =====

const CHART_URL = process.env.NEXT_PUBLIC_CYCLES_CHART_URL;

const LEAD_LAG_CONFIG = {
  LIQUIDITY:    { asset: 'DBC', lead_months: 7.5, direction: 'positive', r_sq: 0.46 },
  CREDIT:       { asset: 'HYG', lead_months: 0.5, direction: 'negative', r_sq: 0.85 },
  COMMODITY:    { asset: 'DBC', lead_months: 1.5, direction: 'positive', r_sq: 0.90 },
  CHINA_CREDIT: { asset: 'DBC', lead_months: 10.5, direction: 'positive', r_sq: 0.55 },
  DOLLAR:       { asset: 'GLD', lead_months: 4.5, direction: 'negative', r_sq: 0.52 },
  BUSINESS:     { asset: 'SPY', lead_months: 4.0, direction: 'positive', r_sq: 0.48 },
  FED_RATES:    { asset: 'GLD', lead_months: 4.5, direction: 'positive', r_sq: 0.58 },
  EARNINGS:     { asset: 'SPY', lead_months: 3.0, direction: 'positive', r_sq: 0.51 },
  TRADE:        { asset: 'DBC', lead_months: 2.0, direction: 'positive', r_sq: 0.44 },
  POLITICAL:    { asset: 'SPY', lead_months: 0,   direction: 'positive', r_sq: 0.30 },
};

const CYCLE_META = {
  LIQUIDITY:    { name: 'Global Liquidity',    icon: '💧', tier: 1, unit: '$T',  indicator: 'Fed Net Liq' },
  CREDIT:       { name: 'Credit Cycle',        icon: '💳', tier: 1, unit: 'bps', indicator: 'HY OAS' },
  COMMODITY:    { name: 'Commodity Supercycle', icon: '🛢️', tier: 1, unit: '',    indicator: 'CRB Real' },
  CHINA_CREDIT: { name: 'China Credit Impulse', icon: '🇨🇳', tier: 1, unit: '',   indicator: 'Cu/Au Ratio' },
  DOLLAR:       { name: 'US Dollar Cycle',     icon: '💵', tier: 2, unit: '',    indicator: 'DXY' },
  BUSINESS:     { name: 'Business Cycle',      icon: '🏭', tier: 2, unit: '%',   indicator: 'INDPRO YoY' },
  FED_RATES:    { name: 'Fed / Interest Rate', icon: '🏦', tier: 2, unit: '%',   indicator: 'Real FFR' },
  EARNINGS:     { name: 'Earnings / Profit',   icon: '📊', tier: 2, unit: '%',   indicator: 'Corp Profits YoY' },
  TRADE:        { name: 'Global Trade',        icon: '🚢', tier: 3, unit: '%',   indicator: 'CASS YoY' },
  POLITICAL:    { name: 'Political Cycle',     icon: '🗳️', tier: 3, unit: '',    indicator: 'Calendar' },
};

const CYCLE_ORDER = [
  'LIQUIDITY', 'CREDIT', 'COMMODITY', 'CHINA_CREDIT',
  'DOLLAR', 'BUSINESS', 'FED_RATES', 'EARNINGS',
  'TRADE', 'POLITICAL',
];

// ===== HELPERS =====

function phaseLabel(phase) {
  if (!phase || phase === 'UNKNOWN') return '—';
  return phase.replace(/_/g, ' ');
}

function fmtVal(val, unit) {
  if (val == null || val === '') return '—';
  if (unit === '$T') return `$${(Number(val) / 1e6).toFixed(2)}T`;
  if (unit === 'bps') return `${Number(val).toFixed(0)} bps`;
  if (unit === '%') return `${Number(val).toFixed(2)}%`;
  return String(Number(val).toFixed(4));
}

function velArrow(v) {
  if (v == null || v === '') return '';
  return Number(v) > 0 ? ' ▲' : Number(v) < 0 ? ' ▼' : ' →';
}

function velColor(v) {
  if (v == null || v === '') return COLORS.mutedBlue;
  return Number(v) > 0 ? COLORS.signalGreen : Number(v) < 0 ? COLORS.signalRed : COLORS.mutedBlue;
}

function alignIcon(a) {
  if (a === 'ALIGNED') return '✅';
  if (a === 'DIVERGED') return '❌';
  return '➖';
}

// ===== ROLLING 5Y Z-SCORE on raw monthly data =====

function rollingZScore(values, window = 60) {
  const result = [];
  for (let i = 0; i < values.length; i++) {
    if (values[i] == null) { result.push(null); continue; }
    const windowVals = [];
    for (let j = Math.max(0, i - window + 1); j <= i; j++) {
      if (values[j] != null) windowVals.push(values[j]);
    }
    if (windowVals.length < 12) { result.push(null); continue; }
    const mean = windowVals.reduce((s, v) => s + v, 0) / windowVals.length;
    const std = Math.sqrt(windowVals.reduce((s, v) => s + (v - mean) ** 2, 0) / windowVals.length);
    result.push(std === 0 ? 0 : (values[i] - mean) / std);
  }
  return result;
}

// ===== DATE SHIFT =====

function shiftMonth(ym, months) {
  const y = parseInt(ym.slice(0, 4));
  const m = parseInt(ym.slice(5, 7));
  const total = y * 12 + (m - 1) + Math.round(months);
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  return `${ny}-${String(nm).padStart(2, '0')}`;
}

// ===== COLLAPSIBLE SECTION =====

function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mb-4">
      <button onClick={() => setOpen(!open)}
              className="w-full flex items-center justify-between py-2 border-b border-white/10">
        <span className="text-label uppercase tracking-wider text-muted-blue">{title}</span>
        <span className="text-caption text-muted-blue">{open ? '▾' : '▸'}</span>
      </button>
      {open && <div className="pt-3">{children}</div>}
    </div>
  );
}

// ===== TOOLTIP =====

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div style={{ backgroundColor: '#0A1628', border: '1px solid #4A5A7A', borderRadius: '6px', padding: '8px 12px', fontSize: '11px' }}>
      <div style={{ color: COLORS.mutedBlue, marginBottom: '4px', fontWeight: 600 }}>{label}</div>
      {payload.map((entry, i) => (
        entry.value != null ? (
          <div key={i} style={{ color: entry.color, fontSize: '10px' }}>
            {entry.name}: {Number(entry.value).toFixed(2)}σ
          </div>
        ) : null
      ))}
    </div>
  );
}

// ===== CYCLE CLOCK =====

function CycleClock({ cyclePosition, phase, phaseColor }) {
  if (!cyclePosition || !cyclePosition.typical_duration_months) return null;
  const pct = Math.min(cyclePosition.pct_complete || 0, 150);
  const months = cyclePosition.months_since_cycle_start || 0;
  const typical = cyclePosition.typical_duration_months;
  const remaining = cyclePosition.estimated_months_remaining || 0;
  const inPhaseMonths = cyclePosition.months_in_phase || 0;
  const barWidth = Math.min(pct, 100);
  const isOver = pct > 100;

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between text-caption mb-1">
        <span style={{ color: phaseColor, fontWeight: 600 }}>{phaseLabel(phase)}</span>
        <span className="text-muted-blue font-mono" style={{ fontSize: '10px' }}>
          Mo {months}/{typical} ({pct.toFixed(0)}%)
          {isOver && <span style={{ color: COLORS.signalRed }}> OVER</span>}
        </span>
      </div>
      <div className="relative h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#1a2a44' }}>
        <div className="h-full rounded-full" style={{ width: `${barWidth}%`, backgroundColor: isOver ? COLORS.signalRed : phaseColor, opacity: 0.8 }} />
      </div>
      <div className="flex justify-between text-caption mt-1" style={{ fontSize: '9px', color: COLORS.fadedBlue }}>
        <span>{inPhaseMonths > 0 ? `${inPhaseMonths} Mo in Phase` : ''}</span>
        <span>{remaining > 0 ? `~${remaining} Mo remaining` : ''}</span>
      </div>
    </div>
  );
}

// ===== POLITICAL CHART =====

function PoliticalChart() {
  const yr = new Date().getFullYear();
  const data = [];
  for (let y = yr - 12; y <= yr + 4; y++) {
    const cy = ((y - 2025) % 4 + 4) % 4 + 1;
    data.push({ date: String(y), value: { 1: 6.5, 2: 4.2, 3: 16.3, 4: 7.5 }[cy] });
  }
  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1a2a44" />
        <XAxis dataKey="date" tick={{ fill: COLORS.mutedBlue, fontSize: 10 }} interval={1} />
        <YAxis tick={{ fill: COLORS.mutedBlue, fontSize: 10 }} tickFormatter={v => `${v}%`} />
        <Tooltip content={<ChartTooltip />} />
        <ReferenceLine x={String(yr)} stroke={COLORS.iceWhite} strokeDasharray="4 4" strokeWidth={1.5}
                       label={{ value: 'NOW', fill: COLORS.iceWhite, fontSize: 10, position: 'top' }} />
        <Line type="monotone" dataKey="value" stroke={COLORS.signalYellow} strokeWidth={2}
              dot={{ r: 3, fill: COLORS.signalYellow }} name="Avg Return %" />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ===== LEAD-LAG CHART (the only chart per cycle) =====

function LeadLagChart({ cycleId, chartData }) {
  const ll = LEAD_LAG_CONFIG[cycleId];
  if (!ll || !chartData) return null;
  if (!chartData.indicator || chartData.indicator.length < 24) return null;
  if (!chartData.asset_overlay || chartData.asset_overlay.length < 24) return null;

  const leadMonths = Math.max(1, Math.round(ll.lead_months));
  const isNeg = ll.direction === 'negative';

  // Raw monthly indicator → shift forward by lead
  const indShifted = {};
  chartData.indicator.forEach(pt => {
    if (pt.value != null) {
      indShifted[shiftMonth(pt.date, leadMonths)] = pt.value;
    }
  });

  // Raw monthly asset (unshifted)
  const assetMap = {};
  chartData.asset_overlay.forEach(pt => {
    if (pt.value != null) assetMap[pt.date] = pt.value;
  });

  // All dates
  const allDates = [...new Set([...Object.keys(indShifted), ...Object.keys(assetMap)])].sort();

  // Extract raw values
  const indVals = allDates.map(d => indShifted[d] ?? null);
  const assetVals = allDates.map(d => assetMap[d] ?? null);

  // Rolling 5Y Z-Score directly on raw monthly — no smoothing
  const indZ = rollingZScore(indVals, 60);
  const assetZ = rollingZScore(assetVals, 60);

  // NO inversion — show reality as-is

  // Build merged
  const merged = allDates.map((d, i) => ({
    date: d,
    ind: indZ[i] != null ? Math.round(indZ[i] * 100) / 100 : null,
    asset: assetZ[i] != null ? Math.round(assetZ[i] * 100) / 100 : null,
  })).filter(d => d.ind !== null || d.asset !== null);

  if (merged.length < 12) return null;

  const tickInterval = Math.max(1, Math.floor(merged.length / 10));
  const now = new Date();
  const nowYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const phaseColor = CYCLE_PHASE_COLORS[chartData.current_phase] || COLORS.baldurBlue;
  const previewEnd = merged[merged.length - 1]?.date;

  const indicatorName = CYCLE_META[cycleId]?.indicator || 'Indicator';

  return (
    <div className="mt-3">
      {/* Chart description */}
      <div className="text-caption mb-2 px-2 py-1.5 rounded" style={{ fontSize: '10px', backgroundColor: '#0d1f38', color: COLORS.mutedBlue }}>
        <span style={{ color: COLORS.iceWhite, fontWeight: 600 }}>{indicatorName}</span>
        <span> (shifted +{ll.lead_months} Mo) vs </span>
        <span style={{ color: COLORS.iceWhite, fontWeight: 600 }}>{ll.asset}</span>
        <span> — Rolling 5Y Z-Score | R²={ll.r_sq}</span>
        {isNeg && <span style={{ color: COLORS.signalOrange }}> | Gegenläufig: Indicator ↑ = {ll.asset} ↓</span>}
        {!isNeg && <span style={{ color: COLORS.signalGreen }}> | Gleichläufig: Indicator ↑ = {ll.asset} ↑</span>}
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={merged} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a2a44" />

          {/* Preview zone: NOW to end */}
          {nowYM && previewEnd && nowYM < previewEnd && (
            <ReferenceArea x1={nowYM} x2={previewEnd} fill={phaseColor} fillOpacity={0.06} ifOverflow="extendDomain" />
          )}

          {/* Zero line */}
          <ReferenceLine y={0} stroke="#4A5A7A" strokeDasharray="2 2" strokeWidth={0.5} />

          {/* NOW marker */}
          <ReferenceLine x={nowYM} stroke={COLORS.iceWhite} strokeDasharray="4 4" strokeWidth={1.5}
                         label={{ value: 'NOW', fill: COLORS.iceWhite, fontSize: 10, position: 'top' }} />

          <XAxis dataKey="date" tick={{ fill: COLORS.mutedBlue, fontSize: 9 }} interval={tickInterval}
                 tickFormatter={d => d.slice(0, 4)} />
          <YAxis tick={{ fill: COLORS.mutedBlue, fontSize: 9 }} tickFormatter={v => `${v.toFixed(1)}σ`}
                 width={40} domain={['auto', 'auto']} />
          <Tooltip content={<ChartTooltip />} />
          <Legend wrapperStyle={{ fontSize: '10px', color: COLORS.mutedBlue }} iconSize={8} />

          {/* Asset — gray/blue */}
          <Line type="monotone" dataKey="asset" stroke="#8B9DC3" strokeWidth={2} dot={false}
                name={ll.asset} connectNulls strokeOpacity={0.8} />

          {/* Indicator shifted — phase colored, thicker */}
          <Line type="monotone" dataKey="ind" stroke={phaseColor} strokeWidth={2.5} dot={false}
                name={`${indicatorName} +${ll.lead_months}Mo`} connectNulls strokeOpacity={0.9} />
        </LineChart>
      </ResponsiveContainer>

      {/* Explanation */}
      <div className="text-caption mt-1 px-2 py-1 rounded" style={{ fontSize: '9px', backgroundColor: `${phaseColor}08`, color: phaseColor }}>
        Rechts von NOW: {indicatorName} zeigt wohin {ll.asset} in ~{ll.lead_months} Mo geht.
        {isNeg
          ? ` Wenn ${indicatorName} steigt, fällt ${ll.asset} — und umgekehrt.`
          : ` Wenn ${indicatorName} steigt, steigt auch ${ll.asset}.`}
      </div>
    </div>
  );
}

// ===== CYCLE CARD =====

function CycleCard({ cycleId, phaseData, chartData }) {
  const [showChart, setShowChart] = useState(true);
  const meta = CYCLE_META[cycleId] || {};
  const phase = phaseData?.phase || 'UNKNOWN';
  const confidence = phaseData?.confidence;
  const alignment = phaseData?.v16_alignment || 'NEUTRAL';
  const inDanger = phaseData?.in_danger_zone;
  const phaseColor = CYCLE_PHASE_COLORS[phase] || COLORS.fadedBlue;
  const tierColor = CYCLE_TIER_COLORS[meta.tier] || COLORS.mutedBlue;
  const cyclePosition = chartData?.cycle_position;

  return (
    <div className="rounded-lg p-3 mb-3" style={{ backgroundColor: `${phaseColor}10`, borderLeft: `3px solid ${phaseColor}` }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span style={{ fontSize: '16px' }}>{meta.icon}</span>
          <span className="text-sm font-semibold text-ice-white">{meta.name}</span>
          <span className="text-caption px-1.5 py-0.5 rounded font-mono"
                style={{ backgroundColor: `${tierColor}20`, color: tierColor, fontSize: '10px' }}>T{meta.tier}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-caption">{alignIcon(alignment)}</span>
          {inDanger && <span className="text-caption">⚠️</span>}
          <button onClick={() => setShowChart(!showChart)}
                  className="text-caption text-muted-blue hover:text-ice-white" style={{ fontSize: '10px' }}>
            {showChart ? '▾' : '▸'}
          </button>
        </div>
      </div>

      {/* Cycle Clock */}
      {cyclePosition && cyclePosition.typical_duration_months > 0 && (
        <CycleClock cyclePosition={cyclePosition} phase={phase} phaseColor={phaseColor} />
      )}

      {/* Indicator values */}
      <div className="flex items-center justify-between mb-1">
        <div className="text-caption text-muted-blue">
          {meta.indicator}: {fmtVal(phaseData?.indicator_value, meta.unit)}
          {phaseData?.velocity != null && phaseData?.velocity !== '' && (
            <span style={{ color: velColor(phaseData.velocity) }}>
              {velArrow(phaseData.velocity)} vel: {Number(phaseData.velocity).toFixed(4)}
            </span>
          )}
        </div>
        {confidence != null && (
          <span className="text-caption text-muted-blue font-mono">{confidence}% conf</span>
        )}
      </div>

      {phaseData?.indicator_12m_ma != null && phaseData?.indicator_12m_ma !== '' && (
        <div className="text-caption text-muted-blue">
          12M MA: {fmtVal(phaseData.indicator_12m_ma, meta.unit)}
          {phaseData?.percentile != null && <span> | Pctl: {phaseData.percentile}%</span>}
        </div>
      )}

      {/* Danger Zone */}
      {phaseData?.danger_zone?.zone_name && (
        <div className="text-caption mt-1 px-2 py-1 rounded"
             style={{ backgroundColor: inDanger ? `${COLORS.signalRed}15` : `${COLORS.signalOrange}10`,
                      color: inDanger ? COLORS.signalRed : COLORS.signalOrange }}>
          {inDanger ? '⚠ IN ZONE: ' : '→ '}{phaseData.danger_zone.zone_name}
          {phaseData.danger_zone.distance_absolute != null && !inDanger && (
            <span> (Dist: {phaseData.danger_zone.distance_absolute})</span>
          )}
        </div>
      )}

      {/* Chart */}
      {showChart && (
        cycleId === 'POLITICAL'
          ? <div className="mt-3"><PoliticalChart /></div>
          : <LeadLagChart cycleId={cycleId} chartData={chartData} />
      )}
    </div>
  );
}

// ===== MAIN COMPONENT =====

export default function CyclesDetail({ dashboard }) {
  const cy = dashboard?.cycles;
  const [chartDataAll, setChartDataAll] = useState(null);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState(null);

  useEffect(() => {
    if (!CHART_URL) return;
    setChartLoading(true);
    fetch(`${CHART_URL}?t=${Date.now()}`, { cache: 'no-store' })
      .then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
      .then(data => { setChartDataAll(data); setChartError(null); })
      .catch(err => setChartError(err.message))
      .finally(() => setChartLoading(false));
  }, []);

  if (!cy || !cy.cycle_phases) {
    return (
      <GlassCard>
        <div className="text-center py-12">
          <p className="text-lg text-muted-blue">Cycles Engine noch nicht gelaufen.</p>
          <p className="text-caption text-muted-blue mt-2">Workflow: step0v_cycles.yml (Sonntag 02:00 UTC)</p>
        </div>
      </GlassCard>
    );
  }

  const score = cy.alignment_score ?? 0;
  const label = cy.alignment_label || 'UNKNOWN';
  const labelColor = CYCLE_ALIGNMENT_COLORS[label] || COLORS.mutedBlue;
  const phases = cy.cycle_phases || {};
  const dzCount = cy.in_danger_zone || 0;
  const chartCycles = chartDataAll?.cycles || {};

  return (
    <div className="space-y-4">
      {/* Header */}
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <span className="text-label uppercase tracking-wider text-muted-blue">🔄 Cycle Alignment Dashboard</span>
          <span className="text-caption text-muted-blue">{cy.date}</span>
        </div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-4xl font-mono font-bold" style={{ color: labelColor }}>{score}</span>
            <span className="text-xl text-muted-blue font-mono">/10</span>
            <span className="ml-3 px-2 py-1 rounded text-sm font-semibold"
                  style={{ backgroundColor: `${labelColor}20`, color: labelColor }}>{label}</span>
          </div>
          <div className="text-right">
            <div className="text-caption text-muted-blue">V16 Regime</div>
            <div className="text-sm font-mono text-ice-white">{cy.current_regime || '—'}</div>
          </div>
        </div>
        <div className="flex gap-1 h-3 rounded-full overflow-hidden mb-3">
          {cy.bullish > 0 && <div style={{ flex: cy.bullish, backgroundColor: COLORS.signalGreen }} />}
          {cy.neutral > 0 && <div style={{ flex: cy.neutral, backgroundColor: COLORS.fadedBlue }} />}
          {cy.bearish > 0 && <div style={{ flex: cy.bearish, backgroundColor: COLORS.signalRed }} />}
        </div>
        <div className="flex justify-between text-caption">
          <span style={{ color: COLORS.signalGreen }}>● {cy.bullish || 0} Bullish</span>
          <span style={{ color: COLORS.fadedBlue }}>● {cy.neutral || 0} Neutral</span>
          <span style={{ color: COLORS.signalRed }}>● {cy.bearish || 0} Bearish</span>
        </div>
        {dzCount > 0 && (
          <div className="mt-3 px-3 py-2 rounded text-sm"
               style={{ backgroundColor: `${COLORS.signalOrange}15`, color: COLORS.signalOrange }}>
            ⚠ {dzCount} Danger Zone{dzCount > 1 ? 's' : ''} aktiv
          </div>
        )}
        {cy.one_liner && <div className="mt-3 text-caption text-muted-blue font-mono">{cy.one_liner}</div>}
        {chartLoading && <div className="mt-2 text-caption text-muted-blue">Lade Chart-Daten...</div>}
        {chartError && <div className="mt-2 text-caption" style={{ color: COLORS.signalOrange }}>Chart-Fehler: {chartError}</div>}
      </GlassCard>

      {/* Tier 1 */}
      <GlassCard>
        <Section title="Tier 1 — Structural Cycles" defaultOpen={true}>
          {CYCLE_ORDER.filter(id => CYCLE_META[id]?.tier === 1).map(id => (
            <CycleCard key={id} cycleId={id} phaseData={phases[id]} chartData={chartCycles[id]} />
          ))}
        </Section>
      </GlassCard>

      {/* Tier 2 */}
      <GlassCard>
        <Section title="Tier 2 — Cyclical Indicators" defaultOpen={true}>
          {CYCLE_ORDER.filter(id => CYCLE_META[id]?.tier === 2).map(id => (
            <CycleCard key={id} cycleId={id} phaseData={phases[id]} chartData={chartCycles[id]} />
          ))}
        </Section>
      </GlassCard>

      {/* Tier 3 */}
      <GlassCard>
        <Section title="Tier 3 — Supplementary" defaultOpen={true}>
          {CYCLE_ORDER.filter(id => CYCLE_META[id]?.tier === 3).map(id => (
            <CycleCard key={id} cycleId={id} phaseData={phases[id]} chartData={chartCycles[id]} />
          ))}
        </Section>
      </GlassCard>

      {/* Alignment Matrix */}
      <GlassCard>
        <Section title="V16 Alignment Matrix" defaultOpen={false}>
          <div className="space-y-1">
            {CYCLE_ORDER.map(id => {
              const cp = phases[id] || {};
              const al = cp.v16_alignment || 'NEUTRAL';
              const ph = cp.phase || 'UNKNOWN';
              const phColor = CYCLE_PHASE_COLORS[ph] || COLORS.fadedBlue;
              return (
                <div key={id} className="flex items-center justify-between py-1 border-b border-white/5">
                  <span className="text-caption text-ice-white font-mono w-28">{CYCLE_META[id]?.name?.split(' ')[0] || id}</span>
                  <span className="text-caption font-mono" style={{ color: phColor }}>{phaseLabel(ph)}</span>
                  <span className="text-caption">
                    {alignIcon(al)}{' '}
                    <span style={{ color: al === 'ALIGNED' ? COLORS.signalGreen : al === 'DIVERGED' ? COLORS.signalRed : COLORS.mutedBlue }}>{al}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </Section>
      </GlassCard>
    </div>
  );
}
