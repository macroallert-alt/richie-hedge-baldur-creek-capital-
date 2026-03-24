'use client';

import { useState, useEffect } from 'react';
import {
  LayoutDashboard, ShieldAlert, Zap, CalendarDays, Radar, Cog, Brain,
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
  { id: 'intel',     label: 'Intel',     icon: Brain },
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
    what: 'Misst das Verhältnis Rohstoffe (Energie, Metalle, Agrar) zu US-Aktien.',
    trigger_direction: 'positive',  // Z>+2.0 ist der bestätigte Trigger
    trigger_threshold: '+2.0',
    z_positive: 'DBC outperformt SPY → Commodities steigen schneller als Aktien. Inputkosten-Inflation baut sich auf.',
    z_negative: 'SPY outperformt DBC → Aktien stärker als Rohstoffe. Eher Wachstums-Regime, wenig Inflationsdruck.',
    levels_positive: {
      NORMAL: 'Commodities und Aktien im Gleichgewicht. Kein Inflationsdruck über Inputkosten.',
      MODERATE: 'Commodities outperformen leicht. Inputkosten steigen, aber Margen noch nicht unter Druck.',
      ELEVATED: 'Commodities ziehen deutlich davon. Inputkosten-Inflation baut sich auf → SPY-Margen unter Druck → Risiko steigt.',
      EXTREME: 'Commodities outperformen extrem — Inflation drückt Margen. In 75% der Fälle folgte ein SPY-Drawdown von ≥5% innerhalb von 63 Handelstagen.',
    },
    levels_negative: {
      NORMAL: 'Aktien und Commodities im Gleichgewicht. Normaler Zustand.',
      MODERATE: 'Aktien outperformen Rohstoffe leicht. Wachstums-Regime, kein Stress.',
      ELEVATED: 'Aktien outperformen Rohstoffe deutlich. Kann auf nachlassende globale Nachfrage hindeuten — oder Tech-Rally ohne Breite.',
      EXTREME_UNCONFIRMED: 'Aktien outperformen Rohstoffe extrem (Gegenrichtung zum Trigger Z>+2.0). Nicht Backtest-bestätigt. Kein Handlungsbedarf — eher ein Wachstumssignal.',
    },
    backtest: 'In 75% der Fälle folgte ein SPY-Drawdown von ≥5% innerhalb von 63 Handelstagen.',
    lead_days: 80,
    affected: 'SPY und alle SPY-korrelierten Assets (XLK, XLY, XLI, IWM)',
    chains_positive: [
      'Steigende Rohstoffpreise → höhere Inputkosten → Margendruck → SPY Earnings Risk',
      'Wenn Energie treibt → GLD profitiert (Inflation-Hedge) → GLD-Position stabilisiert',
      'TIP/SPY steigt parallel → Inflationserwartungen werden bestätigt',
      'Bei gleichzeitig CONTRACTING Liquidität → V16 dreht Richtung STRESS (4-8 Wochen)',
    ],
    chains_negative: [
      'Rohstoffe schwächer als Aktien → Inflationsdruck lässt nach → SPY-Margen entspannen sich',
      'Wachstum dominiert Inflation → eher bullish für Aktien',
    ],
    chains_elevated_positive: [
      'Inputkosten steigen → Margen-Druck baut sich auf, aber noch kein Drawdown-Signal',
      'GLD könnte profitieren wenn Inflation-Narrativ sich festigt',
    ],
    chains_elevated_negative: [
      'Rohstoffe underperformen leicht → globale Nachfrage könnte nachlassen',
    ],
  },
  'VGK/SPY': {
    name: 'Europa vs. USA',
    what: 'Misst das Verhältnis europäische Aktien zu US-Aktien.',
    trigger_direction: 'negative',  // Z<-3.0 ist der bestätigte Trigger
    trigger_threshold: '-3.0',
    z_positive: 'VGK outperformt SPY → Europa stärker als USA. Kann auf EUR-Stärke oder US-Schwäche hindeuten.',
    z_negative: 'SPY outperformt VGK → Europa schwächelt relativ zu USA. Mögliche Ursachen: EUR-Schwäche, EZB-Politik, Energiepreise.',
    levels_negative: {
      NORMAL: 'Europa und USA im normalen Verhältnis. Keine regionale Verschiebung.',
      MODERATE: 'Europa beginnt zu underperformen. Kann EUR-Schwäche oder politische Unsicherheit signalisieren.',
      ELEVATED: 'Europa underperformt deutlich. EUR fällt, EZB unter Druck. Europäische Positionen (VGK) beobachten.',
      EXTREME: 'Europa underperformt massiv — EUR-Schwäche, Energiekrise, oder politische Krise. In 83% der Fälle folgte ein breiter Risk-Off Move mit SPY-Drawdown von ≥5% innerhalb von 63 Tagen.',
    },
    levels_positive: {
      NORMAL: 'Europa und USA im Gleichgewicht. Normaler Zustand.',
      MODERATE: 'Europa outperformt leicht. Kann EUR-Stärke oder US-Schwäche signalisieren.',
      ELEVATED: 'Europa outperformt deutlich. US-Positionen könnten relativ underperformen. Rotation beobachten.',
      EXTREME_UNCONFIRMED: 'Europa outperformt extrem (Gegenrichtung zum Trigger Z<-3.0). Nicht Backtest-bestätigt. Kein Handlungsbedarf.',
    },
    backtest: 'In 83% der Fälle folgte ein breiter Risk-Off Move mit SPY-Drawdown von ≥5% innerhalb von 63 Tagen.',
    lead_days: 76,
    affected: 'VGK direkt, indirekt SPY (globaler Risk-Off)',
    chains_negative: [
      'Europa-Schwäche → EUR fällt → Dollar steigt → DXY-Stärke belastet EM + Commodities',
      'Wenn gleichzeitig DBC/SPY hoch → Stagflation-Signal verstärkt sich',
      'ECB unter Druck → hawkish Reaction → europäische Anleihen fallen',
    ],
    chains_positive: [
      'Europa outperformt → EUR stärkt sich → Dollar schwächt sich → positiv für EM + Commodities',
      'Kann Rotation von US nach Europa signalisieren → VGK profitiert',
    ],
    chains_elevated_negative: [
      'Europa-Schwäche beginnt → EUR unter Druck → beobachten ob Dollar-Stärke folgt',
      'VGK-Position im Portfolio prüfen falls Trend sich verstärkt',
    ],
    chains_elevated_positive: [
      'Europa outperformt → prüfen ob EUR-Rally nachhaltig oder nur Gegenbewegung',
    ],
  },
  'DBC/TLT': {
    name: 'Commodities vs. Anleihen',
    what: 'Misst das Verhältnis Rohstoffe zu US-Staatsanleihen.',
    trigger_direction: 'negative',  // Z<-2.0 ist der bestätigte Trigger
    trigger_threshold: '-2.0',
    z_positive: 'DBC outperformt TLT → Commodities steigen, Anleihen fallen. Inflation-Regime: Rohstoffe stark, Zinsen steigen, Bonds verlieren.',
    z_negative: 'TLT outperformt DBC → Anleihen steigen, Rohstoffe fallen. Deflations-/Rezessionsangst: Flucht in sichere Anleihen.',
    levels_negative: {
      NORMAL: 'Commodities und Anleihen im Gleichgewicht. Weder Inflations- noch Deflationsangst dominant.',
      MODERATE: 'Anleihen beginnen Commodities outzuperformen. Erste Anzeichen von Wachstumssorgen.',
      ELEVATED: 'Anleihen outperformen deutlich — Markt preist Wachstumsverlangsamung ein. Zyklische Positionen (DBC, XLI) beobachten.',
      EXTREME: 'Deflations-Signal: Rohstoffe brechen ein während Anleihen steigen (Flucht in Sicherheit). In 54.5% der Fälle folgte ein Drawdown in DBC und zyklischen Sektoren (XLI, XLE, HYG) innerhalb von 21 Tagen. Schnellstes Signal.',
    },
    levels_positive: {
      NORMAL: 'Commodities und Anleihen im Gleichgewicht. Normaler Zustand.',
      MODERATE: 'Commodities outperformen Bonds leicht. Eher Inflation als Deflation.',
      ELEVATED: 'Commodities outperformen Bonds deutlich — Inflation-Regime. Anleihen verlieren, Rohstoffe stark. Bestätigt DBC/SPY wenn das auch hoch steht.',
      EXTREME_UNCONFIRMED: 'Commodities outperformen Bonds extrem (Gegenrichtung zum Trigger Z<-2.0). Dies ist KEIN Deflationssignal — im Gegenteil: es bestätigt ein Inflation-Regime. Passt zum DBC/SPY Signal. Kein eigener Trigger, kein Handlungsbedarf aus diesem Paar.',
    },
    backtest: 'In 54.5% der Fälle folgte ein Drawdown in DBC und zyklischen Sektoren (XLI, XLE, HYG) innerhalb von 21 Handelstagen. Schnellstes Signal der 5 Paare.',
    lead_days: 65,
    affected: 'DBC, HYG, zyklische Sektoren (XLI, XLE)',
    chains_negative: [
      'Rohstoffe fallen + Anleihen steigen = Rezessionsangst → V16 dreht defensiv',
      'TLT steigt → Renditen fallen → Signal für Wachstumsverlangsamung',
      'Bei Bestätigung durch Cu/Au bearish → Rezessionssignal verstärkt',
    ],
    chains_positive: [
      'Rohstoffe steigen + Anleihen fallen = Inflation-Regime → bestätigt DBC/SPY Signal',
      'TLT fällt → Renditen steigen → Zinsdruck auf Aktien und Immobilien',
      'GLD profitiert als Inflation-Hedge → Portfolio-Stabilisierung über Gold',
      'Bei gleichzeitig DBC/SPY EXTREME → Inflation-Signal doppelt bestätigt',
    ],
    chains_elevated_negative: [
      'Anleihen beginnen Commodities outzuperformen → Wachstumssorgen nehmen zu',
      'TLT-Position profitiert, aber zyklische Positionen (DBC, XLI) unter Beobachtung',
    ],
    chains_elevated_positive: [
      'Commodities outperformen Bonds → Inflation-Narrativ festigt sich',
      'Bond-Positionen (TLT) unter Druck → Duration-Risiko beobachten',
    ],
  },
  'TIP/SPY': {
    name: 'Inflationserwartungen vs. Aktien',
    what: 'Misst ob inflationsgeschützte Anleihen (TIPS) schneller steigen als Aktien — Proxy für Breakeven-Inflation.',
    trigger_direction: 'positive',  // Z>+2.0 ist der bestätigte Trigger
    trigger_threshold: '+2.0',
    z_positive: 'TIP outperformt SPY → Inflationserwartungen steigen schneller als Aktien. Markt preist mehr Inflation ein.',
    z_negative: 'SPY outperformt TIP → Aktien stärker als Inflationsschutz. Inflation ist nicht das dominante Thema.',
    levels_positive: {
      NORMAL: 'Inflationserwartungen im Normalbereich. Breakeven-Inflation stabil.',
      MODERATE: 'Inflationserwartungen steigen leicht. Markt beginnt höhere Inflation einzupreisen.',
      ELEVATED: 'Breakeven-Inflation steigt spürbar. TIPS outperformen Aktien. Markt zweifelt an Fed-Glaubwürdigkeit. GLD und TIP profitieren.',
      EXTREME: 'Markt preist deutlich höhere Inflation ein als die Fed kommuniziert. In 66.7% der Fälle folgte ein SPY-Drawdown von ≥5% innerhalb von 63 Tagen — weil steigende Inflation Zinserhöhungen erzwingt die Aktien belasten.',
    },
    levels_negative: {
      NORMAL: 'Aktien und TIPS im Gleichgewicht. Inflationserwartungen neutral.',
      MODERATE: 'Aktien outperformen TIPS. Wachstum dominiert, Inflation kein Thema.',
      ELEVATED: 'Aktien outperformen TIPS deutlich. Deflationserwartungen oder starkes Wachstum ohne Inflation.',
      EXTREME_UNCONFIRMED: 'Aktien outperformen TIPS extrem (Gegenrichtung zum Trigger Z>+2.0). Breakeven-Inflation fällt stark. Nicht Backtest-bestätigt.',
    },
    backtest: 'In 66.7% der Fälle folgte ein SPY-Drawdown von ≥5% innerhalb von 63 Tagen.',
    lead_days: null,
    affected: 'SPY, TLT (bei Zinsanstieg), alle Fixed-Income-Positionen',
    chains_positive: [
      'Steigende Breakevens → Markt glaubt Fed ist "behind the curve"',
      'Bestätigt DBC/SPY Signal: Inflation ist das Thema, nicht Wachstum',
      'GLD profitiert als Inflationsschutz → GLD-Gewicht im Portfolio stabilisiert',
    ],
    chains_negative: [
      'Fallende Breakevens → Inflation-Ängste lassen nach → Fed weniger unter Druck',
      'Aktien profitieren von niedrigeren Zinserwartungen',
    ],
    chains_elevated_positive: [
      'Inflationserwartungen steigen → Fed-Glaubwürdigkeit unter Druck',
      'GLD und TIP profitieren → defensive Rotation beginnt',
    ],
    chains_elevated_negative: [
      'Breakevens fallen → Deflationssorgen oder Wachstumsoptimismus ohne Inflation',
    ],
  },
  'XLF/SPY': {
    name: 'Finanzsektor vs. Gesamtmarkt',
    what: 'Misst ob der Finanzsektor relativ zum Gesamtmarkt einbricht. Financials = Frühindikator für Kreditstress.',
    trigger_direction: 'negative',  // Z<-2.5 ist der bestätigte Trigger
    trigger_threshold: '-2.5',
    z_positive: 'XLF outperformt SPY → Banken stark, Kreditumfeld gesund. Eher bullish.',
    z_negative: 'SPY outperformt XLF → Banken schwächeln relativ. Kann frühe Anzeichen von Kreditstress signalisieren.',
    levels_negative: {
      NORMAL: 'Finanzsektor und Gesamtmarkt im Gleichschritt. Kein Kreditstress.',
      MODERATE: 'Banken beginnen zu underperformen. Kann Kreditstress-Frühsignal sein — oder normale Sektorrotation.',
      ELEVATED: 'Finanzsektor underperformt deutlich. Steigende Kreditausfälle oder Zinsstruktur-Probleme möglich. Kreditvergabe verlangsamt sich.',
      EXTREME: 'Banken underperformen extrem — Kreditausfälle, Yield-Curve-Inversion, oder systemischer Stress. In 61.5% der Fälle folgte ein SPY-Drawdown von ≥5% innerhalb von 42 Tagen.',
    },
    levels_positive: {
      NORMAL: 'Banken und Gesamtmarkt im Gleichschritt. Normaler Zustand.',
      MODERATE: 'Banken outperformen leicht. Gesundes Kreditumfeld.',
      ELEVATED: 'Banken outperformen deutlich. Steigende Zinsen helfen Margen. Eher bullish für Finanzsektor.',
      EXTREME_UNCONFIRMED: 'Banken outperformen extrem (Gegenrichtung zum Trigger Z<-2.5). Nicht Backtest-bestätigt. Eher positives Signal für Kreditumfeld.',
    },
    backtest: 'In 61.5% der Fälle folgte ein SPY-Drawdown von ≥5% innerhalb von 42 Tagen.',
    lead_days: 66,
    affected: 'XLF direkt, SPY und HYG indirekt (Kreditkanal)',
    chains_negative: [
      'Banken-Schwäche → Kreditvergabe sinkt → Wirtschaft bremst → SPY folgt mit 4-8 Wochen Verzögerung',
      'Wenn gleichzeitig HYG schwach → Credit Stress bestätigt',
      'Bei gleichzeitig VIX-Bestätigung → systemisches Risiko steigt',
    ],
    chains_positive: [
      'Banken stark → Kreditvergabe gesund → stützt Wirtschaftswachstum',
      'Steigende Zinsen helfen Bank-Margen → XLF profitiert',
      'Gesunder Finanzsektor = keine Kreditkrise in Sicht → bullish für SPY',
    ],
    chains_elevated_negative: [
      'Banken beginnen zu schwächeln → Kreditvergabe könnte sich verlangsamen',
      'HYG beobachten — wenn Credit Spreads parallel steigen, bestätigt sich das Signal',
    ],
    chains_elevated_positive: [
      'Banken outperformen → Kreditumfeld verbessert sich → positiv für Gesamtmarkt',
    ],
  },
};

