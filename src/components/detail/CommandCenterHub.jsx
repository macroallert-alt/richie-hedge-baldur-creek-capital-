'use client';

import { useState, useEffect } from 'react';
import {
  LayoutDashboard, ShieldAlert, Zap, CalendarDays, Radar, Cog,
} from 'lucide-react';
import GlassCard from '@/components/shared/GlassCard';
import {
  COLORS,
  CC_ALERT_LEVEL_COLORS,
  CC_DIVERGENCE_SIGNAL_COLORS,
  CC_LIQUIDITY_COLORS,
  CC_MULTI_SIGNAL_COLORS,
  CC_LIQ_KOMBI_COLORS,
  CC_CONVERGENCE_COLORS,
  CC_REGRET_COLORS,
  CC_REACTION_COLORS,
  CC_SURPRISE_COLORS,
  CC_CU_AU_COLORS,
  CC_VIX_COLORS,
} from '@/lib/constants';

// ═══════════════════════════════════════════════════════
// DATA URLS
// ═══════════════════════════════════════════════════════

const DAILY_URL = process.env.NEXT_PUBLIC_CC_DAILY_URL;
const WEEKLY_URL = process.env.NEXT_PUBLIC_CC_WEEKLY_URL;

// ═══════════════════════════════════════════════════════
// SUB-TAB DEFINITIONS
// ═══════════════════════════════════════════════════════

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'threats',   label: 'Threats',   icon: ShieldAlert },
  { id: 'signals',   label: 'Signals',   icon: Zap },
  { id: 'calendar',  label: 'Calendar',  icon: CalendarDays },
  { id: 'radar',     label: 'Radar',     icon: Radar },
  { id: 'machine',   label: 'Machine',   icon: Cog },
];

// ═══════════════════════════════════════════════════════
// DIVERGENZ-PAAR ERKLÄRUNGEN (V3.1 kalibriert)
// Was → So What → Now What + Ketteneffekte
// ═══════════════════════════════════════════════════════

const PAIR_CONTEXT = {
  'DBC/SPY': {
    name: 'Commodities vs. Aktien',
    what: 'Misst ob Rohstoffe (Energie, Metalle, Agrar) schneller steigen als US-Aktien.',
    extreme_meaning: 'Commodities outperformen extrem — typisches Zeichen für Inputkosten-Inflation, die Unternehmensmargen unter Druck setzt.',
    backtest: 'In 75% der Fälle folgte ein SPY-Drawdown von ≥5% innerhalb von 63 Handelstagen.',
    lead_days: 80,
    affected: 'SPY und alle SPY-korrelierten Assets (XLK, XLY, XLI, IWM)',
    chains: [
      'Steigende Rohstoffpreise → höhere Inputkosten → Margendruck → SPY Earnings Risk',
      'Wenn Energie treibt → GLD profitiert (Inflation-Hedge) → GLD-Position im Portfolio stabilisiert',
      'TIP/SPY steigt parallel → Inflationserwartungen werden bestätigt',
      'Bei gleichzeitig CONTRACTING Liquidität → V16 dreht Richtung STRESS (4-8 Wochen)',
    ],
  },
  'VGK/SPY': {
    name: 'Europa vs. USA',
    what: 'Misst ob europäische Aktien relativ zu US-Aktien fallen.',
    extreme_meaning: 'Europa underperformt massiv — typisch bei EUR-Schwäche, Energiekrise, oder politischer Unsicherheit in der Eurozone.',
    backtest: 'In 83% der Fälle folgte ein breiter Risk-Off Move mit SPY-Drawdown von ≥5% innerhalb von 63 Tagen.',
    lead_days: 76,
    affected: 'VGK direkt, indirekt SPY (globaler Risk-Off)',
    chains: [
      'Europa-Schwäche → EUR fällt → Dollar steigt → DXY-Stärke belastet EM + Commodities',
      'Wenn gleichzeitig DBC/SPY hoch → Stagflation-Signal verstärkt sich',
      'ECB unter Druck → hawkish Reaction → europäische Anleihen fallen',
    ],
  },
  'DBC/TLT': {
    name: 'Commodities vs. Anleihen',
    what: 'Misst ob Rohstoffe relativ zu US-Staatsanleihen fallen.',
    extreme_meaning: 'Wenn DBC/TLT extrem negativ: Deflations-Signal — Rohstoffe fallen während Anleihen steigen (Flucht in Sicherheit).',
    backtest: 'In 54.5% der Fälle folgte ein Drawdown innerhalb von 21 Handelstagen. Schnellstes Signal der 5 Paare.',
    lead_days: 65,
    affected: 'DBC, HYG, zyklische Sektoren (XLI, XLE)',
    chains: [
      'Rohstoffe fallen + Anleihen steigen = Rezessionsangst → V16 dreht defensiv',
      'TLT steigt → Renditen fallen → Signal für Wachstumsverlangsamung',
      'Bei Bestätigung durch Cu/Au bearish → Rezessionssignal verstärkt',
    ],
  },
  'TIP/SPY': {
    name: 'Inflationserwartungen vs. Aktien',
    what: 'Misst ob inflationsgeschützte Anleihen (TIPS) schneller steigen als Aktien — ein Zeichen für steigende Inflationserwartungen.',
    extreme_meaning: 'Markt preist deutlich höhere Inflation ein als die Fed kommuniziert. Breakeven-Inflation steigt.',
    backtest: 'In 66.7% der Fälle folgte ein SPY-Drawdown innerhalb von 63 Tagen.',
    lead_days: null,
    affected: 'SPY, TLT (bei Zinsanstieg), alle Fixed-Income-Positionen',
    chains: [
      'Steigende Breakevens → Markt glaubt Fed ist "behind the curve"',
      'Bestätigt DBC/SPY Signal: Inflation ist das Thema, nicht Wachstum',
      'GLD profitiert als Inflationsschutz → GLD-Gewicht im Portfolio stabilisiert',
    ],
  },
  'XLF/SPY': {
    name: 'Finanzsektor vs. Gesamtmarkt',
    what: 'Misst ob der Finanzsektor relativ zum Gesamtmarkt einbricht. Financials sind ein Frühindikator für Kreditstress.',
    extreme_meaning: 'Banken underperformen extrem — typisch bei steigenden Kreditausfällen, Yield-Curve-Inversion, oder systemischem Stress.',
    backtest: 'In 61.5% der Fälle folgte ein SPY-Drawdown von ≥5% innerhalb von 42 Tagen.',
    lead_days: 66,
    affected: 'XLF direkt, SPY und HYG indirekt (Kreditkanal)',
    chains: [
      'Banken-Schwäche → Kreditvergabe sinkt → Wirtschaft bremst → SPY folgt mit 4-8 Wochen Verzögerung',
      'Wenn gleichzeitig HYG schwach → Credit Stress bestätigt',
      'Bei gleichzeitig VIX-Bestätigung → systemisches Risiko steigt',
    ],
  },
};

