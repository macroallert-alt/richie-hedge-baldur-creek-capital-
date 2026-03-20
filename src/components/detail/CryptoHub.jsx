'use client';

import { useState, useEffect, useCallback } from 'react';
import { FileText, Radio, TrendingUp, RefreshCw, PieChart, Coins } from 'lucide-react';
import GlassCard from '@/components/shared/GlassCard';
import {
  COLORS,
  getCryptoEnsembleColor,
  CRYPTO_PHASE_COLORS,
  CRYPTO_PHASE_NAMES,
  CRYPTO_PHASE_LABELS,
  CRYPTO_TIER_WEIGHTS,
  CRYPTO_ASSET_COLORS,
  CRYPTO_ACTION_COLORS,
  CRYPTO_ALERT_SEVERITY_COLORS,
} from '@/lib/constants';

// ═══════════════════════════════════════════════════════
// DATA URLS
// ═══════════════════════════════════════════════════════

const STATE_URL = process.env.NEXT_PUBLIC_CRYPTO_STATE_URL;
const DAILY_URL = process.env.NEXT_PUBLIC_CRYPTO_DAILY_URL;
const YIELD_URL = process.env.NEXT_PUBLIC_CRYPTO_YIELD_URL;

// ═══════════════════════════════════════════════════════
// SUB-TAB DEFINITIONS
// ═══════════════════════════════════════════════════════

const TABS = [
  { id: 'cio', label: 'CIO', icon: FileText },
  { id: 'signals', label: 'Signals', icon: Radio },
  { id: 'cycles', label: 'Cycles', icon: TrendingUp },
  { id: 'rotation', label: 'Rotation', icon: RefreshCw },
  { id: 'portfolio', label: 'Portfolio', icon: PieChart },
  { id: 'yield', label: 'Yield', icon: Coins },
];

// ═══════════════════════════════════════════════════════
// YIELD TIER COLORS
// ═══════════════════════════════════════════════════════

const TIER_COLORS = {
  T0: COLORS.fadedBlue,
  T1: COLORS.signalYellow,
  T2: COLORS.signalGreen,
  T3: '#9B59B6',
};

const DEPEG_COLORS = {
  OK: COLORS.signalGreen,
  WARNING: COLORS.signalOrange,
  KILL: COLORS.signalRed,
};

// ═══════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════

function fmtPct(v, d = 1) {
  if (v == null) return '—';
  return `${(Number(v) * 100).toFixed(d)}%`;
}

