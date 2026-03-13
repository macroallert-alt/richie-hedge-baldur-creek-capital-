'use client';

import { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend,
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

const CYCLE_META = {
  LIQUIDITY:    { name: 'Global Liquidity',         icon: '💧', tier: 1, unit: '$T',  indicator: 'Fed Net Liq',      yFormat: 'trillions' },
  CREDIT:       { name: 'Credit Cycle',             icon: '💳', tier: 1, unit: 'bps', indicator: 'HY OAS',           yFormat: 'number' },
  COMMODITY:    { name: 'Commodity Supercycle',      icon: '🛢️', tier: 1, unit: '',    indicator: 'CRB Real (DBC/CPI)', yFormat: 'decimal2' },
  CHINA_CREDIT: { name: 'China Credit Impulse',     icon: '🇨🇳', tier: 1, unit: '',    indicator: 'Cu/Au Ratio',      yFormat: 'decimal4' },
  DOLLAR:       { name: 'US Dollar Cycle',           icon: '💵', tier: 2, unit: '',    indicator: 'DXY (DTWEXBGS)',   yFormat: 'number' },
  BUSINESS:     { name: 'Business Cycle',            icon: '🏭', tier: 2, unit: '%',   indicator: 'INDPRO YoY',       yFormat: 'percent' },
  FED_RATES:    { name: 'Fed / Interest Rate',       icon: '🏦', tier: 2, unit: '%',   indicator: 'Real FFR',         yFormat: 'percent' },
  EARNINGS:     { name: 'Earnings / Profit',         icon: '📊', tier: 2, unit: '%',   indicator: 'Corp Profits YoY', yFormat: 'percent' },
  TRADE:        { name: 'Global Trade / Shipping',   icon: '🚢', tier: 3, unit: '%',   indicator: 'CASS Freight YoY', yFormat: 'percent' },
  POLITICAL:    { name: 'Political / Presidential',  icon: '🗳️', tier: 3, unit: '',    indicator: 'Calendar Year',    yFormat: 'number' },
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

function formatYAxis(value, format) {
  if (value == null) return '';
  switch (format) {
    case 'trillions': return `$${(value / 1e6).toFixed(1)}T`;
    case 'percent': return `${value.toFixed(1)}%`;
    case 'decimal2': return value.toFixed(2);
    case 'decimal4': return value.toFixed(4);
    default: return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
  }
}

function formatTooltipVal(value, format) {
  if (value == null) return '—';
  switch (format) {
    case 'trillions': return `$${(value / 1e6).toFixed(3)}T`;
    case 'percent': return `${value.toFixed(2)}%`;
    case 'decimal2': return value.toFixed(2);
    case 'decimal4': return value.toFixed(4);
    default: return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
  }
}

// ===== COLLAPSIBLE SECTION =====

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

// ===== CUSTOM TOOLTIP =====

function ChartTooltip({ active, payload, label, yFormat }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div style={{
      backgroundColor: '#0A1628',
      border: '1px solid #4A5A7A',
      borderRadius: '6px',
      padding: '8px 12px',
      fontSize: '11px',
    }}>
      <div style={{ color: COLORS.mutedBlue, marginBottom: '4px' }}>{label}</div>
      {payload.map((entry, i) => (
        <div key={i} style={{ color: entry.color }}>
          {entry.name}: {entry.name === 'Asset'
            ? `$${Number(entry.value).toFixed(2)}`
            : formatTooltipVal(entry.value, yFormat)}
        </div>
      ))}
    </div>
  );
}

// ===== POLITICAL CYCLE CHART (synthetic sine) =====

function PoliticalChart() {
  const currentYear = new Date().getFullYear();
  const data = [];
  for (let y = currentYear - 12; y <= currentYear + 4; y++) {
    const cycleYear = ((y - 2025) % 4 + 4) % 4 + 1;
    const avgReturn = { 1: 6.5, 2: 4.2, 3: 16.3, 4: 7.5 }[cycleYear];
    data.push({ date: String(y), value: avgReturn, year: cycleYear });
  }
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1a2a44" />
        <XAxis dataKey="date" tick={{ fill: COLORS.mutedBlue, fontSize: 10 }} interval={1} />
        <YAxis tick={{ fill: COLORS.mutedBlue, fontSize: 10 }} tickFormatter={v => `${v}%`} />
        <Tooltip content={<ChartTooltip yFormat="percent" />} />
        <Line type="monotone" dataKey="value" stroke={COLORS.signalYellow} strokeWidth={2}
              dot={{ r: 3, fill: COLORS.signalYellow }} name="Avg Return" />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ===== CYCLE CHART =====

function CycleChart({ cycleId, chartData, yFormat }) {
  if (!chartData || !chartData.indicator || chartData.indicator.length === 0) {
    return (
      <div className="text-caption text-muted-blue py-4 text-center">
        Keine Chart-Daten verfügbar
      </div>
    );
  }

  // Merge indicator, ma, asset into single array by date
  const indMap = {};
  chartData.indicator.forEach(pt => { indMap[pt.date] = { ...indMap[pt.date], date: pt.date, indicator: pt.value }; });
  (chartData.ma_12m || []).forEach(pt => { if (pt.value != null) indMap[pt.date] = { ...indMap[pt.date], date: pt.date, ma: pt.value }; });

  const assetMap = {};
  (chartData.asset_overlay || []).forEach(pt => { assetMap[pt.date] = pt.value; });

  // Build merged data sorted by date
  const allDates = [...new Set([...Object.keys(indMap), ...Object.keys(assetMap)])].sort();
  const merged = allDates.map(d => ({
    date: d,
    indicator: indMap[d]?.indicator ?? null,
    ma: indMap[d]?.ma ?? null,
    asset: assetMap[d] ?? null,
  })).filter(d => d.indicator !== null || d.asset !== null);

  // Thin out labels for readability (show every 24th month = every 2 years)
  const tickInterval = Math.max(1, Math.floor(merged.length / 10));

  const assetTicker = chartData.asset_ticker || '';
  const phaseColor = CYCLE_PHASE_COLORS[chartData.current_phase] || COLORS.fadedBlue;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={merged} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1a2a44" />
        <XAxis
          dataKey="date"
          tick={{ fill: COLORS.mutedBlue, fontSize: 9 }}
          interval={tickInterval}
          tickFormatter={d => d.slice(0, 4)}
        />
        <YAxis
          yAxisId="left"
          tick={{ fill: COLORS.mutedBlue, fontSize: 9 }}
          tickFormatter={v => formatYAxis(v, yFormat)}
          width={55}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fill: '#6B7280', fontSize: 9 }}
          tickFormatter={v => `$${v.toFixed(0)}`}
          width={45}
        />
        <Tooltip content={<ChartTooltip yFormat={yFormat} />} />
        <Legend
          wrapperStyle={{ fontSize: '10px', color: COLORS.mutedBlue }}
          iconSize={8}
        />
        {/* Asset Overlay — background, gray, right axis */}
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="asset"
          stroke="#6B7280"
          strokeWidth={1}
          dot={false}
          name={assetTicker || 'Asset'}
          connectNulls
          strokeOpacity={0.5}
        />
        {/* 12M MA — dashed */}
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="ma"
          stroke={COLORS.signalYellow}
          strokeWidth={1.5}
          strokeDasharray="4 3"
          dot={false}
          name="12M MA"
          connectNulls
        />
        {/* Primary Indicator — solid, colored by phase */}
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="indicator"
          stroke={phaseColor}
          strokeWidth={2}
          dot={false}
          name="Indicator"
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ===== CYCLE CARD WITH CHART =====

function CycleCard({ cycleId, phaseData, chartData }) {
  const [showChart, setShowChart] = useState(true);
  const meta = CYCLE_META[cycleId] || {};
  const phase = phaseData?.phase || 'UNKNOWN';
  const confidence = phaseData?.confidence;
  const alignment = phaseData?.v16_alignment || 'NEUTRAL';
  const inDanger = phaseData?.in_danger_zone;
  const phaseColor = CYCLE_PHASE_COLORS[phase] || COLORS.fadedBlue;
  const tierColor = CYCLE_TIER_COLORS[meta.tier] || COLORS.mutedBlue;

  return (
    <div
      className="rounded-lg p-3 mb-3"
      style={{
        backgroundColor: `${phaseColor}10`,
        borderLeft: `3px solid ${phaseColor}`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span style={{ fontSize: '16px' }}>{meta.icon}</span>
          <span className="text-sm font-semibold text-ice-white">{meta.name}</span>
          <span
            className="text-caption px-1.5 py-0.5 rounded font-mono"
            style={{ backgroundColor: `${tierColor}20`, color: tierColor, fontSize: '10px' }}
          >
            T{meta.tier}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-caption" title="V16 Alignment">{alignIcon(alignment)}</span>
          {inDanger && <span className="text-caption" title="In Danger Zone">⚠️</span>}
          <button
            onClick={() => setShowChart(!showChart)}
            className="text-caption text-muted-blue hover:text-ice-white"
            style={{ fontSize: '10px' }}
          >
            {showChart ? '📉 hide' : '📈 chart'}
          </button>
        </div>
      </div>

      {/* Phase + Confidence */}
      <div className="flex items-center justify-between mb-1">
        <span className="font-mono font-bold text-sm" style={{ color: phaseColor }}>
          {phaseLabel(phase)}
        </span>
        {confidence != null && (
          <span className="text-caption text-muted-blue font-mono">{confidence}% conf</span>
        )}
      </div>

      {/* Indicator values */}
      <div className="text-caption text-muted-blue">
        {meta.indicator}: {fmtVal(phaseData?.indicator_value, meta.unit)}
        {phaseData?.velocity != null && phaseData?.velocity !== '' && (
          <span style={{ color: velColor(phaseData.velocity) }}>
            {velArrow(phaseData.velocity)} vel: {Number(phaseData.velocity).toFixed(4)}
          </span>
        )}
      </div>
      {phaseData?.indicator_12m_ma != null && phaseData?.indicator_12m_ma !== '' && (
        <div className="text-caption text-muted-blue">
          12M MA: {fmtVal(phaseData.indicator_12m_ma, meta.unit)}
        </div>
      )}
      {phaseData?.percentile != null && (
        <div className="text-caption text-muted-blue">Percentile: {phaseData.percentile}%</div>
      )}

      {/* Danger Zone */}
      {phaseData?.danger_zone?.zone_name && (
        <div
          className="text-caption mt-1 px-2 py-1 rounded"
          style={{
            backgroundColor: inDanger ? `${COLORS.signalRed}15` : `${COLORS.signalOrange}10`,
            color: inDanger ? COLORS.signalRed : COLORS.signalOrange,
          }}
        >
          {inDanger ? '⚠ IN ZONE: ' : '→ '}{phaseData.danger_zone.zone_name}
          {phaseData.danger_zone.distance_absolute != null && !inDanger && (
            <span> (Dist: {phaseData.danger_zone.distance_absolute})</span>
          )}
        </div>
      )}

      {/* Chart */}
      {showChart && (
        <div className="mt-3">
          {cycleId === 'POLITICAL' ? (
            <PoliticalChart />
          ) : (
            <CycleChart cycleId={cycleId} chartData={chartData} yFormat={meta.yFormat} />
          )}
          {chartData && (
            <div className="text-caption text-muted-blue mt-1 text-right" style={{ fontSize: '9px' }}>
              {chartData.indicator_count || 0} pts | Asset: {chartData.asset_ticker || '—'} ({chartData.asset_count || 0} pts)
            </div>
          )}
        </div>
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

  // Fetch chart data
  useEffect(() => {
    if (!CHART_URL) return;
    setChartLoading(true);
    fetch(`${CHART_URL}?t=${Date.now()}`, { cache: 'no-store' })
      .then(r => {
        if (!r.ok) throw new Error(`Chart fetch failed: ${r.status}`);
        return r.json();
      })
      .then(data => {
        setChartDataAll(data);
        setChartError(null);
      })
      .catch(err => {
        setChartError(err.message);
      })
      .finally(() => setChartLoading(false));
  }, []);

  if (!cy || !cy.cycle_phases) {
    return (
      <GlassCard>
        <div className="text-center py-12">
          <p className="text-lg text-muted-blue">Cycles Engine noch nicht gelaufen.</p>
          <p className="text-caption text-muted-blue mt-2">
            Workflow: step0v_cycles.yml (Sonntag 02:00 UTC)
          </p>
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
      {/* ═══ ALIGNMENT HEADER ═══ */}
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <span className="text-label uppercase tracking-wider text-muted-blue">
            🔄 Cycle Alignment Dashboard
          </span>
          <span className="text-caption text-muted-blue">{cy.date}</span>
        </div>

        {/* Big Score */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-4xl font-mono font-bold" style={{ color: labelColor }}>
              {score}
            </span>
            <span className="text-xl text-muted-blue font-mono">/10</span>
            <span
              className="ml-3 px-2 py-1 rounded text-sm font-semibold"
              style={{ backgroundColor: `${labelColor}20`, color: labelColor }}
            >
              {label}
            </span>
          </div>
          <div className="text-right">
            <div className="text-caption text-muted-blue">V16 Regime</div>
            <div className="text-sm font-mono text-ice-white">{cy.current_regime || '—'}</div>
          </div>
        </div>

        {/* Bull / Bear / Neutral Bar */}
        <div className="flex gap-1 h-3 rounded-full overflow-hidden mb-3">
          {cy.bullish > 0 && (
            <div style={{ flex: cy.bullish, backgroundColor: COLORS.signalGreen }} title={`${cy.bullish} Bullish`} />
          )}
          {cy.neutral > 0 && (
            <div style={{ flex: cy.neutral, backgroundColor: COLORS.fadedBlue }} title={`${cy.neutral} Neutral`} />
          )}
          {cy.bearish > 0 && (
            <div style={{ flex: cy.bearish, backgroundColor: COLORS.signalRed }} title={`${cy.bearish} Bearish`} />
          )}
        </div>
        <div className="flex justify-between text-caption">
          <span style={{ color: COLORS.signalGreen }}>● {cy.bullish || 0} Bullish</span>
          <span style={{ color: COLORS.fadedBlue }}>● {cy.neutral || 0} Neutral</span>
          <span style={{ color: COLORS.signalRed }}>● {cy.bearish || 0} Bearish</span>
        </div>

        {/* Danger Zone Alert */}
        {dzCount > 0 && (
          <div className="mt-3 px-3 py-2 rounded text-sm"
               style={{ backgroundColor: `${COLORS.signalOrange}15`, color: COLORS.signalOrange }}>
            ⚠ {dzCount} Danger Zone{dzCount > 1 ? 's' : ''} aktiv — erhoehte Vorsicht
          </div>
        )}

        {/* One-Liner */}
        {cy.one_liner && (
          <div className="mt-3 text-caption text-muted-blue font-mono">{cy.one_liner}</div>
        )}

        {/* Chart loading status */}
        {chartLoading && (
          <div className="mt-2 text-caption text-muted-blue">Lade Chart-Daten...</div>
        )}
        {chartError && (
          <div className="mt-2 text-caption text-signalOrange">Chart-Daten Fehler: {chartError}</div>
        )}
      </GlassCard>

      {/* ═══ TIER 1: STRUCTURAL ═══ */}
      <GlassCard>
        <Section title="Tier 1 — Structural Cycles" defaultOpen={true}>
          {CYCLE_ORDER.filter(id => CYCLE_META[id]?.tier === 1).map(id => (
            <CycleCard key={id} cycleId={id} phaseData={phases[id]} chartData={chartCycles[id]} />
          ))}
        </Section>
      </GlassCard>

      {/* ═══ TIER 2: CYCLICAL ═══ */}
      <GlassCard>
        <Section title="Tier 2 — Cyclical Indicators" defaultOpen={true}>
          {CYCLE_ORDER.filter(id => CYCLE_META[id]?.tier === 2).map(id => (
            <CycleCard key={id} cycleId={id} phaseData={phases[id]} chartData={chartCycles[id]} />
          ))}
        </Section>
      </GlassCard>

      {/* ═══ TIER 3: SUPPLEMENTARY ═══ */}
      <GlassCard>
        <Section title="Tier 3 — Supplementary" defaultOpen={true}>
          {CYCLE_ORDER.filter(id => CYCLE_META[id]?.tier === 3).map(id => (
            <CycleCard key={id} cycleId={id} phaseData={phases[id]} chartData={chartCycles[id]} />
          ))}
        </Section>
      </GlassCard>

      {/* ═══ ALIGNMENT MATRIX ═══ */}
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
                  <span className="text-caption text-ice-white font-mono w-28">
                    {CYCLE_META[id]?.name?.split(' ')[0] || id}
                  </span>
                  <span className="text-caption font-mono" style={{ color: phColor }}>
                    {phaseLabel(ph)}
                  </span>
                  <span className="text-caption">
                    {alignIcon(al)}{' '}
                    <span style={{
                      color: al === 'ALIGNED' ? COLORS.signalGreen :
                             al === 'DIVERGED' ? COLORS.signalRed : COLORS.mutedBlue
                    }}>
                      {al}
                    </span>
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
