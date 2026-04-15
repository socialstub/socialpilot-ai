'use client';

import { useAppStore } from '@/stores/app-store';
import { NAV_ITEMS } from '@/lib/constants';
import { Search, Bell, Menu } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

const VIEW_TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  compose: 'Content Composer',
  scheduler: 'Smart Scheduler',
  analytics: 'Analytics',
  'ai-tools': 'AI Tools',
  accounts: 'Connected Accounts',
  team: 'Team Management',
};

const VIEW_DESCRIPTIONS: Record<string, string> = {
  dashboard: 'Overview of your social media performance',
  compose: 'Create and schedule content across platforms',
  scheduler: 'Plan and manage your posting schedule',
  analytics: 'Deep dive into your performance metrics',
  'ai-tools': 'AI-powered content creation and automation',
  accounts: 'Manage your connected social accounts',
  team: 'Manage team roles and approval workflows',
};

export function AppHeader() {
  const { activeView, setSidebarOpen } = useAppStore();

  return (
    <header className="sticky top-0 z-30 h-14 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Left: Mobile menu + Title */}
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              {/* Mobile nav would go here - simplified */}
              <div className="p-4">
                {NAV_ITEMS.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      useAppStore.getState().setActiveView(item.id);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-accent mb-1"
                  >
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </SheetContent>
          </Sheet>

          <div>
            <h1 className="text-base font-semibold tracking-tight">
              {VIEW_TITLES[activeView] || 'Dashboard'}
            </h1>
            <p className="text-xs text-muted-foreground hidden sm:block">
              {VIEW_DESCRIPTIONS[activeView]}
            </p>
          </div>
        </div>

        {/* Right: Search + Notifications + User */}
        <div className="flex items-center gap-2">
          <div className="relative hidden md:block">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search posts, analytics..."
              className="w-64 pl-8 h-9 text-sm bg-muted/50"
            />
          </div>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-4.5 h-4.5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Notifications</span>
                <Badge variant="secondary" className="text-xs">3 new</Badge>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
                <span className="text-sm font-medium">Post published successfully</span>
                <span className="text-xs text-muted-foreground">Your Instagram post reached 1.2K views</span>
                <span className="text-xs text-muted-foreground">2 min ago</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
                <span className="text-sm font-medium">New comment on LinkedIn</span>
                <span className="text-xs text-muted-foreground">John commented on your latest post</span>
                <span className="text-xs text-muted-foreground">15 min ago</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
                <span className="text-sm font-medium">AI scheduling complete</span>
                <span className="text-xs text-muted-foreground">5 posts scheduled for next week</span>
                <span className="text-xs text-muted-foreground">1 hour ago</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-center text-sm text-muted-foreground justify-center">
                View all notifications
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Avatar (mobile/tablet) */}
          <Avatar className="w-8 h-8 lg:hidden">
            <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" />
            <AvatarFallback className="text-xs bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white">
              SC
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