function fmtUsd(v) {
  if (v == null) return '—';
  return `$${Number(v).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

function fmtDate(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
  catch { return d; }
}

function fmtEur(val) {
  return val.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
}

function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mb-4">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-2 border-b border-white/10">
        <span className="text-label uppercase tracking-wider text-muted-blue">{title}</span>
        <span className="text-caption text-muted-blue">{open ? '▾' : '▸'}</span>
      </button>
      {open && <div className="pt-3">{children}</div>}
    </div>
  );
}

// localStorage helpers
function loadSaved(key, fallback) {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
  catch { return fallback; }
}
function savePersistent(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* noop */ }
}

// ═══════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════

export default function CryptoHub() {
  const [tab, setTab] = useState('cio');
  const [stateData, setStateData] = useState(null);
  const [dailyData, setDailyData] = useState(null);
  const [yieldData, setYieldData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const urls = [
      { url: STATE_URL, setter: setStateData, name: 'state' },
      { url: DAILY_URL, setter: setDailyData, name: 'daily' },
      { url: YIELD_URL, setter: setYieldData, name: 'yield' },
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

  // Use daily data where available (fresher), fall back to weekly state
  const ws = stateData || {};
  const dd = dailyData || {};
  const yd = yieldData || {};

  const btcPrice = dd.btc_price || ws.btc_price;
  const ensemble = dd.ensemble?.daily ?? ws.ensemble?.value ?? null;
  const ensembleWeekly = dd.ensemble?.weekly ?? ws.ensemble?.value ?? null;
  const ensembleChanged = dd.ensemble?.changed ?? false;
  const phase = dd.weekly_signal?.phase ?? ws.trickle_down?.phase ?? 2;
  const phaseName = dd.weekly_signal?.phase_name ?? ws.trickle_down?.phase_name ?? 'NEUTRAL_FLOW';
  const alloc = dd.weekly_signal?.allocation ?? ws.allocation ?? {};
  const action = ws.action || 'HOLD';
  const weights = ws.weights || CRYPTO_TIER_WEIGHTS[phase];
  const mom = {
    '1M': dd.ensemble?.mom_1M ?? ws.ensemble?.mom_1M ?? false,
    '3M': dd.ensemble?.mom_3M ?? ws.ensemble?.mom_3M ?? false,
    '6M': dd.ensemble?.mom_6M ?? ws.ensemble?.mom_6M ?? false,
    '12M': dd.ensemble?.mom_12M ?? ws.ensemble?.mom_12M ?? false,
  };
  const belowWma = dd.bottom_bonus?.active ?? ws.bottom_bonus?.active ?? false;
  const wma200 = dd.bottom_bonus?.wma_200 ?? ws.bottom_bonus?.wma_200;
  const p4Warning = ws.trickle_down?.phase4_warning ?? false;
  const btcD = dd.btc_dominance?.daily ?? ws.trickle_down?.btc_dominance;
  const btcDChange = ws.trickle_down?.btc_d_30d_change;
  const display = ws.display || {};
  const alerts = dd.alerts || [];
  const stateDate = ws.date;
  const dailyDate = dd.date;

  if (!stateData && !dailyData && !loading) {
    return (
      <GlassCard>
        <div className="text-center py-12">
          <p className="text-lg text-muted-blue">Crypto Circle noch nicht gelaufen.</p>
          <p className="text-caption text-muted-blue mt-2">Weekly: Sonntag 05:00 UTC · Daily: nach Step 7</p>
          {error && <p className="text-caption mt-2" style={{ color: COLORS.signalOrange }}>Fehler: {error}</p>}
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-4 pt-2">
      {/* Page Title */}
      <h1 className="text-page-title text-center text-ice-white">Crypto Circle</h1>

      {/* Sub-Tab Navigation — Circle Style */}
      <div className="flex justify-center gap-3 overflow-x-auto pb-1">
        {TABS.map(t => {
          const Icon = t.icon;
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex flex-col items-center gap-1 flex-shrink-0"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
                style={{
                  backgroundColor: isActive ? `${COLORS.baldurBlue}30` : `${COLORS.fadedBlue}15`,
                  border: `2px solid ${isActive ? COLORS.baldurBlue : COLORS.fadedBlue}50`,
                  boxShadow: isActive ? `0 0 12px ${COLORS.baldurBlue}25` : 'none',
                }}
              >
                <Icon size={16} style={{ color: isActive ? COLORS.iceWhite : COLORS.mutedBlue }} />
              </div>
              <span className="text-caption leading-none" style={{
                color: isActive ? COLORS.iceWhite : COLORS.mutedBlue,
                fontSize: '9px',
              }}>
                {t.label}
              </span>
            </button>
          );
        })}
      </div>

      {loading && <div className="text-caption text-muted-blue text-center">Lade Crypto-Daten...</div>}
      {error && <div className="text-caption text-center" style={{ color: COLORS.signalOrange }}>Fehler: {error}</div>}

      {/* Sub-Tab Content */}
      {tab === 'cio' && (
        <CIOTab
          btcPrice={btcPrice} ensemble={ensemble} ensembleWeekly={ensembleWeekly}
          ensembleChanged={ensembleChanged} phase={phase} phaseName={phaseName}
          alloc={alloc} action={action} weights={weights} mom={mom}
          belowWma={belowWma} wma200={wma200} p4Warning={p4Warning}
          btcD={btcD} btcDChange={btcDChange} display={display}
          alerts={alerts} stateDate={stateDate} dailyDate={dailyDate}
          yieldData={yd}
        />
      )}
      {tab === 'signals' && (
        <SignalsTab
          mom={mom} ensemble={ensemble} btcD={btcD} btcDChange={btcDChange}
          phase={phase} phaseName={phaseName} belowWma={belowWma} wma200={wma200}
          btcPrice={btcPrice}
        />
      )}
      {tab === 'cycles' && (
        <CyclesTab display={display} btcPrice={btcPrice} belowWma={belowWma} wma200={wma200} />
      )}
      {tab === 'rotation' && (
        <RotationTab phase={phase} phaseName={phaseName} weights={weights} btcDChange={btcDChange} />
      )}
      {tab === 'portfolio' && (
        <PortfolioTab alloc={alloc} action={action} weights={weights} btcPrice={btcPrice} ws={ws} />
      )}
      {tab === 'yield' && (
        <YieldTab yieldData={yd} alloc={alloc} />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// TAB 1: CIO — Executive Summary + Allokation
// ═══════════════════════════════════════════════════════

function CIOTab({
  btcPrice, ensemble, ensembleWeekly, ensembleChanged, phase, phaseName,
  alloc, action, weights, mom, belowWma, wma200, p4Warning,
  btcD, btcDChange, display, alerts, stateDate, dailyDate,
  yieldData,
}) {
  const ensColor = getCryptoEnsembleColor(ensemble);
  const phaseColor = CRYPTO_PHASE_COLORS[phase] || COLORS.mutedBlue;
  const actionColor = CRYPTO_ACTION_COLORS[action] || COLORS.mutedBlue;

  const onCount = Object.values(mom).filter(Boolean).length;
  const momOnList = Object.entries(mom).filter(([, v]) => v).map(([k]) => k).join(', ');
  const wmaDistance = (btcPrice && wma200) ? ((btcPrice / wma200 - 1) * 100).toFixed(0) : null;
  const cashPct = alloc.cash != null ? (alloc.cash * 100).toFixed(0) : null;

  // Live Yield Data
  const hasYield = yieldData && yieldData.regime;
  const yieldRegime = yieldData?.regime;
  const yieldApy = yieldData?.apy?.weighted_total;
  const tw = yieldData?.tier_weights || {};

  // Scale yield annual to user capital
  const cioCap = parseFloat(loadSaved('bcc_crypto_capital', '') || '0');
  const cioCashEur = cioCap > 0 ? cioCap * (alloc.cash || 0.75) : (yieldData?.inputs?.cash_eur || 0);
  const yieldAnnual = cioCashEur * (yieldApy || 0) / 100;

  return (
    <div className="space-y-4">
      {/* Alerts Banner */}
      {alerts.length > 0 && (
        <div className="rounded-lg border-l-4 px-4 py-3"
          style={{ backgroundColor: `${COLORS.signalRed}15`, borderLeftColor: COLORS.signalRed }}>
          <p className="text-sm font-bold mb-1" style={{ color: COLORS.signalRed }}>
            ⚠ {alerts.length} Alert{alerts.length > 1 ? 's' : ''}
          </p>
          {alerts.map((a, i) => (
            <p key={i} className="text-caption" style={{ color: CRYPTO_ALERT_SEVERITY_COLORS[a.severity] || COLORS.signalOrange }}>
              {a.type}: {a.message || a.description || a.type}
            </p>
          ))}
        </div>
      )}

      {/* Executive Summary Briefing */}
      <GlassCard>
        <div className="flex items-center justify-between mb-3">
          <span className="text-label uppercase tracking-wider text-muted-blue">Executive Summary</span>
          <span className="text-caption text-muted-blue font-mono">
            W: {fmtDate(stateDate)} · D: {fmtDate(dailyDate)}
          </span>
        </div>
        <div className="px-3 py-3 rounded" style={{ backgroundColor: `${ensColor}08`, borderLeft: `3px solid ${ensColor}` }}>
          <div className="text-sm text-ice-white" style={{ lineHeight: '1.9' }}>
            <div className="mb-2">
              <strong style={{ color: CRYPTO_ASSET_COLORS.BTC }}>BTC bei {fmtUsd(btcPrice)}</strong> — Ensemble{' '}
              <strong style={{ color: ensColor }}>{ensemble != null ? ensemble.toFixed(2) : '—'}</strong>{' '}
              ({onCount}/4 Momentum-Signale positiv{momOnList ? `: ${momOnList}` : ''}).{' '}
              {ensembleChanged && <span style={{ color: COLORS.signalOrange }}>⚡ Signal hat sich seit letzter Woche geändert. </span>}
              System hält <strong style={{ color: COLORS.iceWhite }}>{fmtPct(alloc.total)}</strong> investiert.
            </div>

            <div className="mb-2">
              Aufgeteilt in{' '}
              <strong style={{ color: CRYPTO_ASSET_COLORS.BTC }}>BTC {fmtPct(alloc.btc)}</strong>,{' '}
              <strong style={{ color: CRYPTO_ASSET_COLORS.ETH }}>ETH {fmtPct(alloc.eth)}</strong>,{' '}
              <strong style={{ color: CRYPTO_ASSET_COLORS.SOL }}>SOL {fmtPct(alloc.sol)}</strong>.{' '}
              {cashPct && Number(cashPct) > 0 && (
                <>
                  Verbleibende <strong>{cashPct}% Cash</strong>
                  {hasYield ? (
                    <> — Yield Router empfiehlt{' '}
                      <strong style={{ color: TIER_COLORS.T1 }}>{yieldApy?.toFixed(2)}% APY</strong>{' '}
                      ({yieldRegime}, ~{fmtEur(yieldAnnual || 0)}/Jahr).</>
                  ) : (
                    <> — sollten in Stablecoin-Yield deployed werden.</>
                  )}
                </>
              )}
            </div>

            <div className="mb-2">
              <strong style={{ color: phaseColor }}>{CRYPTO_PHASE_LABELS[phase]}</strong>.{' '}
              BTC Dominanz bei {btcD != null ? `${btcD.toFixed(1)}%` : '—'}
              {btcDChange != null && <> ({btcDChange >= 0 ? '+' : ''}{btcDChange.toFixed(1)}pp 30d)</>}.{' '}
              {p4Warning && <span style={{ color: COLORS.signalRed }}>⚠ Altseason-Warnung aktiv — Allokation um 40% reduziert. </span>}
            </div>

            <div className="mb-2">
              200-Wochen-MA bei {fmtUsd(wma200)} —{' '}
              {belowWma ? (
                <strong style={{ color: COLORS.signalOrange }}>BTC UNTER 200WMA → Bottom Bonus aktiv (+50pp Allokation)</strong>
              ) : (
                <span>BTC {wmaDistance}% darüber, kein Bottom Bonus</span>
              )}.
            </div>

            <div>
              Nächstes Rebalancing:{' '}
              <strong style={{ color: actionColor }}>{action}</strong>
              {action === 'HOLD' && ' — alle Positionen innerhalb der NO-ACTION Band (±10pp).'}
              {action === 'REBALANCE' && ' — Positionen adjustieren am Montag nach Signal.'}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Ensemble + Phase Hero */}
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <span className="text-label uppercase tracking-wider text-muted-blue">₿ Crypto Allokation</span>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-caption text-muted-blue mb-1">Ensemble</div>
            <span className="text-4xl font-mono font-bold" style={{ color: ensColor }}>
              {ensemble != null ? ensemble.toFixed(2) : '—'}
            </span>
            {ensembleChanged && (
              <span className="ml-2 px-2 py-0.5 rounded text-xs font-bold"
                style={{ backgroundColor: `${COLORS.signalOrange}20`, color: COLORS.signalOrange }}>
                GEÄNDERT
              </span>
            )}
          </div>
          <div className="text-right">
            <div className="text-caption text-muted-blue mb-1">Phase</div>
            <span className="text-lg font-mono font-bold" style={{ color: phaseColor }}>
              {CRYPTO_PHASE_NAMES[phase] || phaseName}
            </span>
          </div>
        </div>

        {/* Allokation Balken — BTC/ETH/SOL/Cash (Cash bleibt Cash) */}
        <div className="mb-3">
          <div className="text-caption text-muted-blue mb-1">Gesamt-Allokation: {fmtPct(alloc.total)}</div>
          <div className="flex gap-0.5 h-6 rounded-full overflow-hidden">
            {alloc.btc > 0 && <div style={{ flex: alloc.btc, backgroundColor: CRYPTO_ASSET_COLORS.BTC }} title={`BTC ${fmtPct(alloc.btc)}`} />}
            {alloc.eth > 0 && <div style={{ flex: alloc.eth, backgroundColor: CRYPTO_ASSET_COLORS.ETH }} title={`ETH ${fmtPct(alloc.eth)}`} />}
            {alloc.sol > 0 && <div style={{ flex: alloc.sol, backgroundColor: CRYPTO_ASSET_COLORS.SOL }} title={`SOL ${fmtPct(alloc.sol)}`} />}
            {alloc.cash > 0 && <div style={{ flex: alloc.cash, backgroundColor: CRYPTO_ASSET_COLORS.CASH }} title={`Cash ${fmtPct(alloc.cash)}`} />}
          </div>
          <div className="flex justify-between text-caption mt-1">
            <span style={{ color: CRYPTO_ASSET_COLORS.BTC }}>● BTC {fmtPct(alloc.btc)}</span>
            <span style={{ color: CRYPTO_ASSET_COLORS.ETH }}>● ETH {fmtPct(alloc.eth)}</span>
            <span style={{ color: CRYPTO_ASSET_COLORS.SOL }}>● SOL {fmtPct(alloc.sol)}</span>
            <span style={{ color: CRYPTO_ASSET_COLORS.CASH }}>● Cash {fmtPct(alloc.cash)}</span>
          </div>
        </div>

        {/* Cash Yield Deployment — Live from Yield Router */}
        {alloc.cash > 0.01 && (
          <div className="mb-3">
            <div className="text-caption text-muted-blue mb-1">
              Cash Yield-Deployment{hasYield ? ` (${yieldRegime})` : ''}:
            </div>
            <div className="flex gap-0.5 h-4 rounded-full overflow-hidden">
              <div style={{ flex: tw.T0 || 0.30, backgroundColor: TIER_COLORS.T0 }} title={`T0: Liquid ${((tw.T0 || 0.30) * 100).toFixed(0)}%`} />
              <div style={{ flex: tw.T1 || 0.50, backgroundColor: TIER_COLORS.T1 + '80' }} title={`T1: T-Bills ${((tw.T1 || 0.50) * 100).toFixed(0)}%`} />
              <div style={{ flex: tw.T2 || 0.20, backgroundColor: TIER_COLORS.T2 + '60' }} title={`T2: Lending ${((tw.T2 || 0.20) * 100).toFixed(0)}%`} />
            </div>
            <div className="flex justify-between text-caption mt-1" style={{ fontSize: '9px' }}>
              <span style={{ color: TIER_COLORS.T0 }}>● T0 Liquid {((tw.T0 || 0.30) * 100).toFixed(0)}%</span>
              <span style={{ color: TIER_COLORS.T1 }}>● T1 T-Bills {((tw.T1 || 0.50) * 100).toFixed(0)}%</span>
              <span style={{ color: TIER_COLORS.T2 }}>● T2 Lending {((tw.T2 || 0.20) * 100).toFixed(0)}%</span>
            </div>
            {hasYield && (
              <div className="text-caption mt-1 font-mono" style={{ fontSize: '9px', color: TIER_COLORS.T1 }}>
                Gewichteter APY: {yieldApy?.toFixed(2)}% → ~{fmtEur(yieldAnnual)}/Jahr auf {fmtEur(cioCashEur)} Cash
              </div>
            )}
          </div>
        )}

        {/* Action Badge */}
        <div className="flex items-center justify-between">
          <span className="px-3 py-1 rounded text-sm font-bold font-mono"
            style={{ backgroundColor: `${actionColor}20`, color: actionColor }}>
            {action}
          </span>
          {p4Warning && (
            <span className="px-2 py-0.5 rounded text-xs font-bold"
              style={{ backgroundColor: `${COLORS.signalRed}20`, color: COLORS.signalRed }}>
              P4 WARNING ×0.60
            </span>
          )}
        </div>
      </GlassCard>

      {/* Stablecoin Yield Info Card — Live Data */}
      {alloc.cash > 0.01 && (
        <GlassCard>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-label uppercase tracking-wider" style={{ color: TIER_COLORS.T1 }}>💰 Cash Yield-Empfehlung</span>
            {hasYield && <span className="text-caption font-mono" style={{ color: COLORS.signalGreen }}>LIVE</span>}
          </div>
          <div className="px-3 py-2 rounded" style={{ backgroundColor: `${TIER_COLORS.T1}08`, borderLeft: `3px solid ${TIER_COLORS.T1}` }}>
            <div className="text-sm text-ice-white" style={{ lineHeight: '1.7' }}>
              <strong>{cashPct}% Cash</strong> sollten nicht idle bleiben.
              {hasYield ? ` Regime: ${yieldRegime} (Ensemble ${yieldData.inputs?.ensemble?.toFixed(2)}).` : ' Empfohlene Strategie:'}
            </div>
            <div className="mt-2 space-y-1.5">
              {hasYield ? (
                <>
                  {(yieldData.recommendations?.T0 || []).map((p, i) => (
                    <div key={`t0-${i}`} className="flex items-center gap-2 text-caption">
                      <TierBadge tier="T0" />
                      <span className="text-ice-white font-mono flex-1">{p.coin} {(p.weight * 100).toFixed(0)}%</span>
                      <span className="text-muted-blue">{fmtEur(p.amount_eur)} — liquid im Wallet</span>
                    </div>
                  ))}
                  {(yieldData.recommendations?.T1 || []).map((p, i) => (
                    <div key={`t1-${i}`} className="flex items-center gap-2 text-caption">
                      <TierBadge tier="T1" />
                      <span className="text-ice-white font-mono flex-1">{p.product} {(p.weight * 100).toFixed(0)}%</span>
                      <span className="text-muted-blue">{fmtEur(p.amount_eur)} @ {p.apy?.toFixed(2)}% ({p.apy_source})</span>
                    </div>
                  ))}
                  {(yieldData.recommendations?.T2 || []).map((p, i) => (
                    <div key={`t2-${i}`} className="flex items-center gap-2 text-caption">
                      <TierBadge tier="T2" />
                      <span className="text-ice-white font-mono flex-1">{p.project} {p.coin}</span>
                      <span className="text-muted-blue">{fmtEur(p.amount_eur)} @ {p.risk_adj_apy?.toFixed(2)}%</span>
                    </div>
                  ))}
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-caption">
                    <TierBadge tier="T0" />
                    <span className="text-ice-white font-mono flex-1">~30% Liquid halten</span>
                    <span className="text-muted-blue">USDC + USDT im Wallet, sofort verfügbar</span>
                  </div>
                  <div className="flex items-center gap-2 text-caption">
                    <TierBadge tier="T1" />
                    <span className="text-ice-white font-mono flex-1">~50% Tokenized T-Bills</span>
                    <span className="text-muted-blue">USDY (Ondo), sDAI (Maker) — 3.5-4.5% APY</span>
                  </div>
                  <div className="flex items-center gap-2 text-caption">
                    <TierBadge tier="T2" />
                    <span className="text-ice-white font-mono flex-1">~20% DeFi Lending</span>
                    <span className="text-muted-blue">Aave, Compound, Spark — 2-4% APY</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </GlassCard>
      )}

      {/* Key Metrics Grid */}
      <GlassCard>
        <Section title="Schlüsselwerte" defaultOpen={true}>
          <div className="grid grid-cols-2 gap-3">
            <MetricBox label="BTC Preis" value={fmtUsd(btcPrice)} />
            <MetricBox label="200WMA" value={wma200 ? fmtUsd(wma200) : '—'}
              sub={belowWma ? '⚠ UNTER — Bonus aktiv' : '✓ ÜBER'}
              subColor={belowWma ? COLORS.signalOrange : COLORS.signalGreen} />
            <MetricBox label="BTC.D" value={btcD != null ? `${btcD.toFixed(1)}%` : '—'}
              sub={btcDChange != null ? `${btcDChange >= 0 ? '+' : ''}${btcDChange.toFixed(1)}pp 30d` : ''}
              subColor={btcDChange > 0 ? COLORS.signalGreen : btcDChange < 0 ? COLORS.signalRed : COLORS.mutedBlue} />
            <MetricBox label="Ensemble (Weekly)" value={ensembleWeekly != null ? ensembleWeekly.toFixed(2) : '—'} />
          </div>
        </Section>
      </GlassCard>

      {/* Display Indicators */}
      <GlassCard>
        <Section title="Display-Indikatoren" defaultOpen={false}>
          <div className="grid grid-cols-2 gap-2">
            <MiniMetric label="Rainbow Band" value={display.rainbow_band ?? '—'} />
            <MiniMetric label="Rainbow Score" value={display.rainbow_score != null ? Number(display.rainbow_score).toFixed(2) : '—'} />
            <MiniMetric label="MVRV Z-Score" value={display.mvrv_zscore != null ? Number(display.mvrv_zscore).toFixed(2) : '—'} />
            <MiniMetric label="NUPL" value={display.nupl != null ? Number(display.nupl).toFixed(3) : '—'} />
            <MiniMetric label="Fear & Greed" value={display.fear_greed ?? '—'} />
            <MiniMetric label="V16 State" value={display.v16_macro_state || '—'} />
            <MiniMetric label="Funding BTC" value={display.funding_btc != null ? `${Number(display.funding_btc).toFixed(4)}%` : '—'} />
            <MiniMetric label="Halving Phase" value={display.halving_phase != null ? `${Number(display.halving_phase).toFixed(0)}%` : '—'} />
          </div>
        </Section>
      </GlassCard>
    </div>
  );
}

function TierBadge({ tier }) {
  return (
    <span className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold"
      style={{ backgroundColor: `${TIER_COLORS[tier]}30`, color: TIER_COLORS[tier] }}>
      {tier}
    </span>
  );
}

function MetricBox({ label, value, sub, subColor }) {
  return (
    <div className="rounded-lg px-3 py-2" style={{ backgroundColor: `${COLORS.fadedBlue}10` }}>
      <div className="text-caption text-muted-blue">{label}</div>
      <div className="text-data-medium tabular-nums text-ice-white font-mono">{value}</div>
      {sub && <div className="text-caption font-mono" style={{ color: subColor || COLORS.mutedBlue }}>{sub}</div>}
    </div>
  );
}

function MiniMetric({ label, value }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-white/5">
      <span className="text-caption text-muted-blue">{label}</span>
      <span className="text-caption text-ice-white font-mono">{value}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// TAB 2: SIGNALS — Momentum + BTC.D + Phase
// ═══════════════════════════════════════════════════════

function SignalsTab({ mom, ensemble, btcD, btcDChange, phase, phaseName, belowWma, wma200, btcPrice }) {
  const momEntries = [
    { label: '1M (21d, smoothed)', key: '1M', desc: '5d-SMA des 21d-Returns' },
    { label: '3M (63d)', key: '3M', desc: '63d Return > 0' },
    { label: '6M (126d)', key: '6M', desc: '126d Return > 0' },
    { label: '12M (252d)', key: '12M', desc: '252d Return > 0' },
  ];

  const onCount = Object.values(mom).filter(Boolean).length;

  return (
    <div className="space-y-4">
      <GlassCard>
        <Section title="Momentum Signale" defaultOpen={true}>
          <div className="mb-3">
            <div className="text-caption text-muted-blue mb-1">Ensemble = Durchschnitt der 4 Signale</div>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-mono font-bold" style={{ color: getCryptoEnsembleColor(ensemble) }}>
                {ensemble != null ? ensemble.toFixed(2) : '—'}
              </span>
              <span className="text-caption text-muted-blue">({onCount}/4 ON)</span>
            </div>
          </div>
          <div className="space-y-2">
            {momEntries.map(m => {
              const on = mom[m.key];
              return (
                <div key={m.key} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                    style={{
                      backgroundColor: on ? `${COLORS.signalGreen}20` : `${COLORS.signalRed}15`,
                      color: on ? COLORS.signalGreen : COLORS.signalRed,
                    }}>
                    {on ? '✓' : '✗'}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-ice-white font-mono">{m.label}</div>
                    <div className="text-caption text-muted-blue">{m.desc}</div>
                  </div>
                  <span className="text-caption font-mono" style={{ color: on ? COLORS.signalGreen : COLORS.signalRed }}>
                    {on ? 'ON' : 'OFF'}
                  </span>
                </div>
              );
            })}
          </div>
        </Section>
      </GlassCard>

      <GlassCard>
        <Section title="200-Wochen-MA (Bottom Bonus)" defaultOpen={true}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-caption text-muted-blue">BTC</div>
              <div className="text-data-medium font-mono text-ice-white">{fmtUsd(btcPrice)}</div>
            </div>
            <div className="text-center">
              <div className="text-caption text-muted-blue">200WMA</div>
              <div className="text-data-medium font-mono text-ice-white">{fmtUsd(wma200)}</div>
            </div>
            <div className="text-right">
              <span className="px-2 py-1 rounded text-sm font-bold font-mono"
                style={{
                  backgroundColor: belowWma ? `${COLORS.signalOrange}20` : `${COLORS.signalGreen}15`,
                  color: belowWma ? COLORS.signalOrange : COLORS.signalGreen,
                }}>
                {belowWma ? 'UNTER → +0.50' : 'ÜBER'}
              </span>
            </div>
          </div>
          {belowWma && (
            <div className="mt-2 text-caption" style={{ color: COLORS.signalOrange }}>
              Bottom Bonus aktiv: Allokation +50pp (gedeckelt bei 100%)
            </div>
          )}
        </Section>
      </GlassCard>

      <GlassCard>
        <Section title="Trickle-Down Phase (BTC.D)" defaultOpen={true}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-caption text-muted-blue">BTC Dominance</div>
              <div className="text-data-medium font-mono text-ice-white">{btcD != null ? `${btcD.toFixed(1)}%` : '—'}</div>
            </div>
            <div className="text-center">
              <div className="text-caption text-muted-blue">30d Δ</div>
              <div className="text-data-medium font-mono" style={{
                color: btcDChange > 0 ? COLORS.signalGreen : btcDChange < 0 ? COLORS.signalRed : COLORS.mutedBlue
              }}>
                {btcDChange != null ? `${btcDChange >= 0 ? '+' : ''}${btcDChange.toFixed(1)}pp` : '—'}
              </div>
            </div>
            <div className="text-right">
              <span className="px-2 py-1 rounded text-sm font-bold font-mono"
                style={{ backgroundColor: `${CRYPTO_PHASE_COLORS[phase]}20`, color: CRYPTO_PHASE_COLORS[phase] }}>
                P{phase}
              </span>
            </div>
          </div>
          <div className="px-3 py-2 rounded" style={{ backgroundColor: `${CRYPTO_PHASE_COLORS[phase]}08`, borderLeft: `3px solid ${CRYPTO_PHASE_COLORS[phase]}` }}>
            <div className="text-sm text-ice-white font-mono">{CRYPTO_PHASE_LABELS[phase]}</div>
          </div>
          <div className="mt-3 space-y-1">
            {[
              { p: 1, label: 'BTC_FIRST', cond: 'Δ > +2.0pp' },
              { p: 2, label: 'NEUTRAL_FLOW', cond: '-2.0 ≤ Δ ≤ +2.0pp' },
              { p: 3, label: 'ALT_ROTATION', cond: '-5.0 ≤ Δ < -2.0pp' },
              { p: 4, label: 'ALT_OVERHEATED', cond: 'Δ < -5.0pp' },
            ].map(r => (
              <div key={r.p} className="flex items-center justify-between text-caption"
                style={{ opacity: phase === r.p ? 1 : 0.5 }}>
                <span className="font-mono" style={{ color: CRYPTO_PHASE_COLORS[r.p] }}>
                  P{r.p} {r.label} {phase === r.p ? '◀' : ''}
                </span>
                <span className="text-muted-blue font-mono">{r.cond}</span>
              </div>
            ))}
          </div>
        </Section>
      </GlassCard>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// TAB 3: CYCLES — Rainbow, Pi (Display), Halving, 200WMA
// ═══════════════════════════════════════════════════════

function CyclesTab({ display, btcPrice, belowWma, wma200 }) {
  const band = display.rainbow_band;
  const score = display.rainbow_score;
  const halvingPct = display.halving_phase;

  const BAND_COLORS = {
    1: '#0000FF', 2: '#0066FF', 3: '#00CCFF', 4: '#00FF66',
    5: '#FFFF00', 6: '#FFAA00', 7: '#FF6600', 8: '#FF0000',
  };
  const BAND_LABELS = {
    1: 'Maximum kaufen', 2: 'Kaufen', 3: 'Akkumulieren', 4: 'Günstig',
    5: 'Neutral', 6: 'HODL', 7: 'Verkaufen erwägen', 8: 'Maximum verkaufen',
  };

  return (
    <div className="space-y-4">
      <GlassCard>
        <Section title="Rainbow Chart (Display)" defaultOpen={true}>
          {band != null ? (
            <>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold"
                  style={{ backgroundColor: `${BAND_COLORS[band] || COLORS.fadedBlue}30`, color: BAND_COLORS[band] || COLORS.mutedBlue }}>
                  {band}
                </div>
                <div>
                  <div className="text-sm text-ice-white font-mono">Band {band}/8</div>
                  <div className="text-caption" style={{ color: BAND_COLORS[band] || COLORS.mutedBlue }}>{BAND_LABELS[band] || '—'}</div>
                </div>
                {score != null && (
                  <div className="ml-auto text-right">
                    <div className="text-caption text-muted-blue">Score</div>
                    <div className="text-data-medium font-mono text-ice-white">{Number(score).toFixed(2)}</div>
                  </div>
                )}
              </div>
              <div className="flex gap-0.5 h-4 rounded-full overflow-hidden mb-1">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(b => (
                  <div key={b} className="flex-1 relative" style={{ backgroundColor: BAND_COLORS[b] }}>
                    {band === b && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-caption" style={{ fontSize: '9px' }}>
                <span style={{ color: BAND_COLORS[1] }}>Kaufen</span>
                <span style={{ color: BAND_COLORS[8] }}>Verkaufen</span>
              </div>
            </>
          ) : (
            <div className="text-caption text-muted-blue">Keine Rainbow-Daten verfügbar</div>
          )}
          <div className="mt-3 text-caption text-muted-blue" style={{ fontSize: '10px' }}>
            Display only — kein Einfluss auf V8+Warn Allokation.
          </div>
        </Section>
      </GlassCard>

      <GlassCard>
        <Section title="200-Wochen-MA" defaultOpen={true}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-caption text-muted-blue">BTC</div>
              <div className="text-lg font-mono text-ice-white">{fmtUsd(btcPrice)}</div>
            </div>
            <div className="text-center text-2xl" style={{ color: belowWma ? COLORS.signalOrange : COLORS.signalGreen }}>
              {belowWma ? '▼' : '▲'}
            </div>
            <div className="text-right">
              <div className="text-caption text-muted-blue">200WMA</div>
              <div className="text-lg font-mono text-ice-white">{fmtUsd(wma200)}</div>
            </div>
          </div>
          {btcPrice && wma200 && (
            <div className="mt-2 text-caption text-muted-blue font-mono text-center">
              Abstand: {((btcPrice / wma200 - 1) * 100).toFixed(1)}%
            </div>
          )}
        </Section>
      </GlassCard>

      <GlassCard>
        <Section title="Halving-Zyklus" defaultOpen={true}>
          <div className="mb-2">
            <div className="text-caption text-muted-blue mb-1">
              Fortschritt im aktuellen Zyklus (Halving Apr 2024 → ~Apr 2028)
            </div>
            <div className="h-4 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{
                width: `${halvingPct != null ? Math.min(halvingPct, 100) : 0}%`,
                backgroundColor: COLORS.signalYellow,
              }} />
            </div>
            <div className="text-caption text-muted-blue font-mono text-right mt-1">
              {halvingPct != null ? `${Number(halvingPct).toFixed(0)}%` : '—'}
            </div>
          </div>
        </Section>
      </GlassCard>

      <GlassCard>
        <Section title="Pi Cycle (Display only)" defaultOpen={false}>
          <div className="text-caption text-muted-blue" style={{ lineHeight: '1.6' }}>
            Pi Cycle Top/Bottom Indicator wird angezeigt, hat aber KEINEN Einfluss auf die Allokation.
            Das Signal funktioniert nicht zuverlässig mit Post-2014 Daten (0 Crosses verifiziert).
            Rainbow Band ≥ 7 wird stattdessen als Primary Top-Signal genutzt (Display).
          </div>
        </Section>
      </GlassCard>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// TAB 4: ROTATION — Phase-Verlauf, Gewichte
// ═══════════════════════════════════════════════════════

function RotationTab({ phase, phaseName, weights, btcDChange }) {
  const phaseColor = CRYPTO_PHASE_COLORS[phase] || COLORS.mutedBlue;

  return (
    <div className="space-y-4">
      <GlassCard>
        <Section title="Aktuelle Trickle-Down Phase" defaultOpen={true}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-bold font-mono"
              style={{ backgroundColor: `${phaseColor}20`, color: phaseColor }}>
              P{phase}
            </div>
            <div>
              <div className="text-lg text-ice-white font-mono">{CRYPTO_PHASE_NAMES[phase]}</div>
              <div className="text-caption" style={{ color: phaseColor }}>{CRYPTO_PHASE_LABELS[phase]}</div>
            </div>
          </div>
          {btcDChange != null && (
            <div className="text-caption text-muted-blue font-mono">
              BTC.D 30d Δ: {btcDChange >= 0 ? '+' : ''}{btcDChange.toFixed(1)}pp
            </div>
          )}
        </Section>
      </GlassCard>

      <GlassCard>
        <Section title="Tier-Gewichte (Phase abhängig)" defaultOpen={true}>
          <div className="space-y-3">
            {['BTC', 'ETH', 'SOL'].map(asset => {
              const w = weights[asset] || 0;
              return (
                <div key={asset}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-ice-white font-mono">{asset}</span>
                    <span className="text-sm font-mono font-bold" style={{ color: CRYPTO_ASSET_COLORS[asset] }}>
                      {(w * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${w * 100}%`, backgroundColor: CRYPTO_ASSET_COLORS[asset] }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      </GlassCard>

      <GlassCard>
        <Section title="Gewichte pro Phase" defaultOpen={true}>
          <div className="overflow-x-auto">
            <table className="w-full text-caption font-mono">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-1 text-muted-blue">Phase</th>
                  <th className="text-right py-1" style={{ color: CRYPTO_ASSET_COLORS.BTC }}>BTC</th>
                  <th className="text-right py-1" style={{ color: CRYPTO_ASSET_COLORS.ETH }}>ETH</th>
                  <th className="text-right py-1" style={{ color: CRYPTO_ASSET_COLORS.SOL }}>SOL</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4].map(p => {
                  const tw = CRYPTO_TIER_WEIGHTS[p];
                  const isCurrent = p === phase;
                  return (
                    <tr key={p} className="border-b border-white/5"
                      style={{ backgroundColor: isCurrent ? `${CRYPTO_PHASE_COLORS[p]}10` : 'transparent' }}>
                      <td className="py-1.5" style={{ color: CRYPTO_PHASE_COLORS[p] }}>
                        P{p} {CRYPTO_PHASE_NAMES[p]} {isCurrent ? '◀' : ''}
                      </td>
                      <td className="text-right text-ice-white">{(tw.BTC * 100).toFixed(0)}%</td>
                      <td className="text-right text-ice-white">{(tw.ETH * 100).toFixed(0)}%</td>
                      <td className="text-right text-ice-white">{(tw.SOL * 100).toFixed(0)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Section>
      </GlassCard>

      <GlassCard>
        <Section title="Phase-Schwellen (BTC.D 30d Δ)" defaultOpen={false}>
          <div className="space-y-2 text-caption">
            <div className="flex justify-between" style={{ color: CRYPTO_PHASE_COLORS[1] }}>
              <span>P1 BTC_FIRST</span><span className="font-mono">Δ {'>'} +2.0pp</span>
            </div>
            <div className="flex justify-between" style={{ color: CRYPTO_PHASE_COLORS[2] }}>
              <span>P2 NEUTRAL_FLOW</span><span className="font-mono">-2.0 ≤ Δ ≤ +2.0pp</span>
            </div>
            <div className="flex justify-between" style={{ color: CRYPTO_PHASE_COLORS[3] }}>
              <span>P3 ALT_ROTATION</span><span className="font-mono">-5.0 ≤ Δ {'<'} -2.0pp</span>
            </div>
            <div className="flex justify-between" style={{ color: CRYPTO_PHASE_COLORS[4] }}>
              <span>P4 ALT_OVERHEATED</span><span className="font-mono">Δ {'<'} -5.0pp → ×0.60</span>
            </div>
          </div>
        </Section>
      </GlassCard>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// TAB 5: PORTFOLIO — Kapital, Ist vs Ziel, Rebalancing
// ═══════════════════════════════════════════════════════

function PortfolioTab({ alloc, action, weights, btcPrice, ws }) {
  const [capital, setCapital] = useState(() => loadSaved('bcc_crypto_capital', ''));
  const [holdings, setHoldings] = useState(() => loadSaved('bcc_crypto_holdings', { BTC: '', ETH: '', SOL: '', CASH: '' }));

  const capitalNum = parseFloat(capital) || 0;

  const updateCapital = (val) => { setCapital(val); savePersistent('bcc_crypto_capital', val); };
  const updateHolding = (asset, val) => {
    setHoldings(prev => { const next = { ...prev, [asset]: val }; savePersistent('bcc_crypto_holdings', next); return next; });
  };
  const resetAll = () => {
    setCapital(''); setHoldings({ BTC: '', ETH: '', SOL: '', CASH: '' });
    savePersistent('bcc_crypto_capital', ''); savePersistent('bcc_crypto_holdings', { BTC: '', ETH: '', SOL: '', CASH: '' });
  };

  const assets = [
    { key: 'BTC', label: 'Bitcoin', allocKey: 'btc' },
    { key: 'ETH', label: 'Ethereum', allocKey: 'eth' },
    { key: 'SOL', label: 'Solana', allocKey: 'sol' },
    { key: 'CASH', label: 'Stablecoins', allocKey: 'cash' },
  ];

  const totalHoldings = assets.reduce((s, a) => s + (parseFloat(holdings[a.key]) || 0), 0);
  const hasAnyHoldings = assets.some(a => (parseFloat(holdings[a.key]) || 0) > 0);
  const materialThreshold = capitalNum * 0.02;

  const rebalData = assets.map(a => {
    const ist = parseFloat(holdings[a.key]) || 0;
    const zielPct = alloc[a.allocKey] || 0;
    const ziel = capitalNum * zielPct;
    const delta = ziel - ist;
    const absDelta = Math.abs(delta);
    const material = absDelta >= materialThreshold;
    const istPct = capitalNum > 0 ? ist / capitalNum : 0;
    return { ...a, ist, ziel, zielPct, delta, absDelta, material, istPct };
  });

  const needsRebal = rebalData.some(r => r.material);
  const buys = rebalData.filter(r => r.delta > 0 && r.material);
  const sells = rebalData.filter(r => r.delta < 0 && r.material);

  return (
    <div className="space-y-4">
      <GlassCard>
        <Section title="Ziel-Allokation (V8+Warn Signal)" defaultOpen={true}>
          <div className="space-y-2">
            {assets.map(a => {
              const pct = alloc[a.allocKey] || 0;
              return (
                <div key={a.key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-ice-white font-mono">{a.key}</span>
                    <span className="text-sm font-mono font-bold" style={{ color: CRYPTO_ASSET_COLORS[a.key] || COLORS.mutedBlue }}>
                      {fmtPct(pct)}
                      {capitalNum > 0 && <span className="text-muted-blue font-normal ml-2">= {fmtEur(capitalNum * pct)}</span>}
                    </span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct * 100}%`, backgroundColor: CRYPTO_ASSET_COLORS[a.key] || COLORS.fadedBlue }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="px-2 py-1 rounded text-sm font-bold font-mono"
              style={{ backgroundColor: `${CRYPTO_ACTION_COLORS[action]}20`, color: CRYPTO_ACTION_COLORS[action] }}>
              {action}
            </span>
            <span className="text-caption text-muted-blue">Rebalancing: Montag nach Signal</span>
          </div>
        </Section>
      </GlassCard>

      <GlassCard>
        <Section title="Mein Crypto Portfolio" defaultOpen={true}>
          <div className="mb-3">
            <label className="text-caption text-muted-blue block mb-1">Crypto-Kapital (Zielwert gesamt)</label>
            <div className="flex items-center gap-2">
              <input type="number" placeholder="z.B. 10000" value={capital} onChange={(e) => updateCapital(e.target.value)}
                className="flex-1 rounded px-3 py-2 text-sm outline-none"
                style={{ backgroundColor: `${COLORS.fadedBlue}20`, color: COLORS.iceWhite, border: `1px solid ${COLORS.fadedBlue}40` }} />
              <span className="text-caption text-muted-blue">EUR</span>
            </div>
          </div>

          {capitalNum > 0 && (
            <>
              <div className="text-caption text-muted-blue mb-2">Aktuelle Bestände (EUR-Wert pro Position):</div>
              <div className="space-y-2 mb-3">
                {assets.map(a => (
                  <div key={a.key} className="flex items-center gap-2">
                    <span className="text-sm font-mono w-14" style={{ color: CRYPTO_ASSET_COLORS[a.key] || COLORS.mutedBlue }}>{a.key}</span>
                    <input type="number" placeholder="0" value={holdings[a.key]} onChange={(e) => updateHolding(a.key, e.target.value)}
                      className="flex-1 rounded px-2 py-1.5 text-sm outline-none font-mono"
                      style={{ backgroundColor: `${COLORS.fadedBlue}15`, color: COLORS.iceWhite, border: `1px solid ${COLORS.fadedBlue}30` }} />
                    <span className="text-caption text-muted-blue w-6">€</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between py-2 border-t border-white/10">
                <span className="text-caption text-muted-blue">Ist Gesamt</span>
                <span className="text-sm font-mono text-ice-white">{fmtEur(totalHoldings)}</span>
              </div>
              <div className="flex items-center justify-between pb-2">
                <span className="text-caption text-muted-blue">Differenz zu Ziel</span>
                <span className="text-sm font-mono" style={{
                  color: Math.abs(totalHoldings - capitalNum) < materialThreshold ? COLORS.signalGreen
                    : totalHoldings > capitalNum ? COLORS.signalOrange : COLORS.signalRed,
                }}>
                  {totalHoldings >= capitalNum ? '+' : ''}{fmtEur(totalHoldings - capitalNum)}
                </span>
              </div>
              <button onClick={resetAll} className="text-caption px-3 py-1 rounded"
                style={{ color: COLORS.signalRed, border: `1px solid ${COLORS.signalRed}40` }}>Reset</button>
            </>
          )}
        </Section>
      </GlassCard>

      {capitalNum > 0 && hasAnyHoldings && (
        <GlassCard>
          <Section title="Rebalancing-Anweisungen" defaultOpen={true}>
            {!needsRebal ? (
              <div className="px-3 py-3 rounded text-center"
                style={{ backgroundColor: `${COLORS.signalGreen}10`, borderLeft: `3px solid ${COLORS.signalGreen}` }}>
                <span className="text-sm font-mono" style={{ color: COLORS.signalGreen }}>✓ Alle Positionen innerhalb der Toleranz (±2%)</span>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <div className="grid grid-cols-5 gap-1 text-caption font-mono mb-1 pb-1 border-b border-white/10">
                    <span className="text-muted-blue">Asset</span>
                    <span className="text-muted-blue text-right">Ist</span>
                    <span className="text-muted-blue text-right">Ziel</span>
                    <span className="text-muted-blue text-right">Delta</span>
                    <span className="text-muted-blue text-right">Aktion</span>
                  </div>
                  {rebalData.map(r => {
                    const deltaColor = !r.material ? COLORS.signalGreen : r.delta > 0 ? COLORS.signalGreen : COLORS.signalRed;
                    const actionLabel = !r.material ? '✓ OK' : r.delta > 0 ? 'KAUFEN' : 'VERKAUFEN';
                    return (
                      <div key={r.key} className="grid grid-cols-5 gap-1 text-caption font-mono py-1 border-b border-white/5"
                        style={{ opacity: r.material ? 1 : 0.5 }}>
                        <span style={{ color: CRYPTO_ASSET_COLORS[r.key] }}>{r.key}</span>
                        <span className="text-right text-muted-blue">{fmtEur(r.ist)}</span>
                        <span className="text-right text-ice-white">{fmtEur(r.ziel)}</span>
                        <span className="text-right" style={{ color: deltaColor }}>{r.delta >= 0 ? '+' : ''}{fmtEur(r.delta)}</span>
                        <span className="text-right font-bold" style={{ color: deltaColor }}>{actionLabel}</span>
                      </div>
                    );
                  })}
                </div>
                {sells.length > 0 && (
                  <div className="mb-3 px-3 py-2 rounded" style={{ backgroundColor: `${COLORS.signalRed}08`, borderLeft: `3px solid ${COLORS.signalRed}` }}>
                    <div className="text-caption font-bold mb-1" style={{ color: COLORS.signalRed }}>VERKAUFEN:</div>
                    {sells.map(r => (
                      <div key={r.key} className="text-sm font-mono text-ice-white">
                        {r.label} ({r.key}): <span style={{ color: COLORS.signalRed }}>{fmtEur(Math.abs(r.delta))}</span> verkaufen
                        <span className="text-muted-blue ml-2">({fmtPct(r.istPct)} → {fmtPct(r.zielPct)})</span>
                      </div>
                    ))}
                  </div>
                )}
                {buys.length > 0 && (
                  <div className="px-3 py-2 rounded" style={{ backgroundColor: `${COLORS.signalGreen}08`, borderLeft: `3px solid ${COLORS.signalGreen}` }}>
                    <div className="text-caption font-bold mb-1" style={{ color: COLORS.signalGreen }}>KAUFEN:</div>
                    {buys.map(r => (
                      <div key={r.key} className="text-sm font-mono text-ice-white">
                        {r.label} ({r.key}): <span style={{ color: COLORS.signalGreen }}>{fmtEur(r.delta)}</span> kaufen
                        <span className="text-muted-blue ml-2">({fmtPct(r.istPct)} → {fmtPct(r.zielPct)})</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-3 text-caption text-muted-blue" style={{ fontSize: '10px' }}>
                  Toleranz: ±2% vom Kapital ({fmtEur(materialThreshold)}). Kleinere Abweichungen werden ignoriert.
                </div>
              </>
            )}
          </Section>
        </GlassCard>
      )}

      <GlassCard>
        <Section title="System" defaultOpen={false}>
          <div className="space-y-1 text-caption text-muted-blue font-mono">
            <div>Version: {ws.version || '—'}</div>
            <div>Config: {ws.config_version || '—'}</div>
            <div>Weekly Run: {ws.date || '—'}</div>
            <div>13 Parameter, 3 Komponenten</div>
            <div>Backtest: CAGR 72.53%, Sharpe 1.66, MaxDD -54.73%</div>
          </div>
        </Section>
      </GlassCard>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// TAB 6: YIELD — Cash Management Advisor Detail
// ═══════════════════════════════════════════════════════

function YieldTab({ yieldData, alloc }) {
  const yd = yieldData || {};
  const hasData = yd.regime != null;

  // Kapital aus Portfolio Tab (localStorage) lesen
  const savedCapital = loadSaved('bcc_crypto_capital', '');
  const userCapital = parseFloat(savedCapital) || 0;

  if (!hasData) {
    return (
      <GlassCard>
        <div className="text-center py-12">
          <p className="text-lg text-muted-blue">Yield Router noch nicht gelaufen.</p>
          <p className="text-caption text-muted-blue mt-2">Läuft wöchentlich Sonntag nach dem Orchestrator.</p>
        </div>
      </GlassCard>
    );
  }

  const tw = yd.tier_weights || {};
  const depeg = yd.depeg_status || {};
  const recs = yd.recommendations || {};
  const apy = yd.apy || {};
  const inputs = yd.inputs || {};
  const t1Products = yd.t1_products || {};
  const basisTrade = yd.basis_trade_info || {};

  // Skalierung: User-Kapital × Cash% statt Backend-Default
  const cashPct = alloc.cash || inputs.cash_pct || 0.75;
  const backendCash = inputs.cash_eur || 7500;
  const realCash = userCapital > 0 ? userCapital * cashPct : backendCash;
  const scale = backendCash > 0 ? realCash / backendCash : 1;
  const usingUserCapital = userCapital > 0;

  // Kapital-Tier Warnung wenn User-Kapital in anderem Tier
  const realCapTier = realCash < 5000 ? 'MICRO' : realCash < 50000 ? 'STANDARD' : 'LARGE';
  const tierMismatch = usingUserCapital && realCapTier !== yd.capital_tier;

  const annualYield = realCash * (apy.weighted_total || 0) / 100;

  const hasDepegIssue = Object.values(depeg).some(d => d.status !== 'OK');

  return (
    <div className="space-y-4">
      {/* Kapital Hinweis */}
      {!usingUserCapital && (
        <GlassCard>
          <div className="px-3 py-2 rounded" style={{ backgroundColor: `${COLORS.signalOrange}10`, borderLeft: `3px solid ${COLORS.signalOrange}` }}>
            <div className="text-caption" style={{ color: COLORS.signalOrange }}>
              Kein Kapital hinterlegt — EUR-Beträge basieren auf Backend-Default ({fmtEur(backendCash)} Cash).
              Im <strong>Portfolio</strong> Tab Kapital eingeben für korrekte Beträge.
            </div>
          </div>
        </GlassCard>
      )}

      {/* Tier-Mismatch Warnung */}
      {tierMismatch && (
        <GlassCard>
          <div className="px-3 py-2 rounded" style={{ backgroundColor: `${COLORS.signalOrange}10`, borderLeft: `3px solid ${COLORS.signalOrange}` }}>
            <div className="text-caption" style={{ color: COLORS.signalOrange }}>
              Dein Cash ({fmtEur(realCash)}) liegt im Kapital-Tier <strong>{realCapTier}</strong>, der Yield Router berechnete mit Tier <strong>{yd.capital_tier}</strong>.
              {realCapTier === 'MICRO' && ' Bei < €5K: T2 DeFi Lending entfällt (Gas Fees > APY-Vorteil).'}
              {realCapTier === 'LARGE' && ' Bei ≥ €50K: Multi-Chain T2 Pools (Arbitrum, Base) werden freigeschaltet.'}
              {' '}Pool-Auswahl kann abweichen — Tier-Gewichte und APYs bleiben korrekt.
            </div>
          </div>
        </GlassCard>
      )}

      {/* Hero: Gesamt-Investition + Yield */}
      <GlassCard>
        <div className="flex items-stretch gap-3">
          <div className="flex-1 rounded-lg px-4 py-3 text-center" style={{ backgroundColor: `${COLORS.baldurBlue}15` }}>
            <div className="text-caption text-muted-blue mb-1">Gesamt-Investition</div>
            <div className="text-2xl font-mono font-bold text-ice-white">
              {fmtEur(usingUserCapital ? userCapital : (inputs.total_capital_eur || 0))}
            </div>
            <div className="text-caption text-muted-blue mt-1">
              davon {fmtPct(cashPct)} Cash = {fmtEur(realCash)}
            </div>
          </div>
          <div className="flex-1 rounded-lg px-4 py-3 text-center" style={{ backgroundColor: `${COLORS.signalGreen}12` }}>
            <div className="text-caption text-muted-blue mb-1">Yield auf Cash</div>
            <div className="text-2xl font-mono font-bold" style={{ color: COLORS.signalGreen }}>
              {fmtEur(annualYield)}<span className="text-sm text-muted-blue">/Jahr</span>
            </div>
            <div className="text-caption font-mono mt-1" style={{ color: TIER_COLORS.T1 }}>
              {apy.weighted_total?.toFixed(2)}% gewichteter APY
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Executive Summary */}
      <GlassCard>
        <div className="flex items-center justify-between mb-3">
          <span className="text-label uppercase tracking-wider" style={{ color: TIER_COLORS.T1 }}>Cash Management Advisor</span>
          <span className="text-caption text-muted-blue font-mono">{fmtDate(yd.date)}</span>
        </div>
        <div className="px-3 py-3 rounded" style={{ backgroundColor: `${TIER_COLORS.T1}08`, borderLeft: `3px solid ${TIER_COLORS.T1}` }}>
          <div className="text-sm text-ice-white" style={{ lineHeight: '1.8' }}>
            Regime <strong style={{ color: TIER_COLORS.T1 }}>{yd.regime}</strong> (Ensemble {inputs.ensemble?.toFixed(2)}).{' '}
            Kapital-Tier: <strong>{usingUserCapital ? realCapTier : yd.capital_tier}</strong>.{' '}
            {fmtEur(realCash)} Cash aufgeteilt in{' '}
            T0 {((tw.T0 || 0) * 100).toFixed(0)}% / T1 {((tw.T1 || 0) * 100).toFixed(0)}% / T2 {((tw.T2 || 0) * 100).toFixed(0)}%.{' '}
            Gewichteter APY: <strong style={{ color: COLORS.signalGreen }}>{apy.weighted_total?.toFixed(2)}%</strong>{' '}
            → ~{fmtEur(annualYield)}/Jahr.
          </div>
        </div>
      </GlassCard>

      {/* Tier Balken */}
      <GlassCard>
        <Section title="Tier-Allokation" defaultOpen={true}>
          <div className="flex gap-0.5 h-8 rounded-lg overflow-hidden mb-2">
            {tw.T0 > 0 && <div className="flex items-center justify-center text-xs font-bold font-mono" style={{ flex: tw.T0, backgroundColor: TIER_COLORS.T0, color: '#fff' }}>T0 {((tw.T0) * 100).toFixed(0)}%</div>}
            {tw.T1 > 0 && <div className="flex items-center justify-center text-xs font-bold font-mono" style={{ flex: tw.T1, backgroundColor: TIER_COLORS.T1 + '90', color: '#000' }}>T1 {((tw.T1) * 100).toFixed(0)}%</div>}
            {tw.T2 > 0 && <div className="flex items-center justify-center text-xs font-bold font-mono" style={{ flex: tw.T2, backgroundColor: TIER_COLORS.T2 + '80', color: '#000' }}>T2 {((tw.T2) * 100).toFixed(0)}%</div>}
          </div>
          <div className="grid grid-cols-3 gap-2 text-caption font-mono">
            <div className="text-center">
              <div style={{ color: TIER_COLORS.T0 }}>T0 Liquid</div>
              <div className="text-ice-white">{fmtEur(realCash * (tw.T0 || 0))}</div>
              <div className="text-muted-blue">0% APY</div>
            </div>
            <div className="text-center">
              <div style={{ color: TIER_COLORS.T1 }}>T1 T-Bills</div>
              <div className="text-ice-white">{fmtEur(realCash * (tw.T1 || 0))}</div>
              <div className="text-muted-blue">{apy.t1_weighted?.toFixed(2)}% APY</div>
            </div>
            <div className="text-center">
              <div style={{ color: TIER_COLORS.T2 }}>T2 Lending</div>
              <div className="text-ice-white">{fmtEur(realCash * (tw.T2 || 0))}</div>
              <div className="text-muted-blue">{apy.t2_weighted?.toFixed(2)}% APY</div>
            </div>
          </div>
        </Section>
      </GlassCard>

      {/* Depeg Monitor */}
      <GlassCard>
        <Section title="Depeg Monitor" defaultOpen={hasDepegIssue}>
          <div className="space-y-2">
            {Object.entries(depeg).map(([coin, info]) => (
              <div key={coin} className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="text-sm text-ice-white font-mono">{coin}</span>
                <div className="flex items-center gap-3">
                  <span className="text-caption text-muted-blue font-mono">${info.price?.toFixed(4)}</span>
                  <span className="text-caption font-mono" style={{
                    color: info.deviation > 0.005 ? (info.deviation > 0.02 ? COLORS.signalRed : COLORS.signalOrange) : COLORS.signalGreen,
                  }}>
                    {(info.deviation * 100).toFixed(2)}%
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs font-bold"
                    style={{ backgroundColor: `${DEPEG_COLORS[info.status]}20`, color: DEPEG_COLORS[info.status] }}>
                    {info.status}
                  </span>
                </div>
              </div>
            ))}
            {Object.keys(depeg).length === 0 && (
              <div className="text-caption text-muted-blue">Keine Depeg-Daten verfügbar.</div>
            )}
          </div>
          <div className="mt-2 text-caption text-muted-blue" style={{ fontSize: '10px' }}>
            Kill Switch: {'>'}2% Abweichung = GESPERRT. {'>'}0.5% = WARNING.
          </div>
        </Section>
      </GlassCard>

      {/* T0 Detail */}
      <GlassCard>
        <Section title="T0 — Liquid Cash" defaultOpen={true}>
          {(recs.T0 || []).length > 0 ? (
            <div className="space-y-2">
              {recs.T0.map((p, i) => (
                <div key={i} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    <TierBadge tier="T0" />
                    <span className="text-sm text-ice-white font-mono">{p.coin}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-ice-white font-mono">{fmtEur(p.amount_eur * scale)}</span>
                    <span className="text-caption text-muted-blue ml-2">({(p.weight * 100).toFixed(0)}%)</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-caption text-muted-blue">Kein T0 im aktuellen Regime.</div>
          )}
          <div className="mt-2 text-caption text-muted-blue" style={{ fontSize: '10px' }}>
            Sofort verfügbar wenn Signal dreht. 0% APY.
          </div>
        </Section>
      </GlassCard>

      {/* T1 Detail */}
      <GlassCard>
        <Section title="T1 — Tokenized T-Bills" defaultOpen={true}>
          {(recs.T1 || []).length > 0 ? (
            <div className="space-y-2">
              {recs.T1.map((p, i) => (
                <div key={i} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    <TierBadge tier="T1" />
                    <div>
                      <span className="text-sm text-ice-white font-mono">{p.product}</span>
                      <div className="text-caption text-muted-blue">{p.issuer} · {p.chain}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-ice-white font-mono">{fmtEur(p.amount_eur * scale)}</span>
                    <div className="text-caption font-mono" style={{ color: TIER_COLORS.T1 }}>
                      {p.apy?.toFixed(2)}% <span className="text-muted-blue">({p.apy_source})</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-caption text-muted-blue">Kein T1 im aktuellen Regime.</div>
          )}
          <div className="mt-2 text-caption text-muted-blue" style={{ fontSize: '10px' }}>
            Tokenisierte US Treasury Bills. Underlying: echte T-Bills. Redemption: 0-2 Tage.
          </div>
        </Section>
      </GlassCard>

      {/* T2 Detail */}
      <GlassCard>
        <Section title="T2 — DeFi Lending" defaultOpen={true}>
          {(recs.T2 || []).length > 0 ? (
            <div className="space-y-2">
              {recs.T2.map((p, i) => (
                <div key={i} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    <TierBadge tier="T2" />
                    <div>
                      <span className="text-sm text-ice-white font-mono">{p.project} · {p.coin}</span>
                      <div className="text-caption text-muted-blue">{p.chain} · TVL ${(p.tvl_usd / 1e6).toFixed(0)}M</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-ice-white font-mono">{fmtEur(p.amount_eur * scale)}</span>
                    <div className="text-caption font-mono" style={{ color: TIER_COLORS.T2 }}>
                      {p.risk_adj_apy?.toFixed(2)}% <span className="text-muted-blue">risk-adj</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-caption text-muted-blue">
              {yd.capital_tier === 'MICRO' ? 'T2 deaktiviert (Kapital < €5K — Gas Fees > APY-Vorteil).'
                : tw.T2 === 0 ? 'T2 = 0% im aktuellen Regime (Cash muss sofort verfügbar sein).'
                : 'Keine qualifizierten T2 Pools.'}
            </div>
          )}
          <div className="mt-2 text-caption text-muted-blue" style={{ fontSize: '10px' }}>
            {yd.t2_qualified_pools || 0} qualifizierte Pools gescannt. Nur Base APY (Reward APY ignoriert).
            Risk-Adjusted = Base APY − Chain Risk − SC Expected Loss.
          </div>
        </Section>
      </GlassCard>

      {/* T3 Basis Trade Info */}
      <GlassCard>
        <Section title="T3 — Basis Trade (nur Info)" defaultOpen={false}>
          <div className="text-caption text-muted-blue" style={{ lineHeight: '1.6' }}>
            Long Spot BTC + Short Perpetual Futures. Delta-neutral, verdient Funding Rate.
            Typischer APY: <strong className="text-ice-white">{basisTrade.typical_apy || '—'}</strong>.
            {basisTrade.note && <div className="mt-1">{basisTrade.note}</div>}
          </div>
        </Section>
      </GlassCard>

      {/* System Info */}
      <GlassCard>
        <Section title="System" defaultOpen={false}>
          <div className="space-y-1 text-caption text-muted-blue font-mono">
            <div>Version: {yd.version || '—'}</div>
            <div>Letzer Run: {fmtDate(yd.date)}</div>
            <div>Ensemble Input: {inputs.ensemble?.toFixed(2)}</div>
            <div>Cash: {fmtPct(cashPct)} = {fmtEur(realCash)}{usingUserCapital ? ' (aus Portfolio)' : ' (Backend-Default)'}</div>
            <div>Kapital: {usingUserCapital ? fmtEur(userCapital) : fmtEur(inputs.total_capital_eur || 0)}</div>
            <div>Spec: YIELD_ROUTER_SPEC_TEIL1+2</div>
          </div>
        </Section>
      </GlassCard>
    </div>
  );
}
