'use client';

import GlassCard from '@/components/shared/GlassCard';
import { REGIME_COLORS, COLORS, getDrawdownColor } from '@/lib/constants';

export default function SystemStatusCard({ dashboard }) {
  const h = dashboard.header || {};
  const v16 = dashboard.v16 || {};
  const risk = dashboard.risk || {};
  const triggers = risk.emergency_triggers || {};
  const anyKS = Object.values(triggers).some(v => v === true);
  const ksCount = Object.values(triggers).filter(v => v === true).length;

  const regimeColor = REGIME_COLORS[h.v16_regime] || COLORS.mutedBlue;
  const ddColor = getDrawdownColor(v16.current_drawdown || 0);

  const dqColors = { FULL: COLORS.signalGreen, DEGRADED: COLORS.signalYellow, CRITICAL: COLORS.signalRed };
  const dqColor = dqColors[h.data_quality] || COLORS.mutedBlue;

  return (
    <GlassCard variant="primary" stripeColor={regimeColor}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-label uppercase tracking-wider text-muted-blue">System Status</span>
        <span className="text-label font-medium" style={{ color: anyKS ? COLORS.signalRed : COLORS.signalGreen }}>
          {anyKS ? `🔴 ${ksCount} KS` : 'KS ✅'}
        </span>
      </div>

      {/* Regime */}
      <div className="flex items-center gap-2 mb-1">
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: regimeColor }} />
        <span className="text-data-large tabular-nums" style={{ color: regimeColor }}>
          {h.v16_regime?.replace(/_/g, ' ') || '—'}
        </span>
      </div>
      <p className="text-data-small text-muted-blue mb-4">V16: {v16.regime || h.v16_regime || '—'}</p>

      {/* Data Grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3">
        <div>
          <span className="text-caption text-muted-blue block">DD</span>
          <span className="text-data-medium tabular-nums" style={{ color: ddColor }}>
            {v16.current_drawdown != null ? `${v16.current_drawdown}%` : '—'}
          </span>
        </div>
        <div>
          <span className="text-caption text-muted-blue block">ENB</span>
          <span className="text-data-medium tabular-nums text-ice-white">
            {v16.regime_confidence != null ? (v16.regime_confidence * 10).toFixed(1) : '—'}
          </span>
        </div>
        <div>
          <span className="text-caption text-muted-blue block">Conv</span>
          <span className="text-data-medium tabular-nums text-ice-white">
            {h.system_conviction || '—'}
          </span>
        </div>
        <div>
          <span className="text-caption text-muted-blue block">DQ</span>
          <span className="text-data-medium tabular-nums" style={{ color: dqColor }}>
            {h.data_quality || '—'}
          </span>
        </div>
      </div>

      {/* Pipeline */}
      <div className="flex items-center gap-2 text-caption text-muted-blue">
        <span>Pipeline: {h.pipeline_status === 'OK' ? '✅ OK' : h.pipeline_status === 'DEGRADED' ? '⚠️ DEGRADED' : '❌ FAILED'}</span>
        <span>│</span>
        <span>{new Date(dashboard.generated_at).toISOString().slice(11, 16)} UTC</span>
      </div>
    </GlassCard>
  );
}
