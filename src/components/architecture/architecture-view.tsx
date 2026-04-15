'use client';

import { useState } from 'react';
import { useAppStore } from '@/stores/app-store';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';
import {
  Layers,
  Database,
  Server,
  Code,
  Globe,
  Shield,
  Cpu,
  Calendar,
  Users,
  Zap,
  ArrowRight,
  Check,
  Lock,
  Key,
  RefreshCw,
  Eye,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Box,
  Layout,
  Workflow,
  GitBranch,
  Rocket,
  DollarSign,
  Crown,
  Gift,
} from 'lucide-react';

// ─── Color constants ────────────────────────────────────────
const LAYER_COLORS = {
  frontend: {
    border: 'border-violet-400 dark:border-violet-500',
    bg: 'bg-violet-50 dark:bg-violet-950/40',
    text: 'text-violet-700 dark:text-violet-300',
    badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300',
    glow: 'shadow-violet-200 dark:shadow-violet-900/30',
  },
  backend: {
    border: 'border-emerald-400 dark:border-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-300',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
    glow: 'shadow-emerald-200 dark:shadow-emerald-900/30',
  },
  data: {
    border: 'border-amber-400 dark:border-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-300',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
    glow: 'shadow-amber-200 dark:shadow-amber-900/30',
  },
  platform: {
    border: 'border-sky-400 dark:border-sky-500',
    bg: 'bg-sky-50 dark:bg-sky-950/40',
    text: 'text-sky-700 dark:text-sky-300',
    badge: 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300',
    glow: 'shadow-sky-200 dark:shadow-sky-900/30',
  },
};

const TYPE_COLORS: Record<string, string> = {
  String: 'text-sky-600 dark:text-sky-400',
  Int: 'text-emerald-600 dark:text-emerald-400',
  Boolean: 'text-amber-600 dark:text-amber-400',
  DateTime: 'text-purple-600 dark:text-purple-400',
  JSON: 'text-orange-600 dark:text-orange-400',
  Float: 'text-rose-600 dark:text-rose-400',
};

