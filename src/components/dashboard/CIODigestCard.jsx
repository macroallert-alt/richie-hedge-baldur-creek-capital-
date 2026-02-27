'use client';

import GlassCard from '@/components/shared/GlassCard';
import { BRIEFING_COLORS } from '@/lib/constants';

export default function CIODigestCard({ dashboard, onNavigate }) {
  const h = dashboard.header || {};
  const digest = dashboard.digest || {};
  const stripeColor = BRIEFING_COLORS[h.briefing_type] || BRIEFING_COLORS.ROUTINE;
  const badgeColors = { ROUTINE: 'bg-signal-green/20 text-signal-green', WATCH: 'bg-signal-yellow/20 text-signal-yellow', ACTION: 'bg-signal-red/20 text-signal-red' };

  return (
    <GlassCard variant="standard" stripeColor={stripeColor} onClick={() => onNavigate('cio')}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-label uppercase tracking-wider text-muted-blue">📋 CIO Digest</span>
        <span className={`text-label font-medium px-2 py-0.5 rounded ${badgeColors[h.briefing_type] || ''}`}>
          {h.briefing_type || '—'}
        </span>
      </div>

      <div className="space-y-2">
        <p className="text-body text-ice-white">{digest.line_1_type_and_delta || '—'}</p>
        <p className="text-body text-ice-white">{digest.line_2_actions || '—'}</p>
        <p className="text-body text-ice-white">{digest.line_3_confidence || '—'}</p>
      </div>

      <p className="text-caption text-muted-blue text-right mt-3">Volles Memo →</p>
    </GlassCard>
  );
}
