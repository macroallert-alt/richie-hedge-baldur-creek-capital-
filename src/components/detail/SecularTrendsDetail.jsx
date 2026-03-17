'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine, ReferenceArea, ReferenceDot, Legend,
} from 'recharts';
import GlassCard from '@/components/shared/GlassCard';
import { COLORS } from '@/lib/constants';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const SECULAR_URL = process.env.NEXT_PUBLIC_SECULAR_TRENDS_URL;

const REGIME_META = {
  demographic_cliff:     { icon: '👴', name_de: 'Der Demografische Abgrund',  color: '#E74C3C' },
  deglobalization:       { icon: '🏭', name_de: 'Deglobalisierung & Reshoring', color: '#F5A623' },
  fiscal_dominance:      { icon: '💰', name_de: 'Fiskalische Dominanz',       color: '#E74C3C' },
  financial_repression:  { icon: '🏦', name_de: 'Finanzielle Repression',     color: '#9B59B6' },
  great_divergence:      { icon: '⚖️', name_de: 'Die Große Divergenz',        color: '#F5A623' },
};

const REGIME_ORDER = [
  'demographic_cliff', 'deglobalization', 'fiscal_dominance',
  'financial_repression', 'great_divergence',
];

const ASSET_LABELS = {
  gold: 'Gold', silver_copper: 'Silber / Kupfer', oil_commodities: 'Öl / Rohstoffe',
  spy_real: 'SPY (real)', bonds: 'Bonds',
};

const SIGNAL_COLORS = {
  'EXTREM BILLIG': COLORS.signalGreen, 'SEHR BILLIG': COLORS.signalGreen,
  'BILLIG': '#4CAF50', 'FAIR': COLORS.mutedBlue,
  'TEUER': COLORS.signalOrange, 'SEHR TEUER': COLORS.signalRed,
  'EXTREM TEUER': COLORS.signalRed, 'KEINE DATEN': COLORS.fadedBlue,
};

const COMBINED_COLORS = {
  'EXTREM STARK': COLORS.signalGreen, 'STARK': COLORS.signalGreen,
  'MODERAT': '#4CAF50', 'NEUTRAL': COLORS.mutedBlue,
  'MODERAT NEGATIV': COLORS.signalOrange, 'STARK NEGATIV': COLORS.signalRed,
};

const FUND_ICONS = {
  'STARK BESTÄTIGT': '✅✅', 'TEILWEISE BESTÄTIGT': '✅',
  'KEINE DATEN': '—', 'GEMISCHT': '⚠️', 'WIDERSPRICHT': '❌',
};

const FRAGILITY_COLORS = {
  INACTIVE: COLORS.fadedBlue, WATCH: COLORS.signalYellow, ACTIVE: COLORS.signalRed,
};

const CHART_COLORS = ['#4A90D9', '#E74C3C', '#F5A623', '#2ECC71', '#9B59B6', '#1ABC9C'];

// ═══════════════════════════════════════════════════════════════
// CHART INSIGHT — Regime & Investment implications per chart
// ═══════════════════════════════════════════════════════════════

const REGIME_IMPLICATIONS = {
  demographic_cliff: 'Weniger Arbeitskräfte bedeuten strukturell höhere Löhne und Inflation. Schlecht für Anleihen und nominale Aktienrenditen, gut für reale Sachwerte wie Gold und Rohstoffe.',
  deglobalization: 'Reshoring und Handelsfragmentierung erhöhen Produktionskosten und erzeugen strukturelle Inflation. Gut für inländische Produzenten und Rohstoffe, schlecht für margenabhängige Technologieaktien.',
  fiscal_dominance: 'Wenn Zinszahlungen Verteidigung oder Investitionen verdrängen, verliert der Staat fiskalischen Spielraum. Gold und Sachwerte profitieren, Staatsanleihen leiden unter Vertrauensverlust.',
  financial_repression: 'Negative Realzinsen bedeuten: Sparer verlieren Kaufkraft. Gold ist historisch der stärkste Profiteur. Anleihen verlieren real an Wert, auch wenn sie nominal stabil erscheinen.',
  great_divergence: 'Das Pendel zwischen Financial und Real Assets schwingt in Dekaden. Wenn Real Assets relativ billig sind und die anderen 4 Regime aktiv, beginnt ein neuer Superzyklus für Rohstoffe und Edelmetalle.',
};

