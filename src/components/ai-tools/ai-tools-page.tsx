'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/stores/app-store';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
  platform: PlatformKey;
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

interface HashtagGroup {
  id: string;
  name: string;
  hashtags: string[];
  platform: PlatformKey;
}

// ─── Mock Data ──────────────────────────────────────────────────────────────

const MOCK_TRENDS: TrendItem[] = [
  {
    id: 't1',
    name: 'AI-Powered Marketing',
    growth: 340,
    category: 'Technology',
    velocity: 'high',
    postsCount: 125000,
    description: 'Brands leveraging AI tools for content creation and campaign optimization.',
  },
  {
    id: 't2',
    name: 'Sustainable Fashion',
    growth: 185,
    category: 'Lifestyle',
    velocity: 'high',
    postsCount: 89000,
    description: 'Eco-friendly fashion choices and sustainable brand practices.',
  },
  {
    id: 't3',
    name: 'Remote Work Culture',
    growth: 120,
    category: 'Business',
    velocity: 'medium',
    postsCount: 67000,
    description: 'Work-from-home productivity tips and digital nomad lifestyle.',
  },
  {
    id: 't4',
    name: 'Short-Form Video',
    growth: 95,
    category: 'Entertainment',
    velocity: 'medium',
    postsCount: 210000,
    description: 'Viral video trends on TikTok, Reels, and Shorts.',
  },
  {
    id: 't5',
    name: 'Plant-Based Recipes',
    growth: 78,
    category: 'Food',
    velocity: 'low',
    postsCount: 45000,
    description: 'Creative plant-based meals and vegan cooking hacks.',
  },
  {
    id: 't6',
    name: 'Mindful Productivity',
    growth: 55,
    category: 'Wellness',
    velocity: 'low',
    postsCount: 32000,
    description: 'Focus techniques, digital detox, and intentional living.',
  },
];

const MOCK_COMMENTS: CommentItem[] = [
  {
    id: 'c1',
    platform: 'instagram',
    content: 'This is exactly what I needed! Your tips on content scheduling are incredible 🙌',
    authorName: 'sarah_creates',
    authorAvatar: '',
    createdAt: '2 min ago',
    isReplied: false,
  },
  {
    id: 'c2',
    platform: 'facebook',
    content: 'Can you do a deep dive on hashtag strategy for 2025?',
    authorName: 'MarketingMike',
    authorAvatar: '',
    createdAt: '15 min ago',
    isReplied: false,
  },
  {
    id: 'c3',
    platform: 'linkedin',
    content: 'Great insights! I shared this with my entire team. Would love a follow-up on analytics best practices.',
    authorName: 'Jennifer Chen',
    authorAvatar: '',
    createdAt: '1 hour ago',
    isReplied: false,
  },
  {
    id: 'c4',
    platform: 'twitter',
    content: 'disagree with the posting frequency recommendation. less is more imo',
    authorName: '@digital_nomad_joe',
    authorAvatar: '',
    createdAt: '2 hours ago',
    isReplied: false,
  },
  {
    id: 'c5',
    platform: 'tiktok',
    content: 'Made this recipe and it turned out amazing!! Thanks for sharing 💕',
    authorName: 'foodie_anna',
    authorAvatar: '',
    createdAt: '3 hours ago',
    isReplied: false,
  },
];

const MOCK_HASHTAG_GROUPS: HashtagGroup[] = [
  {
    id: 'hg1',
    name: 'Social Media Marketing',
    hashtags: ['#socialmediamarketing', '#digitalmarketing', '#contentmarketing', '#marketingtips', '#socialmediatips'],
    platform: 'instagram',
  },
  {
    id: 'hg2',
    name: 'Tech & AI',
    hashtags: ['#artificialintelligence', '#machinelearning', '#techstartup', '#innovation', '#futuretech'],
    platform: 'twitter',
  },
  {
    id: 'hg3',
    name: 'Business Growth',
    hashtags: ['#businessgrowth', '#entrepreneurship', '#startuplife', '#leadership', '#businessstrategy'],
    platform: 'linkedin',
  },
];

