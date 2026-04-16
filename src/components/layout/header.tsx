'use client';

import { useState } from 'react';
import { useAppStore } from '@/stores/app-store';
import { NAV_ITEMS } from '@/lib/constants';
import { useNotifications, type Notification, type NotificationType } from '@/hooks/use-notifications';
import {
  Search,
  Bell,
  Menu,
  MessageCircle,
  CheckCircle2,
  TrendingUp,
  Clock,
  CheckCheck,
  Wifi,
  WifiOff,
  Users,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { PlatformIcon } from '@/components/icons/platform-icons';
import { motion, AnimatePresence } from 'framer-motion';

const VIEW_TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  inbox: 'Unified Inbox',
  compose: 'Content Composer',
  scheduler: 'Smart Scheduler',
  analytics: 'Analytics',
  'ai-tools': 'AI Tools',
  accounts: 'Connected Accounts',
  team: 'Team Management',
  settings: 'Settings',
};

const VIEW_DESCRIPTIONS: Record<string, string> = {
  dashboard: 'Overview of your social media performance',
  inbox: 'Manage comments and messages across all platforms',
  compose: 'Create and schedule content across platforms',
  scheduler: 'Plan and manage your posting schedule',
  analytics: 'Deep dive into your performance metrics',
  'ai-tools': 'AI-powered content creation and automation',
  accounts: 'Manage your connected social accounts',
  team: 'Manage team roles and approval workflows',
  settings: 'Configure your OAuth credentials and app preferences',
};

// ── Notification Helpers ──────────────────────────────────────────────────────

function getPlatformColorClass(platform: string): string {
  const lower = platform.toLowerCase();
  switch (lower) {
    case 'instagram': return 'bg-pink-500/10 text-pink-600 dark:text-pink-400';
    case 'facebook': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
    case 'linkedin': return 'bg-sky-500/10 text-sky-600 dark:text-sky-400';
    case 'youtube': return 'bg-red-500/10 text-red-600 dark:text-red-400';
    case 'tiktok': return 'bg-zinc-500/10 text-zinc-700 dark:text-zinc-300';
    default: return 'bg-violet-500/10 text-violet-600 dark:text-violet-400';
  }
}



function NotificationTypeIcon({ type, className }: { type: NotificationType; className?: string }) {
  const cn = className || 'h-3 w-3 text-muted-foreground shrink-0';
  if (type === 'comment') return <MessageCircle className={cn} />;
  if (type === 'publish') return <CheckCircle2 className={cn} />;
  if (type === 'engagement') return <TrendingUp className={cn} />;
  if (type === 'reminder') return <Clock className={cn} />;
  if (type === 'follower_milestone') return <Users className={cn} />;
  return <Bell className={cn} />;
}

function getRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── Notification Item ─────────────────────────────────────────────────────────

function NotificationItem({
  notification,
  onMarkRead,
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
}) {
  const platformColor = getPlatformColorClass(notification.platform);

  return (
    <motion.button
      initial={notification.read ? undefined : { opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
      onClick={() => !notification.read && onMarkRead(notification.id)}
      className={`w-full text-left flex items-start gap-3 p-3 rounded-lg transition-colors hover:bg-muted/60 ${
        !notification.read ? 'bg-primary/5' : ''
      }`}
    >
      {/* Platform icon */}
      <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${platformColor}`}>
        <PlatformIcon platform={notification.platform} size={16} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <NotificationTypeIcon type={notification.type} />
          <p className={`text-sm leading-snug truncate ${!notification.read ? 'font-semibold' : 'font-medium text-foreground'}`}>
            {notification.title}
          </p>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-1 mb-1">
          {notification.message}
        </p>
        <p className="text-[11px] text-muted-foreground/70">
          {getRelativeTime(notification.timestamp)}
        </p>
      </div>

      {/* Unread dot */}
      {!notification.read && (
        <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" />
      )}
    </motion.button>
  );
}

// ── Main Header Component ─────────────────────────────────────────────────────

export function AppHeader() {
  const { activeView, setSidebarOpen } = useAppStore();
  const {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
  } = useNotifications();
  const [notifOpen, setNotifOpen] = useState(false);

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

          {/* Notifications Bell with Popover */}
          <Popover open={notifOpen} onOpenChange={setNotifOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <AnimatePresence mode="wait">
                  {isConnected ? (
                    <motion.div
                      key="connected"
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0.8 }}
                    >
                      <Bell className="w-[18px] h-[18px]" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="disconnected"
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0.8 }}
                    >
                      <WifiOff className="w-[18px] h-[18px] text-muted-foreground" />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Unread badge with pulse animation */}
                <AnimatePresence>
                  {unreadCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                      className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white px-1"
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-96 p-0 mr-2" sideOffset={8}>
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold">Notifications</h3>
                  {unreadCount > 0 && (
                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                      {unreadCount} new
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {/* Connection indicator */}
                  <div className={`flex items-center gap-1 text-[11px] ${isConnected ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                    <Wifi className="h-3 w-3" />
                    <span className="hidden sm:inline">{isConnected ? 'Live' : 'Offline'}</span>
                  </div>
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAllAsRead();
                      }}
                      className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <CheckCheck className="h-3 w-3 mr-1" />
                      Mark all read
                    </Button>
                  )}
                </div>
              </div>

              {/* Notification list */}
              <ScrollArea className="max-h-[380px]">
                <div className="p-2">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <Bell className="h-8 w-8 mb-2 opacity-40" />
                      <p className="text-sm">No notifications yet</p>
                      <p className="text-xs mt-1">New notifications will appear here</p>
                    </div>
                  ) : (
                    <AnimatePresence initial={false}>
                      {notifications.map((notification) => (
                        <NotificationItem
                          key={notification.id}
                          notification={notification}
                          onMarkRead={markAsRead}
                        />
                      ))}
                    </AnimatePresence>
                  )}
                </div>
              </ScrollArea>

              {notifications.length > 0 && (
                <>
                  <Separator />
                  <div className="px-4 py-2.5">
                    <button
                      className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => {
                        useAppStore.getState().setActiveView('inbox');
                        setNotifOpen(false);
                      }}
                    >
                      View all in Inbox →
                    </button>
                  </div>
                </>
              )}
            </PopoverContent>
          </Popover>

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
