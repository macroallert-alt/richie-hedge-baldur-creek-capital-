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
    what: 'Consumer Price Index — breitestes US-Inflationsmaß auf Verbraucherebene. Shelter (Miete, Owners Equivalent Rent) macht ~36% des Kerns aus und reagiert mit 12-18 Monaten Verzögerung auf Immobilienpreise. Headline CPI enthält volatile Nahrung und Energie; Supercore (Services ex Shelter) ist der von der Fed bevorzugte Subindex für die Lohn-Preis-Spirale.',
    hot: 'CPI über Konsens signalisiert persistente Inflation. Kette: höhere Preise → Fed muss Terminal Rate anheben oder länger halten → Front-End Yields steigen → Finanzierungskosten für HY-Emittenten steigen → HYG (28.8%) unter Spread-Druck, besonders wenn Supercore mitanzieht. Gleichzeitig: reale Assets profitieren → DBC (20.3%) wird als Inflationshedge nachgefragt → GLD (16.9%) profitiert als Store of Value. Historisch: Hot CPI Prints mit >0.4% MoM Core führten in 73% der Fälle zu einer Neubewertung der Fed Funds Futures um mindestens 15bp innerhalb einer Woche.',
    cold: 'CPI unter Konsens öffnet den Pfad für Zinssenkungen. Kette: fallende Inflation → Fed Dot Plot verschiebt sich dovish → Zinserwartungen sinken → Duration-Assets rallyen, HYG (28.8%) profitiert doppelt (niedrigere risikofreie Rate + engere Spreads wegen verbesserter Wirtschaftsaussicht) → DBC (20.3%) verliert als Inflationshedge an Nachfrage → GLD (16.9%) kurzfristig unter Druck da Opportunitätskosten vs. Zinsen sinken, profitiert aber mittelfristig wenn der Markt Zinssenkungen als Wachstumsschwäche interpretiert. XLU (18.0%) profitiert von niedrigeren Diskontierungsraten.',
    portfolio: 'HYG (28.8%): Spread-Sensitivität hoch — heißer Print weitet HY-Spreads um 5-15bp. DBC (20.3%): direkte Inflationskorrelation, profitiert bei hot. GLD (16.9%): profitiert bei hot als realer Wertspeicher, bei cold gemischt. XLU (18.0%): Duration-Proxy, leidet bei hot (höhere Zinsen drücken Bewertung), profitiert bei cold. XLP (16.1%): relativ stabil, Pricing Power bei moderater Inflation. Querverweis: wenn CPI hot UND ISM Manufacturing schwach → Stagflationsrisiko → schlimmstes Szenario für HYG.',
  },
  'Core CPI': {
    what: 'CPI ohne volatile Nahrung und Energie — der entscheidende Indikator für die Fed-Reaktionsfunktion. Shelter-Komponente dominiert und ist backward-looking (Mietverträge erneuern sich langsam). Die Fed beobachtet besonders die 3-Monats-Annualisierung des Supercore (Services ex Shelter) für den zugrundeliegenden Inflationstrend.',
    hot: 'Core CPI über Konsens ist das schärfste hawkishe Signal. Kette: persistente Kerninflation → Fed kann nicht senken, muss möglicherweise Guidance verschärfen → 2-Jahres-Yield steigt → gesamte Zinskurve repriced → HYG (28.8%) unter Druck weil Refinanzierungskosten steigen und Forward Default Rates hochgerechnet werden → XLU (18.0%) leidet als Bond-Proxy (Dividenden-Discount-Modell wird mit höherer Rate abgezinst). Wenn 3-Monats-Annualisierung über 4.5%: historisch immer mindestens ein zusätzlicher Hike oder verlängerte Pause eingepreist.',
    cold: 'Core CPI unter Konsens ist der stärkste Einzeldatenpunkt für Zinssenkungen. Kette: fallende Kerninflation → Markt preist nächsten Zinssenkungstermin vor → Zinskurve steilt → HYG (28.8%) rallyt aggressiv (niedrigere Basis + Spread-Kompression) → XLU (18.0%) und XLP (16.1%) profitieren als Yield-Plays bei fallenden Zinsen → GLD (16.9%) gemischt: niedrigere Realzinsen sind positiv, aber Risiko-Appetit steigt (Gold als Safe Haven weniger gefragt). Historisch: ein Core CPI Miss von ≥0.1% unter Konsens führte in 8 von 10 Fällen zu einer SPY-Rallye am selben Tag.',
    portfolio: 'Wichtiger als Headline CPI für unsere Positionierung. HYG (28.8%) ist der größte Profiteur eines cold Prints — Spread-Kompression + Basis-Rallye kumulieren. Bei hot Core CPI: DBC (20.3%) als natürlicher Hedge, GLD (16.9%) als Realzins-Play. Querverweis: Core CPI + PCE Core Trend gemeinsam betrachten — divergieren sie, folgt die Fed dem PCE.',
  },
  'FOMC': {
    what: 'Federal Open Market Committee Zinsentscheid — die Fed setzt die Federal Funds Rate und steuert über die Pressekonferenz und den Dot Plot die Forward Guidance. Nicht nur die Entscheidung selbst bewegt Märkte, sondern vor allem die Tonalität in der Pressekonferenz, Änderungen im Statement-Wortlaut, und die Verschiebung der Dot-Plot-Medianen. SEP (Summary of Economic Projections) erscheint quartalsmäßig und enthält die individuellen Prognosen aller Teilnehmer.',
    hot: 'Hawkisher als erwartet (Hike, höhere Dots, verschärftes Statement). Kette: höhere Terminal Rate → gesamte Zinskurve steigt → Dollar stärkt sich → DBC (20.3%) unter Dollar-Druck (inverse Korrelation USD/Commodities historisch -0.6) → HYG (28.8%) unter Doppelbelastung (höhere risikofreie Rate + weitende Spreads wegen Wachstumssorgen) → GLD (16.9%) kurzfristig negativ wegen Dollar-Stärke, aber mittelfristig positiv wenn Markt Policy Error einpreist → XLU (18.0%) verliert als Yield-Konkurrent zu höheren Treasury Yields.',
    cold: 'Dovisher als erwartet (Cut, niedrigere Dots, gelockerte Sprache). Kette: niedrigere Terminal Rate → Zinskurve fällt und steilt → Dollar schwächt sich → DBC (20.3%) profitiert von schwächerem Dollar + Stimulus-Erwartung → HYG (28.8%) rallyt stark (Zinssenkungszyklen komprimieren HY-Spreads historisch um 80-150bp im ersten Jahr) → GLD (16.9%) profitiert von Dollar-Schwäche + niedrigeren Realzinsen → XLU (18.0%) profitiert als Yield-Play → XLP (16.1%) stabil, relative Outperformance wenn Markt Cut als Schwächesignal interpretiert.',
    portfolio: 'Betrifft alle 5 Positionen simultan. HYG (28.8%) ist der größte Hebel — Fed-Zykluswende historisch der stärkste Einzeltreiber für HY-Spreads. Kritisch: Dot Plot Verschiebung von >50bp über 2 Jahre bewegt HYG um 2-4% am Entscheidungstag. DBC (20.3%) reagiert primär über den Dollar-Kanal. Querverweis: FOMC + anschließende Pressekonferenz-Tonalität beobachten — bei Divergenz zwischen Statement und Chair-Aussagen dominiert die Pressekonferenz.',
  },
  'Non-Farm Payrolls': {
    what: 'Non-Farm Payrolls — Anzahl neu geschaffener Stellen außerhalb der Landwirtschaft, publiziert am ersten Freitag des Monats durch das BLS. Der meistbeachtete einzelne Datenpunkt für den US-Arbeitsmarkt. Neben der Headline-Zahl entscheidend: Revisionen der Vormonate (oft signifikanter als der aktuelle Print), Average Hourly Earnings (Lohninflation), und die Unemployment Rate aus dem separaten Household Survey.',
    hot: 'Deutlich über Konsens (>+75K Abweichung). Kette: starker Arbeitsmarkt → Fed sieht keine Notwendigkeit zu senken → Lohndruck bleibt → Inflation-Pipeline intakt → Zinssenkungen werden weiter nach hinten geschoben → HYG (28.8%) gemischt (besser Kreditqualität aber höhere Zinsen länger) → DBC (20.3%) neutral bis positiv (starke Nachfrage stützt Commodities) → XLU (18.0%) unter Druck weil Zinsen hoch bleiben → GLD (16.9%) kurzfristig negativ (höhere Realzinsen). Historisch: NFP >+100K über Konsens drückt den Markt für Zinssenkungen um durchschnittlich 6 Wochen nach hinten.',
    cold: 'Deutlich unter Konsens (>-75K Abweichung). Kette: schwächerer Arbeitsmarkt → Rezessionssorgen steigen → Fed wird Zinssenkungen vorziehen müssen → HYG (28.8%) unter Spread-Druck weil Default-Risiko steigt (Beschäftigung ist der ultimative Kredittreiber) → ABER niedrigere Zinsen kompensieren teilweise → Netto-Effekt abhängig von Severity: moderater Miss = HYG positiv, starker Miss = HYG negativ. DBC (20.3%) unter Druck wegen Nachfrage-Ausblick. XLU (18.0%) und XLP (16.1%) profitieren als Defensives. GLD (16.9%) steigt als Safe Haven.',
    portfolio: 'HYG (28.8%) ist die komplexeste Position bei NFP — Doppelsensitivität (Zins + Kredit). Bei moderatem Miss: net positiv. Bei starkem Miss (>-150K): net negativ weil Default-Ängste Spread-Kompression überwiegen. DBC (20.3%) korreliert mit Wachstumsausblick. Querverweis: NFP zusammen mit Jobless Claims Trend und ISM Employment Sub-Index lesen — einzelner Print kann Noise sein, Trend ist entscheidend.',
  },
  'NFP': {
    what: 'Non-Farm Payrolls (Kurzform) — identisch mit Non-Farm Payrolls. Monatlicher Beschäftigungsbericht des BLS, erscheint am ersten Freitag. Headline-Zahl, Revisionen, Average Hourly Earnings und Unemployment Rate als Gesamtpaket betrachten.',
    hot: 'Starker Beschäftigungsaufbau über Konsens. Kette: robuster Arbeitsmarkt → Lohnwachstum bleibt erhöht → Dienstleistungsinflation persistent → Fed hält restriktive Haltung → Zinssenkungserwartungen werden zurückgenommen → HYG (28.8%) kurzfristig unter Zinsdruck, aber fundamental gestützt durch bessere Kreditqualität. DBC (20.3%) profitiert von intakter Nachfrage. XLU (18.0%) leidet unter Higher-for-Longer.',
    cold: 'Schwacher Beschäftigungsaufbau unter Konsens. Kette: Arbeitsmarkt kühlt ab → Verbraucherausgaben unter Druck → Unternehmensgewinne in Gefahr → HYG (28.8%) Spreads weiten bei starkem Miss, weil der Arbeitsmarkt der ultimative Treiber für HY-Defaults ist (Sahm Rule beobachten: Unemployment Rate 3-Monats-Durchschnitt steigt >0.5% über 12-Monats-Tief = Rezession). GLD (16.9%) und XLP (16.1%) als defensive Positionen gestärkt.',
    portfolio: 'Siehe Non-Farm Payrolls für vollständige Analyse. Entscheidend für HYG (28.8%): Headline + Revisionen + Average Hourly Earnings als Gesamtbild. Ein einzelner schwacher Print bei intaktem Trend ist weniger bedrohlich als zwei konsekutive Misses mit Abwärtsrevisionen.',
  },
  'ECB': {
    what: 'Europäische Zentralbank Zinsentscheid — bestimmt den Hauptrefinanzierungssatz und die Deposit Facility Rate für die Eurozone. Transmissionskanal zu unseren Positionen primär über EUR/USD (beeinflusst Dollar-Index und damit Commodities), sekundär über europäische Wachstumserwartungen (relevant für VGK-Exposure in Cycles/Rotation). Lagarde-Pressekonferenz oft marktbewegender als die Entscheidung selbst.',
    hot: 'ECB hawkisher als erwartet (Hike oder restriktive Guidance). Kette: EUR stärkt sich → Dollar-Index fällt → DBC (20.3%) profitiert von Dollar-Schwäche → aber gleichzeitig: straffere europäische Finanzierungsbedingungen → europäische HY-Spreads weiten → Spillover auf US-HY → HYG (28.8%) leicht unter Druck. GLD (16.9%) profitiert von schwächerem Dollar. Querverweis: ECB + Fed Divergenz beobachten — wachsende Zinsdifferenz bewegt Kapitalflüsse und damit EUR/USD.',
    cold: 'ECB dovisher als erwartet (Cut oder gelockerte Guidance). Kette: EUR schwächt sich → Dollar-Index steigt → DBC (20.3%) unter Dollar-Stärke-Druck → GLD (16.9%) kurzfristig negativ wegen Dollar. Aber: lockerere EZB = bessere europäische Wachstumsaussichten → VGK-relevanter Tailwind für unser Cycles-System. HYG (28.8%) wenig direkt betroffen, es sei denn globaler Risk-Appetite verschiebt sich.',
    portfolio: 'Primärkanal für uns: Dollar-Stärke/Schwäche beeinflusst DBC (20.3%) und GLD (16.9%). Sekundärkanal: europäische Wachstumserwartungen beeinflussen unser Cycles-System und VGK-Signal. Querverweis: ECB-Entscheidung immer im Kontext der Fed-Divergenz bewerten — wenn beide hawkish, ist der Dollar-Effekt neutralisiert, aber globale Liquidität sinkt.',
  },
  // ═══════════════════════════════════════════════════════════
  // TIER B — Impact 7 (Wichtige Bestätigungsindikatoren)
  // ═══════════════════════════════════════════════════════════
  'PPI': {
    what: 'Producer Price Index — Inflation auf Produzentenebene, erscheint einen Tag vor oder nach CPI. Misst Input-Kosten für Unternehmen und gilt als 1-2 Monate vorauslaufend für CPI-Komponenten (besonders PPI Final Demand → PCE-Komponenten-Mapping). PPI ex Food & Energy und PPI ex Food, Energy & Trade sind die von der Fed genutzten Subindizes.',
    hot: 'PPI über Konsens signalisiert Margendruck oder kommende Verbraucherinflation. Kette: steigende Produzentenkosten → Unternehmen geben Kosten weiter oder absorbieren sie (Margenkompression) → Szenario A (Weitergabe): CPI folgt in 1-2 Monaten → Fed bleibt restriktiv → HYG (28.8%) unter Druck. Szenario B (Absorption): Unternehmensmargen sinken → EPS-Revisionen nach unten → HYG-Emittenten mit schwacher Pricing Power besonders gefährdet. DBC (20.3%) bestätigt: steigende Input-Preise korrelieren mit Commodity-Stärke.',
    cold: 'PPI unter Konsens signalisiert nachlassenden Inflationsdruck in der Pipeline. Kette: fallende Produzentenpreise → CPI-Druck lässt nach → Fed-Pfad zu Zinssenkungen wahrscheinlicher → HYG (28.8%) profitiert → gleichzeitig: niedrigere Input-Kosten verbessern Margen → positiv für Kreditqualität der HYG-Emittenten → doppelter Tailwind. DBC (20.3%) unter Druck da Commodity-Preise Teil des PPI sind.',
    portfolio: 'PPI als CPI-Preview nutzen. HYG (28.8%): indirekter aber zuverlässiger Treiber über Zinserwartungs-Kanal + Margeneffekt. DBC (20.3%): direkte Korrelation — Energie und Rohstoffe sind PPI-Hauptkomponenten. Querverweis: PPI Final Demand Services beobachten — dieser Subindex korreliert am stärksten mit PCE Core.',
  },
  'PCE': {
    what: 'Personal Consumption Expenditures Price Index — das OFFIZIELLE Inflationsmaß der Fed (nicht CPI). Breiter als CPI, berücksichtigt Substitutionseffekte und inkludiert employer-paid Healthcare. Core PCE (ex Food & Energy) ist der Zielindikator der Fed mit 2.0% Target. Erscheint mit ~1 Monat Verzögerung, aber Teile sind aus PPI/CPI ableitbar (Cleveland Fed Nowcast).',
    hot: 'Core PCE über 2.0% annualisiert (oder über Konsens). Kette: Fed-Zielmetrik verfehlt → FOMC muss restriktiv bleiben → Dot Plot Median bleibt hoch → gesamte Diskontierungsstruktur verschiebt sich → HYG (28.8%) unter Druck (HY-Emittenten refinanzieren zu höheren Kosten, Default Rates steigen mit Verzögerung 12-18 Monate) → XLU (18.0%) als Duration-Asset leidet → DBC (20.3%) profitiert wenn Inflation durch Commodity-Kanal getrieben → GLD (16.9%) profitiert da negative Realzinsen wahrscheinlicher.',
    cold: 'Core PCE unter 2.0% annualisiert (oder unter Konsens). Kette: Fed nähert sich dem Ziel → Zinssenkungen rücken näher → Zinskurve steilt → HYG (28.8%) profitiert massiv (historisch die beste HY-Performance in den 6 Monaten VOR dem ersten Cut) → XLU (18.0%) profitiert als Yield-Play → GLD (16.9%) gemischt (niedrigere Realzinsen positiv, aber Risiko-Appetit steigt).',
    portfolio: 'Core PCE ist DER Indikator für die Fed-Reaktionsfunktion und damit der wichtigste Einzeldatenpunkt für HYG (28.8%). Die Fed toleriert temporäre CPI-Spikes, aber nicht persistente Core PCE Abweichungen. Querverweis: Core PCE + Labor Market (NFP, ECI) gemeinsam betrachten — Inflation + Vollbeschäftigung = duales Mandat.',
  },
  'GDP': {
    what: 'Gross Domestic Product — quartalsweise Gesamtwirtschaftsleistung, erscheint in drei Revisionen (Advance, Second, Third). Advance Estimate hat den höchsten Markteinfluss. Subkomponenten (Personal Consumption, Business Investment, Government, Net Exports) oft aussagekräftiger als die Headline. GDPNow (Atlanta Fed) liefert Echtzeit-Nowcasts zwischen den Releases.',
    hot: 'GDP über Konsens signalisiert robuste Wirtschaft. Kette: starkes Wachstum → Unternehmensgewinne steigen → HYG (28.8%) fundamental gestärkt (Default-Raten sinken in Expansionsphasen) → ABER: starkes Wachstum gibt der Fed keinen Grund zu senken → Zinsen bleiben hoch → netto: HYG profitiert wenn Wachstum dominiert, neutral wenn Zinsangst dominiert. DBC (20.3%) profitiert von intakter Industrienachfrage. XLU (18.0%) und XLP (16.1%) underperformen relativ (Rotation in Zykliker).',
    cold: 'GDP unter Konsens signalisiert Wachstumsverlangsamung. Kette: schwächeres Wachstum → Unternehmensgewinne unter Druck → HYG (28.8%) unter Spread-Druck (schwächstes Quintil der HY-Emittenten am verwundbarsten) → Fed muss Wachstumsrisiken berücksichtigen → Zinssenkungen wahrscheinlicher → XLU (18.0%) und XLP (16.1%) profitieren als Defensives. DBC (20.3%) unter Nachfrage-Druck. GLD (16.9%) als Safe Haven gefragt. Historisch: GDP unter 1.0% annualisiert → HY-Spreads weiten im Folgequartal um durchschnittlich 40bp.',
    portfolio: 'HYG (28.8%): GDP-Wachstum ist der wichtigste fundamentale Treiber für HY-Defaults. Unter 1.5% annualisiert beginnen Downgrades zu akkumulieren. DBC (20.3%): Wachstum = Nachfrage = positiv. XLU (18.0%) / XLP (16.1%): defensive Rotation bei Schwäche. Querverweis: GDP + ISM + NFP als Rezessionsdreieck — alle drei schwach = NBER-Rezession historisch in 85% der Fälle.',
  },
  'Retail Sales': {
    what: 'US-Einzelhandelsumsätze — monatlicher Proxy für ~70% des US-BIP (Konsum). Control Group (ex Autos, Gas, Building Materials, Food Services) fließt direkt in die BIP-Berechnung ein. Nominaler Indikator — muss inflationsbereinigt interpretiert werden. Saisonbereinigung kann um Feiertage (Black Friday, Weihnachten) verzerren.',
    hot: 'Retail Sales über Konsens signalisiert robusten Konsum. Kette: starke Verbraucherausgaben → BIP-Wachstum bleibt intakt → Unternehmensgewinne im Consumer-Bereich stabil → HYG (28.8%) profitiert von besserer Kreditqualität im Retail/Consumer-Segment → ABER: starker Konsum hält Inflationsdruck aufrecht → Fed bleibt restriktiv → Zins-Gegenwind für XLU (18.0%). DBC (20.3%) neutral (Konsum treibt Benzin-Nachfrage, aber weniger direkt als Industrie). XLP (16.1%) underperformt relativ (Rotation in Discretionary).',
    cold: 'Retail Sales unter Konsens signalisiert Konsumermüdung. Kette: schwächere Verbraucherausgaben → BIP-Wachstumsbeitrag sinkt → Unternehmensgewinne unter Druck (besonders Retail, Restaurants, Travel) → HYG (28.8%) Segment-spezifisch: Consumer-lastige HY-Emittenten (Retail Chains, Restaurants) unter Druck → Default-Risiko steigt in B/CCC-Segment → Fed bekommt Signal dass Straffung wirkt → Zinssenkungserwartung zieht vor. XLP (16.1%) profitiert als Defensive (Staples vs. Discretionary Rotation). GLD (16.9%) als Absicherung gefragt.',
    portfolio: 'HYG (28.8%): Retail-Schwäche trifft Consumer-HY-Emittenten zuerst — Retail Chapter 11 Filings haben 6-9 Monate Vorlauf nach Retail Sales Einbruch. XLP (16.1%): direkte Defensive-Rotation bei schwachen Retail Sales (Konsumenten wechseln von Discretionary zu Staples). Querverweis: Retail Sales zusammen mit Consumer Confidence und Jobless Claims lesen — drei schwache Prints hintereinander = Konsumrezession.',
  },
  'ISM Manufacturing': {
    what: 'ISM Manufacturing PMI — ältester und meistbeachteter US-Konjunkturindikator (seit 1948). Über 50 = Expansion, unter 50 = Kontraktion. Subindizes (New Orders, Employment, Prices Paid, Supplier Deliveries) geben differenzierteres Bild. New Orders/Inventories Ratio ist ein anerkannter Leading Indicator. Historisch: ISM unter 42.5 korreliert 100% mit NBER-Rezessionen.',
    hot: 'ISM Manufacturing über 50 und steigend. Kette: Industrie expandiert → Rohstoffnachfrage steigt → DBC (20.3%) direkt und stark positiv (ISM-DBC Korrelation historisch >0.7) → Prices Paid Subindex steigt → Inflationspipeline wird befüllt → Fed bleibt wachsam → HYG (28.8%) profitiert von besserem Wachstumsausblick aber Zinsrisiko bleibt → XLU (18.0%) underperformt relativ (Rotation in Zykliker). Wenn New Orders stark UND Inventories niedrig: beschleunigender Aufschwung, DBC-Bullenmarkt.',
    cold: 'ISM Manufacturing unter 50 und fallend. Kette: Industriekontraktion → Rohstoffnachfrage sinkt → DBC (20.3%) direkt und stark unter Druck → gleichzeitig: Kreditqualität im Industriesektor verschlechtert sich → HYG (28.8%) unter Spread-Druck (Industrie und Energie zusammen ~35% des HY-Universums) → XLU (18.0%) und XLP (16.1%) profitieren als Defensive → GLD (16.9%) als Safe Haven steigt. KRITISCH: ISM unter 47 historisch IMMER von Rezession begleitet → dann: HYG-Spreads weiten um 200-400bp, DBC fällt 15-25%. Querverweis: ISM + DBC/SPY Divergenz-Signal → wenn unser DBC/SPY Z-Score bereits >+2.0 und ISM fällt, bestätigt das die Reversion.',
    portfolio: 'DBC (20.3%) ist die direkteste Position für ISM Manufacturing — industrielle Rohstoffnachfrage ist der Transmissionskanal. HYG (28.8%) Sekundäreffekt über Kreditqualität der zyklischen Emittenten. XLU (18.0%) und XLP (16.1%) klassische Defensiv-Rotation bei ISM-Schwäche. Querverweis: ISM Manufacturing + ISM Services zusammen lesen — Manufacturing allein kann kontrahieren ohne Rezession (2015-16), aber wenn Services folgt, wird es ernst.',
  },
  'ISM Services': {
    what: 'ISM Services PMI (ehemals ISM Non-Manufacturing) — misst den Dienstleistungssektor, der ~80% der US-Wirtschaft und ~85% der US-Beschäftigung ausmacht. Damit wichtiger als ISM Manufacturing für die Gesamtwirtschaft. Business Activity, New Orders und Employment Sub-Indizes sind entscheidend. Prices Paid zeigt Dienstleistungsinflation, die besonders sticky ist.',
    hot: 'ISM Services über 50 und steigend. Kette: Dienstleistungssektor expandiert → Arbeitsmarkt bleibt eng (Services = größter Arbeitgeber) → Lohndruck persistent → Dienstleistungsinflation bleibt hoch → Fed kann nicht senken → HYG (28.8%) fundamental gut aber unter Zinsdruck → DBC (20.3%) neutral (Services treiben Rohstoffnachfrage weniger direkt als Manufacturing) → wenn Prices Paid gleichzeitig hoch: Supercore-Inflation persistent → schlecht für XLU (18.0%).',
    cold: 'ISM Services unter 50 = ernste Rezessionsgefahr. Kette: Dienstleistungssektor — das Rückgrat der Wirtschaft — kontrahiert → Beschäftigungsabschwung breit und schnell → Konsumausgaben fallen → BIP-Wachstum kollabiert → HYG (28.8%) unter MASSIVEM Spread-Druck (gesamtes HY-Universum betroffen, nicht nur Zykliker) → Fed muss aggressiv senken → GLD (16.9%) und XLP (16.1%) als Safe Havens stark gefragt. Historisch: ISM Services unter 50 für 2+ Monate = Rezession in 90% der Fälle.',
    portfolio: 'Breiter und gefährlicher als ISM Manufacturing. HYG (28.8%) ist bei ISM Services Kontraktion die verwundbarste Position — die Beschäftigungsbreite des Dienstleistungssektors bedeutet, dass Default-Wellen nicht auf einzelne Sektoren beschränkt bleiben. XLP (16.1%) und XLU (18.0%) als Defensive profitieren. Querverweis: ISM Services unter 50 + Initial Claims über 250K + Consumer Confidence fallend = Rezessionskaskade.',
  },
  'FOMC Minutes': {
    what: 'Protokoll der FOMC-Sitzung von 3 Wochen zuvor — zeigt die interne Debatte, Hawk/Dove-Verteilung, Risiko-Einschätzungen, und diskutierte aber nicht umgesetzte Optionen. Markt sucht nach Nuancen: "several participants" vs. "a few", "risks" vs. "uncertainties", QT-Diskussion. Minutes können die Marktreaktion des Entscheidungstages bestätigen oder umkehren.',
    hot: 'Hawkisherer Ton als die Pressekonferenz vermuten ließ. Kette: mehr Mitglieder für straffere Policy als gedacht → Markt repriced Terminal Rate nach oben → 2-Jahres-Yield steigt → gesamte Rate-Sensitive Exposure unter Druck → HYG (28.8%) Spreads weiten moderat → XLU (18.0%) als Duration-Proxy leidet. Besonders marktbewegend: wenn Minutes eine QT-Beschleunigung oder neue Hikes diskutieren die in der Pressekonferenz nicht erwähnt wurden.',
    cold: 'Dovisherer Ton als die Pressekonferenz. Kette: Debatte zeigt mehr Sorge über Wachstum oder Arbeitsmarkt als kommuniziert → Zinssenkungen näher als gedacht → HYG (28.8%) profitiert → XLU (18.0%) und GLD (16.9%) steigen. Besonders positiv: wenn "several participants" Cuts diskutierten oder Bedenken über Over-Tightening äußerten.',
    portfolio: 'Impact typischerweise niedriger als der FOMC-Entscheid selbst, da 3 Wochen alt. Aber: kann nachträgliche Narrative-Shifts auslösen. HYG (28.8%) und XLU (18.0%) am sensitivsten. Querverweis: Minutes im Kontext der seit der Sitzung veröffentlichten Daten lesen — wenn seitdem schwache Daten kamen, werden dovishe Minutes verstärkt.',
  },
  'BOJ': {
    what: 'Bank of Japan Zinsentscheid — Japan betreibt historisch die lockerste Geldpolitik der Industrieländer (Yield Curve Control, Negative Rates bis 2024). Jede Normalisierung hat überproportionale globale Effekte weil Japan der größte externe Halter von US-Treasuries ist und der Yen die Finanzierungswährung für globale Carry Trades (geschätzt $4-8T). BOJ-Überraschungen gehören zu den wenigen Events die Flash Crashes in allen Assetklassen auslösen können.',
    hot: 'BOJ strafft oder signalisiert Straffung. Kette: Yen steigt abrupt → Carry-Trade Unwind beginnt (Hedge Funds und institutionelle Anleger, die in Yen verschuldet sind, müssen Risk Assets verkaufen) → globaler Risk-Off → HYG (28.8%) unter Verkaufsdruck (HY ist ein klassisches Carry-Trade Ziel) → DBC (20.3%) unter Druck (Dollar-Stärke + Risk-Off) → GLD (16.9%) gemischt (Risk-Off positiv, Dollar-Stärke negativ) → XLU (18.0%) relativ stabil. ACHTUNG: BOJ-Schocks sind Low-Probability/High-Impact — der August 2024 Carry Trade Unwind löste 3% SPY-Drop an einem Tag aus.',
    cold: 'BOJ hält dovish oder lockert weiter. Kette: Yen bleibt schwach → Carry Trade profitabel → Risk-On Umfeld intakt → HYG (28.8%) profitiert von Carry-Trade-getriebener Nachfrage nach Yield → DBC (20.3%) neutral bis positiv. Globale Liquidität bleibt expansiv.',
    portfolio: 'Primärrisiko für HYG (28.8%): ein BOJ-Schock erzeugt schnellen, korrelationssprengenden Drawdown über alle Assetklassen. Portfolio-Korrelation steigt bei Carry-Unwind auf >0.8 → Diversifikation versagt kurzfristig. Querverweis: JPY/USD und VIX zusammen beobachten — Yen-Stärke + VIX-Spike = Carry Unwind in vollem Gang.',
  },
  // ═══════════════════════════════════════════════════════════
  // TIER C — Impact 4 (Ergänzende Indikatoren & Frühsignale)
  // ═══════════════════════════════════════════════════════════
  'Jobless Claims': {
    what: 'Wöchentliche Erstanträge auf Arbeitslosenhilfe (Initial Claims) — der höchstfrequente US-Arbeitsmarktindikator (jeden Donnerstag). Einzelne Wochen sind durch Feiertage, Wetter und Saisonbereinigungsprobleme verzerrt. Der 4-Wochen-Durchschnitt glättet das Rauschen. Historisch: anhaltend über 250K = Frühwarnsignal, über 300K = Rezessionsniveau. Insured Unemployment Rate (Continuing Claims / Covered Employment) ist die genauere Metrik.',
    hot: 'Claims unter Konsens (weniger Entlassungen als erwartet). Kette: Arbeitsmarkt bleibt eng → Lohndruck persistent → Fed hat keinen Grund zu senken → Higher-for-Longer bestätigt → HYG (28.8%) fundamental gut aber Zinsrisiko bleibt. Einzelner Print wenig aussagekräftig — erst Trend über 4+ Wochen relevant.',
    cold: 'Claims über Konsens (mehr Entlassungen als erwartet). Kette: steigende Entlassungen → wenn Trend anhält 4+ Wochen → NFP wird schwächer → Konsumausgaben unter Druck → HYG (28.8%) beobachten: initiale Claims-Steigerung noch kein Problem, aber persistenter Anstieg über 250K → Spread-Ausweitung beginnt. XLP (16.1%) als Defensive. Querverweis: Initial Claims + Continuing Claims zusammen lesen — steigende Initial + steigende Continuing = Menschen finden keine neuen Jobs → ernsthafte Verschlechterung.',
    portfolio: 'HYG (28.8%): Frühwarnsystem für den Arbeitsmarkt. Der Trend ist der Freund — eine einzelne Woche ist Rauschen, aber 4 Wochen über 250K mit steigender Tendenz hat historisch in 70% der Fälle eine HY-Spread-Ausweitung um >50bp in den folgenden 3 Monaten eingeleitet. XLU (18.0%) und XLP (16.1%) profitieren bei anhaltender Schwäche.',
  },
  'Consumer Confidence': {
    what: 'Verbrauchervertrauen (Conference Board oder Michigan) — Leading Indicator für Konsumausgaben mit 2-3 Monaten Vorlauf. Conference Board stärker mit Arbeitsmarkt korreliert (Present Situation), Michigan stärker mit Inflation korreliert (Expectations, 5-Year Inflation Expectations). Expectations/Present Situation Spread ist ein anerkannter Rezessionsfrühindikator.',
    hot: 'Vertrauen über Konsens. Kette: optimistische Verbraucher → Konsumausgaben bleiben stark → BIP-Wachstum gestützt → HYG (28.8%) fundamental positiv (Consumer-Emittenten profitieren) → DBC (20.3%) neutral bis positiv (Benzin-Nachfrage). XLP (16.1%) underperformt relativ (Rotation in Discretionary bei starkem Vertrauen).',
    cold: 'Vertrauen unter Konsens. Kette: pessimistische Verbraucher → Konsumausgaben werden reduziert → Retail Sales folgen in 2-3 Monaten → HYG (28.8%) Consumer-Segment unter Druck → XLP (16.1%) profitiert als Defensive. KRITISCH: Expectations-Komponente unter 80 (Conference Board) = historisch zuverlässiges Rezessionssignal → dann: HYG-Spreads weiten signifikant in den folgenden 6 Monaten.',
    portfolio: 'HYG (28.8%): Expectations-Komponente als Leading Indicator für Consumer-Defaults beobachten. XLP (16.1%): direkte Rotation bei Vertrauensverlust. Querverweis: Consumer Confidence + Retail Sales + Jobless Claims = Konsumentengesundheits-Dreieck.',
  },
  'PMI': {
    what: 'Purchasing Managers Index (S&P Global, ehemals IHS Markit) — Einkaufsmanagerindex basierend auf Unternehmensumfragen. Flash PMI erscheint ~2 Wochen vor dem ISM und ist damit das früheste Signal für den laufenden Monat. Über 50 = Expansion, unter 50 = Kontraktion. Länderspezifisch: US PMI direkt relevant, EU/CN PMI über Handels- und Wachstumskanäle.',
    hot: 'PMI über 50 und über Konsens. Kette: Wirtschaft expandiert → Nachfrage nach Rohstoffen steigt → DBC (20.3%) profitiert → Unternehmensgewinne intakt → HYG (28.8%) fundamental gestützt. Bei EU PMI stark: VGK-Signal in unserem System verbessert sich. Bei CN PMI stark: Commodity-Nachfrage global gestützt → DBC (20.3%) zusätzlicher Rückenwind.',
    cold: 'PMI unter 50 oder stark unter Konsens. Kette: Wachstumsverlangsamung → DBC (20.3%) unter Nachfrage-Druck → HYG (28.8%) abhängig von Region: US PMI schwach → direkte HY-Relevanz. EU PMI schwach → VGK-Signal verschlechtert sich. CN PMI schwach → globale Commodity-Nachfrage sinkt → DBC (20.3%) besonders exponiert.',
    portfolio: 'Flash PMI als ISM-Preview nutzen. DBC (20.3%): globale PMIs aggregiert = bester Proxy für industrielle Rohstoffnachfrage. Querverweis: wenn US PMI schwach + CN PMI schwach → globale synchrone Verlangsamung → DBC-Drawdown-Risiko erhöht, HYG-Spread-Ausweitung breit.',
  },
  'Housing Starts': {
    what: 'US-Baubeginne und Baugenehmigungen — Leading Indicator für Bausektor und breitere Wirtschaft mit 6-9 Monaten Vorlauf. Baugenehmigungen (Permits) laufen Starts voraus. Housing Starts sind zinssensitiv (Mortgage Rates), demographisch getrieben (Millennials/Gen-Z Household Formation), und angebotsbeschränkt (Bauarbeitermangel, Regulierung). Multifamily vs. Single-Family unterscheiden.',
    hot: 'Starts/Permits über Konsens. Kette: mehr Bauaktivität → Nachfrage nach Baumaterialien steigt → DBC (20.3%) profitiert (Kupfer, Lumber, Stahl) → Bauarbeiter-Nachfrage steigt → Lohnwachstum im Bausektor → HYG-Emittenten im Homebuilder-Segment profitieren → XLU (18.0%) neutral (neue Häuser = mehr Stromverbrauch, aber moderat). Querverweis: wenn Housing Starts stark TROTZ hoher Mortgage Rates → außergewöhnlich starke Nachfrage.',
    cold: 'Starts/Permits unter Konsens. Kette: weniger Bauaktivität → Commodity-Nachfrage sinkt → DBC (20.3%) Kupfer-Komponente unter Druck → Homebuilder-Gewinne fallen → HYG wenn Homebuilder im HY-Index vertreten → XLP (16.1%) relativ stärker. Querverweis: Housing Starts schwach + Consumer Confidence fallend + Mortgage Rates steigend = Housing Recession Szenario → historisch führt das zu breiterer Konjunkturschwäche mit 3-4 Quartalen Verzögerung.',
    portfolio: 'DBC (20.3%): Kupfer-Nachfrage direkt von Bausektor abhängig (~40% der US-Kupfernachfrage = Bau). GLD (16.9%): indirekt bei Housing Recession als Safe Haven gefragt. Querverweis: Housing Starts + Construction Spending + Existing Home Sales als Housing-Komplex zusammen lesen.',
  },
  'Construction Spending': {
    what: 'US-Bauausgaben — monatliche Gesamtausgaben für Bau (Residential, Non-Residential, Government). Nachlaufender Indikator (misst vergangene Ausgaben), aber Trendwechsel signalisieren Investitionszykluswende. Government-Komponente (Infrastruktur) kann Private-Schwäche teilweise kompensieren.',
    hot: 'Bauausgaben über Konsens. Kette: steigende Investitionstätigkeit → Industriesektor profitiert → DBC (20.3%) Kupfer und Stahl gefragt → XLU (18.0%) profitiert von Infrastruktur-Komponente (Utilities-Ausbau) → HYG (28.8%) Emittenten im Bau/Industrie-Segment profitieren.',
    cold: 'Bauausgaben unter Konsens. Kette: sinkende Investitionstätigkeit → Industrienachfrage schwächt sich → DBC (20.3%) Bau-sensitive Rohstoffe unter Druck → bestätigt ISM/PMI Schwäche wenn gleichzeitig Manufacturing kontrahiert → HYG (28.8%) Bau-Emittenten exponiert. Querverweis: Construction Spending schwach + ISM unter 50 = Investitionsrezession → DBC-Drawdown beschleunigt sich.',
    portfolio: 'DBC (20.3%): direkte Exposure über Kupfer und Baumaterialien. Trend über 3 Monate aussagekräftiger als Einzelprint. Querverweis: Construction Spending + Housing Starts + Durable Goods = Investment-Dreieck. Alle drei schwach = Capex-Rezession.',
  },
  'Trade Balance': {
    what: 'US-Handelsbilanz — Exporte minus Importe. Strukturell defizitär (USA importiert mehr als es exportiert). Für Finanzmärkte normalerweise niedriger Impact, AUSSER bei Trade-Policy Schocks (Tariffs, Trade Wars) wo es zum dominierenden Markttreiber wird. Petroleum Balance separat beobachten (Shale Revolution hat US-Energieabhängigkeit reduziert).',
    hot: 'Schrumpfendes Defizit (steigende Exporte oder fallende Importe). Kette: stärkere US-Exporte → Dollar kann sich stärken → DBC (20.3%) unter Dollar-Druck. ABER: fallende Importe können Schwächesignal sein (weniger Inlandsnachfrage) → kontextabhängig interpretieren. Bei Trade War: Tariffs reduzieren Defizit künstlich → nicht als Stärke fehlinterpretieren.',
    cold: 'Wachsendes Defizit (steigende Importe). Kette: mehr US-Nachfrage nach ausländischen Gütern → kann Stärke signalisieren (Konsum hoch) oder Wettbewerbsschwäche → Dollar unter Druck → DBC (20.3%) profitiert von Dollar-Schwäche → GLD (16.9%) profitiert von Dollar-Schwäche.',
    portfolio: 'Normalerweise niedriger direkter Impact auf unsere Positionen. AUSNAHME: Trade War Eskalation (Tariffs) → dann: DBC (20.3%) massiv betroffen (Supply Chain Disruption + Retaliatory Tariffs auf Commodities), HYG (28.8%) unter Druck (zyklische Emittenten mit Exportexposure). Querverweis: Trade Balance im Kontext von Trade Policy Nachrichten lesen, nicht isoliert.',
  },
  'Durable Goods': {
    what: 'Aufträge für langlebige Güter — Leading Indicator für Business Investment und damit BIP-Investitionskomponente. Headline extrem volatil durch Flugzeug-Aufträge (Boeing-Zyklen). Core Durable Goods (ex Transportation) und Core Capital Goods Orders (ex Defense & Aircraft = Business Capex Proxy) sind die relevanten Metriken für die Konjunkturanalyse.',
    hot: 'Core Durable Goods über Konsens. Kette: Unternehmen investieren → Industrieproduktion steigt → Rohstoffnachfrage steigt → DBC (20.3%) profitiert → HYG (28.8%) fundamental gestützt (investierende Unternehmen = gesunde Bilanzen) → ISM Manufacturing sollte folgen (1-2 Monate Vorlauf). Querverweis: Durable Goods + ISM New Orders = Investment-Momentum.',
    cold: 'Core Durable Goods unter Konsens. Kette: Unternehmen halten Investitionen zurück → Vorbote für Produktionskürzungen → ISM Manufacturing fällt mit Verzögerung → DBC (20.3%) unter Nachfrage-Druck → HYG (28.8%) Emittenten mit Capex-Abhängigkeit exponiert. Wenn 3 konsekutive Monate negativ: historisch zuverlässiges Rezessionsfrühsignal (Lead Time 4-6 Monate).',
    portfolio: 'DBC (20.3%): Durable Goods Orders = Frühindikator für industrielle Rohstoffnachfrage. HYG (28.8%): Capital Goods sind ein Proxy für die Gesundheit der industriellen Kreditnehmer. Querverweis: Core Capital Goods ex Defense & Aircraft ist die sauberste Capex-Metrik — Headline ignorieren.',
  },
  'Industrial Production': {
    what: 'US-Industrieproduktion — monatlicher Output von Manufacturing, Mining und Utilities (Fed-Daten). Capacity Utilization (gleichzeitig publiziert) zeigt Auslastungsgrad. Trending-Indikator mit wenig Noise. IP + Capacity Utilization zusammen sind der beste Proxy für den industriellen Konjunkturzyklus.',
    hot: 'IP und Capacity Utilization über Konsens. Kette: Fabriken produzieren mehr → Rohstoffinput steigt → DBC (20.3%) nachfragegetrieben positiv → Capacity Utilization über 80% → Preisdruck möglich (Engpässe) → PPI steigt → CPI folgt → Inflationspipeline. HYG (28.8%) profitiert von besserem Operating Leverage der Emittenten. XLU (18.0%) Utilities-Produktion steigt (positiv für Earnings).',
    cold: 'IP und Capacity Utilization unter Konsens. Kette: Produktionsrückgang → weniger Rohstoffverbrauch → DBC (20.3%) unter Druck → sinkende Auslastung → Operating Leverage dreht negativ → Margen sinken → HYG (28.8%) Industrieemittenten unter Druck. Querverweis: IP fallend + ISM Manufacturing unter 50 + Durable Goods schwach = industrielle Rezession bestätigt.',
    portfolio: 'DBC (20.3%): direkte Korrelation über Rohstoffverbrauch. Trend über 3 Monate ist aussagekräftiger als Einzelmonat. Capacity Utilization unter 75% = historisch erhöhtes Rezessionsrisiko. Querverweis: IP als Bestätigungsindikator für ISM nutzen — beide zusammen schwach = Industrierezession.',
  },
  'Chicago Fed': {
    what: 'Chicago Fed National Activity Index (CFNAI) — gewichteter Durchschnitt aus 85 US-Wirtschaftsindikatoren (Produktion, Einkommen, Beschäftigung, Konsum). Über 0 = überdurchschnittliches Wachstum, unter 0 = unterdurchschnittlich. Der 3-Monats-Durchschnitt (CFNAI-MA3) ist die geglättete Version. CFNAI-MA3 unter -0.70 = historisch immer Rezession. Breitester US-Composite-Indikator.',
    hot: 'CFNAI positiv und steigend. Kette: breites Wachstum über alle 85 Komponenten → bestätigt ISM, NFP, Retail Sales gleichzeitig → HYG (28.8%) fundamental stark (breites Wachstum = niedrige Defaults) → DBC (20.3%) nachfragegetrieben positiv. Selten marktbewegend als Einzelrelease, aber bestätigt oder widerlegt das Gesamtbild.',
    cold: 'CFNAI negativ und fallend. Kette: breite Wirtschaftsschwäche → CFNAI-MA3 unter -0.35 = überdurchschnittliches Rezessionsrisiko → unter -0.70 = Rezession historisch sicher → HYG (28.8%) unter massivem Druck bei Rezessionsbestätigung → GLD (16.9%) und XLP (16.1%) als Defensive gefragt. Querverweis: CFNAI als Meta-Bestätigung nutzen — wenn ISM, NFP, Retail Sales gemischt sind, gibt CFNAI die Richtung.',
    portfolio: 'HYG (28.8%): CFNAI-MA3 unter -0.70 ist ein definitives Signal zum Risiko-Abbau in HY. DBC (20.3%): CFNAI bestätigt DBC-Richtung. Querverweis: CFNAI + Sahm Rule + Yield Curve = Rezessions-Trifecta.',
  },
  'Bill Auction': {
    what: 'US Treasury Bill Auktion — kurzlaufende Staatsanleihen (4-Week, 8-Week, 13-Week, 26-Week). Yield zeigt den aktuellen risikofreien Kurzfristzins und damit die Markterwartung für Fed Funds. Bid-to-Cover Ratio zeigt Nachfrage. Bill Yields sind der engste Proxy für Fed-Erwartungen am kurzen Ende.',
    hot: 'Höhere Yields als vorherige Auktion. Kette: Markt erwartet längere Phase hoher Fed Funds → Higher-for-Longer Narrativ bestätigt → moderater negativer Impuls für Duration-Assets → XLU (18.0%) und HYG (28.8%) unter Zinsdruck am kurzen Ende. Einzelauktion selten marktbewegend — Trend über mehrere Auktionen relevant.',
    cold: 'Niedrigere Yields als vorherige Auktion. Kette: Markt preist Zinssenkungen ein → kurzfristiger Zinsausblick verbessert → positiv für HYG (28.8%) Refinanzierungskosten (HY-Emittenten nutzen oft kurzfristige Finanzierung). Einzelauktion wenig Impact.',
    portfolio: 'Niedriger direkter Impact. Trend bei Bill Yields als Proxy für Fed-Erwartungen nutzen. HYG (28.8%) am relevantesten weil HY-Emittenten kurzfristige Refinanzierung nutzen. Querverweis: Bill Yield Trend + Fed Funds Futures + 2Y Treasury = Kurzfrist-Zinsausblick.',
  },
  'Note Auction': {
    what: 'US Treasury Note Auktion — mittelfristige Staatsanleihen (2Y, 5Y, 7Y, 10Y). Die 10Y-Auktion ist die wichtigste (Benchmark für Mortgage Rates, Corporate Bonds, globale Diskontierung). Bid-to-Cover Ratio, Indirect Bidders (Foreign Central Banks), und Tail (Differenz Auktionspreis vs. When-Issued) zeigen Nachfragequalität.',
    hot: 'Schwache Nachfrage (hoher Tail, niedriger Bid-to-Cover, wenig Indirect Bidders). Kette: Markt verlangt höhere Prämie für US-Schulden → Yields steigen → Mortgage Rates steigen → Housing unter Druck → Corporate Bond Yields steigen → HYG (28.8%) unter direktem Spread-Druck → XLU (18.0%) als Duration-Asset leidet. Querverweis: schwache 10Y-Auktion + steigende Term Premium = Fiscal Dominance Risiko.',
    cold: 'Starke Nachfrage (niedriger Tail, hoher Bid-to-Cover, starke Indirect Bidders). Kette: Flight to Quality oder Zinssenkungserwartung → Yields fallen → HYG (28.8%) profitiert (niedrigere Benchmark-Rate) → XLU (18.0%) profitiert als Duration-Play → GLD (16.9%) gemischt (Realzinsen fallen = positiv, Risk-On = leicht negativ).',
    portfolio: 'HYG (28.8%): 10Y-Yield ist die Benchmark für HY-Bewertung. Schwache Auktionen erhöhen die gesamte Kreditkurve. XLU (18.0%): Duration-Sensitivität. Querverweis: Note Auktion Ergebnisse + TLT-Bewegung + 10Y Real Yield (TIPS) zusammen lesen.',
  },
  'Bond Auction': {
    what: 'US Treasury Bond Auktion — langfristige Staatsanleihen (20Y, 30Y). Zeigt die Nachfrage nach extremer Duration und damit die Markteinschätzung für langfristiges Wachstum, Inflation und Fiskalstabilität. Weniger liquid als Notes, aber Signalwert für das lange Ende der Kurve hoch.',
    hot: 'Schwache Nachfrage bei langen Laufzeiten. Kette: Markt will keine US-Langfristschuld → Term Premium steigt → gesamte Zinskurve verschiebt sich nach oben am langen Ende → XLU (18.0%) unter starkem Druck (längste Duration-Sensitivität unter unseren Positionen) → HYG (28.8%) unter moderatem Druck → Fiscal-Sustainability Bedenken wenn persistent.',
    cold: 'Starke Nachfrage bei langen Laufzeiten. Kette: Investoren suchen sichere Langfristanlage → Yields am langen Ende fallen → XLU (18.0%) und XLP (16.1%) profitieren → HYG (28.8%) profitiert von niedrigerer Benchmark am langen Ende.',
    portfolio: 'XLU (18.0%): höchste Duration-Sensitivität unter unseren Positionen — Bond-Auktionen am langen Ende sind direkt relevant. Querverweis: Trend bei allen drei Auktionstypen (Bills, Notes, Bonds) zusammen lesen — persistente Schwäche über alle Laufzeiten = systemisches Problem (Fiscal Dominance).',
  },
  'Core Inflation': {
    what: 'Kerninflation — CPI oder PCE ohne volatile Nahrung und Energie, berichtet von verschiedenen Ländern. Der "sticky" Inflationstrend den Zentralbanken beobachten. In den USA: Core CPI und Core PCE (Fed bevorzugt PCE). In der Eurozone: HICP Core. Für unsere Positionen primär über den Zinskanal relevant.',
    hot: 'Kerninflation über Erwartung. Kette: persistente Inflation → Zentralbank muss restriktiv bleiben → Zinsen bleiben hoch oder steigen → Duration-Assets leiden → HYG (28.8%) unter Spread-Druck (Refinanzierung teurer) → XLU (18.0%) als Bond-Proxy leidet → DBC (20.3%) profitiert als realer Asset → GLD (16.9%) profitiert bei negativen Realzinsen.',
    cold: 'Kerninflation unter Erwartung. Kette: Inflation nähert sich Ziel → Zinssenkungen rücken näher → HYG (28.8%) profitiert doppelt (niedrigere Basis + Spread-Kompression) → XLU (18.0%) profitiert → DBC (20.3%) verliert Inflationshedge-Nachfrage.',
    portfolio: 'Länderspezifisch interpretieren. US Core → direkt für HYG (28.8%), XLU (18.0%). EU Core → über EZB-Kanal für DBC (20.3%), GLD (16.9%) via EUR/USD. Querverweis: globale Core Inflation synchron steigend = strukturelles Problem → Portfolio in Richtung reale Assets (DBC, GLD) rotieren.',
  },
  'Inflation Rate': {
    what: 'Headline Inflationsrate (Gesamtinflation inkl. Nahrung und Energie) — erscheint für verschiedene Länder. Volatiler als Core wegen Energie- und Nahrungsmittelpreisen. Für die Fed weniger relevant als Core PCE, aber politisch und psychologisch hochbedeutend (Verbraucher spüren Headline, nicht Core). Yoy-Vergleiche können durch Basiseffekte verzerrt sein.',
    hot: 'Headline über Erwartung. Kette: sichtbare Inflation steigt → Konsumenten-Sentiment verschlechtert sich → politischer Druck auf Fed steigt → Fed bleibt restriktiv auch wenn Core nachgibt → HYG (28.8%) unter Zinsdruck → DBC (20.3%) profitiert wenn durch Energie/Nahrung getrieben (Commodity-Superzyklus Narrativ) → GLD (16.9%) als Inflationsschutz gefragt.',
    cold: 'Headline unter Erwartung. Kette: Inflation für Verbraucher spürbar niedriger → Sentiment verbessert sich → Fed hat mehr Spielraum → HYG (28.8%) profitiert → DBC (20.3%) unter Druck wenn durch Energie/Commodity-Schwäche getrieben. Querverweis: Headline kalt + Core heiß = Basiseffekte in Energie, nicht strukturelle Disinflation — genau hinsehen.',
    portfolio: 'Länderspezifisch: US Inflation → direkt. JP Inflation → über BOJ-Kanal (Carry Trade). EU Inflation → über EZB/EUR-Kanal. DBC (20.3%) und GLD (16.9%) profitieren bei heißer Inflation. Querverweis: Headline vs. Core Divergenz beobachten — wenn Headline fällt aber Core steigt, ist das Inflationsproblem nicht gelöst.',
  },
  'Composite PMI': {
    what: 'Zusammengesetzter PMI (Manufacturing + Services) — breitester Einzelindikator für Wirtschaftsaktivität. Flash Composite PMI von S&P Global erscheint Mitte des Monats als früheste Konjunkturschätzung. Über 50 = Expansion, unter 50 = Kontraktion. Gewichtung: Services dominiert (~65-70% in Industrieländern). Globaler Composite PMI aggregiert die wichtigsten Volkswirtschaften.',
    hot: 'Composite über 50 und steigend. Kette: breite Wirtschaftsexpansion → Rohstoffnachfrage steigt → DBC (20.3%) profitiert → Unternehmensgewinne steigen → HYG (28.8%) fundamental stark → Fed sieht kein Bedürfnis zu senken → XLU (18.0%) unter relativer Underperformance. Querverweis: US + EU + CN Composites alle über 50 = global synchroner Aufschwung → stärkstes Commodity-Umfeld.',
    cold: 'Composite unter 50 oder stark fallend. Kette: breite Wachstumsschwäche → DBC (20.3%) unter synchronem Nachfrage-Druck → HYG (28.8%) breit unter Spread-Druck → Defensive Rotation in XLU (18.0%) und XLP (16.1%) → GLD (16.9%) als Safe Haven. KRITISCH: Composite unter 48 für 2+ Monate = Rezessionsgebiet. Querverweis: Composite PMI als bester Flash-Indikator vor ISM nutzen.',
    portfolio: 'Trend über 3 Monate beobachten. DBC (20.3%): globaler Composite PMI ist der beste Proxy für industrielle Rohstoffnachfrage. HYG (28.8%): breite Expansion/Kontraktion bestimmt das Default-Umfeld. Querverweis: Flash Composite PMI (Mitte Monat) → ISM (Anfang nächster Monat) → NFP (erster Freitag) = Konjunkturdaten-Sequenz.',
  },
  'Services PMI': {
    what: 'Services PMI (S&P Global, ehemals Markit) — Dienstleistungssektor, ~80% der Wirtschaft in Industrieländern. Flash-Version erscheint Mitte des Monats vor dem ISM. Business Activity und New Business Sub-Indizes am wichtigsten. Input Prices zeigt Dienstleistungsinflation (relevant für Supercore CPI). Employment-Subindex als NFP-Preview.',
    hot: 'Services PMI über 50 und über Konsens. Kette: Dienstleistungssektor expandiert → Beschäftigung bleibt stark → Lohnwachstum persistent → Supercore-Inflation bleibt sticky → Fed kann nicht senken → HYG (28.8%) fundamental gut aber Higher-for-Longer Zins-Gegenwind → XLU (18.0%) leidet unter Zinserwartungen.',
    cold: 'Services PMI unter 50 oder stark unter Konsens. Kette: Dienstleistungssektor schwächt sich → Employment fällt → Consumer Spending folgt → HYG (28.8%) breit exponiert (Services-Emittenten ~50% des HY-Universums) → Fed muss reagieren → Zinssenkungserwartung zieht vor → XLU (18.0%) und XLP (16.1%) als Defensive profitieren. GLD (16.9%) steigt.',
    portfolio: 'Wichtiger als Manufacturing PMI für unsere Positionen weil der Dienstleistungssektor das Beschäftigungs- und Konsumklima dominiert. HYG (28.8%) am sensibelsten. Querverweis: Services PMI + ISM Services zusammen als Bestätigung nutzen.',
  },
  'Manufacturing PMI': {
    what: 'Manufacturing PMI (S&P Global) — Industriesektor, erscheint als Flash Mitte des Monats. Über 50 = Expansion, unter 50 = Kontraktion. New Orders und Output Sub-Indizes am wichtigsten. Prices Paid/Received zeigt industriellen Preisdruck. Flash-Version ist die früheste ISM-Preview. Länderspezifisch: CN Manufacturing PMI (Caixin) bewegt globale Commodity-Märkte.',
    hot: 'Manufacturing PMI über 50 und steigend. Kette: Industrie expandiert → Rohstoffbestellungen steigen → DBC (20.3%) direkt positiv → Prices Received steigt → PPI folgt → Inflationspipeline. HYG (28.8%) Industrieemittenten profitieren von besserem Operating Leverage.',
    cold: 'Manufacturing PMI unter 50 und fallend. Kette: Industriekontraktion → Rohstoffnachfrage sinkt → DBC (20.3%) unter direktem Druck → wenn CN Manufacturing PMI gleichzeitig schwach → globaler Commodity-Abschwung → DBC-Drawdown beschleunigt. HYG (28.8%) Industrieemittenten unter Margendruck. XLP (16.1%) relativ stärker.',
    portfolio: 'DBC (20.3%): Manufacturing PMI ist der direkteste Vorlaufindikator. Globale PMIs aggregieren. HYG (28.8%): Industrieemittenten-Exposure. Querverweis: Manufacturing PMI + ISM Manufacturing + Industrial Production = Industriesektor-Komplex. Alle drei schwach = industrielle Rezession.',
  },
  'CB Consumer': {
    what: 'Conference Board Consumer Confidence — umfassendste US-Verbraucherumfrage. Zwei Komponenten: Present Situation (stärker korreliert mit Arbeitsmarkt, nachlaufend) und Expectations (3-6 Monate Forward-Looking, Rezessionsindikator). Expectations unter 80 hat historisch in 80% der Fälle eine Rezession innerhalb von 12 Monaten angekündigt. Erscheint monatlich am letzten Dienstag.',
    hot: 'Conference Board über Konsens. Kette: optimistische Verbraucher → Konsumausgaben bleiben robust → BIP-Wachstum gestützt → HYG (28.8%) fundamental positiv → aber: kann höhere Inflation über Nachfragekanal befeuern → Fed bleibt wachsam. XLP (16.1%) underperformt relativ (Discretionary > Staples bei hohem Vertrauen).',
    cold: 'Conference Board unter Konsens, besonders Expectations-Komponente. Kette: pessimistische Verbraucher → Ausgaben werden zurückgefahren (mit 2-3 Monaten Lag) → Retail Sales schwächen sich → Unternehmensgewinne im Consumer-Segment fallen → HYG (28.8%) Consumer-Emittenten unter Druck. KRITISCH: Expectations unter 80 = Rezessionswarnung → HYG-Risiko steigt erheblich. XLP (16.1%) profitiert von Staples-Rotation.',
    portfolio: 'HYG (28.8%): Expectations-Komponente als Leading Indicator für Consumer-Default-Welle. XLP (16.1%): direkter Profiteur bei Vertrauensverlust (Rotation Discretionary → Staples). Querverweis: CB Consumer + Michigan Consumer divergieren manchmal — CB ist arbeitsmarktlastiger, Michigan inflationslastiger. Beide schwach = starkes Warnsignal.',
  },
  'Michigan Consumer': {
    what: 'University of Michigan Consumer Sentiment — älteste US-Verbraucherumfrage (seit 1952). Enthält neben Sentiment auch die 1-Jahres und 5-10-Jahres Inflationserwartungen, die von der Fed direkt beobachtet werden. Preliminary (Mitte Monat, ~500 Befragte) und Final (Monatsende, ~1000 Befragte). Die Inflationserwartungen-Komponente kann marktbewegender sein als das Sentiment selbst.',
    hot: 'Sentiment über Konsens. Kette: optimistische Verbraucher → Konsum stark. ABER: hohe Inflationserwartungen in derselben Umfrage → Fed sieht Gefahr einer Inflationserwartungs-Entankerung → wird hawkisher → HYG (28.8%) unter Zinsdruck trotz gutem Sentiment. Querverweis: 5Y Inflation Expectations über 3.0% = rote Linie für die Fed.',
    cold: 'Sentiment unter Konsens. Kette: pessimistische Verbraucher → Konsumzurückhaltung → Wachstumssorgen. Wenn gleichzeitig Inflationserwartungen hoch → Stagflationsrisiko (schlechtestes Szenario: schwaches Wachstum + hohe Inflation → HYG (28.8%) unter Doppeldruck). Wenn Inflationserwartungen auch fallen → reine Wachstumssorge → Fed kann senken → HYG mittelfristig profitieren.',
    portfolio: 'Inflationserwartungen-Komponente ist der Schlüssel. HYG (28.8%): Sentiment als Consumer-Default-Frühindikator. GLD (16.9%): profitiert wenn Inflationserwartungen steigen. XLP (16.1%): Defensive bei Sentiment-Einbruch. Querverweis: Michigan Inflation Expectations + TIPS Breakevens + PCE zusammen = Inflationserwartungs-Komplex.',
  },
  'Initial Jobless': {
    what: 'Initial Jobless Claims — wöchentliche Erstanträge auf Arbeitslosenhilfe. Identisch mit "Jobless Claims". Höchstfrequenter Arbeitsmarktindikator (jeden Donnerstag). 4-Wochen-Durchschnitt glätten. Saisonbereinigung kann um Feiertage und Schulferien verzerren. Insured Unemployment Rate als präzisere Metrik.',
    hot: 'Claims unter Konsens (weniger Entlassungen). Kette: enger Arbeitsmarkt → Lohndruck bleibt → Fed restriktiv → HYG (28.8%) fundamental gut aber Zins-Gegenwind. Einzelwoche wenig aussagekräftig.',
    cold: 'Claims über Konsens (mehr Entlassungen). Kette: Arbeitsmarkt kühlt ab → wenn persistenter Trend über 4+ Wochen → NFP Schwäche folgt → HYG (28.8%) Spread-Risiko steigt. Claims über 250K persistent = Frühwarnung für Rezession. XLP (16.1%) und XLU (18.0%) als Defensive.',
    portfolio: 'Trend ist entscheidend, nicht Einzelwoche. HYG (28.8%): 4-Wochen-Durchschnitt über 250K mit steigender Tendenz = Risiko-Management aktivieren. Querverweis: Initial Claims + Continuing Claims + JOLTS Openings = Arbeitsmarkt-Triptychon.',
  },
  'Continuing Jobless': {
    what: 'Continuing Claims (Fortlaufende Arbeitslosenhilfe-Anträge) — zeigt wie viele Menschen dauerhaft arbeitslos sind und Leistungen beziehen. Steigend = Arbeitslose finden keine neuen Jobs, Arbeitsmarkt verschlechtert sich strukturell. Nachlaufender als Initial Claims, aber ernsterer Indikator wenn steigend. Insured Unemployment Rate = Continuing Claims / Covered Employment.',
    hot: 'Continuing Claims fallend (weniger Langzeitarbeitslose). Kette: Menschen finden schnell neue Jobs → Arbeitsmarkt gesund → Konsumausgaben intakt → HYG (28.8%) fundamental gestützt. Confirmation für starken NFP.',
    cold: 'Continuing Claims steigend und über Konsens. Kette: Langzeitarbeitslosigkeit nimmt zu → Einkommen sinkt dauerhaft → Konsumausgaben fallen → Kreditqualität verschlechtert sich → HYG (28.8%) unter Druck weil Verbraucher ihre Schulden nicht mehr bedienen → Default-Kaskade möglich. Ernsteres Signal als steigende Initial Claims. GLD (16.9%) als Safe Haven, XLP (16.1%) als Defensive.',
    portfolio: 'HYG (28.8%): steigende Continuing Claims sind ein Spätindikator der bestätigt, dass die Arbeitsmarktschäche strukturell wird — dann ist es für defensive Positionierung oft schon spät. Querverweis: Continuing Claims Trend + Sahm Rule + Yield Curve = Rezessionsbestätigung.',
  },
  'Richmond Fed': {
    what: 'Richmond Fed Manufacturing/Services Index — regionale Fed-Umfrage für die US-Ostküste (Virginia, Carolinas, D.C., Maryland, West Virginia). Unter 0 = Kontraktion. Als einzelner regionaler Index niedriger Impact, aber im Mosaik der 5 regionalen Fed-Umfragen (NY Empire, Philly Fed, Richmond, KC, Dallas) wird er zum ISM-Preview.',
    hot: 'Positiv und über Konsens. Kette: regionale Wirtschaft expandiert → wenn andere regionale Feds auch positiv → ISM Manufacturing wird voraussichtlich stark → DBC (20.3%) Nachfrage-Ausblick verbessert sich.',
    cold: 'Negativ und unter Konsens. Kette: regionale Kontraktion → wenn Dallas, KC, Philly auch negativ → ISM-Schwäche wahrscheinlich → DBC (20.3%) Nachfrage unter Druck → HYG (28.8%) moderater Sekundäreffekt über Wachstumsausblick. Einzeln wenig Impact.',
    portfolio: 'Niedriger direkter Impact auf unsere Positionen. Aggregiert mit den anderen 4 regionalen Feds ergibt sich die beste ISM-Preview. Querverweis: 3+ von 5 regionalen Feds negativ = ISM Manufacturing unter 50 in >75% der Fälle → dann DBC (20.3%) exponiert.',
  },
  'Dallas Fed': {
    what: 'Dallas Fed Manufacturing/Services Index — regionale Fed-Umfrage für Texas, Louisiana, New Mexico (Energiesektor-dominant). Business Activity unter 0 = Kontraktion. Besonderer Stellenwert weil Texas überproportional energielastig ist — Dallas Fed Manufacturing ist der beste Frühindikator für den US-Energiesektor.',
    hot: 'Positiv und über Konsens. Kette: Texas/Energie-Sektor expandiert → Ölproduktion steigt → Energieinvestitionen steigen → DBC (20.3%) Energiekomponente gestützt → HYG (28.8%) profitiert (Energie-Emittenten sind ~15% des HY-Index).',
    cold: 'Negativ und unter Konsens. Kette: Energiesektor kontrahiert → Ölproduktion unter Druck → DBC (20.3%) Energiekomponente schwächelt → HYG (28.8%) Energie-HY-Emittenten unter Druck (Exploration & Production Firmen mit hohem Leverage) → wenn persistent: Shale-Pleiten-Welle möglich (wie 2015-16). GLD (16.9%) profitiert wenn Energie-Schwäche Rezessionsangst auslöst.',
    portfolio: 'DBC (20.3%): Dallas Fed als Energie-Frühindikator direkt relevant. HYG (28.8%): Energie-HY-Emittenten sind ein signifikantes Cluster-Risiko bei anhaltender Schwäche. Querverweis: Dallas Fed + Crude Oil Inventories + Rig Count = Energiesektor-Komplex.',
  },
  'Fed': {
    what: 'Fed-Offizielle Reden — einzelne FOMC-Mitglieder kommunizieren zwischen den Sitzungen ihre Einschätzung. Stimmberechtigte Mitglieder (Voting Members) haben mehr Gewicht als nicht-stimmberechtigte (Rotating). Fed Chair Reden sind De-facto-Policy-Ankündigungen. Vice Chair und NY Fed President haben ebenfalls Sonderstatus. Markt sucht nach Abweichungen vom letzten Statement als Forward Guidance.',
    hot: 'Hawkishe Töne (Inflation, höhere Zinsen, keine Eile für Cuts). Kette: Markt repriced Fed Path nach oben → Zinserwartungen steigen → HYG (28.8%) unter Druck → Dollar stärkt sich → DBC (20.3%) und GLD (16.9%) unter Dollar-Druck. Impact abhängig vom Sprecher: Chair > Vice Chair > NY Fed > andere Voting > Non-Voting.',
    cold: 'Dovishe Töne (Wachstumssorgen, Arbeitsmarktrisiken, Zinssenkungen möglich). Kette: Markt preist schnellere Zinssenkungen ein → HYG (28.8%) profitiert → Dollar schwächt sich → DBC (20.3%) und GLD (16.9%) profitieren. Querverweis: wenn 3+ Voting Members in einer Woche dovish klingen, ist der Shift real.',
    portfolio: 'Impact-Hierarchie beachten. HYG (28.8%): am sensitivsten für Zins-Forward-Guidance. DBC (20.3%) und GLD (16.9%): über Dollar-Kanal. XLU (18.0%): als Duration-Proxy. Querverweis: Fed-Reden im Kontext des letzten FOMC-Statements lesen — Abweichungen signalisieren Meinungsverschiebung im Komitee.',
  },
  'Crude Oil': {
    what: 'Rohöl-Lagerbestandsveränderung — API (Dienstag, privat) und EIA/DOE (Mittwoch, offiziell). API ist die Preview, EIA der offizielle Report. Steigende Bestände = Überangebot oder schwache Nachfrage, fallende Bestände = Nachfrage übersteigt Produktion. Cushing (Oklahoma) Bestände besonders beobachtet als WTI-Lieferort. Strategic Petroleum Reserve (SPR) Veränderungen separat.',
    hot: 'Starker Bestandsabbau (fallende Inventories). Kette: Nachfrage > Angebot → Ölpreis steigt → DBC (20.3%) direkt positiv (Energie ist die größte DBC-Komponente) → Benzinpreise steigen → Headline CPI steigt → Fed unter Inflationsdruck → HYG (28.8%) unter Zinsdruck wenn persistent → XLU (18.0%) Inputkosten steigen (Strom aus Gas teurer).',
    cold: 'Starker Bestandsaufbau (steigende Inventories). Kette: Überangebot oder Nachfrageschwäche → Ölpreis fällt → DBC (20.3%) unter Druck → Energie-HY-Emittenten unter Margendruck → HYG (28.8%) Energie-Segment exponiert → ABER: niedrigere Energiekosten reduzieren CPI → disinflationär → positiv für Zinspfad → XLU (18.0%) Inputkosten sinken.',
    portfolio: 'DBC (20.3%): direkteste Exposure — Energie ist die größte Gewichtung im Bloomberg Commodity Index. HYG (28.8%): Energie-HY-Segment (~15% des Index) direkt betroffen bei anhaltender Bestandsaufbau. GLD (16.9%): Öl-Schock kann Inflationsangst und damit GLD-Nachfrage treiben. Querverweis: Crude Inventories + Dallas Fed + OPEC-Entscheidungen = Energiemarkt-Dreieck.',
  },
  'Money Supply': {
    what: 'Geldmenge (M2) — Bargeld, Sichteinlagen, Spareinlagen, Geldmarktfonds. Monetaristischer Indikator: M2-Wachstum korreliert mit Assetpreis-Inflation (12-18 Monate Vorlauf) und CPI-Inflation (18-24 Monate Vorlauf). Nach der massiven M2-Expansion 2020-21 (COVID-Stimulus) und anschließender Kontraktion 2022-23 ist der M2-Trend ein struktureller Indikator für die Liquiditätsumgebung.',
    hot: 'M2 steigt (Geldmenge expandiert). Kette: mehr Geld im System → Liquidität steigt → Assetpreise steigen → DBC (20.3%) profitiert (Commodities als realer Asset von Geldmengenexpansion) → GLD (16.9%) profitiert (klassischer Geldmengen-Hedge) → HYG (28.8%) profitiert (mehr Liquidität = engere Spreads) → XLU (18.0%) profitiert (Bewertungsmultiples steigen). Querverweis: M2-Wachstum + Net Liquidity (unser Liquiditätsindikator) korrelieren.',
    cold: 'M2 fällt (Geldmenge kontrahiert). Kette: weniger Geld im System → Liquidität sinkt → Assetpreise unter Druck → alle Risk-Assets leiden → HYG (28.8%) unter Spread-Druck (Liquidität ist der Lebenssaft der Kreditmärkte) → GLD (16.9%) gemischt (Liquiditätsentzug negativ, aber Flight to Quality positiv) → DBC (20.3%) unter Nachfrage-Druck. Historisch: M2 YoY negativ = extremes Warnsignal (zuletzt 2023, davor Great Depression 1930er).',
    portfolio: 'Struktureller Indikator — Trend über 6-12 Monate wichtiger als Einzelmonat. HYG (28.8%): M2-Kontraktion trocknet Kreditliquidität aus. GLD (16.9%) und DBC (20.3%): M2-Expansion ist der stärkste Langfristtreiber. Querverweis: M2 + Fed Balance Sheet + Reverse Repo = Liquiditäts-Trifecta (unser Net Liquidity Indikator aggregiert diese).',
  },
  'Redbook': {
    what: 'Redbook Index — wöchentlicher Same-Store Retail Sales Vergleich zum Vorjahr. Höchstfrequenter Konsumindikator (jeden Dienstag). Repräsentiert ~9000 US-Filialen. Als wöchentlicher Proxy für die monatlichen offiziellen Retail Sales nützlich, aber mit eingeschränkter Breite (nicht alle Retailer, kein E-Commerce).',
    hot: 'Redbook über Vorjahr und Trend steigend. Kette: Konsumenten geben mehr aus → bestätigt robuste Retail Sales → HYG (28.8%) Consumer-Emittenten profitieren → XLP (16.1%) underperformt relativ (Discretionary stärker). Einzelwoche wenig aussagekräftig.',
    cold: 'Redbook unter Vorjahr oder stark fallend. Kette: Konsumenten werden vorsichtig → Preview für schwache Retail Sales → HYG (28.8%) Consumer-Emittenten unter Druck wenn Trend anhält → XLP (16.1%) profitiert relativ (Staples resilienter als Discretionary).',
    portfolio: 'Niedriger direkter Impact wegen beschränkter Repräsentativität. Nützlich als wöchentlicher Pulsmesser zwischen den monatlichen Retail Sales Reports. HYG (28.8%): nur bei persistentem Trend relevant. Querverweis: Redbook Trend + Consumer Confidence + Retail Sales = Konsum-Dreieck.',
  },
  'Chicago PMI': {
    what: 'Chicago Purchasing Managers Index (Chicago Business Barometer) — regionaler Industrieindex für den Großraum Chicago. Über 50 = Expansion, unter 50 = Kontraktion. Historisch einer der zuverlässigsten ISM-Previews (Korrelation >0.8). Erscheint am letzten Geschäftstag des Monats, einen Tag vor dem ISM. Enthält Manufacturing und einige Service-Komponenten.',
    hot: 'Über 50 und über Konsens. Kette: Chicago-Industrie expandiert → ISM Manufacturing wird voraussichtlich stark → DBC (20.3%) Nachfrage-Ausblick verbessert sich → HYG (28.8%) Industrieemittenten profitieren. Als letzter Datenpunkt vor dem ISM oft marktbewegend wenn er stark von Erwartungen abweicht.',
    cold: 'Unter 50 und unter Konsens. Kette: Chicago-Industrie kontrahiert → ISM Manufacturing voraussichtlich schwach → DBC (20.3%) unter Nachfrage-Druck → HYG (28.8%) Industrieemittenten exponiert. Unter 40 = historisch tiefe Kontraktion. Querverweis: Chicago PMI + Empire State (NY) + Philly Fed im selben Monat bilden die ISM-Projektion.',
    portfolio: 'Primär als ISM-Preview nutzen. DBC (20.3%): über ISM-Erwartungskanal relevant. Querverweis: Chicago PMI am Monatsende → ISM Manufacturing am nächsten Tag → die Kombination gibt das früheste Gesamtbild.',
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
  if (direction === 'HOT' || direction === 'HAWKISH' || direction === 'STRONG') return exp.hot;
  if (direction === 'COLD' || direction === 'DOVISH' || direction === 'WEAK') return exp.cold;
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