// ═══════════════════════════════════════════════════════
// ALIGNMENT ERKLÄRUNG
// ═══════════════════════════════════════════════════════

const ALIGNMENT_CONTEXT = {
  HIGH: 'Alle Systeme zeigen in dieselbe Richtung. Das kann korrekt sein — oder alle übersehen dasselbe Risiko. Hohes Alignment = hohes Vertrauen, aber auch Blind-Spot-Gefahr.',
  MODERATE: 'Die Systeme sind sich weitgehend einig, aber einzelne Signale weichen ab. Beobachten welches System den Dissens treibt.',
  LOW: 'Systeme widersprechen sich deutlich. Mindestens ein System liegt falsch — die Frage ist welches. Erhöhte Wachsamkeit.',
  EXTREME_DIVERGENCE: 'Systeme widersprechen sich fundamental. Historisch oft vor großen Marktbewegungen. Handlungsbedarf prüfen.',
};

// ═══════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════

function fmtPct(v, d = 2) {
  if (v == null) return '—';
  return `${Number(v) >= 0 ? '+' : ''}${Number(v).toFixed(d)}%`;
}

function fmtUsdT(v) {
  if (v == null) return '—';
  return `$${Number(v).toFixed(2)}T`;
}

function fmtUsdB(v) {
  if (v == null) return '—';
  return `${Number(v) >= 0 ? '+' : ''}$${Math.abs(Number(v)).toFixed(0)}B`;
}

function fmtZ(v) {
  if (v == null) return '—';
  return `${Number(v) >= 0 ? '+' : ''}${Number(v).toFixed(2)}`;
}

function fmtDate(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
  catch { return d; }
}

function fmtTime(t) {
  if (!t) return '';
  return t;
}

function Section({ title, subtitle, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mb-4">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-2 border-b border-white/10">
        <div>
          <span className="text-label uppercase tracking-wider text-muted-blue">{title}</span>
          {subtitle && <span className="text-caption text-muted-blue ml-2">— {subtitle}</span>}
        </div>
        <span className="text-caption text-muted-blue">{open ? '▾' : '▸'}</span>
      </button>
      {open && <div className="pt-3">{children}</div>}
    </div>
  );
}

function Pill({ color, children }) {
  return (
    <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ backgroundColor: `${color}20`, color }}>
      {children}
    </span>
  );
}

function ImpactBar({ score, max = 10 }) {
  const filled = Math.round(Math.min(score || 0, max));
  return (
    <span className="font-mono text-xs" style={{ color: filled >= 8 ? COLORS.signalRed : filled >= 5 ? COLORS.signalYellow : COLORS.mutedBlue }}>
      {'█'.repeat(filled)}{'░'.repeat(max - filled)} {score?.toFixed(0)}
    </span>
  );
}

function ExplainBox({ children }) {
  return (
    <div className="mt-2 px-3 py-2 rounded text-xs leading-relaxed"
      style={{ backgroundColor: `${COLORS.fadedBlue}12`, borderLeft: `2px solid ${COLORS.fadedBlue}40`, color: COLORS.mutedBlue }}>
      {children}
    </div>
  );
}

// Alignment Level
function getAlignLevel(score) {
  if (score >= 0.80) return 'HIGH';
  if (score >= 0.60) return 'MODERATE';
  if (score >= 0.40) return 'LOW';
  return 'EXTREME_DIVERGENCE';
}

function getAlignColor(score) {
  if (score >= 0.80) return COLORS.signalGreen;
  if (score >= 0.60) return COLORS.signalYellow;
  if (score >= 0.40) return COLORS.signalOrange;
  return COLORS.signalRed;
}

function getAlignLabel(score) {
  if (score >= 0.80) return 'HIGH ALIGNMENT';
  if (score >= 0.60) return 'MODERATE';
  if (score >= 0.40) return 'LOW — KONFLIKT';
  return 'EXTREME DIVERGENCE';
}

// ═══════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════

export default function CommandCenterHub() {
  const [tab, setTab] = useState('dashboard');
  const [daily, setDaily] = useState(null);
  const [weekly, setWeekly] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const urls = [
      { url: DAILY_URL, setter: setDaily, name: 'daily' },
      { url: WEEKLY_URL, setter: setWeekly, name: 'weekly' },
    ].filter(u => u.url);
    if (!urls.length) return;
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

  if (!daily && !loading) {
    return (
      <GlassCard>
        <div className="text-center py-12">
          <p className="text-lg text-muted-blue">Command Center noch nicht gelaufen.</p>
          <p className="text-caption text-muted-blue mt-2">Daily: nach Step 7 · Weekly: Sonntag nach Crypto</p>
          {error && <p className="text-caption mt-2" style={{ color: COLORS.signalOrange }}>Fehler: {error}</p>}
        </div>
      </GlassCard>
    );
  }

  const d = daily || {};

  return (
    <div className="space-y-4 pt-2">
      <h1 className="text-page-title text-center text-ice-white">Command Center</h1>

      {/* Sub-Tab Navigation */}
      <div className="flex justify-center gap-3 overflow-x-auto pb-1">
        {TABS.map(t => {
          const Icon = t.icon;
          const isActive = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className="w-10 h-10 rounded-full flex items-center justify-center transition-all" style={{
                backgroundColor: isActive ? `${COLORS.baldurBlue}30` : `${COLORS.fadedBlue}15`,
                border: `2px solid ${isActive ? COLORS.baldurBlue : COLORS.fadedBlue}50`,
                boxShadow: isActive ? `0 0 12px ${COLORS.baldurBlue}25` : 'none',
              }}>
                <Icon size={16} style={{ color: isActive ? COLORS.iceWhite : COLORS.mutedBlue }} />
              </div>
              <span className="text-caption leading-none" style={{ color: isActive ? COLORS.iceWhite : COLORS.mutedBlue, fontSize: '9px' }}>
                {t.label}
              </span>
            </button>
          );
        })}
      </div>

      {loading && <div className="text-caption text-muted-blue text-center">Lade Command Center Daten...</div>}
      {error && <div className="text-caption text-center" style={{ color: COLORS.signalOrange }}>Fehler: {error}</div>}

      {tab === 'dashboard' && <DashboardTab d={d} w={weekly} />}
      {tab === 'threats' && <ThreatsTab d={d} />}
      {tab === 'signals' && <SignalsTab d={d} />}
      {tab === 'calendar' && <CalendarTab d={d} />}
      {tab === 'radar' && <RadarTab d={d} w={weekly} />}
      {tab === 'machine' && <MachineTab d={d} w={weekly} />}
    </div>
  );
}


// ═══════════════════════════════════════════════════════
// TAB 1: DASHBOARD — Morgen-Dashboard (3 Sekunden Überblick)
// ═══════════════════════════════════════════════════════

