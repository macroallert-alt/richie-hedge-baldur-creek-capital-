'use client';

import { COLORS, getReadinessColor } from '@/lib/constants';

export default function DisruptionsCard({ dashboard, onNavigate }) {
  const dis = dashboard?.disruptions;
  if (!dis) return null;

  const readinessColor = getReadinessColor(dis.readiness_score);
  const hasConvergence = dis.convergence_active && (dis.convergence_zones || []).length > 0;

  return (
    <button
      onClick={() => onNavigate('disruptions')}
      className="w-full text-left rounded-lg p-4 border transition-all hover:border-[#3B82F6]/50"
      style={{
        backgroundColor: '#0D1B2A',
        borderColor: hasConvergence ? `${COLORS.signalGreen}60` : '#1E3A5F',
        boxShadow: hasConvergence ? `0 0 12px ${COLORS.signalGreen}20` : 'none',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm">⚡</span>
          <span className="text-sm font-medium" style={{ color: COLORS.iceWhite }}>Disruptions</span>
        </div>
        {hasConvergence && (
          <span
            className="text-[10px] px-1.5 py-0.5 rounded font-bold animate-pulse"
            style={{ color: COLORS.signalGreen, backgroundColor: `${COLORS.signalGreen}15` }}
          >
            CONVERGENCE
          </span>
        )}
      </div>

      {/* Readiness Score */}
      {hasConvergence ? (
        <div className="text-center mb-2">
          <div className="text-lg font-bold" style={{ color: COLORS.signalGreen }}>CONVERGENCE ZONE</div>
          <div className="text-xs mt-0.5" style={{ color: COLORS.mutedBlue }}>
            {(dis.convergence_zones || []).map(cz => cz.description || cz.trends?.join(' + ')).join(' | ')}
          </div>
        </div>
      ) : (
        <div className="text-center mb-2">
          <div className="text-2xl font-bold font-mono" style={{ color: readinessColor }}>
            {dis.readiness_score}
          </div>
          <div className="text-xs font-mono" style={{ color: readinessColor }}>
            {dis.readiness_label}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="flex justify-center gap-3 text-xs" style={{ color: COLORS.mutedBlue }}>
        <span><span style={{ color: dis.blind_spots_count > 0 ? COLORS.signalRed : COLORS.iceWhite }}>{dis.blind_spots_count}</span> Blind Spots</span>
        <span><span style={{ color: dis.threats_count > 0 ? COLORS.signalOrange : COLORS.iceWhite }}>{dis.threats_count}</span> Threats</span>
      </div>

      {/* Next Scan */}
      {dis.meta?.next_run && (
        <div className="text-[10px] text-center mt-2" style={{ color: COLORS.fadedBlue }}>
          Nächster Scan: {dis.meta.next_run}
        </div>
      )}
    </button>
  );
}
