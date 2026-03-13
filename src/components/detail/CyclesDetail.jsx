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

const ZONE_COLORS = {
  green:  { fill: '#22C55E', opacity: 0.08 },
  yellow: { fill: '#EAB308', opacity: 0.08 },
  orange: { fill: '#F97316', opacity: 0.10 },
  red:    { fill: '#EF4444', opacity: 0.10 },
  gray:   { fill: '#8B9DC3', opacity: 0.05 },
};

// Lead-Lag config per cycle (from config.py CYCLE_DEFINITIONS.lead_relationships)
// lead_months: how many months the indicator LEADS the primary asset
// direction: "positive" = both move same way, "negative" = inverted
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
  LIQUIDITY:    { name: 'Global Liquidity',         icon: '💧', tier: 1, unit: '$T',  indicator: 'Fed Net Liq',      yFormat: 'trillions', yLabel: 'Net Liquidity ($T)' },
  CREDIT:       { name: 'Credit Cycle',             icon: '💳', tier: 1, unit: 'bps', indicator: 'HY OAS',           yFormat: 'number',    yLabel: 'HY OAS (bps)' },
  COMMODITY:    { name: 'Commodity Supercycle',      icon: '🛢️', tier: 1, unit: '',    indicator: 'CRB Real (DBC/CPI)', yFormat: 'decimal2', yLabel: 'CRB Real Index' },
  CHINA_CREDIT: { name: 'China Credit Impulse',     icon: '🇨🇳', tier: 1, unit: '',    indicator: 'Cu/Au Ratio',      yFormat: 'decimal4',  yLabel: 'Cu/Au Ratio' },
  DOLLAR:       { name: 'US Dollar Cycle',           icon: '💵', tier: 2, unit: '',    indicator: 'DXY (DTWEXBGS)',   yFormat: 'number',    yLabel: 'Trade-Weighted Dollar' },
  BUSINESS:     { name: 'Business Cycle',            icon: '🏭', tier: 2, unit: '%',   indicator: 'INDPRO YoY',       yFormat: 'percent',   yLabel: 'Industrial Production YoY' },
  FED_RATES:    { name: 'Fed / Interest Rate',       icon: '🏦', tier: 2, unit: '%',   indicator: 'Real FFR',         yFormat: 'percent',   yLabel: 'Real Fed Funds Rate' },
  EARNINGS:     { name: 'Earnings / Profit',         icon: '📊', tier: 2, unit: '%',   indicator: 'Corp Profits YoY', yFormat: 'percent',   yLabel: 'Corporate Profits YoY' },
  TRADE:        { name: 'Global Trade / Shipping',   icon: '🚢', tier: 3, unit: '%',   indicator: 'CASS Freight YoY', yFormat: 'percent',   yLabel: 'CASS Freight YoY' },
  POLITICAL:    { name: 'Political / Presidential',  icon: '🗳️', tier: 3, unit: '',    indicator: 'Calendar Year',    yFormat: 'number',    yLabel: 'Avg Historical Return' },
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

// ===== Z-SCORE NORMALIZATION =====

function zScoreNormalize(values) {
  const valid = values.filter(v => v != null);
  if (valid.length < 2) return values.map(() => null);
  const mean = valid.reduce((s, v) => s + v, 0) / valid.length;
  const std = Math.sqrt(valid.reduce((s, v) => s + (v - mean) ** 2, 0) / valid.length);
  if (std === 0) return values.map(() => 0);
  return values.map(v => v != null ? (v - mean) / std : null);
}

// ===== DATE SHIFT: Add months to "YYYY-MM" =====

