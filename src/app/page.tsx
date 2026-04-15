'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/stores/app-store';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { AppHeader } from '@/components/layout/header';
import { DashboardOverview } from '@/components/dashboard/dashboard-overview';
import { ContentComposer } from '@/components/composer/content-composer';
import { SchedulerView } from '@/components/scheduler/scheduler-view';
import { AnalyticsDashboard } from '@/components/analytics/analytics-dashboard';
import { AIToolsPage } from '@/components/ai-tools/ai-tools-page';
import { TeamManagement } from '@/components/team/team-management';
import { ConnectedAccounts } from '@/components/accounts/connected-accounts';
import { cn } from '@/lib/utils';

function ViewRouter() {
  const activeView = useAppStore((s) => s.activeView);

  switch (activeView) {
    case 'dashboard':
      return <DashboardOverview />;
    case 'compose':
      return <ContentComposer />;
    case 'scheduler':
      return <SchedulerView />;
    case 'analytics':
      return <AnalyticsDashboard />;
    case 'ai-tools':
      return <AIToolsPage />;
    case 'accounts':
      return <ConnectedAccounts />;
    case 'team':
      return <TeamManagement />;
    default:
      return <DashboardOverview />;
  }
}

export default function Home() {
  const refreshData = useAppStore((s) => s.refreshData);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <AppSidebar />

      {/* Main Content */}
      <div className={cn('flex-1 flex flex-col min-h-screen transition-all duration-300')}>
        <AppHeader />

        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <ViewRouter />
        </main>
      </div>
    </div>
  );
}
