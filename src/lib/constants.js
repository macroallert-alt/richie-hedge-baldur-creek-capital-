// ===== COLORS (Spec §1.4) =====
export const COLORS = {
  navyDeep: '#0A1628',
  iceWhite: '#E2E8F0',
  mutedBlue: '#8B9DC3',
  fadedBlue: '#4A5A7A',
  baldurBlue: '#3B82F6',
  signalGreen: '#22C55E',
  signalYellow: '#EAB308',
  signalOrange: '#F97316',
  signalRed: '#EF4444',
};

// ===== REGIME → COLOR (12 offizielle V16 Macro States) =====
export const REGIME_COLORS = {
  // Expansiv (Grün)
  FULL_EXPANSION: COLORS.signalGreen,
  STEADY_GROWTH: COLORS.signalGreen,
  REFLATION: COLORS.signalGreen,
  EARLY_RECOVERY: COLORS.signalGreen,
  // Selektiv (Gelb)
  FRAGILE_EXPANSION: COLORS.signalYellow,
  LATE_EXPANSION: COLORS.signalYellow,
  NEUTRAL: COLORS.signalYellow,
  SOFT_LANDING: COLORS.signalYellow,
  // Defensiv (Orange)
  STRESS_ELEVATED: COLORS.signalOrange,
  CONTRACTION: COLORS.signalOrange,
  DEEP_CONTRACTION: COLORS.signalOrange,
  // Krise (Rot)
  FINANCIAL_CRISIS: COLORS.signalRed,
};

// ===== RISK AMPEL → COLOR (Spec §4.5) =====
export const RISK_AMPEL_COLORS = {
  GREEN: COLORS.signalGreen,
  YELLOW: COLORS.signalYellow,
  ORANGE: COLORS.signalOrange,
  RED: COLORS.signalRed,
};

// ===== BRIEFING TYPE → COLOR (Spec §4.4) =====
export const BRIEFING_COLORS = {
  ROUTINE: COLORS.signalGreen,
  WATCH: COLORS.signalYellow,
  ACTION: COLORS.signalRed,
};

// ===== SEVERITY → COLOR (Spec §1.7) =====
export const SEVERITY_COLORS = {
  EMERGENCY: COLORS.signalRed,
  CRITICAL: COLORS.signalOrange,
  WARNING: COLORS.signalYellow,
  MONITOR: COLORS.mutedBlue,
};

// ===== URGENCY → COLOR =====
export const URGENCY_COLORS = {
  TODAY: COLORS.signalRed,
  THIS_WEEK: COLORS.signalYellow,
  REVIEW: COLORS.baldurBlue,
  WATCH: COLORS.mutedBlue,
};

// ===== DIRECTION → DISPLAY =====
export const DIRECTION_DISPLAY = {
  IMPROVING: { arrow: '↑', color: COLORS.signalGreen },
  STABLE: { arrow: '→', color: COLORS.mutedBlue },
  DETERIORATING: { arrow: '↓', color: COLORS.signalRed },
  RISING: { arrow: '↑', color: COLORS.signalGreen },
  FALLING: { arrow: '↓', color: COLORS.signalRed },
};

// ===== G7 STATUS → COLOR (Spec §4.10) =====
export const G7_REGIME_COLORS = {
  STABLE: COLORS.signalGreen,
  SHIFTING: COLORS.signalYellow,
  ELEVATED_RISK: COLORS.signalOrange,
  STRUCTURAL_BREAK: COLORS.signalRed,
};

// ===== FRAGILITY → COLOR =====
export const FRAGILITY_COLORS = {
  NORMAL: COLORS.signalGreen,
  ELEVATED: COLORS.signalYellow,
  EXTREME: COLORS.signalRed,
};

// ===== EXECUTION LEVEL → COLOR (Spec §21.3) =====
export const EXECUTION_LEVEL_COLORS = {
  EXECUTE: COLORS.signalGreen,
  CAUTION: COLORS.signalYellow,
  WAIT: COLORS.signalOrange,
  HOLD: COLORS.signalRed,
};

