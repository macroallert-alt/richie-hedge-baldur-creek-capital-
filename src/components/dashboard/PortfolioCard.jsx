'use client';

import GlassCard from '@/components/shared/GlassCard';
import { getDrawdownColor, getAssetLabelShort, COLORS } from '@/lib/constants';

export default function PortfolioCard({ dashboard, onNavigate }) {
  const v16 = dashboard.v16 || {};
  const f6 = dashboard.f6 || {};
  const top5 = v16.top_5_weights || [];
  const dd = v16.current_drawdown ?? 0;
  const stripeColor = getDrawdownColor(dd);

  return (
    <GlassCard variant="standard" stripeColor={stripeColor} onClick={() => onNavigate('portfolio')}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-label uppercase tracking-wider text-muted-blue">📊 Portfolio</span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <span className="text-caption text-muted-blue block">DD</span>
          <span className="text-data-medium tabular-nums" style={{ color: stripeColor }}>{dd}%</span>
        </div>
        <div>
          <span className="text-caption text-muted-blue block">ENB</span>
          <span className="text-data-medium tabular-nums text-ice-white">
            {v16.regime_confidence != null ? (v16.regime_confidence * 10).toFixed(1) : '—'}
          </span>
        </div>
      </div>

      <p className="text-caption text-muted-blue mb-2">TOP 5 GEWICHTE</p>
      <div className="space-y-1.5 mb-3">
        {top5.map(({ ticker, weight }) => (
          <div key={ticker} className="flex items-center gap-2">
            <span className="text-data-small tabular-nums text-ice-white w-24 truncate">{getAssetLabelShort(ticker)}</span>
            <span className="text-data-small tabular-nums text-muted-blue w-10 text-right">{Math.round(weight * 100)}%</span>
            <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-baldur-blue/60"
                style={{ width: `${Math.min(weight * 100 * 4, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-white/5 pt-2">
        <p className="text-caption text-muted-blue">
          F6: {f6.portfolio_summary?.positions_count || 0} Positionen, {f6.portfolio_summary?.total_exposure_pct || 0}% Exposure
        </p>
        <p className="text-caption text-muted-blue">
          CC Coverage: {f6.portfolio_summary?.cc_coverage_pct || 0}%
        </p>
      </div>

      <p className="text-caption text-muted-blue text-right mt-2">Details →</p>
    </GlassCard>
  );
}
