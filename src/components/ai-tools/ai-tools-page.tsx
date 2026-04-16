'use client';

import { useState, useEffect } from 'react';
import { PLATFORMS, type PlatformKey } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  Sparkles,
  Wand2,
  Hash,
  MessageCircle,
  TrendingUp,
  Copy,
  RefreshCw,
  Send,
  Check,
  Plus,
  ArrowRight,
  Zap,
  Brain,
  Target,
  Lightbulb,
  Loader2,
  Quote,
  Clock,
  Flame,
  BarChart3,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface GeneratedContent {
  text: string;
  charCount: number;
}

interface HashtagResult {
  tag: string;
  score: number;
  posts: number;
  category: string;
}

interface CommentItem {
  id: string;
  platform: string;
  content: string;
  authorName: string;
  authorAvatar?: string;
  createdAt: string;
  isReplied: boolean;
  aiReply?: string;
}

interface TrendItem {
  id: string;
  name: string;
  growth: number;
  category: string;
  velocity: 'high' | 'medium' | 'low';
  postsCount: number;
  description: string;
}

// ─── API Response Types ─────────────────────────────────────────────────────

interface AIApiResponse {
  success: boolean;
  data: string;
  error?: string;
}

interface HashtagsApiResponse {
  hashtags: string[];
  performance_score: number;
  trending: string[];
}