// ===== EXECUTION LEVEL → BG CLASSES (Spec §21.3) =====
export const EXECUTION_LEVEL_BG = {
  EXECUTE: 'bg-signal-green/20 border-signal-green/40',
  CAUTION: 'bg-signal-yellow/20 border-signal-yellow/40',
  WAIT: 'bg-signal-orange/20 border-signal-orange/40',
  HOLD: 'bg-signal-red/20 border-signal-red/40',
};

// ===== EXECUTION LEVEL → TEXT CLASSES =====
export const EXECUTION_LEVEL_TEXT = {
  EXECUTE: 'text-signal-green',
  CAUTION: 'text-signal-yellow',
  WAIT: 'text-signal-orange',
  HOLD: 'text-signal-red',
};

// ===== SCORE → COLOR (Spec §4.8) =====
export function getScoreColor(score) {
  if (score > 6.5) return COLORS.signalGreen;
  if (score >= 3.5) return COLORS.signalYellow;
  return COLORS.signalRed;
}

// ===== DRAWDOWN → COLOR (Spec §4.2) =====
export function getDrawdownColor(dd) {
  if (dd > -3) return COLORS.signalGreen;
  if (dd >= -7) return COLORS.signalYellow;
  return COLORS.signalRed;
}

// ===== STABILITY → COLOR (Spec §4.8) =====
export function getStabilityColor(pct) {
  if (pct > 75) return COLORS.signalGreen;
  if (pct >= 50) return COLORS.signalYellow;
  return COLORS.signalRed;
}

// ===== DIMENSION SCORE → COLOR (Spec §21.7) =====
export function getDimensionScoreColor(score) {
  if (score === 0) return COLORS.signalGreen;
  if (score === 1) return COLORS.signalYellow;
  if (score === 2) return COLORS.signalOrange;
  return COLORS.signalRed;
}

// ===== EVENT IMPACT → COLOR (Spec §21.8) =====
export const EVENT_IMPACT_COLORS = {
  HIGH: COLORS.signalRed,
  MEDIUM: COLORS.signalYellow,
};

// ===== LAYER SHORT NAMES (Spec §4.8) =====
export const LAYER_SHORT_NAMES = {
  L1_global_liquidity: 'L1 Liquidity',
  L2_us_monetary: 'L2 Monetary',
  L3_credit_spreads: 'L3 Credit',
  L4_equity_internals: 'L4 Eq.Internals',
  L5_macro_leading: 'L5 Macro',
  L6_volatility_regime: 'L6 Volatility',
  L7_intermarket: 'L7 Intermarket',
  L8_sentiment_positioning: 'L8 Sentiment',
};

// ===== LAYER FULL NAMES (Spec §5.6) =====
export const LAYER_FULL_NAMES = {
  L1_global_liquidity: 'L1 GLOBAL LIQUIDITY',
  L2_us_monetary: 'L2 US MONETARY',
  L3_credit_spreads: 'L3 CREDIT SPREADS',
  L4_equity_internals: 'L4 EQUITY INTERNALS',
  L5_macro_leading: 'L5 MACRO LEADING',
  L6_volatility_regime: 'L6 VOLATILITY REGIME',
  L7_intermarket: 'L7 INTERMARKET',
  L8_sentiment_positioning: 'L8 SENTIMENT & POSITIONING',
};

// ===== DIMENSION SHORT NAMES (Spec §21.7) =====
export const DIMENSION_SHORT_NAMES = {
  event_risk: 'Event Risk',
  positioning_conflict: 'Positioning',
  liquidity_risk: 'Liquidity',
  cross_asset_confirmation: 'Cross-Asset',
  gex_regime: 'GEX Regime',
  sentiment_extreme: 'Sentiment',
};

// ===== TOOL CALL LABELS (Spec §6.6) =====
export const TOOL_LABELS = {
  get_dashboard: 'Lade System-Status',
  get_stock_data: 'Lade Aktiendaten',
  get_options_chain: 'Lade Options Chain',
  get_fred_data: 'Lade Makro-Daten',
  get_live_snapshot: 'Prüfe Live-Kurse',
  web_search: 'Durchsuche Web',
  calculate_position_impact: 'Berechne Portfolio-Impact',
  run_what_if: 'Simuliere Stress-Szenario',
  save_decision: 'Speichere Entscheidung',
  update_decision: 'Aktualisiere Journal',
  read_sheet: 'Lese Sheet-Daten',
};

