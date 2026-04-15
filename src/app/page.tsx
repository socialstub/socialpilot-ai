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
import { ConnectedAccounts } from '@/components/accounts/connected-accounts';
import { TeamManagement } from '@/components/team/team-management';
import { SocialInbox } from '@/components/inbox/social-inbox';

const VIEW_MAP: Record<string, React.ComponentType> = {
  dashboard: DashboardOverview,
  inbox: SocialInbox,
  compose: ContentComposer,
  scheduler: SchedulerView,
  analytics: AnalyticsDashboard,
  'ai-tools': AIToolsPage,
  accounts: ConnectedAccounts,
  team: TeamManagement,
};

export default function Home() {
  const { activeView, refreshData } = useAppStore();

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const ActiveView = VIEW_MAP[activeView] || DashboardOverview;

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-auto">
          <ActiveView />
        </main>
      </div>
    </div>
  );
}
