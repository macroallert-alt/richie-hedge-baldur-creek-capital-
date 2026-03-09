'use client';

import GlassCard from '@/components/shared/GlassCard';
import { getDrawdownColor, getAssetLabel, getAssetLabelShort, COLORS } from '@/lib/constants';

export default function PortfolioDetail({ dashboard }) {
  const v16 = dashboard.v16 || {};
  const f6 = dashboard.f6 || {};
  const weights = v16.current_weights || {};
  const dd = v16.current_drawdown ?? 0;
  const ddColor = getDrawdownColor(dd);
  const deltas = v16.weight_deltas || {};
  const positions = f6.active_positions || [];
  const summary = f6.portfolio_summary || {};

  return (
    <div className="space-y-3 pt-3">
      <h1 className="text-page-title text-center text-ice-white">Portfolio</h1>

      <GlassCard variant="primary" stripeColor={ddColor}>
        <p className="text-label uppercase tracking-wider text-muted-blue mb-3">PORTFOLIO ÜBERSICHT</p>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <span className="text-caption text-muted-blue block">Drawdown</span>
            <span className="text-data-large tabular-nums" style={{ color: ddColor }}>{dd}%</span>
          </div>
          <div>
            <span className="text-caption text-muted-blue block">ENB</span>
            <span className="text-data-large tabular-nums text-ice-white">
              {v16.regime_confidence != null ? (v16.regime_confidence * 10).toFixed(1) : '—'}
            </span>
          </div>
          <div>
            <span className="text-caption text-muted-blue block">DD-Protect</span>
            <span className="text-data-medium tabular-nums text-ice-white">{v16.dd_protect_status || '—'}</span>
          </div>
          <div>
            <span className="text-caption text-muted-blue block">Threshold</span>
            <span className="text-data-medium tabular-nums text-muted-blue">{v16.dd_protect_threshold}%</span>
          </div>
        </div>
        <div className="mb-2">
          <div className="flex justify-between text-caption text-muted-blue mb-1">
            <span>DD-Protect Distance</span>
            <span>{v16.dd_protect_distance_pct}%</span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-signal-green" style={{ width: `${v16.dd_protect_distance_pct || 0}%` }} />
          </div>
        </div>
        <p className="text-caption text-muted-blue">Letztes Rebalancing: {v16.last_rebalance_date || '—'}</p>
      </GlassCard>

      <GlassCard variant="standard" stripeColor={COLORS.baldurBlue}>
        <p className="text-label uppercase tracking-wider text-muted-blue mb-3">V16 GEWICHTE (ALLE)</p>
        <div className="space-y-1.5">
          {Object.entries(weights).sort(([, a], [, b]) => b - a).map(([ticker, weight]) => (
            <div key={ticker} className="flex items-center gap-2">
              <span className="text-data-small tabular-nums text-ice-white w-44 truncate">{getAssetLabel(ticker)}</span>
              <span className="text-data-small tabular-nums text-muted-blue w-12 text-right">{Math.round(weight * 100)}%</span>
              <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-baldur-blue/60" style={{ width: `${Math.min(weight * 100 * 4, 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard variant="standard" stripeColor={COLORS.signalYellow}>
        <p className="text-label uppercase tracking-wider text-muted-blue mb-3">GEWICHTSÄNDERUNGEN</p>
        {(deltas.top_increases || []).length > 0 && (
          <div className="mb-3">
            <p className="text-caption text-signal-green mb-1">↑ ERHÖHUNGEN</p>
            {deltas.top_increases.map((d) => (
              <div key={d.ticker} className="flex items-center gap-2 mb-1">
                <span className="text-data-small text-ice-white w-24 truncate">{getAssetLabelShort(d.ticker)}</span>
                <span className="text-data-small tabular-nums text-muted-blue">{Math.round(d.yesterday * 100)}% → {Math.round(d.today * 100)}%</span>
                <span className="text-data-small tabular-nums text-signal-green">+{Math.round(d.delta * 100)}%</span>
              </div>
            ))}
          </div>
        )}
        {(deltas.top_decreases || []).length > 0 && (
          <div>
            <p className="text-caption text-signal-red mb-1">↓ REDUZIERUNGEN</p>
            {deltas.top_decreases.map((d) => (
              <div key={d.ticker} className="flex items-center gap-2 mb-1">
                <span className="text-data-small text-ice-white w-24 truncate">{getAssetLabelShort(d.ticker)}</span>
                <span className="text-data-small tabular-nums text-muted-blue">{Math.round(d.yesterday * 100)}% → {Math.round(d.today * 100)}%</span>
                <span className="text-data-small tabular-nums text-signal-red">{Math.round(d.delta * 100)}%</span>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      <GlassCard variant="standard" stripeColor={COLORS.signalGreen}>
        <p className="text-label uppercase tracking-wider text-muted-blue mb-3">F6 POSITIONEN ({summary.positions_count || 0})</p>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <span className="text-caption text-muted-blue block">Exposure</span>
            <span className="text-data-medium tabular-nums text-ice-white">{summary.total_exposure_pct || 0}%</span>
          </div>
          <div>
            <span className="text-caption text-muted-blue block">CC Coverage</span>
            <span className="text-data-medium tabular-nums text-signal-green">{summary.cc_coverage_pct || 0}%</span>
          </div>
        </div>
        {positions.map((pos) => {
          const pnlColor = pos.pnl_pct >= 0 ? COLORS.signalGreen : COLORS.signalRed;
          const dteColor = pos.cc_dte <= 5 ? COLORS.signalYellow : COLORS.signalGreen;
          return (
            <div key={pos.ticker} className="border-t border-white/5 py-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-data-medium text-ice-white font-medium">{pos.ticker}</span>
                <span className="text-data-medium tabular-nums" style={{ color: pnlColor }}>{pos.pnl_pct > 0 ? '+' : ''}{pos.pnl_pct}%</span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-caption text-muted-blue">
                <span>{pos.sector}</span>
                <span>Tag {pos.holding_day}</span>
                <span>CC Strike {pos.cc_strike}</span>
                <span style={{ color: dteColor }}>DTE {pos.cc_dte}</span>
                <span>{pos.cc_status}</span>
              </div>
            </div>
          );
        })}
      </GlassCard>
    </div>
  );
}
