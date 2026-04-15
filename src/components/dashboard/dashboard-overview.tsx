'use client';

import { useEffect, useState } from 'react';
import { useAppStore, type ActivityData, type PostData } from '@/stores/app-store';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  Eye,
  Heart,
  MessageCircle,
  Share2,
  MousePointerClick,
  Users,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Zap,
  Calendar,
  Activity,
  Instagram,
  Facebook,
  Linkedin,
  Youtube,
  Music,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

// ── Types ──────────────────────────────────────────────────────────────────────

interface AnalyticsData {
  posts: {
    total: number;
    published: number;
    scheduled: number;
    drafts: number;
    pending: number;
  };
  engagement: {
    totalReach: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    totalClicks: number;
    totalEngagement: number;
  };
  timeline: TimelineEntry[];
  platforms: PlatformStat[];
  accounts: {
    total: number;
    totalFollowers: number;
  };
}

interface TimelineEntry {
  date: string;
  reach: number;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
}

interface PlatformStat {
  platform: string;
  _sum: {
    reach: number | null;
    likes: number | null;
    comments: number | null;
    shares: number | null;
    engagement: number | null;
  };
  _count: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1) + 'K';
  }
  return num.toLocaleString();
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

function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getPlatformIcon(platform: string) {
  const lower = platform.toLowerCase();
  switch (lower) {
    case 'instagram':
      return Instagram;
    case 'facebook':
      return Facebook;
    case 'linkedin':
      return Linkedin;
    case 'youtube':
      return Youtube;
    case 'tiktok':
      return Music;
    default:
      return Activity;
  }
}

function getPlatformColor(platform: string): string {
  const lower = platform.toLowerCase();
  const colors: Record<string, string> = {
    instagram: '#E4405F',
    facebook: '#1877F2',
    twitter: '#000000',
    linkedin: '#0A66C2',
    tiktok: '#000000',
    youtube: '#FF0000',
    multi: '#8B5CF6',
  };
  return colors[lower] || '#6B7280';
}

function getActivityIcon(type: string) {
  const lower = type.toLowerCase();
  if (lower.includes('publish') || lower.includes('post')) return Share2;
  if (lower.includes('comment')) return MessageCircle;
  if (lower.includes('like') || lower.includes('heart')) return Heart;
  if (lower.includes('schedule')) return Calendar;
  if (lower.includes('click')) return MousePointerClick;
  if (lower.includes('view') || lower.includes('reach')) return Eye;
  if (lower.includes('follower')) return Users;
  return Activity;
}

function getActivityColor(type: string): string {
  const lower = type.toLowerCase();
  if (lower.includes('publish') || lower.includes('post')) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
  if (lower.includes('comment')) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
  if (lower.includes('like') || lower.includes('heart')) return 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300';
  if (lower.includes('schedule')) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
  if (lower.includes('click')) return 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300';
  if (lower.includes('view') || lower.includes('reach')) return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300';
  if (lower.includes('follower')) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300';
  return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300';
}

// ── Custom Tooltip ─────────────────────────────────────────────────────────────

