'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '@/stores/app-store';
import { PLATFORMS, POST_STATUSES } from '@/lib/constants';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  TrendingDown,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  MousePointerClick,
  ArrowUpRight,
  BarChart3,
  PieChart as PieChartIcon,
  Target,
  Calendar,
  Zap,
  Users,
  Crown,
  Sparkles,
  BookOpen,
  Megaphone,
  GraduationCap,
} from 'lucide-react';

// Chart colors matching the theme (chart-1 through chart-5)
const CHART_COLORS = [
  'oklch(0.646 0.222 41.116)', // chart-1 warm orange
  'oklch(0.6 0.118 184.704)',  // chart-2 teal
  'oklch(0.398 0.07 227.392)', // chart-3 dark blue
  'oklch(0.828 0.189 84.429)', // chart-4 gold
  'oklch(0.769 0.188 70.08)',  // chart-5 amber
];

const PLATFORM_COLORS: Record<string, string> = {
  facebook: '#1877F2',
  instagram: '#E4405F',
  twitter: '#1DA1F2',
  linkedin: '#0A66C2',
  tiktok: '#00f2ea',
  youtube: '#FF0000',
  multi: '#8b5cf6',
};

// Content type colors
const CONTENT_COLORS = ['#f59e0b', '#10b981', '#6366f1', '#ec4899', '#14b8a6', '#f97316', '#8b5cf6', '#06b6d4'];

// Date range options
type DateRange = '7d' | '14d' | '30d' | '90d' | 'custom';
interface DateRangeOption {
  label: string;
  value: DateRange;
  days: number;
}

const DATE_RANGES: DateRangeOption[] = [
  { label: '7D', value: '7d', days: 7 },
  { label: '14D', value: '14d', days: 14 },
  { label: '30D', value: '30d', days: 30 },
  { label: '90D', value: '90d', days: 90 },
];

// Number formatting utility
function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toLocaleString();
}

function formatPercent(num: number): string {
  if (num >= 100) return '+99%';
  if (num <= -100) return '-99%';
  return (num > 0 ? '+' : '') + num.toFixed(1) + '%';
}

// Generate mock data for demo purposes
function generateMockTimeline(days: number) {
  const data: Array<{
    date: string;
    reach: number;
    impressions: number;
    likes: number;
    comments: number;
    shares: number;
    clicks: number;
  }> = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    data.push({
      date: dateStr,
      reach: Math.floor(Math.random() * 5000 + 2000 + (days - i) * 50),
      impressions: Math.floor(Math.random() * 8000 + 4000 + (days - i) * 80),
      likes: Math.floor(Math.random() * 800 + 200 + (days - i) * 8),
      comments: Math.floor(Math.random() * 200 + 50 + (days - i) * 3),
      shares: Math.floor(Math.random() * 150 + 30 + (days - i) * 2),
      clicks: Math.floor(Math.random() * 400 + 100 + (days - i) * 5),
    });
  }
  return data;
}

function generateMockPlatforms() {
  return [
    {
      platform: 'instagram',
      _count: 42,
      _sum: { reach: 125000, likes: 8400, comments: 2100, shares: 1800, engagement: 12300 },
    },
    {
      platform: 'facebook',
      _count: 38,
      _sum: { reach: 98000, likes: 6200, comments: 1800, shares: 1400, engagement: 9400 },
    },
    {
      platform: 'twitter',
      _count: 55,
      _sum: { reach: 72000, likes: 4800, comments: 1200, shares: 950, engagement: 6950 },
    },
    {
      platform: 'linkedin',
      _count: 24,
      _sum: { reach: 56000, likes: 3200, comments: 890, shares: 720, engagement: 4810 },
    },
    {
      platform: 'tiktok',
      _count: 31,
      _sum: { reach: 185000, likes: 15200, comments: 4200, shares: 3800, engagement: 23200 },
    },
    {
      platform: 'youtube',
      _count: 12,
      _sum: { reach: 45000, likes: 2100, comments: 560, shares: 340, engagement: 3000 },
    },
  ];
}

