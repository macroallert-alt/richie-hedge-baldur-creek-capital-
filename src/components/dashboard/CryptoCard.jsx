'use client';

import { useState, useEffect } from 'react';
import {
  COLORS,
  getCryptoEnsembleColor,
  CRYPTO_PHASE_COLORS,
  CRYPTO_PHASE_NAMES,
  CRYPTO_ASSET_COLORS,
  CRYPTO_ACTION_COLORS,
} from '@/lib/constants';

const STATE_URL = process.env.NEXT_PUBLIC_CRYPTO_STATE_URL;
const DAILY_URL = process.env.NEXT_PUBLIC_CRYPTO_DAILY_URL;

export default function CryptoCard({ dashboard, onNavigate }) {
  const [stateData, setStateData] = useState(null);
  const [dailyData, setDailyData] = useState(null);

  useEffect(() => {
    const urls = [
      { url: STATE_URL, setter: setStateData },
      { url: DAILY_URL, setter: setDailyData },
    ].filter(u => u.url);
    if (!urls.length) return;
    Promise.allSettled(
      urls.map(u =>
        fetch(`${u.url}?t=${Date.now()}`, { cache: 'no-store' })
          .then(r => r.ok ? r.json() : null)
          .then(data => { if (data) u.setter(data); })
          .catch(() => {})
      )
    );
  }, []);

  const ws = stateData || {};
  const dd = dailyData || {};

  const btcPrice = dd.btc_price || ws.btc_price;
  const ensemble = dd.ensemble?.daily ?? ws.ensemble?.value ?? null;
  const phase = dd.weekly_signal?.phase ?? ws.trickle_down?.phase ?? 2;
  const alloc = dd.weekly_signal?.allocation ?? ws.allocation ?? {};
  const action = ws.action || 'HOLD';
  const alertCount = (dd.alerts || []).length;
  const ensembleChanged = dd.ensemble?.changed ?? false;

  const ensColor = getCryptoEnsembleColor(ensemble);
  const phaseColor = CRYPTO_PHASE_COLORS[phase] || COLORS.mutedBlue;
  const actionColor = CRYPTO_ACTION_COLORS[action] || COLORS.mutedBlue;

  const hasData = stateData || dailyData;

  return (
    <button
      onClick={() => onNavigate('crypto')}
      className="w-full rounded-lg border p-4 text-left transition-all hover:border-opacity-60"
      style={{ borderColor: `${COLORS.fadedBlue}30`, backgroundColor: COLORS.navyDeep }}
    >
      {/* Title */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span style={{ color: CRYPTO_ASSET_COLORS.BTC, fontSize: '14px' }}>₿</span>
          <span className="text-xs font-bold" style={{ color: COLORS.mutedBlue }}>Crypto</span>
        </div>
        {alertCount > 0 && (
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: COLORS.signalRed }} />
        )}
      </div>

      {hasData ? (
        <>
          {/* Ensemble + Phase */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-2xl font-bold font-mono" style={{ color: ensColor }}>
                {ensemble != null ? ensemble.toFixed(2) : '—'}
              </div>
              <div className="text-xs" style={{ color: COLORS.mutedBlue }}>Ensemble</div>
            </div>
            <div className="text-right">
              <span className="px-2 py-0.5 rounded text-xs font-bold font-mono"
                style={{ backgroundColor: `${phaseColor}20`, color: phaseColor }}>
                {CRYPTO_PHASE_NAMES[phase] || 'P' + phase}
              </span>
            </div>
          </div>

          {/* Allokation Bar */}
          <div className="flex gap-0.5 h-2.5 rounded-full overflow-hidden mb-2">
            {alloc.btc > 0 && <div style={{ flex: alloc.btc, backgroundColor: CRYPTO_ASSET_COLORS.BTC }} />}
            {alloc.eth > 0 && <div style={{ flex: alloc.eth, backgroundColor: CRYPTO_ASSET_COLORS.ETH }} />}
            {alloc.sol > 0 && <div style={{ flex: alloc.sol, backgroundColor: CRYPTO_ASSET_COLORS.SOL }} />}
            {alloc.cash > 0 && <div style={{ flex: alloc.cash, backgroundColor: CRYPTO_ASSET_COLORS.CASH }} />}
          </div>

          {/* Details */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span style={{ color: COLORS.fadedBlue }}>BTC</span>
              <span style={{ color: COLORS.mutedBlue }} className="font-mono">
                {btcPrice ? `$${Number(btcPrice).toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '—'}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span style={{ color: COLORS.fadedBlue }}>Allok</span>
              <span style={{ color: COLORS.mutedBlue }} className="font-mono">
                {alloc.total != null ? `${(alloc.total * 100).toFixed(0)}%` : '—'}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span style={{ color: COLORS.fadedBlue }}>Action</span>
              <span className="font-mono font-bold" style={{ color: actionColor }}>{action}</span>
            </div>
          </div>

          {ensembleChanged && (
            <div className="mt-2 text-center">
              <span className="px-2 py-0.5 rounded text-xs font-bold"
                style={{ backgroundColor: `${COLORS.signalOrange}20`, color: COLORS.signalOrange }}>
                SIGNAL GEÄNDERT
              </span>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-4">
          <span className="text-xs" style={{ color: COLORS.fadedBlue }}>Lade...</span>
        </div>
      )}
    </button>
  );
}
