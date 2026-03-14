'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine, ReferenceArea, BarChart, Bar, Cell,
  Legend,
} from 'recharts';
import GlassCard from '@/components/shared/GlassCard';
import {
  COLORS,
  CYCLE_ALIGNMENT_COLORS,
  CYCLE_PHASE_COLORS,
  CYCLE_TIER_COLORS,
} from '@/lib/constants';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const CHART_URL = process.env.NEXT_PUBLIC_CYCLES_CHART_URL;
const COND_RETURNS_URL = process.env.NEXT_PUBLIC_CYCLES_COND_RETURNS_URL;
const REGIME_URL = process.env.NEXT_PUBLIC_CYCLES_REGIME_URL;
const TRANSITION_URL = process.env.NEXT_PUBLIC_CYCLES_TRANSITION_URL;

const CYCLE_META = {
  LIQUIDITY:    { name: 'Global Liquidity',     icon: '💧', tier: 1, unit: '$T',  indicator: 'Fed Net Liq' },
  CREDIT:       { name: 'Credit Cycle',         icon: '💳', tier: 1, unit: 'bps', indicator: 'HY OAS' },
  COMMODITY:    { name: 'Commodity Supercycle',  icon: '🛢️', tier: 1, unit: '',    indicator: 'CRB Real' },
  CHINA_CREDIT: { name: 'China Credit Impulse',  icon: '🇨🇳', tier: 1, unit: '',   indicator: 'Cu/Au Ratio' },
  DOLLAR:       { name: 'US Dollar Cycle',      icon: '💵', tier: 2, unit: '',    indicator: 'DXY' },
  BUSINESS:     { name: 'Business Cycle',       icon: '🏭', tier: 2, unit: '%',   indicator: 'INDPRO YoY' },
  FED_RATES:    { name: 'Fed / Interest Rate',  icon: '🏦', tier: 2, unit: '%',   indicator: 'Real FFR' },
  EARNINGS:     { name: 'Earnings / Profit',    icon: '📊', tier: 2, unit: '%',   indicator: 'Corp Profits YoY' },
  TRADE:        { name: 'Global Trade',         icon: '🚢', tier: 3, unit: '%',   indicator: 'CASS YoY' },
  POLITICAL:    { name: 'Political Cycle',      icon: '🗳️', tier: 3, unit: '',    indicator: 'Calendar' },
};

const CYCLE_ORDER = [
  'LIQUIDITY', 'CREDIT', 'COMMODITY', 'CHINA_CREDIT',
  'DOLLAR', 'BUSINESS', 'FED_RATES', 'EARNINGS',
  'TRADE', 'POLITICAL',
];

const CLUSTER_LABELS = {
  CREDIT_CLUSTER: 'Credit',
  REAL_ECONOMY_CLUSTER: 'Real Economy',
  MONETARY_POLICY_CLUSTER: 'Monetary Policy',
  CURRENCY_CLUSTER: 'Currency',
};

const CLUSTER_ORDER = [
  'CREDIT_CLUSTER', 'REAL_ECONOMY_CLUSTER',
  'MONETARY_POLICY_CLUSTER', 'CURRENCY_CLUSTER',
];

// Asset display categories
const ASSET_CATEGORIES = [
  { label: 'Edelmetalle', tickers: ['GLD', 'SLV', 'GDX', 'GDXJ', 'SIL', 'PLATINUM'] },
  { label: 'Equity', tickers: ['SPY', 'IWM', 'EEM', 'VGK'] },
  { label: 'Sektoren', tickers: ['XLY', 'XLI', 'XLF', 'XLE', 'XLV', 'XLP', 'XLU', 'VNQ', 'XLK'] },
  { label: 'Bonds', tickers: ['TLT', 'TIP', 'LQD', 'HYG'] },
  { label: 'Commodities', tickers: ['DBC', 'COPPER'] },
  { label: 'Crypto', tickers: ['BTC', 'ETH'] },
];

const ALL_ASSETS_ORDERED = ASSET_CATEGORIES.flatMap(c => c.tickers);

const SEVERITY_COLORS = {
  CALM: COLORS.signalGreen,
  MODERATE: COLORS.signalYellow,
  CASCADE: COLORS.signalOrange,
  CRISIS: COLORS.signalRed,
};

const STATUS_COLORS = {
  EARLY_PHASE: COLORS.signalGreen,
  MID_PHASE: COLORS.baldurBlue || '#4A90D9',
  LATE_PHASE: COLORS.signalYellow,
  EXTENDED: COLORS.signalRed,
  NO_HISTORY: COLORS.fadedBlue,
};

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function phaseLabel(phase) {
  if (!phase || phase === 'UNKNOWN') return '—';
  return phase.replace(/_/g, ' ');
}

function fmtPct(val, dec = 1) {
  if (val == null) return '—';
  return `${(Number(val) * 100).toFixed(dec)}%`;
}