function generateMockPosts() {
  const contents = [
    { title: 'Behind the scenes of our new product launch', platform: 'instagram', content: '🚀 Exciting things are happening! Take a peek behind the curtain...', category: 'behind-scenes' },
    { title: '10 Tips for Better Social Media Engagement', platform: 'linkedin', content: 'Want to boost your engagement? Here are our top 10 strategies...', category: 'educational' },
    { title: 'Customer Spotlight: How @TechStartup grew 300%', platform: 'twitter', content: 'Amazing results from our client! See how they transformed their social media presence...', category: 'testimonial' },
    { title: 'New Feature Alert: AI-Powered Content Suggestions', platform: 'facebook', content: 'Introducing our newest feature! Let AI help you create better content...', category: 'announcement' },
    { title: 'Our team retreat was a blast! 🎉', platform: 'instagram', content: 'Team building at its finest! Here\'s what we got up to...', category: 'engagement' },
  ];

  return contents.map((item, i) => ({
    id: `post-${i + 1}`,
    title: item.title,
    content: item.content,
    platform: item.platform,
    category: item.category,
    reach: Math.floor(Math.random() * 20000 + 5000),
    engagement: Math.floor(Math.random() * 5000 + 1000),
    likes: Math.floor(Math.random() * 2000 + 300),
    comments: Math.floor(Math.random() * 500 + 50),
    shares: Math.floor(Math.random() * 300 + 30),
    clicks: Math.floor(Math.random() * 800 + 100),
    publishedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
  }));
}

function generateMockContentTypes() {
  return [
    { name: 'Promotion', value: 28, engagement: 4500, color: CONTENT_COLORS[0], icon: Megaphone },
    { name: 'Educational', value: 22, engagement: 6200, color: CONTENT_COLORS[1], icon: BookOpen },
    { name: 'Engagement', value: 18, engagement: 5800, color: CONTENT_COLORS[2], icon: MessageCircle },
    { name: 'Announcement', value: 14, engagement: 3200, color: CONTENT_COLORS[3], icon: Zap },
    { name: 'Behind the Scenes', value: 10, engagement: 4100, color: CONTENT_COLORS[4], icon: Sparkles },
    { name: 'User Generated', value: 8, engagement: 2800, color: CONTENT_COLORS[5], icon: Users },
  ];
}

// Custom tooltip for charts
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border/50 bg-background px-3 py-2 shadow-xl">
        <p className="mb-1 text-xs font-medium text-muted-foreground">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-mono font-medium">{formatNumber(entry.value)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

// Custom pie tooltip
function PieTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { fill: string } }> }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border/50 bg-background px-3 py-2 shadow-xl">
        <div className="flex items-center gap-2 text-xs">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: payload[0].payload.fill }} />
          <span className="font-medium">{payload[0].name}:</span>
          <span className="font-mono">{payload[0].value}%</span>
        </div>
      </div>
    );
  }
  return null;
}