// ===== TIMING (Spec §2.5) =====
export const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
export const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours
export const CRITICAL_STALE_THRESHOLD_MS = 48 * 60 * 60 * 1000; // 48 hours

// ===== CLUSTER MAPPING (Rotation Circle Spec §2.1) =====
export const CLUSTER_MAP = {
  PM:       { name: 'Precious Metals',         assets: ['GLD','SLV','GDX','GDXJ','SIL'] },
  EQ_CYCL:  { name: 'Cyclical Equities',       assets: ['SPY','XLY','XLI','XLF','XLE','IWM'] },
  EQ_DEFN:  { name: 'Defensive Equities',      assets: ['XLV','XLP','XLU','VNQ'] },
  EQ_GROW:  { name: 'Growth Equities',          assets: ['XLK'] },
  EQ_INTL:  { name: 'International Equities',   assets: ['EEM','VGK'] },
  BOND:     { name: 'Government & IG Bonds',    assets: ['TLT','TIP','LQD'] },
  CREDIT:   { name: 'High Yield Credit',        assets: ['HYG'] },
  COMMOD:   { name: 'Commodities',              assets: ['DBC'] },
  CRYPTO:   { name: 'Crypto',                   assets: ['BTC','ETH'] },
};

// Reverse lookup: Ticker → Cluster Key
export const ASSET_TO_CLUSTER = Object.fromEntries(
  Object.entries(CLUSTER_MAP).flatMap(([key, { assets }]) =>
    assets.map(a => [a, key])
  )
);

// Cluster → Display Color (fuer Balken, Charts, Badges)
export const CLUSTER_COLORS = {
  PM:       '#FFD700',  // Gold
  EQ_CYCL:  '#3B82F6',  // Blue
  EQ_DEFN:  '#8B9DC3',  // Muted Blue
  EQ_GROW:  '#06B6D4',  // Cyan
  EQ_INTL:  '#A855F7',  // Purple
  BOND:     '#6B7280',  // Gray
  CREDIT:   '#F97316',  // Orange
  COMMOD:   '#84CC16',  // Lime
  CRYPTO:   '#EC4899',  // Pink
};

// Helper: Ticker → Display String "HYG — High Yield Credit"
export function getAssetLabel(ticker) {
  const cluster = ASSET_TO_CLUSTER[ticker];
  if (!cluster) return ticker;
  return `${ticker} — ${CLUSTER_MAP[cluster].name}`;
}

// Helper: Ticker → Kompakt-Label "HYG (Credit)"
export function getAssetLabelShort(ticker) {
  const cluster = ASSET_TO_CLUSTER[ticker];
  if (!cluster) return ticker;
  const shortName = CLUSTER_MAP[cluster].name.split(' ').pop();
  return `${ticker} (${shortName})`;
}

// ===== ROTATION STATUS COLORS (Rotation Circle Spec §4.3) =====
export const ROTATION_STATUS_COLORS = {
  ALIGNED:      COLORS.signalGreen,
  SHIFTING:     COLORS.signalYellow,
  BIG_ROTATION: COLORS.signalRed,
};

// ===== MATERIALITY THRESHOLDS (Rotation Circle Spec §4.5) =====
export const MATERIALITY_THRESHOLDS = {
  GREEN:  0.02,  // < 2pp
  YELLOW: 0.05,  // 2-5pp
  ORANGE: 0.10,  // 5-10pp
  RED:    0.10,  // > 10pp
};

export function getMaterialityColor(deltaPp) {
  const abs = Math.abs(deltaPp);
  if (abs < 0.02) return COLORS.signalGreen;
  if (abs < 0.05) return COLORS.signalYellow;
  if (abs < 0.10) return COLORS.signalOrange;
  return COLORS.signalRed;
}

export function getMaterialityLabel(deltaPp) {
  const abs = Math.abs(deltaPp);
  if (abs < 0.02) return 'GREEN';
  if (abs < 0.05) return 'YELLOW';
  if (abs < 0.10) return 'ORANGE';
  return 'RED';
}

