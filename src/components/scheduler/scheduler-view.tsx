'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '@/stores/app-store';
import { PLATFORMS, POST_STATUSES, BEST_POSTING_TIMES, type PlatformKey } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  Zap,
  ArrowRight,
  CalendarDays,
  Timer,
  ChevronsUpDown,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────
interface ScheduledPost {
  id: string;
  title?: string;
  content: string;
  platform: string;
  scheduledAt?: string;
  status: string;
  aiGenerated: boolean;
}

interface AIBestTime {
  platform: string;
  times: string[];
  bestDay: string;
  score: number;
}

interface AIScheduleSuggestion {
  day: string;
  time: string;
  platform: string;
  reason: string;
}

type CalendarDay = {
  date: Date;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
};

// ─── Helpers ───────────────────────────────────────────────────
const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

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

function formatRelativeDate(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (isSameDay(d, today)) return 'Today';
  if (isSameDay(d, tomorrow)) return 'Tomorrow';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
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

// ─── Main Component ────────────────────────────────────────────
export function SchedulerView() {
  const { posts, setPosts, setActiveView, setSelectedPlatforms } = useAppStore();

  // Calendar state
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Data state
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [aiBestTimes, setAiBestTimes] = useState<AIBestTime[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<AIScheduleSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiOpen, setAiOpen] = useState(false);

  // Current month / year
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // ── Fetch scheduled posts ──
  useEffect(() => {
    async function fetchScheduledPosts() {
      try {
        const res = await fetch('/api/posts?status=scheduled&limit=100');
        const json = await res.json();
        if (json.success) {
          setScheduledPosts(json.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch scheduled posts:', err);
      }
    }
    fetchScheduledPosts();
  }, []);

  // ── Fetch AI suggestions ──
  useEffect(() => {
    async function fetchAI() {
      try {
        const [bestTimeRes, suggestionsRes] = await Promise.all([
          fetch('/api/ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'best_time' }),
          }),
          fetch('/api/ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'schedule_suggestions' }),
          }),
        ]);

        const [bestTimeJson, suggestionsJson] = await Promise.all([
          bestTimeRes.json(),
          suggestionsRes.json(),
        ]);

        if (bestTimeJson.success) {
          try {
            const data = typeof bestTimeJson.data === 'string' ? JSON.parse(bestTimeJson.data) : bestTimeJson.data;
            // data is per-platform; fetch for all platforms
            const times: AIBestTime[] = [];
            for (const [platform, info] of Object.entries(data)) {
              times.push({ platform, ...(info as Omit<AIBestTime, 'platform'>) });
            }
            setAiBestTimes(times);
          } catch {
            // Fallback to constants
            setAiBestTimes(
              BEST_POSTING_TIMES.map((b) => ({
                platform: b.platform,
                times: [...b.times],
                bestDay: b.bestDay,
                score: 80 + Math.floor(Math.random() * 15),
              }))
            );
          }
        } else {
          // Fallback to constants
          setAiBestTimes(
            BEST_POSTING_TIMES.map((b) => ({
              platform: b.platform,
              times: [...b.times],
              bestDay: b.bestDay,
              score: 80 + Math.floor(Math.random() * 15),
            }))
          );
        }

        if (suggestionsJson.success) {
          try {
            const data = typeof suggestionsJson.data === 'string' ? JSON.parse(suggestionsJson.data) : suggestionsJson.data;
            setAiSuggestions(data);
          } catch {
            setAiSuggestions([]);
          }
        }
      } catch (err) {
        console.error('Failed to fetch AI data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAI();
  }, []);

  // ── Calendar grid computation ──
  const calendarDays = useMemo<CalendarDay[]>(() => {
    const days: CalendarDay[] = [];
    const today = new Date();
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const daysInPrevMonth = getDaysInMonth(
      currentMonth === 0 ? currentYear - 1 : currentYear,
      currentMonth === 0 ? 11 : currentMonth - 1
    );

    // Previous month trailing days
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const month = currentMonth === 0 ? 11 : currentMonth - 1;
      const year = currentMonth === 0 ? currentYear - 1 : currentYear;
      days.push({
        date: new Date(year, month, day),
        dayOfMonth: day,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      days.push({
        date,
        dayOfMonth: day,
        isCurrentMonth: true,
        isToday: isSameDay(date, today),
      });
    }

    // Next month leading days to fill 6 rows (42 cells)
    const remaining = 42 - days.length;
    for (let day = 1; day <= remaining; day++) {
      const month = currentMonth === 11 ? 0 : currentMonth + 1;
      const year = currentMonth === 11 ? currentYear + 1 : currentYear;
      days.push({
        date: new Date(year, month, day),
        dayOfMonth: day,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    return days;
  }, [currentYear, currentMonth]);

  // ── Posts mapped by date key ──
  const postsByDate = useMemo(() => {
    const map: Record<string, ScheduledPost[]> = {};
    for (const post of scheduledPosts) {
      if (post.scheduledAt) {
        const key = formatDateKey(new Date(post.scheduledAt));
        if (!map[key]) map[key] = [];
        map[key].push(post);
      }
    }
    return map;
  }, [scheduledPosts]);

  // ── Selected date posts ──
  const selectedDatePosts = useMemo(() => {
    if (!selectedDate) return [];
    const key = formatDateKey(selectedDate);
    return (postsByDate[key] || []).sort(
      (a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime()
    );
  }, [selectedDate, postsByDate]);

  // ── Posts grouped by date for sidebar ──
  const postsGroupedByDate = useMemo(() => {
    const groups: { dateKey: string; label: string; posts: ScheduledPost[] }[] = [];
    const sorted = [...scheduledPosts]
      .filter((p) => p.scheduledAt)
      .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime());

    for (const post of sorted) {
      const key = formatDateKey(new Date(post.scheduledAt!));
      const existing = groups.find((g) => g.dateKey === key);
      if (existing) {
        existing.posts.push(post);
      } else {
        groups.push({
          dateKey: key,
          label: formatRelativeDate(post.scheduledAt!),
          posts: [post],
        });
      }
    }
    return groups;
  }, [scheduledPosts]);

  // ── Upcoming posts (next 5) ──
  const upcomingPosts = useMemo(() => {
    const now = new Date();
    return scheduledPosts
      .filter((p) => p.scheduledAt && new Date(p.scheduledAt) > now)
      .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime())
      .slice(0, 5);
  }, [scheduledPosts]);

  // ── Navigation ──
  function goToPrevMonth() {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    setSelectedDate(null);
  }

  function goToNextMonth() {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    setSelectedDate(null);
  }

  function goToToday() {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  }

  // ── Handle click day → create post ──
  function handleDayClick(day: CalendarDay) {
    setSelectedDate(day.date);
  }

  function handleCreatePost() {
    if (selectedDate) {
      setActiveView('compose');
    }
  }

  // ── Handle apply AI suggestion ──
  function handleApplySuggestion(suggestion: AIScheduleSuggestion) {
    const platformKey = suggestion.platform as PlatformKey;
    if (Object.keys(PLATFORMS).includes(platformKey)) {
      setSelectedPlatforms([platformKey]);
      setActiveView('compose');
    }
  }

  // ── Total scheduled count ──
  const totalScheduled = scheduledPosts.length;

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-6 p-4 md:p-6">
        {/* ─── Page Header ─── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <CalendarDays className="size-6 text-primary" />
              Smart Scheduler
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Plan and schedule your content across all platforms with AI-powered timing.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              <Clock className="size-3 mr-1" />
              {totalScheduled} scheduled
            </Badge>
            <Button size="sm" onClick={() => setActiveView('compose')}>
              <Plus className="size-4" />
              New Post
            </Button>
          </div>
        </div>

        {/* ─── Main 2-Column Layout ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
          {/* ─── LEFT: Calendar ─── */}
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={goToPrevMonth}>
                      <ChevronLeft className="size-4" />
                    </Button>
                    <CardTitle className="text-lg min-w-[200px] text-center">
                      {MONTH_NAMES[currentMonth]} {currentYear}
                    </CardTitle>
                    <Button variant="ghost" size="icon" onClick={goToNextMonth}>
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={goToToday}>
                      <Calendar className="size-3.5 mr-1" />
                      Today
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Weekday headers */}
                <div className="grid grid-cols-7 mb-1">
                  {WEEKDAY_LABELS.map((label) => (
                    <div
                      key={label}
                      className="text-center text-xs font-medium text-muted-foreground py-2"
                    >
                      {label}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 border-t border-l rounded-lg overflow-hidden">
                  {calendarDays.map((day, idx) => {
                    const key = formatDateKey(day.date);
                    const dayPosts = postsByDate[key] || [];
                    const isSelected = selectedDate ? isSameDay(day.date, selectedDate) : false;
                    const hasPosts = dayPosts.length > 0;

                    return (
                      <div
                        key={idx}
                        onClick={() => handleDayClick(day)}
                        className={`
                          relative min-h-[80px] md:min-h-[100px] border-r border-b p-1.5 cursor-pointer
                          transition-colors duration-150
                          ${!day.isCurrentMonth ? 'bg-muted/30' : 'bg-background'}
                          ${isSelected ? 'bg-primary/5 ring-2 ring-primary/30 ring-inset' : ''}
                          ${day.isToday ? 'bg-primary/5' : ''}
                          hover:bg-accent/50
                        `}
                      >
                        {/* Day number */}
                        <span
                          className={`
                            inline-flex items-center justify-center size-7 text-xs font-medium rounded-full
                            ${day.isToday ? 'bg-primary text-primary-foreground' : ''}
                            ${!day.isCurrentMonth ? 'text-muted-foreground/50' : 'text-foreground'}
                          `}
                        >
                          {day.dayOfMonth}
                        </span>

                        {/* Post dots / badges */}
                        {hasPosts && (
                          <div className="flex flex-wrap gap-0.5 mt-0.5">
                            {dayPosts.slice(0, 4).map((post, pIdx) => {
                              const color = getPlatformColor(post.platform);
                              return (
                                <Tooltip key={pIdx}>
                                  <TooltipTrigger asChild>
                                    <div
                                      className="w-2 h-2 rounded-full flex-shrink-0"
                                      style={{ backgroundColor: color }}
                                    />
                                  </TooltipTrigger>
                                  <TooltipContent side="top">
                                    <p className="text-xs font-medium">{post.platform}</p>
                                    <p className="text-xs opacity-80">
                                      {post.scheduledAt ? formatTime(post.scheduledAt) : 'No time set'}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              );
                            })}
                            {dayPosts.length > 4 && (
                              <span className="text-[10px] text-muted-foreground leading-none ml-0.5">
                                +{dayPosts.length - 4}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Hover add button */}
                        {day.isCurrentMonth && !hasPosts && (
                          <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Plus className="size-3 text-muted-foreground/40" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Platform legend */}
                <div className="flex flex-wrap items-center gap-3 mt-4 px-1">
                  {Object.entries(PLATFORMS).map(([key, platform]) => {
                    const hasPosts = scheduledPosts.some((p) => p.platform === key || p.platform === platform.name);
                    return (
                      <div key={key} className="flex items-center gap-1.5">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: platform.color }}
                        />
                        <span className={`text-xs ${hasPosts ? 'text-foreground' : 'text-muted-foreground/50'}`}>
                          {platform.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* ─── Upcoming Posts Timeline ─── */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Timer className="size-4 text-primary" />
                    <CardTitle className="text-base">Upcoming Posts</CardTitle>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {upcomingPosts.length} upcoming
                  </Badge>
                </div>
                <CardDescription>Next scheduled posts in your queue</CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingPosts.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="size-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No upcoming posts scheduled</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => setActiveView('compose')}
                    >
                      <Plus className="size-3.5 mr-1" />
                      Create your first post
                    </Button>
                  </div>
                ) : (
                  <div className="relative pl-6">
                    {/* Vertical timeline line */}
                    <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />

                    <div className="flex flex-col gap-4">
                      {upcomingPosts.map((post, idx) => (
                        <div key={post.id} className="relative flex items-start gap-3">
                          {/* Timeline dot */}
                          <div
                            className="absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-background z-10"
                            style={{ backgroundColor: getPlatformColor(post.platform) }}
                          />

                          <div className="flex-1 bg-muted/50 rounded-lg p-3 hover:bg-muted/80 transition-colors">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span
                                  className="inline-block w-2 h-2 rounded-full"
                                  style={{ backgroundColor: getPlatformColor(post.platform) }}
                                />
                                <span className="text-xs font-medium">{post.platform}</span>
                              </div>
                              {post.scheduledAt && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="size-3" />
                                  {formatTime(post.scheduledAt)}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-foreground line-clamp-2">
                              {post.content || post.title || 'Untitled post'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {post.scheduledAt
                                ? new Date(post.scheduledAt).toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric',
                                  })
                                : 'Not scheduled'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ─── RIGHT: Sidebar ─── */}
          <div className="flex flex-col gap-6">
            {/* ─── Selected Day Posts ─── */}
            {selectedDate && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="size-4 text-primary" />
                      <CardTitle className="text-base">
                        {selectedDate.toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </CardTitle>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleCreatePost}>
                      <Plus className="size-3.5" />
                      <span className="text-xs">Add</span>
                    </Button>
                  </div>
                  <CardDescription>
                    {selectedDatePosts.length} post{selectedDatePosts.length !== 1 ? 's' : ''} scheduled
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedDatePosts.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-sm text-muted-foreground mb-3">No posts scheduled for this day</p>
                      <Button size="sm" variant="secondary" onClick={handleCreatePost}>
                        <Plus className="size-3.5 mr-1" />
                        Schedule a post
                      </Button>
                    </div>
                  ) : (
                    <ScrollArea className="max-h-64">
                      <div className="flex flex-col gap-3">
                        {selectedDatePosts.map((post) => (
                          <ScheduledPostItem key={post.id} post={post} />
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ─── AI Best Time Suggestions (Collapsible) ─── */}
            <Collapsible open={aiOpen} onOpenChange={setAiOpen}>
              <Card>
                <CardHeader className="pb-3">
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between cursor-pointer">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center size-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-white">
                          <Sparkles className="size-4" />
                        </div>
                        <div className="text-left">
                          <CardTitle className="text-base">AI Best Times</CardTitle>
                          <CardDescription>Optimized posting schedule</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs">
                          <Zap className="size-3 mr-0.5" />
                          AI
                        </Badge>
                        <ChevronsUpDown className="size-4 text-muted-foreground" />
                      </div>
                    </div>
                  </CollapsibleTrigger>
                </CardHeader>
                <CollapsibleContent>
                  <CardContent>
                    {loading ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="h-12 rounded-md bg-muted animate-pulse" />
                        ))}
                      </div>
                    ) : (
                      <ScrollArea className="max-h-80">
                        <div className="flex flex-col gap-3">
                          {aiBestTimes.map((item, idx) => {
                            const platformKey = Object.keys(PLATFORMS).find(
                              (k) =>
                                PLATFORMS[k as PlatformKey].name.toLowerCase() ===
                                  item.platform.toLowerCase() || k === item.platform
                            );
                            return (
                              <div
                                key={idx}
                                className="rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-2.5 h-2.5 rounded-full"
                                      style={{
                                        backgroundColor: platformKey
                                          ? PLATFORMS[platformKey as PlatformKey].color
                                          : '#6b7280',
                                      }}
                                    />
                                    <span className="text-sm font-medium">{item.platform}</span>
                                  </div>
                                  <Badge
                                    variant="outline"
                                    className="text-xs text-emerald-600 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800"
                                  >
                                    {item.score}% effective
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-1.5 mb-2">
                                  {item.times.map((time, tIdx) => (
                                    <Badge key={tIdx} variant="secondary" className="text-xs">
                                      <Clock className="size-3 mr-0.5" />
                                      {time.replace(' EST', '')}
                                    </Badge>
                                  ))}
                                </div>
                                <p className="text-xs text-muted-foreground mb-2">
                                  Best day: <span className="font-medium text-foreground">{item.bestDay}</span>
                                </p>
                                {platformKey && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full text-xs"
                                    onClick={() =>
                                      handleApplySuggestion({
                                        day: item.bestDay,
                                        time: item.times[0],
                                        platform: platformKey,
                                        reason: '',
                                      })
                                    }
                                  >
                                    <ArrowRight className="size-3 mr-1" />
                                    Schedule for {item.platform}
                                  </Button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* ─── AI Schedule Suggestions ─── */}
            {aiSuggestions.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center size-8 rounded-lg bg-gradient-to-br from-violet-400 to-purple-500 text-white">
                      <Zap className="size-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Suggested Schedule</CardTitle>
                      <CardDescription>AI-recommended posting plan</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="max-h-72">
                    <div className="flex flex-col gap-2">
                      {aiSuggestions.map((suggestion, idx) => {
                        const platformKey = Object.keys(PLATFORMS).find(
                          (k) => k === suggestion.platform
                        );
                        return (
                          <div
                            key={idx}
                            className="flex items-start gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex flex-col items-center min-w-[48px]">
                              <span className="text-xs font-semibold text-primary">
                                {suggestion.day.slice(0, 3)}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {suggestion.time.replace(' ', '').replace('AM', '').replace('PM', '')}
                              </span>
                            </div>
                            <Separator orientation="vertical" className="h-auto" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <div
                                  className="w-2 h-2 rounded-full flex-shrink-0"
                                  style={{
                                    backgroundColor: platformKey
                                      ? PLATFORMS[platformKey as PlatformKey].color
                                      : '#6b7280',
                                  }}
                                />
                                <span className="text-xs font-medium capitalize">
                                  {platformKey
                                    ? PLATFORMS[platformKey as PlatformKey].name
                                    : suggestion.platform}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {suggestion.reason}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 flex-shrink-0"
                              onClick={() => handleApplySuggestion(suggestion)}
                            >
                              <ArrowRight className="size-3" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {/* ─── All Scheduled Posts (Grouped by Date) ─── */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="size-4 text-primary" />
                    <CardTitle className="text-base">All Scheduled</CardTitle>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {totalScheduled} posts
                  </Badge>
                </div>
                <CardDescription>Posts grouped by date</CardDescription>
              </CardHeader>
              <CardContent>
                {postsGroupedByDate.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="size-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No scheduled posts yet</p>
                    <p className="text-xs text-muted-foreground mt-1 mb-3">
                      Click on a calendar day or compose a new post
                    </p>
                    <Button size="sm" onClick={() => setActiveView('compose')}>
                      <Plus className="size-3.5 mr-1" />
                      Compose
                    </Button>
                  </div>
                ) : (
                  <ScrollArea className="max-h-96">
                    <div className="flex flex-col gap-4">
                      {postsGroupedByDate.map((group) => (
                        <div key={group.dateKey}>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs font-medium">
                              {group.label}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {group.posts.length} post{group.posts.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="flex flex-col gap-2">
                            {group.posts.map((post) => (
                              <ScheduledPostItem key={post.id} post={post} compact />
                            ))}
                          </div>
                          <Separator className="mt-3" />
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

// ─── Scheduled Post Item Sub-Component ─────────────────────────
function ScheduledPostItem({
  post,
  compact = false,
}: {
  post: ScheduledPost;
  compact?: boolean;
}) {
  const statusConfig = POST_STATUSES[post.status as keyof typeof POST_STATUSES];

  return (
    <div
      className={`
        group rounded-lg border bg-card hover:shadow-sm transition-all
        ${compact ? 'p-2.5' : 'p-3'}
      `}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {/* Platform indicator */}
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: getPlatformColor(post.platform) }}
          />
          <span className="text-xs font-medium capitalize truncate">
            {post.platform}
          </span>
          {/* Status badge */}
          {statusConfig && (
            <Badge className={`text-[10px] px-1.5 py-0 ${statusConfig.color}`}>
              {statusConfig.label}
            </Badge>
          )}
          {post.aiGenerated && (
            <Badge className="text-[10px] px-1.5 py-0 bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
              <Sparkles className="size-2.5 mr-0.5" />
              AI
            </Badge>
          )}
        </div>

        {/* Time */}
        {post.scheduledAt && (
          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 flex-shrink-0">
            <Clock className="size-2.5" />
            {formatTime(post.scheduledAt)}
          </span>
        )}
      </div>

      {/* Content preview */}
      <p
        className={`
          text-sm text-foreground/80 mt-1.5 line-clamp-2
          ${compact ? 'text-xs' : ''}
        `}
      >
        {post.content || post.title || 'Untitled post'}
      </p>

      {/* Actions */}
      {!compact && (
        <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="sm" className="h-7 text-xs px-2">
            <Edit2 className="size-3 mr-1" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs px-2 text-destructive hover:text-destructive"
          >
            <Trash2 className="size-3 mr-1" />
            Delete
          </Button>
        </div>
      )}
    </div>
  );
}
