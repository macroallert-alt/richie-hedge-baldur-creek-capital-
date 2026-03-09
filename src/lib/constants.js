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

// ===== REGIME → COLOR (Spec §4.2) =====
export const REGIME_COLORS = {
  EXPANSION: COLORS.signalGreen,
  RISK_ON: COLORS.signalGreen,
  BROAD_RISK_ON: COLORS.signalGreen,
  SELECTIVE: COLORS.signalGreen,
  TRANSITION: COLORS.signalYellow,
  NEUTRAL: COLORS.signalYellow,
  CONFLICTED: COLORS.signalYellow,
  CONTRACTION: COLORS.signalOrange,
  RISK_OFF: COLORS.signalOrange,
  BROAD_RISK_OFF: COLORS.signalOrange,
  CRISIS: COLORS.signalRed,
  RISK_OFF_FORCED: COLORS.signalRed,
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
  { id: 'cio', name: 'CIO', icon: 'FileText', route: '/cio' },
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