// ─── Velocity Helpers ───────────────────────────────────────────────────────

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
    Lifestyle: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
    Business: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    Entertainment: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    Food: 'bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400',
    Wellness: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  };
  return colors[category] || 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300';
}

function getHashtagScoreColor(score: number) {
  if (score >= 80) return 'bg-emerald-500 text-white';
  if (score >= 60) return 'bg-blue-500 text-white';
  if (score >= 40) return 'bg-amber-500 text-white';
  return 'bg-zinc-400 text-white';
}

function getPlatformIcon(platform: PlatformKey) {
  return (
    <Avatar className="h-6 w-6">
      <AvatarFallback
        className="text-[10px] font-bold text-white"
        style={{ backgroundColor: PLATFORMS[platform].color }}
      >
        {PLATFORMS[platform].name.charAt(0)}
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
  const [addedHashtags, setAddedHashtags] = useState<string[]>([]);

  // ── Auto-Reply State ──
  const [comments, setComments] = useState<CommentItem[]>(MOCK_COMMENTS);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingReply, setEditingReply] = useState<{ commentId: string; text: string } | null>(null);
  const [sentReplies, setSentReplies] = useState<{ commentId: string; reply: string; sentAt: string }[]>([]);

  // ── Trend Detector State ──
  const [trends, setTrends] = useState<TrendItem[]>(MOCK_TRENDS);

  // ── Helper: simulate AI generation delay ──
  const simulateGeneration = async (ms: number = 1800): Promise<void> => {
    setIsGenerating(true);
    return new Promise((resolve) => setTimeout(resolve, ms));
  };

  // ── Content Generator Handlers ──
  const handleGenerate = async () => {
    if (!topic.trim()) return;
    await simulateGeneration();

    const captions: Record<string, string> = {
      professional: `In today's fast-paced digital landscape, ${topic} is more important than ever. Here's why you should pay attention:\n\n1. It drives engagement and builds brand loyalty\n2. It positions you as a thought leader in your industry\n3. It creates authentic connections with your audience\n\nThe key is consistency and authenticity. Start today and watch your community grow.\n\n#${topic.replace(/\s+/g, '')} #SocialMedia #DigitalStrategy`,
      casual: `So I've been diving deep into ${topic} lately and honestly? It's a game changer! 🔥\n\nIf you're not leveraging this yet, you're leaving serious engagement on the table.\n\nHere's my take: start small, stay consistent, and don't overthink it. The algorithm loves authenticity!\n\nWho else is on this journey? Drop a comment below 👇`,
      inspiring: `Imagine a world where ${topic} transforms the way you connect with your audience.\n\nThis isn't just a trend — it's a movement. Every piece of content you create is an opportunity to inspire, educate, and empower.\n\nYour voice matters. Your story matters. Share it boldly.\n\n✨ The future belongs to those who create, not consume.`,
      funny: `POV: You just discovered ${topic} and now you're about to go viral 😂\n\nStep 1: Learn about it (you're here, great start!)\nStep 2: Create content about it\nStep 3: Watch your notifications explode\nStep 4: Question why you didn't do this sooner\n\nPlot twist: Step 4 hits different at 3 AM while scrolling your analytics 📈\n\n#${topic.replace(/\s+/g, '')} #Relatable`,
    };

    const lengthMultipliers: Record<string, string> = {
      short: captions[tone].split('\n').slice(0, 3).join('\n'),
      medium: captions[tone],
      long: captions[tone] + `\n\n💡 Pro tip: Combine this with a consistent posting schedule and engaging visuals for maximum impact.\n\nRemember: quality over quantity, but don't be afraid to experiment. The best content strategies evolve over time.\n\n📌 Save this for later and share with someone who needs to see it!`,
    };

    const text = lengthMultipliers[contentLength];
    setGeneratedContent({ text, charCount: text.length });
    setIsGenerating(false);
  };

  const handleRegenerate = async () => {
    await handleGenerate();
  };

  const handleCopyContent = async (text: string) => {
    await navigator.clipboard.writeText(text);
  };

  // ── Platform Rewriter Handlers ──
  const handleRewrite = async () => {
    if (!rewriteSource.trim()) return;
    setIsRewriting(true);
    await simulateGeneration(2000);

    const platformAdaptations: Record<string, string> = {
      twitter: `${rewriteSource.substring(0, 200)}\n\n🔥 | #trending #viral`,
      instagram: `${rewriteSource}\n\n✨ Double tap if you agree!\n\n---\n📌 Save for later\n💬 Comment your thoughts below\n🔗 Link in bio\n\n#contentcreator #socialmediamarketing #digitalmarketing #instagood #viral #trending`,
      linkedin: `${rewriteSource}\n\nWhat are your thoughts on this? I'd love to hear your perspective in the comments.\n\nFollow me for more insights on marketing and growth strategy.\n\n#Marketing #DigitalStrategy #Growth #LinkedIn`,
      facebook: `${rewriteSource}\n\nWhat do you think? Drop your thoughts in the comments! 👇\n\n👍 Like | 💬 Comment | 🔄 Share`,
      tiktok: `${rewriteSource.substring(0, 150)}\n\n#fyp #foryou #viral #trending`,
      youtube: `${rewriteSource}\n\nDon't forget to LIKE and SUBSCRIBE! 🔔\n\n#YouTube #ContentCreator #Subscribe`,
    };

    setRewrittenContent(platformAdaptations[rewritePlatform] || rewriteSource);
    setIsRewriting(false);
  };

  // ── Hashtag Generator Handlers ──
  const handleGenerateHashtags = async () => {
    if (!hashtagTopic.trim()) return;
    await simulateGeneration(1500);

    const topicNormalized = hashtagTopic.toLowerCase().replace(/[^a-z0-9]/g, '');
    const allHashtags: HashtagResult[] = [
      { tag: `#${topicNormalized}`, score: 95, posts: 2450000, category: 'Core' },
      { tag: `#${topicNormalized}tips`, score: 88, posts: 890000, category: 'Niche' },
      { tag: `#${topicNormalized}marketing`, score: 82, posts: 1230000, category: 'Marketing' },
      { tag: `#social${topicNormalized}`, score: 79, posts: 567000, category: 'Social' },
      { tag: `#${topicNormalized}strategy`, score: 76, posts: 432000, category: 'Strategy' },
      { tag: `#${topicNormalized}growth`, score: 74, posts: 389000, category: 'Growth' },
      { tag: `#${topicNormalized}life`, score: 71, posts: 1200000, category: 'Lifestyle' },
      { tag: `#${topicNormalized}hacks`, score: 68, posts: 678000, category: 'Tips' },
      { tag: `#${topicNormalized}community`, score: 65, posts: 345000, category: 'Community' },
      { tag: `#${topicNormalized}viral`, score: 63, posts: 890000, category: 'Viral' },
      { tag: `#${topicNormalized}trending`, score: 61, posts: 1500000, category: 'Trending' },
      { tag: `#${topicNormalized}content`, score: 58, posts: 723000, category: 'Content' },
      { tag: `#${topicNormalized}creator`, score: 55, posts: 456000, category: 'Creator' },
      { tag: `#${topicNormalized}inspo`, score: 52, posts: 890000, category: 'Inspiration' },
      { tag: `#${topicNormalized}goals`, score: 50, posts: 1100000, category: 'Goals' },
      { tag: `#${topicNormalized}daily`, score: 48, posts: 2340000, category: 'Daily' },
      { tag: `#${topicNormalized}love`, score: 46, posts: 3400000, category: 'Engagement' },
      { tag: `#${topicNormalized}business`, score: 44, posts: 1780000, category: 'Business' },
      { tag: `#${topicNormalized}success`, score: 42, posts: 1560000, category: 'Success' },
      { tag: `#${topicNormalized}motivation`, score: 40, posts: 2800000, category: 'Motivation' },
      { tag: `#${topicNormalized}digital`, score: 38, posts: 567000, category: 'Digital' },
      { tag: `#${topicNormalized}online`, score: 36, posts: 980000, category: 'Online' },
      { tag: `#${topicNormalized}brand`, score: 34, posts: 456000, category: 'Brand' },
      { tag: `#${topicNormalized}tips2025`, score: 32, posts: 234000, category: 'Timely' },
      { tag: `#${topicNormalized}forbeginners`, score: 30, posts: 567000, category: 'Beginner' },
      { tag: `#${topicNormalized}expert`, score: 28, posts: 123000, category: 'Expert' },
      { tag: `#${topicNormalized}tools`, score: 26, posts: 345000, category: 'Tools' },
      { tag: `#${topicNormalized}review`, score: 24, posts: 178000, category: 'Review' },
      { tag: `#${topicNormalized}tutorial`, score: 22, posts: 289000, category: 'Tutorial' },
      { tag: `#${topicNormalized}guide`, score: 20, posts: 412000, category: 'Guide' },
    ];

    setGeneratedHashtags(allHashtags.slice(0, hashtagCount));
    setIsGenerating(false);
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
    await simulateGeneration(2000);

    const comment = comments.find((c) => c.id === commentId);
    const replies: Record<string, string> = {
      c1: "Thank you so much! 😊 We're thrilled that our scheduling tips are helpful. Stay tuned for more content optimization strategies!",
      c2: "Great question! We're planning a deep dive into hashtag strategy very soon. In the meantime, focus on a mix of broad and niche hashtags — around 20-25 for Instagram works great. Follow us to catch the full guide when it drops! 📈",
      c3: "Thank you for sharing with your team, Jennifer! That means a lot. Analytics best practices is definitely on our content calendar. Would love to hear what specific metrics your team focuses on most!",
      c4: "Thanks for sharing your perspective! You make a fair point — quality definitely matters more than quantity. We believe in finding the right balance for each platform and audience. What posting frequency has worked best for you?",
      c5: "So happy to hear that! 💕 We love seeing our recipes come to life. Tag us in your next creation — we'd love to feature it! 🙌",
    };

    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId ? { ...c, aiReply: replies[commentId] || 'Thanks for your comment!' } : c
      )
    );
    setReplyingTo(null);
  };

  const handleApproveReply = (commentId: string) => {
    const comment = comments.find((c) => c.id === commentId);
    if (!comment?.aiReply) return;

    setSentReplies((prev) => [
      { commentId, reply: comment.aiReply!, sentAt: 'Just now' },
      ...prev,
    ]);
    setComments((prev) =>
      prev.map((c) => (c.id === commentId ? { ...c, isReplied: true } : c))
    );
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
  };

  // ── Copy state ──
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyWithFeedback = async (text: string, id: string) => {
    await handleCopyContent(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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
                {generatedContent ? (
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

              {/* Hashtag Groups */}
              <Separator />
              <CardContent className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-500" />
                  Saved Hashtag Groups
                </Label>
                <ScrollArea className="max-h-48">
                  <div className="space-y-2">
                    {MOCK_HASHTAG_GROUPS.map((group) => (
                      <div
                        key={group.id}
                        className="rounded-lg border p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{group.name}</span>
                          <Badge variant="secondary" className="text-[10px]">
                            {PLATFORMS[group.platform].name}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {group.hashtags.slice(0, 3).map((tag) => (
                            <span key={tag} className="text-xs text-muted-foreground">
                              {tag}
                            </span>
                          ))}
                          {group.hashtags.length > 3 && (
                            <span className="text-xs text-muted-foreground">
                              +{group.hashtags.length - 3} more
                            </span>
                          )}
                        </div>
                        <Button variant="ghost" size="sm" className="h-7 text-xs w-full">
                          <Plus className="mr-1 h-3 w-3" />
                          Use This Group
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
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
                {generatedHashtags.length > 0 ? (
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
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-blue-500" />
                  Recent Comments
                </CardTitle>
                <CardDescription>
                  AI-generated replies for recent comments across your connected platforms.
                </CardDescription>
              </CardHeader>
              <CardContent>
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
                              style={{ backgroundColor: PLATFORMS[comment.platform]?.color || '#666' }}
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
                  onClick={async () => {
                    setIsGenerating(true);
                    await simulateGeneration(1200);
                    setTrends(
                      [...MOCK_TRENDS].sort(() => Math.random() - 0.5)
                    );
                    setIsGenerating(false);
                  }}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                  Refresh Trends
                </Button>
              </div>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