function shiftMonth(ym, months) {
  const y = parseInt(ym.slice(0, 4));
  const m = parseInt(ym.slice(5, 7));
  const totalMonths = y * 12 + (m - 1) + Math.round(months);
  const ny = Math.floor(totalMonths / 12);
  const nm = (totalMonths % 12) + 1;
  return `${ny}-${String(nm).padStart(2, '0')}`;
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

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div style={{
      backgroundColor: '#0A1628',
      border: '1px solid #4A5A7A',
      borderRadius: '6px',
      padding: '8px 12px',
      fontSize: '11px',
      maxWidth: '240px',
    }}>
      <div style={{ color: COLORS.mutedBlue, marginBottom: '4px', fontWeight: 600 }}>{label}</div>
      {payload.map((entry, i) => {
        if (entry.value == null) return null;
        return (
          <div key={i} style={{ color: entry.color, fontSize: '10px' }}>
            {entry.name}: {Number(entry.value).toFixed(2)} σ
          </div>
        );
      })}
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
  const isOverextended = pct > 100;

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between text-caption mb-1">
        <span style={{ color: phaseColor, fontWeight: 600 }}>{phaseLabel(phase)}</span>
        <span className="text-muted-blue font-mono" style={{ fontSize: '10px' }}>
          Mo {months}/{typical} ({pct.toFixed(0)}%)
          {isOverextended && <span style={{ color: COLORS.signalRed }}> OVEREXTENDED</span>}
        </span>
      </div>
      <div className="relative h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#1a2a44' }}>
        <div className="h-full rounded-full transition-all"
             style={{ width: `${barWidth}%`, backgroundColor: isOverextended ? COLORS.signalRed : phaseColor, opacity: 0.8 }} />
      </div>
      <div className="flex justify-between text-caption mt-1" style={{ fontSize: '9px', color: COLORS.fadedBlue }}>
        <span>{inPhaseMonths > 0 ? `${inPhaseMonths} Mo in Phase` : ''}</span>
        <span>{remaining > 0 ? `~${remaining} Mo verbleibend` : ''}</span>
      </div>
    </div>
  );
}

// ===== POLITICAL CYCLE CHART =====

function PoliticalChart() {
  const currentYear = new Date().getFullYear();
  const data = [];
  for (let y = currentYear - 12; y <= currentYear + 4; y++) {
    const cycleYear = ((y - 2025) % 4 + 4) % 4 + 1;
    const avgReturn = { 1: 6.5, 2: 4.2, 3: 16.3, 4: 7.5 }[cycleYear];
    data.push({ date: String(y), value: avgReturn });
  }
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1a2a44" />
        <XAxis dataKey="date" tick={{ fill: COLORS.mutedBlue, fontSize: 10 }} interval={1} />
        <YAxis tick={{ fill: COLORS.mutedBlue, fontSize: 10 }} tickFormatter={v => `${v}%`} />
        <Tooltip content={<ChartTooltip />} />
        <ReferenceLine x={String(currentYear)} stroke={COLORS.iceWhite} strokeDasharray="4 4" strokeWidth={1.5}
                       label={{ value: 'NOW', fill: COLORS.iceWhite, fontSize: 10, position: 'top' }} />
        <Line type="monotone" dataKey="value" stroke={COLORS.signalYellow} strokeWidth={2}
              dot={{ r: 3, fill: COLORS.signalYellow }} name="Avg Return" />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ===== LEAD-LAG OVERLAY CHART =====

function LeadLagChart({ cycleId, chartData }) {
  const ll = LEAD_LAG_CONFIG[cycleId];
  if (!ll || !chartData || !chartData.indicator || chartData.indicator.length < 24) {
    return null;
  }
  if (!chartData.asset_overlay || chartData.asset_overlay.length < 24) {
    return null;
  }
  if (ll.lead_months < 1) return null; // No meaningful lead to show

  const leadMonths = Math.round(ll.lead_months);
  const isNegative = ll.direction === 'negative';

  // Build indicator map: shift dates forward by lead_months
  const indShifted = {};
  chartData.indicator.forEach(pt => {
    if (pt.value != null) {
      const shiftedDate = shiftMonth(pt.date, leadMonths);
      indShifted[shiftedDate] = pt.value;
    }
  });

  // Build asset map (unshifted)
  const assetMap = {};
  chartData.asset_overlay.forEach(pt => {
    if (pt.value != null) {
      assetMap[pt.date] = pt.value;
    }
  });

  // Find overlapping dates
  const allDates = [...new Set([...Object.keys(indShifted), ...Object.keys(assetMap)])].sort();

  // Extract raw values for z-score
  const indVals = allDates.map(d => indShifted[d] ?? null);
  const assetVals = allDates.map(d => assetMap[d] ?? null);

  // Normalize both to z-score
  let indZ = zScoreNormalize(indVals);
  const assetZ = zScoreNormalize(assetVals);

  // Invert indicator if negative correlation
  if (isNegative) {
    indZ = indZ.map(v => v != null ? -v : null);
  }

  // Build merged data
  const merged = allDates.map((d, i) => ({
    date: d,
    indicator_shifted: indZ[i],
    asset: assetZ[i],
  })).filter(d => d.indicator_shifted !== null || d.asset !== null);

  if (merged.length < 12) return null;

  const tickInterval = Math.max(1, Math.floor(merged.length / 10));

  // Find NOW (today's YYYY-MM)
  const now = new Date();
  const nowYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Find the preview zone: from NOW to end of shifted indicator
  // The shifted indicator extends lead_months beyond actual data end
  const lastAssetDate = chartData.asset_overlay[chartData.asset_overlay.length - 1]?.date;
  const previewStart = nowYM;
  const previewEnd = merged[merged.length - 1]?.date;

  const phaseColor = CYCLE_PHASE_COLORS[chartData.current_phase] || COLORS.baldurBlue;

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-caption font-semibold" style={{ color: COLORS.iceWhite, fontSize: '11px' }}>
          Lead-Lag Overlay (Z-Score)
        </span>
        <span className="text-caption text-muted-blue" style={{ fontSize: '9px' }}>
          {ll.asset} vs {CYCLE_META[cycleId]?.indicator} shifted +{ll.lead_months}Mo
          {isNegative ? ' (inverted)' : ''} | R²={ll.r_sq}
        </span>
      </div>
      <div className="text-caption text-muted-blue mb-1" style={{ fontSize: '9px' }}>
        ◀ Normalized (σ) — Wenn die Kurven synchron laufen, ist der Lead valide.
        {isNegative
          ? ' Indikator invertiert (steigender Spread = fallender Preis).'
          : ' Beide laufen in gleicher Richtung.'}
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={merged} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a2a44" />

          {/* Preview zone: between NOW and end of shifted indicator */}
          {previewStart && previewEnd && previewStart < previewEnd && (
            <ReferenceArea
              x1={previewStart}
              x2={previewEnd}
              fill={phaseColor}
              fillOpacity={0.06}
              ifOverflow="extendDomain"
            />
          )}

          {/* NOW marker */}
          <ReferenceLine
            x={nowYM}
            stroke={COLORS.iceWhite}
            strokeDasharray="4 4"
            strokeWidth={1.5}
            label={{ value: 'NOW', fill: COLORS.iceWhite, fontSize: 10, position: 'top' }}
          />

          <XAxis
            dataKey="date"
            tick={{ fill: COLORS.mutedBlue, fontSize: 9 }}
            interval={tickInterval}
            tickFormatter={d => d.slice(0, 4)}
          />
          <YAxis
            tick={{ fill: COLORS.mutedBlue, fontSize: 9 }}
            tickFormatter={v => `${v.toFixed(1)}σ`}
            width={40}
            domain={['auto', 'auto']}
          />
          <Tooltip content={<ChartTooltip />} />
          <Legend wrapperStyle={{ fontSize: '10px', color: COLORS.mutedBlue }} iconSize={8} />

          {/* Asset (unshifted) — the "reality" */}
          <Line
            type="monotone" dataKey="asset"
            stroke="#8B9DC3" strokeWidth={2} dot={false}
            name={`${ll.asset} (actual)`} connectNulls strokeOpacity={0.7}
          />

          {/* Indicator (shifted forward by lead) — the "prediction" */}
          <Line
            type="monotone" dataKey="indicator_shifted"
            stroke={phaseColor} strokeWidth={2.5} dot={false}
            name={`Indicator (+${ll.lead_months}Mo${isNegative ? ', inv' : ''})`}
            connectNulls strokeOpacity={0.9}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="text-caption mt-1 px-2 py-1 rounded" style={{ fontSize: '9px', backgroundColor: `${phaseColor}10`, color: phaseColor }}>
        Rechts von NOW: Der Indikator zeigt schon wohin {ll.asset} in ~{ll.lead_months} Monaten gehen wird.
        {isNegative ? ` (invertiert: steigender Indikator = fallender ${ll.asset})` : ''}
      </div>
    </div>
  );
}