const CHART_CONTEXT = {
  civpart: { what_measures: 'Anteil der US-Bevölkerung die arbeitet oder Arbeit sucht', direction_meaning: 'Fallend = weniger Arbeitskräfte verfügbar = engerer Arbeitsmarkt = Lohndruck', dashed_line: 'historischer Durchschnitt' },
  working_age_pop: { what_measures: 'Jährliches Wachstum der Bevölkerung im erwerbsfähigen Alter (15-64) in USA, China, Deutschland', direction_meaning: 'Unter Null = die arbeitsfähige Bevölkerung schrumpft absolut', dashed_line: 'Nulllinie — darunter bedeutet Schrumpfung' },
  imports_gdp: { what_measures: 'US-Importe als Anteil am BIP — Maß für Globalisierungsgrad', direction_meaning: 'Fallend = Deglobalisierung, weniger Importabhängigkeit', dashed_line: 'historischer Durchschnitt' },
  mfg_employment: { what_measures: 'Anteil der Industriearbeitsplätze an allen Arbeitsplätzen', direction_meaning: 'Steigend nach jahrzehntelangem Fall = Reshoring beginnt', dashed_line: 'historischer Durchschnitt' },
  trade_balance_gdp: { what_measures: 'US-Handelsbilanzsaldo als Anteil am BIP', direction_meaning: 'Tiefer Negativwert = massives Defizit, das durch Dollar-Schwäche oder Reshoring korrigiert werden muss', dashed_line: 'Nulllinie — ausgeglichener Handel' },
  interest_vs_defense: { what_measures: 'Jährliche Zinslast des US-Staats vs. Verteidigungsausgaben', direction_meaning: 'Wenn die rote Linie (Zinsen) die dunkle (Verteidigung) überholt, verdrängen Schuldzinsen alle anderen Ausgaben', dashed_line: null },
  debt_gdp: { what_measures: 'Gesamte US-Staatsverschuldung als Anteil am BIP', direction_meaning: 'Über 100% = Schulden übersteigen die jährliche Wirtschaftsleistung', dashed_line: '100%-Marke — Schulden = eine volle Jahreswirtschaftsleistung' },
  spy_m2: { what_measures: 'S&P 500 geteilt durch Geldmenge M2 — Aktien inflationsbereinigt', direction_meaning: 'Hoch = Aktien kaufkraftbereinigt teuer, Gewinne sind nominal aufgebläht, nicht real', dashed_line: 'historischer Durchschnitt' },
  real_rate: { what_measures: '10-Jahres-Zins minus CPI-Inflation = was Sparer real verdienen', direction_meaning: 'Negativ (unter gestrichelter Linie) = Sparer verlieren Kaufkraft, positiv = Sparer gewinnen', dashed_line: 'Nulllinie — darüber gewinnen Sparer, darunter verlieren sie' },
  gold_vs_real_rates: { what_measures: 'Goldpreis (linke Achse) vs. Realzins invertiert (rechte Achse)', direction_meaning: 'Wenn beide Linien steigen, bestätigt sich: fallende Realzinsen treiben Gold', dashed_line: null },
  gold_spy_ratio: { what_measures: 'Goldpreis geteilt durch S&P 500 — Real vs. Financial Assets Pendel', direction_meaning: 'Steigend = Gold gewinnt gegen Aktien, das Pendel schwingt zu Real Assets', dashed_line: 'historischer Durchschnitt' },
  oil_m2: { what_measures: 'Ölpreis geteilt durch Geldmenge M2 — Öl kaufkraftbereinigt', direction_meaning: 'Tief = Öl real so billig wie seit Jahrzehnten nicht — Basis für nächsten Superzyklus', dashed_line: 'historischer Durchschnitt' },
  corp_profits_gdp: { what_measures: 'Unternehmensgewinne als Anteil am BIP — Maß für Financialization', direction_meaning: 'Hoch = Rekord-Gewinnmargen die historisch nicht haltbar sind (Mean Reversion Kandidat)', dashed_line: 'historischer Durchschnitt' },
};

const REGIME_BREAKERS = {
  demographic_cliff: 'Durchbruch bei Arbeitsproduktivität durch Technologie/Automatisierung (>2.5% p.a. nachhaltig) würde den Arbeitskräftemangel kompensieren.',
  deglobalization: 'Geopolitische Entspannung (z.B. US-China Deal) und Normalisierung der Handelsströme würden den Deglobalisierungs-Trend pausieren.',
  fiscal_dominance: 'Ein Produktivitätsboom der das BIP-Wachstum dauerhaft über die Zinskosten hebt, würde die Schulden tragbar machen.',
  financial_repression: 'Ein "Volcker 2.0" — bewusste Rezession mit Realzinsen dauerhaft über 2% — würde die Repression beenden, aber eine schwere Rezession auslösen.',
  great_divergence: 'Eine Technologie-Disruption die physische Rohstoffe obsolet macht (z.B. Fusion, vollständige Elektrifizierung), oder eine Rückkehr negativer Gold/SPY Momentum über 12+ Monate.',
};

