'use client';

import { useMemo } from 'react';

/**
 * Computes P0 nudges from dashboard data.
 * Rules per Spec §6.5:
 * 1. Kill Switch alerts (any trigger == true)
 * 2. ACTION briefing (briefing_type == "ACTION")
 * 3. ACT items (act_count > 0)
 * 4. CC expiry warnings (DTE <= 3)
 */
export function useNudges(dashboard) {
  return useMemo(() => {
    if (!dashboard) return [];
    const nudges = [];

    // 1. Kill Switches
    const triggers = dashboard.risk?.emergency_triggers || {};
    const activeKS = Object.entries(triggers).filter(([, v]) => v === true);
    if (activeKS.length > 0) {
      nudges.push({
        type: 'KILL_SWITCH',
        priority: 0,
        title: '🚨 Kill Switch aktiv',
        text: activeKS.map(([k]) => k.replace(/_/g, ' ')).join(', '),
      });
    }

    // 2. ACTION Briefing
    if (dashboard.header?.briefing_type === 'ACTION') {
      nudges.push({
        type: 'ACTION_BRIEFING',
        priority: 1,
        title: '⚡ ACTION Briefing',
        text: 'CIO hat ein ACTION-Briefing ausgegeben — sofortige Aufmerksamkeit erforderlich',
      });
    }

    // 3. ACT Items
    const actCount = dashboard.action_items?.summary?.act_count || 0;
    if (actCount > 0) {
      const topAct = dashboard.action_items?.prominent?.find(i => i.type === 'ACT');
      nudges.push({
        type: 'ACT_ITEMS',
        priority: 2,
        title: `⚡ ${actCount} ACT-Item${actCount > 1 ? 's' : ''} offen`,
        text: topAct ? topAct.context : 'Sofortige Aktion erforderlich',
      });
    }

    // 4. CC Expiry
    const ccWarnings = (dashboard.f6?.cc_expiry_warnings || []).filter(w => w.cc_dte <= 3);
    if (ccWarnings.length > 0) {
      nudges.push({
        type: 'CC_EXPIRY',
        priority: 3,
        title: '⏰ CC Expiry Warning',
        text: ccWarnings.map(w => `${w.ticker} DTE ${w.cc_dte}`).join(', '),
      });
    }

    return nudges.sort((a, b) => a.priority - b.priority);
  }, [dashboard]);
}