// ===== CIRCLE DEFINITIONS (Spec §5.1, Rotation Circle Spec §2.6) =====
export const CIRCLES = [
  { id: 'dashboard', name: 'Home', icon: 'LayoutDashboard', route: '/dashboard' },
  { id: 'command-center', name: 'CC', icon: 'Radar', route: '/command-center' },
  { id: 'cio', name: 'CIO', icon: 'FileText', route: '/cio' },
  { id: 'briefing', name: 'Briefing', icon: 'Newspaper', route: '/briefing' },
  { id: 'risk', name: 'Risk', icon: 'Shield', route: '/risk' },
  { id: 'signals', name: 'Signals', icon: 'Radio', route: '/signals' },
  { id: 'portfolio', name: 'Portfolio', icon: 'PieChart', route: '/portfolio' },
  { id: 'rotation', name: 'Rotation', icon: 'RefreshCw', route: '/rotation' },
  { id: 'trading-desk', name: 'Trading', icon: 'Briefcase', route: '/trading-desk' },
  { id: 'layers', name: 'Layers', icon: 'BarChart3', route: '/layers' },
  { id: 'f6', name: 'F6', icon: 'Target', route: '/f6' },
  { id: 'intel', name: 'Intel', icon: 'Search', route: '/intel' },
  { id: 'g7', name: 'G7', icon: 'Globe', route: '/g7' },
  { id: 'disruptions', name: 'Disruptions', icon: 'Zap', route: '/disruptions' },
  { id: 'cycles', name: 'Cycles', icon: 'TrendingUp', route: '/cycles' },
  { id: 'secular', name: 'Säkulare', icon: 'Activity', route: '/secular' },
  { id: 'theses', name: 'Thesen', icon: 'Lightbulb', route: '/theses' },
  { id: 'crypto', name: 'Crypto', icon: 'Bitcoin', route: '/crypto' },
];

// ===== DISRUPTION PHASE → COLOR =====
export const DISRUPTION_PHASE_COLORS = {
  EMERGING: COLORS.mutedBlue,
  ACCELERATING: COLORS.signalYellow,
  MATURING: COLORS.signalOrange,
  MAINSTREAM: COLORS.signalGreen,
  DEAD_ZONE: COLORS.fadedBlue,
};

// ===== DISRUPTION STATUS → COLOR =====
export const DISRUPTION_STATUS_COLORS = {
  ACTIVE: COLORS.signalGreen,
  WATCH: COLORS.signalYellow,
  PARKED: COLORS.fadedBlue,
  ARCHIVED: COLORS.mutedBlue,
};

// ===== READINESS SCORE → COLOR =====
export function getReadinessColor(score) {
  if (score > 80) return COLORS.signalGreen;
  if (score >= 50) return COLORS.signalYellow;
  return COLORS.signalRed;
}

// ===== THREAT LEVEL → COLOR =====
export const DISRUPTION_THREAT_COLORS = {
  NONE: COLORS.mutedBlue,
  LOW: COLORS.signalGreen,
  MEDIUM: COLORS.signalYellow,
  HIGH: COLORS.signalOrange,
  CRITICAL: COLORS.signalRed,
};

// ===== CONTRARIAN ALERT LEVEL → COLOR =====
export const DISRUPTION_ALERT_COLORS = {
  STRONG: COLORS.signalGreen,
  MODERATE: COLORS.signalYellow,
  WEAK: COLORS.mutedBlue,
};

// =====================================================================
// PHASE A — DISRUPTIONS ERWEITERUNG (Spec TEIL 1-5)
// =====================================================================

// ===== CONVICTION LEVEL → COLOR (Spec §3.5 / §7.4) =====
export const CONVICTION_COLORS = {
  HIGH: COLORS.signalGreen,
  MEDIUM: COLORS.signalYellow,
  LOW: COLORS.signalRed,
};

// ===== ASYMMETRY RATIO → COLOR (Spec §3.5) =====
export function getAsymmetryColor(ratio) {
  if (ratio > 3.0) return COLORS.signalGreen;
  if (ratio >= 2.0) return COLORS.signalYellow;
  return COLORS.mutedBlue;
}

