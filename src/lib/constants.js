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

// ===== G7 REGIME → COLOR (Spec §4.10) =====
export const G7_REGIME_COLORS = {
  R1: COLORS.signalGreen,
  R2: COLORS.signalYellow,
  R3: COLORS.signalOrange,
  R4: COLORS.signalRed,
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
};

// ===== TIMING (Spec §2.5) =====
export const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
export const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours
export const CRITICAL_STALE_THRESHOLD_MS = 48 * 60 * 60 * 1000; // 48 hours

// ===== CIRCLE DEFINITIONS (Spec §5.1) =====
export const CIRCLES = [
  { id: 'dashboard', name: 'Home', icon: 'LayoutDashboard', route: '/dashboard' },
  { id: 'cio', name: 'CIO', icon: 'FileText', route: '/cio' },
  { id: 'risk', name: 'Risk', icon: 'Shield', route: '/risk' },
  { id: 'signals', name: 'Signals', icon: 'Radio', route: '/signals' },
  { id: 'trading-desk', name: 'Trading', icon: 'Briefcase', route: '/trading-desk' },
  { id: 'layers', name: 'Layers', icon: 'BarChart3', route: '/layers' },
  { id: 'portfolio', name: 'Portfolio', icon: 'PieChart', route: '/portfolio' },
  { id: 'f6', name: 'F6', icon: 'Target', route: '/f6' },
  { id: 'intel', name: 'Intel', icon: 'Search', route: '/intel' },
  { id: 'g7', name: 'G7', icon: 'Globe', route: '/g7' },
];
