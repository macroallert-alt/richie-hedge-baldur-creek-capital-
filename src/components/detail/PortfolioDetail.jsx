'use client';

import { useState } from 'react';
import GlassCard from '@/components/shared/GlassCard';
import { getDrawdownColor, getAssetLabel, getAssetLabelShort, COLORS, CLUSTER_COLORS, CLUSTER_MAP, ASSET_TO_CLUSTER } from '@/lib/constants';

// localStorage helpers — gleiche Keys wie Rotation Rebalancer
function loadSaved(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}
function savePersistent(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* noop */ }
}

export default function PortfolioDetail({ dashboard }) {
  const v16 = dashboard.v16 || {};
  const f6 = dashboard.f6 || {};
  const weights = v16.current_weights || {};
  const dd = v16.current_drawdown ?? 0;
  const ddColor = getDrawdownColor(dd);
  const deltas = v16.weight_deltas || {};
  const positions = f6.active_positions || [];
  const summary = f6.portfolio_summary || {};

  return (
    <div className="space-y-3 pt-3">
      <h1 className="text-page-title text-center text-ice-white">Portfolio</h1>

      <GlassCard variant="primary" stripeColor={ddColor}>
        <p className="text-label uppercase tracking-wider text-muted-blue mb-3">PORTFOLIO ÜBERSICHT</p>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <span className="text-caption text-muted-blue block">Drawdown</span>
            <span className="text-data-large tabular-nums" style={{ color: ddColor }}>{dd}%</span>
          </div>
          <div>
            <span className="text-caption text-muted-blue block">ENB</span>
            <span className="text-data-large tabular-nums text-ice-white">
              {v16.regime_confidence != null ? (v16.regime_confidence * 10).toFixed(1) : '—'}
            </span>
          </div>
          <div>
            <span className="text-caption text-muted-blue block">DD-Protect</span>
            <span className="text-data-medium tabular-nums text-ice-white">{v16.dd_protect_status || '—'}</span>
          </div>
          <div>
            <span className="text-caption text-muted-blue block">Threshold</span>
            <span className="text-data-medium tabular-nums text-muted-blue">{v16.dd_protect_threshold}%</span>
          </div>
        </div>
        <div className="mb-2">
          <div className="flex justify-between text-caption text-muted-blue mb-1">
            <span>DD-Protect Distance</span>
            <span>{v16.dd_protect_distance_pct}%</span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-signal-green" style={{ width: `${v16.dd_protect_distance_pct || 0}%` }} />
          </div>
        </div>
        <p className="text-caption text-muted-blue">Letztes Rebalancing: {v16.last_rebalance_date || '—'}</p>
      </GlassCard>

      {/* MEIN PORTFOLIO — Ist-Bestände eingeben + Ist vs Ziel */}
      <MyPortfolioCard weights={weights} />

      <GlassCard variant="standard" stripeColor={COLORS.baldurBlue}>
        <p className="text-label uppercase tracking-wider text-muted-blue mb-3">V16 GEWICHTE (ALLE)</p>
        <div className="space-y-1.5">
          {Object.entries(weights).sort(([, a], [, b]) => b - a).map(([ticker, weight]) => (
            <div key={ticker} className="flex items-center gap-2">
              <span className="text-data-small tabular-nums text-ice-white w-44 truncate">{getAssetLabel(ticker)}</span>
              <span className="text-data-small tabular-nums text-muted-blue w-12 text-right">{Math.round(weight * 100)}%</span>
              <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-baldur-blue/60" style={{ width: `${Math.min(weight * 100 * 4, 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard variant="standard" stripeColor={COLORS.signalYellow}>
        <p className="text-label uppercase tracking-wider text-muted-blue mb-3">GEWICHTSÄNDERUNGEN</p>
        {(deltas.top_increases || []).length > 0 && (
          <div className="mb-3">
            <p className="text-caption text-signal-green mb-1">↑ ERHÖHUNGEN</p>
            {deltas.top_increases.map((d) => (
              <div key={d.ticker} className="flex items-center gap-2 mb-1">
                <span className="text-data-small text-ice-white w-24 truncate">{getAssetLabelShort(d.ticker)}</span>
                <span className="text-data-small tabular-nums text-muted-blue">{Math.round(d.yesterday * 100)}% → {Math.round(d.today * 100)}%</span>
                <span className="text-data-small tabular-nums text-signal-green">+{Math.round(d.delta * 100)}%</span>
              </div>
            ))}
          </div>
        )}
        {(deltas.top_decreases || []).length > 0 && (
          <div>
            <p className="text-caption text-signal-red mb-1">↓ REDUZIERUNGEN</p>
            {deltas.top_decreases.map((d) => (
              <div key={d.ticker} className="flex items-center gap-2 mb-1">
                <span className="text-data-small text-ice-white w-24 truncate">{getAssetLabelShort(d.ticker)}</span>
                <span className="text-data-small tabular-nums text-muted-blue">{Math.round(d.yesterday * 100)}% → {Math.round(d.today * 100)}%</span>
                <span className="text-data-small tabular-nums text-signal-red">{Math.round(d.delta * 100)}%</span>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      <GlassCard variant="standard" stripeColor={COLORS.signalGreen}>
        <p className="text-label uppercase tracking-wider text-muted-blue mb-3">F6 POSITIONEN ({summary.positions_count || 0})</p>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <span className="text-caption text-muted-blue block">Exposure</span>
            <span className="text-data-medium tabular-nums text-ice-white">{summary.total_exposure_pct || 0}%</span>
          </div>
          <div>
            <span className="text-caption text-muted-blue block">CC Coverage</span>
            <span className="text-data-medium tabular-nums text-signal-green">{summary.cc_coverage_pct || 0}%</span>
          </div>
        </div>
        {positions.map((pos) => {
          const pnlColor = pos.pnl_pct >= 0 ? COLORS.signalGreen : COLORS.signalRed;
          const dteColor = pos.cc_dte <= 5 ? COLORS.signalYellow : COLORS.signalGreen;
          return (
            <div key={pos.ticker} className="border-t border-white/5 py-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-data-medium text-ice-white font-medium">{pos.ticker}</span>
                <span className="text-data-medium tabular-nums" style={{ color: pnlColor }}>{pos.pnl_pct > 0 ? '+' : ''}{pos.pnl_pct}%</span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-caption text-muted-blue">
                <span>{pos.sector}</span>
                <span>Tag {pos.holding_day}</span>
                <span>CC Strike {pos.cc_strike}</span>
                <span style={{ color: dteColor }}>DTE {pos.cc_dte}</span>
                <span>{pos.cc_status}</span>
              </div>
            </div>
          );
        })}
      </GlassCard>
    </div>
  );
}

// ============================================================
// MEIN PORTFOLIO — Ist-Bestände + Ist vs Ziel Vergleich
// ============================================================

function MyPortfolioCard({ weights }) {
  const [aum, setAum] = useState(() => loadSaved('bcc_rebalancer_aum', ''));
  const [inputMode, setInputMode] = useState(() => loadSaved('bcc_rebalancer_inputmode', 'eur'));
  const [holdings, setHoldings] = useState(() => loadSaved('bcc_rebalancer_holdings', {}));

  const aumNum = parseFloat(aum) || 0;

  // Nur Assets mit Gewicht > 0, sortiert
  const activeAssets = Object.entries(weights)
    .filter(([, w]) => w > 0)
    .sort((a, b) => b[1] - a[1]);

  const updateAum = (val) => { setAum(val); savePersistent('bcc_rebalancer_aum', val); };
  const updateInputMode = (val) => { setInputMode(val); savePersistent('bcc_rebalancer_inputmode', val); };
  const updateHolding = (ticker, field, val) => {
    setHoldings(prev => {
      const next = { ...prev, [ticker]: { ...(prev[ticker] || {}), [field]: val } };
      savePersistent('bcc_rebalancer_holdings', next);
      return next;
    });
  };
  const resetAll = () => {
    setAum('');
    setHoldings({});
    savePersistent('bcc_rebalancer_aum', '');
    savePersistent('bcc_rebalancer_holdings', {});
  };

  const getHoldingValue = (ticker) => {
    const h = holdings[ticker] || {};
    if (inputMode === 'eur') return parseFloat(h.eur) || 0;
    return (parseFloat(h.units) || 0) * (parseFloat(h.price) || 0);
  };

  const totalHoldings = activeAssets.reduce((sum, [t]) => sum + getHoldingValue(t), 0);
  const hasAnyHoldings = activeAssets.some(([t]) => getHoldingValue(t) > 0);

  const fmtEur = (val) => val.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

  // Cluster-Aggregation fuer Balken
  const clusterIst = {};
  const clusterZiel = {};
  activeAssets.forEach(([ticker, w]) => {
    const ck = ASSET_TO_CLUSTER[ticker] || 'OTHER';
    const holdVal = getHoldingValue(ticker);
    clusterIst[ck] = (clusterIst[ck] || 0) + holdVal;
    if (aumNum > 0) clusterZiel[ck] = (clusterZiel[ck] || 0) + w * aumNum;
  });

  return (
    <GlassCard variant="standard" stripeColor={COLORS.signalGreen}>
      <p className="text-label uppercase tracking-wider text-muted-blue mb-3">MEIN PORTFOLIO</p>

      {/* AUM Eingabe */}
      <div className="mb-3">
        <label className="text-caption text-muted-blue block mb-1">Portfolio-Zielwert (AUM)</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="z.B. 100000"
            value={aum}
            onChange={(e) => updateAum(e.target.value)}
            className="flex-1 rounded px-3 py-2 text-sm outline-none"
            style={{
              backgroundColor: `${COLORS.fadedBlue}20`,
              color: COLORS.iceWhite,
              border: `1px solid ${COLORS.fadedBlue}40`,
            }}
          />
          <span className="text-caption text-muted-blue">EUR</span>
        </div>
      </div>

      {aumNum > 0 && (
        <>
          {/* Input-Mode Toggle */}
          <div className="flex items-center justify-between mb-3">
            <label className="text-caption text-muted-blue">Bestände eingeben als:</label>
            <div className="flex rounded overflow-hidden" style={{ border: `1px solid ${COLORS.fadedBlue}40` }}>
              <button
                onClick={() => updateInputMode('eur')}
                className="py-1 px-3 text-caption transition-colors"
                style={{
                  backgroundColor: inputMode === 'eur' ? COLORS.baldurBlue : 'transparent',
                  color: inputMode === 'eur' ? '#fff' : COLORS.mutedBlue,
                }}
              >
                € Beträge
              </button>
              <button
                onClick={() => updateInputMode('units')}
                className="py-1 px-3 text-caption transition-colors"
                style={{
                  backgroundColor: inputMode === 'units' ? COLORS.baldurBlue : 'transparent',
                  color: inputMode === 'units' ? '#fff' : COLORS.mutedBlue,
                }}
              >
                Stück × Kurs
              </button>
            </div>
          </div>

          {/* Asset-Eingabefelder */}
          <div className="space-y-1.5 mb-3">
            {activeAssets.map(([ticker, w]) => {
              const h = holdings[ticker] || {};
              const holdVal = getHoldingValue(ticker);
              const targetVal = w * aumNum;
              const delta = targetVal - holdVal;
              const istPct = totalHoldings > 0 ? (holdVal / totalHoldings * 100) : 0;
              const zielPct = w * 100;

              return (
                <div key={ticker} className="rounded p-2" style={{ backgroundColor: `${COLORS.fadedBlue}08` }}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-data-small text-ice-white font-medium">{getAssetLabelShort(ticker)}</span>
                    <span className="text-caption text-muted-blue">
                      Ziel: {zielPct.toFixed(1)}%{holdVal > 0 ? ` • Ist: ${istPct.toFixed(1)}%` : ''}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {inputMode === 'eur' ? (
                      <>
                        <input
                          type="number"
                          placeholder="0"
                          value={h.eur || ''}
                          onChange={(e) => updateHolding(ticker, 'eur', e.target.value)}
                          className="flex-1 rounded px-2 py-1 text-caption outline-none"
                          style={{
                            backgroundColor: `${COLORS.fadedBlue}20`,
                            color: COLORS.iceWhite,
                            border: `1px solid ${COLORS.fadedBlue}30`,
                          }}
                        />
                        <span className="text-caption text-muted-blue">€</span>
                      </>
                    ) : (
                      <>
                        <input
                          type="number"
                          placeholder="Stk"
                          value={h.units || ''}
                          onChange={(e) => updateHolding(ticker, 'units', e.target.value)}
                          className="w-20 rounded px-2 py-1 text-caption outline-none"
                          style={{
                            backgroundColor: `${COLORS.fadedBlue}20`,
                            color: COLORS.iceWhite,
                            border: `1px solid ${COLORS.fadedBlue}30`,
                          }}
                        />
                        <span className="text-caption text-muted-blue">×</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Kurs"
                          value={h.price || ''}
                          onChange={(e) => updateHolding(ticker, 'price', e.target.value)}
                          className="w-20 rounded px-2 py-1 text-caption outline-none"
                          style={{
                            backgroundColor: `${COLORS.fadedBlue}20`,
                            color: COLORS.iceWhite,
                            border: `1px solid ${COLORS.fadedBlue}30`,
                          }}
                        />
                        <span className="text-caption text-muted-blue">€</span>
                      </>
                    )}
                    {holdVal > 0 && (
                      <span className="text-caption font-medium min-w-[70px] text-right" style={{
                        color: Math.abs(delta) < aumNum * 0.005 ? COLORS.fadedBlue
                          : delta > 0 ? COLORS.signalGreen : COLORS.signalRed
                      }}>
                        {delta >= 0 ? '+' : ''}{fmtEur(delta)}
                      </span>
                    )}
                  </div>

                  {/* Ist vs Ziel Balken */}
                  {holdVal > 0 && (
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden relative">
                        {/* Ziel = volle Breite als Referenz */}
                        <div className="absolute h-full rounded-full opacity-30" style={{
                          width: `${Math.min(zielPct * 4, 100)}%`,
                          backgroundColor: CLUSTER_COLORS[ASSET_TO_CLUSTER[ticker]] || COLORS.baldurBlue,
                        }} />
                        {/* Ist = tatsaechliche Breite */}
                        <div className="absolute h-full rounded-full" style={{
                          width: `${Math.min(istPct * 4, 100)}%`,
                          backgroundColor: CLUSTER_COLORS[ASSET_TO_CLUSTER[ticker]] || COLORS.baldurBlue,
                        }} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Zusammenfassung + Cluster-Balken */}
          {hasAnyHoldings && (
            <div className="rounded p-3 space-y-3" style={{ backgroundColor: `${COLORS.fadedBlue}10`, border: `1px solid ${COLORS.fadedBlue}20` }}>
              {/* Zahlen */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <span className="text-caption text-muted-blue block">Ist</span>
                  <span className="text-data-small tabular-nums text-ice-white">{fmtEur(totalHoldings)}</span>
                </div>
                <div>
                  <span className="text-caption text-muted-blue block">Ziel</span>
                  <span className="text-data-small tabular-nums text-ice-white">{fmtEur(aumNum)}</span>
                </div>
                <div>
                  <span className="text-caption text-muted-blue block">Diff</span>
                  <span className="text-data-small tabular-nums" style={{
                    color: aumNum - totalHoldings > 0 ? COLORS.signalGreen : aumNum - totalHoldings < 0 ? COLORS.signalRed : COLORS.fadedBlue
                  }}>
                    {aumNum - totalHoldings >= 0 ? '+' : ''}{fmtEur(aumNum - totalHoldings)}
                  </span>
                </div>
              </div>

              {/* Cluster-Balken: IST */}
              {totalHoldings > 0 && (
                <div>
                  <p className="text-caption text-muted-blue mb-1">IST-Allokation (Cluster)</p>
                  <div className="flex h-5 rounded overflow-hidden">
                    {Object.entries(clusterIst)
                      .filter(([, v]) => v > 0)
                      .sort((a, b) => b[1] - a[1])
                      .map(([ck, val]) => {
                        const pct = (val / totalHoldings) * 100;
                        return (
                          <div
                            key={ck}
                            className="flex items-center justify-center text-caption font-medium overflow-hidden"
                            style={{
                              width: `${Math.max(pct, 3)}%`,
                              backgroundColor: CLUSTER_COLORS[ck] || COLORS.mutedBlue,
                              color: '#0A1628',
                              minWidth: '16px',
                            }}
                            title={`${CLUSTER_MAP[ck]?.name || ck}: ${pct.toFixed(1)}%`}
                          >
                            {pct > 12 && <span>{pct.toFixed(0)}%</span>}
                          </div>
                        );
                      })}
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                    {Object.entries(clusterIst)
                      .filter(([, v]) => v > 0)
                      .sort((a, b) => b[1] - a[1])
                      .map(([ck, val]) => (
                        <span key={ck} className="flex items-center gap-1 text-caption text-muted-blue">
                          <span className="inline-block w-2 h-2 rounded-sm" style={{ backgroundColor: CLUSTER_COLORS[ck] }} />
                          {CLUSTER_MAP[ck]?.name?.split(' ').pop() || ck} {(val / totalHoldings * 100).toFixed(1)}%
                        </span>
                      ))}
                  </div>
                </div>
              )}

              {/* Cluster-Balken: ZIEL */}
              {aumNum > 0 && (
                <div>
                  <p className="text-caption text-muted-blue mb-1">ZIEL-Allokation (Cluster)</p>
                  <div className="flex h-5 rounded overflow-hidden">
                    {Object.entries(clusterZiel)
                      .filter(([, v]) => v > 0)
                      .sort((a, b) => b[1] - a[1])
                      .map(([ck, val]) => {
                        const pct = (val / aumNum) * 100;
                        return (
                          <div
                            key={ck}
                            className="flex items-center justify-center text-caption font-medium overflow-hidden"
                            style={{
                              width: `${Math.max(pct, 3)}%`,
                              backgroundColor: CLUSTER_COLORS[ck] || COLORS.mutedBlue,
                              color: '#0A1628',
                              minWidth: '16px',
                              opacity: 0.6,
                            }}
                            title={`${CLUSTER_MAP[ck]?.name || ck}: ${pct.toFixed(1)}%`}
                          >
                            {pct > 12 && <span>{pct.toFixed(0)}%</span>}
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Reset */}
          <div className="flex justify-end mt-2">
            <button
              onClick={resetAll}
              className="text-caption px-3 py-1 rounded transition-colors"
              style={{ color: COLORS.fadedBlue, border: `1px solid ${COLORS.fadedBlue}30` }}
            >
              Zurücksetzen
            </button>
          </div>
        </>
      )}
    </GlassCard>
  );
}
