'use client';

import { RISK_AMPEL_COLORS, SEVERITY_COLORS, COLORS, getDrawdownColor } from '@/lib/constants';

const KS_NAMES = {
  max_drawdown_breach: 'Max Drawdown',
  correlation_crisis: 'Correlation Crisis',
  liquidity_crisis: 'Liquidity Crisis',
  regime_forced: 'Regime Forced',
};

export default function RiskDetail({ dashboard }) {
  const risk = dashboard?.risk || {};
  const v16 = dashboard?.v16 || {};
  const ampelColor = RISK_AMPEL_COLORS[risk.portfolio_status] || COLORS.mutedBlue;
  const triggers = risk.emergency_triggers || {};
  const alerts = risk.alerts || [];
  const conditions = risk.ongoing_conditions || [];
  const dd = v16.current_drawdown ?? 0;
  const ddThreshold = v16.dd_protect_threshold ?? -10;
  const ddDistance = v16.dd_protect_distance_pct ?? 0;

  return (
    <div className="py-4 space-y-4">
      <h1 className="text-page-title text-center lg:text-page-title text-center-desktop">Risk Dashboard</h1>

      {/* Large Ampel */}
      <div className="glass-card-primary p-6 flex flex-col items-center">
        <div className="w-20 h-20 rounded-full mb-3 flex items-center justify-center"
          style={{ backgroundColor: `${ampelColor}30`, border: `3px solid ${ampelColor}` }}>
          <span className="text-[32px] font-bold tabular-nums" style={{ color: ampelColor }}>
            {risk.portfolio_status?.charAt(0) || '?'}
          </span>
        </div>
        <span className="text-data-large" style={{ color: ampelColor }}>
          {risk.portfolio_status || '—'}
        </span>
      </div>

      {/* Kill Switches */}
      <div className="glass-card p-4">
        <h2 className="text-section-title text-ice-white mb-3">Kill Switches</h2>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(triggers).map(([key, active]) => (
            <div key={key} className={`rounded-lg p-3 text-center ${
              active ? 'bg-signal-red/15 border border-signal-red/30' : 'bg-white/5 border border-white/5'
            }`}>
              <span className="text-data-medium block mb-1">{active ? '🔴' : '✅'}</span>
              <span className="text-caption text-muted-blue">{KS_NAMES[key] || key}</span>
            </div>
          ))}
        </div>
      </div>

      {/* DD-Protect Distance */}
      <div className="glass-card p-4">
        <h2 className="text-section-title text-ice-white mb-3">DD-Protect</h2>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-caption text-muted-blue">Aktuell:</span>
          <span className="text-data-medium tabular-nums" style={{ color: getDrawdownColor(dd) }}>{dd}%</span>
          <span className="text-caption text-muted-blue">Threshold:</span>
          <span className="text-data-medium tabular-nums text-signal-red">{ddThreshold}%</span>
        </div>
        <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden relative">
          <div className="h-full rounded-full bg-signal-green/60 transition-all duration-500"
            style={{ width: `${ddDistance}%` }} />
          <div className="absolute right-0 top-0 h-full w-0.5 bg-signal-red" />
        </div>
        <p className="text-caption text-muted-blue mt-1">Distanz: {ddDistance}% vom Threshold</p>
      </div>

      {/* Active Alerts */}
      <div className="glass-card p-4">
        <h2 className="text-section-title text-ice-white mb-3">Aktive Alerts ({alerts.length})</h2>
        <div className="space-y-3">
          {alerts
            .sort((a, b) => {
              const order = { EMERGENCY: 0, CRITICAL: 1, WARNING: 2, MONITOR: 3 };
              return (order[a.severity] ?? 9) - (order[b.severity] ?? 9);
            })
            .map((alert) => {
              const sevColor = SEVERITY_COLORS[alert.severity] || COLORS.mutedBlue;
              return (
                <div key={alert.id} className="border-l-2 pl-3 py-1" style={{ borderColor: sevColor }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-data-small font-medium" style={{ color: sevColor }}>
                      {alert.severity}
                    </span>
                    <span className="text-body text-ice-white">{alert.check_name}</span>
                    {alert.delta_tag === 'NEU' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-baldur-blue/20 text-baldur-blue font-medium">NEU</span>
                    )}
                  </div>
                  <p className="text-caption text-muted-blue">{alert.message}</p>
                  <p className="text-caption text-faded-blue">
                    Trend: {alert.trend} • Seit {alert.days_active} Tag{alert.days_active > 1 ? 'en' : ''}
                  </p>
                </div>
              );
            })}
        </div>
      </div>

      {/* Ongoing Conditions */}
      {conditions.length > 0 && (
        <div className="glass-card p-4">
          <h2 className="text-section-title text-ice-white mb-3">Laufende Bedingungen</h2>
          <div className="space-y-2">
            {conditions.map((c, i) => (
              <div key={i} className="flex items-center justify-between text-caption">
                <span className="text-muted-blue">{c.condition}</span>
                <span className="text-faded-blue tabular-nums">{c.days_active}d • {c.trend}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