// Helper: Richtungsabhängige Erklärung für ein Paar
function getPairExplanation(pair, signal, zScore) {
  const ctx = PAIR_CONTEXT[pair];
  if (!ctx) return null;

  const isPositive = (zScore || 0) >= 0;
  const levels = isPositive ? ctx.levels_positive : ctx.levels_negative;
  if (!levels) return null;

  // Bei EXTREME_UNCONFIRMED: immer aus der Gegenrichtung nehmen
  if (signal === 'EXTREME_UNCONFIRMED') {
    return (isPositive ? ctx.levels_positive : ctx.levels_negative)?.EXTREME_UNCONFIRMED || null;
  }

  return levels[signal] || levels.NORMAL || null;
}

// Helper: Richtungserklärung (was bedeutet der aktuelle Z-Wert?)
function getPairDirectionText(pair, zScore) {
  const ctx = PAIR_CONTEXT[pair];
  if (!ctx) return null;
  return (zScore || 0) >= 0 ? ctx.z_positive : ctx.z_negative;
}

// Helper: Richtungsabhängige Ketteneffekte
function getPairChains(pair, zScore) {
  const ctx = PAIR_CONTEXT[pair];
  if (!ctx) return [];
  return (zScore || 0) >= 0 ? (ctx.chains_positive || []) : (ctx.chains_negative || []);
}

function getPairChainsElevated(pair, zScore) {
  const ctx = PAIR_CONTEXT[pair];
  if (!ctx) return [];
  return (zScore || 0) >= 0 ? (ctx.chains_elevated_positive || []) : (ctx.chains_elevated_negative || []);
}

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
// EVENT-ERKLÄRUNGEN — Was misst der Indikator, was bedeutet das Ergebnis
// ═══════════════════════════════════════════════════════