function generateChartInsight(chart, regimeKey, statusData) {
  const ctx = CHART_CONTEXT[chart.id] || {};
  const cur = chart.current;
  const mean = chart.alltime_mean;
  const pctl = chart.percentile;
  const pctl20 = chart.percentile_20y;
  const unit = chart.unit || '';
  const hasRef = !!chart.reference_line;
  const refVal = chart.reference_line?.value;
  const refLabel = chart.reference_line?.label;

  const parts = [];

  // 1. Was sehe ich?
  let layer1 = '';
  if (cur != null) {
    layer1 = `Der aktuelle Wert liegt bei ${fmtVal(cur)}${unit ? ' ' + unit : ''}.`;
    if (mean != null && chart.type !== 'multi_line' && chart.type !== 'dual_line' && chart.type !== 'dual_axis_gold_realrate') {
      const dashedExplain = ctx.dashed_line || 'historischer Durchschnitt';
      layer1 += ` Die gestrichelte Linie zeigt den ${dashedExplain} (${fmtVal(mean)}${unit ? ' ' + unit : ''}).`;
    } else if (hasRef && refLabel) {
      layer1 += ` Die gestrichelte Linie markiert: ${refLabel}.`;
    }
  } else if (chart.type === 'multi_line') {
    layer1 = ctx.what_measures || 'Dieser Chart zeigt mehrere Zeitreihen im Vergleich.';
    if (hasRef && refLabel) layer1 += ` Die gestrichelte Linie markiert: ${refLabel}.`;
  } else if (chart.type === 'dual_line') {
    layer1 = ctx.what_measures || 'Dieser Chart vergleicht zwei Zeitreihen.';
  }
  if (layer1) parts.push(layer1);

  // 2. Was bedeutet das?
  let layer2 = '';
  if (pctl != null && mean != null && cur != null) {
    const above = cur > mean;
    const distance = mean !== 0 ? Math.abs((cur - mean) / mean * 100).toFixed(0) : '—';
    const extreme = pctl > 90 ? 'extrem hoch' : pctl > 75 ? 'deutlich erhöht' : pctl < 10 ? 'extrem niedrig' : pctl < 25 ? 'deutlich gedrückt' : 'im mittleren Bereich';
    layer2 = `Das ist das ${pctl}. Perzentil (${extreme}) — ${above ? 'über' : 'unter'} dem historischen Durchschnitt um ~${distance}%. Höher als in ${pctl}% aller Monate seit Beginn der Aufzeichnung.`;
  } else if (chart.type === 'multi_line' || chart.type === 'dual_line') {
    layer2 = ctx.direction_meaning || '';
  }
  if (layer2) parts.push(layer2);

  // 3. Was impliziert das?
  const impl = REGIME_IMPLICATIONS[regimeKey];
  if (impl) parts.push(impl);

  // 4. Mean Reversion
  let layer4 = '';
  if (cur != null && mean != null && chart.type !== 'multi_line' && chart.type !== 'dual_line' && chart.type !== 'dual_axis_gold_realrate') {
    const above = cur > mean;
    if (above) {
      layer4 = `Der Wert liegt über der gestrichelten Linie (Durchschnitt). Mean Reversion würde nach unten laufen, Richtung ${fmtVal(mean)}${unit ? ' ' + unit : ''}.`;
      if (pctl != null && pctl > 75) layer4 += ' Bei diesem Perzentil ist die historische Wahrscheinlichkeit einer Normalisierung erhöht.';
    } else {
      layer4 = `Der Wert liegt unter der gestrichelten Linie. Mean Reversion würde nach oben laufen, Richtung ${fmtVal(mean)}${unit ? ' ' + unit : ''}.`;
      if (pctl != null && pctl < 25) layer4 += ' Bei diesem Perzentil ist die historische Wahrscheinlichkeit einer Erholung erhöht.';
    }
  } else if (hasRef && refVal != null && cur != null) {
    const above = cur > refVal;
    layer4 = above
      ? `Der Wert liegt über der Referenzlinie (${refLabel || refVal}). Eine Rückkehr darunter würde das Signal abschwächen.`
      : `Der Wert liegt unter der Referenzlinie (${refLabel || refVal}). Eine Rückkehr darüber würde das Signal abschwächen.`;
  }
  if (layer4) parts.push(layer4);

  // 5. Katalysatoren dagegen
  const breaker = REGIME_BREAKERS[regimeKey];
  if (breaker) parts.push(`Was dagegen spricht: ${breaker}`);

  return parts;
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function fmtPct(v) { return v == null ? '—' : `${v > 0 ? '+' : ''}${v}%`; }
function fmtVal(v, d = 2) { return v == null ? '—' : Number(v).toFixed(d); }

// ═══════════════════════════════════════════════════════════════
// SHARED UI
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

function InfoToggle({ children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-3">
      <button onClick={() => setOpen(!open)}
        style={{ backgroundColor: open ? '#1a3050' : 'transparent', border: '1px solid #4A5A7A',
          borderRadius: '12px', padding: '2px 8px', color: COLORS.mutedBlue,
          fontSize: '10px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        ⓘ {open ? 'Ausblenden' : 'Was bedeutet das?'}
      </button>
      {open && (
        <div className="text-caption px-3 py-2 rounded mt-2"
          style={{ backgroundColor: '#0d1f38', color: COLORS.mutedBlue, fontSize: '11px', lineHeight: '1.5' }}>
          {children}
        </div>
      )}
    </div>
  );
}

function ChartInsightToggle({ chart, regimeKey, statusData }) {
  const [open, setOpen] = useState(false);
  const parts = useMemo(() => generateChartInsight(chart, regimeKey, statusData), [chart, regimeKey, statusData]);
  if (parts.length === 0) return null;

  return (
    <div className="mb-2 -mt-1">
      <button onClick={() => setOpen(!open)}
        style={{ backgroundColor: open ? '#1a3050' : 'transparent', border: '1px solid #4A5A7A',
          borderRadius: '12px', padding: '2px 8px', color: COLORS.mutedBlue,
          fontSize: '10px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        📊 {open ? 'Ausblenden' : 'Chart erklärt'}
      </button>
      {open && (
        <div className="px-3 py-2 rounded mt-2"
          style={{ backgroundColor: '#0d1f38', fontSize: '11px', lineHeight: '1.6' }}>
          {parts.map((p, i) => (
            <div key={i} className="mb-2" style={{ color: i === 4 ? COLORS.signalYellow : COLORS.mutedBlue }}>
              {i === 0 && <span style={{ color: COLORS.iceWhite, fontWeight: 600 }}>📍 </span>}
              {i === 1 && <span style={{ color: COLORS.iceWhite, fontWeight: 600 }}>📊 </span>}
              {i === 2 && <span style={{ color: COLORS.iceWhite, fontWeight: 600 }}>💡 </span>}
              {i === 3 && <span style={{ color: COLORS.iceWhite, fontWeight: 600 }}>↩️ </span>}
              {i === 4 && <span style={{ fontWeight: 600 }}>⚠️ </span>}
              {p}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div style={{ backgroundColor: '#0A1628', border: '1px solid #4A5A7A', borderRadius: '6px',
      padding: '8px 12px', fontSize: '11px' }}>
      <div style={{ color: COLORS.mutedBlue, marginBottom: '4px', fontWeight: 600 }}>{label}</div>
      {payload.map((e, i) => e.value != null ? (
        <div key={i} style={{ color: e.color || COLORS.iceWhite, fontSize: '10px' }}>
          {e.name}: {typeof e.value === 'number' ? e.value.toFixed(3) : e.value}
        </div>
      ) : null)}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CONVICTION SUMMARY
// ═══════════════════════════════════════════════════════════════

function ConvictionSummary({ data }) {
  const cs = data?.conviction_summary;
  if (!cs) return null;

  const tw = cs.tailwind_scores || {};
  const positive = Object.entries(tw).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const negative = Object.entries(tw).filter(([, v]) => v < 0).sort((a, b) => a[1] - b[1]);
  const convColor = cs.convergence_direction?.includes('REAL') ? COLORS.signalGreen
    : cs.convergence_direction?.includes('FINANCIAL') ? COLORS.signalRed : COLORS.signalYellow;

  return (
    <GlassCard>
      <div className="flex items-center justify-between mb-3">
        <span className="text-label uppercase tracking-wider text-muted-blue">
          Säkulare Überzeugungen — Regime-Konvergenz
        </span>
        <span className="px-2 py-1 rounded text-sm font-bold font-mono"
          style={{ backgroundColor: `${convColor}20`, color: convColor }}>
          {cs.active_regimes}/{cs.total_regimes} aktiv
        </span>
      </div>

      {/* Direction + Robustness */}
      <div className="flex flex-wrap gap-4 mb-4 text-sm">
        <div><span className="text-muted-blue">Richtung: </span>
          <span className="font-mono font-bold" style={{ color: convColor }}>
            {cs.convergence_direction}
          </span>
        </div>
        <div><span className="text-muted-blue">Robust: </span>
          <span className="font-mono text-ice-white">{cs.robust_active}</span>
          <span className="text-muted-blue"> · Fragil: </span>
          <span className="font-mono" style={{ color: cs.fragile_active > 0 ? COLORS.signalYellow : COLORS.iceWhite }}>
            {cs.fragile_active}
          </span>
        </div>
      </div>

      {/* Tailwind Bars */}
      {positive.length > 0 && (
        <div className="mb-3">
          <div className="text-caption text-muted-blue mb-1" style={{ fontSize: '9px' }}>Stärkster Rückenwind</div>
          {positive.map(([key, val]) => (
            <div key={key} className="flex items-center gap-2 mb-1">
              <span className="text-caption font-mono w-28 text-right" style={{ color: COLORS.mutedBlue, fontSize: '10px' }}>
                {ASSET_LABELS[key] || key}
              </span>
              <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ backgroundColor: '#0d1f38' }}>
                <div style={{ width: `${Math.min(Math.abs(val), 100)}%`, height: '100%',
                  backgroundColor: COLORS.signalGreen, borderRadius: '9999px' }} />
              </div>
              <span className="text-caption font-mono w-10 text-right"
                style={{ color: COLORS.signalGreen, fontSize: '10px' }}>{fmtPct(val)}</span>
            </div>
          ))}
        </div>
      )}
      {negative.length > 0 && (
        <div className="mb-3">
          <div className="text-caption text-muted-blue mb-1" style={{ fontSize: '9px' }}>Stärkster Gegenwind</div>
          {negative.map(([key, val]) => (
            <div key={key} className="flex items-center gap-2 mb-1">
              <span className="text-caption font-mono w-28 text-right" style={{ color: COLORS.mutedBlue, fontSize: '10px' }}>
                {ASSET_LABELS[key] || key}
              </span>
              <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ backgroundColor: '#0d1f38' }}>
                <div style={{ width: `${Math.min(Math.abs(val), 100)}%`, height: '100%',
                  backgroundColor: COLORS.signalRed, borderRadius: '9999px' }} />
              </div>
              <span className="text-caption font-mono w-10 text-right"
                style={{ color: COLORS.signalRed, fontSize: '10px' }}>{fmtPct(val)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Robustness Timeline */}
      <div className="mb-3">
        <div className="text-caption text-muted-blue mb-1" style={{ fontSize: '9px' }}>Regime-Robustheit</div>
        {REGIME_ORDER.map(rk => {
          const rs = cs.regime_status?.[rk];
          if (!rs) return null;
          const act = rs.activation || 0;
          const actColor = rs.active ? COLORS.signalGreen : COLORS.fadedBlue;
          const fragColor = FRAGILITY_COLORS[rs.fragility_status] || COLORS.fadedBlue;
          return (
            <div key={rk} className="flex items-center gap-2 mb-1">
              <span className="text-caption font-mono w-28 text-right" style={{ color: COLORS.mutedBlue, fontSize: '10px' }}>
                {REGIME_META[rk]?.icon} {rs.name_de?.split(' ').slice(0, 2).join(' ')}
              </span>
              <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ backgroundColor: '#0d1f38' }}>
                <div style={{ width: `${rs.robustness_bar || 0}%`, height: '100%',
                  backgroundColor: actColor, borderRadius: '9999px', opacity: rs.active ? 1 : 0.4 }} />
              </div>
              <span className="text-caption font-mono w-20 text-right" style={{ color: actColor, fontSize: '9px' }}>
                {rs.robustness}
              </span>
              {rs.fragility_status !== 'INACTIVE' && (
                <span className="text-caption font-mono" style={{ color: fragColor, fontSize: '9px' }}>
                  ⚠ {rs.fragility_status}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Narrative */}
      {cs.narrative && (
        <div className="px-3 py-2 rounded mt-2" style={{ backgroundColor: '#0d1f38', fontSize: '12px',
          lineHeight: '1.6', color: COLORS.mutedBlue, borderLeft: `3px solid ${convColor}` }}>
          {cs.narrative}
        </div>
      )}
    </GlassCard>
  );
}

// ═══════════════════════════════════════════════════════════════
// SECULAR CHART (Recharts — long-term, annotated)
// ═══════════════════════════════════════════════════════════════

function SecularChart({ chart }) {
  if (!chart || !chart.data || chart.data.length === 0) return null;

  const chartType = chart.type;
  const data = chart.data;

  // Tick interval for decades
  const tickFilter = useMemo(() => {
    if (data.length > 400) return 120;
    if (data.length > 200) return 60;
    return 24;
  }, [data.length]);

  const filteredTicks = useMemo(() => {
    return data.filter((_, i) => i % tickFilter === 0).map(d => d.date);
  }, [data, tickFilter]);

  // Single line or computed real rate
  if (chartType === 'single_line' || chartType === 'computed_real_rate') {
    return (
      <div className="mb-1">
        <div className="text-caption font-mono mb-1" style={{ color: COLORS.iceWhite, fontSize: '11px' }}>
          {chart.name} {chart.current != null && <span style={{ color: COLORS.signalGreen }}>({fmtVal(chart.current)})</span>}
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a3050" />
            <XAxis dataKey="date" tick={{ fill: COLORS.fadedBlue, fontSize: 9 }}
              ticks={filteredTicks} interval={0} />
            <YAxis tick={{ fill: COLORS.fadedBlue, fontSize: 9 }} width={45}
              domain={['auto', 'auto']} />
            <Tooltip content={<ChartTooltip />} />
            {chart.reference_line && (
              <ReferenceLine y={chart.reference_line.value} stroke={COLORS.fadedBlue}
                strokeDasharray="4 4" label={{ value: chart.reference_line.label,
                  fill: COLORS.fadedBlue, fontSize: 9, position: 'right' }} />
            )}
            {chart.color_zones && (
              <>
                <ReferenceArea y1={0} y2={999} fill={COLORS.signalGreen} fillOpacity={0.03} />
                <ReferenceArea y1={-999} y2={0} fill={COLORS.signalRed} fillOpacity={0.03} />
              </>
            )}
            <Line type="monotone" dataKey="value" stroke="#4A90D9" dot={false}
              strokeWidth={1.5} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
        {chart.percentile != null && (
          <div className="text-caption font-mono mt-1" style={{ color: COLORS.fadedBlue, fontSize: '9px' }}>
            Perzentil: {chart.percentile}% (All-Time) · {chart.percentile_20y}% (20J)
            {chart.alltime_mean != null && ` · Mean: ${fmtVal(chart.alltime_mean)}`}
          </div>
        )}
      </div>
    );
  }

  // Multi-line (Working Age Pop)
  if (chartType === 'multi_line') {
    return (
      <div className="mb-1">
        <div className="text-caption font-mono mb-1" style={{ color: COLORS.iceWhite, fontSize: '11px' }}>
          {chart.name}
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a3050" />
            <XAxis dataKey="date" tick={{ fill: COLORS.fadedBlue, fontSize: 9 }}
              ticks={filteredTicks} interval={0} />
            <YAxis tick={{ fill: COLORS.fadedBlue, fontSize: 9 }} width={45} />
            <Tooltip content={<ChartTooltip />} />
            {chart.reference_line && (
              <ReferenceLine y={chart.reference_line.value} stroke={COLORS.fadedBlue}
                strokeDasharray="4 4" />
            )}
            {(chart.lines || []).map((line, i) => (
              <Line key={line.key} type="monotone" dataKey={line.key} name={line.label}
                stroke={line.color || CHART_COLORS[i]} dot={false} strokeWidth={1.5}
                isAnimationActive={false} />
            ))}
            <Legend wrapperStyle={{ fontSize: '10px', color: COLORS.mutedBlue }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Ratio chart
  if (chartType === 'ratio') {
    return (
      <div className="mb-1">
        <div className="text-caption font-mono mb-1" style={{ color: COLORS.iceWhite, fontSize: '11px' }}>
          {chart.name} {chart.current != null && <span style={{ color: COLORS.signalGreen }}>({fmtVal(chart.current, 4)})</span>}
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a3050" />
            <XAxis dataKey="date" tick={{ fill: COLORS.fadedBlue, fontSize: 9 }}
              ticks={filteredTicks} interval={0} />
            <YAxis tick={{ fill: COLORS.fadedBlue, fontSize: 9 }} width={55}
              domain={['auto', 'auto']} />
            <Tooltip content={<ChartTooltip />} />
            {chart.reference_line && (
              <ReferenceLine y={chart.reference_line.value} stroke={COLORS.fadedBlue}
                strokeDasharray="4 4" />
            )}
            {chart.alltime_mean != null && (
              <ReferenceLine y={chart.alltime_mean} stroke={COLORS.signalYellow}
                strokeDasharray="6 3" label={{ value: 'Mean', fill: COLORS.signalYellow,
                  fontSize: 9, position: 'right' }} />
            )}
            <Line type="monotone" dataKey="value" stroke="#4A90D9" dot={false}
              strokeWidth={1.5} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
        {chart.percentile != null && (
          <div className="text-caption font-mono mt-1" style={{ color: COLORS.fadedBlue, fontSize: '9px' }}>
            Perzentil: {chart.percentile}% · Mean: {fmtVal(chart.alltime_mean, 4)}
            {chart.structural_shift_warning && <span style={{ color: COLORS.signalYellow }}> ⚠ Struktureller Shift möglich</span>}
          </div>
        )}
      </div>
    );
  }

  // Dual line (Interest vs Defense)
  if (chartType === 'dual_line') {
    return (
      <div className="mb-1">
        <div className="text-caption font-mono mb-1" style={{ color: COLORS.iceWhite, fontSize: '11px' }}>
          {chart.name}
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a3050" />
            <XAxis dataKey="date" tick={{ fill: COLORS.fadedBlue, fontSize: 9 }}
              ticks={filteredTicks} interval={0} />
            <YAxis tick={{ fill: COLORS.fadedBlue, fontSize: 9 }} width={55} />
            <Tooltip content={<ChartTooltip />} />
            {(chart.lines || []).map((line, i) => (
              <Line key={line.key} type="monotone" dataKey={line.key} name={line.label}
                stroke={line.color || CHART_COLORS[i]} dot={false} strokeWidth={1.5}
                isAnimationActive={false} />
            ))}
            <Legend wrapperStyle={{ fontSize: '10px', color: COLORS.mutedBlue }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Dual-axis Gold vs Real Rates
  if (chartType === 'dual_axis_gold_realrate') {
    return (
      <div className="mb-1">
        <div className="text-caption font-mono mb-1" style={{ color: COLORS.iceWhite, fontSize: '11px' }}>
          {chart.name}
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data} margin={{ top: 5, right: 45, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a3050" />
            <XAxis dataKey="date" tick={{ fill: COLORS.fadedBlue, fontSize: 9 }}
              ticks={filteredTicks} interval={0} />
            <YAxis yAxisId="left" tick={{ fill: '#F5A623', fontSize: 9 }} width={55}
              label={{ value: 'Gold (USD)', angle: -90, position: 'insideLeft',
                fill: '#F5A623', fontSize: 9 }} />
            <YAxis yAxisId="right" orientation="right" reversed
              tick={{ fill: COLORS.fadedBlue, fontSize: 9 }} width={45}
              label={{ value: 'Real Rate % (inv.)', angle: 90, position: 'insideRight',
                fill: COLORS.fadedBlue, fontSize: 9 }} />
            <Tooltip content={<ChartTooltip />} />
            <Line yAxisId="left" type="monotone" dataKey="gold" name="Gold"
              stroke="#F5A623" dot={false} strokeWidth={1.5} isAnimationActive={false} />
            <Line yAxisId="right" type="monotone" dataKey="real_rate" name="Real Rate (inv.)"
              stroke={COLORS.fadedBlue} dot={false} strokeWidth={1} strokeDasharray="4 2"
              isAnimationActive={false} />
            <Legend wrapperStyle={{ fontSize: '10px', color: COLORS.mutedBlue }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════
// REGIME BLOCK
// ═══════════════════════════════════════════════════════════════

function RegimeBlock({ regimeKey, regimeData, statusData }) {
  if (!regimeData || !statusData) return null;
  const meta = REGIME_META[regimeKey] || {};
  const charts = regimeData.charts || [];
  const narrative = regimeData.narrative;
  const act = statusData.activation || 0;
  const actColor = statusData.active ? COLORS.signalGreen : COLORS.fadedBlue;
  const fragColor = FRAGILITY_COLORS[statusData.fragility_status] || COLORS.fadedBlue;

  return (
    <GlassCard>
      <Section title={`${meta.icon} ${statusData.name_de || regimeKey}`} defaultOpen={true}>
        {/* Header row */}
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <span className="px-2 py-1 rounded text-caption font-mono font-bold"
            style={{ backgroundColor: `${actColor}20`, color: actColor }}>
            {(act * 100).toFixed(0)}% {statusData.active ? 'AKTIV' : 'INAKTIV'}
          </span>
          <span className="text-caption font-mono" style={{ color: COLORS.mutedBlue, fontSize: '10px' }}>
            {statusData.robustness} · {statusData.horizon}
          </span>
          <span className="text-caption font-mono" style={{ color: COLORS.fadedBlue, fontSize: '10px' }}>
            Gewicht: {((statusData.weight || 0) * 100).toFixed(0)}%
          </span>
        </div>

        {/* Charts + Insight per chart */}
        {charts.map(chart => (
          <div key={chart.id}>
            <SecularChart chart={chart} />
            <ChartInsightToggle chart={chart} regimeKey={regimeKey} statusData={statusData} />
          </div>
        ))}

        {/* Fragility */}
        {statusData.fragility_status && statusData.fragility_status !== 'INACTIVE' && (
          <div className="px-3 py-2 rounded mb-2" style={{ backgroundColor: `${fragColor}10`,
            borderLeft: `3px solid ${fragColor}`, fontSize: '11px' }}>
            <span style={{ color: fragColor, fontWeight: 600 }}>⚠ {statusData.fragility_status}: </span>
            <span style={{ color: COLORS.mutedBlue }}>{statusData.fragility_detail}</span>
            {statusData.fragility_current_value != null && (
              <span style={{ color: COLORS.iceWhite }}> (aktuell: {statusData.fragility_current_value})</span>
            )}
          </div>
        )}

        {/* Fragility info when INACTIVE */}
        {statusData.fragility_status === 'INACTIVE' && statusData.fragility_detail && (
          <div className="text-caption font-mono mb-2" style={{ color: COLORS.fadedBlue, fontSize: '9px' }}>
            Was dieses Regime brechen würde: {statusData.fragility_detail}
            {statusData.fragility_current_value != null && ` (aktuell: ${statusData.fragility_current_value})`}
          </div>
        )}

        {/* Narrative */}
        {narrative && narrative !== 'Narrativ konnte nicht generiert werden.' && (
          <div className="px-3 py-2 rounded" style={{ backgroundColor: '#0d1f38', fontSize: '12px',
            lineHeight: '1.6', color: COLORS.mutedBlue }}>
            {narrative}
          </div>
        )}
      </Section>
    </GlassCard>
  );
}

// ═══════════════════════════════════════════════════════════════
// VALUATION HEATMAP
// ═══════════════════════════════════════════════════════════════

function ValuationHeatmap({ cascade }) {
  if (!cascade || !cascade.ratios) return null;
  const ratios = cascade.ratios;

  return (
    <GlassCard>
      <Section title="Säkulare Bewertungen — Relative Value" defaultOpen={true}>
        <InfoToggle>
          6 Ratios in 2 Ebenen: Ebene 1 zeigt ob Financial Assets teuer vs. Real Assets sind.
          Ebene 2 zeigt was innerhalb von Real Assets am billigsten ist. Half-Life = wie schnell
          normalisiert sich das historisch (Ornstein-Uhlenbeck). Fundamental-Bestätigung via Web Search.
        </InfoToggle>

        <div className="overflow-x-auto">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1a3050' }}>
                <th style={{ textAlign: 'left', padding: '4px 6px', color: COLORS.mutedBlue, fontSize: '9px' }}>Ratio</th>
                <th style={{ textAlign: 'right', padding: '4px 6px', color: COLORS.mutedBlue, fontSize: '9px' }}>Aktuell</th>
                <th style={{ textAlign: 'right', padding: '4px 6px', color: COLORS.mutedBlue, fontSize: '9px' }}>Pzl.</th>
                <th style={{ textAlign: 'left', padding: '4px 6px', color: COLORS.mutedBlue, fontSize: '9px' }}>Signal</th>
                <th style={{ textAlign: 'center', padding: '4px 6px', color: COLORS.mutedBlue, fontSize: '9px' }}>Fund.</th>
                <th style={{ textAlign: 'left', padding: '4px 6px', color: COLORS.mutedBlue, fontSize: '9px' }}>Combined</th>
                <th style={{ textAlign: 'right', padding: '4px 6px', color: COLORS.mutedBlue, fontSize: '9px' }}>Half-Life</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(ratios).map(([key, rv]) => {
                const sigCol = SIGNAL_COLORS[rv.signal] || COLORS.fadedBlue;
                const combCol = COMBINED_COLORS[rv.combined_signal] || COLORS.fadedBlue;
                const fundIcon = FUND_ICONS[rv.fundamental_confirmation] || '—';
                const hl = rv.half_life || {};
                return (
                  <tr key={key} style={{ borderBottom: '1px solid #0d1f38' }}>
                    <td style={{ padding: '6px', color: COLORS.iceWhite, fontFamily: 'monospace' }}>
                      {rv.level === 2 && <span style={{ color: COLORS.fadedBlue }}>  └ </span>}
                      {rv.name}
                    </td>
                    <td style={{ padding: '6px', textAlign: 'right', color: COLORS.iceWhite, fontFamily: 'monospace' }}>
                      {fmtVal(rv.current, 4)}
                    </td>
                    <td style={{ padding: '6px', textAlign: 'right', fontFamily: 'monospace' }}>
                      <span style={{ color: sigCol }}>{rv.percentile_alltime}%</span>
                    </td>
                    <td style={{ padding: '6px' }}>
                      <span className="px-1.5 py-0.5 rounded" style={{ backgroundColor: `${sigCol}20`,
                        color: sigCol, fontSize: '10px', fontFamily: 'monospace' }}>
                        {rv.signal}
                      </span>
                    </td>
                    <td style={{ padding: '6px', textAlign: 'center', fontSize: '10px' }}>{fundIcon}</td>
                    <td style={{ padding: '6px' }}>
                      <span style={{ color: combCol, fontFamily: 'monospace', fontSize: '10px', fontWeight: 600 }}>
                        {rv.combined_signal}
                      </span>
                    </td>
                    <td style={{ padding: '6px', textAlign: 'right', fontFamily: 'monospace', fontSize: '10px' }}>
                      {hl.half_life_months != null ? (
                        <span style={{ color: hl.significant ? COLORS.iceWhite : COLORS.fadedBlue }}>
                          {hl.half_life_months} Mo{hl.significant ? '' : ' (n.s.)'}
                        </span>
                      ) : (
                        <span style={{ color: COLORS.fadedBlue }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Normalization estimates */}
        <div className="mt-3 space-y-1">
          <div className="text-caption text-muted-blue" style={{ fontSize: '9px' }}>Geschätzte Normalisierung:</div>
          {Object.entries(ratios).filter(([, rv]) => rv.half_life?.significant).map(([key, rv]) => (
            <div key={key} className="text-caption font-mono" style={{ fontSize: '9px', color: COLORS.fadedBlue }}>
              {rv.name}: {rv.half_life.half_life_months} Mo → {rv.estimated_normalization}
              {' '}(p={rv.half_life.p_value})
            </div>
          ))}
        </div>

        {/* Narrative */}
        {cascade.narrative && cascade.narrative !== 'Narrativ konnte nicht generiert werden.' && (
          <div className="px-3 py-2 rounded mt-3" style={{ backgroundColor: '#0d1f38',
            fontSize: '12px', lineHeight: '1.6', color: COLORS.mutedBlue }}>
            {cascade.narrative}
          </div>
        )}
      </Section>
    </GlassCard>
  );
}

// ═══════════════════════════════════════════════════════════════
// CASCADE FLOW
// ═══════════════════════════════════════════════════════════════

function CascadeFlow({ cascade }) {
  const steps = cascade?.cascade || [];
  const summary = cascade?.cascade_summary || {};
  if (steps.length === 0) return null;

  return (
    <GlassCard>
      <Section title="Kaskade: Von teuer nach billig" defaultOpen={true}>
        <InfoToggle>
          Die Kaskade folgt der Kette: Sind Aktien real teuer? → Was ist billig vs. Aktien? →
          Was innerhalb von Real Assets ist am billigsten? Das stärkste Signal am Ende der Kette
          ist der actionable Takeaway.
        </InfoToggle>

        <div className="space-y-0">
          {steps.map((step, i) => {
            const isStrongest = summary.strongest_signal?.ratio === step.ratio;
            const indent = step.level === 2 ? 24 : step.level === 1 && i > 0 ? 12 : 0;
            const color = Math.abs(step.percentile - 50) > 30 ? COLORS.signalGreen
              : Math.abs(step.percentile - 50) > 15 ? COLORS.signalYellow : COLORS.fadedBlue;

            return (
              <div key={i}>
                {i > 0 && (
                  <div style={{ paddingLeft: `${indent}px`, color: COLORS.fadedBlue, fontSize: '12px' }}>
                    └→
                  </div>
                )}
                <div className="flex items-center gap-2 px-3 py-2 rounded"
                  style={{ marginLeft: `${indent}px`,
                    backgroundColor: isStrongest ? `${COLORS.signalGreen}10` : 'transparent',
                    borderLeft: isStrongest ? `3px solid ${COLORS.signalGreen}` : `2px solid ${color}` }}>
                  <div className="flex-1">
                    <span className="text-sm font-mono" style={{ color: COLORS.iceWhite }}>
                      {step.ratio}:
                    </span>
                    <span className="text-sm font-mono ml-2" style={{ color }}>
                      {step.signal}
                    </span>
                    <span className="text-caption ml-2" style={{ color: COLORS.fadedBlue, fontSize: '9px' }}>
                      ({step.percentile}. Pzl)
                    </span>
                  </div>
                  {isStrongest && (
                    <span className="text-caption font-bold" style={{ color: COLORS.signalGreen, fontSize: '10px' }}>
                      ⚡ STÄRKSTES SIGNAL
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {summary.strongest_signal && (
          <div className="mt-3 px-3 py-2 rounded" style={{ backgroundColor: `${COLORS.signalGreen}08`,
            borderLeft: `3px solid ${COLORS.signalGreen}`, fontSize: '11px' }}>
            <span style={{ color: COLORS.signalGreen, fontWeight: 600 }}>Fazit: </span>
            <span style={{ color: COLORS.iceWhite }}>
              {summary.strongest_signal.ratio} — {summary.strongest_signal.signal}
            </span>
            <span style={{ color: COLORS.mutedBlue }}>
              {' '}(Kette: {summary.chain_length} Schritte, Richtung: {summary.direction})
            </span>
          </div>
        )}
      </Section>
    </GlassCard>
  );
}

// ═══════════════════════════════════════════════════════════════
// DISCLAIMER
// ═══════════════════════════════════════════════════════════════

function Disclaimer() {
  return (
    <div className="px-3 py-2 rounded mt-2" style={{ backgroundColor: '#0d1f38',
      fontSize: '10px', lineHeight: '1.5', color: COLORS.fadedBlue, fontStyle: 'italic' }}>
      Normalisierungsschätzungen basieren auf historischen Mean-Reversion-Geschwindigkeiten
      (Ornstein-Uhlenbeck). Keine Prognose. Strukturbrüche können historische Muster invalidieren.
      Fundamental-Bestätigungen basieren auf öffentlich verfügbaren Informationen zum Zeitpunkt
      der letzten Aktualisierung.
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function SecularTrendsDetail() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!SECULAR_URL) {
      setError('NEXT_PUBLIC_SECULAR_TRENDS_URL nicht konfiguriert');
      setLoading(false);
      return;
    }
    fetch(SECULAR_URL)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-blue font-mono text-sm">Lade Säkulare Trends...</div>
      </div>
    );
  }

  if (error) {
    return (
      <GlassCard>
        <div className="text-signalRed font-mono text-sm">Fehler: {error}</div>
      </GlassCard>
    );
  }

  if (!data) return null;

  const cs = data.conviction_summary || {};
  const regimes = data.regimes || {};
  const cascade = data.valuation_cascade || {};

  return (
    <div className="space-y-3 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-bold text-ice-white font-mono">Säkulare Trends</h2>
        {data.metadata?.generated_at && (
          <span className="text-caption font-mono" style={{ color: COLORS.fadedBlue, fontSize: '9px' }}>
            Stand: {new Date(data.metadata.generated_at).toLocaleDateString('de-DE')}
            {data.metadata.llm_success && ' · Narrativ ✓'}
          </span>
        )}
      </div>

      {/* 1. Conviction Summary */}
      <ConvictionSummary data={data} />

      {/* 2-6. Regime Blocks */}
      {REGIME_ORDER.map(rk => (
        <RegimeBlock key={rk} regimeKey={rk}
          regimeData={regimes[rk]}
          statusData={cs.regime_status?.[rk]} />
      ))}

      {/* 7. Valuation Heatmap */}
      <ValuationHeatmap cascade={cascade} />

      {/* 8. Cascade Flow */}
      <CascadeFlow cascade={cascade} />

      {/* 9. Disclaimer */}
      <Disclaimer />
    </div>
  );
}
