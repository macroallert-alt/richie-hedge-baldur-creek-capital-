'use client';

import GlassCard from '@/components/shared/GlassCard';
import { COLORS, CYCLE_ALIGNMENT_COLORS, CYCLE_PHASE_COLORS, CYCLE_TIER_COLORS } from '@/lib/constants';

const CYCLE_ORDER = [
  { id: 'LIQUIDITY', label: 'Liquidity', tier: 1 },
  { id: 'CREDIT', label: 'Credit', tier: 1 },
  { id: 'COMMODITY', label: 'Commodity', tier: 1 },
  { id: 'CHINA_CREDIT', label: 'China', tier: 1 },
  { id: 'DOLLAR', label: 'Dollar', tier: 2 },
  { id: 'BUSINESS', label: 'Business', tier: 2 },
  { id: 'FED_RATES', label: 'Fed', tier: 2 },
  { id: 'EARNINGS', label: 'Earnings', tier: 2 },
  { id: 'TRADE', label: 'Trade', tier: 3 },
  { id: 'POLITICAL', label: 'Political', tier: 3 },
];

function phaseShort(phase) {
  if (!phase || phase === 'UNKNOWN') return '—';
  const map = {
    EARLY_RECOVERY: 'E.REC', LATE_EXPANSION: 'LATE', EARLY_BULL: 'E.BULL',
    MID_BULL: 'BULL', EARLY_STIMULUS: 'E.STIM', POST_INAUGURATION: 'P.INAUG',
    PRE_ELECTION: 'PRE.EL', PRE_PIVOT: 'PRE.PIV', DETERIORATION: 'DETER',
    STRENGTHENING: 'STRONG', CONTRACTION: 'CONTR',
  };
  return map[phase] || phase.slice(0, 6);
}

export default function CyclesCard({ dashboard, onNavigate }) {
  const cy = dashboard?.cycles;

  // No data yet
  if (!cy || !cy.cycle_phases) {
    return (
      <GlassCard variant="secondary" stripeColor={COLORS.mutedBlue} onClick={() => onNavigate('cycles')}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-label uppercase tracking-wider text-muted-blue">🔄 Cycles</span>
        </div>
        <p className="text-caption text-muted-blue">Cycles Engine noch nicht gelaufen.</p>
        <p className="text-caption text-muted-blue text-right mt-2">Details →</p>
      </GlassCard>
    );
  }

  const score = cy.alignment_score ?? 0;
  const label = cy.alignment_label || 'UNKNOWN';
  const stripeColor = CYCLE_ALIGNMENT_COLORS[label] || COLORS.mutedBlue;
  const phases = cy.cycle_phases || {};
  const dzCount = cy.in_danger_zone || 0;

  return (
    <GlassCard variant="secondary" stripeColor={stripeColor} onClick={() => onNavigate('cycles')}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-label uppercase tracking-wider text-muted-blue">🔄 Cycles</span>
        <span className="text-caption text-muted-blue">{cy.date || ''}</span>
      </div>

      {/* Alignment Score */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-xl font-mono font-bold" style={{ color: stripeColor }}>
            {score}/10
          </span>
          <span className="text-caption text-muted-blue ml-2">{label}</span>
        </div>
        <div className="flex gap-2 text-caption">
          <span style={{ color: COLORS.signalGreen }}>{cy.bullish || 0} Bull</span>
          <span style={{ color: COLORS.signalRed }}>{cy.bearish || 0} Bear</span>
          <span style={{ color: COLORS.mutedBlue }}>{cy.neutral || 0} Neut</span>
        </div>
      </div>

      {/* Cycle Grid: 5 columns × 2 rows */}
      <div className="grid grid-cols-5 gap-1 mb-2">
        {CYCLE_ORDER.map(({ id, label: lbl, tier }) => {
          const cp = phases[id] || {};
          const phase = cp.phase || 'UNKNOWN';
          const color = CYCLE_PHASE_COLORS[phase] || COLORS.fadedBlue;
          const inDanger = cp.in_danger_zone;
          return (
            <div
              key={id}
              className="text-center py-1 rounded"
              style={{
                backgroundColor: `${color}15`,
                borderLeft: `2px solid ${color}`,
              }}
            >
              <div className="text-caption font-mono" style={{ color: CYCLE_TIER_COLORS[tier] || COLORS.mutedBlue, fontSize: '9px' }}>
                {lbl}{inDanger ? ' ⚠' : ''}
              </div>
              <div className="font-mono font-bold" style={{ color, fontSize: '10px' }}>
                {phaseShort(phase)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Danger Zone Warning */}
      {dzCount > 0 && (
        <div className="text-caption mt-1" style={{ color: COLORS.signalOrange }}>
          ⚠ {dzCount} Danger Zone{dzCount > 1 ? 's' : ''} aktiv
        </div>
      )}

      {/* Footer */}
      <p className="text-caption text-muted-blue text-right mt-1">Details →</p>
    </GlassCard>
  );
}
