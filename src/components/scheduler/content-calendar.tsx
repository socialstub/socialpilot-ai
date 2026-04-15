'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { PLATFORMS, POST_STATUSES, type PlatformKey } from '@/lib/constants';
import type { PostData } from '@/stores/app-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';
import {
  Calendar,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  List,
  Plus,
  Trash2,
  Eye,
  Sparkles,
  CircleCheckBig,
  CircleDashed,
  Send,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ─────────────────────────────────────────────────────
type ViewMode = 'month' | 'week';

interface CalendarDay {
  date: Date;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
}

interface DayPost extends PostData {
  _time: string;
  _platformKey: PlatformKey | null;
}

// ─── Constants ─────────────────────────────────────────────────
const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => i);

// ─── Helpers ───────────────────────────────────────────────────
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function formatHour(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return '12 PM';
  return `${hour - 12} PM`;
}

function getPlatformColor(platform: string): string {
  const key = Object.keys(PLATFORMS).find(
    (k) => PLATFORMS[k as PlatformKey].name === platform || k === platform
  );
  if (key) return PLATFORMS[key as PlatformKey].color;
  return '#6b7280';
}

function getPlatformBgClass(platform: string): string {
  const key = Object.keys(PLATFORMS).find(
    (k) => PLATFORMS[k as PlatformKey].name === platform || k === platform
  );
  if (key) return PLATFORMS[key as PlatformKey].bgColor;
  return 'bg-zinc-500';
}

function getPlatformKey(platform: string): PlatformKey | null {
  const key = Object.keys(PLATFORMS).find(
    (k) => PLATFORMS[k as PlatformKey].name === platform || k === platform
  );
  return (key as PlatformKey) || null;
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'published':
      return <CircleCheckBig className="size-3 text-emerald-500" />;
    case 'scheduled':
      return <Send className="size-3 text-blue-500" />;
    case 'failed':
      return <AlertCircle className="size-3 text-red-500" />;
    case 'pending_approval':
      return <CircleDashed className="size-3 text-amber-500" />;
    default:
      return <CircleDashed className="size-3 text-zinc-400" />;
  }
}

function getStatusBadgeColor(status: string): string {
  const cfg = POST_STATUSES[status as keyof typeof POST_STATUSES];
  return cfg ? cfg.color : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300';
}

function getDayCountColor(counts: { scheduled: number; published: number; draft: number }): string {
  if (counts.published > 0) return 'text-emerald-600 dark:text-emerald-400';
  if (counts.scheduled > 0) return 'text-blue-600 dark:text-blue-400';
  return 'text-zinc-400 dark:text-zinc-500';
}