// ===== RAW DATA CHART (existing, simplified) =====

function RawDataChart({ cycleId, chartData, yFormat, yLabel }) {
  if (!chartData || !chartData.indicator || chartData.indicator.length === 0) {
    return <div className="text-caption text-muted-blue py-4 text-center">Keine Chart-Daten</div>;
  }

  const indMap = {};
  chartData.indicator.forEach(pt => { indMap[pt.date] = { ...indMap[pt.date], date: pt.date, indicator: pt.value }; });
  (chartData.smoothed || []).forEach(pt => {
    if (pt.value != null) indMap[pt.date] = { ...indMap[pt.date], date: pt.date, smoothed: pt.value };
  });
  const assetMap = {};
  (chartData.asset_overlay || []).forEach(pt => { assetMap[pt.date] = pt.value; });

  const allDates = [...new Set([...Object.keys(indMap), ...Object.keys(assetMap)])].sort();
  const merged = allDates.map(d => ({
    date: d,
    indicator: indMap[d]?.indicator ?? null,
    smoothed: indMap[d]?.smoothed ?? null,
    asset: assetMap[d] ?? null,
  })).filter(d => d.indicator !== null || d.asset !== null);

  const tickInterval = Math.max(1, Math.floor(merged.length / 10));
  const assetTicker = chartData.asset_ticker || '';
  const phaseColor = CYCLE_PHASE_COLORS[chartData.current_phase] || COLORS.fadedBlue;
  const phaseZones = chartData.phase_zones || [];
  const nowDate = merged.length > 0 ? merged[merged.length - 1].date : null;

  const formatYAxis = (value, fmt) => {
    if (value == null) return '';
    switch (fmt) {
      case 'trillions': return `$${(value / 1e6).toFixed(1)}T`;
      case 'percent': return `${value.toFixed(1)}%`;
      case 'decimal2': return value.toFixed(2);
      case 'decimal4': return value.toFixed(4);
      default: return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
    }
  };

  return (
    <div>
      <div className="text-caption text-muted-blue mb-1" style={{ fontSize: '9px' }}>
        ◀ {yLabel || 'Indicator'} &nbsp;|&nbsp; {assetTicker} Price ($) ▶
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={merged} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a2a44" />
          {phaseZones.map((zone, i) => {
            const zc = ZONE_COLORS[zone.color] || ZONE_COLORS.gray;
            return <ReferenceArea key={i} x1={zone.start} x2={zone.end} fill={zc.fill} fillOpacity={zc.opacity} ifOverflow="extendDomain" />;
          })}
          {nowDate && <ReferenceLine x={nowDate} stroke={COLORS.iceWhite} strokeDasharray="4 4" strokeWidth={1.5}
                                     label={{ value: 'NOW', fill: COLORS.iceWhite, fontSize: 10, position: 'top' }} />}
          <XAxis dataKey="date" tick={{ fill: COLORS.mutedBlue, fontSize: 9 }} interval={tickInterval} tickFormatter={d => d.slice(0, 4)} />
          <YAxis yAxisId="left" tick={{ fill: COLORS.mutedBlue, fontSize: 9 }} tickFormatter={v => formatYAxis(v, yFormat)} width={55} />
          <YAxis yAxisId="right" orientation="right" tick={{ fill: '#6B7280', fontSize: 9 }} tickFormatter={v => `$${v.toFixed(0)}`} width={45} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: '10px', color: COLORS.mutedBlue }} iconSize={8} />
          <Line yAxisId="right" type="monotone" dataKey="asset" stroke="#6B7280" strokeWidth={1} dot={false} name={assetTicker || 'Asset'} connectNulls strokeOpacity={0.4} />
          <Line yAxisId="left" type="monotone" dataKey="indicator" stroke={COLORS.mutedBlue} strokeWidth={1} dot={false} name="Raw Data" connectNulls strokeOpacity={0.5} />
          <Line yAxisId="left" type="monotone" dataKey="smoothed" stroke={phaseColor} strokeWidth={3} dot={false} name="Cycle Wave" connectNulls strokeOpacity={0.9} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ===== CYCLE CARD =====