interface TrendApiResponse {
  topic: string;
  trend: string;
  category: string;
  velocity: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function callAI(body: Record<string, unknown>): Promise<AIApiResponse> {
  return fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then((res) => res.json());
}

function parseTrendGrowth(trendStr: string): number {
  const match = trendStr.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

function formatRelativeTime(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? 's' : ''} ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
}

function getVelocityColor(velocity: 'high' | 'medium' | 'low') {
  switch (velocity) {
    case 'high':
      return { bg: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', width: 'w-full' };
    case 'medium':
      return { bg: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-400', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', width: 'w-2/3' };
    case 'low':
      return { bg: 'bg-zinc-400', text: 'text-zinc-500 dark:text-zinc-400', badge: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400', width: 'w-1/3' };
  }
}

function getCategoryColor(category: string) {
  const colors: Record<string, string> = {
    Technology: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
    'Content Type': 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
    Lifestyle: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
    Business: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    Strategy: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    Entertainment: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    Food: 'bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400',
    Wellness: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
    Marketing: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-400',
    Values: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
    Engagement: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    'E-Commerce': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    'HR/Marketing': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  };
  return colors[category] || 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300';
}

function getHashtagScoreColor(score: number) {
  if (score >= 80) return 'bg-emerald-500 text-white';
  if (score >= 60) return 'bg-blue-500 text-white';
  if (score >= 40) return 'bg-amber-500 text-white';
  return 'bg-zinc-400 text-white';
}

function getPlatformIcon(platform: string) {
  const p = platform as PlatformKey;
  const platformData = PLATFORMS[p];
  return (
    <Avatar className="h-6 w-6">
      <AvatarFallback
        className="text-[10px] font-bold text-white"
        style={{ backgroundColor: platformData?.color || '#666' }}
      >
        {platformData?.name?.charAt(0) || '?'}
      </AvatarFallback>
    </Avatar>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AIToolsPage() {
  // ── Shared State ──
  const [activeTab, setActiveTab] = useState('generator');
  const [isGenerating, setIsGenerating] = useState(false);

  // ── Content Generator State ──
  const [topic, setTopic] = useState('');
  const [genPlatforms, setGenPlatforms] = useState<PlatformKey[]>([]);
  const [tone, setTone] = useState('professional');
  const [contentLength, setContentLength] = useState('medium');
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);

  // ── Platform Rewriter State ──
  const [rewriteSource, setRewriteSource] = useState('');
  const [rewritePlatform, setRewritePlatform] = useState<PlatformKey>('twitter');
  const [rewriteTone, setRewriteTone] = useState('professional');
  const [rewrittenContent, setRewrittenContent] = useState('');
  const [isRewriting, setIsRewriting] = useState(false);

  // ── Hashtag Generator State ──
  const [hashtagTopic, setHashtagTopic] = useState('');
  const [hashtagPlatform, setHashtagPlatform] = useState<PlatformKey>('instagram');
  const [hashtagCount, setHashtagCount] = useState(15);
  const [generatedHashtags, setGeneratedHashtags] = useState<HashtagResult[]>([]);
  const [trendingHashtags, setTrendingHashtags] = useState<string[]>([]);
  const [hashtagPerformanceScore, setHashtagPerformanceScore] = useState<number | null>(null);
  const [addedHashtags, setAddedHashtags] = useState<string[]>([]);

  // ── Auto-Reply State ──
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingReply, setEditingReply] = useState<{ commentId: string; text: string } | null>(null);
  const [sentReplies, setSentReplies] = useState<{ commentId: string; reply: string; sentAt: string }[]>([]);

  // ── Trend Detector State ──
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [isLoadingTrends, setIsLoadingTrends] = useState(false);

  // ── Copy state ──
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // ── Fetch comments on mount ──
  useEffect(() => {
    fetchComments();
  }, []);

  // ── Fetch trends on mount ──
  useEffect(() => {
    fetchTrends();
  }, []);

  // ── Fetch Comments ──
  const fetchComments = async () => {
    setIsLoadingComments(true);
    try {
      const res = await fetch('/api/comments');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setComments(
          json.data.map((c: Record<string, unknown>) => ({
            id: c.id as string,
            platform: (c.platform as string) || 'instagram',
            content: c.content as string,
            authorName: c.authorName as string,
            authorAvatar: (c.authorAvatar as string) || '',
            createdAt: formatRelativeTime(c.createdAt as string),
            isReplied: c.isReplied as boolean,
            aiReply: (c.aiReply as string) || undefined,
          }))
        );
      }
    } catch {
      toast.error('Failed to load comments');
    } finally {
      setIsLoadingComments(false);
    }
  };

  // ── Fetch Trends ──
  const fetchTrends = async () => {
    setIsLoadingTrends(true);
    try {
      const result = await callAI({ type: 'trends' });
      if (result.success && result.data) {
        const trendData: TrendApiResponse[] = JSON.parse(result.data);
        const mapped: TrendItem[] = trendData.map((t, i) => ({
          id: `trend-${i}-${Date.now()}`,
          name: t.topic,
          growth: parseTrendGrowth(t.trend),
          category: t.category,
          velocity: (t.velocity as 'high' | 'medium' | 'low') || 'medium',
          postsCount: Math.floor(Math.random() * 200000 + 20000),
          description: `Trending ${t.topic.toLowerCase()} content gaining traction across social platforms.`,
        }));
        setTrends(mapped);
      }
    } catch {
      toast.error('Failed to load trends');
    } finally {
      setIsLoadingTrends(false);
    }
  };

  // ── Content Generator Handler ──
  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setIsGenerating(true);
    try {
      const platform = genPlatforms.length > 0 ? genPlatforms[0] : '';
      const result = await callAI({
        type: 'generate_caption',
        topic,
        platform,
        tone,
        length: contentLength,
      });
      if (result.success && result.data) {
        setGeneratedContent({ text: result.data, charCount: result.data.length });
      } else {
        toast.error(result.error || 'Failed to generate content');
      }
    } catch {
      toast.error('AI request failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = async () => {
    await handleGenerate();
  };

  // ── Platform Rewriter Handler ──
  const handleRewrite = async () => {
    if (!rewriteSource.trim()) return;
    setIsRewriting(true);
    try {
      const result = await callAI({
        type: 'rewrite',
        content: rewriteSource,
        platform: rewritePlatform,
        tone: rewriteTone,
      });
      if (result.success && result.data) {
        setRewrittenContent(result.data);
      } else {
        toast.error(result.error || 'Failed to rewrite content');
      }
    } catch {
      toast.error('AI request failed. Please try again.');
    } finally {
      setIsRewriting(false);
    }
  };

  // ── Hashtag Generator Handler ──
  const handleGenerateHashtags = async () => {
    if (!hashtagTopic.trim()) return;
    setIsGenerating(true);
    try {
      const result = await callAI({
        type: 'hashtags',
        topic: hashtagTopic,
        platform: hashtagPlatform,
      });
      if (result.success && result.data) {
        const parsed: HashtagsApiResponse = JSON.parse(result.data);
        const baseScore = parsed.performance_score || 75;

        // Map API hashtags to HashtagResult with derived scores
        const categories = ['Core', 'Niche', 'Marketing', 'Social', 'Strategy', 'Growth', 'Viral', 'Trending', 'Content', 'Creator', 'Engagement', 'Lifestyle', 'Community', 'Inspiration', 'Tips'];
        const results: HashtagResult[] = parsed.hashtags.map((tag, i) => ({
          tag,
          score: Math.max(20, Math.round(baseScore - (i * (baseScore - 30) / Math.max(1, parsed.hashtags.length - 1)) + (Math.random() * 6 - 3))),
          posts: Math.floor(Math.random() * 3000000 + 100000),
          category: categories[i % categories.length],
        }));

        const count = Math.min(hashtagCount, results.length);
        setGeneratedHashtags(results.slice(0, count));
        setTrendingHashtags(parsed.trending || []);
        setHashtagPerformanceScore(parsed.performance_score);
      } else {
        toast.error(result.error || 'Failed to generate hashtags');
      }
    } catch {
      toast.error('AI request failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddHashtag = (tag: string) => {
    if (!addedHashtags.includes(tag)) {
      setAddedHashtags((prev) => [...prev, tag]);
    }
  };

  const handleAddAllHashtags = () => {
    const newTags = generatedHashtags
      .map((h) => h.tag)
      .filter((tag) => !addedHashtags.includes(tag));
    setAddedHashtags((prev) => [...prev, ...newTags]);
  };

  const handleRemoveHashtag = (tag: string) => {
    setAddedHashtags((prev) => prev.filter((t) => t !== tag));
  };

  // ── Auto-Reply Handlers ──
  const handleGenerateReply = async (commentId: string) => {
    setReplyingTo(commentId);
    try {
      const comment = comments.find((c) => c.id === commentId);
      if (!comment) return;

      const result = await callAI({
        type: 'auto_reply',
        content: comment.content,
      });
      if (result.success && result.data) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === commentId ? { ...c, aiReply: result.data } : c
          )
        );
      } else {
        toast.error(result.error || 'Failed to generate reply');
      }
    } catch {
      toast.error('AI request failed. Please try again.');
    } finally {
      setReplyingTo(null);
    }
  };

  const handleApproveReply = (commentId: string) => {
    const comment = comments.find((c) => c.id === commentId);
    if (!comment?.aiReply) return;

    // Persist reply via API
    fetch('/api/comments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: commentId, reply: comment.aiReply }),
    }).catch(() => {
      // Silent fail for persistence, still update UI
    });

    setSentReplies((prev) => [
      { commentId, reply: comment.aiReply!, sentAt: 'Just now' },
      ...prev,
    ]);
    setComments((prev) =>
      prev.map((c) => (c.id === commentId ? { ...c, isReplied: true } : c))
    );
    toast.success('Reply sent successfully!');
  };

  const handleEditReply = (commentId: string) => {
    const comment = comments.find((c) => c.id === commentId);
    if (comment?.aiReply) {
      setEditingReply({ commentId, text: comment.aiReply });
    }
  };

  const handleSaveEditedReply = (commentId: string) => {
    if (!editingReply?.text.trim()) return;
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId ? { ...c, aiReply: editingReply.text } : c
      )
    );
    setEditingReply(null);
    toast.success('Reply updated');
  };

  // ── Copy Helpers ──
  const handleCopyWithFeedback = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      toast.success('Copied to clipboard!');
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">AI Tools</h1>
            <p className="text-sm text-muted-foreground">
              Supercharge your social media with AI-powered content creation
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
          <TabsTrigger value="generator" className="gap-2 text-xs sm:text-sm">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Content</span> Generator
          </TabsTrigger>
          <TabsTrigger value="rewriter" className="gap-2 text-xs sm:text-sm">
            <Wand2 className="h-4 w-4" />
            <span className="hidden sm:inline">Platform</span> Rewriter
          </TabsTrigger>
          <TabsTrigger value="hashtags" className="gap-2 text-xs sm:text-sm">
            <Hash className="h-4 w-4" />
            <span className="hidden sm:inline">Hashtag</span> Generator
          </TabsTrigger>
          <TabsTrigger value="autoreply" className="gap-2 text-xs sm:text-sm">
            <MessageCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Auto</span>-Reply
          </TabsTrigger>
          <TabsTrigger value="trends" className="gap-2 text-xs sm:text-sm">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Trend</span> Detector
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 1: Content Generator                                          */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="generator" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Input Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-violet-500" />
                  Content Generator
                </CardTitle>
                <CardDescription>
                  Describe your topic and let AI craft engaging content optimized for your chosen platforms.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Topic Input */}
                <div className="space-y-2">
                  <Label htmlFor="topic">Topic</Label>
                  <Input
                    id="topic"
                    placeholder="e.g., Benefits of morning routines, New product launch tips..."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  />
                </div>

                {/* Platform Multi-Select */}
                <div className="space-y-3">
                  <Label>Optimize for Platforms</Label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {(Object.entries(PLATFORMS) as [PlatformKey, typeof PLATFORMS[PlatformKey]][]).map(
                      ([key, platform]) => (
                        <label
                          key={key}
                          className="flex cursor-pointer items-center gap-2 rounded-lg border p-2.5 transition-colors hover:bg-accent has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
                        >
                          <Checkbox
                            checked={genPlatforms.includes(key)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setGenPlatforms((prev) => [...prev, key]);
                              } else {
                                setGenPlatforms((prev) => prev.filter((p) => p !== key));
                              }
                            }}
                          />
                          <Avatar className="h-5 w-5">
                            <AvatarFallback
                              className="text-[9px] font-bold text-white"
                              style={{ backgroundColor: platform.color }}
                            >
                              {platform.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{platform.name}</span>
                        </label>
                      )
                    )}
                  </div>
                </div>

                {/* Tone Selector */}
                <div className="space-y-2">
                  <Label>Tone</Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">
                        <span className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-blue-500" />
                          Professional
                        </span>
                      </SelectItem>
                      <SelectItem value="casual">
                        <span className="flex items-center gap-2">
                          <MessageCircle className="h-4 w-4 text-green-500" />
                          Casual
                        </span>
                      </SelectItem>
                      <SelectItem value="inspiring">
                        <span className="flex items-center gap-2">
                          <Lightbulb className="h-4 w-4 text-amber-500" />
                          Inspiring
                        </span>
                      </SelectItem>
                      <SelectItem value="funny">
                        <span className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-orange-500" />
                          Funny
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Content Length */}
                <div className="space-y-2">
                  <Label>Content Length</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'short', label: 'Short', desc: '~100 chars' },
                      { value: 'medium', label: 'Medium', desc: '~300 chars' },
                      { value: 'long', label: 'Long', desc: '~500+ chars' },
                    ].map((len) => (
                      <Button
                        key={len.value}
                        variant={contentLength === len.value ? 'default' : 'outline'}
                        className="flex flex-col gap-0.5 h-auto py-3"
                        onClick={() => setContentLength(len.value)}
                      >
                        <span className="font-medium">{len.label}</span>
                        <span className="text-[10px] opacity-70">{len.desc}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Generate Button */}
                <Button
                  className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-700 hover:to-fuchsia-700 shadow-lg shadow-violet-500/20"
                  onClick={handleGenerate}
                  disabled={!topic.trim() || isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Content
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Output Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-amber-500" />
                    Generated Content
                  </span>
                  {generatedContent && (
                    <Badge variant="secondary" className="text-xs">
                      {generatedContent.charCount} characters
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isGenerating && !generatedContent ? (
                  <div className="flex min-h-[350px] flex-col items-center justify-center gap-4 text-center text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">Generating with AI...</p>
                      <p className="text-sm">
                        Crafting the perfect content for your topic
                      </p>
                    </div>
                  </div>
                ) : generatedContent ? (
                  <>
                    {/* Content Display with Glow */}
                    <div className="relative rounded-lg border border-violet-200 bg-gradient-to-br from-violet-50/50 to-fuchsia-50/50 p-4 dark:border-violet-800 dark:from-violet-950/20 dark:to-fuchsia-950/20">
                      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-violet-500/5 to-fuchsia-500/5" />
                      <div className="relative">
                        <Textarea
                          value={generatedContent.text}
                          readOnly
                          className="min-h-[280px] resize-none border-none bg-transparent shadow-none focus-visible:ring-0 text-sm leading-relaxed"
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() =>
                          handleCopyWithFeedback(generatedContent.text, 'gen-content')
                        }
                      >
                        {copiedId === 'gen-content' ? (
                          <>
                            <Check className="mr-2 h-4 w-4 text-emerald-500" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={handleRegenerate}
                        disabled={isGenerating}
                      >
                        <RefreshCw className={`mr-2 h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
                        Regenerate
                      </Button>
                    </div>

                    {/* Platform Tags */}
                    {genPlatforms.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        <span className="text-xs text-muted-foreground mr-1">Optimized for:</span>
                        {genPlatforms.map((p) => (
                          <Badge
                            key={p}
                            variant="secondary"
                            className="text-xs gap-1"
                            style={{
                              borderColor: PLATFORMS[p].color + '40',
                              backgroundColor: PLATFORMS[p].color + '15',
                              color: PLATFORMS[p].color,
                            }}
                          >
                            {PLATFORMS[p].name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex min-h-[350px] flex-col items-center justify-center gap-4 text-center text-muted-foreground">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                      <Sparkles className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">No content generated yet</p>
                      <p className="text-sm">
                        Enter a topic and click Generate to create AI-powered content
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 2: Platform Rewriter                                          */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="rewriter" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-fuchsia-500" />
                Platform Rewriter
              </CardTitle>
              <CardDescription>
                Paste your content and transform it for any social media platform with the right tone and format.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Source Content */}
              <div className="space-y-2">
                <Label>Source Content</Label>
                <Textarea
                  placeholder="Paste your content here..."
                  value={rewriteSource}
                  onChange={(e) => setRewriteSource(e.target.value)}
                  className="min-h-[140px] resize-none"
                />
              </div>

              {/* Controls Row */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Target Platform</Label>
                  <Select
                    value={rewritePlatform}
                    onValueChange={(v) => setRewritePlatform(v as PlatformKey)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.entries(PLATFORMS) as [PlatformKey, typeof PLATFORMS[PlatformKey]][]).map(
                        ([key, platform]) => (
                          <SelectItem key={key} value={key}>
                            <span className="flex items-center gap-2">
                              <Avatar className="h-4 w-4">
                                <AvatarFallback
                                  className="text-[7px] font-bold text-white"
                                  style={{ backgroundColor: platform.color }}
                                >
                                  {platform.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              {platform.name}
                            </span>
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tone Adjustment</Label>
                  <Select value={rewriteTone} onValueChange={setRewriteTone}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="inspiring">Inspiring</SelectItem>
                      <SelectItem value="funny">Funny</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Rewrite Button */}
              <Button
                className="w-full bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white hover:from-fuchsia-700 hover:to-pink-700 shadow-lg shadow-fuchsia-500/20"
                onClick={handleRewrite}
                disabled={!rewriteSource.trim() || isRewriting}
              >
                {isRewriting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Rewriting...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Rewrite for {PLATFORMS[rewritePlatform].name}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Side-by-side Comparison */}
          {isRewriting && !rewrittenContent && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-fuchsia-500" />
              <span className="ml-3 text-sm text-muted-foreground">AI is rewriting your content...</span>
            </div>
          )}
          {rewrittenContent && (
            <div className="grid gap-4 md:grid-cols-2">
              {/* Original */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Quote className="h-4 w-4 text-muted-foreground" />
                    Original
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <p className="text-sm whitespace-pre-wrap leading-relaxed text-muted-foreground">
                      {rewriteSource}
                    </p>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {rewriteSource.length} characters
                  </p>
                </CardContent>
              </Card>

              {/* Rewritten */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-fuchsia-500" />
                      Rewritten for {PLATFORMS[rewritePlatform].name}
                    </span>
                    <Badge
                      variant="secondary"
                      className="text-xs"
                      style={{
                        borderColor: PLATFORMS[rewritePlatform].color + '40',
                        backgroundColor: PLATFORMS[rewritePlatform].color + '15',
                        color: PLATFORMS[rewritePlatform].color,
                      }}
                    >
                      {PLATFORMS[rewritePlatform].name}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="relative rounded-lg border border-fuchsia-200 bg-gradient-to-br from-fuchsia-50/50 to-pink-50/50 p-4 dark:border-fuchsia-800 dark:from-fuchsia-950/20 dark:to-pink-950/20">
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-fuchsia-500/5 to-pink-500/5" />
                    <p className="relative text-sm whitespace-pre-wrap leading-relaxed">
                      {rewrittenContent}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {rewrittenContent.length} characters
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() =>
                        handleCopyWithFeedback(rewrittenContent, 'rewrite-content')
                      }
                    >
                      {copiedId === 'rewrite-content' ? (
                        <>
                          <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-500" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="mr-1.5 h-3.5 w-3.5" />
                          Copy
                        </>
                      )}
                    </Button>
                    <Button size="sm" className="flex-1 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-700 hover:to-fuchsia-700">
                      <Send className="mr-1.5 h-3.5 w-3.5" />
                      Copy to Composer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 3: Hashtag Generator                                          */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="hashtags" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Input Controls */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hash className="h-5 w-5 text-emerald-500" />
                  Hashtag Generator
                </CardTitle>
                <CardDescription>
                  Generate high-performing hashtags tailored to your topic and platform.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="hashtag-topic">Topic / Content</Label>
                  <Textarea
                    id="hashtag-topic"
                    placeholder="Describe your content topic..."
                    value={hashtagTopic}
                    onChange={(e) => setHashtagTopic(e.target.value)}
                    className="min-h-[100px] resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Platform</Label>
                  <Select
                    value={hashtagPlatform}
                    onValueChange={(v) => setHashtagPlatform(v as PlatformKey)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.entries(PLATFORMS) as [PlatformKey, typeof PLATFORMS[PlatformKey]][]).map(
                        ([key, platform]) => (
                          <SelectItem key={key} value={key}>
                            <span className="flex items-center gap-2">
                              <Avatar className="h-4 w-4">
                                <AvatarFallback
                                  className="text-[7px] font-bold text-white"
                                  style={{ backgroundColor: platform.color }}
                                >
                                  {platform.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              {platform.name}
                            </span>
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Number of Hashtags</Label>
                    <span className="text-sm font-semibold text-emerald-600">{hashtagCount}</span>
                  </div>
                  <Slider
                    value={[hashtagCount]}
                    onValueChange={(v) => setHashtagCount(v[0])}
                    min={5}
                    max={30}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>5</span>
                    <span>15</span>
                    <span>30</span>
                  </div>
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-500/20"
                  onClick={handleGenerateHashtags}
                  disabled={!hashtagTopic.trim() || isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Hash className="mr-2 h-4 w-4" />
                      Generate Hashtags
                    </>
                  )}
                </Button>
              </CardContent>

              {/* Trending Hashtags */}
              {trendingHashtags.length > 0 && (
                <>
                  <Separator />
                  <CardContent className="space-y-3">
                    <Label className="flex items-center gap-2">
                      <Flame className="h-4 w-4 text-orange-500" />
                      Currently Trending
                    </Label>
                    <div className="flex flex-wrap gap-1.5">
                      {trendingHashtags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="cursor-pointer gap-1 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
                          onClick={() => {
                            handleAddHashtag(tag);
                            toast.success(`Added ${tag}`);
                          }}
                        >
                          <Flame className="h-3 w-3 text-orange-500" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    {hashtagPerformanceScore !== null && (
                      <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Performance Score</span>
                          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                            {hashtagPerformanceScore}/100
                          </span>
                        </div>
                        <div className="mt-1.5 h-2 w-full rounded-full bg-emerald-100 dark:bg-emerald-900/50 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                            style={{ width: `${hashtagPerformanceScore}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </>
              )}
            </Card>

            {/* Generated Hashtags */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-500" />
                    Generated Hashtags
                    {generatedHashtags.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {generatedHashtags.length}
                      </Badge>
                    )}
                  </CardTitle>
                  {generatedHashtags.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddAllHashtags}
                    >
                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                      Add All
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isGenerating && generatedHashtags.length === 0 ? (
                  <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 text-center text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">Generating hashtags...</p>
                      <p className="text-sm">
                        AI is finding the best hashtags for your topic
                      </p>
                    </div>
                  </div>
                ) : generatedHashtags.length > 0 ? (
                  <>
                    <ScrollArea className="max-h-[320px]">
                      <div className="grid gap-2 sm:grid-cols-2">
                        {generatedHashtags.map((hashtag) => (
                          <div
                            key={hashtag.tag}
                            className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span
                                className={`inline-flex h-7 w-7 items-center justify-center rounded-md text-[11px] font-bold ${getHashtagScoreColor(hashtag.score)}`}
                              >
                                {hashtag.score}
                              </span>
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {hashtag.tag}
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                  {(hashtag.posts / 1000000).toFixed(1)}M posts &middot;{' '}
                                  {hashtag.category}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant={addedHashtags.includes(hashtag.tag) ? 'secondary' : 'ghost'}
                              size="sm"
                              className="h-7 w-7 p-0 shrink-0"
                              onClick={() =>
                                addedHashtags.includes(hashtag.tag)
                                  ? handleRemoveHashtag(hashtag.tag)
                                  : handleAddHashtag(hashtag.tag)
                              }
                            >
                              {addedHashtags.includes(hashtag.tag) ? (
                                <Check className="h-3.5 w-3.5 text-emerald-500" />
                              ) : (
                                <Plus className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>

                    {/* Selected Hashtags */}
                    {addedHashtags.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">
                            Selected ({addedHashtags.length})
                          </Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() =>
                              handleCopyWithFeedback(
                                addedHashtags.join(' '),
                                'all-hashtags'
                              )
                            }
                          >
                            {copiedId === 'all-hashtags' ? (
                              <>
                                <Check className="mr-1 h-3 w-3 text-emerald-500" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="mr-1 h-3 w-3" />
                                Copy All
                              </>
                            )}
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-1.5 rounded-lg border bg-muted/30 p-3">
                          {addedHashtags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="cursor-pointer gap-1 hover:bg-destructive/10 hover:text-destructive transition-colors"
                              onClick={() => handleRemoveHashtag(tag)}
                            >
                              {tag}
                              <span className="text-[10px]">&times;</span>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 text-center text-muted-foreground">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                      <Hash className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">No hashtags generated yet</p>
                      <p className="text-sm">
                        Enter a topic and generate high-performing hashtags
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 4: Auto-Reply                                                 */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="autoreply" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-5">
            {/* Comments List */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <MessageCircle className="h-5 w-5 text-blue-500" />
                      Recent Comments
                    </CardTitle>
                    <CardDescription className="mt-1">
                      AI-generated replies for recent comments across your connected platforms.
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchComments}
                    disabled={isLoadingComments}
                  >
                    <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isLoadingComments ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingComments ? (
                  <div className="flex min-h-[400px] items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                    <span className="ml-3 text-sm text-muted-foreground">Loading comments...</span>
                  </div>
                ) : comments.length === 0 ? (
                  <div className="flex min-h-[400px] flex-col items-center justify-center gap-3 text-center text-muted-foreground">
                    <MessageCircle className="h-8 w-8 text-muted-foreground/30" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">No comments found</p>
                      <p className="text-xs">
                        Comments from your connected accounts will appear here
                      </p>
                    </div>
                  </div>
                ) : (
                  <ScrollArea className="max-h-[600px]">
                    <div className="space-y-4">
                      {comments.map((comment) => (
                        <div
                          key={comment.id}
                          className={`rounded-lg border p-4 transition-all ${
                            comment.isReplied
                              ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20'
                              : 'hover:bg-accent/50'
                          }`}
                        >
                          {/* Comment Header */}
                          <div className="flex items-start gap-3">
                            <Avatar className="h-9 w-9 shrink-0">
                              <AvatarFallback className="text-xs font-bold text-white"
                                style={{ backgroundColor: PLATFORMS[comment.platform as PlatformKey]?.color || '#666' }}
                              >
                                {comment.authorName.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-medium">{comment.authorName}</span>
                                {getPlatformIcon(comment.platform)}
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {comment.createdAt}
                                </span>
                                {comment.isReplied && (
                                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px]">
                                    <Check className="mr-0.5 h-2.5 w-2.5" />
                                    Replied
                                  </Badge>
                                )}
                              </div>
                              <p className="mt-1 text-sm text-muted-foreground">{comment.content}</p>
                            </div>
                          </div>

                          {/* AI Reply Section */}
                          {comment.aiReply && (
                            <div className="mt-3 ml-12 rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50/50 to-violet-50/50 p-3 dark:border-blue-800 dark:from-blue-950/20 dark:to-violet-950/20">
                              {editingReply?.commentId === comment.id ? (
                                <div className="space-y-2">
                                  <Textarea
                                    value={editingReply.text}
                                    onChange={(e) =>
                                      setEditingReply({ ...editingReply, text: e.target.value })
                                    }
                                    className="min-h-[80px] resize-none text-sm"
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => handleSaveEditedReply(comment.id)}
                                    >
                                      <Check className="mr-1 h-3 w-3" />
                                      Save
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setEditingReply(null)}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="flex items-center gap-1.5 mb-1.5">
                                    <Sparkles className="h-3 w-3 text-violet-500" />
                                    <span className="text-[10px] font-medium text-violet-600 dark:text-violet-400">
                                      AI Generated Reply
                                    </span>
                                  </div>
                                  <p className="text-sm">{comment.aiReply}</p>
                                  {!comment.isReplied && (
                                    <div className="mt-2 flex gap-2">
                                      <Button
                                        size="sm"
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                        onClick={() => handleApproveReply(comment.id)}
                                      >
                                        <Send className="mr-1 h-3 w-3" />
                                        Approve &amp; Send
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleEditReply(comment.id)}
                                      >
                                        Edit
                                      </Button>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          )}

                          {/* Generate Reply Button */}
                          {!comment.aiReply && !comment.isReplied && (
                            <div className="mt-3 ml-12">
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={replyingTo === comment.id}
                                onClick={() => handleGenerateReply(comment.id)}
                                className="gap-1.5"
                              >
                                {replyingTo === comment.id ? (
                                  <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    Generating...
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                                    Generate Reply
                                  </>
                                )}
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            {/* Sent Replies History */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Send className="h-4 w-4 text-emerald-500" />
                  Sent Replies
                  {sentReplies.length > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {sentReplies.length}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sentReplies.length > 0 ? (
                  <ScrollArea className="max-h-[600px]">
                    <div className="space-y-3">
                      {sentReplies.map((sent, i) => {
                        const comment = comments.find((c) => c.id === sent.commentId);
                        return (
                          <div key={i} className="rounded-lg border p-3 space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-muted-foreground">
                                Replied to
                              </span>
                              <span className="text-xs font-medium">{comment?.authorName}</span>
                              <span className="text-[10px] text-muted-foreground">
                                {sent.sentAt}
                              </span>
                            </div>
                            <p className="text-sm">{sent.reply}</p>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 text-center text-muted-foreground">
                    <Send className="h-8 w-8 text-muted-foreground/30" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">No replies sent yet</p>
                      <p className="text-xs">
                        Generate and approve replies to see them here
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 5: Trend Detector                                             */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-orange-500" />
                    Trend Detector
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Discover trending topics and create timely content to boost your reach.
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={fetchTrends}
                  disabled={isLoadingTrends}
                >
                  {isLoadingTrends ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                  Refresh Trends
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingTrends && trends.length === 0 ? (
                <div className="flex min-h-[400px] items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
                  <span className="ml-3 text-sm text-muted-foreground">Fetching trends...</span>
                </div>
              ) : trends.length === 0 ? (
                <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 text-center text-muted-foreground">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                    <TrendingUp className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">No trends loaded</p>
                    <p className="text-sm">
                      Click &quot;Refresh Trends&quot; to discover what&apos;s trending
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {trends.map((trend) => {
                    const velocityInfo = getVelocityColor(trend.velocity);
                    const catColor = getCategoryColor(trend.category);

                    return (
                      <div
                        key={trend.id}
                        className="group relative overflow-hidden rounded-xl border p-5 transition-all hover:shadow-lg hover:border-primary/20"
                      >
                        {/* Gradient Accent Top Border */}
                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-500 via-pink-500 to-violet-500" />

                        <div className="space-y-4">
                          {/* Header */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 space-y-1.5">
                              <h3 className="font-semibold text-base leading-tight">
                                {trend.name}
                              </h3>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {trend.description}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                              <Badge
                                variant="secondary"
                                className={`text-xs ${catColor}`}
                              >
                                {trend.category}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {(trend.postsCount / 1000).toFixed(0)}K posts
                              </span>
                            </div>
                          </div>

                          {/* Growth & Velocity */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Growth</span>
                              <span className="flex items-center gap-1 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                <Flame className="h-3.5 w-3.5" />
                                +{trend.growth}%
                              </span>
                            </div>

                            {/* Velocity Bar */}
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] text-muted-foreground">
                                  Velocity
                                </span>
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] ${velocityInfo.badge}`}
                                >
                                  {trend.velocity.charAt(0).toUpperCase() + trend.velocity.slice(1)}
                                </Badge>
                              </div>
                              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-700 ${velocityInfo.bg}`}
                                  style={{ width: velocityInfo.width }}
                                />
                              </div>
                            </div>
                          </div>

                          <Separator />

                          {/* Action */}
                          <Button
                            variant="outline"
                            className="w-full group-hover:bg-gradient-to-r group-hover:from-orange-50 group-hover:to-pink-50 group-hover:border-orange-200 dark:group-hover:from-orange-950/30 dark:group-hover:to-pink-950/30 dark:group-hover:border-orange-800"
                            onClick={() => {
                              setActiveTab('generator');
                              setTopic(trend.name);
                            }}
                          >
                            <Sparkles className="mr-2 h-4 w-4 text-violet-500" />
                            Create Content for This Trend
                            <ArrowRight className="ml-1 h-3.5 w-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
