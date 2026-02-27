'use client';

import GlassCard from '@/components/shared/GlassCard';
import { COLORS, DIRECTION_DISPLAY } from '@/lib/constants';

export default function SignalsCard({ dashboard, onNavigate }) {
  const signals = dashboard.signals || {};
  const f6 = dashboard.f6 || {};
  const router = signals.router_status || {};
  const pending = f6.pending_signals || [];

  return (
    <GlassCard variant="standard" stripeColor={COLORS.baldurBlue} onClick={() => onNavigate('signals')}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-label uppercase tracking-wider text-muted-blue">📡 Signals</span>
        <span className="text-label font-medium px-2 py-0.5 rounded bg-baldur-blue/20 text-baldur-blue">
          {signals.trade_count || 0} TRADES
        </span>
      </div>

      {/* Router Status */}
      <p className="text-caption text-muted-blue mb-2">ROUTER STATUS</p>
      <div className="space-y-1.5 mb-3">
        {Object.entries(router).map(([name, data]) => {
          const dir = DIRECTION_DISPLAY[data.trend] || DIRECTION_DISPLAY.STABLE;
          return (
            <div key={name} className="flex items-center gap-2">
              <span className="text-data-small text-ice-white w-28 truncate">{name.replace(/_/g, ' ')}</span>
              <span className="text-data-small tabular-nums text-muted-blue w-10 text-right">
                {data.proximity?.toFixed(2)}
              </span>
              <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-baldur-blue/50"
                  style={{ width: `${Math.min(data.proximity * 100, 100)}%` }}
                />
              </div>
              <span className="text-caption" style={{ color: dir.color }}>{data.trend}</span>
            </div>
          );
        })}
      </div>

      {/* F6 Pending */}
      {pending.length > 0 && (
        <div className="mb-3">
          <p className="text-caption text-muted-blue mb-1">F6 PENDING</p>
          {pending.map((s) => (
            <p key={s.ticker} className="text-caption text-ice-white">
              {s.ticker} Drift Day {s.drift_day} — {s.note?.split('—')[0] || ''}
            </p>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center gap-4 text-caption text-muted-blue">
        <span>Concentration: {Math.round((signals.effective_concentration || 0) * 100)}%</span>
        <span>PermOpt: {signals.permopt_status?.active ? 'Active' : 'Inactive'}</span>
      </div>

      <p className="text-caption text-muted-blue text-right mt-2">Alle Sig. →</p>
    </GlassCard>
  );
}