const EVENT_EXPLAINERS = {
  // ═══════════════════════════════════════════════════════════
  // TIER A — Impact 10 (Marktbewegende Schlüssel-Events)
  // Portfolio-Referenz: HYG 28.8%, DBC 20.3%, XLU 18.0%, GLD 16.9%, XLP 16.1%
  // ═══════════════════════════════════════════════════════════
  'CPI': {
    what: 'Consumer Price Index — breitestes US-Inflationsmaß auf Verbraucherebene. Shelter (~36% des Kerns) reagiert mit 12-18 Monaten Verzögerung auf Immobilienpreise. Supercore (Services ex Shelter) ist der von der Fed bevorzugte Subindex für die Lohn-Preis-Spirale.',
    hot: 'HYG (28.8%) fällt — Spreads weiten sich weil Fed restriktiv bleibt und Refinanzierungskosten steigen. DBC (20.3%) steigt — wird als Inflationshedge nachgefragt. GLD (16.9%) steigt — Store of Value bei persistenter Inflation. XLU (18.0%) fällt — höhere Zinsen drücken die Bewertung dieses Duration-Proxys. XLP (16.1%) stabil — hat Pricing Power bei moderater Inflation. Kette: höhere Preise → Fed hält Terminal Rate hoch → Front-End Yields steigen → Finanzierungskosten für HY-Emittenten steigen. Historisch: Hot CPI mit >0.4% MoM Core führte in 73% der Fälle zu Neubewertung der Fed Funds Futures um ≥15bp.',
    cold: 'HYG (28.8%) steigt — profitiert doppelt: niedrigere Basis-Rate + engere Spreads. DBC (20.3%) fällt — verliert Inflationshedge-Nachfrage. GLD (16.9%) gemischt — niedrigere Realzinsen positiv, aber Risiko-Appetit steigt. XLU (18.0%) steigt — profitiert von niedrigeren Diskontierungsraten. XLP (16.1%) steigt — Yield-Play bei fallenden Zinsen. Kette: fallende Inflation → Fed Dot Plot verschiebt sich dovish → Zinserwartungen sinken → Duration-Assets rallyen. Querverweis: wenn CPI kalt UND ISM schwach → Stagflationsrisiko sinkt → bestes Szenario für HYG.',
    portfolio: 'HYG (28.8%): heißer Print weitet HY-Spreads um 5-15bp. DBC (20.3%): direkte Inflationskorrelation. GLD (16.9%): steigt bei hot als Wertspeicher. XLU (18.0%): fällt bei hot, steigt bei cold (Duration-Proxy). XLP (16.1%): am wenigsten betroffen. Querverweis: CPI hot + ISM schwach = Stagflation → schlimmstes Szenario für HYG.',
  },
  'Core CPI': {
    what: 'CPI ohne volatile Nahrung und Energie — der entscheidende Indikator für die Fed-Reaktionsfunktion. Die Fed beobachtet besonders die 3-Monats-Annualisierung des Supercore (Services ex Shelter).',
    hot: 'HYG (28.8%) fällt — schärfstes hawkishes Signal, Refinanzierungskosten steigen weiter. XLU (18.0%) fällt — als Bond-Proxy leidet XLU direkt unter höheren Zinsen. DBC (20.3%) steigt — reale Assets profitieren von persistenter Inflation. GLD (16.9%) steigt — negative Realzinsen werden wahrscheinlicher. XLP (16.1%) stabil. Kette: persistente Kerninflation → Fed kann nicht senken → 2-Jahres-Yield steigt → gesamte Zinskurve repriced. Wenn 3M-Annualisierung über 4.5%: historisch immer mindestens ein zusätzlicher Hike eingepreist.',
    cold: 'HYG (28.8%) steigt stark — stärkster Einzeldatenpunkt für Zinssenkungen, Spread-Kompression + Basis-Rallye kumulieren. XLU (18.0%) steigt — profitiert als Yield-Play bei fallenden Zinsen. GLD (16.9%) gemischt — niedrigere Realzinsen positiv, aber Risk-On drückt Safe-Haven-Nachfrage. DBC (20.3%) fällt — Inflationshedge-Nachfrage sinkt. XLP (16.1%) steigt. Kette: fallende Kerninflation → Markt preist nächsten Cut vor → Zinskurve steilt. Historisch: Core CPI Miss ≥0.1% unter Konsens → SPY-Rallye am selben Tag in 8 von 10 Fällen.',
    portfolio: 'Wichtiger als Headline CPI. HYG (28.8%): größter Profiteur eines cold Prints. DBC (20.3%): natürlicher Hedge bei hot. Querverweis: Core CPI + PCE Core divergieren → Fed folgt PCE.',
  },
  'FOMC': {
    what: 'Federal Open Market Committee Zinsentscheid — die Fed setzt die Federal Funds Rate. Nicht nur die Entscheidung bewegt Märkte, sondern Pressekonferenz-Tonalität, Statement-Wortlaut, und Dot-Plot-Verschiebung.',
    hot: 'HYG (28.8%) fällt — Doppelbelastung: höhere risikofreie Rate + weitende Spreads. DBC (20.3%) fällt — Dollar steigt (inverse Korrelation USD/Commodities ~-0.6). GLD (16.9%) fällt kurzfristig — Dollar-Stärke drückt Gold, aber steigt mittelfristig wenn Markt Policy Error einpreist. XLU (18.0%) fällt — verliert als Yield-Konkurrent gegen höhere Treasury Yields. XLP (16.1%) fällt moderat. Kette: höhere Terminal Rate → gesamte Zinskurve steigt → Dollar stärkt sich.',
    cold: 'HYG (28.8%) steigt stark — Zinssenkungszyklen komprimieren HY-Spreads historisch um 80-150bp im ersten Jahr. DBC (20.3%) steigt — schwächerer Dollar + Stimulus-Erwartung. GLD (16.9%) steigt — Dollar-Schwäche + niedrigere Realzinsen. XLU (18.0%) steigt — Yield-Play. XLP (16.1%) steigt. Kette: niedrigere Terminal Rate → Dollar schwächt sich → Zinskurve fällt und steilt.',
    portfolio: 'Betrifft alle 5 Positionen simultan. HYG (28.8%): größter Hebel — Dot Plot Verschiebung >50bp bewegt HYG um 2-4% am Tag. DBC (20.3%): reagiert primär über Dollar-Kanal.',
  },
  'Non-Farm Payrolls': {
    what: 'NFP — Anzahl neu geschaffener Stellen außerhalb der Landwirtschaft, erscheint am ersten Freitag. Neben Headline entscheidend: Revisionen der Vormonate, Average Hourly Earnings (Lohninflation), Unemployment Rate.',
    hot: 'HYG (28.8%) gemischt — bessere Kreditqualität aber Zinsen bleiben länger hoch. DBC (20.3%) steigt leicht — intakte Nachfrage stützt Commodities. XLU (18.0%) fällt — Zinsen bleiben hoch. GLD (16.9%) fällt — höhere Realzinsen drücken Gold. XLP (16.1%) fällt leicht — Rotation in Zykliker. Kette: starker Arbeitsmarkt → Fed sieht keine Notwendigkeit zu senken → Zinssenkungen werden nach hinten geschoben. NFP >+100K über Konsens schiebt Zinssenkungen durchschnittlich 6 Wochen nach hinten.',
    cold: 'HYG (28.8%) gemischt — bei moderatem Miss steigt HYG (niedrigere Zinsen), bei starkem Miss fällt HYG (Default-Angst überwiegt). DBC (20.3%) fällt — schwächerer Nachfrage-Ausblick. GLD (16.9%) steigt — Safe Haven. XLU (18.0%) steigt — defensive Rotation. XLP (16.1%) steigt — defensive Rotation. Kette: schwächerer Arbeitsmarkt → Rezessionssorgen → Fed muss Zinssenkungen vorziehen. KRITISCH: Sahm Rule beobachten (Unemployment 3M-Durchschnitt >0.5% über 12M-Tief = Rezession).',
    portfolio: 'HYG (28.8%): komplexeste Position — Doppelsensitivität (Zins + Kredit). Moderater Miss = HYG steigt. Starker Miss (>-150K) = HYG fällt. DBC (20.3%): korreliert mit Wachstumsausblick.',
  },
  'NFP': {
    what: 'Non-Farm Payrolls (Kurzform) — identisch mit Non-Farm Payrolls. Headline-Zahl, Revisionen, Average Hourly Earnings und Unemployment Rate als Gesamtpaket betrachten.',
    hot: 'HYG (28.8%) gemischt — fundamental besser aber Zinsen bleiben hoch. DBC (20.3%) steigt leicht — Nachfrage intakt. XLU (18.0%) fällt — Higher-for-Longer. GLD (16.9%) fällt — höhere Realzinsen. XLP (16.1%) fällt leicht. Kette: robuster Arbeitsmarkt → Lohnwachstum erhöht → Dienstleistungsinflation persistent → Fed hält restriktive Haltung.',
    cold: 'HYG (28.8%) gemischt — moderater Miss positiv, starker Miss negativ (Defaults). DBC (20.3%) fällt — Nachfrage-Ausblick schwächer. GLD (16.9%) steigt — Safe Haven. XLU (18.0%) steigt — Defensive. XLP (16.1%) steigt — Defensive. Kette: Arbeitsmarkt kühlt ab → Konsumausgaben fallen → Fed muss senken.',
    portfolio: 'Siehe Non-Farm Payrolls. Entscheidend: Headline + Revisionen + AHE als Gesamtbild. Zwei konsekutive Misses mit Abwärtsrevisionen = ernst.',
  },
  'ECB': {
    what: 'Europäische Zentralbank Zinsentscheid — Transmissionskanal zu unseren Positionen primär über EUR/USD (beeinflusst Dollar-Index und damit Commodities).',
    hot: 'DBC (20.3%) steigt — EUR stärkt sich, Dollar fällt, Commodities profitieren. GLD (16.9%) steigt — schwächerer Dollar. HYG (28.8%) fällt leicht — Spillover von europäischen HY-Spreads. XLU (18.0%) neutral. XLP (16.1%) neutral. Kette: ECB hawkish → EUR stärkt sich → Dollar-Index fällt → Commodities und Gold profitieren.',
    cold: 'DBC (20.3%) fällt — EUR schwächt sich, Dollar steigt, Commodities unter Druck. GLD (16.9%) fällt — stärkerer Dollar. HYG (28.8%) neutral. XLU (18.0%) neutral. XLP (16.1%) neutral. Kette: ECB dovish → EUR schwächt sich → Dollar-Index steigt.',
    portfolio: 'Primärkanal: Dollar-Stärke/-Schwäche beeinflusst DBC (20.3%) und GLD (16.9%). Querverweis: ECB + Fed Divergenz bewerten — wenn beide hawkish, Dollar-Effekt neutralisiert aber globale Liquidität sinkt.',
  },
  // ═══════════════════════════════════════════════════════════
  // TIER B — Impact 7 (Wichtige Bestätigungsindikatoren)
  // ═══════════════════════════════════════════════════════════
  'PPI': {
    what: 'Producer Price Index — Inflation auf Produzentenebene, 1-2 Monate vorauslaufend für CPI. PPI ex Food, Energy & Trade ist der von der Fed genutzte Subindex.',
    hot: 'HYG (28.8%) fällt — Fed bleibt restriktiv, plus Margendruck bei HY-Emittenten mit schwacher Pricing Power. DBC (20.3%) steigt — steigende Produzentenpreise korrelieren mit Commodity-Stärke. GLD (16.9%) steigt — Inflationspipeline wird befüllt. XLU (18.0%) fällt — Zinsdruck. XLP (16.1%) stabil — hat Pricing Power. Kette: steigende Produzentenkosten → entweder Weitergabe an Verbraucher (CPI steigt in 1-2 Monaten) oder Absorption (Margen sinken → HY-Emittenten unter Druck).',
    cold: 'HYG (28.8%) steigt — doppelter Tailwind: niedrigere Zinserwartungen + verbesserte Margen der Emittenten. DBC (20.3%) fällt — Commodity-Preise sind Teil des PPI. GLD (16.9%) fällt leicht — Inflationsdruck lässt nach. XLU (18.0%) steigt — Zinsdruck lässt nach. XLP (16.1%) steigt leicht. Kette: fallende Produzentenpreise → CPI-Druck lässt nach → Fed-Pfad zu Zinssenkungen.',
    portfolio: 'PPI als CPI-Preview nutzen. HYG (28.8%): indirekter Treiber über Zinskanal + Margeneffekt. DBC (20.3%): direkte Korrelation — Energie und Rohstoffe sind PPI-Hauptkomponenten.',
  },
  'PCE': {
    what: 'Personal Consumption Expenditures Price Index — das OFFIZIELLE Inflationsmaß der Fed (nicht CPI). Core PCE (ex Food & Energy) ist der Zielindikator mit 2.0% Target.',
    hot: 'HYG (28.8%) fällt — Fed-Zielmetrik verfehlt, FOMC muss restriktiv bleiben, Default Rates steigen mit 12-18M Verzögerung. DBC (20.3%) steigt — Inflation durch Commodity-Kanal. GLD (16.9%) steigt — negative Realzinsen wahrscheinlicher. XLU (18.0%) fällt — Duration-Asset leidet. XLP (16.1%) stabil. Kette: Core PCE über 2.0% → Fed kann nicht senken → Diskontierungsstruktur verschiebt sich.',
    cold: 'HYG (28.8%) steigt stark — historisch die beste HY-Performance in den 6 Monaten VOR dem ersten Cut. DBC (20.3%) fällt — Inflationshedge-Nachfrage sinkt. GLD (16.9%) gemischt. XLU (18.0%) steigt — Yield-Play. XLP (16.1%) steigt. Kette: Core PCE nähert sich 2.0% → Zinssenkungen rücken näher → Zinskurve steilt.',
    portfolio: 'Core PCE ist DER Indikator für HYG (28.8%). Fed toleriert CPI-Spikes, aber nicht persistente Core PCE Abweichungen.',
  },
  'GDP': {
    what: 'Gross Domestic Product — quartalsweise Gesamtwirtschaftsleistung. Advance Estimate hat höchsten Markteinfluss. GDPNow (Atlanta Fed) liefert Echtzeit-Nowcasts.',
    hot: 'HYG (28.8%) steigt — Default-Raten sinken in Expansionsphasen. DBC (20.3%) steigt — intakte Industrienachfrage. GLD (16.9%) fällt — Risk-On drückt Safe-Haven-Nachfrage. XLU (18.0%) fällt — Rotation in Zykliker. XLP (16.1%) fällt leicht — Rotation in Zykliker. Kette: starkes Wachstum → Unternehmensgewinne steigen → bessere Kreditqualität → ABER Fed hat keinen Grund zu senken.',
    cold: 'HYG (28.8%) fällt — schwächstes Quintil der HY-Emittenten am verwundbarsten. DBC (20.3%) fällt — Nachfrage sinkt. GLD (16.9%) steigt — Safe Haven. XLU (18.0%) steigt — defensive Rotation. XLP (16.1%) steigt — defensive Rotation. Kette: schwächeres Wachstum → Gewinne unter Druck → Downgrades akkumulieren. GDP unter 1.5% annualisiert → HY-Spreads weiten im Folgequartal um ~40bp.',
    portfolio: 'HYG (28.8%): GDP-Wachstum ist der wichtigste fundamentale Treiber für HY-Defaults. DBC (20.3%): Wachstum = Nachfrage. Querverweis: GDP + ISM + NFP alle schwach = Rezession in 85% der Fälle.',
  },
  'Retail Sales': {
    what: 'US-Einzelhandelsumsätze — Proxy für ~70% des US-BIP (Konsum). Control Group (ex Autos, Gas, Building Materials) fließt direkt in BIP-Berechnung ein.',
    hot: 'HYG (28.8%) steigt leicht — bessere Kreditqualität im Consumer-Segment. DBC (20.3%) neutral. GLD (16.9%) fällt leicht — Risk-On. XLU (18.0%) fällt — Rotation in Zykliker. XLP (16.1%) fällt — Rotation von Staples in Discretionary. Kette: starker Konsum → BIP intakt → ABER hält Inflationsdruck aufrecht → Fed bleibt restriktiv.',
    cold: 'HYG (28.8%) fällt — Consumer-lastige HY-Emittenten (Retail, Restaurants) direkt betroffen, Default-Risiko steigt im B/CCC-Segment. DBC (20.3%) fällt leicht. GLD (16.9%) steigt — Safe Haven. XLU (18.0%) steigt — defensive Rotation. XLP (16.1%) steigt — Staples profitieren direkt (Konsumenten wechseln von Discretionary zu Staples). Kette: schwächere Ausgaben → BIP-Beitrag sinkt → Fed bekommt Signal dass Straffung wirkt. Retail Chapter 11 Filings haben 6-9 Monate Vorlauf nach Retail Sales Einbruch.',
    portfolio: 'HYG (28.8%): Retail-Schwäche trifft Consumer-HY-Emittenten zuerst. XLP (16.1%): direkte Rotation bei schwachen Retail Sales.',
  },
  'ISM Manufacturing': {
    what: 'ISM Manufacturing PMI — ältester US-Konjunkturindikator (seit 1948). Über 50 = Expansion, unter 50 = Kontraktion. New Orders/Inventories Ratio ist Leading Indicator. Unter 42.5 = historisch 100% Rezession.',
    hot: 'DBC (20.3%) steigt stark — ISM-DBC Korrelation historisch >0.7, Rohstoffnachfrage steigt. HYG (28.8%) steigt — besserer Wachstumsausblick stützt Kreditqualität. GLD (16.9%) fällt — Risk-On. XLU (18.0%) fällt — Rotation in Zykliker. XLP (16.1%) fällt leicht — Rotation in Zykliker. Kette: Industrie expandiert → Rohstoffnachfrage steigt → Prices Paid steigt → Inflationspipeline wird befüllt.',
    cold: 'DBC (20.3%) fällt stark — industrielle Rohstoffnachfrage sinkt direkt. HYG (28.8%) fällt — Industrie und Energie zusammen ~35% des HY-Universums. GLD (16.9%) steigt — Safe Haven. XLU (18.0%) steigt — defensive Rotation. XLP (16.1%) steigt — defensive Rotation. Kette: Industriekontraktion → Rohstoffnachfrage sinkt → Kreditqualität im Industriesektor verschlechtert sich. KRITISCH: ISM unter 47 = historisch IMMER Rezession → HYG-Spreads weiten 200-400bp, DBC fällt 15-25%. Querverweis: DBC/SPY Z-Score bereits >+2.0 + ISM fällt bestätigt Reversion.',
    portfolio: 'DBC (20.3%): direkteste Position für ISM. HYG (28.8%): Sekundäreffekt über zyklische Emittenten. Querverweis: ISM Manufacturing + ISM Services zusammen lesen — Manufacturing allein kann kontrahieren ohne Rezession, aber wenn Services folgt wird es ernst.',
  },
  'ISM Services': {
    what: 'ISM Services PMI — Dienstleistungssektor = ~80% der US-Wirtschaft und ~85% der Beschäftigung. Wichtiger als ISM Manufacturing für die Gesamtwirtschaft.',
    hot: 'HYG (28.8%) steigt leicht — fundamental gut aber Higher-for-Longer Zins-Gegenwind weil starke Services Lohndruck persistent halten. DBC (20.3%) neutral. GLD (16.9%) fällt leicht. XLU (18.0%) fällt — Zinserwartungen steigen. XLP (16.1%) fällt leicht. Kette: Services expandieren → Arbeitsmarkt bleibt eng → Dienstleistungsinflation sticky → Fed kann nicht senken.',
    cold: 'HYG (28.8%) fällt stark — Services-Emittenten ~50% des HY-Universums, Beschäftigungsabschwung wird breit. DBC (20.3%) fällt — Gesamtnachfrage sinkt. GLD (16.9%) steigt — Safe Haven. XLU (18.0%) steigt — defensive Rotation. XLP (16.1%) steigt — defensive Rotation. Kette: Services kontrahieren → Beschäftigungsabschwung breit → Konsumausgaben fallen → BIP kollabiert. ISM Services unter 50 für 2+ Monate = Rezession in 90% der Fälle.',
    portfolio: 'Breiter und gefährlicher als ISM Manufacturing. HYG (28.8%) ist bei Services-Kontraktion die verwundbarste Position. Querverweis: ISM Services unter 50 + Initial Claims über 250K = Rezessionskaskade.',
  },
  'FOMC Minutes': {
    what: 'Protokoll der FOMC-Sitzung von 3 Wochen zuvor — zeigt interne Debatte, Hawk/Dove-Verteilung, diskutierte aber nicht umgesetzte Optionen.',
    hot: 'HYG (28.8%) fällt — mehr Mitglieder für straffere Policy als gedacht. XLU (18.0%) fällt — Duration-Proxy. DBC (20.3%) fällt leicht — Dollar steigt. GLD (16.9%) fällt leicht — Dollar steigt. XLP (16.1%) stabil. Kette: hawkischerer Ton als Pressekonferenz → Markt repriced Terminal Rate nach oben → 2Y-Yield steigt.',
    cold: 'HYG (28.8%) steigt — Zinssenkungen näher als gedacht. XLU (18.0%) steigt — Duration-Proxy. GLD (16.9%) steigt — niedrigere Realzinsen. DBC (20.3%) steigt leicht — Dollar fällt. XLP (16.1%) steigt leicht. Kette: dovischerer Ton → "several participants" diskutierten Cuts → Zinssenkungserwartung zieht vor.',
    portfolio: 'Impact niedriger als FOMC-Entscheid selbst (3 Wochen alt). HYG (28.8%) und XLU (18.0%) am sensitivsten.',
  },
  'BOJ': {
    what: 'Bank of Japan Zinsentscheid — Japan ist größter externer Halter von US-Treasuries und Yen ist Finanzierungswährung für globale Carry Trades (~$4-8T). BOJ-Überraschungen können Flash Crashes in allen Assetklassen auslösen.',
    hot: 'HYG (28.8%) fällt stark — Carry-Trade Unwind erzwingt Verkauf von Risk-Assets (HY ist klassisches Carry-Trade Ziel). DBC (20.3%) fällt — Dollar steigt + Risk-Off. GLD (16.9%) gemischt — Risk-Off positiv, Dollar-Stärke negativ. XLU (18.0%) stabil relativ. XLP (16.1%) stabil relativ. Kette: Yen steigt abrupt → Carry-Trade Unwind → globaler Risk-Off. ACHTUNG: Low-Probability/High-Impact — August 2024 Carry Unwind = 3% SPY-Drop an einem Tag. Portfolio-Korrelation steigt auf >0.8 → Diversifikation versagt kurzfristig.',
    cold: 'HYG (28.8%) steigt — Carry Trade bleibt profitabel, Nachfrage nach Yield intakt. DBC (20.3%) steigt leicht — Risk-On. GLD (16.9%) neutral. XLU (18.0%) neutral. XLP (16.1%) neutral. Kette: Yen bleibt schwach → Carry Trade intakt → Risk-On Umfeld.',
    portfolio: 'Primärrisiko für HYG (28.8%): BOJ-Schock erzeugt schnellen, korrelationssprengenden Drawdown. Querverweis: JPY/USD + VIX zusammen beobachten — Yen-Stärke + VIX-Spike = Carry Unwind.',
  },
  // ═══════════════════════════════════════════════════════════
  // TIER C — Impact 4 (Ergänzende Indikatoren & Frühsignale)
  // ═══════════════════════════════════════════════════════════
  'Jobless Claims': {
    what: 'Wöchentliche Erstanträge auf Arbeitslosenhilfe — höchstfrequenter US-Arbeitsmarktindikator (jeden Donnerstag). 4-Wochen-Durchschnitt glättet Noise. Über 250K persistent = Frühwarnung, über 300K = Rezessionsniveau.',
    hot: 'HYG (28.8%) neutral — enger Arbeitsmarkt fundamental gut aber Zins-Gegenwind. DBC (20.3%) neutral. GLD (16.9%) neutral. XLU (18.0%) neutral. XLP (16.1%) neutral. Einzelner Print wenig aussagekräftig — erst Trend über 4+ Wochen relevant.',
    cold: 'HYG (28.8%) fällt bei persistentem Trend — steigende Entlassungen → NFP wird schwächer → Spread-Ausweitung. DBC (20.3%) fällt leicht. GLD (16.9%) steigt leicht. XLU (18.0%) steigt leicht — Defensive. XLP (16.1%) steigt leicht — Defensive. Kette: steigende Claims → wenn 4+ Wochen über 250K → NFP schwächt sich → HYG-Spread-Ausweitung um >50bp in 70% der Fälle innerhalb von 3 Monaten.',
    portfolio: 'Trend ist entscheidend, nicht Einzelwoche. HYG (28.8%): 4 Wochen über 250K = Risiko-Management aktivieren.',
  },
  'Consumer Confidence': {
    what: 'Verbrauchervertrauen — Leading Indicator für Konsumausgaben mit 2-3 Monaten Vorlauf. Expectations-Komponente unter 80 = historisch zuverlässiges Rezessionssignal.',
    hot: 'HYG (28.8%) steigt leicht — Consumer-Emittenten profitieren. DBC (20.3%) neutral. GLD (16.9%) fällt leicht — Risk-On. XLU (18.0%) fällt leicht — Rotation in Zykliker. XLP (16.1%) fällt — Rotation von Staples in Discretionary.',
    cold: 'HYG (28.8%) fällt — Consumer-Segment unter Druck. DBC (20.3%) neutral. GLD (16.9%) steigt leicht. XLU (18.0%) steigt — Defensive. XLP (16.1%) steigt — direkte Rotation bei Vertrauensverlust (Discretionary → Staples). Kette: pessimistische Verbraucher → Ausgaben fallen in 2-3 Monaten → Retail Sales schwächen sich. KRITISCH: Expectations unter 80 = Rezessionswarnung.',
    portfolio: 'HYG (28.8%): Expectations-Komponente als Leading Indicator beobachten. XLP (16.1%): direkter Profiteur bei Vertrauensverlust.',
  },
  'PMI': {
    what: 'Purchasing Managers Index (S&P Global) — Flash PMI erscheint ~2 Wochen vor ISM und ist das früheste Signal für den laufenden Monat. Über 50 = Expansion, unter 50 = Kontraktion.',
    hot: 'DBC (20.3%) steigt — Wirtschaft expandiert, Rohstoffnachfrage steigt. HYG (28.8%) steigt leicht — fundamental gestützt. GLD (16.9%) fällt leicht — Risk-On. XLU (18.0%) fällt leicht — Rotation in Zykliker. XLP (16.1%) fällt leicht. Bei CN PMI stark: DBC (20.3%) steigt zusätzlich (globale Commodity-Nachfrage).',
    cold: 'DBC (20.3%) fällt — Nachfrage sinkt. HYG (28.8%) fällt — abhängig von Region. GLD (16.9%) steigt — Safe Haven. XLU (18.0%) steigt — Defensive. XLP (16.1%) steigt — Defensive. Querverweis: US PMI schwach + CN PMI schwach = globale synchrone Verlangsamung → DBC-Drawdown-Risiko hoch.',
    portfolio: 'Flash PMI als ISM-Preview nutzen. DBC (20.3%): globale PMIs aggregiert = bester Proxy für industrielle Rohstoffnachfrage.',
  },
  'Housing Starts': {
    what: 'US-Baubeginne und Baugenehmigungen — Leading Indicator mit 6-9 Monaten Vorlauf. Zinssensitiv (Mortgage Rates). Permits laufen Starts voraus.',
    hot: 'DBC (20.3%) steigt — Nachfrage nach Kupfer, Lumber, Stahl steigt. HYG (28.8%) steigt leicht — Homebuilder-Segment profitiert. GLD (16.9%) neutral. XLU (18.0%) neutral. XLP (16.1%) neutral. Kette: mehr Bauaktivität → Baumaterial-Nachfrage steigt → Bauarbeiter-Nachfrage steigt.',
    cold: 'DBC (20.3%) fällt — Kupfer-Komponente direkt betroffen (~40% der US-Kupfernachfrage = Bau). HYG (28.8%) fällt leicht — Homebuilder-Segment. GLD (16.9%) steigt leicht bei Housing Recession. XLU (18.0%) neutral. XLP (16.1%) steigt leicht — Defensive. Querverweis: Housing Starts schwach + Consumer Confidence fallend + Mortgage Rates steigend = Housing Recession → breitere Konjunkturschwäche in 3-4 Quartalen.',
    portfolio: 'DBC (20.3%): Kupfer-Nachfrage direkt vom Bausektor abhängig. Querverweis: Housing Starts + Construction Spending + Existing Home Sales = Housing-Komplex.',
  },
  'Construction Spending': {
    what: 'US-Bauausgaben — monatliche Gesamtausgaben für Bau (Residential, Non-Residential, Government). Nachlaufender Indikator, aber Trendwechsel signalisieren Investitionszykluswende.',
    hot: 'DBC (20.3%) steigt — Kupfer und Stahl gefragt. HYG (28.8%) steigt leicht — Bau/Industrie-Emittenten profitieren. XLU (18.0%) steigt leicht — Infrastruktur-Komponente (Utilities-Ausbau). GLD (16.9%) neutral. XLP (16.1%) neutral. Kette: steigende Investitionstätigkeit → Industriesektor profitiert.',
    cold: 'DBC (20.3%) fällt — Bau-sensitive Rohstoffe (Kupfer, Stahl) unter Druck. HYG (28.8%) fällt leicht — Bau-Emittenten exponiert. XLU (18.0%) neutral. GLD (16.9%) steigt leicht. XLP (16.1%) steigt leicht — Defensive. Kette: sinkende Investitionstätigkeit → Industrienachfrage schwächt sich. Querverweis: Construction Spending schwach + ISM unter 50 = Investitionsrezession → DBC-Drawdown beschleunigt sich.',
    portfolio: 'DBC (20.3%): direkte Exposure über Kupfer und Baumaterialien. Trend über 3 Monate aussagekräftiger als Einzelprint. Querverweis: Construction Spending + Housing Starts + Durable Goods = Investment-Dreieck.',
  },
  'Trade Balance': {
    what: 'US-Handelsbilanz — Exporte minus Importe. Normalerweise niedriger Impact, AUSSER bei Trade-Policy Schocks (Tariffs, Trade Wars).',
    hot: 'DBC (20.3%) fällt leicht — Dollar kann sich stärken bei schrumpfendem Defizit. GLD (16.9%) fällt leicht — Dollar-Stärke. HYG (28.8%) neutral. XLU (18.0%) neutral. XLP (16.1%) neutral. Kontextabhängig: fallende Importe können auch Schwächesignal sein.',
    cold: 'DBC (20.3%) steigt leicht — Dollar unter Druck bei wachsendem Defizit. GLD (16.9%) steigt leicht — Dollar-Schwäche. HYG (28.8%) neutral. XLU (18.0%) neutral. XLP (16.1%) neutral.',
    portfolio: 'Normalerweise niedriger Impact. AUSNAHME Trade War: DBC (20.3%) fällt stark (Supply Chain Disruption), HYG (28.8%) fällt (zyklische Emittenten mit Exportexposure).',
  },
  'Durable Goods': {
    what: 'Aufträge für langlebige Güter — Leading Indicator für Business Investment. Headline volatil durch Boeing-Zyklen. Core Capital Goods (ex Defense & Aircraft) = Business Capex Proxy.',
    hot: 'DBC (20.3%) steigt — Industrieproduktion und Rohstoffnachfrage steigen. HYG (28.8%) steigt leicht — investierende Unternehmen = gesunde Bilanzen. GLD (16.9%) fällt leicht — Risk-On. XLU (18.0%) fällt leicht — Zykliker-Rotation. XLP (16.1%) fällt leicht. Kette: Unternehmen investieren → ISM Manufacturing folgt in 1-2 Monaten.',
    cold: 'DBC (20.3%) fällt — Nachfrage sinkt. HYG (28.8%) fällt leicht — Capex-abhängige Emittenten exponiert. GLD (16.9%) steigt leicht. XLU (18.0%) steigt leicht — Defensive. XLP (16.1%) steigt leicht — Defensive. Kette: Unternehmen halten Investitionen zurück → ISM Manufacturing fällt mit Verzögerung. 3 konsekutive Monate negativ = Rezessionsfrühsignal (Lead Time 4-6 Monate).',
    portfolio: 'DBC (20.3%): Frühindikator für industrielle Rohstoffnachfrage. Core Capital Goods ex Defense & Aircraft ist die sauberste Capex-Metrik — Headline ignorieren.',
  },
  'Industrial Production': {
    what: 'US-Industrieproduktion — Output von Manufacturing, Mining, Utilities. Capacity Utilization (gleichzeitig publiziert) zeigt Auslastungsgrad.',
    hot: 'DBC (20.3%) steigt — Rohstoffinput steigt nachfragegetrieben. HYG (28.8%) steigt leicht — besserer Operating Leverage der Emittenten. XLU (18.0%) steigt leicht — Utilities-Produktion steigt. GLD (16.9%) fällt leicht — Risk-On. XLP (16.1%) neutral. Kette: Fabriken produzieren mehr → Capacity Utilization über 80% → Engpässe möglich → Preisdruck.',
    cold: 'DBC (20.3%) fällt — weniger Rohstoffverbrauch. HYG (28.8%) fällt — Operating Leverage dreht negativ, Margen sinken. GLD (16.9%) steigt leicht. XLU (18.0%) fällt leicht — Utilities-Produktion sinkt. XLP (16.1%) steigt leicht — Defensive. Kette: Produktionsrückgang → sinkende Auslastung → Margen sinken. Capacity Utilization unter 75% = erhöhtes Rezessionsrisiko.',
    portfolio: 'DBC (20.3%): direkte Korrelation über Rohstoffverbrauch. Trend über 3 Monate aussagekräftiger als Einzelmonat.',
  },
  'Chicago Fed': {
    what: 'Chicago Fed National Activity Index (CFNAI) — 85 Indikatoren in einer Zahl. Über 0 = überdurchschnittliches Wachstum. CFNAI-MA3 unter -0.70 = historisch immer Rezession.',
    hot: 'HYG (28.8%) steigt leicht — breites Wachstum = niedrige Defaults. DBC (20.3%) steigt leicht. GLD (16.9%) fällt leicht. XLU (18.0%) fällt leicht. XLP (16.1%) fällt leicht. Selten marktbewegend als Einzelrelease.',
    cold: 'HYG (28.8%) fällt — CFNAI-MA3 unter -0.70 = definitives Signal zum Risiko-Abbau in HY. DBC (20.3%) fällt. GLD (16.9%) steigt — Safe Haven. XLU (18.0%) steigt — Defensive. XLP (16.1%) steigt — Defensive. Kette: breite Wirtschaftsschwäche → unter -0.35 = überdurchschnittliches Rezessionsrisiko → unter -0.70 = Rezession sicher.',
    portfolio: 'CFNAI als Meta-Bestätigung nutzen. HYG (28.8%): CFNAI-MA3 unter -0.70 = Risiko-Abbau. Querverweis: CFNAI + Sahm Rule + Yield Curve = Rezessions-Trifecta.',
  },
  'Bill Auction': {
    what: 'US Treasury Bill Auktion — kurzlaufende Staatsanleihen (4W-26W). Yield zeigt Markterwartung für Fed Funds am kurzen Ende.',
    hot: 'HYG (28.8%) fällt leicht — Higher-for-Longer bestätigt. XLU (18.0%) fällt leicht. DBC (20.3%) neutral. GLD (16.9%) neutral. XLP (16.1%) neutral. Einzelauktion selten marktbewegend — Trend relevant.',
    cold: 'HYG (28.8%) steigt leicht — Refinanzierungskosten sinken. XLU (18.0%) steigt leicht. DBC (20.3%) neutral. GLD (16.9%) neutral. XLP (16.1%) neutral.',
    portfolio: 'Niedriger direkter Impact. HYG (28.8%): Bill Yield Trend als Proxy für kurzfristige Refinanzierungskosten.',
  },
  'Note Auction': {
    what: 'US Treasury Note Auktion — mittelfristig (2Y-10Y). Die 10Y-Auktion ist die wichtigste (Benchmark für Mortgage Rates, Corporate Bonds). Tail, Bid-to-Cover, Indirect Bidders zeigen Nachfragequalität.',
    hot: 'HYG (28.8%) fällt — schwache Nachfrage treibt Yields hoch → HY-Benchmark steigt. XLU (18.0%) fällt — Duration-Asset leidet direkt. DBC (20.3%) neutral. GLD (16.9%) fällt leicht. XLP (16.1%) fällt leicht. Kette: Markt verlangt höhere Prämie → Yields steigen → Corporate Bond Yields steigen mit.',
    cold: 'HYG (28.8%) steigt — niedrigere Benchmark-Rate. XLU (18.0%) steigt — Duration-Play. DBC (20.3%) neutral. GLD (16.9%) steigt leicht. XLP (16.1%) steigt leicht. Kette: Flight to Quality oder Zinssenkungserwartung → Yields fallen.',
    portfolio: 'HYG (28.8%): 10Y-Yield ist die Benchmark für HY-Bewertung. XLU (18.0%): Duration-Sensitivität.',
  },
  'Bond Auction': {
    what: 'US Treasury Bond Auktion — langfristig (20Y, 30Y). Zeigt Nachfrage nach extremer Duration und Markteinschätzung für langfristiges Wachstum/Inflation.',
    hot: 'XLU (18.0%) fällt stark — längste Duration-Sensitivität unter unseren Positionen. HYG (28.8%) fällt — Benchmark am langen Ende steigt. DBC (20.3%) neutral. GLD (16.9%) fällt leicht. XLP (16.1%) fällt leicht. Kette: Markt will keine Langfristschuld → Term Premium steigt.',
    cold: 'XLU (18.0%) steigt — Duration-Play profitiert direkt. HYG (28.8%) steigt — niedrigere Benchmark. DBC (20.3%) neutral. GLD (16.9%) steigt leicht. XLP (16.1%) steigt leicht.',
    portfolio: 'XLU (18.0%): höchste Duration-Sensitivität. Querverweis: persistente Schwäche über alle Auktionstypen (Bills+Notes+Bonds) = Fiscal Dominance.',
  },
  'Core Inflation': {
    what: 'Kerninflation — CPI oder PCE ohne Nahrung und Energie, berichtet von verschiedenen Ländern. Sticky Inflationstrend den Zentralbanken beobachten.',
    hot: 'HYG (28.8%) fällt — Zentralbank bleibt restriktiv, Refinanzierung teurer. DBC (20.3%) steigt — realer Asset profitiert. GLD (16.9%) steigt — Inflationsschutz. XLU (18.0%) fällt — Bond-Proxy leidet. XLP (16.1%) stabil.',
    cold: 'HYG (28.8%) steigt — Zinssenkungen rücken näher. DBC (20.3%) fällt — Inflationshedge-Nachfrage sinkt. GLD (16.9%) gemischt. XLU (18.0%) steigt — Yield-Play. XLP (16.1%) steigt leicht.',
    portfolio: 'Länderspezifisch: US Core → HYG (28.8%), XLU (18.0%) direkt. EU Core → DBC (20.3%), GLD (16.9%) via EUR/USD.',
  },
  'Inflation Rate': {
    what: 'Headline Inflationsrate (Gesamtinflation inkl. Nahrung und Energie) — volatiler als Core. Für die Fed weniger relevant als Core PCE, aber politisch hochbedeutend.',
    hot: 'DBC (20.3%) steigt — wenn durch Energie/Nahrung getrieben, bestätigt Commodity-Stärke. GLD (16.9%) steigt — Inflationsschutz. HYG (28.8%) fällt — Zinsdruck. XLU (18.0%) fällt — Zinsdruck. XLP (16.1%) stabil — Pricing Power.',
    cold: 'DBC (20.3%) fällt — wenn durch Energie/Commodity-Schwäche getrieben. GLD (16.9%) fällt leicht. HYG (28.8%) steigt — Lockerungsspielraum. XLU (18.0%) steigt. XLP (16.1%) steigt leicht. Querverweis: Headline kalt + Core heiß = Basiseffekte in Energie, nicht strukturelle Disinflation.',
    portfolio: 'DBC (20.3%) und GLD (16.9%) steigen bei heißer Inflation. Headline vs. Core Divergenz beobachten.',
  },
  'Composite PMI': {
    what: 'Zusammengesetzter PMI (Manufacturing + Services) — breitester Einzelindikator für Wirtschaftsaktivität. Flash-Version erscheint Mitte Monat.',
    hot: 'DBC (20.3%) steigt — Rohstoffnachfrage steigt breit. HYG (28.8%) steigt — fundamental stark. GLD (16.9%) fällt leicht — Risk-On. XLU (18.0%) fällt leicht — Rotation in Zykliker. XLP (16.1%) fällt leicht. US + EU + CN alle über 50 = global synchroner Aufschwung → stärkstes Commodity-Umfeld.',
    cold: 'DBC (20.3%) fällt — synchroner Nachfrage-Druck. HYG (28.8%) fällt — breit unter Spread-Druck. GLD (16.9%) steigt — Safe Haven. XLU (18.0%) steigt — Defensive. XLP (16.1%) steigt — Defensive. Composite unter 48 für 2+ Monate = Rezessionsgebiet.',
    portfolio: 'DBC (20.3%): globaler Composite PMI = bester Proxy für Rohstoffnachfrage. HYG (28.8%): breite Expansion/Kontraktion bestimmt Default-Umfeld.',
  },
  'Services PMI': {
    what: 'Services PMI (S&P Global) — Dienstleistungssektor ~80% der Wirtschaft. Flash-Version erscheint Mitte Monat vor ISM. Input Prices zeigt Dienstleistungsinflation.',
    hot: 'HYG (28.8%) steigt leicht — fundamental gut aber Higher-for-Longer Zins-Gegenwind. DBC (20.3%) neutral. XLU (18.0%) fällt — Zinserwartungen steigen. GLD (16.9%) fällt leicht. XLP (16.1%) fällt leicht.',
    cold: 'HYG (28.8%) fällt — Services-Emittenten ~50% des HY-Universums. DBC (20.3%) fällt leicht. GLD (16.9%) steigt. XLU (18.0%) steigt — Defensive. XLP (16.1%) steigt — Defensive. Kette: Services schwächen sich → Employment fällt → Consumer Spending folgt.',
    portfolio: 'Wichtiger als Manufacturing PMI für HYG (28.8%). Querverweis: Services PMI + ISM Services als Bestätigung.',
  },
  'Manufacturing PMI': {
    what: 'Manufacturing PMI (S&P Global) — Industriesektor. Flash-Version Mitte Monat. CN Manufacturing PMI (Caixin) bewegt globale Commodity-Märkte.',
    hot: 'DBC (20.3%) steigt — Rohstoffbestellungen steigen direkt. HYG (28.8%) steigt leicht — besserer Operating Leverage. GLD (16.9%) fällt leicht. XLU (18.0%) fällt leicht. XLP (16.1%) fällt leicht.',
    cold: 'DBC (20.3%) fällt — Rohstoffnachfrage sinkt. HYG (28.8%) fällt leicht — Industrieemittenten unter Margendruck. GLD (16.9%) steigt leicht. XLU (18.0%) steigt leicht. XLP (16.1%) steigt leicht. CN Manufacturing PMI gleichzeitig schwach → globaler Commodity-Abschwung → DBC-Drawdown beschleunigt.',
    portfolio: 'DBC (20.3%): direktester Vorlaufindikator. Globale PMIs aggregieren.',
  },
  'CB Consumer': {
    what: 'Conference Board Consumer Confidence — umfassendste US-Verbraucherumfrage. Present Situation (Arbeitsmarkt-korreliert) + Expectations (Rezessionsindikator). Expectations unter 80 = in 80% der Fälle Rezession innerhalb 12 Monaten.',
    hot: 'HYG (28.8%) steigt leicht — Consumer-Emittenten profitieren. DBC (20.3%) neutral. GLD (16.9%) fällt leicht. XLU (18.0%) fällt leicht. XLP (16.1%) fällt — Rotation in Discretionary.',
    cold: 'HYG (28.8%) fällt — Consumer-Emittenten unter Druck. DBC (20.3%) neutral. GLD (16.9%) steigt leicht. XLU (18.0%) steigt — Defensive. XLP (16.1%) steigt — direkte Rotation (Discretionary → Staples). KRITISCH: Expectations unter 80 = Rezessionswarnung → HYG-Risiko steigt erheblich.',
    portfolio: 'HYG (28.8%): Expectations-Komponente als Leading Indicator für Consumer-Defaults. XLP (16.1%): direkter Profiteur bei Vertrauensverlust.',
  },
  'Michigan Consumer': {
    what: 'University of Michigan Consumer Sentiment — älteste US-Verbraucherumfrage. Enthält 1Y und 5-10Y Inflationserwartungen die von der Fed direkt beobachtet werden. Inflationserwartungen oft marktbewegender als Sentiment.',
    hot: 'HYG (28.8%) fällt wenn Inflationserwartungen hoch — Fed wird hawkischer trotz gutem Sentiment. DBC (20.3%) neutral. GLD (16.9%) steigt wenn Inflationserwartungen steigen. XLU (18.0%) fällt — Zinsdruck. XLP (16.1%) neutral. ROTE LINIE: 5Y Inflation Expectations über 3.0% = Fed muss reagieren.',
    cold: 'HYG (28.8%) gemischt — wenn Inflationserwartungen auch fallen: Fed kann senken → HYG steigt. Wenn Inflationserwartungen hoch bleiben: Stagflationsrisiko → HYG fällt. DBC (20.3%) neutral. GLD (16.9%) fällt leicht wenn Inflationserwartungen sinken. XLU (18.0%) steigt bei reinen Wachstumssorgen. XLP (16.1%) steigt — Defensive.',
    portfolio: 'Inflationserwartungen-Komponente ist der Schlüssel, nicht das Sentiment selbst. HYG (28.8%): Sentiment als Default-Frühindikator. GLD (16.9%): steigt wenn Inflationserwartungen steigen.',
  },
  'Initial Jobless': {
    what: 'Initial Jobless Claims — identisch mit Jobless Claims. Höchstfrequenter Arbeitsmarktindikator (jeden Donnerstag). 4-Wochen-Durchschnitt glätten.',
    hot: 'HYG (28.8%) neutral. DBC (20.3%) neutral. GLD (16.9%) neutral. XLU (18.0%) neutral. XLP (16.1%) neutral. Einzelwoche wenig aussagekräftig.',
    cold: 'HYG (28.8%) fällt bei persistentem Trend über 4+ Wochen. DBC (20.3%) fällt leicht. GLD (16.9%) steigt leicht. XLU (18.0%) steigt leicht. XLP (16.1%) steigt leicht. Claims über 250K persistent = Frühwarnung.',
    portfolio: 'Trend entscheidend. HYG (28.8%): 4-Wochen-Durchschnitt über 250K mit steigender Tendenz = Risiko-Management.',
  },
  'Continuing Jobless': {
    what: 'Continuing Claims — zeigt Langzeitarbeitslosigkeit. Steigend = Menschen finden keine neuen Jobs → strukturelle Verschlechterung. Ernsterer Indikator als Initial Claims.',
    hot: 'HYG (28.8%) steigt leicht — Arbeitsmarkt gesund, Konsumausgaben intakt. DBC (20.3%) neutral. GLD (16.9%) neutral. XLU (18.0%) neutral. XLP (16.1%) neutral.',
    cold: 'HYG (28.8%) fällt — Langzeitarbeitslosigkeit → Einkommen sinkt → Verbraucher können Schulden nicht bedienen → Default-Kaskade. DBC (20.3%) fällt leicht. GLD (16.9%) steigt — Safe Haven. XLU (18.0%) steigt — Defensive. XLP (16.1%) steigt — Defensive. Steigende Continuing Claims = Spätindikator der bestätigt dass Schwäche strukturell wird.',
    portfolio: 'HYG (28.8%): steigende Continuing Claims bedeutet oft dass es für defensive Positionierung schon spät ist. Querverweis: Continuing Claims + Sahm Rule + Yield Curve = Rezessionsbestätigung.',
  },
  'Richmond Fed': {
    what: 'Richmond Fed Manufacturing/Services Index — regionale Fed-Umfrage Ostküste. Unter 0 = Kontraktion. Als einzelner Index niedriger Impact, im Mosaik der 5 regionalen Feds wird er zur ISM-Preview.',
    hot: 'DBC (20.3%) steigt leicht — regionale Expansion, wenn andere Feds auch positiv → ISM stark. HYG (28.8%) neutral. GLD (16.9%) neutral. XLU (18.0%) neutral. XLP (16.1%) neutral.',
    cold: 'DBC (20.3%) fällt leicht — wenn Dallas, KC, Philly auch negativ → ISM-Schwäche wahrscheinlich. HYG (28.8%) neutral. GLD (16.9%) neutral. XLU (18.0%) neutral. XLP (16.1%) neutral. Einzeln wenig Impact.',
    portfolio: 'Niedriger direkter Impact. 3+ von 5 regionalen Feds negativ = ISM unter 50 in >75% der Fälle → dann DBC (20.3%) exponiert.',
  },
  'Dallas Fed': {
    what: 'Dallas Fed Manufacturing/Services Index — Texas/Süden, Energiesektor-dominant. Bester Frühindikator für den US-Energiesektor.',
    hot: 'DBC (20.3%) steigt — Energiekomponente gestützt. HYG (28.8%) steigt leicht — Energie-Emittenten ~15% des HY-Index profitieren. GLD (16.9%) neutral. XLU (18.0%) neutral. XLP (16.1%) neutral.',
    cold: 'DBC (20.3%) fällt — Energiekomponente schwächelt. HYG (28.8%) fällt — Energie-HY-Emittenten (E&P mit hohem Leverage) unter Druck, bei persistenter Schwäche Shale-Pleiten-Welle möglich (wie 2015-16). GLD (16.9%) steigt leicht wenn Energie-Schwäche Rezessionsangst auslöst. XLU (18.0%) neutral. XLP (16.1%) neutral.',
    portfolio: 'DBC (20.3%): Dallas Fed als Energie-Frühindikator direkt relevant. HYG (28.8%): Energie-HY = signifikantes Cluster-Risiko. Querverweis: Dallas Fed + Crude Oil Inventories + Rig Count = Energiesektor-Komplex.',
  },
  'Fed': {
    what: 'Fed-Offizielle Reden — einzelne FOMC-Mitglieder kommunizieren ihre Einschätzung. Impact-Hierarchie: Chair > Vice Chair > NY Fed > andere Voting > Non-Voting.',
    hot: 'HYG (28.8%) fällt — Zinserwartungen steigen. DBC (20.3%) fällt — Dollar steigt. GLD (16.9%) fällt — Dollar steigt. XLU (18.0%) fällt — Duration-Proxy. XLP (16.1%) stabil. Impact abhängig vom Sprecher.',
    cold: 'HYG (28.8%) steigt — schnellere Zinssenkungen eingepreist. DBC (20.3%) steigt — Dollar fällt. GLD (16.9%) steigt — Dollar fällt. XLU (18.0%) steigt — Duration-Proxy. XLP (16.1%) steigt leicht. 3+ Voting Members dovish in einer Woche = Shift ist real.',
    portfolio: 'HYG (28.8%): am sensitivsten für Forward-Guidance. DBC (20.3%) und GLD (16.9%): über Dollar-Kanal.',
  },
  'Crude Oil': {
    what: 'Rohöl-Lagerbestandsveränderung — API (Dienstag, privat) und EIA/DOE (Mittwoch, offiziell). Steigende Bestände = Überangebot, fallende = Nachfrage übersteigt Produktion.',
    hot: 'DBC (20.3%) steigt direkt — Energie ist die größte DBC-Komponente. HYG (28.8%) gemischt — Energie-HY profitiert, aber Inflationsdruck steigt → Zinsdruck auf Rest. GLD (16.9%) steigt leicht — Inflationsangst. XLU (18.0%) fällt — höhere Energiekosten drücken Margen (Strom aus Gas teurer). XLP (16.1%) fällt leicht — Transportkosten steigen. Kette: starker Bestandsabbau → Ölpreis steigt → Benzinpreise steigen → Headline CPI steigt.',
    cold: 'DBC (20.3%) fällt direkt — Energie-Gewichtung im Commodity Index. HYG (28.8%) gemischt — Energie-HY-Segment (~15%) fällt, aber niedrigere Energiekosten = disinflationär = positiv für Zinspfad. GLD (16.9%) neutral. XLU (18.0%) steigt leicht — niedrigere Inputkosten verbessern Margen. XLP (16.1%) steigt leicht — niedrigere Transportkosten.',
    portfolio: 'DBC (20.3%): direkteste Exposure. HYG (28.8%): Energie-HY-Segment bei anhaltendem Aufbau exponiert. Querverweis: Crude Inventories + Dallas Fed + OPEC = Energiemarkt-Dreieck.',
  },
  'Money Supply': {
    what: 'Geldmenge (M2) — Bargeld, Einlagen, Geldmarktfonds. M2-Wachstum korreliert mit Assetpreis-Inflation (12-18M Vorlauf) und CPI (18-24M Vorlauf). M2 YoY negativ = extremes Warnsignal (zuletzt 2023, davor Great Depression).',
    hot: 'DBC (20.3%) steigt — Commodities als realer Asset profitieren von Geldmengenexpansion. GLD (16.9%) steigt — klassischer Geldmengen-Hedge. HYG (28.8%) steigt — mehr Liquidität = engere Spreads. XLU (18.0%) steigt — Bewertungsmultiples steigen. XLP (16.1%) steigt. Kette: mehr Geld → Liquidität steigt → Assetpreise steigen breit.',
    cold: 'HYG (28.8%) fällt — Liquidität ist der Lebenssaft der Kreditmärkte. DBC (20.3%) fällt — weniger Geld jagt Assets. GLD (16.9%) gemischt — Liquiditätsentzug negativ, aber Flight to Quality positiv. XLU (18.0%) fällt. XLP (16.1%) fällt leicht. Kette: weniger Geld → Liquidität sinkt → alle Risk-Assets leiden.',
    portfolio: 'Struktureller Indikator — Trend über 6-12 Monate. HYG (28.8%): M2-Kontraktion trocknet Kreditliquidität aus. Querverweis: M2 + Fed Balance Sheet + Reverse Repo = unser Net Liquidity Indikator.',
  },
  'Redbook': {
    what: 'Redbook Index — wöchentlicher Same-Store Retail Sales YoY. Höchstfrequenter Konsumindikator (jeden Dienstag). Eingeschränkte Breite (kein E-Commerce).',
    hot: 'HYG (28.8%) steigt leicht — Consumer-Emittenten profitieren. XLP (16.1%) fällt leicht — Rotation in Discretionary. DBC (20.3%) neutral. GLD (16.9%) neutral. XLU (18.0%) neutral. Einzelwoche wenig aussagekräftig.',
    cold: 'HYG (28.8%) fällt leicht bei Trend — Consumer-Emittenten unter Druck. XLP (16.1%) steigt leicht — Staples resilienter. DBC (20.3%) neutral. GLD (16.9%) neutral. XLU (18.0%) neutral.',
    portfolio: 'Niedriger direkter Impact. Nützlich als wöchentlicher Pulsmesser zwischen monatlichen Retail Sales.',
  },
  'Chicago PMI': {
    what: 'Chicago PMI (Business Barometer) — regionaler Industrieindex Chicago. Historisch ISM-Korrelation >0.8. Erscheint am letzten Geschäftstag, einen Tag vor ISM.',
    hot: 'DBC (20.3%) steigt leicht — ISM voraussichtlich stark. HYG (28.8%) steigt leicht. GLD (16.9%) fällt leicht. XLU (18.0%) fällt leicht. XLP (16.1%) fällt leicht.',
    cold: 'DBC (20.3%) fällt — ISM voraussichtlich schwach. HYG (28.8%) fällt leicht. GLD (16.9%) steigt leicht. XLU (18.0%) steigt leicht. XLP (16.1%) steigt leicht. Unter 40 = historisch tiefe Kontraktion. Querverweis: Chicago PMI am Monatsende → ISM Manufacturing am nächsten Tag → die Kombination gibt das früheste Gesamtbild.',
    portfolio: 'Primär als ISM-Preview. DBC (20.3%): über ISM-Erwartungskanal relevant.',
  },
};