// ─── Architecture Diagram Node ──────────────────────────────
function ArchNode({
  icon,
  label,
  desc,
  layer,
  technologies,
}: {
  icon: React.ReactNode;
  label: string;
  desc: string;
  layer: 'frontend' | 'backend' | 'data' | 'platform';
  technologies?: string[];
}) {
  const c = LAYER_COLORS[layer];
  const [hovered, setHovered] = useState(false);

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card
            className={`border-2 ${c.border} ${c.bg} transition-all duration-300 cursor-default ${
              hovered
                ? `shadow-lg ${c.glow} -translate-y-0.5 scale-[1.02]`
                : 'shadow-sm'
            }`}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className={`${c.text}`}>{icon}</div>
                <span className={`font-semibold text-sm ${c.text}`}>{label}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-tight">{desc}</p>
              {technologies && technologies.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {technologies.map((t) => (
                    <span
                      key={t}
                      className={`text-[10px] px-1.5 py-0.5 rounded ${c.badge} font-medium`}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="font-medium">{label}</p>
          <p className="text-xs opacity-80">{desc}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ─── Connection Arrow ───────────────────────────────────────
function ConnectionArrow({ className }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className || ''}`}>
      <div className="relative w-12 h-8 flex items-center justify-center">
        <div className="absolute w-10 h-[2px] bg-gradient-to-r from-violet-300 to-emerald-300 dark:from-violet-600 dark:to-emerald-600" />
        <ArrowRight className="absolute right-0 size-3 text-emerald-500 dark:text-emerald-400" />
      </div>
    </div>
  );
}

function ConnectionArrowVertical({ className }: { className?: string }) {
  return (
    <div className={`flex justify-center ${className || ''}`}>
      <div className="relative h-8 flex flex-col items-center justify-center">
        <div className="absolute h-6 w-[2px] bg-gradient-to-b from-emerald-300 to-sky-300 dark:from-emerald-600 dark:to-sky-600" />
        <ArrowRight className="absolute bottom-0 size-3 text-sky-500 dark:text-sky-400 rotate-90" />
      </div>
    </div>
  );
}

// ─── Animated Dots Connector ────────────────────────────────
function AnimatedConnector({ direction = 'horizontal', length = 60 }: { direction?: 'horizontal' | 'vertical'; length?: number }) {
  return (
    <div className="flex items-center justify-center overflow-hidden" style={{ width: direction === 'horizontal' ? length : 16, height: direction === 'vertical' ? length : 16 }}>
      <div
        className="relative"
        style={{
          width: direction === 'horizontal' ? length : 2,
          height: direction === 'vertical' ? length : 2,
        }}
      >
        <div className={`absolute inset-0 bg-gradient-to-r ${direction === 'horizontal' ? 'from-violet-300 via-emerald-400 to-sky-300' : 'from-emerald-300 via-sky-400 to-amber-300'} dark:from-violet-600 dark:via-emerald-500 dark:to-sky-500 opacity-60`} />
        <div
          className="absolute bg-emerald-500 dark:bg-emerald-400 rounded-full animate-pulse"
          style={{
            width: 6,
            height: 6,
            top: direction === 'vertical' ? 0 : -2,
            left: direction === 'horizontal' ? 0 : -2,
            animation: direction === 'horizontal' ? 'flowRight 2s linear infinite' : 'flowDown 2s linear infinite',
          }}
        />
        <style>{`
          @keyframes flowRight {
            0% { left: -2px; }
            100% { left: ${length - 4}px; }
          }
          @keyframes flowDown {
            0% { top: -2px; }
            100% { top: ${length - 4}px; }
          }
        `}</style>
      </div>
    </div>
  );
}

// ─── Tab 1: System Architecture ─────────────────────────────
function SystemArchitectureTab() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Layers className="size-6 text-violet-500" />
          System Architecture
        </h2>
        <p className="text-muted-foreground mt-1">
          Interactive overview of the SocialPilot AI platform architecture and technology stack
        </p>
      </div>

      <Separator />

      {/* Architecture Diagram */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Workflow className="size-5 text-emerald-500" />
          Architecture Diagram
        </h3>
        <div className="border-2 border-dashed border-muted rounded-xl p-6 bg-muted/20 overflow-x-auto">
          <div className="min-w-[700px] flex flex-col gap-2 items-center">
            {/* Layer Labels Row */}
            <div className="w-full grid grid-cols-[200px_60px_240px_60px_200px] items-center mb-2">
              <div className="text-center">
                <Badge variant="outline" className={`${LAYER_COLORS.frontend.text} border-current`}>
                  Client Layer
                </Badge>
              </div>
              <div />
              <div className="text-center">
                <Badge variant="outline" className={`${LAYER_COLORS.backend.text} border-current`}>
                  Backend Layer
                </Badge>
              </div>
              <div />
              <div className="text-center">
                <Badge variant="outline" className={`${LAYER_COLORS.data.text} border-current`}>
                  Data Layer
                </Badge>
              </div>
            </div>

            {/* Main Row */}
            <div className="w-full grid grid-cols-[200px_60px_240px_60px_200px] items-start">
              {/* Client */}
              <div className="space-y-3">
                <ArchNode
                  icon={<Code className="size-4" />}
                  label="React 19 + Next.js 16"
                  desc="App Router, SSR, RSC"
                  layer="frontend"
                  technologies={['TypeScript', 'App Router']}
                />
                <ArchNode
                  icon={<Layout className="size-4" />}
                  label="Tailwind CSS 4 + shadcn/ui"
                  desc="Styling & Component Library"
                  layer="frontend"
                  technologies={['Dark Mode', 'Responsive']}
                />
                <ArchNode
                  icon={<Box className="size-4" />}
                  label="Zustand + Recharts"
                  desc="State & Data Visualization"
                  layer="frontend"
                  technologies={['TanStack Query']}
                />
              </div>

              {/* Arrow 1 */}
              <div className="flex items-center justify-center h-full pt-6">
                <AnimatedConnector direction="horizontal" length={60} />
              </div>

              {/* Backend */}
              <div className="space-y-3">
                <ArchNode
                  icon={<Server className="size-4" />}
                  label="Next.js API Routes"
                  desc="REST API (port 3000)"
                  layer="backend"
                  technologies={['8 Routes', 'JSON API']}
                />
                <ArchNode
                  icon={<Zap className="size-4" />}
                  label="Posting Service"
                  desc="Hono Microservice (port 3010)"
                  layer="backend"
                  technologies={['Queue', 'Workers']}
                />
                <ArchNode
                  icon={<Cpu className="size-4" />}
                  label="AI Engine"
                  desc="z-ai-web-dev-sdk"
                  layer="backend"
                  technologies={['NLP', 'Generation']}
                />
              </div>

              {/* Arrow 2 */}
              <div className="flex items-center justify-center h-full pt-6">
                <AnimatedConnector direction="horizontal" length={60} />
              </div>

              {/* Data */}
              <div className="space-y-3">
                <ArchNode
                  icon={<Database className="size-4" />}
                  label="PostgreSQL (Production)"
                  desc="Primary Database"
                  layer="data"
                  technologies={['Prisma ORM', 'Migrations']}
                />
                <ArchNode
                  icon={<Database className="size-4" />}
                  label="SQLite (Development)"
                  desc="Local Dev Database"
                  layer="data"
                  technologies={['Prisma', 'Seeding']}
                />
                <ArchNode
                  icon={<Database className="size-4" />}
                  label="Redis Cache"
                  desc="Session & Rate Limiting"
                  layer="data"
                  technologies={['Tokens', 'Queues']}
                />
              </div>
            </div>

            {/* Platform APIs Connector */}
            <div className="mt-4 flex justify-center">
              <div className="flex flex-col items-center gap-1">
                <AnimatedConnector direction="vertical" length={36} />
                <ArchNode
                  icon={<Globe className="size-4" />}
                  label="Platform APIs"
                  desc="External social media APIs"
                  layer="platform"
                  technologies={['FB', 'IG', 'TW', 'LI', 'TT', 'YT']}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Tech Stack Grid */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <GitBranch className="size-5 text-amber-500" />
          Technology Stack
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Frontend */}
          <Card className="border-l-4 border-l-violet-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Code className="size-4 text-violet-500" />
                Frontend Stack
              </CardTitle>
              <CardDescription>Client-side technologies</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: 'React 19', desc: 'UI Library' },
                  { name: 'Next.js 16', desc: 'App Router, RSC' },
                  { name: 'TypeScript 5', desc: 'Type Safety' },
                  { name: 'Tailwind CSS 4', desc: 'Utility CSS' },
                  { name: 'shadcn/ui', desc: 'Components' },
                  { name: 'Zustand', desc: 'State Mgmt' },
                  { name: 'Recharts', desc: 'Charts' },
                  { name: 'Framer Motion', desc: 'Animations' },
                ].map((t) => (
                  <div
                    key={t.name}
                    className="flex items-center gap-2 p-2 rounded-md bg-muted/50"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                    <div>
                      <span className="text-sm font-medium">{t.name}</span>
                      <span className="text-xs text-muted-foreground ml-1">
                        {t.desc}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Backend */}
          <Card className="border-l-4 border-l-emerald-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Server className="size-4 text-emerald-500" />
                Backend Stack
              </CardTitle>
              <CardDescription>Server-side technologies</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: 'Next.js API', desc: 'REST Routes' },
                  { name: 'Hono', desc: 'Microservice' },
                  { name: 'Prisma ORM', desc: 'Database ORM' },
                  { name: 'z-ai-web-dev-sdk', desc: 'AI Engine' },
                  { name: 'NextAuth.js v4', desc: 'Authentication' },
                  { name: 'Bun', desc: 'Runtime' },
                  { name: 'Queue System', desc: 'Job Processing' },
                  { name: 'Socket.io', desc: 'Real-time' },
                ].map((t) => (
                  <div
                    key={t.name}
                    className="flex items-center gap-2 p-2 rounded-md bg-muted/50"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <div>
                      <span className="text-sm font-medium">{t.name}</span>
                      <span className="text-xs text-muted-foreground ml-1">
                        {t.desc}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Data */}
          <Card className="border-l-4 border-l-amber-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Database className="size-4 text-amber-500" />
                Data Layer
              </CardTitle>
              <CardDescription>Storage & caching</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: 'PostgreSQL', desc: 'Production DB' },
                  { name: 'SQLite', desc: 'Development DB' },
                  { name: 'Prisma Client', desc: 'Query Builder' },
                  { name: 'Redis', desc: 'Cache Layer' },
                  { name: 'Prisma Migrate', desc: 'Schema Mgmt' },
                  { name: 'Seed Scripts', desc: 'Demo Data' },
                ].map((t) => (
                  <div
                    key={t.name}
                    className="flex items-center gap-2 p-2 rounded-md bg-muted/50"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <div>
                      <span className="text-sm font-medium">{t.name}</span>
                      <span className="text-xs text-muted-foreground ml-1">
                        {t.desc}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* AI */}
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Cpu className="size-4 text-purple-500" />
                AI Layer
              </CardTitle>
              <CardDescription>Intelligent features</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: 'Content Gen', desc: 'AI Writing' },
                  { name: 'Platform Rewrite', desc: 'Adapt Content' },
                  { name: 'Hashtag Scoring', desc: 'Optimize Tags' },
                  { name: 'Auto-Reply', desc: 'Comment AI' },
                  { name: 'Sentiment Analysis', desc: 'NLP' },
                  { name: 'Trend Detection', desc: 'Discovery' },
                  { name: 'Best Time AI', desc: 'Scheduling' },
                  { name: 'Content Analysis', desc: 'Performance' },
                ].map((t) => (
                  <div
                    key={t.name}
                    className="flex items-center gap-2 p-2 rounded-md bg-muted/50"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                    <div>
                      <span className="text-sm font-medium">{t.name}</span>
                      <span className="text-xs text-muted-foreground ml-1">
                        {t.desc}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── Tab 2: UI Wireframes ───────────────────────────────────
function WireframeBox({
  label,
  children,
  className = '',
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`border-2 border-dashed border-muted-foreground/30 rounded-lg p-3 ${className}`}>
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function WireframeBar({ width = 'w-full' }: { width?: string }) {
  return <div className={`${width} h-3 bg-muted-foreground/10 rounded-sm`} />;
}

function WireframeCard() {
  return (
    <div className="border border-muted-foreground/20 rounded-md p-3 space-y-2">
      <div className="h-3 w-2/3 bg-muted-foreground/10 rounded-sm" />
      <div className="h-6 w-4/5 bg-muted-foreground/5 rounded-sm" />
      <div className="h-3 w-1/3 bg-muted-foreground/10 rounded-sm" />
    </div>
  );
}

function WireframeButton({ label }: { label: string }) {
  return (
    <div className="px-3 py-1.5 bg-muted-foreground/10 rounded text-[10px] text-muted-foreground inline-block">
      {label}
    </div>
  );
}

function UIWireframesTab() {
  const setActiveView = useAppStore((s) => s.setActiveView);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Layout className="size-6 text-sky-500" />
          UI Wireframes
        </h2>
        <p className="text-muted-foreground mt-1">
          Interactive wireframe mockups showing the layout structure of each view
        </p>
      </div>

      <Separator />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Dashboard Wireframe */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Dashboard Overview</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveView('dashboard')}
              >
                <ExternalLink className="size-3 mr-1" />
                View in App
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-4 space-y-3 bg-muted/20">
              <WireframeBox label="Stats Cards Row">
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="border border-muted-foreground/15 rounded p-2 space-y-1.5">
                      <div className="h-2 w-8 bg-muted-foreground/15 rounded" />
                      <div className="h-4 w-12 bg-muted-foreground/10 rounded" />
                      <div className="h-2 w-6 bg-muted-foreground/8 rounded" />
                    </div>
                  ))}
                </div>
              </WireframeBox>
              <WireframeBox label="Engagement Chart">
                <div className="h-28 bg-muted-foreground/5 rounded flex items-end justify-around px-2">
                  {[40, 65, 45, 80, 55, 70, 90, 60, 75, 50, 85, 65].map((h, i) => (
                    <div
                      key={i}
                      className="w-full max-w-[20px] bg-muted-foreground/10 rounded-t"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </WireframeBox>
              <WireframeBox label="Activity Feed + Top Posts">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-muted-foreground/10 shrink-0" />
                        <WireframeBar width="w-3/4" />
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1.5">
                    {[1, 2, 3].map((i) => (
                      <WireframeCard key={i} />
                    ))}
                  </div>
                </div>
              </WireframeBox>
            </div>
          </CardContent>
        </Card>

        {/* Composer Wireframe */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Content Composer</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveView('compose')}
              >
                <ExternalLink className="size-3 mr-1" />
                View in App
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-4 space-y-3 bg-muted/20">
              <WireframeBox label="Platform Selector">
                <div className="flex gap-2">
                  {['FB', 'IG', 'TW', 'LI', 'TT', 'YT'].map((p) => (
                    <div key={p} className="w-10 h-10 rounded-lg border border-muted-foreground/15 flex items-center justify-center text-[9px] text-muted-foreground">
                      {p}
                    </div>
                  ))}
                </div>
              </WireframeBox>
              <WireframeBox label="Two-Column Layout">
                <div className="grid grid-cols-5 gap-3">
                  <div className="col-span-3 space-y-2">
                    <div className="text-[10px] text-muted-foreground">Editor (60%)</div>
                    <div className="h-20 bg-muted-foreground/5 rounded border border-muted-foreground/10" />
                    <div className="flex gap-2">
                      <WireframeButton label="AI Generate" />
                      <WireframeButton label="AI Rewrite" />
                      <WireframeButton label="Schedule" />
                    </div>
                  </div>
                  <div className="col-span-2 space-y-2">
                    <div className="text-[10px] text-muted-foreground">AI Tools (40%)</div>
                    <div className="space-y-1.5">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-8 bg-muted-foreground/5 rounded border border-muted-foreground/10" />
                      ))}
                    </div>
                    <div className="h-16 bg-muted-foreground/5 rounded border border-muted-foreground/10" />
                  </div>
                </div>
              </WireframeBox>
            </div>
          </CardContent>
        </Card>

        {/* Scheduler Wireframe */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Smart Scheduler</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveView('scheduler')}
              >
                <ExternalLink className="size-3 mr-1" />
                View in App
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-4 space-y-3 bg-muted/20">
              <WireframeBox label="Calendar + Sidebar Layout">
                <div className="grid grid-cols-4 gap-3">
                  <div className="col-span-3 space-y-2">
                    <div className="text-[10px] text-muted-foreground">Calendar Grid (75%)</div>
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: 35 }, (_, i) => (
                        <div
                          key={i}
                          className="aspect-square border border-muted-foreground/10 rounded text-[8px] text-muted-foreground flex items-center justify-center"
                        >
                          {i > 0 && i < 32 ? i : ''}
                        </div>
                      ))}
                    </div>
                    <WireframeBox label="Upcoming Posts Timeline">
                      <div className="flex gap-2">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex-1 h-6 bg-muted-foreground/5 rounded border border-muted-foreground/10" />
                        ))}
                      </div>
                    </WireframeBox>
                  </div>
                  <div className="space-y-2">
                    <div className="text-[10px] text-muted-foreground">Sidebar (25%)</div>
                    <div className="space-y-1.5">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-10 bg-muted-foreground/5 rounded border border-muted-foreground/10" />
                      ))}
                    </div>
                  </div>
                </div>
              </WireframeBox>
            </div>
          </CardContent>
        </Card>

        {/* Analytics Wireframe */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Analytics Dashboard</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveView('analytics')}
              >
                <ExternalLink className="size-3 mr-1" />
                View in App
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-4 space-y-3 bg-muted/20">
              <WireframeBox label="Date Range Selector">
                <div className="flex gap-2">
                  {['7d', '14d', '30d', '90d'].map((d) => (
                    <div key={d} className="px-3 py-1 bg-muted-foreground/5 rounded text-[10px] text-muted-foreground border border-muted-foreground/10">
                      {d}
                    </div>
                  ))}
                </div>
              </WireframeBox>
              <WireframeBox label="Metric Cards Row">
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="border border-muted-foreground/15 rounded p-2 space-y-1">
                      <div className="h-2 w-10 bg-muted-foreground/10 rounded" />
                      <div className="h-4 w-8 bg-muted-foreground/15 rounded" />
                    </div>
                  ))}
                </div>
              </WireframeBox>
              <WireframeBox label="Charts Row">
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-24 bg-muted-foreground/5 rounded border border-muted-foreground/10" />
                  <div className="h-24 bg-muted-foreground/5 rounded border border-muted-foreground/10" />
                </div>
              </WireframeBox>
              <WireframeBox label="Performance Table">
                <div className="space-y-1">
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-3 bg-muted-foreground/10 rounded" />
                    ))}
                  </div>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="grid grid-cols-4 gap-2">
                      {[1, 2, 3, 4].map((j) => (
                        <div key={j} className="h-3 bg-muted-foreground/5 rounded" />
                      ))}
                    </div>
                  ))}
                </div>
              </WireframeBox>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Tab 3: Database Schema ─────────────────────────────────
interface SchemaField {
  name: string;
  type: string;
  isPk?: boolean;
  isFk?: boolean;
  isOptional?: boolean;
}

interface SchemaModel {
  name: string;
  group: string;
  color: string;
  fields: SchemaField[];
}

const DB_MODELS: SchemaModel[] = [
  {
    name: 'User',
    group: 'Core',
    color: 'bg-violet-500',
    fields: [
      { name: 'id', type: 'String', isPk: true },
      { name: 'email', type: 'String' },
      { name: 'name', type: 'String' },
      { name: 'avatar', type: 'String', isOptional: true },
      { name: 'role', type: 'String' },
      { name: 'createdAt', type: 'DateTime' },
      { name: 'updatedAt', type: 'DateTime' },
    ],
  },
  {
    name: 'Team',
    group: 'Core',
    color: 'bg-violet-500',
    fields: [
      { name: 'id', type: 'String', isPk: true },
      { name: 'name', type: 'String' },
      { name: 'description', type: 'String', isOptional: true },
      { name: 'createdAt', type: 'DateTime' },
      { name: 'updatedAt', type: 'DateTime' },
    ],
  },
  {
    name: 'TeamMember',
    group: 'Core',
    color: 'bg-violet-500',
    fields: [
      { name: 'id', type: 'String', isPk: true },
      { name: 'role', type: 'String' },
      { name: 'userId', type: 'String', isFk: true },
      { name: 'teamId', type: 'String', isFk: true },
      { name: 'joinedAt', type: 'DateTime' },
    ],
  },
  {
    name: 'Post',
    group: 'Content',
    color: 'bg-emerald-500',
    fields: [
      { name: 'id', type: 'String', isPk: true },
      { name: 'title', type: 'String', isOptional: true },
      { name: 'content', type: 'String' },
      { name: 'platform', type: 'String' },
      { name: 'mediaUrls', type: 'JSON', isOptional: true },
      { name: 'hashtags', type: 'JSON', isOptional: true },
      { name: 'scheduledAt', type: 'DateTime', isOptional: true },
      { name: 'publishedAt', type: 'DateTime', isOptional: true },
      { name: 'status', type: 'String' },
      { name: 'aiGenerated', type: 'Boolean' },
      { name: 'reach', type: 'Int' },
      { name: 'engagement', type: 'Int' },
      { name: 'likes', type: 'Int' },
      { name: 'comments', type: 'Int' },
      { name: 'shares', type: 'Int' },
      { name: 'clicks', type: 'Int' },
      { name: 'userId', type: 'String', isFk: true },
      { name: 'accountId', type: 'String', isFk: true, isOptional: true },
      { name: 'createdAt', type: 'DateTime' },
      { name: 'updatedAt', type: 'DateTime' },
    ],
  },
  {
    name: 'PostAnalytics',
    group: 'Content',
    color: 'bg-emerald-500',
    fields: [
      { name: 'id', type: 'String', isPk: true },
      { name: 'date', type: 'DateTime' },
      { name: 'reach', type: 'Int' },
      { name: 'impressions', type: 'Int' },
      { name: 'likes', type: 'Int' },
      { name: 'comments', type: 'Int' },
      { name: 'shares', type: 'Int' },
      { name: 'clicks', type: 'Int' },
      { name: 'saves', type: 'Int' },
      { name: 'postId', type: 'String', isFk: true },
      { name: 'createdAt', type: 'DateTime' },
    ],
  },
  {
    name: 'Comment',
    group: 'Content',
    color: 'bg-emerald-500',
    fields: [
      { name: 'id', type: 'String', isPk: true },
      { name: 'platform', type: 'String' },
      { name: 'platformId', type: 'String' },
      { name: 'content', type: 'String' },
      { name: 'authorName', type: 'String' },
      { name: 'authorAvatar', type: 'String', isOptional: true },
      { name: 'postId', type: 'String', isFk: true },
      { name: 'isReplied', type: 'Boolean' },
      { name: 'aiReply', type: 'String', isOptional: true },
      { name: 'createdAt', type: 'DateTime' },
    ],
  },
  {
    name: 'SocialAccount',
    group: 'Config',
    color: 'bg-amber-500',
    fields: [
      { name: 'id', type: 'String', isPk: true },
      { name: 'platform', type: 'String' },
      { name: 'platformUserId', type: 'String' },
      { name: 'username', type: 'String' },
      { name: 'displayName', type: 'String' },
      { name: 'accessToken', type: 'String', isOptional: true },
      { name: 'refreshToken', type: 'String', isOptional: true },
      { name: 'tokenExpiresAt', type: 'DateTime', isOptional: true },
      { name: 'followersCount', type: 'Int' },
      { name: 'isActive', type: 'Boolean' },
      { name: 'userId', type: 'String', isFk: true },
      { name: 'connectedAt', type: 'DateTime' },
      { name: 'lastSyncedAt', type: 'DateTime', isOptional: true },
    ],
  },
  {
    name: 'ContentTemplate',
    group: 'Config',
    color: 'bg-amber-500',
    fields: [
      { name: 'id', type: 'String', isPk: true },
      { name: 'name', type: 'String' },
      { name: 'category', type: 'String' },
      { name: 'platform', type: 'String', isOptional: true },
      { name: 'content', type: 'String' },
      { name: 'variables', type: 'JSON', isOptional: true },
      { name: 'createdAt', type: 'DateTime' },
      { name: 'updatedAt', type: 'DateTime' },
    ],
  },
  {
    name: 'HashtagGroup',
    group: 'Config',
    color: 'bg-amber-500',
    fields: [
      { name: 'id', type: 'String', isPk: true },
      { name: 'name', type: 'String' },
      { name: 'tags', type: 'JSON' },
      { name: 'platform', type: 'String', isOptional: true },
      { name: 'createdAt', type: 'DateTime' },
    ],
  },
];

const SQL_PREVIEW = `CREATE TABLE "Post" (
  "id"             TEXT    NOT NULL PRIMARY KEY,
  "title"          TEXT,
  "content"        TEXT    NOT NULL,
  "platform"       TEXT    NOT NULL,
  "mediaUrls"      TEXT,                    -- JSON array
  "hashtags"       TEXT,                    -- JSON array
  "scheduledAt"    DATETIME,
  "publishedAt"    DATETIME,
  "status"         TEXT    NOT NULL DEFAULT 'draft',
  "aiGenerated"    BOOLEAN NOT NULL DEFAULT 0,
  "platformPostId" TEXT,
  "reach"          INTEGER NOT NULL DEFAULT 0,
  "engagement"     INTEGER NOT NULL DEFAULT 0,
  "likes"          INTEGER NOT NULL DEFAULT 0,
  "comments"       INTEGER NOT NULL DEFAULT 0,
  "shares"         INTEGER NOT NULL DEFAULT 0,
  "clicks"         INTEGER NOT NULL DEFAULT 0,
  "approvedBy"     TEXT,
  "approvedAt"     DATETIME,
  "createdAt"      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      DATETIME NOT NULL,
  "userId"         TEXT    NOT NULL,
  "accountId"      TEXT,
  FOREIGN KEY ("userId")    REFERENCES "User" ("id"),
  FOREIGN KEY ("accountId") REFERENCES "SocialAccount" ("id")
);`;

function DatabaseSchemaTab() {
  const [sqlOpen, setSqlOpen] = useState(false);
  const groups = ['Core', 'Content', 'Config'];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Database className="size-6 text-amber-500" />
          Database Schema
        </h2>
        <p className="text-muted-foreground mt-1">
          Visual ERD of the SocialPilot AI data model with {DB_MODELS.length} tables
        </p>
      </div>

      <Separator />

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-1.5">
          <Key className="size-3 text-amber-500" />
          <span>Primary Key</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg className="size-3 text-sky-500" viewBox="0 0 12 12" fill="currentColor">
            <path d="M6 0a4 4 0 0 0-4 4v1H1a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-1V4a4 4 0 0 0-4-4zm0 1.5A2.5 2.5 0 0 1 8.5 4v1h-5V4A2.5 2.5 0 0 1 6 1.5z" />
          </svg>
          <span>Foreign Key</span>
        </div>
        <Separator orientation="vertical" className="h-3" />
        <span className="text-muted-foreground">Types:</span>
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <span key={type} className={`font-mono ${color}`}>{type}</span>
        ))}
      </div>

      {/* Model Cards by Group */}
      {groups.map((group) => {
        const models = DB_MODELS.filter((m) => m.group === group);
        return (
          <div key={group}>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Badge variant="secondary">{group}</Badge>
              <span className="text-sm text-muted-foreground">
                {models.map((m) => m.name).join(' — ')}
              </span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {models.map((model) => (
                <Card key={model.name} className="overflow-hidden">
                  <CardHeader className="p-3 pb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${model.color}`} />
                      <CardTitle className="text-sm font-mono">{model.name}</CardTitle>
                      <Badge variant="outline" className="text-[10px] ml-auto">
                        {model.fields.length} fields
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <ScrollArea className="max-h-64">
                      <div className="space-y-0.5">
                        {model.fields.map((field) => (
                          <div
                            key={field.name}
                            className="flex items-center gap-1.5 text-xs py-1 px-1 rounded hover:bg-muted/50 transition-colors"
                          >
                            <span className="w-3 text-center shrink-0">
                              {field.isPk ? (
                                <Key className="size-3 text-amber-500" />
                              ) : field.isFk ? (
                                <svg className="size-3 text-sky-500" viewBox="0 0 12 12" fill="currentColor">
                                  <path d="M6 0a4 4 0 0 0-4 4v1H1a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-1V4a4 4 0 0 0-4-4zm0 1.5A2.5 2.5 0 0 1 8.5 4v1h-5V4A2.5 2.5 0 0 1 6 1.5z" />
                                </svg>
                              ) : null}
                            </span>
                            <span className="font-mono font-medium text-foreground min-w-[90px]">
                              {field.name}
                            </span>
                            <span className={`font-mono ${TYPE_COLORS[field.type] || 'text-muted-foreground'}`}>
                              {field.type}
                            </span>
                            {field.isOptional && (
                              <span className="text-muted-foreground text-[10px]">optional</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}

      <Separator />

      {/* SQL Preview */}
      <Collapsible open={sqlOpen} onOpenChange={setSqlOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Code className="size-4" />
                  SQL Preview — Posts Table
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">SQLite Dialect</Badge>
                  <ChevronDown
                    className={`size-4 text-muted-foreground transition-transform ${
                      sqlOpen ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <pre className="bg-zinc-900 dark:bg-zinc-950 text-zinc-100 rounded-lg p-4 overflow-x-auto text-sm font-mono leading-relaxed">
                <code>
                  {SQL_PREVIEW.split('\n').map((line, i) => {
                    // Syntax-like coloring
                    const isComment = line.trim().startsWith('--');
                    const isKeyword = /^(CREATE|TABLE|PRIMARY|FOREIGN|KEY|REFERENCES|DEFAULT|NOT|NULL|INTEGER|TEXT|BOOLEAN|DATETIME|AUTOINCREMENT)/.test(line.trim());
                    return (
                      <div key={i} className={isComment ? 'text-zinc-500 italic' : ''}>
                        {isKeyword ? (
                          line.split(/(\b(?:CREATE|TABLE|PRIMARY|FOREIGN|KEY|REFERENCES|DEFAULT|NOT|NULL)\b)/g).map((part, j) =>
                            /^(CREATE|TABLE|PRIMARY|FOREIGN|KEY|REFERENCES|DEFAULT|NOT|NULL)$/.test(part) ? (
                              <span key={j} className="text-sky-400 font-semibold">{part}</span>
                            ) : (
                              <span key={j}>{part}</span>
                            )
                          )
                        ) : (
                          line
                        )}
                      </div>
                    );
                  })}
                </code>
              </pre>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}

// ─── Tab 4: API Reference ───────────────────────────────────
interface APIEndpoint {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  description: string;
  auth: boolean;
  body?: string;
  response?: string;
}

const METHOD_STYLES: Record<string, string> = {
  GET: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
  POST: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  PATCH: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
};

const API_GROUPS: Record<string, { label: string; endpoints: APIEndpoint[] }> = {
  Posts: {
    label: 'Posts',
    endpoints: [
      {
        method: 'GET',
        path: '/api/posts',
        description: 'List all posts with filters (status, platform, limit)',
        auth: true,
        response: `{
  "success": true,
  "data": [
    {
      "id": "post_001",
      "content": "Your post content...",
      "platform": "multi",
      "status": "published",
      "reach": 12500,
      "engagement": 890,
      "analytics": [...]
    }
  ]
}`,
      },
      {
        method: 'POST',
        path: '/api/posts',
        description: 'Create a new post or schedule content',
        auth: true,
        body: `{
  "content": "Hello World!",
  "platform": "multi",
  "scheduledAt": "2025-02-01T10:00:00Z",
  "status": "scheduled",
  "hashtags": ["#marketing", "#social"],
  "mediaUrls": ["https://..."]
}`,
        response: `{
  "success": true,
  "data": { "id": "post_new_001", ... }
}`,
      },
      {
        method: 'PATCH',
        path: '/api/posts',
        description: 'Update post (status, scheduledAt, content)',
        auth: true,
        body: `{
  "id": "post_001",
  "status": "published",
  "scheduledAt": "2025-02-01T12:00:00Z"
}`,
      },
      {
        method: 'DELETE',
        path: '/api/posts',
        description: 'Delete a post by ID',
        auth: true,
        body: `{ "id": "post_001" }`,
      },
    ],
  },
  Accounts: {
    label: 'Accounts',
    endpoints: [
      {
        method: 'GET',
        path: '/api/accounts',
        description: 'List all connected social accounts',
        auth: true,
        response: `{
  "success": true,
  "data": [
    {
      "id": "acc_001",
      "platform": "instagram",
      "username": "@socialpilot",
      "followersCount": 12500
    }
  ]
}`,
      },
      {
        method: 'POST',
        path: '/api/accounts',
        description: 'Connect a new social account',
        auth: true,
        body: `{
  "platform": "instagram",
  "username": "@mybrand",
  "displayName": "My Brand"
}`,
      },
      {
        method: 'PATCH',
        path: '/api/accounts',
        description: 'Update account settings or disconnect',
        auth: true,
      },
    ],
  },
  Analytics: {
    label: 'Analytics',
    endpoints: [
      {
        method: 'GET',
        path: '/api/analytics',
        description: 'Get aggregate analytics (overview, platform breakdown, trends)',
        auth: true,
        response: `{
  "success": true,
  "data": {
    "overview": {
      "totalFollowers": 48500,
      "totalReach": 125000,
      "engagementRate": 4.2,
      "scheduledPosts": 12
    },
    "platformBreakdown": [...],
    "trends": [...]
  }
}`,
      },
    ],
  },
  AI: {
    label: 'AI Tools',
    endpoints: [
      {
        method: 'POST',
        path: '/api/ai',
        description: 'AI content generation, rewriting, hashtag scoring',
        auth: true,
        body: `{
  "action": "generate",
  "topic": "Product launch announcement",
  "platform": "instagram",
  "tone": "professional",
  "length": "short"
}`,
        response: `{
  "success": true,
  "data": {
    "content": "🚀 Exciting news! Our new product...",
    "hashtags": ["#launch", "#innovation"]
  }
}`,
      },
    ],
  },
  Team: {
    label: 'Team',
    endpoints: [
      {
        method: 'GET',
        path: '/api/team',
        description: 'List team members with roles',
        auth: true,
        response: `{
  "success": true,
  "data": [
    { "id": "tm_001", "name": "Alice", "role": "admin" },
    { "id": "tm_002", "name": "Bob", "role": "editor" }
  ]
}`,
      },
      {
        method: 'POST',
        path: '/api/team',
        description: 'Invite a new team member',
        auth: true,
        body: `{ "name": "Charlie", "email": "c@...", "role": "editor" }`,
      },
      {
        method: 'PATCH',
        path: '/api/team',
        description: 'Update member role or approve posts',
        auth: true,
      },
    ],
  },
  Comments: {
    label: 'Comments',
    endpoints: [
      {
        method: 'GET',
        path: '/api/comments',
        description: 'List comments across platforms',
        auth: true,
        response: `{
  "success": true,
  "data": [
    {
      "id": "cmt_001",
      "platform": "instagram",
      "content": "Love this post!",
      "authorName": "user123",
      "isReplied": false
    }
  ]
}`,
      },
    ],
  },
  Templates: {
    label: 'Templates',
    endpoints: [
      {
        method: 'GET',
        path: '/api/templates',
        description: 'List content templates by category',
        auth: true,
      },
      {
        method: 'POST',
        path: '/api/templates',
        description: 'Create a new content template',
        auth: true,
        body: `{
  "name": "Product Announcement",
  "category": "promotion",
  "content": "🚀 Introducing {{product}}!...",
  "variables": ["product", "link"]
}`,
      },
    ],
  },
};

function APIEndpointRow({ endpoint }: { endpoint: APIEndpoint }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <div className="border rounded-lg overflow-hidden">
        <CollapsibleTrigger asChild>
          <div className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors">
            <span className={`text-[10px] font-bold px-2 py-1 rounded font-mono ${METHOD_STYLES[endpoint.method]}`}>
              {endpoint.method}
            </span>
            <span className="font-mono text-sm text-foreground flex-1">{endpoint.path}</span>
            <span className="text-sm text-muted-foreground hidden md:block max-w-xs truncate">
              {endpoint.description}
            </span>
            {endpoint.auth && (
              <Lock className="size-3 text-amber-500 shrink-0" />
            )}
            <ChevronDown className={`size-4 text-muted-foreground transition-transform shrink-0 ${expanded ? 'rotate-180' : ''}`} />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t bg-muted/20 p-3 space-y-2">
            <p className="text-sm text-muted-foreground">{endpoint.description}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {endpoint.body && (
                <div>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Request Body
                  </span>
                  <pre className="mt-1 bg-zinc-900 dark:bg-zinc-950 text-zinc-100 rounded p-3 text-xs font-mono overflow-x-auto">
                    {endpoint.body}
                  </pre>
                </div>
              )}
              {endpoint.response && (
                <div>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Response
                  </span>
                  <pre className="mt-1 bg-zinc-900 dark:bg-zinc-950 text-zinc-100 rounded p-3 text-xs font-mono overflow-x-auto">
                    {endpoint.response}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function APIReferenceTab() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Code className="size-6 text-blue-500" />
          API Reference
        </h2>
        <p className="text-muted-foreground mt-1">
          Complete REST API documentation for all SocialPilot AI endpoints
        </p>
      </div>

      <Separator />

      {/* API Stats */}
      <div className="flex flex-wrap gap-3">
        <Badge variant="outline" className="text-sm">
          <Server className="size-3 mr-1" />
          {Object.values(API_GROUPS).reduce((sum, g) => sum + g.endpoints.length, 0)} Endpoints
        </Badge>
        <Badge variant="outline" className="text-sm">
          <Lock className="size-3 mr-1" />
          All Authenticated
        </Badge>
        <Badge variant="outline" className="text-sm">
          <Zap className="size-3 mr-1" />
          JSON Responses
        </Badge>
      </div>

      {/* Endpoints by Group */}
      {Object.entries(API_GROUPS).map(([key, group]) => (
        <div key={key}>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            {group.label}
            <Badge variant="secondary" className="text-xs">
              {group.endpoints.length} endpoint{group.endpoints.length !== 1 ? 's' : ''}
            </Badge>
          </h3>
          <div className="space-y-2">
            {group.endpoints.map((ep, i) => (
              <APIEndpointRow key={`${ep.method}-${ep.path}-${i}`} endpoint={ep} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Tab 5: MVP Roadmap ─────────────────────────────────────
interface RoadmapPhase {
  number: number;
  title: string;
  weeks: string;
  status: 'Completed' | 'In Progress' | 'Planned';
  tasks: { text: string; done: boolean }[];
  deliverables: string[];
  progress: number;
}

const ROADMAP_PHASES: RoadmapPhase[] = [
  {
    number: 1,
    title: 'Foundation',
    weeks: 'Week 1-2',
    status: 'Completed',
    progress: 100,
    tasks: [
      { text: 'Next.js 16 project setup with TypeScript', done: true },
      { text: 'Prisma schema design & SQLite dev database', done: true },
      { text: 'Zustand store & navigation architecture', done: true },
      { text: 'Core UI components (Sidebar, Header, Layout)', done: true },
      { text: 'shadcn/ui component integration', done: true },
      { text: 'Dark mode & theme support', done: true },
    ],
    deliverables: ['Project scaffold', 'Database schema', 'Core UI shell', 'Dev environment'],
  },
  {
    number: 2,
    title: 'Content Engine',
    weeks: 'Week 3-4',
    status: 'Completed',
    progress: 100,
    tasks: [
      { text: 'Content Composer with platform selector', done: true },
      { text: 'Multi-platform posting support (6 platforms)', done: true },
      { text: 'Smart Scheduler with calendar view', done: true },
      { text: 'Content Templates system', done: true },
      { text: 'Post lifecycle management (draft → published)', done: true },
      { text: 'API routes for posts & templates', done: true },
    ],
    deliverables: ['Full composer', 'Calendar scheduler', 'Template system', '8 API routes'],
  },
  {
    number: 3,
    title: 'AI Integration',
    weeks: 'Week 5-6',
    status: 'Completed',
    progress: 100,
    tasks: [
      { text: 'AI Content Generator (topic, tone, length)', done: true },
      { text: 'Platform-adaptive content rewriting', done: true },
      { text: 'Hashtag scoring & grouping engine', done: true },
      { text: 'AI Auto-Reply for comments', done: true },
      { text: 'Trend detection & best-time suggestions', done: true },
      { text: 'AI API route with z-ai-web-dev-sdk', done: true },
    ],
    deliverables: ['5 AI tools', 'AI API route', 'Smart suggestions', 'Content scoring'],
  },
  {
    number: 4,
    title: 'Analytics & Collaboration',
    weeks: 'Week 7-8',
    status: 'Completed',
    progress: 100,
    tasks: [
      { text: 'Analytics dashboard with 6+ chart types', done: true },
      { text: 'Cross-platform performance comparison', done: true },
      { text: 'Team management with role-based access', done: true },
      { text: 'Approval workflow for content governance', done: true },
      { text: 'Connected accounts management', done: true },
      { text: 'Comprehensive seed data', done: true },
    ],
    deliverables: ['Analytics suite', 'Team features', 'Account management', 'Full demo data'],
  },
  {
    number: 5,
    title: 'Production Readiness',
    weeks: 'Week 9-10',
    status: 'In Progress',
    progress: 65,
    tasks: [
      { text: 'Real OAuth 2.0 integration (all platforms)', done: true },
      { text: 'Rate limiting & request throttling', done: true },
      { text: 'Content moderation AI filters', done: false },
      { text: 'Error handling & retry logic', done: true },
      { text: 'PostgreSQL production migration', done: false },
      { text: 'Performance optimization & caching', done: false },
    ],
    deliverables: ['OAuth flows', 'Rate limiter', 'Migration scripts', 'Monitoring'],
  },
  {
    number: 6,
    title: 'Scale & Polish',
    weeks: 'Week 11-12',
    status: 'Planned',
    progress: 0,
    tasks: [
      { text: 'Redis queue for async post publishing', done: false },
      { text: 'Microservices architecture (posting service)', done: false },
      { text: 'CDN integration for media assets', done: false },
      { text: 'Monitoring, logging & alerting', done: false },
      { text: 'Load testing & scalability improvements', done: false },
      { text: 'Security audit & penetration testing', done: false },
    ],
    deliverables: ['Queue system', 'Microservices', 'CDN setup', 'Monitoring stack'],
  },
];

const STATUS_STYLES: Record<string, string> = {
  Completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
  'In Progress': 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  Planned: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
};

function MVPRoadmapTab() {
  const completedPhases = ROADMAP_PHASES.filter((p) => p.status === 'Completed').length;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Rocket className="size-6 text-orange-500" />
          MVP Roadmap
        </h2>
        <p className="text-muted-foreground mt-1">
          12-week development timeline — {completedPhases}/{ROADMAP_PHASES.length} phases completed
        </p>
      </div>

      <Separator />

      {/* Overall Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm text-muted-foreground">
              {completedPhases} of {ROADMAP_PHASES.length} phases
            </span>
          </div>
          <Progress value={(completedPhases / ROADMAP_PHASES.length) * 100} className="h-2" />
        </CardContent>
      </Card>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-border" />

        <div className="space-y-6">
          {ROADMAP_PHASES.map((phase) => (
            <div key={phase.number} className="relative pl-12">
              {/* Timeline dot */}
              <div className="absolute left-[12px] top-1">
                <div
                  className={`w-4 h-4 rounded-full border-2 border-background ${
                    phase.status === 'Completed'
                      ? 'bg-emerald-500'
                      : phase.status === 'In Progress'
                        ? 'bg-amber-500 animate-pulse'
                        : 'bg-zinc-300 dark:bg-zinc-600'
                  }`}
                />
              </div>

              <Card className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-muted-foreground">
                        Phase {phase.number}
                      </span>
                      <CardTitle className="text-lg">{phase.title}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        <Calendar className="size-3 mr-1" />
                        {phase.weeks}
                      </Badge>
                      <Badge className={`text-xs ${STATUS_STYLES[phase.status]}`}>
                        {phase.status === 'Completed' && <Check className="size-3 mr-1" />}
                        {phase.status === 'In Progress' && <RefreshCw className="size-3 mr-1" />}
                        {phase.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Progress bar */}
                  <Progress value={phase.progress} className="h-1.5" />

                  {/* Tasks */}
                  <div className="space-y-1.5">
                    {phase.tasks.map((task, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                            task.done
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'border-muted-foreground/30'
                          }`}
                        >
                          {task.done && <Check className="size-3" />}
                        </div>
                        <span className={task.done ? 'text-muted-foreground line-through' : ''}>
                          {task.text}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Deliverables */}
                  <div>
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Key Deliverables
                    </span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {phase.deliverables.map((d) => (
                        <Badge key={d} variant="secondary" className="text-xs">
                          {d}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Tab 6: Security & Auth ─────────────────────────────────
function SecurityAuthTab() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="size-6 text-rose-500" />
          Security & Authentication
        </h2>
        <p className="text-muted-foreground mt-1">
          Security architecture, OAuth flows, and access control policies
        </p>
      </div>

      <Separator />

      {/* OAuth 2.0 Flow */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Key className="size-5 text-amber-500" />
          OAuth 2.0 Authorization Flow
        </h3>
        <div className="border-2 border-dashed border-muted rounded-xl p-6 bg-muted/20">
          <div className="flex flex-col gap-3 items-center">
            {/* Flow boxes */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 w-full items-center">
              <FlowBox
                step={1}
                label="User clicks Connect"
                desc="Initiate OAuth"
                color="bg-violet-100 dark:bg-violet-900/30 border-violet-300 dark:border-violet-700"
              />
              <div className="hidden md:flex items-center justify-center">
                <ArrowRight className="size-5 text-muted-foreground" />
              </div>
              <FlowBox
                step={2}
                label="Redirect to Platform"
                desc="Authorization URL"
                color="bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700"
              />
              <div className="hidden md:flex items-center justify-center">
                <ArrowRight className="size-5 text-muted-foreground" />
              </div>
              <FlowBox
                step={3}
                label="User Authorizes"
                desc="Grant permissions"
                color="bg-sky-100 dark:bg-sky-900/30 border-sky-300 dark:border-sky-700"
              />
            </div>

            <div className="flex items-center justify-center">
              <ArrowRight className="size-5 text-muted-foreground rotate-90 md:rotate-0" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 w-full items-center">
              <FlowBox
                step={4}
                label="Exchange Code"
                desc="Code → Tokens"
                color="bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700"
              />
              <div className="hidden md:flex items-center justify-center">
                <ArrowRight className="size-5 text-muted-foreground" />
              </div>
              <FlowBox
                step={5}
                label="Store Tokens"
                desc="Encrypted in DB"
                color="bg-rose-100 dark:bg-rose-900/30 border-rose-300 dark:border-rose-700"
              />
              <div className="hidden md:flex items-center justify-center">
                <ArrowRight className="size-5 text-muted-foreground" />
              </div>
              <FlowBox
                step={6}
                label="API Calls"
                desc="Use access token"
                color="bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700"
              />
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Token Management */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <RefreshCw className="size-5 text-emerald-500" />
          Token Management
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Access Token</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium">Type:</span>
                <Badge variant="outline">Bearer JWT</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Lifetime:</span>
                <span>1-2 hours</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Storage:</span>
                <span>Encrypted in SocialAccount table</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Refresh:</span>
                <span>Using refresh_token</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Refresh Token</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium">Type:</span>
                <Badge variant="outline">Opaque Token</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Lifetime:</span>
                <span>30-90 days</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Storage:</span>
                <span>Encrypted in SocialAccount table</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Rotation:</span>
                <span>Auto-rotation on use</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      {/* Rate Limiting */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Zap className="size-5 text-amber-500" />
          Rate Limiting Configuration
        </h3>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Endpoint Type</TableHead>
                  <TableHead>Rate Limit</TableHead>
                  <TableHead>Window</TableHead>
                  <TableHead>Strategy</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { type: 'API Routes', limit: '100 req', window: 'per minute', strategy: 'Sliding window' },
                  { type: 'AI Generation', limit: '10 req', window: 'per minute', strategy: 'Token bucket' },
                  { type: 'Post Publishing', limit: '5 req', window: 'per minute', strategy: 'Fixed window' },
                  { type: 'Platform APIs', limit: 'Varies', window: 'per platform', strategy: 'Per-platform limits' },
                  { type: 'Auth Endpoints', limit: '5 req', window: 'per minute', strategy: 'Fixed window' },
                ].map((row) => (
                  <TableRow key={row.type}>
                    <TableCell className="font-medium">{row.type}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{row.limit}</Badge>
                    </TableCell>
                    <TableCell>{row.window}</TableCell>
                    <TableCell>{row.strategy}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Data Encryption */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Lock className="size-5 text-purple-500" />
          Data Encryption Scheme
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="p-4">
              <h4 className="font-semibold text-sm mb-2">In Transit</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>TLS 1.3 encryption</p>
                <p>HSTS headers enabled</p>
                <p>Certificate pinning</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="p-4">
              <h4 className="font-semibold text-sm mb-2">At Rest</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>AES-256 encryption</p>
                <p>OAuth tokens encrypted</p>
                <p>Environment secrets</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-rose-500">
            <CardContent className="p-4">
              <h4 className="font-semibold text-sm mb-2">Application</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>CSRF tokens</p>
                <p>Input sanitization</p>
                <p>SQL injection prevention</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      {/* Permission Matrix */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="size-5 text-violet-500" />
          Permission Matrix
        </h3>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-48">Feature</TableHead>
                  <TableHead className="text-center">
                    <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                      Admin
                    </Badge>
                  </TableHead>
                  <TableHead className="text-center">
                    <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                      Editor
                    </Badge>
                  </TableHead>
                  <TableHead className="text-center">
                    <Badge className="bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      Viewer
                    </Badge>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { feature: 'Create Posts', admin: true, editor: true, viewer: false },
                  { feature: 'Publish Posts', admin: true, editor: true, viewer: false },
                  { feature: 'Schedule Posts', admin: true, editor: true, viewer: false },
                  { feature: 'Use AI Tools', admin: true, editor: true, viewer: false },
                  { feature: 'View Analytics', admin: true, editor: true, viewer: true },
                  { feature: 'Export Reports', admin: true, editor: true, viewer: false },
                  { feature: 'Manage Team', admin: true, editor: false, viewer: false },
                  { feature: 'Approve Posts', admin: true, editor: false, viewer: false },
                  { feature: 'Manage Accounts', admin: true, editor: false, viewer: false },
                  { feature: 'Access Settings', admin: true, editor: false, viewer: false },
                  { feature: 'Delete Posts', admin: true, editor: true, viewer: false },
                  { feature: 'View All Posts', admin: true, editor: true, viewer: true },
                ].map((row) => (
                  <TableRow key={row.feature}>
                    <TableCell className="font-medium">{row.feature}</TableCell>
                    <TableCell className="text-center">
                      <PermissionIcon allowed={row.admin} />
                    </TableCell>
                    <TableCell className="text-center">
                      <PermissionIcon allowed={row.editor} />
                    </TableCell>
                    <TableCell className="text-center">
                      <PermissionIcon allowed={row.viewer} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function FlowBox({
  step,
  label,
  desc,
  color,
}: {
  step: number;
  label: string;
  desc: string;
  color: string;
}) {
  return (
    <div
      className={`${color} border rounded-lg p-3 text-center`}
    >
      <div className="text-[10px] font-bold text-muted-foreground mb-0.5">Step {step}</div>
      <div className="text-sm font-semibold">{label}</div>
      <div className="text-xs text-muted-foreground">{desc}</div>
    </div>
  );
}

function PermissionIcon({ allowed }: { allowed: boolean }) {
  return allowed ? (
    <div className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/50">
      <Check className="size-3 text-emerald-600 dark:text-emerald-400" />
    </div>
  ) : (
    <div className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-zinc-100 dark:bg-zinc-800">
      <Eye className="size-3 text-zinc-400 dark:text-zinc-500" />
    </div>
  );
}

// ─── Tab 7: Monetization ────────────────────────────────────
interface PricingFeature {
  name: string;
  free: boolean | string;
  pro: boolean | string;
  enterprise: boolean | string;
}

const PRICING: {
  name: string;
  price: string;
  period?: string;
  description: string;
  icon: React.ReactNode;
  highlighted: boolean;
  features: { name: string; included: boolean }[];
  limits: string[];
  buttonLabel: string;
  buttonVariant: 'default' | 'outline';
}[] = [
  {
    name: 'Free',
    price: '$0',
    description: 'Get started with basic social media management',
    icon: <Gift className="size-5" />,
    highlighted: false,
    features: [
      { name: 'Up to 2 social accounts', included: true },
      { name: '10 posts per month', included: true },
      { name: 'Basic scheduler', included: true },
      { name: 'Dashboard analytics', included: true },
      { name: 'Content templates', included: true },
      { name: 'AI content generation', included: false },
      { name: 'Team collaboration', included: false },
      { name: 'Approval workflows', included: false },
      { name: 'Priority support', included: false },
      { name: 'Custom branding', included: false },
    ],
    limits: ['2 accounts', '10 posts/mo', '7-day analytics', '1 user'],
    buttonLabel: 'Get Started Free',
    buttonVariant: 'outline',
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/month',
    description: 'For growing businesses and content creators',
    icon: <Crown className="size-5" />,
    highlighted: true,
    features: [
      { name: 'Up to 10 social accounts', included: true },
      { name: 'Unlimited posts', included: true },
      { name: 'Advanced scheduler', included: true },
      { name: 'Full analytics suite', included: true },
      { name: 'All content templates', included: true },
      { name: 'AI content generation (500/mo)', included: true },
      { name: 'Team collaboration (5 seats)', included: true },
      { name: 'Approval workflows', included: true },
      { name: 'Priority support', included: false },
      { name: 'Custom branding', included: false },
    ],
    limits: ['10 accounts', 'Unlimited posts', '90-day analytics', '5 users'],
    buttonLabel: 'Start Pro Trial',
    buttonVariant: 'default',
  },
  {
    name: 'Enterprise',
    price: '$99',
    period: '/month',
    description: 'For agencies and large marketing teams',
    icon: <DollarSign className="size-5" />,
    highlighted: false,
    features: [
      { name: 'Unlimited social accounts', included: true },
      { name: 'Unlimited posts', included: true },
      { name: 'Advanced scheduler + AI timing', included: true },
      { name: 'Full analytics + exports', included: true },
      { name: 'Custom templates', included: true },
      { name: 'Unlimited AI generation', included: true },
      { name: 'Unlimited team members', included: true },
      { name: 'Advanced approval workflows', included: true },
      { name: 'Priority support + SLA', included: true },
      { name: 'Custom branding & white-label', included: true },
    ],
    limits: ['Unlimited accounts', 'Unlimited posts', 'Unlimited analytics', 'Unlimited users'],
    buttonLabel: 'Contact Sales',
    buttonVariant: 'outline',
  },
];

function MonetizationTab() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
          <DollarSign className="size-6 text-emerald-500" />
          Pricing & Monetization
        </h2>
        <p className="text-muted-foreground mt-1">
          Flexible pricing tiers designed for individuals, teams, and enterprises
        </p>
      </div>

      <Separator />

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PRICING.map((plan) => (
          <Card
            key={plan.name}
            className={`relative overflow-hidden flex flex-col ${
              plan.highlighted
                ? 'border-2 border-emerald-500 shadow-lg shadow-emerald-500/10 scale-[1.02]'
                : ''
            }`}
          >
            {plan.highlighted && (
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
            )}
            {plan.highlighted && (
              <Badge className="absolute top-3 right-3 bg-emerald-500 text-white text-[10px]">
                Recommended
              </Badge>
            )}
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 mb-1">
                <div className={plan.highlighted ? 'text-emerald-500' : 'text-muted-foreground'}>
                  {plan.icon}
                </div>
                <CardTitle className="text-lg">{plan.name}</CardTitle>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">{plan.price}</span>
                {plan.period && (
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                )}
              </div>
              <CardDescription className="text-sm">{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {/* Usage Limits */}
              <div className="mb-4">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Usage Limits
                </span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {plan.limits.map((limit) => (
                    <Badge key={limit} variant="secondary" className="text-[11px]">
                      {limit}
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator className="my-3" />

              {/* Features */}
              <div className="space-y-2 flex-1">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Features
                </span>
                {plan.features.map((feature) => (
                  <div key={feature.name} className="flex items-center gap-2 text-sm">
                    {feature.included ? (
                      <div className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0">
                        <Check className="size-3 text-emerald-600 dark:text-emerald-400" />
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                        <span className="text-xs text-zinc-400">-</span>
                      </div>
                    )}
                    <span className={feature.included ? '' : 'text-muted-foreground'}>
                      {feature.name}
                    </span>
                  </div>
                ))}
              </div>

              <Button className="mt-4 w-full" variant={plan.buttonVariant}>
                {plan.buttonLabel}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Model Note */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <DollarSign className="size-5 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm mb-1">Revenue Model</h4>
              <p className="text-sm text-muted-foreground">
                Freemium SaaS with tiered pricing. Free tier drives adoption, Pro tier ($29/mo) targets
                growing businesses, and Enterprise tier ($99/mo) serves agencies with unlimited access.
                Additional revenue streams include AI credit packs, white-label options, and custom
                API access for enterprise clients.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Architecture View ─────────────────────────────────
export function ArchitectureView() {
  const setActiveView = useAppStore((s) => s.setActiveView);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-violet-600 via-emerald-600 to-amber-600 bg-clip-text text-transparent">
              Architecture Documentation
            </h1>
            <p className="text-muted-foreground mt-1">
              SocialPilot AI — Comprehensive technical blueprint &amp; development guide
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setActiveView('dashboard')}
            className="gap-2"
          >
            <ExternalLink className="size-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <Tabs defaultValue="system-architecture" className="w-full">
        <ScrollArea className="w-full -mb-1">
          <TabsList className="w-full h-auto flex-wrap">
            <TabsTrigger value="system-architecture" className="gap-1.5">
              <Layers className="size-4" />
              <span className="hidden sm:inline">System</span>
              <span className="sm:hidden">Sys</span>
            </TabsTrigger>
            <TabsTrigger value="ui-wireframes" className="gap-1.5">
              <Layout className="size-4" />
              <span className="hidden sm:inline">Wireframes</span>
              <span className="sm:hidden">Wire</span>
            </TabsTrigger>
            <TabsTrigger value="database-schema" className="gap-1.5">
              <Database className="size-4" />
              <span className="hidden sm:inline">Database</span>
              <span className="sm:hidden">DB</span>
            </TabsTrigger>
            <TabsTrigger value="api-reference" className="gap-1.5">
              <Code className="size-4" />
              <span className="hidden sm:inline">API</span>
            </TabsTrigger>
            <TabsTrigger value="mvp-roadmap" className="gap-1.5">
              <Rocket className="size-4" />
              <span className="hidden sm:inline">Roadmap</span>
              <span className="sm:hidden">Map</span>
            </TabsTrigger>
            <TabsTrigger value="security-auth" className="gap-1.5">
              <Shield className="size-4" />
              <span className="hidden sm:inline">Security</span>
              <span className="sm:hidden">Sec</span>
            </TabsTrigger>
            <TabsTrigger value="monetization" className="gap-1.5">
              <DollarSign className="size-4" />
              <span className="hidden sm:inline">Monetization</span>
              <span className="sm:hidden">$</span>
            </TabsTrigger>
          </TabsList>
        </ScrollArea>

        {/* Tab Content */}
        <TabsContent value="system-architecture">
          <SystemArchitectureTab />
        </TabsContent>

        <TabsContent value="ui-wireframes">
          <UIWireframesTab />
        </TabsContent>

        <TabsContent value="database-schema">
          <DatabaseSchemaTab />
        </TabsContent>

        <TabsContent value="api-reference">
          <APIReferenceTab />
        </TabsContent>

        <TabsContent value="mvp-roadmap">
          <MVPRoadmapTab />
        </TabsContent>

        <TabsContent value="security-auth">
          <SecurityAuthTab />
        </TabsContent>

        <TabsContent value="monetization">
          <MonetizationTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
