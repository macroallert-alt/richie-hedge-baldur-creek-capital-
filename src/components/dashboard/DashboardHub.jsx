'use client';

import SystemStatusCard from '@/components/dashboard/SystemStatusCard';
import ActionItemsCard from '@/components/dashboard/ActionItemsCard';
import CIODigestCard from '@/components/dashboard/CIODigestCard';
import RiskCard from '@/components/dashboard/RiskCard';
import PortfolioCard from '@/components/dashboard/PortfolioCard';
import SignalsCard from '@/components/dashboard/SignalsCard';
import RotationCard from '@/components/dashboard/RotationCard';
import LayerScoresCard from '@/components/dashboard/LayerScoresCard';
import IntelCard from '@/components/dashboard/IntelCard';
import G7Card from '@/components/dashboard/G7Card';
import DisruptionsCard from '@/components/dashboard/DisruptionsCard';

export default function DashboardHub({ dashboard, onNavigate }) {
  if (!dashboard) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4 pt-3">
      <SystemStatusCard dashboard={dashboard} />
      <ActionItemsCard dashboard={dashboard} onNavigate={onNavigate} />
      <CIODigestCard dashboard={dashboard} onNavigate={onNavigate} />
      <RiskCard dashboard={dashboard} onNavigate={onNavigate} />
      <PortfolioCard dashboard={dashboard} onNavigate={onNavigate} />
      <SignalsCard dashboard={dashboard} onNavigate={onNavigate} />
      <RotationCard dashboard={dashboard} onNavigate={onNavigate} />
      <LayerScoresCard dashboard={dashboard} onNavigate={onNavigate} />
      <IntelCard dashboard={dashboard} onNavigate={onNavigate} />
      <div className="lg:col-span-2">
        <G7Card dashboard={dashboard} onNavigate={onNavigate} />
      </div>
      <div className="lg:col-span-2">
        <DisruptionsCard dashboard={dashboard} onNavigate={onNavigate} />
      </div>
    </div>
  );
}
