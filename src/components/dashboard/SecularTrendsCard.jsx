'use client';

import { useState, useEffect } from 'react';
import GlassCard from '@/components/shared/GlassCard';
import { COLORS } from '@/lib/constants';

const SECULAR_URL = process.env.NEXT_PUBLIC_SECULAR_TRENDS_URL;

const ASSET_LABELS = {
  gold: 'Gold', silver_copper: 'Silber/Kupfer', oil_commodities: 'Öl/Rohstoffe',
  spy_real: 'SPY (real)', bonds: 'Bonds',
};

export default function SecularTrendsCard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!SECULAR_URL) return;
    fetch(SECULAR_URL)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => setData(d))
      .catch(() => setError(true));
  }, []);

  if (error || !data) {
    return (
      <GlassCard>
        <div className="text-label uppercase tracking-wider text-muted-blue mb-2">Säkulare Trends</div>
        <div className="text-caption text-muted-blue">{error ? 'Laden fehlgeschlagen' : 'Laden...'}</div>
      </GlassCard>
    );
  }

  const cs = data.conviction_summary || {};
  const cascade = data.valuation_cascade?.cascade_summary || {};
  const strongest = cascade.strongest_signal;
  const tw = cs.tailwind_scores || {};

  // Best tailwind asset
  const bestAsset = Object.entries(tw).sort((a, b) => b[1] - a[1])[0];
  const worstAsset = Object.entries(tw).sort((a, b) => a[1] - b[1])[0];

  const convColor = cs.convergence_direction?.includes('REAL') ? COLORS.signalGreen
    : cs.convergence_direction?.includes('FINANCIAL') ? COLORS.signalRed : COLORS.signalYellow;

  const directionShort = cs.convergence_direction?.includes('REAL') ? 'REAL ASSETS'
    : cs.convergence_direction?.includes('FINANCIAL') ? 'FINANCIAL' : 'GEMISCHT';

  return (
    <GlassCard>
      <div className="flex items-center justify-between mb-2">
        <span className="text-label uppercase tracking-wider text-muted-blue">Säkulare Trends</span>
        <span className="px-2 py-0.5 rounded text-caption font-mono font-bold"
          style={{ backgroundColor: `${convColor}20`, color: convColor }}>
          {cs.active_regimes || 0}/{cs.total_regimes || 5}
        </span>
      </div>

      {/* Direction */}
      <div className="text-sm font-mono mb-2" style={{ color: convColor }}>
        Richtung: {directionShort}
      </div>

      {/* Best / Worst tailwind */}
      <div className="flex gap-3 mb-2">
        {bestAsset && bestAsset[1] > 0 && (
          <div className="text-caption font-mono" style={{ fontSize: '10px' }}>
            <span style={{ color: COLORS.mutedBlue }}>Top: </span>
            <span style={{ color: COLORS.signalGreen }}>
              {ASSET_LABELS[bestAsset[0]] || bestAsset[0]} {bestAsset[1] > 0 ? '+' : ''}{bestAsset[1]}%
            </span>
          </div>
        )}
        {worstAsset && worstAsset[1] < 0 && (
          <div className="text-caption font-mono" style={{ fontSize: '10px' }}>
            <span style={{ color: COLORS.mutedBlue }}>Schwach: </span>
            <span style={{ color: COLORS.signalRed }}>
              {ASSET_LABELS[worstAsset[0]] || worstAsset[0]} {worstAsset[1]}%
            </span>
          </div>
        )}
      </div>

      {/* Strongest cascade signal */}
      {strongest && (
        <div className="px-2 py-1.5 rounded" style={{ backgroundColor: `${COLORS.signalGreen}08`,
          borderLeft: `2px solid ${COLORS.signalGreen}` }}>
          <div className="text-caption font-mono" style={{ fontSize: '10px', color: COLORS.iceWhite }}>
            ⚡ {strongest.ratio}: {strongest.signal}
          </div>
        </div>
      )}

      {/* Robustness mini */}
      <div className="flex items-center gap-2 mt-2">
        <span className="text-caption" style={{ color: COLORS.fadedBlue, fontSize: '9px' }}>
          Robust: {cs.robust_active || 0}
        </span>
        {cs.fragile_active > 0 && (
          <span className="text-caption" style={{ color: COLORS.signalYellow, fontSize: '9px' }}>
            · Fragil: {cs.fragile_active}
          </span>
        )}
        {data.metadata?.generated_at && (
          <span className="text-caption ml-auto" style={{ color: COLORS.fadedBlue, fontSize: '9px' }}>
            {new Date(data.metadata.generated_at).toLocaleDateString('de-DE')}
          </span>
        )}
      </div>
    </GlassCard>
  );
}