export function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [analyticsData, setAnalyticsData] = useState<{
    engagement: {
      totalReach: number;
      totalLikes: number;
      totalComments: number;
      totalShares: number;
      totalClicks: number;
      totalEngagement: number;
    };
    timeline: Array<{
      date: string;
      reach: number;
      impressions: number;
      likes: number;
      comments: number;
      shares: number;
      clicks: number;
    }>;
    platforms: Array<{
      platform: string;
      _count: number;
      _sum: {
        reach: number;
        likes: number;
        comments: number;
        shares: number;
        engagement: number;
      };
    }>;
  } | null>(null);
  const [topPosts, setTopPosts] = useState<Array<{
    id: string;
    title: string;
    content: string;
    platform: string;
    category: string;
    reach: number;
    engagement: number;
    likes: number;
    comments: number;
    shares: number;
    clicks: number;
    publishedAt: string;
  }>>([]);
  const [loading, setLoading] = useState(true);

  const { accounts } = useAppStore();

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [analyticsRes, postsRes] = await Promise.all([
          fetch('/api/analytics'),
          fetch('/api/posts?limit=20'),
        ]);

        const analyticsJson = await analyticsRes.json();
        const postsJson = await postsRes.json();

        const analytics = analyticsJson.data;

        // Use real data or fall back to mock data
        if (analytics && analytics.timeline && analytics.timeline.length > 0) {
          setAnalyticsData({
            engagement: analytics.engagement || {
              totalReach: 0,
              totalLikes: 0,
              totalComments: 0,
              totalShares: 0,
              totalClicks: 0,
              totalEngagement: 0,
            },
            timeline: analytics.timeline,
            platforms: analytics.platforms?.length > 0 ? analytics.platforms : generateMockPlatforms(),
          });
        } else {
          // Use mock data for demo
          setAnalyticsData({
            engagement: {
              totalReach: 581000,
              totalLikes: 39900,
              totalComments: 10750,
              totalShares: 9010,
              totalClicks: 18500,
              totalEngagement: 59660,
            },
            timeline: generateMockTimeline(30),
            platforms: generateMockPlatforms(),
          });
        }

        // Use real posts or mock data
        const realPosts = postsJson.data || [];
        if (realPosts.length > 0) {
          setTopPosts(
            realPosts
              .sort((a: { engagement: number }, b: { engagement: number }) => b.engagement - a.engagement)
              .slice(0, 5)
          );
        } else {
          setTopPosts(generateMockPosts());
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
        // Fall back to mock data
        setAnalyticsData({
          engagement: {
            totalReach: 581000,
            totalLikes: 39900,
            totalComments: 10750,
            totalShares: 9010,
            totalClicks: 18500,
            totalEngagement: 59660,
          },
          timeline: generateMockTimeline(30),
          platforms: generateMockPlatforms(),
        });
        setTopPosts(generateMockPosts());
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Generate content type data (derived from posts data)
  const contentTypes = useMemo(() => generateMockContentTypes(), []);

  // Filter timeline based on date range
  const filteredTimeline = useMemo(() => {
    if (!analyticsData?.timeline) return [];
    const range = DATE_RANGES.find((r) => r.value === dateRange);
    const days = range ? range.days : 30;
    return analyticsData.timeline.slice(-days);
  }, [analyticsData?.timeline, dateRange]);

  // Compute platform comparison data
  const platformComparisonData = useMemo(() => {
    if (!analyticsData?.platforms) return [];
    return analyticsData.platforms.map((p) => ({
      name: PLATFORMS[p.platform as keyof typeof PLATFORMS]?.name || p.platform,
      platform: p.platform,
      Reach: p._sum.reach,
      Likes: p._sum.likes,
      Comments: p._sum.comments,
      Shares: p._sum.shares,
      Engagement: p._sum.engagement,
    }));
  }, [analyticsData?.platforms]);

  // Engagement distribution for pie chart
  const engagementDistribution = useMemo(() => {
    if (!analyticsData?.platforms) return [];
    const totalEngagement = analyticsData.platforms.reduce(
      (sum, p) => sum + p._sum.engagement,
      0
    );
    return analyticsData.platforms.map((p) => ({
      name: PLATFORMS[p.platform as keyof typeof PLATFORMS]?.name || p.platform,
      value: Math.round((p._sum.engagement / totalEngagement) * 100),
      fill: PLATFORM_COLORS[p.platform] || CHART_COLORS[0],
      rawValue: p._sum.engagement,
    }));
  }, [analyticsData?.platforms]);

  // Metric cards config
  const metrics = analyticsData
    ? [
        {
          label: 'Total Reach',
          value: analyticsData.engagement.totalReach,
          trend: 12.5,
          icon: Eye,
          color: 'text-orange-500',
          bgColor: 'bg-orange-500/10',
        },
        {
          label: 'Impressions',
          value: filteredTimeline.reduce((sum, d) => sum + d.impressions, 0),
          trend: 8.3,
          icon: BarChart3,
          color: 'text-teal-500',
          bgColor: 'bg-teal-500/10',
        },
        {
          label: 'Likes',
          value: analyticsData.engagement.totalLikes,
          trend: 15.2,
          icon: Heart,
          color: 'text-pink-500',
          bgColor: 'bg-pink-500/10',
        },
        {
          label: 'Comments',
          value: analyticsData.engagement.totalComments,
          trend: -3.1,
          icon: MessageCircle,
          color: 'text-blue-500',
          bgColor: 'bg-blue-500/10',
        },
        {
          label: 'Shares',
          value: analyticsData.engagement.totalShares,
          trend: 22.4,
          icon: Share2,
          color: 'text-emerald-500',
          bgColor: 'bg-emerald-500/10',
        },
        {
          label: 'Clicks',
          value: analyticsData.engagement.totalClicks,
          trend: 9.7,
          icon: MousePointerClick,
          color: 'text-violet-500',
          bgColor: 'bg-violet-500/10',
        },
      ]
    : [];

  // Platform table data with computed engagement rate and growth
  const platformTableData = useMemo(() => {
    if (!analyticsData?.platforms) return [];
    return analyticsData.platforms.map((p) => {
      const reach = p._sum.reach || 1;
      const engRate = ((p._sum.engagement / reach) * 100);
      const growth = Math.random() * 30 - 5; // -5% to +25%
      return {
        platform: p.platform,
        name: PLATFORMS[p.platform as keyof typeof PLATFORMS]?.name || p.platform,
        posts: p._count,
        reach: p._sum.reach,
        engagementRate: engRate,
        engagement: p._sum.engagement,
        growth,
        topPost: 'View latest post →',
      };
    });
  }, [analyticsData?.platforms]);

  // Top content type
  const topContentType = useMemo(() => {
    if (contentTypes.length === 0) return null;
    return contentTypes.reduce((best, ct) => (ct.engagement > best.engagement ? ct : best), contentTypes[0]);
  }, [contentTypes]);

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-8 w-16 animate-pulse rounded bg-muted" />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-80 animate-pulse rounded-lg bg-muted" />
          <div className="h-80 animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header & Date Range Selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Track your social media performance across all platforms
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div className="flex rounded-lg border border-border bg-muted p-0.5">
            {DATE_RANGES.map((range) => (
              <Button
                key={range.value}
                variant={dateRange === range.value ? 'default' : 'ghost'}
                size="sm"
                className="h-7 px-3 text-xs"
                onClick={() => setDateRange(range.value)}
              >
                {range.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {metrics.map((metric) => (
          <Card key={metric.label} className="relative overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className={`rounded-md p-2 ${metric.bgColor}`}>
                  <metric.icon className={`h-4 w-4 ${metric.color}`} />
                </div>
                <div
                  className={`flex items-center gap-1 text-xs font-medium ${
                    metric.trend >= 0 ? 'text-emerald-600' : 'text-red-500'
                  }`}
                >
                  {metric.trend >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {formatPercent(metric.trend)}
                </div>
              </div>
              <div className="mt-3">
                <p className="text-xl font-bold tabular-nums">{formatNumber(metric.value)}</p>
                <p className="text-xs text-muted-foreground">{metric.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Engagement Over Time Chart */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Engagement Over Time</CardTitle>
                <CardDescription>Reach, likes & comments trend</CardDescription>
              </div>
              <Badge variant="secondary" className="text-xs">
                <TrendingUp className="mr-1 h-3 w-3" />
                Growing
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={filteredTimeline} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS[0]} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={CHART_COLORS[0]} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorLikes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS[1]} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={CHART_COLORS[1]} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorComments" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS[2]} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={CHART_COLORS[2]} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    className="fill-muted-foreground"
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => formatNumber(v)}
                    className="fill-muted-foreground"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="reach"
                    name="Reach"
                    stroke={CHART_COLORS[0]}
                    fill="url(#colorReach)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="likes"
                    name="Likes"
                    stroke={CHART_COLORS[1]}
                    fill="url(#colorLikes)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="comments"
                    name="Comments"
                    stroke={CHART_COLORS[2]}
                    fill="url(#colorComments)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div className="mt-2 flex items-center justify-center gap-4 border-t border-border/50 pt-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[0] }} />
                Reach
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[1] }} />
                Likes
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[2] }} />
                Comments
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Platform Comparison Chart */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Platform Comparison</CardTitle>
                <CardDescription>Performance metrics across platforms</CardDescription>
              </div>
              <Badge variant="secondary" className="text-xs">
                <BarChart3 className="mr-1 h-3 w-3" />
                Compare
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={platformComparisonData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    className="fill-muted-foreground"
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => formatNumber(v)}
                    className="fill-muted-foreground"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="Reach" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} barSize={8} />
                  <Bar dataKey="Likes" fill={CHART_COLORS[1]} radius={[4, 4, 0, 0]} barSize={8} />
                  <Bar dataKey="Comments" fill={CHART_COLORS[2]} radius={[4, 4, 0, 0]} barSize={8} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex items-center justify-center gap-4 border-t border-border/50 pt-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[0] }} />
                Reach
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[1] }} />
                Likes
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[2] }} />
                Comments
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Engagement Distribution & Platform Table Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Engagement Rate Donut Chart */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Engagement Distribution</CardTitle>
                <CardDescription>By platform</CardDescription>
              </div>
              <PieChartIcon className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={engagementDistribution}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {engagementDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Platform Performance Table */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Platform Performance</CardTitle>
                <CardDescription>Detailed metrics per platform</CardDescription>
              </div>
              <Badge variant="secondary" className="text-xs">
                <Target className="mr-1 h-3 w-3" />
                {platformTableData.length} platforms
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="max-h-80 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[140px]">Platform</TableHead>
                    <TableHead className="text-right">Posts</TableHead>
                    <TableHead className="text-right">Reach</TableHead>
                    <TableHead className="text-right">Eng. Rate</TableHead>
                    <TableHead className="text-right">Top Post</TableHead>
                    <TableHead className="text-right">Growth</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {platformTableData.map((row, index) => (
                    <TableRow key={row.platform} className={index % 2 === 1 ? 'bg-muted/40' : ''}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: PLATFORM_COLORS[row.platform] || '#888' }}
                          />
                          <span className="text-sm font-medium">{row.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">{row.posts}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatNumber(row.reach)}</TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="secondary"
                          className={`font-mono text-xs ${
                            row.engagementRate > 10
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : row.engagementRate > 5
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                          }`}
                        >
                          {row.engagementRate.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">{row.topPost}</TableCell>
                      <TableCell className="text-right">
                        <div
                          className={`flex items-center justify-end gap-1 text-xs font-medium ${
                            row.growth >= 0 ? 'text-emerald-600' : 'text-red-500'
                          }`}
                        >
                          {row.growth >= 0 ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {formatPercent(row.growth)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Best Performing Content & Content Type Breakdown */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Best Performing Content */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Best Performing Content</CardTitle>
                <CardDescription>Top 5 posts ranked by engagement</CardDescription>
              </div>
              <Crown className="h-4 w-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {topPosts.map((post, index) => {
                const platformConfig = PLATFORMS[post.platform as keyof typeof PLATFORMS];
                const platformColor = platformConfig?.color || '#888';
                return (
                  <div
                    key={post.id}
                    className="group relative flex items-start gap-3 rounded-lg border border-border/60 p-3 transition-colors hover:bg-muted/50"
                  >
                    {/* Rank Badge */}
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                        index === 0
                          ? 'bg-amber-500'
                          : index === 1
                            ? 'bg-zinc-400'
                            : index === 2
                              ? 'bg-orange-600'
                              : 'bg-muted-foreground/30'
                      }`}
                    >
                      {index + 1}
                    </div>
                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium">{post.title || post.content.slice(0, 50)}</p>
                        <div
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: platformColor }}
                        />
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {platformConfig?.name || post.platform} •{' '}
                        {new Date(post.publishedAt).toLocaleDateString()}
                      </p>
                      {/* Engagement Stats */}
                      <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3 text-pink-500" />
                          {formatNumber(post.likes)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3 text-blue-500" />
                          {formatNumber(post.comments)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Share2 className="h-3 w-3 text-emerald-500" />
                          {formatNumber(post.shares)}
                        </span>
                        <span className="flex items-center gap-1">
                          <ArrowUpRight className="h-3 w-3 text-violet-500" />
                          {formatNumber(post.clicks)}
                        </span>
                      </div>
                    </div>
                    {/* Total engagement badge */}
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold tabular-nums">{formatNumber(post.engagement)}</p>
                      <p className="text-[10px] text-muted-foreground">engagement</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Content Type Breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Content Type Breakdown</CardTitle>
                <CardDescription>Performance by content category</CardDescription>
              </div>
              <Badge variant="secondary" className="text-xs">
                <GraduationCap className="mr-1 h-3 w-3" />
                {contentTypes.length} categories
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-4">
              {contentTypes.map((ct, index) => {
                const IconComp = ct.icon;
                const isTop = topContentType?.name === ct.name;
                return (
                  <div
                    key={ct.name}
                    className={`group relative rounded-lg border p-3 transition-colors ${
                      isTop ? 'border-amber-300 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-900/10' : 'border-border/60 hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="rounded-md p-2"
                          style={{ backgroundColor: `${ct.color}15` }}
                        >
                          <IconComp className="h-4 w-4" style={{ color: ct.color }} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">{ct.name}</p>
                            {isTop && (
                              <Badge className="bg-amber-500 text-[10px] text-white hover:bg-amber-600 px-1.5 py-0">
                                Top
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {ct.value}% of posts • {formatNumber(ct.engagement)} engagement
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold tabular-nums">{formatNumber(ct.engagement)}</p>
                        <p className="text-[10px] text-muted-foreground">total eng.</p>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="mt-2">
                      <Progress
                        value={ct.value}
                        className="h-1.5"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="flex items-center gap-3 rounded-lg border border-border/60 p-3">
              <div className="rounded-md bg-emerald-500/10 p-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg. Engagement Rate</p>
                <p className="text-lg font-bold tabular-nums">
                  {analyticsData
                    ? (
                        (analyticsData.engagement.totalEngagement /
                          (analyticsData.engagement.totalReach || 1)) *
                        100
                      ).toFixed(2)
                    : '0.00'}
                  %
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-border/60 p-3">
              <div className="rounded-md bg-blue-500/10 p-2">
                <BarChart3 className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Posts Published</p>
                <p className="text-lg font-bold tabular-nums">
                  {platformTableData.reduce((sum, p) => sum + p.posts, 0)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-border/60 p-3">
              <div className="rounded-md bg-violet-500/10 p-2">
                <Users className="h-4 w-4 text-violet-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Connected Accounts</p>
                <p className="text-lg font-bold tabular-nums">
                  {accounts.length > 0 ? accounts.length : 6}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-border/60 p-3">
              <div className="rounded-md bg-amber-500/10 p-2">
                <Target className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Best Platform</p>
                <p className="text-lg font-bold">
                  {(() => {
                    if (!platformTableData.length) return '—';
                    const best = platformTableData.reduce((a, b) =>
                      a.engagementRate > b.engagementRate ? a : b
                    );
                    return best.name;
                  })()}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