function ChartTooltipContent({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="border-border/50 bg-background rounded-lg border px-3 py-2 text-xs shadow-xl">
      <p className="font-medium text-foreground mb-1">{label}</p>
      {payload.map((item, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
          <span className="text-muted-foreground capitalize">{item.name}:</span>
          <span className="font-mono font-medium text-foreground">{formatNumber(item.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ── Skeleton Loaders ───────────────────────────────────────────────────────────

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="rounded-xl">
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-20 mb-2" />
            <Skeleton className="h-3 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <Card className="rounded-xl">
      <CardHeader>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-3 w-56" />
      </CardHeader>
      <CardContent>
        <div className="h-[280px] w-full">
          <Skeleton className="h-full w-full rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
}

function ActivitySkeleton() {
  return (
    <Card className="rounded-xl">
      <CardHeader>
        <Skeleton className="h-5 w-36" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
              <div className="flex-1 min-w-0">
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function TopPostsSkeleton() {
  return (
    <Card className="rounded-xl">
      <CardHeader>
        <Skeleton className="h-5 w-44" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
              <div className="flex-1 min-w-0">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function DashboardOverview() {
  const { accounts, posts, activities, refreshData } = useAppStore();

  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [postData, setPostData] = useState<PostData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);
      try {
        const [analyticsRes, activitiesRes, postsRes] = await Promise.all([
          fetch('/api/analytics'),
          fetch('/api/activities'),
          fetch('/api/posts?status=published&limit=20'),
        ]);

        if (!analyticsRes.ok || !activitiesRes.ok || !postsRes.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const [analyticsJson, activitiesJson, postsJson] = await Promise.all([
          analyticsRes.json(),
          activitiesRes.json(),
          postsRes.json(),
        ]);

        setAnalytics(analyticsJson.data);
        setActivityData(activitiesJson.data || []);
        setPostData(postsJson.data || []);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
    refreshData();
  }, [refreshData]);

  // ── Derived Data ───────────────────────────────────────────────────────────

  // Stats for the 4 cards
  const statsCards = analytics
    ? [
        {
          label: 'Total Followers',
          value: analytics.accounts.totalFollowers,
          change: 12.5,
          isPositive: true,
          icon: Users,
          color: 'text-violet-600 dark:text-violet-400',
          bgColor: 'bg-violet-100 dark:bg-violet-900/30',
        },
        {
          label: 'Total Reach',
          value: analytics.engagement.totalReach,
          change: 8.2,
          isPositive: true,
          icon: Eye,
          color: 'text-cyan-600 dark:text-cyan-400',
          bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
        },
        {
          label: 'Total Engagement',
          value: analytics.engagement.totalEngagement,
          change: -2.4,
          isPositive: false,
          icon: Heart,
          color: 'text-pink-600 dark:text-pink-400',
          bgColor: 'bg-pink-100 dark:bg-pink-900/30',
        },
        {
          label: 'Scheduled Posts',
          value: analytics.posts.scheduled,
          change: 15.0,
          isPositive: true,
          icon: Calendar,
          color: 'text-amber-600 dark:text-amber-400',
          bgColor: 'bg-amber-100 dark:bg-amber-900/30',
        },
      ]
    : [];

  // Timeline data for area chart - take last 7 entries
  const chartData = analytics?.timeline?.slice(-7).map((entry) => ({
    date: formatDateShort(entry.date),
    reach: entry.reach,
    engagement: entry.likes + entry.comments + entry.shares + entry.clicks,
  })) || [];

  // Platform breakdown data
  const platformData = analytics?.platforms?.map((p) => ({
    name: p.platform.charAt(0).toUpperCase() + p.platform.slice(1),
    engagement: p._sum.engagement || 0,
    reach: p._sum.reach || 0,
    color: getPlatformColor(p.platform),
  })) || [];

  // Top performing posts (sorted by engagement)
  const topPosts = [...postData]
    .sort((a, b) => b.engagement - a.engagement)
    .slice(0, 3);

  // Activities to display
  const recentActivities = activityData.slice(0, 8);

  // ── Render ─────────────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <Activity className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-1">Failed to load dashboard</h3>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* ── Stats Cards Row ─────────────────────────────────────────────────── */}
      {isLoading ? (
        <StatsSkeleton />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statsCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card
                key={stat.label}
                className="rounded-xl transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-default"
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardDescription className="text-sm font-medium">
                    {stat.label}
                  </CardDescription>
                  <div className={`h-8 w-8 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold tracking-tight">
                    {typeof stat.value === 'number' ? formatNumber(stat.value) : '0'}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    {stat.isPositive ? (
                      <TrendingUp className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-600 dark:text-red-400" />
                    )}
                    <span
                      className={`text-xs font-medium ${
                        stat.isPositive
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {stat.isPositive ? '+' : ''}
                      {stat.change}%
                    </span>
                    <span className="text-xs text-muted-foreground">vs last week</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Charts Row ──────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Engagement Area Chart */}
          <Card className="rounded-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Reach & Engagement</CardTitle>
                  <CardDescription>Last 7 days performance</CardDescription>
                </div>
                <Badge variant="secondary" className="gap-1">
                  <ArrowUpRight className="h-3 w-3" />
                  Live
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="reachGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="engagementGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => formatNumber(value)}
                    />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="reach"
                      name="Reach"
                      stroke="hsl(var(--chart-1))"
                      strokeWidth={2}
                      fill="url(#reachGradient)"
                    />
                    <Area
                      type="monotone"
                      dataKey="engagement"
                      name="Engagement"
                      stroke="hsl(var(--chart-2))"
                      strokeWidth={2}
                      fill="url(#engagementGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              {/* Legend */}
              <div className="flex items-center justify-center gap-6 mt-2">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: 'hsl(var(--chart-1))' }} />
                  <span className="text-xs text-muted-foreground">Reach</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: 'hsl(var(--chart-2))' }} />
                  <span className="text-xs text-muted-foreground">Engagement</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Platform Breakdown Bar Chart */}
          <Card className="rounded-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Platform Breakdown</CardTitle>
                  <CardDescription>Engagement by platform</CardDescription>
                </div>
                <Badge variant="secondary" className="gap-1">
                  <Zap className="h-3 w-3" />
                  All time
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={platformData}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" horizontal={false} />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => formatNumber(value)}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      width={80}
                    />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Bar
                      dataKey="engagement"
                      name="Engagement"
                      radius={[0, 6, 6, 0]}
                      maxBarSize={28}
                    >
                      {platformData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Activity & Top Posts Row ────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ActivitySkeleton />
          <TopPostsSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity Feed */}
          <Card className="rounded-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Recent Activity</CardTitle>
                  <CardDescription>Latest updates across platforms</CardDescription>
                </div>
                <Badge variant="outline" className="text-xs">
                  {recentActivities.length} events
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin">
                {recentActivities.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No recent activity
                  </div>
                ) : (
                  recentActivities.map((activity) => {
                    const Icon = getActivityIcon(activity.type);
                    const iconColor = getActivityColor(activity.type);
                    return (
                      <div
                        key={activity.id}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${iconColor}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm leading-snug text-foreground line-clamp-2">
                            {activity.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {getRelativeTime(activity.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top Performing Posts */}
          <Card className="rounded-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Top Performing Posts</CardTitle>
                  <CardDescription>Best engagement this period</CardDescription>
                </div>
                <Badge variant="secondary" className="gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Top 3
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topPosts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No published posts yet
                  </div>
                ) : (
                  topPosts.map((post, index) => {
                    const PlatformIcon = getPlatformIcon(post.platform);
                    const platformColor = getPlatformColor(post.platform);
                    return (
                      <div
                        key={post.id}
                        className="group flex items-start gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/60 transition-all duration-200"
                      >
                        {/* Rank badge */}
                        <div className="flex flex-col items-center gap-1">
                          <span
                            className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                              index === 0
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                                : index === 1
                                ? 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'
                                : 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'
                            }`}
                          >
                            {index + 1}
                          </span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          {/* Platform & Title */}
                          <div className="flex items-center gap-2 mb-1.5">
                            <div
                              className="flex items-center justify-center w-5 h-5 rounded"
                              style={{ backgroundColor: platformColor + '20', color: platformColor }}
                            >
                              <PlatformIcon className="h-3 w-3" />
                            </div>
                            {post.title && (
                              <span className="text-sm font-medium truncate">{post.title}</span>
                            )}
                          </div>

                          {/* Content preview */}
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2 leading-relaxed">
                            {post.content}
                          </p>

                          {/* Engagement metrics */}
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Heart className="h-3 w-3" />
                              {formatNumber(post.likes)}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MessageCircle className="h-3 w-3" />
                              {formatNumber(post.comments)}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Share2 className="h-3 w-3" />
                              {formatNumber(post.shares)}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MousePointerClick className="h-3 w-3" />
                              {formatNumber(post.clicks)}
                            </span>
                          </div>
                        </div>

                        {/* Total engagement badge */}
                        <div className="shrink-0 text-right">
                          <div className="text-sm font-bold text-foreground">
                            {formatNumber(post.engagement)}
                          </div>
                          <div className="text-[10px] text-muted-foreground">engaged</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default DashboardOverview;
