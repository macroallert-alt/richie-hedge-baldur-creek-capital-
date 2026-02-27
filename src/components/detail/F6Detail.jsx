'use client';

import { COLORS } from '@/lib/constants';
import { formatDateShort } from '@/lib/time-utils';

const PNL_COLOR = (pnl) => pnl >= 0 ? COLORS.signalGreen : COLORS.signalRed;
const CC_STATUS_STYLE = {
  OK: 'bg-signal-green/20 text-signal-green',
  NEAR_EXPIRY: 'bg-signal-yellow/20 text-signal-yellow',
  EXPIRED: 'bg-signal-red/20 text-signal-red',
};

export default function F6Detail({ dashboard }) {
  const f6 = dashboard?.f6 || {};
  const summary = f6.portfolio_summary || {};
  const positions = f6.active_positions || [];
  const pending = f6.pending_signals || [];
  const ccWarnings = f6.cc_expiry_warnings || [];

  return (
    <div className="py-4 space-y-4">
      <h1 className="text-page-title text-center lg:text-page-title text-center-desktop">F6 Stock Picker</h1>

      {/* Portfolio Summary */}
      <div className="glass-card-primary p-4">
        <h2 className="text-section-title text-ice-white mb-3">Portfolio Übersicht</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-caption text-muted-blue block">Positionen</span>
            <span className="text-data-large tabular-nums text-ice-white">{summary.positions_count ?? 0}</span>
          </div>
          <div>
            <span className="text-caption text-muted-blue block">Exposure</span>
            <span className="text-data-large tabular-nums text-ice-white">{summary.total_exposure_pct ?? 0}%</span>
          </div>
          <div>
            <span className="text-caption text-muted-blue block">∅ Haltetage</span>
            <span className="text-data-medium tabular-nums text-ice-white">{summary.avg_holding_days?.toFixed(1) ?? '—'}</span>
          </div>
          <div>
            <span className="text-caption text-muted-blue block">CC Coverage</span>
            <span className="text-data-medium tabular-nums text-signal-green">{summary.cc_coverage_pct ?? 0}%</span>
          </div>
        </div>
      </div>

      {/* CC Expiry Warnings */}
      {ccWarnings.length > 0 && (
        <div className="bg-signal-yellow/10 border border-signal-yellow/20 rounded-card p-4">
          <h2 className="text-section-title text-signal-yellow mb-2">⚠️ CC Expiry Warnings</h2>
          {ccWarnings.map((w) => (
            <div key={w.ticker} className="flex items-center justify-between">
              <span className="text-body text-ice-white">{w.ticker}</span>
              <span className="text-data-small tabular-nums text-signal-yellow">DTE {w.cc_dte}</span>
            </div>
          ))}
        </div>
      )}

      {/* Active Positions */}
      <div className="glass-card p-4">
        <h2 className="text-section-title text-ice-white mb-3">Aktive Positionen</h2>
        <div className="space-y-3">
          {positions.map((pos) => (
            <div key={pos.ticker} className="border-l-2 pl-3 py-2" style={{ borderColor: PNL_COLOR(pos.pnl_pct) }}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-data-medium font-medium text-ice-white">{pos.ticker}</span>
                  <span className="text-caption text-muted-blue">{pos.sector}</span>
                </div>
                <span className="text-data-medium tabular-nums" style={{ color: PNL_COLOR(pos.pnl_pct) }}>
                  {pos.pnl_pct > 0 ? '+' : ''}{pos.pnl_pct}%
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-caption text-muted-blue">
                <span>Entry: {formatDateShort(pos.entry_date)}</span>
                <span>Tag {pos.holding_day}</span>
                <span className={CC_STATUS_STYLE[pos.cc_status] || ''}>
                  CC: {pos.cc_status} (DTE {pos.cc_dte})
                </span>
              </div>

              <div className="flex items-center gap-2 mt-1 text-caption">
                <span className="text-muted-blue">Strike: ${pos.cc_strike}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending Signals */}
      {pending.length > 0 && (
        <div className="glass-card p-4">
          <h2 className="text-section-title text-ice-white mb-3">Pending Signals</h2>
          {pending.map((s) => (
            <div key={s.ticker} className="border-l-2 border-signal-yellow/50 pl-3 py-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-data-medium font-medium text-ice-white">{s.ticker}</span>
                <span className="text-caption text-muted-blue">{s.sector}</span>
                <span className="text-caption px-1.5 py-0.5 rounded bg-signal-yellow/20 text-signal-yellow">
                  Drift Day {s.drift_day}
                </span>
              </div>
              <p className="text-caption text-muted-blue">{s.note}</p>
              <div className="flex items-center gap-3 mt-1 text-caption text-faded-blue">
                <span>Rarity: {(s.sector_rarity * 100).toFixed(1)}%</span>
                <span>Heat: {s.heat}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