// ===== DECISION STATUS → COLOR (Spec §3.5) =====
export const DECISION_STATUS_COLORS = {
  EXECUTE: COLORS.signalGreen,
  WATCH_FOR_TRIGGER: COLORS.signalYellow,
  HOLD: COLORS.baldurBlue,
  AVOID: COLORS.signalRed,
};

// ===== SECOND ORDER CONFIDENCE → COLOR (Spec §5.4) =====
export const CONFIDENCE_COLORS = {
  HIGH: COLORS.signalGreen,
  MEDIUM: COLORS.signalYellow,
  LOW: COLORS.mutedBlue,
};

// ===== EFFECT DIRECTION → DISPLAY (Spec §5.4) =====
export const EFFECT_DIRECTION_DISPLAY = {
  BULLISH: { arrow: '\u2191', color: COLORS.signalGreen },
  BEARISH: { arrow: '\u2193', color: COLORS.signalRed },
};

// ===== CROWDING ALERT LEVEL → COLOR (Spec §6.4) =====
export const CROWDING_ALERT_COLORS = {
  DANGER: COLORS.signalRed,
  WARNING: COLORS.signalOrange,
  ELEVATED: COLORS.signalYellow,
};

// ===== ASYMMETRY RATIO LABEL → COLOR (Spec §9.4) =====
export const ASYMMETRY_LABEL_COLORS = {
  EXCEPTIONAL: COLORS.signalGreen,
  EXCELLENT: COLORS.signalGreen,
  GOOD: COLORS.signalYellow,
  MARGINAL: COLORS.signalOrange,
  UNFAVORABLE: COLORS.signalRed,
};

// ===== G7 CROSS-REFERENCE RELATIONSHIP → COLOR (Spec §23.5) =====
export const G7_RELATIONSHIP_COLORS = {
  ACCELERATES: COLORS.signalGreen,
  AMPLIFIES: COLORS.signalGreen,
  ENABLES: COLORS.signalGreen,
  DECELERATES: COLORS.signalRed,
  DISRUPTS: COLORS.signalRed,
};

// =====================================================================
// CYCLES CIRCLE (Cycles Circle Spec §11.4)
// =====================================================================

// ===== CYCLE ALIGNMENT → COLOR =====
export const CYCLE_ALIGNMENT_COLORS = {
  ALIGNED:  COLORS.signalGreen,
  SHIFTING: COLORS.signalYellow,
  DIVERGED: COLORS.signalRed,
};

// ===== CYCLE PHASE → COLOR =====
export const CYCLE_PHASE_COLORS = {
  // Expansive (Green)
  EXPANSION:       COLORS.signalGreen,
  EARLY_RECOVERY:  COLORS.signalGreen,
  RECOVERY:        COLORS.signalGreen,
  MID_BULL:        COLORS.signalGreen,
  EARLY_BULL:      COLORS.signalGreen,
  EARLY_STIMULUS:  COLORS.signalGreen,
  EASING:          COLORS.signalGreen,
  NEUTRAL:         COLORS.signalGreen,
  PRE_ELECTION:    COLORS.signalGreen,
  // Selective (Yellow)
  LATE_EXPANSION:  COLORS.signalYellow,
  PEAK:            COLORS.signalYellow,
  PLATEAU:         COLORS.signalYellow,
  LATE:            COLORS.signalYellow,
  OVERINVESTMENT:  COLORS.signalYellow,
  TIGHTENING:      COLORS.signalYellow,
  RESTRICTIVE:     COLORS.signalYellow,
  MIDTERM:         COLORS.signalYellow,
  POST_INAUGURATION: COLORS.signalYellow,
  ELECTION:        COLORS.signalYellow,
  PRE_PIVOT:       COLORS.signalYellow,
  WITHDRAWAL:      COLORS.signalYellow,
  PIVOT:           COLORS.signalYellow,
  REPAIR:          COLORS.signalYellow,
  // Defensive (Orange)
  CONTRACTION:     COLORS.signalOrange,
  DETERIORATION:   COLORS.signalOrange,
  STRENGTHENING:   COLORS.signalOrange,
  WEAKENING:       COLORS.signalOrange,
  BEAR:            COLORS.signalOrange,
  // Crisis (Red)
  TROUGH:          COLORS.signalRed,
  DISTRESS:        COLORS.signalRed,
  RECESSION:       COLORS.signalRed,
  COLLAPSE:        COLORS.signalRed,
  EUPHORIA:        COLORS.signalRed,
};

