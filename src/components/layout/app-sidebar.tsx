'use client';

import { useAppStore } from '@/stores/app-store';
import { useTheme } from 'next-themes';
import { NAV_ITEMS, PLATFORMS, type NavItem } from '@/lib/constants';
import {
  LayoutDashboard,
  Inbox,
  PenSquare,
  CalendarDays,
  BarChart3,
  Sparkles,
  Link2,
  Users,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Zap,
  Settings,
  LogOut,
  Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Inbox,
  PenSquare,
  CalendarDays,
  BarChart3,
  Sparkles,
  Link2,
  Users,
  Settings,
};

const PLATFORM_ICON_COLORS: Record<string, string> = {
  facebook: 'text-blue-600',
  instagram: 'text-pink-600',
  twitter: 'text-zinc-800 dark:text-zinc-200',
  linkedin: 'text-blue-700',
  tiktok: 'text-zinc-800 dark:text-zinc-200',
  youtube: 'text-red-600',
};

export function AppSidebar() {
  const { activeView, setActiveView, sidebarOpen, setSidebarOpen, accounts } = useAppStore();
  const { theme, setTheme } = useTheme();

  const activeAccounts = accounts.filter((a) => a.isActive);

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'flex flex-col h-screen border-r border-border bg-card transition-all duration-300 ease-in-out sticky top-0 z-40',
          sidebarOpen ? 'w-64' : 'w-16'
        )}
      >
        {/* Logo */}
        <div className="flex items-center h-14 px-3 border-b border-border">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-500 shrink-0">
              <Zap className="w-5 h-5 text-white" />
            </div>
            {sidebarOpen && (
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold tracking-tight truncate">SocialPilot</span>
                <span className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase">AI Suite</span>
              </div>
            )}
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          <div className="space-y-0.5">
            {NAV_ITEMS.map((item, index) => {
              const Icon = ICON_MAP[item.icon] || LayoutDashboard;
              const isActive = activeView === item.id;
              const showSeparator = item.id === 'ai-tools';

              const button = (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id as NavItem)}
                  className={cn(
                    'w-full flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-all duration-150',
                    'hover:bg-accent hover:text-accent-foreground',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:text-primary-foreground'
                      : 'text-muted-foreground'
                  )}
                >
                  <Icon className="w-4.5 h-4.5 shrink-0" />
                  {sidebarOpen && <span className="truncate">{item.label}</span>}
                  {sidebarOpen && item.id === 'ai-tools' && (
                    <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0 bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                      AI
                    </Badge>
                  )}
                </button>
              );

              const navItem = (
                <div key={item.id}>
                  {showSeparator && sidebarOpen && <Separator className="my-2" />}
                  {showSeparator && !sidebarOpen && <Separator className="my-2 mx-1" />}
                  {button}
                </div>
              );

              if (!sidebarOpen) {
                return (
                  <div key={item.id}>
                    {showSeparator && <Separator className="my-2 mx-1" />}
                    <Tooltip>
                      <TooltipTrigger asChild>{button}</TooltipTrigger>
                      <TooltipContent side="right" className="font-medium">
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                );
              }
              return navItem;
            })}
          </div>

          {/* Connected Accounts */}
          {sidebarOpen && (
            <>
              <Separator className="my-3" />
              <div className="px-2 mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Connected ({activeAccounts.length})
                </span>
              </div>
              <div className="space-y-0.5">
                {activeAccounts.slice(0, 6).map((account) => {
                  const platformConfig = PLATFORMS[account.platform as keyof typeof PLATFORMS];
                  return (
                    <div
                      key={account.id}
                      className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm"
                    >
                      <div
                        className={cn(
                          'w-2 h-2 rounded-full shrink-0',
                          platformConfig?.bgColor || 'bg-zinc-500'
                        )}
                      />
                      <span className="text-muted-foreground truncate text-xs">
                        {account.displayName}
                      </span>
                      <span className="ml-auto text-[10px] text-muted-foreground/60 shrink-0">
                        {(account.followersCount / 1000).toFixed(1)}K
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-border p-2">
          {/* Collapse Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center rounded-lg py-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors mb-1"
          >
            {sidebarOpen ? (
              <ChevronLeft className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>

          {/* Theme Toggle + Settings */}
          <div className="flex items-center gap-0.5">
            {sidebarOpen ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 justify-start gap-2 text-muted-foreground hover:text-foreground"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  <span className="text-xs">{theme === 'dark' ? 'Light' : 'Dark'}</span>
                </Button>
              </>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-center text-muted-foreground hover:text-foreground"
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  >
                    {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* User */}
          {sidebarOpen && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full flex items-center gap-2.5 mt-2 p-2 rounded-lg hover:bg-accent transition-colors">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" />
                    <AvatarFallback className="text-xs bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white">
                      SA
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start min-w-0">
                    <span className="text-sm font-medium truncate">Sarah Chen</span>
                    <span className="text-[10px] text-muted-foreground">Admin</span>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Bell className="w-4 h-4 mr-2" />
                  Notifications
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
