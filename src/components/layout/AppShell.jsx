'use client';

import { useState } from 'react';
import Topbar from '@/components/layout/Topbar';
import CircleNav from '@/components/layout/CircleNav';
import TimestampBar from '@/components/layout/TimestampBar';
import DashboardHub from '@/components/dashboard/DashboardHub';
import AgentRBubble from '@/components/agent-r/AgentRBubble';
import AgentRPanel from '@/components/agent-r/AgentRPanel';
import CIODetail from '@/components/detail/CIODetail';
import RiskDetail from '@/components/detail/RiskDetail';
import SignalsDetail from '@/components/detail/SignalsDetail';
import LayersDetail from '@/components/detail/LayersDetail';
import F6Detail from '@/components/detail/F6Detail';
import IntelDetail from '@/components/detail/IntelDetail';
import G7Detail from '@/components/detail/G7Detail';
import SettingsPage from '@/components/settings/SettingsPage';
import StaleWarning from '@/components/shared/StaleWarning';
import ToastNotification from '@/components/shared/ToastNotification';
import LoadingScreen from '@/components/shared/LoadingScreen';
import ErrorScreen from '@/components/shared/ErrorScreen';
import { useDashboardContext } from '@/context/DashboardContext';

const PAGE_COMPONENTS = {
  dashboard: DashboardHub,
  cio: CIODetail,
  risk: RiskDetail,
  signals: SignalsDetail,
  layers: LayersDetail,
  f6: F6Detail,
  intel: IntelDetail,
  g7: G7Detail,
  settings: SettingsPage,
};

export default function AppShell() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [agentROpen, setAgentROpen] = useState(false);
  const { dashboard, loading, error, isStale, toastVisible, refresh } = useDashboardContext();

  // Loading state
  if (loading && !dashboard) {
    return <LoadingScreen />;
  }

  // Error state with no cached data
  if (error && !dashboard) {
    return <ErrorScreen error={error} onRetry={refresh} />;
  }

  const PageComponent = PAGE_COMPONENTS[currentPage] || DashboardHub;

  return (
    <div className={`min-h-screen bg-navy-deep transition-all duration-300 ${
      agentROpen ? 'lg:mr-[38%]' : ''
    }`}>
      {/* Stale Warning Banner (z-70) */}
      {isStale && <StaleWarning dashboard={dashboard} />}

      {/* Toast Notification (z-60) */}
      {toastVisible && <ToastNotification message="Daten aktualisiert" />}

      {/* Topbar (z-40, sticky) */}
      <Topbar onSettingsClick={() => setCurrentPage('settings')} />

      {/* Circle Navigation (z-20, sticky) */}
      <CircleNav
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        dashboard={dashboard}
      />

      {/* Timestamp Bar (z-30, sticky) */}
      <TimestampBar dashboard={dashboard} />

      {/* Page Content */}
      <main className="px-4 pb-24 max-w-app mx-auto">
        <PageComponent dashboard={dashboard} onNavigate={setCurrentPage} />
      </main>

      {/* Agent R Bubble (z-45, fixed) */}
      {!agentROpen && (
        <AgentRBubble
          dashboard={dashboard}
          onClick={() => setAgentROpen(true)}
        />
      )}

      {/* Agent R Panel (z-50) */}
      {agentROpen && (
        <AgentRPanel
          dashboard={dashboard}
          onClose={() => setAgentROpen(false)}
        />
      )}
    </div>
  );
}