// Helper: Finde Erklärung für einen Event-Namen
function getEventExplainer(eventName) {
  if (!eventName) return null;
  const name = eventName.toLowerCase();
  for (const [key, explainer] of Object.entries(EVENT_EXPLAINERS)) {
    if (name.includes(key.toLowerCase())) return explainer;
  }
  return null;
}

// Helper: Surprise-Richtung zu Erklärungsfeld mappen
function getSurpriseExplanation(eventName, direction) {
  const exp = getEventExplainer(eventName);
  if (!exp) return null;
  if (direction === 'HOT' || direction === 'HAWKISH' || direction === 'STRONG' || direction === 'ABOVE') return exp.hot;
  if (direction === 'COLD' || direction === 'DOVISH' || direction === 'WEAK' || direction === 'BELOW') return exp.cold;
  return null;
}

// ═══════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════

// Entfernt LLM Web Search Zitations-Tags wie <cite index="15-1">...</cite>
// und andere XML-artige Tags die der LLM in Responses einfügt
function stripCite(text) {
  if (!text || typeof text !== 'string') return text || '';
  return text
    .replace(/<cite[^>]*>/gi, '')
    .replace(/<\/cite>/gi, '')
    .replace(/<\/?antml:[^>]*>/gi, '')
    .trim();
}

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
      {tab === 'intel' && <IntelTab d={d} />}
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
  const intelligence = d.intelligence;

  return (
    <div className="space-y-4">

      {/* Intelligence Summary (wenn vorhanden) */}
      {intelligence?.summary_one_liner && (
        <div className="rounded-lg border-l-4 px-4 py-3"
          style={{ backgroundColor: `${COLORS.baldurBlue}10`, borderLeftColor: COLORS.baldurBlue }}>
          <div className="flex items-center gap-2 mb-1">
            <Brain size={14} style={{ color: COLORS.baldurBlue }} />
            <span className="text-xs uppercase tracking-wider font-bold" style={{ color: COLORS.baldurBlue }}>Intelligence</span>
          </div>
          <p className="text-sm text-ice-white">{stripCite(intelligence.summary_one_liner)}</p>
          {intelligence.portfolio_action_required && (
            <p className="text-xs mt-1" style={{ color: COLORS.signalRed }}>⚠ Portfolio-Aktion empfohlen — siehe § Intel Tab für Details</p>
          )}
        </div>
      )}

      {/* Trigger Banner (wenn Intelligence NICHT gelaufen) */}
      {hasTrigger && !intelligence && (
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

      {/* Divergenzen kompakt — ALLE Paare mit Erklärung */}
      <GlassCard>
        <div className="flex items-center justify-between mb-2">
          <span className="text-label uppercase tracking-wider text-muted-blue">Divergenzen</span>
          <Pill color={CC_ALERT_LEVEL_COLORS[diverg.alert_level] || COLORS.mutedBlue}>{diverg.alert_level || '—'}</Pill>
        </div>
        {(diverg.pairs || []).filter(p => p.signal !== 'UNAVAILABLE' && !['COPPER/GLD', 'VIX_PROXY'].includes(p.pair)).map((p, i) => {
          const ctx = PAIR_CONTEXT[p.pair] || {};
          const sigColor = CC_DIVERGENCE_SIGNAL_COLORS[p.signal] || COLORS.mutedBlue;
          const explanation = getPairExplanation(p.pair, p.signal, p.z_score);
          const directionText = getPairDirectionText(p.pair, p.z_score);

          return (
            <div key={i} className="py-2 border-b border-white/5">
              <div className="flex justify-between text-sm">
                <span className="text-ice-white">{p.pair} <span className="text-muted-blue">({ctx.name || p.name || ''})</span></span>
                <span style={{ color: sigColor }}>
                  Z={fmtZ(p.z_score)} <Pill color={sigColor}>{p.signal}</Pill>
                </span>
              </div>
              <div className="text-xs text-muted-blue mt-1">{ctx.what} Bestätigter Trigger: Z{ctx.trigger_threshold}.</div>
              {directionText && (
                <div className="text-xs mt-1" style={{ color: p.signal === 'NORMAL' ? COLORS.mutedBlue : sigColor }}>
                  <strong>Aktuell (Z={fmtZ(p.z_score)}):</strong> {directionText}
                </div>
              )}
              {explanation && (
                <div className="text-xs mt-1" style={{ color: p.signal === 'NORMAL' ? COLORS.mutedBlue : sigColor }}>
                  {explanation}
                </div>
              )}
            </div>
          );
        })}
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
// TAB 2: INTEL — Intelligence Layer Gesamt-Analyse
// Der Knotenpunkt: LLM liest alle 8 Systeme und liefert
// Summary, Trigger, Zeitlücken, Threats, Signals, Second-Order
// ═══════════════════════════════════════════════════════

function IntelTab({ d }) {
  const intelligence = d.intelligence;
  const triggered = d.intelligence_triggered;
  const triggerReasons = d.trigger_reasons || [];

  // Kein Trigger → ruhiger Tag
  if (!triggered || !intelligence) {
    return (
      <GlassCard>
        <div className="text-center py-10">
          <div className="text-4xl mb-3">✓</div>
          <p className="text-lg" style={{ color: COLORS.signalGreen }}>Ruhiger Tag — keine Intelligence-Analyse nötig</p>
          <p className="text-xs text-muted-blue mt-3 max-w-md mx-auto">
            Der Daten-Layer hat keine Trigger-Bedingung erkannt (keine extremen Divergenzen, kein Alignment-Drop,
            keine Timeline-Konvergenz, keine Surprise). An 70-80% der Handelstage ist das der Normalfall.
          </p>
          <p className="text-xs text-muted-blue mt-2">
            Die quantitativen Daten (Divergenzen, Liquidität, Alignment) sind in den anderen Tabs weiterhin sichtbar.
          </p>
          <ExplainBox>
            Der Intelligence Layer kostet ~$0.05-0.10 pro Aufruf und läuft nur wenn mindestens eine Bedingung erfüllt ist:
            Divergenz EXTREME, Alignment-Drop {'>'}0.20, Timeline-Konvergenz (3+ in 14d), Liq-Kombi Signal, oder Anomalie.
            Das spart Kosten und reduziert Noise.
          </ExplainBox>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-4">

      {/* Summary One-Liner — das Wichtigste zuerst */}
      <GlassCard>
        <div className="flex items-center gap-2 mb-3">
          <Brain size={18} style={{ color: COLORS.baldurBlue }} />
          <span className="text-label uppercase tracking-wider" style={{ color: COLORS.baldurBlue }}>Intelligence Summary</span>
        </div>
        <div className="text-base text-ice-white leading-relaxed px-4 py-3 rounded"
          style={{ backgroundColor: `${COLORS.baldurBlue}08`, borderLeft: `3px solid ${COLORS.baldurBlue}` }}>
          {stripCite(intelligence.summary_one_liner) || 'Keine Zusammenfassung verfügbar.'}
        </div>
        {intelligence.portfolio_action_required && (
          <div className="mt-2 px-4 py-2 rounded" style={{ backgroundColor: `${COLORS.signalRed}12`, borderLeft: `3px solid ${COLORS.signalRed}` }}>
            <span className="text-sm font-bold" style={{ color: COLORS.signalRed }}>⚠ Portfolio-Aktion empfohlen</span>
          </div>
        )}
        {!intelligence.portfolio_action_required && (
          <div className="mt-2 text-xs text-muted-blue px-4">Keine Portfolio-Aktion erforderlich.</div>
        )}
      </GlassCard>

      {/* Events Gestern — Was ist passiert und was bedeutet es? */}
      {(() => {
        const yesterdayEvents = d.calendar?.yesterday || [];
        const surpriseList = d.surprises?.yesterday_surprises || [];
        const reactions = d.market_reactions?.reactions || [];

        // Merge surprise-Daten in Events (surprises sind separates Array)
        const enriched = yesterdayEvents.map(ev => {
          const surprise = surpriseList.find(s =>
            s.event && ev.event && s.event.toLowerCase().includes(ev.event.toLowerCase().substring(0, 15))
          );
          return {
            ...ev,
            surprise_direction: ev.surprise_direction || surprise?.direction,
            surprise_pct: ev.surprise_pct ?? surprise?.surprise_pct,
          };
        });

        // Zeige Events mit Impact ≥ 2 ODER mit Surprise (nicht INLINE)
        const relevantEvents = enriched.filter(ev =>
          (ev.impact_score || 0) >= 2 ||
          (ev.surprise_direction && ev.surprise_direction !== 'INLINE') ||
          (ev.actual != null && ev.consensus != null && ev.actual !== ev.consensus)
        );
        if (relevantEvents.length === 0) return null;

        return (
          <GlassCard>
            <Section title="Events Gestern" subtitle="Was ist passiert und was bedeutet das?">
              {relevantEvents.map((ev, i) => {
                const exp = getEventExplainer(ev.event);
                const surpriseColor = CC_SURPRISE_COLORS[ev.surprise_direction] || COLORS.mutedBlue;
                const reaction = reactions.find(r => r.event === ev.event);
                const reactionColor = reaction ? (CC_REACTION_COLORS[reaction.reaction] || COLORS.mutedBlue) : null;
                const surpriseExpl = getSurpriseExplanation(ev.event, ev.surprise_direction);

                return (
                  <div key={i} className="py-3 border-b border-white/5">
                    {/* Event Header */}
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-sm text-ice-white font-bold">{ev.event}</span>
                        <span className="text-caption text-muted-blue ml-2">{ev.country}</span>
                      </div>
                      <ImpactBar score={ev.impact_score} />
                    </div>

                    {/* Was misst dieser Indikator? */}
                    {exp?.what && (
                      <div className="text-xs text-muted-blue mt-1">{exp.what}</div>
                    )}

                    {/* Ergebnis + Surprise */}
                    {ev.actual != null && (
                      <div className="text-xs mt-2 px-3 py-2 rounded" style={{ backgroundColor: `${surpriseColor}08`, borderLeft: `2px solid ${surpriseColor}40` }}>
                        <div>
                          <span className="text-muted-blue">Konsens: {ev.consensus ?? '—'}</span>
                          <span className="text-ice-white mx-2">→ Ergebnis: <strong>{ev.actual}</strong></span>
                          {ev.surprise_direction && ev.surprise_direction !== 'INLINE' && (
                            <Pill color={surpriseColor}>{ev.surprise_direction}</Pill>
                          )}
                          {ev.surprise_pct != null && (
                            <span className="text-muted-blue ml-1">({(ev.surprise_pct * 100).toFixed(1)}% Abweichung)</span>
                          )}
                        </div>

                        {/* Was bedeutet dieses Ergebnis? */}
                        {surpriseExpl && (
                          <div className="text-xs mt-1" style={{ color: surpriseColor }}>
                            <strong>Implikation:</strong> {surpriseExpl}
                          </div>
                        )}

                        {/* Portfolio-Relevanz */}
                        {exp?.portfolio && (
                          <div className="text-xs text-muted-blue mt-1">
                            <strong className="text-ice-white">Portfolio:</strong> {exp.portfolio}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Markt-Reaktion wenn vorhanden */}
                    {reaction && (
                      <div className="text-xs mt-1 flex items-center gap-2">
                        <span className="text-muted-blue">Markt-Reaktion:</span>
                        <Pill color={reactionColor}>{reaction.reaction}</Pill>
                        {reaction.reaction === 'ABSORBED' && (
                          <span className="text-muted-blue">— Markt hat die Nachricht ignoriert (bullish Signal)</span>
                        )}
                        {reaction.reaction === 'REJECTED' && (
                          <span className="text-muted-blue">— Markt hat positiv reagiert verkauft (bearish Signal)</span>
                        )}
                      </div>
                    )}

                    {/* Event ohne Actual aber mit Konsens */}
                    {ev.actual == null && ev.consensus != null && (
                      <div className="text-xs text-muted-blue mt-1">Konsens: {ev.consensus} — Ergebnis noch nicht verfügbar.</div>
                    )}
                  </div>
                );
              })}
              <ExplainBox>
                Nur Events mit Impact Score ≥3 oder signifikanter Überraschung werden hier gezeigt.
                Impact Score = historischer Markt-Impact × Portfolio-Geo-Exposure.
                Alle Events inkl. niedrigem Impact im § Calendar Tab.
              </ExplainBox>
            </Section>
          </GlassCard>
        );
      })()}

      {/* Trigger-Analyse — warum wurde der Intelligence Layer aktiviert? */}
      {intelligence.trigger_analysis && (
        <GlassCard>
          <Section title="Trigger-Analyse" subtitle="Warum wurde die Intelligence aktiviert?">
            <div className="flex items-center gap-2 mb-2">
              <Pill color={intelligence.trigger_analysis.severity === 'CRITICAL' ? COLORS.signalRed :
                intelligence.trigger_analysis.severity === 'HIGH' ? COLORS.signalOrange : COLORS.signalYellow}>
                {intelligence.trigger_analysis.severity || 'MODERATE'}
              </Pill>
              <span className="text-sm text-ice-white font-bold">{stripCite(intelligence.trigger_analysis.primary_trigger)}</span>
            </div>
            {intelligence.trigger_analysis.trigger_type && (
              <div className="text-xs text-muted-blue mb-1">Typ: {intelligence.trigger_analysis.trigger_type}</div>
            )}
            {intelligence.trigger_analysis.interpretation && (
              <div className="text-sm text-muted-blue leading-relaxed mt-2">{stripCite(intelligence.trigger_analysis.interpretation)}</div>
            )}
            <div className="text-xs text-muted-blue mt-2">Daten-Layer Trigger: {triggerReasons.join(', ')}</div>
          </Section>
        </GlassCard>
      )}

      {/* Zeitlücken-Warnung — das wertvollste Signal */}
      {intelligence.time_gap_warning?.exists && (
        <GlassCard>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">⏰</span>
            <span className="text-label uppercase tracking-wider text-muted-blue">Zeitlücke erkannt</span>
            <Pill color={intelligence.time_gap_warning.confidence === 'HIGH' ? COLORS.signalRed :
              intelligence.time_gap_warning.confidence === 'MEDIUM' ? COLORS.signalOrange : COLORS.signalYellow}>
              Confidence: {intelligence.time_gap_warning.confidence}
            </Pill>
          </div>
          <div className="text-sm text-ice-white leading-relaxed mb-2">{stripCite(intelligence.time_gap_warning.description)}</div>
          {intelligence.time_gap_warning.historical_basis && (
            <div className="text-xs mt-2" style={{ color: COLORS.signalOrange }}>
              <strong>Historische Basis:</strong> {stripCite(intelligence.time_gap_warning.historical_basis)}
            </div>
          )}
          <ExplainBox>
            Zeitlücken = was der Command Center JETZT sieht, das V16 erst in 4-8 Wochen in seinen monatlichen Daten erkennt.
            Das ist dein Handlungsfenster. V16 ändert die Allokation automatisch — aber erst wenn die monatlichen Indikatoren
            drehen. Der Command Center sieht die täglichen Leading Signals und kann 4-8 Wochen früher warnen.
          </ExplainBox>
        </GlassCard>
      )}

      {/* System-Linsen-Analyse — jedes System durch die Event-Linse */}
      {intelligence.system_lens_analysis && (
        <GlassCard>
          <Section title="System-Linsen" subtitle="Derselbe Trigger — 6 verschiedene Perspektiven">
            {(() => {
              const lensConfig = [
                { key: 'v16_regime', name: 'V16 Regime', icon: '📊', desc: 'Wie verändert der Trigger den V16 State? Zeitlücke?' },
                { key: 'cycles', name: 'Cycles', icon: '🔄', desc: 'Beschleunigt/bremst der Trigger eine Zyklus-Transition?' },
                { key: 'thesen', name: 'Thesen', icon: '💡', desc: 'Triggert das einen Katalysator einer Investment-These?' },
                { key: 'secular', name: 'Säkulare Trends', icon: '📈', desc: 'Verstärkt/schwächt das einen langfristigen Trend?' },
                { key: 'crypto', name: 'Crypto', icon: '₿', desc: 'Impact auf das Crypto Ensemble und Trickle-Down?' },
                { key: 'relative_value', name: 'Relative Value', icon: '⚖️', desc: 'Verschiebt das ein Ratio-Paar das bereits extrem steht?' },
              ];

              return lensConfig.map(({ key, name, icon, desc }) => {
                const text = intelligence.system_lens_analysis[key];
                if (!text || text === '?' || text === 'null' || text === 'N/A') return null;
                return (
                  <div key={key} className="py-3 border-b border-white/5">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">{icon}</span>
                      <span className="text-sm text-ice-white font-bold">{name}</span>
                    </div>
                    <div className="text-xs text-muted-blue mb-1 italic">{desc}</div>
                    <div className="text-sm text-muted-blue leading-relaxed">{stripCite(text)}</div>
                  </div>
                );
              }).filter(Boolean);
            })()}
            <ExplainBox>
              Jedes der 8 internen Systeme liefert eine andere Perspektive auf denselben Trigger.
              V16 reagiert monatlich, Cycles wöchentlich, Thesen haben konkrete Katalysatoren.
              Die Linsen-Analyse zeigt wo die Systeme übereinstimmen und wo sie sich widersprechen.
            </ExplainBox>
          </Section>
        </GlassCard>
      )}

      {/* Threats aus Intelligence */}
      {intelligence.threats?.length > 0 && (
        <GlassCard>
          <Section title="Threats" subtitle={`${intelligence.threats.length} Portfolio-Bedrohungen erkannt`}>
            {intelligence.threats.map((t, i) => {
              const sevColor = t.severity === 'CRITICAL' ? COLORS.signalRed :
                t.severity === 'HIGH' ? COLORS.signalOrange : COLORS.signalYellow;
              return (
                <div key={i} className="py-3 border-b border-white/5">
                  <div className="flex items-center gap-2 mb-1">
                    <Pill color={sevColor}>{t.severity}</Pill>
                    <span className="text-sm text-ice-white font-bold">{stripCite(t.title)}</span>
                  </div>
                  <div className="text-sm text-muted-blue leading-relaxed">{stripCite(t.description)}</div>
                  {t.exposed_assets?.length > 0 && (
                    <div className="text-xs text-muted-blue mt-1">
                      <strong className="text-ice-white">Betroffene Assets:</strong> {t.exposed_assets.join(', ')}
                    </div>
                  )}
                  {t.time_horizon && (
                    <div className="text-xs text-muted-blue mt-1">
                      <strong className="text-ice-white">Zeithorizont:</strong> {stripCite(t.time_horizon)}
                    </div>
                  )}
                  {t.action_suggestion && (
                    <div className="text-xs mt-2 px-3 py-1.5 rounded" style={{ backgroundColor: `${sevColor}12`, color: sevColor }}>
                      → {stripCite(t.action_suggestion)}
                    </div>
                  )}
                </div>
              );
            })}
            <ExplainBox>
              Intelligence-Threats basieren auf der LLM-Analyse aller System-Daten und Web Search.
              Für quantitative Regret-Matrizen (Kosten von Handeln vs. Nichtstun) siehe den § Threats Tab.
            </ExplainBox>
          </Section>
        </GlassCard>
      )}

      {/* Signals aus Intelligence */}
      {intelligence.signals?.length > 0 && (
        <GlassCard>
          <Section title="Signals" subtitle={`${intelligence.signals.length} erkannt`}>
            {intelligence.signals.map((s, i) => {
              const typeConfig = {
                TIME_GAP:              { color: COLORS.baldurBlue, icon: '⏰', label: 'Zeitlücke' },
                CATALYST_TRIGGERED:    { color: COLORS.signalYellow, icon: '⚡', label: 'Katalysator' },
                REGIME_SHIFT:          { color: COLORS.signalOrange, icon: '🔄', label: 'Regime-Shift' },
                DIVERGENCE_CONFIRMED:  { color: COLORS.signalRed, icon: '📊', label: 'Divergenz bestätigt' },
                MARKET_ABSORBED:       { color: COLORS.signalGreen, icon: '🟢', label: 'Markt absorbiert' },
              };
              const cfg = typeConfig[s.type] || { color: COLORS.mutedBlue, icon: '📌', label: s.type };
              return (
                <div key={i} className="py-3 border-b border-white/5">
                  <div className="flex items-center gap-2 mb-1">
                    <span>{cfg.icon}</span>
                    <Pill color={cfg.color}>{cfg.label}</Pill>
                    <span className="text-sm text-ice-white font-bold">{stripCite(s.title)}</span>
                  </div>
                  <div className="text-sm text-muted-blue leading-relaxed">{stripCite(s.description)}</div>
                  {s.affected_assets?.length > 0 && (
                    <div className="text-xs text-muted-blue mt-1">Assets: {s.affected_assets.join(', ')}</div>
                  )}
                </div>
              );
            })}
          </Section>
        </GlassCard>
      )}

      {/* Second-Order Effects */}
      {intelligence.second_order_effects?.length > 0 && (
        <GlassCard>
          <Section title="Second-Order Effekte" subtitle="Was der Markt noch nicht einpreist">
            {intelligence.second_order_effects.map((e, i) => (
              <div key={i} className="py-3 border-b border-white/5">
                <div className="text-sm text-ice-white font-bold mb-1">{stripCite(e.effect)}</div>
                <div className="text-xs text-muted-blue">
                  <strong className="text-ice-white">Mechanismus:</strong> {stripCite(e.mechanism)}
                </div>
                {e.affected_assets?.length > 0 && (
                  <div className="text-xs text-muted-blue mt-1">
                    Assets: {e.affected_assets.join(', ')}{e.timeframe ? ` · Zeitrahmen: ${e.timeframe}` : ''}
                  </div>
                )}
              </div>
            ))}
            <ExplainBox>
              Second-Order Effekte sind Folgewirkungen die nicht offensichtlich sind.
              Beispiel: Hot CPI → Fed kann nicht senken → Mortgage Rates steigen → Housing Slowdown → Bau-Aktien fallen.
              Der Markt preist oft nur den ersten Schritt ein, nicht die Kette.
            </ExplainBox>
          </Section>
        </GlassCard>
      )}

      {/* Fehler-Info wenn Intelligence nur Fallback lieferte */}
      {intelligence._error && (
        <GlassCard>
          <div className="text-xs text-muted-blue">
            <strong style={{ color: COLORS.signalOrange }}>Intelligence Layer Fehler:</strong> {intelligence._error}
          </div>
        </GlassCard>
      )}
      {intelligence._parse_error && (
        <GlassCard>
          <div className="text-xs text-muted-blue">
            <strong style={{ color: COLORS.signalOrange }}>JSON Parse Fehler:</strong> {intelligence._parse_error}
            <div className="mt-1 font-mono text-caption" style={{ maxHeight: '100px', overflow: 'auto' }}>
              {intelligence._raw_response?.substring(0, 500)}
            </div>
          </div>
        </GlassCard>
      )}

      {/* Meta-Info */}
      <div className="text-caption text-center text-muted-blue">
        Intelligence getriggert durch: {triggerReasons.join(', ')} · {d.date || ''}
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════
// TAB 3: THREATS — Portfolio-Bedrohungen + Regret-Matrix
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

            {/* Ketteneffekte (richtungsabhängig basierend auf aktuellem Z-Score der Threat) */}
            {(() => {
              const threatZ = t.z_score || (t.pair && d.divergences?.pairs?.find(pp => pp.pair === t.pair)?.z_score) || 0;
              const chains = getPairChains(t.pair, threatZ);
              return chains.length > 0 ? (
                <div className="mt-3">
                  <div className="text-xs text-muted-blue uppercase tracking-wider font-bold mb-1">Ketteneffekte</div>
                  {chains.map((chain, j) => (
                    <div key={j} className="text-xs text-muted-blue py-0.5">→ {chain}</div>
                  ))}
                </div>
              ) : null;
            })()}
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

      {/* Hinweis auf Intel Tab */}
      {d.intelligence && (
        <GlassCard>
          <div className="text-center py-4">
            <p className="text-xs text-muted-blue">
              Vollständige Intelligence-Analyse (Zeitlücken, System-Linsen, Second-Order Effects) im <strong className="text-ice-white">§ Intel</strong> Tab.
            </p>
          </div>
        </GlassCard>
      )}
      {!d.intelligence && (
        <GlassCard>
          <div className="text-center py-4">
            <p className="text-xs text-muted-blue">
              Kein Intelligence-Trigger heute. Quantitative Signale (Alignment, Markt-Reaktionen) werden hier angezeigt wenn vorhanden.
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
  const reactions = d.market_reactions?.reactions || [];

  // Merge surprise-Daten in gestrige Events (surprises sitzen im separaten Array)
  const surpriseList = surprises.yesterday_surprises || [];
  const yesterdayEnriched = (cal.yesterday || []).map(ev => {
    const surprise = surpriseList.find(s =>
      s.event && ev.event && s.event.toLowerCase().includes(ev.event.toLowerCase().substring(0, 15))
    );
    const reaction = reactions.find(r =>
      r.event && ev.event && r.event.toLowerCase().includes(ev.event.toLowerCase().substring(0, 15))
    );
    return {
      ...ev,
      surprise_direction: ev.surprise_direction || surprise?.direction,
      surprise_pct: ev.surprise_pct ?? surprise?.surprise_pct,
      reaction: ev.reaction || reaction?.reaction,
    };
  });

  function EventList({ events, showResult = false, label }) {
    if (!events?.length) return <p className="text-xs text-muted-blue py-2">Keine Events.</p>;

    return events.slice(0, 15).map((ev, i) => {
      const surpriseColor = CC_SURPRISE_COLORS[ev.surprise_direction] || COLORS.mutedBlue;
      const reactionColor = CC_REACTION_COLORS[ev.reaction] || COLORS.mutedBlue;
      const exp = getEventExplainer(ev.event);
      const surpriseExpl = getSurpriseExplanation(ev.event, ev.surprise_direction);

      return (
        <div key={i} className="py-3 border-b border-white/5">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-caption text-muted-blue mr-2">{fmtTime(ev.time)}</span>
              <span className="text-sm text-ice-white">{ev.event}</span>
              <span className="text-caption text-muted-blue ml-1">{ev.country}</span>
            </div>
            <ImpactBar score={ev.impact_score} />
          </div>

          {/* Was misst dieser Indikator? */}
          {exp?.what && (
            <div className="text-xs text-muted-blue mt-1">{exp.what}</div>
          )}

          {/* Ergebnis mit Erklärung */}
          {showResult && ev.actual != null && (
            <div className="mt-1 text-xs">
              <span className="text-muted-blue">Konsens: {ev.consensus}</span>
              <span className="text-ice-white mx-2">Ergebnis: {ev.actual}</span>
              <span style={{ color: surpriseColor }}>{ev.surprise_direction}</span>
              {ev.surprise_pct != null && (
                <span className="text-muted-blue ml-1">({(ev.surprise_pct * 100).toFixed(1)}%)</span>
              )}
              {ev.reaction && <span className="ml-2" style={{ color: reactionColor }}>→ {ev.reaction}</span>}
              {/* Was bedeutet dieses Ergebnis? */}
              {surpriseExpl && (
                <div className="mt-1" style={{ color: surpriseColor }}>→ {surpriseExpl}</div>
              )}
            </div>
          )}

          {/* Heute/Zukunft: Konsens + was erwartet wird */}
          {!showResult && ev.consensus != null && (
            <div className="mt-1 text-xs text-muted-blue">
              Konsens: {ev.consensus}
              {exp?.portfolio && <span className="ml-1">· Portfolio-Relevanz: {exp.portfolio}</span>}
            </div>
          )}
          {!showResult && !ev.consensus && exp?.portfolio && (
            <div className="mt-1 text-xs text-muted-blue">Portfolio-Relevanz: {exp.portfolio}</div>
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
          <EventList events={yesterdayEnriched} showResult={true} />
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

  // Cu/Au und VIX sind im pairs-Array, nicht als separate Keys
  const cuAuEntry = (diverg.pairs || []).find(p => p.pair === 'COPPER/GLD') || {};
  const vixEntry = (diverg.pairs || []).find(p => p.pair === 'VIX_PROXY') || {};

  // Cu/Au Daten extrahieren
  const cuAu = {
    z_score: cuAuEntry.z_score ?? cuAuEntry.cu_au_z ?? null,
    signal: cuAuEntry.signal || 'UNAVAILABLE',
    interpretation: cuAuEntry.interpretation || null,
  };

  // VIX Daten extrahieren
  const vix = {
    z_score: vixEntry.vix_z ?? null,
    signal: vixEntry.signal || 'UNAVAILABLE',
    confirms: vixEntry.vix_z_signal === 'CONFIRMATION' || diverg.vix_confirms || false,
    corr_watch: vixEntry.corr_signal === 'WATCH' || diverg.vix_corr_watch || false,
    corr_val: vixEntry.correlation_21d ?? null,
    interpretation: vixEntry.interpretation || null,
  };

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
          {(diverg.pairs || []).filter(p => !['COPPER/GLD', 'VIX_PROXY'].includes(p.pair)).map((p, i) => {
            const ctx = PAIR_CONTEXT[p.pair] || {};
            const sigColor = CC_DIVERGENCE_SIGNAL_COLORS[p.signal] || COLORS.mutedBlue;
            const isExtreme = p.signal === 'EXTREME' || p.signal === 'EXTREME_UNCONFIRMED';
            const isElevatedOrAbove = isExtreme || p.signal === 'ELEVATED';
            const explanation = getPairExplanation(p.pair, p.signal, p.z_score);
            const directionText = getPairDirectionText(p.pair, p.z_score);

            return (
              <div key={i} className="mb-4 pb-3 border-b border-white/5">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-sm text-ice-white font-bold">{p.pair}</span>
                    <span className="text-caption text-muted-blue ml-2">{ctx.name || p.name || ''}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-sm" style={{ color: sigColor }}>Z={fmtZ(p.z_score)}</span>
                    {' '}<Pill color={sigColor}>{p.signal}</Pill>
                  </div>
                </div>

                {/* Was misst es + Trigger-Schwelle — IMMER */}
                {ctx.what && (
                  <div className="text-xs text-muted-blue mt-1">
                    {ctx.what} Bestätigter Trigger: Z{ctx.trigger_threshold}.
                  </div>
                )}

                {/* Was bedeutet der aktuelle Z-Wert richtungsmäßig — IMMER */}
                {directionText && (
                  <div className="text-xs mt-1" style={{ color: sigColor }}>
                    <strong>Aktuell (Z={fmtZ(p.z_score)}):</strong> {directionText}
                  </div>
                )}

                {/* Stufenspezifische Erklärung (richtungsabhängig) — IMMER */}
                {explanation && (
                  <div className="text-xs mt-1" style={{ color: p.signal === 'NORMAL' ? COLORS.mutedBlue : sigColor }}>
                    {explanation}
                  </div>
                )}

                {/* Backtest-Ergebnis NUR bei bestätigtem EXTREME (nicht UNCONFIRMED) */}
                {p.signal === 'EXTREME' && ctx.backtest && (
                  <div className="text-xs mt-1 font-bold" style={{ color: COLORS.signalOrange }}>
                    Historisch: {ctx.backtest}
                    {ctx.lead_days && ` Lead-Zeit: ${ctx.lead_days} Tage.`}
                  </div>
                )}

                {/* Betroffene Assets bei ELEVATED+ */}
                {isElevatedOrAbove && ctx.affected && (
                  <div className="text-xs text-muted-blue mt-1">
                    <strong className="text-ice-white">Betroffene Assets:</strong> {ctx.affected}
                  </div>
                )}

                {/* Interpretation vom Agent */}
                {p.interpretation && <div className="text-xs text-muted-blue mt-1 italic">{p.interpretation}</div>}

                {/* Ketteneffekte (richtungsabhängig) — EXTREME: volle Ketten, ELEVATED: vereinfachte */}
                {isExtreme && (() => {
                  const chains = getPairChains(p.pair, p.z_score);
                  return chains.length > 0 ? (
                    <div className="mt-2 pl-2 border-l-2" style={{ borderLeftColor: `${sigColor}50` }}>
                      <div className="text-caption text-muted-blue uppercase tracking-wider mb-1">Ketteneffekte:</div>
                      {chains.map((c, j) => (
                        <div key={j} className="text-xs text-muted-blue py-0.5">→ {c}</div>
                      ))}
                    </div>
                  ) : null;
                })()}
                {!isExtreme && isElevatedOrAbove && (() => {
                  const chains = getPairChainsElevated(p.pair, p.z_score);
                  return chains.length > 0 ? (
                    <div className="mt-2 pl-2 border-l-2" style={{ borderLeftColor: `${sigColor}50` }}>
                      <div className="text-caption text-muted-blue uppercase tracking-wider mb-1">Mögliche Ketteneffekte:</div>
                      {chains.map((c, j) => (
                        <div key={j} className="text-xs text-muted-blue py-0.5">→ {c}</div>
                      ))}
                    </div>
                  ) : null;
                })()}

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

      {/* Cu/Au + VIX — eigene Indikatoren (nicht Teil der 5 Ratio-Paare) */}
      <GlassCard>
        <Section title="Zusätzliche Indikatoren" subtitle="Kupfer/Gold Ratio + VIX Volatilität">
          {/* Cu/Au */}
          <div className="mb-4 pb-3 border-b border-white/5">
            <div className="flex justify-between text-sm">
              <div>
                <span className="text-ice-white font-bold">Kupfer/Gold Ratio</span>
                <span className="text-caption text-muted-blue ml-2">Wachstum vs. Angst</span>
              </div>
              <div className="text-right">
                {cuAu.z_score != null && <span className="font-mono text-sm" style={{ color: CC_CU_AU_COLORS[cuAu.signal] || COLORS.mutedBlue }}>Z={fmtZ(cuAu.z_score)}</span>}
                {' '}<Pill color={CC_CU_AU_COLORS[cuAu.signal] || COLORS.mutedBlue}>{cuAu.signal || '—'}</Pill>
              </div>
            </div>

            <div className="text-xs text-muted-blue mt-1">
              Kupfer = industrielle Nachfrage (Wachstum). Gold = Angst (Sicherheit). Das Verhältnis zeigt ob der Markt eher Wachstum oder Angst einpreist.
            </div>

            {cuAu.z_score != null && (
              <div className="text-xs mt-1" style={{ color: CC_CU_AU_COLORS[cuAu.signal] || COLORS.mutedBlue }}>
                <strong>Aktuell (Z={fmtZ(cuAu.z_score)}):</strong>{' '}
                {cuAu.signal === 'BEARISH'
                  ? 'Kupfer fällt relativ zu Gold → Markt preist Rezession ein. Historisch 6-12 Monate Leading für wirtschaftliche Abschwächung. Zyklische Assets (DBC, XLI, XLE) unter Druck.'
                  : cuAu.signal === 'BULLISH'
                  ? 'Kupfer steigt relativ zu Gold → Markt preist Reflation/Wachstum ein. Industrielle Nachfrage stark. Positiv für zyklische Assets.'
                  : 'Kupfer und Gold im Gleichgewicht. Weder Wachstumseuphorie noch Rezessionsangst dominant.'}
              </div>
            )}

            {cuAu.signal === 'BEARISH' && (
              <div className="mt-2 pl-2 border-l-2" style={{ borderLeftColor: `${COLORS.signalRed}50` }}>
                <div className="text-caption text-muted-blue uppercase tracking-wider mb-1">Ketteneffekte:</div>
                <div className="text-xs text-muted-blue py-0.5">→ Kupfer fällt → industrielle Nachfrage sinkt → Wachstumsverlangsamung voraus</div>
                <div className="text-xs text-muted-blue py-0.5">→ Gold steigt → Flucht in Sicherheit → bestätigt DBC/TLT wenn negativ</div>
                <div className="text-xs text-muted-blue py-0.5">→ Bei gleichzeitig XLF/SPY negativ → Rezessionssignal doppelt bestätigt</div>
              </div>
            )}
            {cuAu.signal === 'BULLISH' && (
              <div className="mt-2 pl-2 border-l-2" style={{ borderLeftColor: `${COLORS.signalGreen}50` }}>
                <div className="text-caption text-muted-blue uppercase tracking-wider mb-1">Ketteneffekte:</div>
                <div className="text-xs text-muted-blue py-0.5">→ Kupfer steigt → industrielle Nachfrage stark → Wachstum intakt</div>
                <div className="text-xs text-muted-blue py-0.5">→ Bestätigt DBC/SPY wenn positiv → Commodities-Rally breit abgestützt</div>
                <div className="text-xs text-muted-blue py-0.5">→ Zyklische Sektoren (XLI, XLE) profitieren</div>
              </div>
            )}

            <ExplainBox>
              Schwellenwerte: Z{'<'}-1.5 = BEARISH (Rezession voraus, 6-12 Monate Leading). Z{'>'}+1.5 = BULLISH (Reflation).
              Zwischen -1.5 und +1.5 = NEUTRAL. Kupfer/Gold ist einer der zuverlässigsten Leading-Indikatoren für den Konjunkturzyklus.
            </ExplainBox>
          </div>

          {/* VIX */}
          <div>
            <div className="flex justify-between text-sm">
              <div>
                <span className="text-ice-white font-bold">VIX Analyse</span>
                <span className="text-caption text-muted-blue ml-2">Volatilität + Bestätigung</span>
              </div>
              <div className="text-right">
                {vix.z_score != null && <span className="font-mono text-sm" style={{ color: CC_VIX_COLORS[vix.signal] || COLORS.mutedBlue }}>Z={fmtZ(vix.z_score)}</span>}
                {' '}<Pill color={CC_VIX_COLORS[vix.signal] || COLORS.mutedBlue}>{vix.signal || '—'}</Pill>
              </div>
            </div>

            <div className="text-xs text-muted-blue mt-1">
              VIX misst die erwartete Volatilität im S&P 500. Hohe VIX = Markt erwartet große Schwankungen. Niedrige VIX = Markt ist ruhig (oder complacent).
            </div>

            {(vix.z_score != null || vix.corr_val != null) && (
              <div className="text-xs mt-1" style={{ color: CC_VIX_COLORS[vix.signal] || COLORS.mutedBlue }}>
                <strong>Aktuell{vix.z_score != null ? ` (Z=${fmtZ(vix.z_score)})` : ''}{vix.corr_val != null ? ` · Korrelation VIX/SPY: ${vix.corr_val.toFixed(2)}` : ''}:</strong>{' '}
                {vix.confirms
                  ? 'VIX extrem hoch (Z>+2.0) — bestätigt Stress-Signale aus den Divergenz-Paaren. Wenn gleichzeitig DBC/SPY oder XLF/SPY auf EXTREME → Signal ist sehr ernst zu nehmen.'
                  : vix.corr_watch
                  ? 'VIX/SPY Korrelation anomal (>−0.2) — Stealth Hedging: jemand Großes kauft Absicherung während der Markt noch steigt. Oft ein Vorläufer für plötzliche Korrekturen.'
                  : 'VIX im Normalbereich. Keine Bestätigung von Stress-Signalen durch Volatilität.'}
              </div>
            )}

            {vix.confirms && (
              <div className="mt-2 pl-2 border-l-2" style={{ borderLeftColor: `${COLORS.signalRed}50` }}>
                <div className="text-caption text-muted-blue uppercase tracking-wider mb-1">Ketteneffekte:</div>
                <div className="text-xs text-muted-blue py-0.5">→ Hohe VIX → Options-Absicherung wird teurer → Hedging-Kosten steigen für alle Marktteilnehmer</div>
                <div className="text-xs text-muted-blue py-0.5">→ Bestätigt EXTREME-Signale aus anderen Paaren → Gesamtbild wird bearisher</div>
                <div className="text-xs text-muted-blue py-0.5">→ Bei VIX{'>'}30 historisch erhöhtes Risiko für Cascade-Selling (Margin Calls, Forced Liquidation)</div>
              </div>
            )}
            {vix.corr_watch && (
              <div className="mt-2 pl-2 border-l-2" style={{ borderLeftColor: `${COLORS.signalOrange}50` }}>
                <div className="text-caption text-muted-blue uppercase tracking-wider mb-1">Ketteneffekte:</div>
                <div className="text-xs text-muted-blue py-0.5">→ Stealth Hedging → institutionelle Investoren sichern sich ab → sie erwarten einen Move</div>
                <div className="text-xs text-muted-blue py-0.5">→ SPY kann kurzfristig weiter steigen (Hedges erlauben Carry), aber der nächste Rücksetzer wird schärfer</div>
              </div>
            )}

            <ExplainBox>
              VIX dient als Bestätigungssignal — es löst keinen eigenständigen Trigger aus.
              Z{'>'}+2.0 = CONFIRMATION (bestätigt andere Stress-Signale).
              VIX/SPY Korrelation {'>'}−0.2 = WATCH (Stealth Hedging — normalerweise laufen VIX und SPY gegenläufig).
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