// ===== CYCLE TIER → COLOR =====
export const CYCLE_TIER_COLORS = {
  1: COLORS.signalGreen,
  2: COLORS.signalYellow,
  3: COLORS.mutedBlue,
};

// ===== CYCLE DATA QUALITY → COLOR =====
export const CYCLE_DATA_QUALITY_COLORS = {
  GOOD:         COLORS.signalGreen,
  LIMITED:      COLORS.signalYellow,
  INSUFFICIENT: COLORS.signalRed,
};

// ===== DANGER ZONE SEVERITY → COLOR =====
export const DANGER_ZONE_COLORS = {
  EXTREME:              COLORS.signalRed,
  DANGER:               COLORS.signalRed,
  ELEVATED:             COLORS.signalOrange,
  RAPID_DETERIORATION:  COLORS.signalOrange,
  RECESSION_RISK:       COLORS.signalRed,
  SEVERE:               COLORS.signalRed,
  HIGHLY_RESTRICTIVE:   COLORS.signalRed,
  RECESSION_SIGNAL:     COLORS.signalRed,
  TRADE_COLLAPSE:       COLORS.signalRed,
  DEMAND_COLLAPSE:      COLORS.signalRed,
  EUPHORIA:             COLORS.signalYellow,
  WEAK_PERIOD:          COLORS.signalYellow,
  EARNINGS_RECESSION:   COLORS.signalOrange,
};

// =====================================================================
// CRYPTO CIRCLE (Circle 17 — V8+Warn System)
// =====================================================================

// ===== CRYPTO ENSEMBLE LEVEL → COLOR =====
export function getCryptoEnsembleColor(ensemble) {
  if (ensemble >= 1.00) return COLORS.signalGreen;
  if (ensemble >= 0.75) return COLORS.signalGreen;
  if (ensemble >= 0.50) return COLORS.signalYellow;
  if (ensemble >= 0.25) return COLORS.signalOrange;
  return COLORS.signalRed;
}

// ===== CRYPTO TRICKLE-DOWN PHASE → COLOR + LABEL =====
export const CRYPTO_PHASE_COLORS = {
  1: COLORS.signalGreen,    // BTC_FIRST
  2: COLORS.baldurBlue,     // NEUTRAL_FLOW
  3: COLORS.signalYellow,   // ALT_ROTATION
  4: COLORS.signalRed,      // ALT_OVERHEATED
};

export const CRYPTO_PHASE_NAMES = {
  1: 'BTC_FIRST',
  2: 'NEUTRAL_FLOW',
  3: 'ALT_ROTATION',
  4: 'ALT_OVERHEATED',
};

export const CRYPTO_PHASE_LABELS = {
  1: 'BTC First — Kapital fließt in BTC',
  2: 'Neutral Flow — Kein klarer Fluss',
  3: 'Alt Rotation — Kapital rotiert in Alts',
  4: 'Alt Overheated — Altseason überhitzt',
};

// ===== CRYPTO TIER WEIGHTS PER PHASE =====
export const CRYPTO_TIER_WEIGHTS = {
  1: { BTC: 0.70, ETH: 0.25, SOL: 0.05 },
  2: { BTC: 0.45, ETH: 0.35, SOL: 0.20 },
  3: { BTC: 0.25, ETH: 0.35, SOL: 0.40 },
  4: { BTC: 0.25, ETH: 0.35, SOL: 0.40 },
};

// ===== CRYPTO ASSET COLORS (for charts/bars) =====
export const CRYPTO_ASSET_COLORS = {
  BTC: '#F7931A',   // Bitcoin Orange
  ETH: '#627EEA',   // Ethereum Blue
  SOL: '#9945FF',   // Solana Purple
  CASH: COLORS.fadedBlue,
};

// ===== CRYPTO ACTION → COLOR =====
export const CRYPTO_ACTION_COLORS = {
  REBALANCE: COLORS.signalYellow,
  HOLD: COLORS.signalGreen,
};

