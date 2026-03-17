'use client';

import { useState, useEffect } from 'react';
import GlassCard from '@/components/shared/GlassCard';
import { COLORS } from '@/lib/constants';

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

const HEALTH_COLORS = {
  HIGH: COLORS.signalGreen || '#00E676',
  MEDIUM: COLORS.signalOrange || '#FFB300',
  LOW: COLORS.signalRed || '#FF5252',
};

const HEALTH_LABELS = {
  HIGH: 'Hohe Konfidenz',
  MEDIUM: 'Mittlere Konfidenz',
  LOW: 'Niedrige Konfidenz',
};

function formatDate(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch { return '—'; }
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function ThesenCard({ dashboard, onNavigate }) {
  const url = process.env.NEXT_PUBLIC_THESES_URL;
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!url) return;
    fetch(url)
      .then(r => r.json())
      .then(setData)
      .catch(() => {});
  }, [url]);

  // Kein Daten → Placeholder
  if (!data || !data.theses) {
    return (
      <GlassCard onClick={() => onNavigate('theses')} className="cursor-pointer">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-ice-white font-mono">💡 THESEN</span>
        </div>
        <p className="text-xs font-mono" style={{ color: COLORS.fadedBlue }}>
          Noch keine Daten verfügbar
        </p>
      </GlassCard>
    );
  }

  const meta = data.metadata || {};
  const theses = data.theses || [];
  const retro = data.retrospective || {};
  const health = meta.epistemic_health || 'LOW';
  const tier1 = theses.filter(t => t.tier === 1);
  const convChanges = (data.conviction_changes || []).filter(c => c.flagged || Math.abs(c.change || 0) > 20);

  // Stärkste These (höchster Score)
  const strongest = tier1.length > 0
    ? tier1.reduce((a, b) => (a.score || 0) >= (b.score || 0) ? a : b)
    : null;

  // Batting Average
  const batting = retro.batting_average || {};
  const hitRate = batting.hit_rate != null ? (batting.hit_rate * 100).toFixed(0) : null;

  return (
    <GlassCard onClick={() => onNavigate('theses')} className="cursor-pointer">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold text-ice-white font-mono">💡 THESEN</span>
        <span
          className="text-xs font-mono px-1.5 py-0.5 rounded"
          style={{
            color: HEALTH_COLORS[health],
            backgroundColor: `${HEALTH_COLORS[health]}15`,
            fontSize: '9px',
          }}
        >
          {HEALTH_LABELS[health] || health}
        </span>
      </div>

      {/* Tier-1 Count + Stärkste These */}
      <div className="mb-1.5">
        <p className="text-xs font-mono text-ice-white">
          {tier1.length} Kernthese{tier1.length !== 1 ? 'n' : ''} aktiv
        </p>
        {strongest && (
          <p className="text-xs font-mono mt-0.5" style={{ color: COLORS.fadedBlue }}>
            Stärkste: {strongest.title_short || strongest.title?.substring(0, 40)}
            {' '}({strongest.conviction}% · {'⚡'.repeat(Math.min(strongest.asymmetry || 0, 5))})
          </p>
        )}
      </div>

      {/* Batting Average */}
      {hitRate != null && batting.total_moves_tracked > 0 && (
        <p className="text-xs font-mono mb-1.5" style={{ color: COLORS.fadedBlue }}>
          Batting: {hitRate}% ({batting.had_thesis}/{batting.total_moves_tracked})
        </p>
      )}

      {/* Conviction Changes (geflaggte) */}
      {convChanges.length > 0 && (
        <div className="mt-1">
          {convChanges.slice(0, 2).map((cc, i) => {
            const isDown = (cc.change || 0) < 0;
            return (
              <p key={i} className="text-xs font-mono" style={{
                color: isDown ? COLORS.signalRed : COLORS.signalGreen,
                fontSize: '9px',
              }}>
                ⚠ {cc.title || cc.thesis_id}: {cc.from}% → {cc.to}%
                {' '}({isDown ? '▼' : '▲'}{Math.abs(cc.change || 0)})
              </p>
            );
          })}
        </div>
      )}

      {/* Stand */}
      <p className="text-xs font-mono mt-2" style={{ color: COLORS.fadedBlue, fontSize: '8px' }}>
        Stand: {formatDate(meta.generated_at)}
      </p>
    </GlassCard>
  );
}