function fmtPctRaw(val, dec = 1) {
  if (val == null) return '—';
  return `${Number(val).toFixed(dec)}%`;
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

function excessColor(val) {
  if (val == null) return COLORS.fadedBlue;
  return val > 0.001 ? COLORS.signalGreen : val < -0.001 ? COLORS.signalRed : COLORS.fadedBlue;
}

// ═══════════════════════════════════════════════════════════════
// SHARED UI COMPONENTS
// ═══════════════════════════════════════════════════════════════

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

function InfoBox({ children }) {
  return (
    <div className="text-caption px-3 py-2 rounded mb-3"
         style={{ backgroundColor: '#0d1f38', color: COLORS.mutedBlue, fontSize: '11px', lineHeight: '1.5' }}>
      {children}
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div style={{ backgroundColor: '#0A1628', border: '1px solid #4A5A7A', borderRadius: '6px', padding: '8px 12px', fontSize: '11px' }}>
      <div style={{ color: COLORS.mutedBlue, marginBottom: '4px', fontWeight: 600 }}>{label}</div>
      {payload.map((entry, i) => (
        entry.value != null ? (
          <div key={i} style={{ color: entry.color, fontSize: '10px' }}>
            {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(3) : entry.value}
          </div>
        ) : null
      ))}
    </div>
  );
}

function Dropdown({ value, onChange, options, label }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {label && <span className="text-caption text-muted-blue">{label}:</span>}
      <select value={value} onChange={e => onChange(e.target.value)}
              style={{ backgroundColor: '#0d1f38', color: COLORS.iceWhite, border: '1px solid #4A5A7A',
                       borderRadius: '4px', padding: '3px 8px', fontSize: '11px', outline: 'none' }}>
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 1. THREAT LEVEL BLOCK
// ═══════════════════════════════════════════════════════════════

function ThreatLevelBlock({ transData, regimeData }) {
  const cascade = transData?.cascade_speed?.current || {};
  const confirmation = transData?.confirmation_counter || {};
  const assessment = transData?.overall_assessment || {};
  const severity = cascade.severity || 'CALM';
  const severityColor = SEVERITY_COLORS[severity] || COLORS.fadedBlue;

  // V16 Transition — find current dual cluster
  const v16Dual = regimeData?.v16_transition_probability?.by_dual_cluster || {};
  let v16Growth = null, v16Stress = null, v16Crisis = null, v16Key = null;
  for (const [key, val] of Object.entries(v16Dual)) {
    if (val && typeof val === 'object' && val.n_months > 0) {
      const g = val.v16_stays_growth_6m;
      if (typeof g === 'number') {
        v16Growth = g; v16Stress = val.v16_to_stress_6m; v16Crisis = val.v16_to_crisis_6m;
        v16Key = key; break;
      }
    }
  }

  // Crash vs Correction
  const crashData = regimeData?.crash_vs_correction || {};
  const entryRules = crashData.entry_rules || {};
  const dualDD = crashData.dual_state_drawdowns || {};
  let crashType = null;
  for (const [, val] of Object.entries(entryRules)) {
    if (val && val.type) { crashType = val.type; break; }
  }

  const extended = assessment.extended_cycles || [];

  return (
    <GlassCard>
      <div className="flex items-center justify-between mb-3">
        <span className="text-label uppercase tracking-wider text-muted-blue">Threat Level</span>
        <span className="px-2 py-1 rounded text-sm font-bold font-mono"
              style={{ backgroundColor: `${severityColor}20`, color: severityColor }}>
          {severity}
        </span>
      </div>

      <InfoBox>
        Kombiniert Cascade Speed, Confirmation Score und V16 Transition Probability zu einer Gesamteinschätzung.
        Grün (CALM) = kein Handlungsbedarf. Gelb (MODERATE) = erhöhte Wachsamkeit. Orange (CASCADE) = defensiv positionieren. Rot (CRISIS) = Krisenmodus.
      </InfoBox>

      {/* Main verdict */}
      <div className="px-3 py-3 rounded mb-3" style={{ backgroundColor: `${severityColor}10`, borderLeft: `3px solid ${severityColor}` }}>
        <div className="text-sm text-ice-white mb-2" style={{ lineHeight: '1.5' }}>
          {assessment.verdict || 'Keine Einschätzung verfügbar'}
        </div>

        <div className="grid grid-cols-3 gap-3 mt-3">
          <div>
            <div className="text-caption text-muted-blue">Cascade Speed</div>
            <div className="text-lg font-mono font-bold" style={{ color: severityColor }}>
              {cascade.cascade_speed ?? '—'}
            </div>
            <div className="text-caption text-muted-blue">{cascade.n_transitions || 0} Transitions / 6Mo</div>
          </div>
          <div>
            <div className="text-caption text-muted-blue">Confirmation</div>
            <div className="text-lg font-mono font-bold" style={{
              color: (confirmation.confirmation_score || 0) > 0 ? COLORS.signalGreen :
                     (confirmation.confirmation_score || 0) < 0 ? COLORS.signalRed : COLORS.mutedBlue
            }}>
              {confirmation.confirmation_score > 0 ? '+' : ''}{confirmation.confirmation_score ?? '—'}
            </div>
            <div className="text-caption text-muted-blue">
              {confirmation.bullish_count || 0}B / {confirmation.bearish_count || 0}R / {confirmation.neutral_count || 0}N
            </div>
          </div>
          <div>
            <div className="text-caption text-muted-blue">V16 → Growth</div>
            <div className="text-lg font-mono font-bold" style={{
              color: v16Growth != null && v16Growth > 0.7 ? COLORS.signalGreen :
                     v16Growth != null && v16Growth < 0.5 ? COLORS.signalRed : COLORS.signalYellow
            }}>
              {v16Growth != null ? `${(v16Growth * 100).toFixed(0)}%` : '—'}
            </div>
            <div className="text-caption text-muted-blue">
              {v16Stress != null ? `Stress ${(v16Stress * 100).toFixed(0)}%` : ''} {v16Crisis != null ? `Crisis ${(v16Crisis * 100).toFixed(0)}%` : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Extended cycles warning */}
      {extended.length > 0 && (
        <div className="text-caption px-2 py-1 rounded"
             style={{ backgroundColor: `${COLORS.signalOrange}10`, color: COLORS.signalOrange }}>
          ⚠ EXTENDED: {extended.join(', ')} — über Median-Dauer hinaus
        </div>
      )}
    </GlassCard>
  );
}

// ═══════════════════════════════════════════════════════════════
// 2. PHASE POSITION BARS
// ═══════════════════════════════════════════════════════════════

function PhasePositionBars({ transData }) {
  const positions = transData?.phase_positions || {};

  return (
    <GlassCard>
      <Section title="Phase Positions — Wo steht jeder Zyklus?" defaultOpen={true}>
        <InfoBox>
          Zeigt wie weit jeder der 9 Zyklen durch seine aktuelle Phase ist.
          100% = historische Median-Dauer erreicht. Über 100% = Phase dauert länger als üblich — Wechsel wird wahrscheinlicher.
        </InfoBox>

        <div className="space-y-2">
          {CYCLE_ORDER.filter(id => id !== 'POLITICAL').map(cid => {
            const pp = positions[cid] || {};
            const meta = CYCLE_META[cid] || {};
            const pct = pp.phase_position_pct;
            const status = pp.status || 'NO_HISTORY';
            const barPct = pct != null ? Math.min(pct, 200) : 0;
            const barWidth = Math.min(barPct / 2, 100); // Scale: 200% → 100% bar width
            const statusColor = STATUS_COLORS[status] || COLORS.fadedBlue;
            const isShortPhase = pct != null && pct > 200;

            return (
              <div key={cid} className="flex items-center gap-2">
                <span className="text-caption font-mono w-24 shrink-0" style={{ color: COLORS.iceWhite }}>
                  {meta.icon} {cid.replace('_', ' ').split(' ')[0]}
                </span>

                <div className="flex-1">
                  <div className="relative h-4 rounded-full overflow-hidden" style={{ backgroundColor: '#1a2a44' }}>
                    <div className="h-full rounded-full transition-all" style={{
                      width: `${barWidth}%`,
                      backgroundColor: statusColor,
                      opacity: 0.7,
                    }} />
                    {/* 100% marker */}
                    <div className="absolute top-0 h-full w-px" style={{ left: '50%', backgroundColor: COLORS.iceWhite, opacity: 0.4 }} />
                  </div>
                </div>

                <span className="text-caption font-mono w-12 text-right" style={{ color: statusColor }}>
                  {pct != null ? `${pct}%` : '—'}
                </span>

                <span className="text-caption w-28 shrink-0" style={{ color: COLORS.mutedBlue, fontSize: '10px' }}>
                  {phaseLabel(pp.current_phase)}
                  {isShortPhase && <span style={{ color: COLORS.signalOrange }}> *</span>}
                </span>

                <span className="text-caption font-mono w-16 text-right shrink-0" style={{ color: COLORS.fadedBlue, fontSize: '10px' }}>
                  ~{pp.remaining_median ?? '?'}Mo
                </span>
              </div>
            );
          })}
        </div>

        <div className="text-caption mt-2" style={{ fontSize: '9px', color: COLORS.fadedBlue }}>
          * Kurzlebige Detail-Phase — Prozentzahl wenig aussagekräftig. Balken-Mitte = 100% (Median-Dauer).
        </div>
      </Section>
    </GlassCard>
  );
}

// ═══════════════════════════════════════════════════════════════
// 3. CASCADE SPEED TIMELINE
// ═══════════════════════════════════════════════════════════════

function CascadeTimeline({ transData }) {
  const historical = transData?.cascade_speed?.historical_cascade_speeds || [];
  const current = transData?.cascade_speed?.current || {};

  const chartData = useMemo(() => {
    if (!historical.length) return [];
    return historical.map(h => ({
      date: h.month,
      speed: h.speed,
    }));
  }, [historical]);

  if (!chartData.length) return null;

  return (
    <GlassCard>
      <Section title="Cascade Speed — Historische Kipp-Geschwindigkeit" defaultOpen={true}>
        <InfoBox>
          Historische Kipp-Geschwindigkeit über 20 Jahre. Unter 0.2 = ruhig (CALM).
          0.2–0.5 = mehrere Zyklen drehen (MODERATE). Über 0.5 = schnelle Kaskade (CASCADE) — erhöhtes Crash-Risiko.
        </InfoBox>

        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a2a44" />

            {/* Background zones */}
            <ReferenceArea y1={0} y2={0.2} fill={COLORS.signalGreen} fillOpacity={0.04} />
            <ReferenceArea y1={0.2} y2={0.5} fill={COLORS.signalYellow} fillOpacity={0.04} />
            <ReferenceArea y1={0.5} y2={1} fill={COLORS.signalOrange} fillOpacity={0.06} />

            {/* Threshold lines */}
            <ReferenceLine y={0.2} stroke={COLORS.signalYellow} strokeDasharray="4 4" strokeWidth={1}
                           label={{ value: 'MODERATE', fill: COLORS.signalYellow, fontSize: 9, position: 'right' }} />
            <ReferenceLine y={0.5} stroke={COLORS.signalOrange} strokeDasharray="4 4" strokeWidth={1}
                           label={{ value: 'CASCADE', fill: COLORS.signalOrange, fontSize: 9, position: 'right' }} />

            <XAxis dataKey="date" tick={{ fill: COLORS.mutedBlue, fontSize: 9 }}
                   interval={Math.max(1, Math.floor(chartData.length / 12))}
                   tickFormatter={d => d?.slice(0, 4)} />
            <YAxis tick={{ fill: COLORS.mutedBlue, fontSize: 9 }} domain={[0, 1]} width={35}
                   tickFormatter={v => v.toFixed(1)} />
            <Tooltip content={<ChartTooltip />} />

            <Line type="monotone" dataKey="speed" stroke={COLORS.signalOrange} strokeWidth={1.5}
                  dot={false} name="Cascade Speed" />
          </LineChart>
        </ResponsiveContainer>

        <div className="flex justify-between text-caption mt-1" style={{ fontSize: '10px' }}>
          <span style={{ color: COLORS.fadedBlue }}>{chartData.length} Monate Historie</span>
          <span style={{ color: SEVERITY_COLORS[current.severity] || COLORS.fadedBlue }}>
            Aktuell: {current.cascade_speed ?? '—'} ({current.severity || '—'})
          </span>
        </div>
      </Section>
    </GlassCard>
  );
}

// ═══════════════════════════════════════════════════════════════
// 4. REGIME HEATMAP
// ═══════════════════════════════════════════════════════════════

function RegimeHeatmap({ regimeData, condReturnsData }) {
  const [selectedCluster, setSelectedCluster] = useState('CREDIT_CLUSTER');
  const marginals = regimeData?.cluster_conditional_returns?.cluster_marginals || {};
  const baselines = condReturnsData?.baselines || {};

  // Get current cluster state from the marginal data
  const clusterMarginal = marginals[selectedCluster] || {};
  // Find which bucket has data (the active one)
  const buckets = Object.keys(clusterMarginal).filter(b => clusterMarginal[b]?.n_months > 0);

  const clusterOptions = CLUSTER_ORDER.map(c => ({ value: c, label: CLUSTER_LABELS[c] }));

  // Build heatmap rows for 6M horizon
  const heatmapData = useMemo(() => {
    const rows = [];
    for (const bucket of buckets) {
      const assets = clusterMarginal[bucket]?.assets || {};
      for (const ticker of ALL_ASSETS_ORDERED) {
        const assetData = assets[ticker]?.['6m'];
        if (!assetData) continue;
        const bl = baselines[ticker]?.baseline_6m;
        const excess = assetData.avg_excess;
        const totalReturn = (bl != null && excess != null) ? bl + excess : assetData.avg;
        rows.push({
          ticker,
          bucket,
          excess: excess,
          totalReturn: totalReturn,
          baseline: bl,
          significant: assetData.significant,
          n: assetData.n_independent || assetData.n,
          strength: assetData.signal_strength,
        });
      }
    }
    return rows;
  }, [clusterMarginal, buckets, baselines]);

  return (
    <GlassCard>
      <Section title="Regime Heatmap — Welche Assets profitieren?" defaultOpen={true}>
        <InfoBox>
          Zeigt den historisch erwarteten 6M-Return für jedes Asset bei aktuellem Cluster-Zustand.
          Grüne Zellen = überdurchschnittlich (positiver Excess). Rote Zellen = unterdurchschnittlich.
          Zahl = Gesamt-Return (Baseline + Excess). Nur signifikante Zellen sind farbig.
        </InfoBox>

        <Dropdown value={selectedCluster} onChange={setSelectedCluster}
                  options={clusterOptions} label="Cluster" />

        {buckets.length === 0 ? (
          <div className="text-caption text-muted-blue py-4 text-center">Keine Marginal-Daten für diesen Cluster</div>
        ) : (
          <div className="space-y-1">
            {/* Header */}
            <div className="flex items-center gap-1 pb-1 border-b border-white/10">
              <span className="text-caption font-mono w-14 shrink-0" style={{ color: COLORS.mutedBlue, fontSize: '9px' }}>Asset</span>
              {buckets.map(b => (
                <span key={b} className="text-caption font-mono flex-1 text-center" style={{ color: COLORS.mutedBlue, fontSize: '9px' }}>
                  {b}
                </span>
              ))}
            </div>

            {/* Rows grouped by category */}
            {ASSET_CATEGORIES.map(cat => {
              const catRows = heatmapData.filter(r => cat.tickers.includes(r.ticker));
              if (catRows.length === 0) return null;

              // Group by ticker
              const tickerMap = {};
              catRows.forEach(r => { tickerMap[r.ticker] = tickerMap[r.ticker] || {}; tickerMap[r.ticker][r.bucket] = r; });

              return (
                <div key={cat.label}>
                  <div className="text-caption mt-2 mb-1" style={{ color: COLORS.fadedBlue, fontSize: '9px' }}>{cat.label}</div>
                  {cat.tickers.map(ticker => {
                    const data = tickerMap[ticker];
                    if (!data) return null;
                    return (
                      <div key={ticker} className="flex items-center gap-1 py-0.5">
                        <span className="text-caption font-mono w-14 shrink-0" style={{ color: COLORS.iceWhite, fontSize: '10px' }}>
                          {ticker}
                        </span>
                        {buckets.map(b => {
                          const cell = data[b];
                          if (!cell) return <span key={b} className="flex-1 text-center text-caption" style={{ color: COLORS.fadedBlue }}>—</span>;
                          const bgOpacity = cell.significant ? 0.15 : 0.03;
                          const color = cell.significant ? excessColor(cell.excess) : COLORS.fadedBlue;
                          return (
                            <span key={b} className="flex-1 text-center text-caption font-mono rounded px-1 py-0.5"
                                  style={{
                                    backgroundColor: `${color}${Math.round(bgOpacity * 255).toString(16).padStart(2, '0')}`,
                                    color: cell.significant ? color : COLORS.fadedBlue,
                                    fontSize: '10px',
                                  }}>
                              {cell.totalReturn != null ? fmtPct(cell.totalReturn) : '—'}
                            </span>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </Section>
    </GlassCard>
  );
}

// ═══════════════════════════════════════════════════════════════
// 5. CONDITIONAL RETURNS BAR CHART
// ═══════════════════════════════════════════════════════════════

function ConditionalReturnsChart({ regimeData, condReturnsData }) {
  const [selectedCluster, setSelectedCluster] = useState('CREDIT_CLUSTER');
  const marginals = regimeData?.cluster_conditional_returns?.cluster_marginals || {};
  const baselines = condReturnsData?.baselines || {};

  const clusterOptions = CLUSTER_ORDER.map(c => ({ value: c, label: CLUSTER_LABELS[c] }));

  const chartData = useMemo(() => {
    const clusterMarginal = marginals[selectedCluster] || {};
    const rows = [];

    for (const [bucket, bData] of Object.entries(clusterMarginal)) {
      if (!bData?.assets) continue;
      for (const ticker of ALL_ASSETS_ORDERED) {
        const d = bData.assets[ticker]?.['6m'];
        if (!d || !d.significant) continue;
        const bl = baselines[ticker]?.baseline_6m;
        rows.push({
          ticker,
          bucket,
          excess: d.avg_excess || 0,
          totalReturn: (bl != null && d.avg_excess != null) ? bl + d.avg_excess : d.avg,
          baseline: bl,
          p10: d.p10,
          p90: d.p90,
          strength: d.signal_strength,
          n: d.n_independent,
        });
      }
    }

    // Sort by excess return descending, take top 15
    rows.sort((a, b) => (b.excess || 0) - (a.excess || 0));
    return rows.slice(0, 15);
  }, [marginals, selectedCluster, baselines]);

  return (
    <GlassCard>
      <Section title="Conditional Returns — Top Assets nach Signal" defaultOpen={true}>
        <InfoBox>
          Die Assets mit dem stärksten signifikanten Signal im aktuellen Regime (6M Horizont).
          Balken = Excess Return über Baseline. Zahl = Gesamt-Return (Baseline + Excess).
          Whiskers zeigen P10/P90 (Tail-Risk Bandbreite).
        </InfoBox>

        <Dropdown value={selectedCluster} onChange={setSelectedCluster}
                  options={clusterOptions} label="Cluster" />

        {chartData.length === 0 ? (
          <div className="text-caption text-muted-blue py-4 text-center">Keine signifikanten Returns für diesen Cluster</div>
        ) : (
          <div className="space-y-1">
            {chartData.map((row, i) => {
              const maxAbs = Math.max(...chartData.map(r => Math.abs(r.excess || 0)), 0.01);
              const barPct = Math.abs(row.excess) / maxAbs * 45; // Max 45% width
              const isPositive = row.excess >= 0;

              return (
                <div key={`${row.ticker}-${i}`} className="flex items-center gap-2 py-0.5">
                  <span className="text-caption font-mono w-14 shrink-0" style={{ color: COLORS.iceWhite, fontSize: '10px' }}>
                    {row.ticker}
                  </span>

                  {/* Bar area */}
                  <div className="flex-1 flex items-center" style={{ height: '18px' }}>
                    <div className="relative w-full h-full flex items-center">
                      {/* Center line (baseline) */}
                      <div className="absolute h-full w-px" style={{ left: '50%', backgroundColor: COLORS.fadedBlue, opacity: 0.5 }} />

                      {/* Bar */}
                      <div className="absolute h-3 rounded-sm" style={{
                        left: isPositive ? '50%' : `${50 - barPct}%`,
                        width: `${barPct}%`,
                        backgroundColor: isPositive ? COLORS.signalGreen : COLORS.signalRed,
                        opacity: 0.6,
                      }} />

                      {/* P10/P90 whiskers */}
                      {row.p10 != null && row.p90 != null && (
                        <>
                          <div className="absolute h-px" style={{
                            left: `${50 + (row.p10 / maxAbs) * 45}%`,
                            width: `${((row.p90 - row.p10) / maxAbs) * 45}%`,
                            backgroundColor: COLORS.fadedBlue, opacity: 0.5,
                            top: '50%',
                          }} />
                        </>
                      )}
                    </div>
                  </div>

                  {/* Total return */}
                  <span className="text-caption font-mono w-16 text-right shrink-0" style={{
                    color: isPositive ? COLORS.signalGreen : COLORS.signalRed, fontSize: '10px'
                  }}>
                    {fmtPct(row.totalReturn)}
                  </span>

                  {/* Excess */}
                  <span className="text-caption font-mono w-14 text-right shrink-0" style={{ color: COLORS.fadedBlue, fontSize: '9px' }}>
                    ({row.excess > 0 ? '+' : ''}{fmtPct(row.excess)})
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Section>
    </GlassCard>
  );
}

// ═══════════════════════════════════════════════════════════════
// 6. V16 TRANSITION STACKED BAR
// ═══════════════════════════════════════════════════════════════

function V16TransitionBar({ regimeData }) {
  const byDual = regimeData?.v16_transition_probability?.by_dual_cluster || {};

  const bars = useMemo(() => {
    const result = [];
    for (const [key, val] of Object.entries(byDual)) {
      if (!val || typeof val !== 'object' || !val.n_months) continue;
      const g = val.v16_stays_growth_6m;
      const s = val.v16_to_stress_6m;
      const c = val.v16_to_crisis_6m;
      if (typeof g !== 'number') continue;
      result.push({
        label: key.replace(/__/g, ' + ').replace(/CREDIT_/g, 'CR:').replace(/REAL_/g, 'RE:')
               .replace('NEUTRAL_MIXED', 'NEUT').replace('BULLISH', 'BULL').replace('BEARISH', 'BEAR'),
        growth: Math.round(g * 100),
        stress: Math.round((s || 0) * 100),
        crisis: Math.round((c || 0) * 100),
        n: val.n_months,
        raw_key: key,
      });
    }
    return result;
  }, [byDual]);

  return (
    <GlassCard>
      <Section title="V16 Transition — Regime-Wechsel-Wahrscheinlichkeit" defaultOpen={true}>
        <InfoBox>
          Historische Wahrscheinlichkeit dass V16 in den nächsten 6 Monaten in GROWTH bleibt, zu STRESS wechselt, oder in CRISIS fällt.
          Basiert auf dem Credit × Real Economy Dual-Cluster-Zustand. Mehr Grün = sicherer.
        </InfoBox>

        {bars.length === 0 ? (
          <div className="text-caption text-muted-blue py-4 text-center">Keine V16 Transition Daten</div>
        ) : (
          <div className="space-y-2">
            {bars.map((bar, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-caption font-mono" style={{ color: COLORS.iceWhite, fontSize: '10px' }}>
                    {bar.label}
                  </span>
                  <span className="text-caption font-mono" style={{ color: COLORS.fadedBlue, fontSize: '9px' }}>
                    n={bar.n}
                  </span>
                </div>
                <div className="flex h-5 rounded-full overflow-hidden">
                  {bar.growth > 0 && (
                    <div style={{ flex: bar.growth, backgroundColor: COLORS.signalGreen, opacity: 0.7 }}
                         className="flex items-center justify-center">
                      <span style={{ fontSize: '9px', color: '#fff', fontWeight: 600 }}>{bar.growth}%</span>
                    </div>
                  )}
                  {bar.stress > 0 && (
                    <div style={{ flex: bar.stress, backgroundColor: COLORS.signalYellow, opacity: 0.7 }}
                         className="flex items-center justify-center">
                      <span style={{ fontSize: '9px', color: '#000', fontWeight: 600 }}>{bar.stress}%</span>
                    </div>
                  )}
                  {bar.crisis > 0 && (
                    <div style={{ flex: bar.crisis, backgroundColor: COLORS.signalRed, opacity: 0.7 }}
                         className="flex items-center justify-center">
                      <span style={{ fontSize: '9px', color: '#fff', fontWeight: 600 }}>{bar.crisis}%</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div className="flex gap-4 text-caption mt-1" style={{ fontSize: '9px' }}>
              <span style={{ color: COLORS.signalGreen }}>● Growth</span>
              <span style={{ color: COLORS.signalYellow }}>● Stress</span>
              <span style={{ color: COLORS.signalRed }}>● Crisis</span>
            </div>
          </div>
        )}
      </Section>
    </GlassCard>
  );
}

// ═══════════════════════════════════════════════════════════════
// 7. ANALOGUES TIMELINE
// ═══════════════════════════════════════════════════════════════

function AnaloguesTimeline({ regimeData }) {
  const analogues = regimeData?.historical_analogues?.analogues || [];

  if (!analogues.length) return null;

  return (
    <GlassCard>
      <Section title="Historische Analogien — Wann sah es zuletzt so aus?" defaultOpen={true}>
        <InfoBox>
          Die 5 historisch ähnlichsten Perioden zum aktuellen Cluster-Zustand.
          Zeigt was danach mit SPY, Gold und Treasuries passierte (6M Forward).
          Similarity Score = wie nah der damalige Zustand am heutigen war (1.0 = identisch).
        </InfoBox>

        <div className="space-y-2">
          {analogues.slice(0, 5).map((a, i) => {
            const whn = a.what_happened_next || {};
            const spy = whn.spy_6m_return;
            const gld = whn.gld_6m_return;
            const tlt = whn.tlt_6m_return;

            return (
              <div key={i} className="px-3 py-2 rounded" style={{ backgroundColor: '#0d1f38' }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-caption font-mono font-semibold" style={{ color: COLORS.iceWhite }}>
                    {a.period_start}
                  </span>
                  <span className="text-caption font-mono" style={{ color: COLORS.mutedBlue }}>
                    Sim: {a.similarity_score}
                  </span>
                </div>
                <div className="flex gap-4">
                  <span className="text-caption font-mono" style={{ color: spy != null && spy > 0 ? COLORS.signalGreen : COLORS.signalRed }}>
                    SPY {spy != null ? `${(spy * 100).toFixed(1)}%` : '—'}
                  </span>
                  <span className="text-caption font-mono" style={{ color: gld != null && gld > 0 ? COLORS.signalGreen : COLORS.signalRed }}>
                    GLD {gld != null ? `${(gld * 100).toFixed(1)}%` : '—'}
                  </span>
                  <span className="text-caption font-mono" style={{ color: tlt != null && tlt > 0 ? COLORS.signalGreen : COLORS.signalRed }}>
                    TLT {tlt != null ? `${(tlt * 100).toFixed(1)}%` : '—'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </Section>
    </GlassCard>
  );
}

// ═══════════════════════════════════════════════════════════════
// 8. CRASH VS KORREKTUR
// ═══════════════════════════════════════════════════════════════

function CrashVsCorrection({ regimeData }) {
  const crashData = regimeData?.crash_vs_correction || {};
  const dualDD = crashData.dual_state_drawdowns || {};
  const entryRules = crashData.entry_rules || {};

  const entries = Object.entries(dualDD).filter(([, v]) => v && typeof v === 'object');
  if (entries.length === 0) return null;

  return (
    <GlassCard>
      <Section title="Crash vs. Korrektur — Wie schlimm kann es werden?" defaultOpen={true}>
        <InfoBox>
          Credit + Business Dual-State bestimmt ob ein Rücksetzer eine -10% Korrektur oder ein -30% Crash wird.
          Zeigt historische Drawdowns bei verschiedenen Kombinationen. Worst = schlimmster jemals gemessener Fall.
        </InfoBox>

        <div className="space-y-2">
          {entries.map(([key, val]) => {
            const rule = entryRules[key] || {};
            const typeColor = rule.type === 'CRASH' ? COLORS.signalRed :
                              rule.type === 'CORRECTION' ? COLORS.signalYellow : COLORS.signalOrange;

            return (
              <div key={key} className="px-3 py-2 rounded" style={{ backgroundColor: '#0d1f38', borderLeft: `3px solid ${typeColor}` }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-caption font-mono" style={{ color: COLORS.iceWhite, fontSize: '10px' }}>
                    {key.replace(/__/g, ' + ')}
                  </span>
                  {rule.type && (
                    <span className="text-caption font-mono px-1.5 py-0.5 rounded" style={{
                      backgroundColor: `${typeColor}20`, color: typeColor, fontSize: '9px'
                    }}>
                      {rule.type}
                    </span>
                  )}
                </div>
                <div className="flex gap-4 text-caption font-mono" style={{ fontSize: '10px' }}>
                  <span style={{ color: COLORS.mutedBlue }}>
                    Avg: {val.avg_return != null ? fmtPct(val.avg_return) : '—'}
                  </span>
                  <span style={{ color: COLORS.signalRed }}>
                    Worst: {val.worst != null ? fmtPct(val.worst) : '—'}
                  </span>
                  <span style={{ color: COLORS.signalOrange }}>
                    P10: {val.p10 != null ? fmtPct(val.p10) : '—'}
                  </span>
                  <span style={{ color: COLORS.fadedBlue }}>
                    n={val.n || '?'}
                  </span>
                </div>
                {rule.entry_zone && (
                  <div className="text-caption mt-1" style={{ color: COLORS.fadedBlue, fontSize: '9px' }}>
                    Entry Zone: {rule.entry_zone}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Section>
    </GlassCard>
  );
}

// ═══════════════════════════════════════════════════════════════
// 9. CYCLE CARDS (Phase-Lifecycle Chart + Conditional Return Profile)
// ═══════════════════════════════════════════════════════════════

function PhaseLifecycleChart({ chartData }) {
  if (!chartData) return null;

  const indicator = chartData.indicator || [];
  const smoothed = chartData.smoothed || [];
  const ma12m = chartData.ma_12m || [];
  const phaseZones = chartData.phase_zones || [];

  if (indicator.length < 24) return null;

  // Build merged data
  const smoothedMap = {};
  smoothed.forEach(p => { if (p.value != null) smoothedMap[p.date] = p.value; });
  const maMap = {};
  ma12m.forEach(p => { if (p.value != null) maMap[p.date] = p.value; });

  const merged = indicator.map(p => ({
    date: p.date,
    indicator: p.value,
    smoothed: smoothedMap[p.date] ?? null,
    ma: maMap[p.date] ?? null,
  })).filter(d => d.indicator != null);

  if (merged.length < 24) return null;

  const tickInterval = Math.max(1, Math.floor(merged.length / 10));

  // Phase zone reference areas
  const zoneAreas = phaseZones.map((z, i) => ({
    x1: z.start,
    x2: z.end,
    color: z.color === 'green' ? COLORS.signalGreen :
           z.color === 'yellow' ? COLORS.signalYellow :
           z.color === 'orange' ? COLORS.signalOrange :
           z.color === 'red' ? COLORS.signalRed : '#4A5A7A',
    key: i,
  }));

  return (
    <div className="mt-2">
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={merged} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a2a44" />

          {/* Phase zone backgrounds */}
          {zoneAreas.map(z => (
            <ReferenceArea key={z.key} x1={z.x1} x2={z.x2} fill={z.color} fillOpacity={0.06} ifOverflow="extendDomain" />
          ))}

          <XAxis dataKey="date" tick={{ fill: COLORS.mutedBlue, fontSize: 9 }}
                 interval={tickInterval} tickFormatter={d => d?.slice(0, 4)} />
          <YAxis tick={{ fill: COLORS.mutedBlue, fontSize: 9 }} width={45}
                 tickFormatter={v => typeof v === 'number' ? v.toFixed(1) : ''} />
          <Tooltip content={<ChartTooltip />} />

          <Line type="monotone" dataKey="indicator" stroke={COLORS.iceWhite} strokeWidth={1} dot={false}
                name="Indicator" connectNulls strokeOpacity={0.5} />
          <Line type="monotone" dataKey="smoothed" stroke={COLORS.baldurBlue || '#4A90D9'} strokeWidth={2} dot={false}
                name="Smoothed (2x12M)" connectNulls />
          <Line type="monotone" dataKey="ma" stroke={COLORS.signalYellow} strokeWidth={1} dot={false}
                name="12M MA" connectNulls strokeOpacity={0.6} strokeDasharray="4 4" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function ConditionalReturnProfile({ cycleId, condReturnsData }) {
  if (!condReturnsData) return null;

  const condReturns = condReturnsData.conditional_returns || {};
  const baselines = condReturnsData.baselines || {};
  const cycleData = condReturns[cycleId] || {};

  // Find current phase from the last bucket with data
  // Use BUCKET level returns for more robust signals
  const bucketKeys = Object.keys(cycleData).filter(k => k.startsWith('BUCKET_'));
  if (bucketKeys.length === 0) return null;

  // Find the most relevant bucket (prefer BULLISH or BEARISH over NEUTRAL)
  const preferredOrder = ['BUCKET_BULLISH', 'BUCKET_BEARISH', 'BUCKET_NEUTRAL_MIXED'];
  const activeBucket = preferredOrder.find(b => cycleData[b]) || bucketKeys[0];
  const bucketData = cycleData[activeBucket] || {};

  // Get top 8 assets by absolute excess return (significant only)
  const rows = [];
  for (const ticker of ALL_ASSETS_ORDERED) {
    const d = bucketData[ticker]?.['6m'];
    if (!d || !d.significant) continue;
    const bl = baselines[ticker]?.baseline_6m;
    rows.push({
      ticker,
      excess: d.avg_excess || 0,
      totalReturn: (bl != null && d.avg_excess != null) ? bl + d.avg_excess : d.avg,
      strength: d.signal_strength,
    });
  }

  rows.sort((a, b) => Math.abs(b.excess) - Math.abs(a.excess));
  const topRows = rows.slice(0, 8);

  if (topRows.length === 0) return null;

  return (
    <div className="mt-2">
      <div className="text-caption mb-1" style={{ color: COLORS.fadedBlue, fontSize: '9px' }}>
        Conditional Returns ({activeBucket.replace('BUCKET_', '')} 6M, signifikant):
      </div>
      <div className="space-y-0.5">
        {topRows.map(row => (
          <div key={row.ticker} className="flex items-center gap-1">
            <span className="text-caption font-mono w-12" style={{ color: COLORS.iceWhite, fontSize: '9px' }}>{row.ticker}</span>
            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#1a2a44' }}>
              <div className="h-full rounded-full" style={{
                width: `${Math.min(Math.abs(row.excess) * 500, 100)}%`,
                backgroundColor: row.excess >= 0 ? COLORS.signalGreen : COLORS.signalRed,
                opacity: 0.6,
              }} />
            </div>
            <span className="text-caption font-mono w-14 text-right" style={{
              color: row.excess >= 0 ? COLORS.signalGreen : COLORS.signalRed, fontSize: '9px'
            }}>
              {fmtPct(row.totalReturn)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CycleCard({ cycleId, phaseData, chartData, transData, condReturnsData }) {
  const [showChart, setShowChart] = useState(false);
  const meta = CYCLE_META[cycleId] || {};
  const phase = phaseData?.phase || 'UNKNOWN';
  const confidence = phaseData?.confidence;
  const alignment = phaseData?.v16_alignment || 'NEUTRAL';
  const inDanger = phaseData?.in_danger_zone;
  const phaseColor = CYCLE_PHASE_COLORS[phase] || COLORS.fadedBlue;
  const tierColor = CYCLE_TIER_COLORS[meta.tier] || COLORS.mutedBlue;

  // Phase position from transition engine (fixes Dollar/Fed 0% bug)
  const pp = transData?.phase_positions?.[cycleId] || {};
  const pct = pp.phase_position_pct;
  const status = pp.status;
  const remaining = pp.remaining_median;
  const statusColor = STATUS_COLORS[status] || COLORS.fadedBlue;

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
          <span className="text-caption" style={{ color: alignment === 'ALIGNED' ? COLORS.signalGreen : alignment === 'DIVERGED' ? COLORS.signalRed : COLORS.mutedBlue }}>
            {alignment === 'ALIGNED' ? '✅' : alignment === 'DIVERGED' ? '❌' : '➖'}
          </span>
          {inDanger && <span className="text-caption">⚠️</span>}
          <button onClick={() => setShowChart(!showChart)}
                  className="text-caption text-muted-blue hover:text-ice-white" style={{ fontSize: '10px' }}>
            {showChart ? '▾' : '▸'}
          </button>
        </div>
      </div>

      {/* Phase Position Bar (from transition engine) */}
      {pct != null && (
        <div className="mb-2">
          <div className="flex items-center justify-between text-caption mb-0.5">
            <span style={{ color: phaseColor, fontWeight: 600 }}>{phaseLabel(phase)}</span>
            <span className="font-mono" style={{ fontSize: '10px', color: statusColor }}>
              {pct}% | {status?.replace('_', ' ')} | ~{remaining ?? '?'}Mo
            </span>
          </div>
          <div className="relative h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#1a2a44' }}>
            <div className="h-full rounded-full" style={{
              width: `${Math.min(pct / 2, 100)}%`,
              backgroundColor: statusColor, opacity: 0.7,
            }} />
            <div className="absolute top-0 h-full w-px" style={{ left: '50%', backgroundColor: COLORS.iceWhite, opacity: 0.3 }} />
          </div>
        </div>
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

      {/* Charts (expandable) */}
      {showChart && cycleId !== 'POLITICAL' && (
        <>
          <PhaseLifecycleChart chartData={chartData} />
          <ConditionalReturnProfile cycleId={cycleId} condReturnsData={condReturnsData} />
        </>
      )}

      {/* Political Chart */}
      {showChart && cycleId === 'POLITICAL' && <PoliticalChart />}
    </div>
  );
}

function PoliticalChart() {
  const yr = new Date().getFullYear();
  const data = [];
  for (let y = yr - 12; y <= yr + 4; y++) {
    const cy = ((y - 2025) % 4 + 4) % 4 + 1;
    data.push({ date: String(y), value: { 1: 6.5, 2: 4.2, 3: 16.3, 4: 7.5 }[cy] });
  }
  return (
    <div className="mt-3">
      <ResponsiveContainer width="100%" height={150}>
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
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 10. LLM CYCLE NARRATIVE
// ═══════════════════════════════════════════════════════════════

function CycleNarrative({ transData }) {
  const narrative = transData?.cycle_narrative;

  if (!narrative?.text) return null;

  return (
    <GlassCard>
      <Section title="Zyklen-Analyse — KI-Synthese" defaultOpen={true}>
        <InfoBox>
          Wöchentlich generierte Zusammenfassung der gesamten Zyklen-Engine.
          Destilliert alle Berechnungen — Phase Positions, Cascade Speed, V16 Transition, Conditional Returns,
          historische Analogien — in eine verständliche Einschätzung mit konkreten Handlungsimplikationen.
        </InfoBox>

        <div className="px-4 py-3 rounded" style={{ backgroundColor: '#0d1f38', borderLeft: `3px solid ${COLORS.baldurBlue || '#4A90D9'}` }}>
          <div className="text-sm text-ice-white" style={{ lineHeight: '1.7', whiteSpace: 'pre-line' }}>
            {narrative.text}
          </div>
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/10">
            <span className="text-caption text-muted-blue font-mono" style={{ fontSize: '9px' }}>
              {narrative.model} | {narrative.word_count} Wörter
            </span>
            <span className="text-caption text-muted-blue font-mono" style={{ fontSize: '9px' }}>
              {narrative.generated_at ? new Date(narrative.generated_at).toLocaleString('de-DE') : ''}
            </span>
          </div>
        </div>
      </Section>
    </GlassCard>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function CyclesDetail({ dashboard }) {
  const cy = dashboard?.cycles;
  const [chartDataAll, setChartDataAll] = useState(null);
  const [condReturnsData, setCondReturnsData] = useState(null);
  const [regimeData, setRegimeData] = useState(null);
  const [transData, setTransData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const urls = [
      { url: CHART_URL, setter: setChartDataAll, name: 'chart' },
      { url: COND_RETURNS_URL, setter: setCondReturnsData, name: 'cond_returns' },
      { url: REGIME_URL, setter: setRegimeData, name: 'regime' },
      { url: TRANSITION_URL, setter: setTransData, name: 'transition' },
    ].filter(u => u.url);

    if (urls.length === 0) return;

    setLoading(true);
    const errors = [];

    Promise.allSettled(
      urls.map(u =>
        fetch(`${u.url}?t=${Date.now()}`, { cache: 'no-store' })
          .then(r => { if (!r.ok) throw new Error(`${u.name}: ${r.status}`); return r.json(); })
          .then(data => u.setter(data))
          .catch(err => errors.push(`${u.name}: ${err.message}`))
      )
    ).finally(() => {
      setLoading(false);
      if (errors.length) setError(errors.join(', '));
    });
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
        {loading && <div className="mt-2 text-caption text-muted-blue">Lade Engine-Daten...</div>}
        {error && <div className="mt-2 text-caption" style={{ color: COLORS.signalOrange }}>Fehler: {error}</div>}
      </GlassCard>

      {/* Threat Level */}
      {transData && <ThreatLevelBlock transData={transData} regimeData={regimeData} />}

      {/* Phase Positions */}
      {transData && <PhasePositionBars transData={transData} />}

      {/* Cascade Speed Timeline */}
      {transData && <CascadeTimeline transData={transData} />}

      {/* Regime Heatmap */}
      {regimeData && <RegimeHeatmap regimeData={regimeData} condReturnsData={condReturnsData} />}

      {/* Conditional Returns */}
      {regimeData && <ConditionalReturnsChart regimeData={regimeData} condReturnsData={condReturnsData} />}

      {/* V16 Transition */}
      {regimeData && <V16TransitionBar regimeData={regimeData} />}

      {/* Analogues */}
      {regimeData && <AnaloguesTimeline regimeData={regimeData} />}

      {/* Crash vs Korrektur */}
      {regimeData && <CrashVsCorrection regimeData={regimeData} />}

      {/* Cycle Cards */}
      <GlassCard>
        <Section title="Tier 1 — Structural Cycles" defaultOpen={true}>
          {CYCLE_ORDER.filter(id => CYCLE_META[id]?.tier === 1).map(id => (
            <CycleCard key={id} cycleId={id} phaseData={phases[id]} chartData={chartCycles[id]}
                       transData={transData} condReturnsData={condReturnsData} />
          ))}
        </Section>
      </GlassCard>

      <GlassCard>
        <Section title="Tier 2 — Cyclical Indicators" defaultOpen={true}>
          {CYCLE_ORDER.filter(id => CYCLE_META[id]?.tier === 2).map(id => (
            <CycleCard key={id} cycleId={id} phaseData={phases[id]} chartData={chartCycles[id]}
                       transData={transData} condReturnsData={condReturnsData} />
          ))}
        </Section>
      </GlassCard>

      <GlassCard>
        <Section title="Tier 3 — Supplementary" defaultOpen={true}>
          {CYCLE_ORDER.filter(id => CYCLE_META[id]?.tier === 3).map(id => (
            <CycleCard key={id} cycleId={id} phaseData={phases[id]} chartData={chartCycles[id]}
                       transData={transData} condReturnsData={condReturnsData} />
          ))}
        </Section>
      </GlassCard>

      {/* LLM Narrative */}
      {transData && <CycleNarrative transData={transData} />}

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
                    {al === 'ALIGNED' ? '✅' : al === 'DIVERGED' ? '❌' : '➖'}{' '}
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