// ===== CRYPTO ALERT SEVERITY → COLOR =====
export const CRYPTO_ALERT_SEVERITY_COLORS = {
  HIGH: COLORS.signalRed,
  MEDIUM: COLORS.signalOrange,
  LOW: COLORS.signalYellow,
};

// =====================================================================
// COMMAND CENTER (Circle 18 — System Command Center)
// =====================================================================

// ===== ALERT LEVEL → COLOR =====
export const CC_ALERT_LEVEL_COLORS = {
  CRITICAL: COLORS.signalRed,
  HIGH: COLORS.signalOrange,
  MODERATE: COLORS.signalYellow,
  ELEVATED: COLORS.signalYellow,
  LOW: COLORS.signalGreen,
};

// ===== DIVERGENCE SIGNAL → COLOR =====
export const CC_DIVERGENCE_SIGNAL_COLORS = {
  EXTREME: COLORS.signalRed,
  EXTREME_UNCONFIRMED: COLORS.signalOrange,
  ELEVATED: COLORS.signalYellow,
  MODERATE: COLORS.mutedBlue,
  NORMAL: COLORS.signalGreen,
  UNAVAILABLE: COLORS.fadedBlue,
};

// ===== LIQUIDITY DIRECTION → COLOR =====
export const CC_LIQUIDITY_COLORS = {
  EXPANDING: COLORS.signalGreen,
  BOTTOMING: COLORS.signalGreen,
  FLAT: COLORS.signalYellow,
  DECELERATING: COLORS.signalOrange,
  CONTRACTING: COLORS.signalRed,
};

// ===== MULTI-SIGNAL LEVEL → COLOR =====
export const CC_MULTI_SIGNAL_COLORS = {
  CRITICAL: COLORS.signalRed,
  WARNING: COLORS.signalOrange,
  NORMAL: COLORS.signalGreen,
};

// ===== LIQ-KOMBI SIGNAL → COLOR =====
export const CC_LIQ_KOMBI_COLORS = {
  CRITICAL: COLORS.signalRed,
  WARNING: COLORS.signalOrange,
  NORMAL: COLORS.signalGreen,
  UNAVAILABLE: COLORS.fadedBlue,
};

// ===== CONVERGENCE LEVEL → COLOR =====
export const CC_CONVERGENCE_COLORS = {
  CONVERGENCE_WARNING: COLORS.signalRed,
  CONVERGENCE_WATCH: COLORS.signalYellow,
  NORMAL: COLORS.signalGreen,
};

// ===== REGRET RECOMMENDATION → COLOR =====
export const CC_REGRET_COLORS = {
  'HANDELN EMPFOHLEN': COLORS.signalRed,
  'HEDGING ERWÄGEN': COLORS.signalOrange,
  'BEOBACHTEN': COLORS.signalYellow,
  'ERHÖHTE WACHSAMKEIT': COLORS.signalYellow,
};

// ===== MARKET REACTION → COLOR =====
export const CC_REACTION_COLORS = {
  ABSORBED: COLORS.signalGreen,
  REJECTED: COLORS.signalRed,
  AS_EXPECTED: COLORS.mutedBlue,
};

// ===== SURPRISE DIRECTION → COLOR =====
export const CC_SURPRISE_COLORS = {
  HOT: COLORS.signalRed,
  COLD: COLORS.signalGreen,
  STRONG: COLORS.signalGreen,
  WEAK: COLORS.signalRed,
  HAWKISH: COLORS.signalRed,
  DOVISH: COLORS.signalGreen,
  INLINE: COLORS.mutedBlue,
  ABOVE: COLORS.signalYellow,
  BELOW: COLORS.signalYellow,
};

// ===== CU/AU SIGNAL → COLOR =====
export const CC_CU_AU_COLORS = {
  BEARISH: COLORS.signalRed,
  BULLISH: COLORS.signalGreen,
  NEUTRAL: COLORS.mutedBlue,
  UNAVAILABLE: COLORS.fadedBlue,
};

// ===== VIX SIGNAL → COLOR =====
export const CC_VIX_COLORS = {
  CONFIRMATION: COLORS.signalRed,
  WATCH: COLORS.signalOrange,
  NORMAL: COLORS.signalGreen,
  UNAVAILABLE: COLORS.fadedBlue,
};