function DashboardTab({ d, w }) {
  const pnl = d.portfolio_pnl || {};
  const align = d.alignment || {};
  const threats = d.regret_matrix?.active_threats || [];
  const diverg = d.divergences || {};
  const liq = d.liquidity || {};
  const vol = d.vol_compression || {};
  const cal = d.calendar || {};
  const timelines = d.timelines || {};
  const multiSig = diverg.multi_signal_level || 'NORMAL';
  const liqKombi = d.liq_kombi || {};
  const triggerReasons = d.trigger_reasons || [];

  const alignScore = align.score ?? 0;
  const alignColor = getAlignColor(alignScore);
  const alignLabel = getAlignLabel(alignScore);
  const alignFilled = Math.round(alignScore * 10);

  const hasTrigger = triggerReasons.length > 0;

  return (
    <div className="space-y-4">

      {/* Trigger Banner */}
      {hasTrigger && (
        <div className="rounded-lg border-l-4 px-4 py-3"
          style={{ backgroundColor: `${COLORS.signalOrange}12`, borderLeftColor: COLORS.signalOrange }}>
          <p className="text-sm font-bold mb-1" style={{ color: COLORS.signalOrange }}>
            ⚡ Intelligence Trigger aktiv
          </p>
          <p className="text-xs" style={{ color: COLORS.mutedBlue }}>
            Gründe: {triggerReasons.join(', ')}
          </p>
          <ExplainBox>
            Der Daten-Layer hat mindestens eine Bedingung erkannt die eine genauere Analyse erfordert.
            Wenn der Intelligence Layer (Etappe B) aktiv wäre, würde hier eine detaillierte Analyse stehen.
          </ExplainBox>
        </div>
      )}

      {/* Hero: Portfolio + Alignment */}
      <div className="grid grid-cols-2 gap-3">
        <GlassCard>
          <div className="text-caption text-muted-blue mb-1">Portfolio</div>
          <div className="text-2xl font-mono font-bold" style={{ color: (pnl.daily_return_pct || 0) >= 0 ? COLORS.signalGreen : COLORS.signalRed }}>
            {fmtPct(pnl.daily_return_pct)}
          </div>
          <div className="text-sm font-mono" style={{ color: (pnl.ytd_return_pct || 0) >= 0 ? COLORS.signalGreen : COLORS.signalRed }}>
            {fmtPct(pnl.ytd_return_pct)} YTD
          </div>
          {pnl.top_3_contributors?.[0] && (
            <div className="text-caption text-muted-blue mt-1">
              Top: {pnl.top_3_contributors[0].ticker} {fmtPct(pnl.top_3_contributors[0].return_pct, 1)}
            </div>
          )}
          <ExplainBox>Gewichtete Tagesrendite aller V16-Positionen. YTD ab erstem Handelstag mit Preisen.</ExplainBox>
        </GlassCard>

        <GlassCard>
          <div className="text-caption text-muted-blue mb-1">Alignment</div>
          <div className="text-2xl font-mono font-bold" style={{ color: alignColor }}>
            {alignScore.toFixed(2)}
          </div>
          <div className="text-xs font-mono" style={{ color: alignColor }}>
            {'█'.repeat(alignFilled)}{'░'.repeat(10 - alignFilled)} {alignLabel}
          </div>
          <div className="text-caption text-muted-blue mt-1">
            {align.agreement_count || '?'} von {align.n_systems || 6} Systeme {align.dominant_direction || ''}
          </div>
          <ExplainBox>{ALIGNMENT_CONTEXT[getAlignLevel(alignScore)]}</ExplainBox>
        </GlassCard>
      </div>

      {/* Threats + Multi-Signal */}
      <div className="grid grid-cols-2 gap-3">
        <GlassCard>
          <div className="text-caption text-muted-blue mb-1">Threats</div>
          <div className="text-2xl font-mono font-bold" style={{ color: threats.length > 0 ? COLORS.signalRed : COLORS.signalGreen }}>
            {threats.length}
          </div>
          <div className="text-xs" style={{ color: threats.length > 0 ? COLORS.signalOrange : COLORS.signalGreen }}>
            {threats.length === 0 ? '✓ Keine offenen Bedrohungen' : `Höchster Regret Ratio: ${d.regret_matrix?.highest_regret_ratio?.toFixed(1) || '—'}x`}
          </div>
          <ExplainBox>Threats = aktive Signale mit konkretem Portfolio-Risiko. Regret Ratio = Kosten von Nichtstun vs. Handeln.</ExplainBox>
        </GlassCard>

        <GlassCard>
          <div className="text-caption text-muted-blue mb-1">Multi-Signal</div>
          <div className="text-lg font-mono font-bold" style={{ color: CC_MULTI_SIGNAL_COLORS[multiSig] || COLORS.mutedBlue }}>
            {multiSig}
          </div>
          <div className="text-caption text-muted-blue mt-1">
            {diverg.n_extreme_confirmed || 0} bestätigte Extreme
          </div>
          <ExplainBox>
            Wenn 2+ Divergenz-Paare gleichzeitig auf EXTREME stehen → WARNING.
            Bei 3+ → CRITICAL. Multi-Signale haben historisch stärkere Drawdowns als Einzelsignale.
          </ExplainBox>
        </GlassCard>
      </div>

      {/* Events Heute */}
      <GlassCard>
        <Section title="Heute" subtitle={d.date}>
          {(cal.today || []).length === 0 ? (
            <p className="text-xs text-muted-blue">Keine relevanten Events heute.</p>
          ) : (
            cal.today.slice(0, 5).map((ev, i) => (
              <div key={i} className="flex justify-between items-center py-1.5 border-b border-white/5">
                <div>
                  <span className="text-caption text-muted-blue mr-2">{fmtTime(ev.time)}</span>
                  <span className="text-sm text-ice-white">{ev.event}</span>
                  <span className="text-caption text-muted-blue ml-1">{ev.country}</span>
                </div>
                <ImpactBar score={ev.impact_score} />
              </div>
            ))
          )}
          <ExplainBox>Events gewichtet nach historischem Markt-Impact × Portfolio-Exposure. Score 10 = FOMC, CPI. Score 1-3 = untergeordnet.</ExplainBox>
        </Section>
      </GlassCard>

      {/* Liquidität kompakt */}
      <GlassCard>
        <div className="flex items-center justify-between mb-2">
          <span className="text-label uppercase tracking-wider text-muted-blue">Liquidität</span>
          <Pill color={CC_LIQUIDITY_COLORS[liq.direction] || COLORS.mutedBlue}>{liq.direction || '—'}</Pill>
        </div>
        <div className="text-sm text-ice-white">
          Net Liquidity: <strong>{fmtUsdT(liq.net_liquidity_usd_T)}</strong>
          <span className="text-muted-blue ml-2">
            1W: {fmtUsdB(liq.change_1w_usd_B)} · 4W: {fmtUsdB(liq.change_4w_usd_B)}
          </span>
        </div>
        <ExplainBox>
          Net Liquidity = Fed Bilanz − Treasury-Konto − Reverse Repo.
          Steigt die Liquidität, steigen tendenziell alle Risk-Assets.
          Fällt sie, geraten Aktien und Crypto unter Druck.
          Richtung {liq.direction}: {liq.direction === 'EXPANDING' ? '4-Wochen- UND 1-Wochen-Trend positiv → bullish.' :
            liq.direction === 'CONTRACTING' ? 'Beide Trends negativ → bearish für Risk-Assets.' :
            liq.direction === 'DECELERATING' ? '4-Wochen-Trend positiv aber 1-Woche negativ → Momentum lässt nach.' :
            liq.direction === 'BOTTOMING' ? '4-Wochen-Trend negativ aber 1-Woche positiv → mögliche Trendwende.' : 'Stabil.'}
        </ExplainBox>
      </GlassCard>

      {/* Divergenzen kompakt */}
      <GlassCard>
        <div className="flex items-center justify-between mb-2">
          <span className="text-label uppercase tracking-wider text-muted-blue">Divergenzen</span>
          <Pill color={CC_ALERT_LEVEL_COLORS[diverg.alert_level] || COLORS.mutedBlue}>{diverg.alert_level || '—'}</Pill>
        </div>
        {(diverg.pairs || []).filter(p => p.signal !== 'NORMAL' && p.signal !== 'UNAVAILABLE').length === 0 ? (
          <p className="text-xs text-muted-blue">Alle Paare im Normalbereich. Kein Handlungsbedarf.</p>
        ) : (
          (diverg.pairs || []).filter(p => p.signal !== 'NORMAL' && p.signal !== 'UNAVAILABLE').map((p, i) => (
            <div key={i} className="py-1.5 border-b border-white/5">
              <div className="flex justify-between text-sm">
                <span className="text-ice-white">{p.pair} <span className="text-muted-blue">({PAIR_CONTEXT[p.pair]?.name || p.name || ''})</span></span>
                <span style={{ color: CC_DIVERGENCE_SIGNAL_COLORS[p.signal] || COLORS.mutedBlue }}>
                  Z={fmtZ(p.z_score)} {p.signal}
                </span>
              </div>
            </div>
          ))
        )}
        <ExplainBox>
          Cross-Asset Divergenzen messen ob kritische Marktpaare historisch ungewöhnlich auseinanderlaufen.
          Z-Score über ±2.0 = seltener als in 5% der letzten 252 Tage → EXTREME.
          Details und Ketteneffekte im § Radar Tab.
        </ExplainBox>
      </GlassCard>

      {/* Timeline-Konvergenz */}
      {timelines.convergence_level && timelines.convergence_level !== 'NORMAL' && (
        <GlassCard>
          <div className="flex items-center justify-between mb-2">
            <span className="text-label uppercase tracking-wider text-muted-blue">Timeline-Konvergenz</span>
            <Pill color={CC_CONVERGENCE_COLORS[timelines.convergence_level] || COLORS.signalYellow}>
              {timelines.convergence_level}
            </Pill>
          </div>
          <div className="text-sm text-ice-white mb-1">{timelines.n_active || 0} Zeitlinien mit kritischem Punkt in {timelines.window_days || 14} Tagen</div>
          {(timelines.active_timelines || []).map((tl, i) => (
            <div key={i} className="text-xs text-muted-blue py-0.5">
              • {tl.timeline}: {tl.event} ({tl.date})
            </div>
          ))}
          <ExplainBox>
            Die gefährlichsten Marktmomente entstehen wenn mehrere unabhängige Zeitlinien (Geldpolitik, Fiskal, Quartal, OPEX)
            gleichzeitig an einem kritischen Punkt ankommen. Bei 3+ Zeitlinien in 14 Tagen steigt das Tail-Risk überproportional.
          </ExplainBox>
        </GlassCard>
      )}

      {/* Vol-Kompression (nur wenn auffällig) */}
      {vol.signal && vol.signal !== 'NORMAL' && (
        <GlassCard>
          <div className="flex items-center justify-between mb-2">
            <span className="text-label uppercase tracking-wider text-muted-blue">Volatilitäts-Kompression</span>
            <Pill color={COLORS.signalOrange}>{vol.signal}</Pill>
          </div>
          <div className="text-sm text-ice-white">
            Realisierte Vol: {vol.realized_vol_21d?.toFixed(1)}% ({vol.vol_percentile}. Perzentil) · {vol.days_since_1pct_move}d ohne {'>'}1% Move
          </div>
          <ExplainBox>
            Extrem niedrige Volatilität ist nicht „Ruhe" — es ist eine gespannte Feder.
            Je länger die Kompression, desto explosiver der nächste Ausbruch.
            Score {vol.compression_score}: {vol.compression_score >= 80 ? 'Extrem — historisch folgt in 70% der Fälle ein Move von >2% innerhalb von 7-21 Tagen.' :
            vol.compression_score >= 60 ? 'Hoch — Aufmerksamkeit erhöht, aber noch kein Alarm.' : 'Moderat.'}
            Hinweis: Vol-Kompression ist kein Trigger (Backtest V3.1 hat es als Signal widerlegt), nur informativer Kontext.
          </ExplainBox>
        </GlassCard>
      )}

      {/* Daten-Timestamp */}
      <div className="text-caption text-center text-muted-blue">
        Daten vom {fmtDate(d.date)} · {d.version || ''}
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════
// TAB 2: THREATS — Portfolio-Bedrohungen + Regret-Matrix
// ═══════════════════════════════════════════════════════

function ThreatsTab({ d }) {
  const threats = d.regret_matrix?.active_threats || [];

  if (threats.length === 0) {
    return (
      <GlassCard>
        <div className="text-center py-8">
          <div className="text-3xl mb-2">✓</div>
          <p className="text-lg" style={{ color: COLORS.signalGreen }}>Keine offenen Threats</p>
          <p className="text-xs text-muted-blue mt-2">Das ist der Normalzustand. An 70-80% der Tage gibt es keine aktiven Portfolio-Bedrohungen.</p>
          <ExplainBox>
            Threats entstehen wenn ein Divergenz-Paar den EXTREME-Schwellenwert überschreitet
            UND die Backtest-kalibrierte Richtung bestätigt ist. Jede Threat hat eine Regret-Matrix
            die berechnet: Was kostet Nichtstun vs. Handeln in jedem Szenario?
          </ExplainBox>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-4">
      {threats.map((t, i) => {
        const recColor = CC_REGRET_COLORS[t.recommendation] || COLORS.signalYellow;
        const ctx = PAIR_CONTEXT[t.pair] || {};

        return (
          <GlassCard key={i}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <Pill color={recColor}>{t.recommendation}</Pill>
                <span className="text-sm text-ice-white ml-2 font-bold">{t.threat || t.pair}</span>
              </div>
              <span className="text-caption text-muted-blue">{t.days_active}d aktiv</span>
            </div>

            {/* Was ist das? */}
            {ctx.what && (
              <div className="text-xs text-muted-blue mb-2">
                <strong className="text-ice-white">Was:</strong> {ctx.what}
              </div>
            )}

            {/* Was bedeutet das? */}
            {ctx.extreme_meaning && (
              <div className="text-xs text-muted-blue mb-2">
                <strong className="text-ice-white">Bedeutung:</strong> {ctx.extreme_meaning}
              </div>
            )}

            {/* Backtest */}
            {ctx.backtest && (
              <div className="text-xs mb-2" style={{ color: COLORS.signalOrange }}>
                <strong>Historisch:</strong> {ctx.backtest}
                {ctx.lead_days && ` Lead-Zeit: ${ctx.lead_days} Tage.`}
              </div>
            )}

            {/* Exposure */}
            <div className="text-xs text-muted-blue mb-2">
              <strong className="text-ice-white">Dein Exposure:</strong> {(t.exposure_pct * 100).toFixed(0)}% des Portfolios
              {t.exposed_assets?.length > 0 && ` (${t.exposed_assets.join(', ')})`}
            </div>

            {/* Regret-Matrix */}
            <div className="mt-3 px-3 py-3 rounded" style={{ backgroundColor: `${COLORS.fadedBlue}12`, border: `1px solid ${COLORS.fadedBlue}30` }}>
              <div className="text-xs text-muted-blue mb-2 uppercase tracking-wider font-bold">Regret-Matrix</div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-blue">Nichts tun + Threat materialisiert sich:</span>
                  <span style={{ color: COLORS.signalRed }}>−€{Math.round(t.cost_if_ignore)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-blue">Handeln + Fehlalarm (entgangener Carry):</span>
                  <span style={{ color: COLORS.signalYellow }}>−€{Math.round(t.cost_if_act)}</span>
                </div>
                <div className="flex justify-between border-t border-white/10 pt-1 mt-1">
                  <span className="text-muted-blue">Regret Ratio (Kosten Nichtstun ÷ Kosten Handeln):</span>
                  <span className="text-ice-white font-bold">{t.regret_ratio?.toFixed(1)}x</span>
                </div>
                <div className="text-center font-bold mt-2" style={{ color: recColor }}>
                  → {t.recommendation}
                </div>
              </div>
              <ExplainBox>
                Regret Ratio {'>'}3.0 = Nichtstun kostet 3x mehr als Handeln → HANDELN EMPFOHLEN.
                Zwischen 1.5-3.0 → HEDGING ERWÄGEN. Unter 1.5 → BEOBACHTEN.
                Basiert auf historischen Base Rates (Backtest V3.1), nicht auf Prognosen.
              </ExplainBox>
            </div>

            {/* Ketteneffekte */}
            {ctx.chains?.length > 0 && (
              <div className="mt-3">
                <div className="text-xs text-muted-blue uppercase tracking-wider font-bold mb-1">Ketteneffekte</div>
                {ctx.chains.map((chain, j) => (
                  <div key={j} className="text-xs text-muted-blue py-0.5">→ {chain}</div>
                ))}
              </div>
            )}
          </GlassCard>
        );
      })}
    </div>
  );
}


// ═══════════════════════════════════════════════════════
// TAB 3: SIGNALS — Zeitlücken + Katalysatoren (Etappe B Placeholder)
// ═══════════════════════════════════════════════════════

function SignalsTab({ d }) {
  const intelligence = d.intelligence;
  const align = d.alignment || {};
  const reactions = d.market_reactions?.reactions || [];

  // Alignment-Konflikt als Signal
  const alignConflict = (align.score ?? 1) < 0.60;

  return (
    <div className="space-y-4">
      {/* Alignment-Konflikt */}
      {alignConflict && (
        <GlassCard>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">⚠️</span>
            <span className="text-sm text-ice-white font-bold">Alignment-Konflikt</span>
            <Pill color={getAlignColor(align.score)}>Score {(align.score || 0).toFixed(2)}</Pill>
          </div>
          <div className="text-xs text-muted-blue mb-2">
            {align.conflict_description || 'Systeme widersprechen sich.'}
          </div>

          {/* System-Übersicht */}
          {align.systems && (
            <div className="space-y-1 mt-2">
              {Object.entries(align.systems).map(([sys, info]) => {
                const dirColor = info.direction === 'BULLISH' ? COLORS.signalGreen :
                  info.direction === 'BEARISH' ? COLORS.signalRed : COLORS.signalYellow;
                return (
                  <div key={sys} className="flex justify-between text-xs">
                    <span className="text-muted-blue">{sys}</span>
                    <span style={{ color: dirColor }}>{info.direction} <span className="text-muted-blue">({info.detail})</span></span>
                  </div>
                );
              })}
            </div>
          )}

          <ExplainBox>
            {ALIGNMENT_CONTEXT[getAlignLevel(align.score)]}
            {' '}Bei niedrigem Alignment historisch erhöhte Wahrscheinlichkeit für größere Marktbewegungen.
          </ExplainBox>
        </GlassCard>
      )}

      {/* Markt-Reaktionen */}
      {reactions.length > 0 && (
        <GlassCard>
          <Section title="Markt-Reaktionen gestern" subtitle="Wie hat der Markt auf Events reagiert?">
            {reactions.map((r, i) => (
              <div key={i} className="py-2 border-b border-white/5">
                <div className="flex justify-between text-sm">
                  <span className="text-ice-white">{r.event}</span>
                  <Pill color={CC_REACTION_COLORS[r.reaction] || COLORS.mutedBlue}>{r.reaction}</Pill>
                </div>
                <div className="text-xs text-muted-blue mt-1">
                  Surprise: <span style={{ color: CC_SURPRISE_COLORS[r.surprise_direction] || COLORS.mutedBlue }}>{r.surprise_direction}</span>
                  {' · '}Erwartet: {r.expected_reaction}
                  {' · '}SPY: {r.actual_spy_return != null ? fmtPct(r.actual_spy_return * 100, 1) : '—'}
                </div>
                {r.interpretation && <div className="text-xs text-muted-blue mt-1 italic">{r.interpretation}</div>}
              </div>
            ))}
            <ExplainBox>
              Die Markt-Reaktion auf einen Event ist informativer als der Event selbst.
              ABSORBED = Markt ignoriert schlechte Nachrichten → bullish.
              REJECTED = Markt verkauft gute Nachrichten → bearish.
              AS_EXPECTED = Markt reagiert wie erwartet → kein Signal.
            </ExplainBox>
          </Section>
        </GlassCard>
      )}

      {/* Intelligence Layer Placeholder */}
      {!intelligence && (
        <GlassCard>
          <div className="text-center py-8">
            <div className="text-3xl mb-2">🔮</div>
            <p className="text-sm text-muted-blue">Intelligence Layer (Etappe B) noch nicht aktiv.</p>
            <p className="text-caption text-muted-blue mt-2">
              Hier werden erscheinen: Zeitlücken-Warnungen (wann V16 seinen State ändert), Katalysator-Trigger
              für Investment-Thesen, Second-Order-Effekte, und historische Base Rates.
              Aktuell sind nur die quantitativen Daten aus dem Daten-Layer verfügbar.
            </p>
          </div>
        </GlassCard>
      )}
    </div>
  );
}


// ═══════════════════════════════════════════════════════
// TAB 4: CALENDAR — Intelligenter Event-Kalender
// ═══════════════════════════════════════════════════════

function CalendarTab({ d }) {
  const cal = d.calendar || {};
  const surprises = d.surprises || {};
  const decayEvents = d.active_events_decay || [];

  function EventList({ events, showResult = false, label }) {
    if (!events?.length) return <p className="text-xs text-muted-blue py-2">Keine Events.</p>;

    return events.slice(0, 15).map((ev, i) => {
      const surpriseColor = CC_SURPRISE_COLORS[ev.surprise_direction] || COLORS.mutedBlue;
      const reactionColor = CC_REACTION_COLORS[ev.reaction] || COLORS.mutedBlue;

      return (
        <div key={i} className="py-2 border-b border-white/5">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-caption text-muted-blue mr-2">{fmtTime(ev.time)}</span>
              <span className="text-sm text-ice-white">{ev.event}</span>
              <span className="text-caption text-muted-blue ml-1">{ev.country}</span>
            </div>
            <ImpactBar score={ev.impact_score} />
          </div>

          {showResult && ev.actual != null && (
            <div className="mt-1 text-xs">
              <span className="text-muted-blue">Konsens: {ev.consensus}</span>
              <span className="text-ice-white mx-2">Ergebnis: {ev.actual}</span>
              <span style={{ color: surpriseColor }}>{ev.surprise_direction}</span>
              {ev.surprise_pct != null && (
                <span className="text-muted-blue ml-1">({(ev.surprise_pct * 100).toFixed(1)}%)</span>
              )}
              {ev.reaction && <span className="ml-2" style={{ color: reactionColor }}>→ {ev.reaction}</span>}
            </div>
          )}

          {!showResult && ev.consensus != null && (
            <div className="mt-1 text-xs text-muted-blue">Konsens: {ev.consensus}</div>
          )}
        </div>
      );
    });
  }

  return (
    <div className="space-y-4">
      {/* Gestern */}
      <GlassCard>
        <Section title="Gestern" subtitle="Events mit Ergebnissen + Markt-Reaktion">
          <EventList events={cal.yesterday} showResult={true} />
        </Section>
      </GlassCard>

      {/* Heute */}
      <GlassCard>
        <Section title="Heute" subtitle="Pre-Event Briefing — wie sind wir exposed?">
          <EventList events={cal.today} showResult={false} />
          <ExplainBox>
            Impact Score = Historischer Markt-Impact × Portfolio-Geo-Exposure.
            Tier A (Score 10): FOMC, CPI, NFP — diese Events bewegen den Markt verlässlich.
            Tier B (7): PPI, BOJ, GDP. Tier C (4): Claims, PMI.
          </ExplainBox>
        </Section>
      </GlassCard>

      {/* Diese + Nächste Woche */}
      <GlassCard>
        <Section title="Diese Woche" defaultOpen={true}>
          {cal.cluster_flags?.includes('HEAVY_WEEK') && (
            <div className="mb-2 px-3 py-2 rounded text-xs" style={{ backgroundColor: `${COLORS.signalOrange}12`, color: COLORS.signalOrange }}>
              📅 HEAVY WEEK — Hohe Event-Dichte. Erhöhte Volatilität wahrscheinlich.
            </div>
          )}
          <EventList events={cal.this_week} />
        </Section>
      </GlassCard>

      <GlassCard>
        <Section title="Nächste Woche" defaultOpen={false}>
          <EventList events={cal.next_week} />
        </Section>
      </GlassCard>

      {/* Aktive Events mit Decay */}
      {decayEvents.length > 0 && (
        <GlassCard>
          <Section title="Aktive Events (Decay)" subtitle="Noch relevante vergangene Events" defaultOpen={false}>
            {decayEvents.filter(e => e.still_prominent).map((ev, i) => (
              <div key={i} className="flex justify-between text-xs py-1 border-b border-white/5">
                <span className="text-ice-white" style={{ opacity: ev.decay_factor }}>{ev.event}</span>
                <span className="text-muted-blue">{ev.days_since}d alt · Decay {(ev.decay_factor * 100).toFixed(0)}%</span>
              </div>
            ))}
            <ExplainBox>
              Events verblassen über Zeit (Halbwertszeit). FOMC: 21d, CPI: 7d, Claims: 3d.
              Ein Event unter 10% Decay verschwindet. So sieht man nur was noch relevant ist.
            </ExplainBox>
          </Section>
        </GlassCard>
      )}
    </div>
  );
}


// ═══════════════════════════════════════════════════════
// TAB 5: RADAR — Divergenzen Detail + Alignment Matrix
// ═══════════════════════════════════════════════════════

function RadarTab({ d, w }) {
  const diverg = d.divergences || {};
  const align = d.alignment || {};
  const cuAu = diverg.cu_au || {};
  const vix = diverg.vix_analysis || {};

  return (
    <div className="space-y-4">

      {/* Alignment Matrix Detail */}
      <GlassCard>
        <Section title="Alignment Matrix" subtitle="Stimmen unsere 6 Systeme überein?">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-2xl font-mono font-bold" style={{ color: getAlignColor(align.score || 0) }}>
                {(align.score || 0).toFixed(2)}
              </span>
              <span className="text-sm ml-2" style={{ color: getAlignColor(align.score || 0) }}>
                {getAlignLabel(align.score || 0)}
              </span>
            </div>
          </div>

          {align.systems && Object.entries(align.systems).map(([sys, info]) => {
            const dirColor = info.direction === 'BULLISH' ? COLORS.signalGreen :
              info.direction === 'BEARISH' ? COLORS.signalRed : COLORS.signalYellow;
            return (
              <div key={sys} className="flex justify-between items-center py-1.5 border-b border-white/5">
                <span className="text-sm text-ice-white">{sys}</span>
                <div className="text-right">
                  <Pill color={dirColor}>{info.direction}</Pill>
                  <span className="text-caption text-muted-blue ml-2">{info.detail}</span>
                </div>
              </div>
            );
          })}

          <ExplainBox>
            Jedes System (V16, Cycles, Thesen, Secular, Crypto, MacroEvents) liefert eine Richtung.
            Alignment = Anteil Systeme die mit der Mehrheit übereinstimmen.
            Hohe Alignment ({'>'}.80) = Vertrauen aber Blind-Spot-Risiko. Niedrig ({'<'}.40) = fundamentaler Widerspruch.
          </ExplainBox>
        </Section>
      </GlassCard>

      {/* Divergenz-Paare Detail */}
      <GlassCard>
        <Section title="Cross-Asset Divergenzen" subtitle={`Alert Level: ${diverg.alert_level || '—'}`}>
          {(diverg.pairs || []).map((p, i) => {
            const ctx = PAIR_CONTEXT[p.pair] || {};
            const sigColor = CC_DIVERGENCE_SIGNAL_COLORS[p.signal] || COLORS.mutedBlue;
            const isExtreme = p.signal === 'EXTREME' || p.signal === 'EXTREME_UNCONFIRMED';

            return (
              <div key={i} className="mb-4 pb-3 border-b border-white/5">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-sm text-ice-white font-bold">{p.pair}</span>
                    <span className="text-caption text-muted-blue ml-2">{ctx.name || p.name || ''}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-sm" style={{ color: sigColor }}>Z={fmtZ(p.z_score)}</span>
                    <Pill color={sigColor}>{p.signal}</Pill>
                  </div>
                </div>

                {/* Was misst es? */}
                {ctx.what && <div className="text-xs text-muted-blue mt-1">{ctx.what}</div>}

                {/* Bei Extreme: volle Erklärung */}
                {isExtreme && ctx.extreme_meaning && (
                  <div className="text-xs mt-1" style={{ color: COLORS.signalOrange }}>{ctx.extreme_meaning}</div>
                )}
                {isExtreme && ctx.backtest && (
                  <div className="text-xs mt-1" style={{ color: COLORS.signalOrange }}>
                    Historisch: {ctx.backtest}
                  </div>
                )}

                {/* Unconfirmed Erklärung */}
                {p.signal === 'EXTREME_UNCONFIRMED' && (
                  <div className="text-xs mt-1 text-muted-blue italic">
                    Signal in Gegenrichtung der Backtest-Bestätigung. Wird überwacht, löst aber keinen Trigger aus.
                  </div>
                )}

                {/* Interpretation vom Agent */}
                {p.interpretation && <div className="text-xs text-muted-blue mt-1 italic">{p.interpretation}</div>}

                {/* Ketteneffekte bei EXTREME */}
                {isExtreme && ctx.chains?.length > 0 && (
                  <div className="mt-2 pl-2 border-l-2" style={{ borderLeftColor: `${sigColor}50` }}>
                    <div className="text-caption text-muted-blue uppercase tracking-wider mb-1">Ketteneffekte:</div>
                    {ctx.chains.map((c, j) => (
                      <div key={j} className="text-xs text-muted-blue py-0.5">→ {c}</div>
                    ))}
                  </div>
                )}

                {/* Momentum */}
                {p.z_momentum_21d != null && Math.abs(p.z_momentum_21d) > 0.3 && (
                  <div className="text-caption text-muted-blue mt-1">
                    21d Momentum: {fmtZ(p.z_momentum_21d)} — {p.z_momentum_21d > 0 ? 'Signal verstärkt sich' : 'Signal schwächt sich ab'}
                  </div>
                )}
              </div>
            );
          })}
        </Section>
      </GlassCard>

      {/* Cu/Au + VIX */}
      <GlassCard>
        <Section title="Zusätzliche Indikatoren" subtitle="Kupfer/Gold + VIX">
          {/* Cu/Au */}
          <div className="mb-3 pb-2 border-b border-white/5">
            <div className="flex justify-between text-sm">
              <span className="text-ice-white">Kupfer/Gold Ratio</span>
              <Pill color={CC_CU_AU_COLORS[cuAu.signal] || COLORS.mutedBlue}>{cuAu.signal || '—'}</Pill>
            </div>
            {cuAu.z_score != null && (
              <div className="text-xs text-muted-blue mt-1">Z={fmtZ(cuAu.z_score)}</div>
            )}
            <ExplainBox>
              Kupfer = industrielle Nachfrage. Gold = Angst. Ratio fällt → Rezessionsangst.
              Z{'<'}-1.5 = BEARISH (Rezession voraus, 6-12 Monate Leading). Z{'>'}+1.5 = BULLISH (Reflation).
            </ExplainBox>
          </div>

          {/* VIX */}
          <div>
            <div className="flex justify-between text-sm">
              <span className="text-ice-white">VIX Analyse</span>
              <Pill color={CC_VIX_COLORS[vix.signal] || COLORS.mutedBlue}>{vix.signal || '—'}</Pill>
            </div>
            {vix.z_score != null && (
              <div className="text-xs text-muted-blue mt-1">
                Z={fmtZ(vix.z_score)}
                {vix.confirms && <span style={{ color: COLORS.signalRed }}> — BESTÄTIGUNG: VIX bestätigt Divergenz-Signale</span>}
                {vix.corr_watch && <span style={{ color: COLORS.signalOrange }}> — WATCH: VIX/SPY Korrelation anomal ({'>'}−0.2)</span>}
              </div>
            )}
            <ExplainBox>
              VIX Z{'>'}+2.0 = Volatilität extrem hoch → bestätigt andere Stress-Signale.
              VIX/SPY Korrelation {'>'}−0.2 = Stealth Hedging — jemand kauft Schutz während der Markt steigt.
            </ExplainBox>
          </div>
        </Section>
      </GlassCard>

      {/* Weekly Data Placeholder */}
      {!w && (
        <GlassCard>
          <div className="text-center py-6">
            <p className="text-xs text-muted-blue">
              Weekly-Daten (Narrative, Slow-Burns, Feedback Loops) erscheinen nach dem ersten Weekly Run (Sonntag).
            </p>
          </div>
        </GlassCard>
      )}
    </div>
  );
}


// ═══════════════════════════════════════════════════════
// TAB 6: MACHINE — Liquidität Detail + Vol + Liq-Kombi
// ═══════════════════════════════════════════════════════

function MachineTab({ d, w }) {
  const liq = d.liquidity || {};
  const liqKombi = d.liq_kombi || {};
  const vol = d.vol_compression || {};
  const multiSig = d.divergences?.multi_signal_level || 'NORMAL';

  return (
    <div className="space-y-4">

      {/* Liquidität Detail */}
      <GlassCard>
        <Section title="Liquiditätsindikator" subtitle="Fed Bilanz − Treasury-Konto − Reverse Repo">
          <div className="text-2xl font-mono font-bold text-ice-white mb-2">
            {fmtUsdT(liq.net_liquidity_usd_T)}
          </div>
          <div className="flex items-center gap-2 mb-3">
            <Pill color={CC_LIQUIDITY_COLORS[liq.direction] || COLORS.mutedBlue}>{liq.direction || '—'}</Pill>
            {liq.liq_z_score != null && (
              <span className="text-xs text-muted-blue">Z-Score (4W-Veränderung): {fmtZ(liq.liq_z_score)}</span>
            )}
          </div>

          {/* Veränderungen */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="text-xs">
              <span className="text-muted-blue">1 Woche:</span>
              <span className="ml-1" style={{ color: (liq.change_1w_usd_B || 0) >= 0 ? COLORS.signalGreen : COLORS.signalRed }}>
                {fmtUsdB(liq.change_1w_usd_B)}
              </span>
            </div>
            <div className="text-xs">
              <span className="text-muted-blue">4 Wochen:</span>
              <span className="ml-1" style={{ color: (liq.change_4w_usd_B || 0) >= 0 ? COLORS.signalGreen : COLORS.signalRed }}>
                {fmtUsdB(liq.change_4w_usd_B)}
              </span>
            </div>
          </div>

          {/* Komponenten */}
          <div className="space-y-1 mb-3">
            <div className="flex justify-between text-xs">
              <span className="text-muted-blue">Fed Balance Sheet:</span>
              <span className="text-ice-white">{fmtUsdT(liq.fed_bs_usd_T)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-blue">Treasury General Account (TGA):</span>
              <span className="text-ice-white">{fmtUsdT(liq.tga_usd_T)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-blue">Reverse Repo (RRP):</span>
              <span className="text-ice-white">{fmtUsdT(liq.rrp_usd_T)}</span>
            </div>
            {liq.main_driver && (
              <div className="flex justify-between text-xs border-t border-white/5 pt-1 mt-1">
                <span className="text-muted-blue">Haupttreiber (1W):</span>
                <span className="text-ice-white">{liq.main_driver} ({fmtUsdB(liq.main_driver_delta_B)})</span>
              </div>
            )}
          </div>

          <ExplainBox>
            Net Liquidity = Fed BS − TGA − RRP. Wenn das Treasury sein Konto leert (TGA fällt), fließt Geld
            in den Markt → Liquidität steigt → bullish. Wenn die Fed ihre Bilanz schrumpft (QT) → Liquidität sinkt → bearish.
            RRP-Rückgang = Geld fließt aus der Fed-Facility in den Markt → auch bullish.
          </ExplainBox>
        </Section>
      </GlassCard>

      {/* Liq-Kombi Signal */}
      <GlassCard>
        <Section title="Liquiditäts-Kombi-Signal" subtitle="Liquidität × Divergenz">
          <div className="flex items-center gap-2 mb-2">
            <Pill color={CC_LIQ_KOMBI_COLORS[liqKombi.signal] || COLORS.signalGreen}>{liqKombi.signal || 'NORMAL'}</Pill>
          </div>
          {liqKombi.detail && <div className="text-xs text-muted-blue">{liqKombi.detail}</div>}
          <ExplainBox>
            Das stärkste Kombi-Signal im Backtest: Wenn Liquiditäts-Z{'<'}-1.5 UND gleichzeitig ein Divergenz-Paar
            auf EXTREME steht → WARNING. Bei Z{'<'}-2.5 → CRITICAL. Kombination aus fallender Liquidität + Markt-Stress
            hat historisch die höchste Trefferquote (55.6% bei 63 Tagen).
          </ExplainBox>
        </Section>
      </GlassCard>

      {/* Vol-Kompression Detail */}
      <GlassCard>
        <Section title="Volatilitäts-Kompression" subtitle="Ist die Feder gespannt?">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <div className="text-caption text-muted-blue">Realisierte Vol (21d)</div>
              <div className="text-lg font-mono text-ice-white">{vol.realized_vol_21d?.toFixed(1) || '—'}%</div>
              <div className="text-caption text-muted-blue">{vol.vol_percentile}. Perzentil (252d)</div>
            </div>
            <div>
              <div className="text-caption text-muted-blue">Kompression-Score</div>
              <div className="text-lg font-mono" style={{
                color: (vol.compression_score || 0) >= 80 ? COLORS.signalRed :
                  (vol.compression_score || 0) >= 60 ? COLORS.signalOrange : COLORS.signalGreen
              }}>
                {vol.compression_score || '—'}
              </div>
              <div className="text-caption text-muted-blue">{vol.signal || '—'}</div>
            </div>
          </div>

          <div className="space-y-1 text-xs text-muted-blue">
            <div>Tage seit letztem {'>'}1% Move: <span className="text-ice-white">{vol.days_since_1pct_move || '—'}</span></div>
            <div>Bollinger Band Width: <span className="text-ice-white">{vol.bb_width?.toFixed(1) || '—'}</span> ({vol.bb_width_percentile}. Pctl)</div>
          </div>

          <ExplainBox>
            Der Kompression-Score (0-100) kombiniert: niedrige Vol (40%), Tage ohne großen Move (max 60), und enge Bollinger Bänder (20%).
            Score ≥80 = EXTREME COMPRESSION — historisch folgt in 70% ein Move von {'>'}2%.
            Achtung: Backtest V3.1 hat gezeigt dass Vol-Kompression als eigenständiger TRIGGER nicht funktioniert (zu viele Fehlalarme).
            Deshalb: nur informativer Kontext, kein Trigger.
          </ExplainBox>
        </Section>
      </GlassCard>

      {/* Multi-Signal */}
      <GlassCard>
        <Section title="Multi-Signal Status" subtitle="Wie viele Paare auf Extreme?">
          <div className="flex items-center gap-2 mb-2">
            <Pill color={CC_MULTI_SIGNAL_COLORS[multiSig] || COLORS.signalGreen}>{multiSig}</Pill>
            <span className="text-xs text-muted-blue">
              {d.divergences?.n_extreme_confirmed || 0} bestätigt · {d.divergences?.n_extreme_unconfirmed || 0} unbestätigt
            </span>
          </div>
          <ExplainBox>
            2+ bestätigte EXTREME-Paare = WARNING. 3+ = CRITICAL.
            Multi-Signal Backtest (V3.1): 3+ Paare bei 63 Tagen → 46.2% Drawdown-Rate, Avg DD -6.77%.
            Das ist stärker als jedes Einzelsignal — weil mehrere unabhängige Warnsysteme gleichzeitig anschlagen.
          </ExplainBox>
        </Section>
      </GlassCard>

      {/* Weekly Machine State Placeholder */}
      {!w && (
        <GlassCard>
          <div className="text-center py-6">
            <p className="text-xs text-muted-blue">
              Maschinen-Zustand (Kreditzyklus, Fiskal-Impuls, Dollar-Liquidität, Positioning)
              erscheint nach dem ersten Weekly Run (Etappe C).
            </p>
          </div>
        </GlassCard>
      )}

      {/* Daten-Timestamp */}
      <div className="text-caption text-center text-muted-blue">
        Daten: {fmtDate(d.date)} · FRED Lag: {liq.data_lag_days || '?'}d · {d.version || ''}
      </div>
    </div>
  );
}
