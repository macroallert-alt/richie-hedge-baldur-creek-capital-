'use client';

import GlassCard from '@/components/shared/GlassCard';
import { RISK_AMPEL_COLORS, COLORS } from '@/lib/constants';

const KS_LABELS = ['Max DD', 'Corr', 'Liquid', 'Regime'];

export default function RiskCard({ dashboard, onNavigate }) {
  const risk = dashboard.risk || {};
  const h = dashboard.header || {};
  const triggers = risk.emergency_triggers || {};
  const triggerValues = Object.values(triggers);
  const anyKS = triggerValues.some(v => v === true);
  const ampelColor = RISK_AMPEL_COLORS[risk.portfolio_status] || COLORS.mutedBlue;
  const topAlert = (risk.alerts || [])[0];

  return (
    <GlassCard variant="standard" stripeColor={ampelColor} onClick={() => onNavigate('risk')}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-label uppercase tracking-wider text-muted-blue">🛡️ Risk</span>
        {anyKS ? (
          <span className="text-label font-medium px-2 py-0.5 rounded bg-signal-red/20 text-signal-red">⚠️ KS!</span>
        ) : h.alerts_active_count > 0 ? (
          <span className="text-label font-medium px-2 py-0.5 rounded bg-signal-yellow/20 text-signal-yellow">
            {h.alerts_active_count} ALERTS
          </span>
        ) : null}
      </div>

      {/* Ampel */}
      <div className="flex items-center gap-2 mb-3">
        <span className="w-4 h-4 rounded-full" style={{ backgroundColor: ampelColor }} />
        <span className="text-data-large tabular-nums" style={{ color: ampelColor }}>
          {risk.portfolio_status || '—'}
        </span>
      </div>

      {/* Kill Switches */}
      <div className="flex flex-wrap gap-2 mb-3">
        {Object.entries(triggers).map(([key, active], i) => (
          <div key={key} className="flex flex-col items-center">
            <span className="text-body">{active ? '🔴' : '✅'}</span>
            <span className="text-[10px] text-muted-blue">{KS_LABELS[i] || `KS${i + 1}`}</span>
          </div>
        ))}
      </div>

      {/* Top Alert or KS Warning */}
      {anyKS ? (
        <div className="bg-signal-red/10 border border-signal-red/20 rounded-lg p-2 mb-2">
          <p className="text-caption text-signal-red font-medium">⚠️ KILL SWITCH AKTIV</p>
          <p className="text-caption text-muted-blue">
            {Object.entries(triggers).filter(([, v]) => v).map(([k]) => k.replace(/_/g, ' ')).join(', ')}
          </p>
        </div>
      ) : topAlert ? (
        <div className="mb-2">
          <p className="text-caption text-ice-white font-medium">Top Alert: {topAlert.check_name}</p>
          <p className="text-caption text-muted-blue">{topAlert.message} • {topAlert.severity}</p>
        </div>
      ) : null}

      <p className="text-caption text-muted-blue text-right">Alle Alerts →</p>
    </GlassCard>
  );
}
