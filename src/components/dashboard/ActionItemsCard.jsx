'use client';

import GlassCard from '@/components/shared/GlassCard';
import { COLORS, URGENCY_COLORS } from '@/lib/constants';

export default function ActionItemsCard({ dashboard, onNavigate }) {
  const ai = dashboard.action_items || {};
  const summary = ai.summary || {};
  const prominent = ai.prominent || [];
  const actCount = summary.act_count || 0;

  // Stripe color per Spec §4.3
  let stripeColor = COLORS.signalGreen;
  if (actCount > 0) stripeColor = COLORS.signalRed;
  else if (summary.review_count > 0) stripeColor = COLORS.signalOrange;
  else if (summary.watch_count > 0) stripeColor = COLORS.signalYellow;

  // Empty state
  if (summary.total === 0 || prominent.length === 0) {
    return (
      <GlassCard variant="primary" stripeColor={COLORS.signalGreen}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-label uppercase tracking-wider text-muted-blue">⚡ Action Items</span>
        </div>
        <p className="text-body text-signal-green">✅ Keine offenen Aktionen heute</p>
      </GlassCard>
    );
  }

  return (
    <GlassCard variant="primary" stripeColor={stripeColor} onClick={() => onNavigate('signals')}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-label uppercase tracking-wider text-muted-blue">⚡ Action Items</span>
        {actCount > 0 && (
          <span className="text-label font-medium px-2 py-0.5 rounded bg-signal-red/20 text-signal-red">
            {actCount} ACT
          </span>
        )}
      </div>

      {/* Prominent Items (max 3) */}
      <div className="space-y-3 mb-3">
        {prominent.slice(0, 3).map((item) => {
          const urgColor = URGENCY_COLORS[item.urgency] || COLORS.mutedBlue;
          return (
            <div key={item.id} className="text-body">
              <div className="flex items-start gap-1">
                <span className="text-muted-blue">→</span>
                <div className="flex-1">
                  <span className="text-ice-white font-medium">{item.target?.replace(/^EXP_/, '')}</span>
                  <p className="text-caption text-muted-blue mt-0.5">{item.context}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-caption font-medium" style={{ color: urgColor }}>
                      {item.urgency?.replace(/_/g, ' ')}
                    </span>
                    {item.delta_tag === 'NEU' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-baldur-blue/20 text-baldur-blue font-medium">
                        NEU
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Aggregated count */}
      {(summary.review_count > 0 || summary.watch_count > 0) && (
        <p className="text-caption text-muted-blue">
          + {summary.review_count} REVIEW, {summary.watch_count} WATCH
        </p>
      )}

      {/* Footer */}
      <p className="text-caption text-muted-blue text-right mt-2">Details →</p>
    </GlassCard>
  );
}