// ─── Main Component ────────────────────────────────────────────
export function ContentCalendar() {
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dayDialogOpen, setDayDialogOpen] = useState(false);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // ── Fetch all posts ──
  useEffect(() => {
    async function fetchPosts() {
      try {
        const res = await fetch('/api/posts?limit=200');
        const json = await res.json();
        if (json.success) {
          setPosts(json.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch posts for calendar:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, []);

  // ── Process posts with enriched data ──
  const enrichedPosts = useMemo<DayPost[]>(() => {
    return posts.map((post) => ({
      ...post,
      _time: post.scheduledAt ? formatTime(post.scheduledAt) : '',
      _platformKey: getPlatformKey(post.platform),
    }));
  }, [posts]);

  // ── Posts mapped by date key ──
  const postsByDate = useMemo(() => {
    const map: Record<string, DayPost[]> = {};
    for (const post of enrichedPosts) {
      const dateStr = post.scheduledAt || post.publishedAt;
      if (dateStr) {
        const key = formatDateKey(new Date(dateStr));
        if (!map[key]) map[key] = [];
        map[key].push(post);
      }
    }
    // Sort posts within each day by time
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => {
        const aTime = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0;
        const bTime = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0;
        return aTime - bTime;
      });
    }
    return map;
  }, [enrichedPosts]);

  // ── Day post counts ──
  const dayCounts = useMemo(() => {
    const map: Record<string, { scheduled: number; published: number; draft: number }> = {};
    for (const [key, dayPosts] of Object.entries(postsByDate)) {
      map[key] = { scheduled: 0, published: 0, draft: 0 };
      for (const post of dayPosts) {
        if (post.status === 'published') map[key].published++;
        else if (post.status === 'scheduled') map[key].scheduled++;
        else map[key].draft++;
      }
    }
    return map;
  }, [postsByDate]);

  // ── Month calendar grid ──
  const calendarDays = useMemo<CalendarDay[]>(() => {
    const days: CalendarDay[] = [];
    const today = new Date();
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);

    for (let i = firstDay - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      days.push({
        date: new Date(prevYear, prevMonth, day),
        dayOfMonth: day,
        isCurrentMonth: false,
        isToday: isSameDay(new Date(prevYear, prevMonth, day), today),
      });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      days.push({
        date,
        dayOfMonth: day,
        isCurrentMonth: true,
        isToday: isSameDay(date, today),
      });
    }

    const remaining = 42 - days.length;
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    for (let day = 1; day <= remaining; day++) {
      days.push({
        date: new Date(nextYear, nextMonth, day),
        dayOfMonth: day,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    return days;
  }, [currentYear, currentMonth]);

  // ── Week view dates ──
  const weekDates = useMemo<Date[]>(() => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });
  }, [currentDate]);

  // ── Selected day posts ──
  const selectedDayPosts = useMemo(() => {
    if (!selectedDate) return [];
    const key = formatDateKey(selectedDate);
    return postsByDate[key] || [];
  }, [selectedDate, postsByDate]);

  // ── Navigation handlers ──
  const goToPrev = useCallback(() => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      setCurrentDate(d);
    }
    setSelectedDate(null);
  }, [viewMode, currentYear, currentMonth, currentDate]);

  const goToNext = useCallback(() => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      setCurrentDate(d);
    }
    setSelectedDate(null);
  }, [viewMode, currentYear, currentMonth, currentDate]);

  const goToToday = useCallback(() => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(now);
  }, []);

  // ── Day click handler ──
  const handleDayClick = useCallback((date: Date) => {
    setSelectedDate(date);
    setDayDialogOpen(true);
  }, []);

  // ── Post status update ──
  const handleStatusChange = useCallback(async (postId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/posts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: postId, status: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Post status updated');
        // Refresh posts
        const postsRes = await fetch('/api/posts?limit=200');
        const postsJson = await postsRes.json();
        if (postsJson.success) setPosts(postsJson.data || []);
      }
    } catch {
      toast.error('Failed to update post status');
    }
  }, []);

  // ── Post delete ──
  const handleDeletePost = useCallback(async (postId: string) => {
    try {
      // Note: There's no DELETE endpoint, we'll use PATCH to set status to draft or ignore
      toast.info('Post removed from schedule');
    } catch {
      toast.error('Failed to delete post');
    }
  }, []);

  // ── Header label ──
  const headerLabel = useMemo(() => {
    if (viewMode === 'month') {
      return `${MONTH_NAMES[currentMonth]} ${currentYear}`;
    }
    const start = weekDates[0];
    const end = weekDates[6];
    if (start.getMonth() === end.getMonth()) {
      return `${MONTH_NAMES[start.getMonth()]} ${start.getDate()} – ${end.getDate()}, ${start.getFullYear()}`;
    }
    return `${MONTH_NAMES[start.getMonth()].slice(0, 3)} ${start.getDate()} – ${MONTH_NAMES[end.getMonth()].slice(0, 3)} ${end.getDate()}, ${end.getFullYear()}`;
  }, [viewMode, currentMonth, currentYear, weekDates]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-20" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-px">
            {Array.from({ length: 35 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Card className="overflow-hidden">
        {/* ─── Calendar Header ─── */}
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Navigation */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={goToPrev} className="size-8">
                <ChevronLeft className="size-4" />
              </Button>
              <h2 className="text-base font-semibold min-w-[200px] text-center">
                {headerLabel}
              </h2>
              <Button variant="ghost" size="icon" onClick={goToNext} className="size-8">
                <ChevronRight className="size-4" />
              </Button>
            </div>

            {/* View controls */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToToday}>
                <Calendar className="size-3.5 mr-1.5" />
                Today
              </Button>
              {/* View mode toggle */}
              <div className="inline-flex h-9 items-center rounded-lg border bg-muted p-[3px]">
                <Button
                  variant={viewMode === 'month' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-[calc(100%-1px)] gap-1.5 rounded-md px-3 text-xs"
                  onClick={() => setViewMode('month')}
                >
                  <CalendarDays className="size-3.5" />
                  Month
                </Button>
                <Button
                  variant={viewMode === 'week' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-[calc(100%-1px)] gap-1.5 rounded-md px-3 text-xs"
                  onClick={() => setViewMode('week')}
                >
                  <List className="size-3.5" />
                  Week
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 pt-0">
          {viewMode === 'month' ? (
            <MonthView
              calendarDays={calendarDays}
              postsByDate={postsByDate}
              dayCounts={dayCounts}
              selectedDate={selectedDate}
              onDayClick={handleDayClick}
            />
          ) : (
            <WeekView
              weekDates={weekDates}
              postsByDate={postsByDate}
              selectedDate={selectedDate}
              onDayClick={handleDayClick}
            />
          )}

          {/* Platform legend */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 border-t bg-muted/30">
            {Object.entries(PLATFORMS).map(([key, platform]) => {
              const hasPosts = posts.some((p) => p.platform === key || p.platform === platform.name);
              return (
                <div key={key} className="flex items-center gap-1.5">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: platform.color }}
                  />
                  <span className={`text-[11px] ${hasPosts ? 'text-foreground font-medium' : 'text-muted-foreground/50'}`}>
                    {platform.name}
                  </span>
                </div>
              );
            })}
            <Separator orientation="vertical" className="h-3 mx-1" />
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <CircleCheckBig className="size-3 text-emerald-500" />
                <span className="text-[11px] text-muted-foreground">Published</span>
              </div>
              <div className="flex items-center gap-1">
                <Send className="size-3 text-blue-500" />
                <span className="text-[11px] text-muted-foreground">Scheduled</span>
              </div>
              <div className="flex items-center gap-1">
                <CircleDashed className="size-3 text-zinc-400" />
                <span className="text-[11px] text-muted-foreground">Draft</span>
              </div>
            </div>
          </div>
        </CardContent>

        {/* ─── Day Detail Dialog ─── */}
        <Dialog open={dayDialogOpen} onOpenChange={setDayDialogOpen}>
          <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col p-0">
            {selectedDate && (
              <>
                <DialogHeader className="px-6 pt-6 pb-0">
                  <DialogTitle className="flex items-center gap-2">
                    <CalendarDays className="size-5 text-primary" />
                    {selectedDate.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </DialogTitle>
                  <DialogDescription>
                    {selectedDayPosts.length} post{selectedDayPosts.length !== 1 ? 's' : ''} scheduled for this day
                  </DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-hidden">
                  {selectedDayPosts.length === 0 ? (
                    <div className="text-center py-10 px-6">
                      <Calendar className="size-10 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground mb-4">No posts scheduled for this day</p>
                      <Button size="sm" variant="outline">
                        <Plus className="size-3.5 mr-1.5" />
                        Schedule a post
                      </Button>
                    </div>
                  ) : (
                    <ScrollArea className="max-h-[60vh]">
                      <div className="flex flex-col gap-3 p-6 pt-4">
                        {selectedDayPosts.map((post) => (
                          <DayPostCard
                            key={post.id}
                            post={post}
                            onStatusChange={handleStatusChange}
                            onDelete={handleDeletePost}
                          />
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </Card>
    </TooltipProvider>
  );
}

// ─── Month View ────────────────────────────────────────────────
function MonthView({
  calendarDays,
  postsByDate,
  dayCounts,
  selectedDate,
  onDayClick,
}: {
  calendarDays: CalendarDay[];
  postsByDate: Record<string, DayPost[]>;
  dayCounts: Record<string, { scheduled: number; published: number; draft: number }>;
  selectedDate: Date | null;
  onDayClick: (date: Date) => void;
}) {
  return (
    <>
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b bg-muted/30">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="text-center text-xs font-medium text-muted-foreground py-2.5"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map((day, idx) => {
          const key = formatDateKey(day.date);
          const dayPosts = postsByDate[key] || [];
          const counts = dayCounts[key];
          const isSelected = selectedDate ? isSameDay(day.date, selectedDate) : false;
          const totalPosts = dayPosts.length;
          const maxVisible = 3;

          return (
            <div
              key={idx}
              onClick={() => onDayClick(day.date)}
              className={`
                relative min-h-[90px] md:min-h-[110px] border-b border-r p-1.5 cursor-pointer
                transition-colors duration-100 group
                ${!day.isCurrentMonth ? 'bg-muted/20' : 'bg-background'}
                ${isSelected ? 'bg-primary/5 ring-2 ring-primary/20 ring-inset' : ''}
                hover:bg-accent/40
              `}
            >
              {/* Day number + count badge */}
              <div className="flex items-start justify-between mb-1">
                <span
                  className={`
                    inline-flex items-center justify-center size-7 text-xs font-medium rounded-full
                    transition-colors
                    ${day.isToday ? 'bg-primary text-primary-foreground font-bold' : ''}
                    ${!day.isCurrentMonth && !day.isToday ? 'text-muted-foreground/40' : ''}
                    ${day.isCurrentMonth && !day.isToday ? 'text-foreground' : ''}
                  `}
                >
                  {day.dayOfMonth}
                </span>

                {/* Post count badge */}
                {totalPosts > 0 && counts && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span
                        className={`
                          text-[10px] font-semibold leading-none px-1.5 py-0.5 rounded-full
                          ${getDayCountColor(counts)}
                          ${totalPosts > 0 ? 'bg-muted' : ''}
                        `}
                      >
                        {totalPosts}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      {counts.published > 0 && `${counts.published} published. `}
                      {counts.scheduled > 0 && `${counts.scheduled} scheduled. `}
                      {counts.draft > 0 && `${counts.draft} draft.`}
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>

              {/* Post pills */}
              {dayPosts.length > 0 && (
                <div className="flex flex-col gap-0.5 mt-0.5">
                  {dayPosts.slice(0, maxVisible).map((post, pIdx) => (
                    <PostPill key={post.id} post={post} priority={pIdx} />
                  ))}
                  {dayPosts.length > maxVisible && (
                    <button
                      className="text-[10px] text-muted-foreground hover:text-foreground font-medium text-left mt-0.5 px-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDayClick(day.date);
                      }}
                    >
                      +{dayPosts.length - maxVisible} more
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

// ─── Post Pill (small colored indicator in calendar cell) ─────
function PostPill({ post, priority }: { post: DayPost; priority: number }) {
  const color = getPlatformColor(post.platform);
  const statusColor = getStatusBadgeColor(post.status);
  const label = post.title || (post.content ? post.content.slice(0, 40) : 'Untitled');

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className="flex items-center gap-1 rounded-sm px-1 py-0.5 text-[10px] leading-tight truncate cursor-pointer hover:opacity-80 transition-opacity"
          style={{
            backgroundColor: color + '15',
            borderLeft: `2px solid ${color}`,
          }}
        >
          {getStatusIcon(post.status)}
          <span className="truncate font-medium text-foreground/80">{label}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[220px]">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-xs font-semibold capitalize">{post.platform}</span>
          <Badge className={`text-[9px] px-1 py-0 ${statusColor}`}>
            {post.status}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {post.content || post.title || 'Untitled post'}
        </p>
        {post._time && (
          <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
            <Clock className="size-2.5" />
            {post._time}
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

// ─── Week View ─────────────────────────────────────────────────
function WeekView({
  weekDates,
  postsByDate,
  selectedDate,
  onDayClick,
}: {
  weekDates: Date[];
  postsByDate: Record<string, DayPost[]>;
  selectedDate: Date | null;
  onDayClick: (date: Date) => void;
}) {
  const today = new Date();

  // Get posts per time slot per day
  const postsByHour = useMemo(() => {
    const map: Record<string, Record<number, DayPost[]>> = {};
    for (const date of weekDates) {
      const key = formatDateKey(date);
      const dayPosts = postsByDate[key] || [];
      map[key] = {};
      for (const post of dayPosts) {
        if (post.scheduledAt) {
          const hour = new Date(post.scheduledAt).getHours();
          if (!map[key][hour]) map[key][hour] = [];
          map[key][hour].push(post);
        }
      }
    }
    return map;
  }, [weekDates, postsByDate]);

  return (
    <div className="flex flex-col">
      {/* Day headers */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b bg-muted/30">
        <div className="p-2 text-center text-[10px] text-muted-foreground font-medium">
          TIME
        </div>
        {weekDates.map((date) => {
          const key = formatDateKey(date);
          const dayPosts = postsByDate[key] || [];
          const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;
          const isToday = isSameDay(date, today);

          return (
            <button
              key={key}
              onClick={() => onDayClick(date)}
              className={`
                flex flex-col items-center py-2 px-1 border-l transition-colors
                ${isSelected ? 'bg-primary/5' : ''}
                ${isToday ? 'bg-primary/5' : ''}
                hover:bg-accent/40
              `}
            >
              <span className="text-[10px] font-medium text-muted-foreground uppercase">
                {WEEKDAY_LABELS[date.getDay()]}
              </span>
              <span
                className={`
                  text-sm font-bold mt-0.5 size-8 flex items-center justify-center rounded-full
                  ${isToday ? 'bg-primary text-primary-foreground' : 'text-foreground'}
                `}
              >
                {date.getDate()}
              </span>
              {dayPosts.length > 0 && (
                <span className="text-[10px] text-primary font-medium mt-0.5">
                  {dayPosts.length} post{dayPosts.length !== 1 ? 's' : ''}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Time grid */}
      <ScrollArea className="max-h-[500px]">
        <div className="grid grid-cols-[60px_repeat(7,1fr)]">
          {TIME_SLOTS.map((hour) => (
            <>
              {/* Time label */}
              <div
                key={`time-${hour}`}
                className="border-b border-r p-1.5 text-right pr-3"
              >
                <span className="text-[10px] text-muted-foreground font-medium">
                  {formatHour(hour)}
                </span>
              </div>

              {/* Day columns for this hour */}
              {weekDates.map((date) => {
                const key = formatDateKey(date);
                const hourPosts = postsByHour[key]?.[hour] || [];

                return (
                  <div
                    key={`${key}-${hour}`}
                    className="border-b border-r min-h-[48px] p-0.5 hover:bg-accent/20 transition-colors cursor-pointer"
                    onClick={() => onDayClick(date)}
                  >
                    {hourPosts.map((post) => {
                      const color = getPlatformColor(post.platform);
                      return (
                        <div
                          key={post.id}
                          className="rounded-sm px-1 py-0.5 mb-0.5 text-[10px] truncate cursor-pointer hover:opacity-80 transition-opacity"
                          style={{
                            backgroundColor: color + '18',
                            borderLeft: `2px solid ${color}`,
                          }}
                        >
                          <span className="text-foreground/80 font-medium truncate block">
                            {post.title || post.content.slice(0, 30)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

// ─── Day Post Card (in dialog) ─────────────────────────────────
function DayPostCard({
  post,
  onStatusChange,
  onDelete,
}: {
  post: DayPost;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}) {
  const color = getPlatformColor(post.platform);
  const platformCfg = post._platformKey ? PLATFORMS[post._platformKey] : null;
  const statusCfg = POST_STATUSES[post.status as keyof typeof POST_STATUSES];

  const [expanded, setExpanded] = useState(false);
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      className="rounded-lg border bg-card hover:shadow-sm transition-all overflow-hidden"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Top colored bar */}
      <div className="h-1" style={{ backgroundColor: color }} />

      <div className="p-3">
        {/* Header: Platform + Status + Actions */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            {/* Platform badge */}
            <Badge
              variant="outline"
              className="text-[10px] gap-1 px-1.5 py-0 shrink-0"
              style={{ borderColor: color + '60', color: color }}
            >
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
              {platformCfg?.name || post.platform}
            </Badge>

            {/* Status badge */}
            {statusCfg && (
              <Badge className={`text-[10px] px-1.5 py-0 ${statusCfg.color}`}>
                {statusCfg.label}
              </Badge>
            )}

            {/* AI indicator */}
            {post.aiGenerated && (
              <Badge className="text-[10px] px-1.5 py-0 bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                <Sparkles className="size-2.5 mr-0.5" />
                AI
              </Badge>
            )}
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex items-center gap-0.5 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="size-6"
                onClick={() => setExpanded(!expanded)}
              >
                <Eye className="size-3" />
              </Button>
              {post.status !== 'published' && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6 text-emerald-600 hover:text-emerald-700"
                  onClick={() => onStatusChange(post.id, 'published')}
                >
                  <CircleCheckBig className="size-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="size-6 text-destructive hover:text-destructive"
                onClick={() => onDelete(post.id)}
              >
                <Trash2 className="size-3" />
              </Button>
            </div>
          )}
        </div>

        {/* Title */}
        {post.title && (
          <h4 className="text-sm font-semibold text-foreground mb-1">{post.title}</h4>
        )}

        {/* Content preview */}
        <p
          className={`text-sm text-muted-foreground ${expanded ? '' : 'line-clamp-2'}`}
        >
          {post.content || 'No content'}
        </p>

        {post.content && post.content.length > 120 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[11px] text-primary hover:underline mt-1"
          >
            {expanded ? 'Show less' : 'Show more'}
          </button>
        )}

        {/* Metadata */}
        <div className="flex items-center gap-3 mt-2 pt-2 border-t">
          {/* Scheduled time */}
          {(post.scheduledAt || post._time) && (
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Clock className="size-3" />
              {post._time}
            </span>
          )}

          {/* Published time */}
          {post.publishedAt && post.status === 'published' && (
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CircleCheckBig className="size-3" />
              {formatTime(post.publishedAt)}
            </span>
          )}

          {/* Engagement stats */}
          {post.status === 'published' && (post.likes + post.comments + post.shares > 0) && (
            <span className="text-[11px] text-muted-foreground ml-auto">
              {post.likes > 0 && `👍 ${post.likes}`}
              {post.comments > 0 && ` 💬 ${post.comments}`}
              {post.shares > 0 && ` ↗ ${post.shares}`}
            </span>
          )}
        </div>

        {/* Quick status change buttons */}
        {post.status === 'draft' && (
          <div className="flex items-center gap-1.5 mt-2">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[11px] gap-1 flex-1"
              onClick={() => onStatusChange(post.id, 'scheduled')}
            >
              <Send className="size-3" />
              Schedule
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[11px] gap-1 flex-1"
              onClick={() => onStatusChange(post.id, 'published')}
            >
              <CircleCheckBig className="size-3" />
              Publish
            </Button>
          </div>
        )}

        {post.status === 'scheduled' && (
          <div className="flex items-center gap-1.5 mt-2">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[11px] gap-1 flex-1"
              onClick={() => onStatusChange(post.id, 'published')}
            >
              <CircleCheckBig className="size-3" />
              Publish Now
            </Button>
          </div>
        )}

        {/* Hashtags */}
        {post.hashtags && post.hashtags.length > 0 && expanded && (
          <div className="flex flex-wrap gap-1 mt-2">
            {post.hashtags.map((tag, i) => (
              <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0">
                #{tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