function CycleCard({ cycleId, phaseData, chartData }) {
  const [viewMode, setViewMode] = useState('leadlag'); // 'leadlag' | 'raw' | 'hide'
  const meta = CYCLE_META[cycleId] || {};
  const phase = phaseData?.phase || 'UNKNOWN';
  const confidence = phaseData?.confidence;
  const alignment = phaseData?.v16_alignment || 'NEUTRAL';
  const inDanger = phaseData?.in_danger_zone;
  const phaseColor = CYCLE_PHASE_COLORS[phase] || COLORS.fadedBlue;
  const tierColor = CYCLE_TIER_COLORS[meta.tier] || COLORS.mutedBlue;
  const cyclePosition = chartData?.cycle_position;
  const ll = LEAD_LAG_CONFIG[cycleId];
  const hasLeadLag = ll && ll.lead_months >= 1 && chartData?.indicator?.length > 24 && chartData?.asset_overlay?.length > 24;

  return (
    <div className="rounded-lg p-3 mb-3" style={{ backgroundColor: `${phaseColor}10`, borderLeft: `3px solid ${phaseColor}` }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span style={{ fontSize: '16px' }}>{meta.icon}</span>
          <span className="text-sm font-semibold text-ice-white">{meta.name}</span>
          <span className="text-caption px-1.5 py-0.5 rounded font-mono"
                style={{ backgroundColor: `${tierColor}20`, color: tierColor, fontSize: '10px' }}>
            T{meta.tier}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-caption" title="V16 Alignment">{alignIcon(alignment)}</span>
          {inDanger && <span className="text-caption" title="In Danger Zone">⚠️</span>}
          {/* View mode toggle */}
          <div className="flex gap-1">
            {hasLeadLag && (
              <button onClick={() => setViewMode(viewMode === 'leadlag' ? 'hide' : 'leadlag')}
                      className="text-caption hover:text-ice-white px-1 rounded"
                      style={{ fontSize: '9px', color: viewMode === 'leadlag' ? phaseColor : COLORS.mutedBlue,
                               backgroundColor: viewMode === 'leadlag' ? `${phaseColor}20` : 'transparent' }}>
                Lead-Lag
              </button>
            )}
            <button onClick={() => setViewMode(viewMode === 'raw' ? 'hide' : 'raw')}
                    className="text-caption hover:text-ice-white px-1 rounded"
                    style={{ fontSize: '9px', color: viewMode === 'raw' ? COLORS.signalYellow : COLORS.mutedBlue,
                             backgroundColor: viewMode === 'raw' ? `${COLORS.signalYellow}20` : 'transparent' }}>
              Raw
            </button>
          </div>
        </div>
      </div>

      {/* Cycle Clock */}
      {cyclePosition && cyclePosition.typical_duration_months > 0 && (
        <CycleClock cyclePosition={cyclePosition} phase={phase} phaseColor={phaseColor} />
      )}

      {/* Phase + Indicator values */}
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
             style={{
               backgroundColor: inDanger ? `${COLORS.signalRed}15` : `${COLORS.signalOrange}10`,
               color: inDanger ? COLORS.signalRed : COLORS.signalOrange,
             }}>
          {inDanger ? '⚠ IN ZONE: ' : '→ '}{phaseData.danger_zone.zone_name}
          {phaseData.danger_zone.distance_absolute != null && !inDanger && (
            <span> (Dist: {phaseData.danger_zone.distance_absolute})</span>
          )}
        </div>
      )}

      {/* Charts */}
      {viewMode === 'leadlag' && cycleId !== 'POLITICAL' && (
        <LeadLagChart cycleId={cycleId} chartData={chartData} />
      )}
      {viewMode === 'raw' && cycleId !== 'POLITICAL' && (
        <div className="mt-3">
          <RawDataChart cycleId={cycleId} chartData={chartData} yFormat={meta.yFormat} yLabel={meta.yLabel} />
        </div>
      )}
      {cycleId === 'POLITICAL' && viewMode !== 'hide' && (
        <div className="mt-3"><PoliticalChart /></div>
      )}

      {/* Footer stats */}
      {chartData && viewMode !== 'hide' && (
        <div className="flex justify-between text-caption mt-1" style={{ fontSize: '9px', color: COLORS.fadedBlue }}>
          <span>{(chartData.phase_zones_count || 0)} phases | {(chartData.smoothed_count || 0)} smooth</span>
          <span>{chartData.indicator_count || 0} pts | {chartData.asset_ticker || '—'} ({chartData.asset_count || 0} pts)</span>
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

  useEffect(() => {
    if (!CHART_URL) return;
    setChartLoading(true);
    fetch(`${CHART_URL}?t=${Date.now()}`, { cache: 'no-store' })
      .then(r => {
        if (!r.ok) throw new Error(`Chart fetch failed: ${r.status}`);
        return r.json();
      })
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
      {/* ═══ ALIGNMENT HEADER ═══ */}
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

      {/* ═══ TIER 1 ═══ */}
      <GlassCard>
        <Section title="Tier 1 — Structural Cycles" defaultOpen={true}>
          {CYCLE_ORDER.filter(id => CYCLE_META[id]?.tier === 1).map(id => (
            <CycleCard key={id} cycleId={id} phaseData={phases[id]} chartData={chartCycles[id]} />
          ))}
        </Section>
      </GlassCard>

      {/* ═══ TIER 2 ═══ */}
      <GlassCard>
        <Section title="Tier 2 — Cyclical Indicators" defaultOpen={true}>
          {CYCLE_ORDER.filter(id => CYCLE_META[id]?.tier === 2).map(id => (
            <CycleCard key={id} cycleId={id} phaseData={phases[id]} chartData={chartCycles[id]} />
          ))}
        </Section>
      </GlassCard>

      {/* ═══ TIER 3 ═══ */}
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
                  <span className="text-caption text-ice-white font-mono w-28">{CYCLE_META[id]?.name?.split(' ')[0] || id}</span>
                  <span className="text-caption font-mono" style={{ color: phColor }}>{phaseLabel(ph)}</span>
                  <span className="text-caption">
                    {alignIcon(al)}{' '}
                    <span style={{ color: al === 'ALIGNED' ? COLORS.signalGreen : al === 'DIVERGED' ? COLORS.signalRed : COLORS.mutedBlue }}>
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
