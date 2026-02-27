'use client';

import { COLORS, URGENCY_COLORS } from '@/lib/constants';

export default function SignalsDetail({ dashboard }) {
  const signals = dashboard?.signals || {};
  const v16 = dashboard?.v16 || {};
  const f6 = dashboard?.f6 || {};
  const ai = dashboard?.action_items || {};
  const router = signals.router_status || {};
  const weightDeltas = v16.weight_deltas || {};
  const pending = f6.pending_signals || [];
  const prominent = ai.prominent || [];

  return (
    <div className="py-4 space-y-4">
      <h1 className="text-page-title text-center lg:text-page-title text-center-desktop">Signals & Actions</h1>

      {/* Conviction Router */}
      <div className="glass-card p-4">
        <h2 className="text-section-title text-ice-white mb-3">Conviction Router</h2>
        <div className="space-y-3">
          {Object.entries(router).map(([name, data]) => {
            const pct = Math.round((data.proximity || 0) * 100);
            const isNear = pct >= 60;
            return (
              <div key={name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-body text-ice-white">{name.replace(/_/g, ' ')}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-data-small tabular-nums text-muted-blue">{pct}%</span>
                    <span className={`text-caption px-1.5 py-0.5 rounded ${
                      data.state === 'MONITORING' ? 'bg-signal-yellow/20 text-signal-yellow' : 'bg-white/5 text-muted-blue'
                    }`}>{data.state}</span>
                  </div>
                </div>
                <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden relative">
                  <div className={`h-full rounded-full transition-all duration-500 ${
                    isNear ? 'bg-signal-yellow/70' : 'bg-baldur-blue/50'
                  }`} style={{ width: `${pct}%` }} />
                  {/* Threshold marker at 80% */}
                  <div className="absolute top-0 h-full w-0.5 bg-signal-green/50" style={{ left: '80%' }} />
                </div>
                <p className="text-caption text-faded-blue mt-0.5">Trend: {data.trend}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* V16 Weight Changes */}
      <div className="glass-card p-4">
        <h2 className="text-section-title text-ice-white mb-3">V16 Gewichtsänderungen</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-caption text-signal-green mb-2">▲ Erhöht</p>
            {(weightDeltas.top_increases || []).map((w) => (
              <div key={w.ticker} className="flex items-center justify-between text-body mb-1">
                <span className="text-ice-white">{w.ticker}</span>
                <span className="tabular-nums text-signal-green">+{(w.delta * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
          <div>
            <p className="text-caption text-signal-red mb-2">▼ Reduziert</p>
            {(weightDeltas.top_decreases || []).map((w) => (
              <div key={w.ticker} className="flex items-center justify-between text-body mb-1">
                <span className="text-ice-white">{w.ticker}</span>
                <span className="tabular-nums text-signal-red">{(w.delta * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Items */}
      {prominent.length > 0 && (
        <div className="glass-card p-4">
          <h2 className="text-section-title text-ice-white mb-3">Action Items</h2>
          <div className="space-y-3">
            {prominent.map((item) => {
              const urgColor = URGENCY_COLORS[item.urgency] || COLORS.mutedBlue;
              return (
                <div key={item.id} className="border-l-2 pl-3 py-1" style={{ borderColor: urgColor }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-data-small font-medium" style={{ color: urgColor }}>{item.type}</span>
                    <span className="text-body text-ice-white">{item.target?.replace(/^EXP_/, '')}</span>
                    {item.delta_tag === 'NEU' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-baldur-blue/20 text-baldur-blue font-medium">NEU</span>
                    )}
                  </div>
                  <p className="text-caption text-muted-blue">{item.context}</p>
                  {item.suggested_actions?.map((a, i) => (
                    <p key={i} className="text-caption text-ice-white mt-0.5">→ {a}</p>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* F6 Pending */}
      {pending.length > 0 && (
        <div className="glass-card p-4">
          <h2 className="text-section-title text-ice-white mb-3">F6 Pending Signals</h2>
          {pending.map((s) => (
            <div key={s.ticker} className="border-l-2 border-signal-yellow/50 pl-3 py-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-data-small font-medium text-ice-white">{s.ticker}</span>
                <span className="text-caption text-muted-blue">{s.sector}</span>
                <span className="text-caption text-signal-yellow">Drift Day {s.drift_day}</span>
              </div>
              <p className="text-caption text-muted-blue">{s.note}</p>
            </div>
          ))}
        </div>
      )}

      {/* Portfolio Metrics */}
      <div className="glass-card p-4">
        <h2 className="text-section-title text-ice-white mb-3">Portfolio-Metriken</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-caption text-muted-blue block">Trade Count</span>
            <span className="text-data-medium tabular-nums text-ice-white">{signals.trade_count || 0}</span>
          </div>
          <div>
            <span className="text-caption text-muted-blue block">Concentration</span>
            <span className="text-data-medium tabular-nums text-ice-white">
              {Math.round((signals.effective_concentration || 0) * 100)}%
            </span>
          </div>
          <div>
            <span className="text-caption text-muted-blue block">PermOpt</span>
            <span className="text-data-medium text-ice-white">
              {signals.permopt_status?.active ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div>
            <span className="text-caption text-muted-blue block">PermOpt Budget</span>
            <span className="text-data-medium tabular-nums text-ice-white">
              {signals.permopt_status?.budget_pct ? `${(signals.permopt_status.budget_pct * 100).toFixed(1)}%` : '—'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
