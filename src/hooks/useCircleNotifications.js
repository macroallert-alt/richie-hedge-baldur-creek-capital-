'use client';

import { useMemo } from 'react';
import { COLORS } from '@/lib/constants';

/**
 * Computes notification dots for each circle.
 * Returns: { circleId: { color: '#...' } | null }
 * Logic: Spec Teil 5 §5.1 Notification Dots table
 */
export function useCircleNotifications(dashboard) {
  return useMemo(() => {
    if (!dashboard) return {};

    const notifications = {};
    const h = dashboard.header || {};
    const risk = dashboard.risk || {};
    const ai = dashboard.action_items?.summary || {};
    const layers = dashboard.layers || {};
    const f6 = dashboard.f6 || {};
    const intel = dashboard.intelligence || {};
    const g7 = dashboard.g7_summary;

    // Dashboard: Never
    notifications.dashboard = null;

    // CIO: briefing_type == "ACTION"
    if (h.briefing_type === 'ACTION') {
      notifications.cio = { color: COLORS.signalRed };
    }

    // Risk: emergency triggers or critical alerts
    const triggers = risk.emergency_triggers || {};
    const hasKS = Object.values(triggers).some(v => v === true);
    const hasCritical = (risk.alerts || []).some(a =>
      a.severity === 'CRITICAL' || a.severity === 'EMERGENCY'
    );
    const hasWarning = (risk.alerts || []).some(a => a.severity === 'WARNING');

    if (hasKS || hasCritical) {
      notifications.risk = { color: COLORS.signalRed };
    } else if (hasWarning) {
      notifications.risk = { color: COLORS.signalYellow };
    }

    // Signals: act_count > 0 or f6 pending
    if (ai.act_count > 0) {
      notifications.signals = { color: COLORS.signalRed };
    } else if ((f6.portfolio_summary?.pending_signals_count || 0) > 0) {
      notifications.signals = { color: COLORS.signalYellow };
    }

    // Layers: stability < 50%
    if (layers.regime_stability_pct < 50) {
      notifications.layers = { color: COLORS.signalOrange };
    }

    // F6: cc expiry warnings with DTE <= 3
    const ccWarnings = f6.cc_expiry_warnings || [];
    const urgentCC = ccWarnings.some(w => w.cc_dte <= 3);
    if (urgentCC) {
      notifications.f6 = { color: COLORS.signalYellow };
    }

    // Intel: divergences >= 3 or catalyst tomorrow
    const divCount = intel.divergences_count || 0;
    const catalystTomorrow = (intel.catalyst_timeline || []).some(c => c.days_until <= 1);
    if (divCount >= 3) {
      notifications.intel = { color: COLORS.signalOrange };
    } else if (catalystTomorrow) {
      notifications.intel = { color: COLORS.signalYellow };
    }

    // G7: regime R3/R4 or attention flags
    if (g7) {
      if (g7.active_regime === 'R3' || g7.active_regime === 'R4') {
        notifications.g7 = { color: COLORS.signalRed };
      } else if (g7.attention_flags?.length > 0) {
        notifications.g7 = { color: COLORS.signalYellow };
      }
    }

    return notifications;
  }, [dashboard]);
}
