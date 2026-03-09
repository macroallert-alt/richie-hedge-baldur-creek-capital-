'use client';

import { Check, RefreshCw, Zap, AlertTriangle } from 'lucide-react';
import { COLORS, CLUSTER_MAP, ROTATION_STATUS_COLORS } from '@/lib/constants';

export default function RotationCard({ dashboard, onNavigate }) {
  const rotation = dashboard?.rotation || {};
  const status = rotation.status || 'ALIGNED';
  const mode = rotation.mode || 'STABLE';
  const clusterDeltas = rotation.cluster_deltas || {};
  const daysSince = rotation.days_since_material_rotation;
  const materialCount = rotation.material_shifts_count || 0;

  // Find biggest cluster delta
  let biggestDelta = null;
  let biggestDeltaName = '';
  let biggestDeltaValue = 0;
  Object.entries(clusterDeltas).forEach(([ck, cd]) => {
    const absDelta = Math.abs(cd.delta_1d || 0);
    if (absDelta > biggestDeltaValue) {
      biggestDeltaValue = absDelta;
      biggestDeltaName = CLUSTER_MAP[ck]?.name || ck;
      biggestDelta = cd;
    }
  });

  // Badge config
  const badgeConfig = getBadgeConfig(status, mode, materialCount);

  // Delta display
  let deltaText = '—';
  if (biggestDelta && biggestDeltaValue > 0.005) {
    const arrow = biggestDelta.direction === 'RISING' ? '↑' : biggestDelta.direction === 'FALLING' ? '↓' : '→';
    const pp = (biggestDelta.delta_1d * 100).toFixed(1);
    const sign = biggestDelta.delta_1d > 0 ? '+' : '';
    deltaText = `${biggestDeltaName} ${arrow} ${sign}${pp}pp`;
  }

  // Days since text
  let daysSinceText = '—';
  if (daysSince === 0) {
    daysSinceText = 'Letzte Rotation: HEUTE';
  } else if (daysSince != null && daysSince < 999) {
    daysSinceText = `Letzte Rotation: vor ${daysSince}d`;
  }

  return (
    <button
      onClick={() => onNavigate('rotation')}
      className="w-full rounded-lg border p-4 text-left transition-all hover:border-opacity-60"
      style={{ borderColor: `${COLORS.fadedBlue}30`, backgroundColor: `${COLORS.navyDeep}` }}
    >
      {/* Title */}
      <div className="flex items-center gap-2 mb-3">
        <RefreshCw size={14} style={{ color: COLORS.mutedBlue }} />
        <span className="text-xs font-bold" style={{ color: COLORS.mutedBlue }}>Rotation</span>
      </div>

      {/* Status Badge */}
      <div className="flex items-center justify-center gap-2 mb-3">
        <badgeConfig.icon size={20} style={{ color: badgeConfig.color }}
          className={badgeConfig.pulse ? 'animate-pulse' : ''} />
        <span className="text-lg font-bold" style={{ color: badgeConfig.color }}>
          {badgeConfig.text}
        </span>
      </div>

      {/* Detail lines */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span style={{ color: COLORS.fadedBlue }}>Größtes Delta:</span>
          <span style={{ color: COLORS.mutedBlue }}>{deltaText}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span style={{ color: COLORS.fadedBlue }}>{daysSinceText}</span>
        </div>
      </div>
    </button>
  );
}

function getBadgeConfig(status, mode, materialCount) {
  if (status === 'BIG_ROTATION' && mode === 'STATE_TRANSITION') {
    return {
      text: 'STATE CHANGE',
      color: COLORS.signalRed,
      icon: Zap,
      pulse: true,
    };
  }
  if (status === 'BIG_ROTATION') {
    return {
      text: 'GROSSE ROTATION',
      color: COLORS.signalOrange,
      icon: AlertTriangle,
      pulse: false,
    };
  }
  if (status === 'SHIFTING') {
    return {
      text: `${materialCount} SHIFT${materialCount !== 1 ? 'S' : ''}`,
      color: COLORS.signalYellow,
      icon: RefreshCw,
      pulse: false,
    };
  }
  return {
    text: 'ALIGNED',
    color: COLORS.signalGreen,
    icon: Check,
    pulse: false,
  };
}
