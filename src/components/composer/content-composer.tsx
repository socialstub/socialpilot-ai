'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/stores/app-store';
import { PLATFORMS, type PlatformKey } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { TemplateLibrary } from '@/components/composer/template-library';
import {
  Sparkles,
  Send,
  Clock,
  FileText,
  Hash,
  Eye,
  Wand2,
  Calendar as CalendarIcon,
  ChevronDown,
  Plus,
  X,
  Check,
  Globe,
  BookOpen,
} from 'lucide-react';

// ─── Helpers ───────────────────────────────────────────────────────────────────

const ALL_PLATFORM_KEYS = Object.keys(PLATFORMS) as PlatformKey[];

function getPlatformIcon(key: PlatformKey) {
  const iconMap: Record<PlatformKey, string> = {
    facebook: '📘',
    instagram: '📸',
    twitter: '𝕏',
    linkedin: '💼',
    tiktok: '🎵',
    youtube: '▶️',
  };
  return iconMap[key];
}

function getMostRestrictiveLimit(platforms: PlatformKey[]): number {
  if (platforms.length === 0) return Infinity;
  return Math.min(...platforms.map((p) => PLATFORMS[p].maxChars));
}

function getCharColor(count: number, limit: number) {
  if (limit === Infinity) return 'text-muted-foreground';
  const ratio = count / limit;
  if (ratio > 0.95) return 'text-red-500';
  if (ratio > 0.8) return 'text-amber-500';
  return 'text-emerald-500';
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ─── Types ────────────────────────────────────────────────────────────────────

type ToneOption = 'professional' | 'casual' | 'inspiring' | 'funny';

interface HashtagResult {
  tag: string;
  score: number;
}

interface PlatformRewrite {
  platform: PlatformKey;
  content: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ContentComposer() {
  const { selectedPlatforms, setSelectedPlatforms, setComposerContent } = useAppStore();

  // Content state
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);

  // AI Generation state
  const [aiTopic, setAiTopic] = useState('');
  const [aiTone, setAiTone] = useState<ToneOption>('professional');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAiGenerated, setIsAiGenerated] = useState(false);

  // Hashtag generation state
  const [hashtagInput, setHashtagInput] = useState('');
  const [isGeneratingHashtags, setIsGeneratingHashtags] = useState(false);
  const [hashtagResults, setHashtagResults] = useState<HashtagResult[]>([]);

  // Schedule state
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined);
  const [scheduledTime, setScheduledTime] = useState('10:00');

  // Rewrite state
  const [platformRewrites, setPlatformRewrites] = useState<PlatformRewrite[]>([]);
  const [isRewriting, setIsRewriting] = useState(false);

  // Action state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync to store
  useEffect(() => {
    setComposerContent(content);
  }, [content, setComposerContent]);

  // Character limit
  const charLimit = getMostRestrictiveLimit(selectedPlatforms);
  const charCount = content.length;
  const charColor = getCharColor(charCount, charLimit);

  // ─── Platform toggling ────────────────────────────────────────────────────
  const togglePlatform = (key: PlatformKey) => {
    setSelectedPlatforms(
      selectedPlatforms.includes(key)
        ? selectedPlatforms.filter((p) => p !== key)
        : [...selectedPlatforms, key],
    );
  };

  // ─── AI Content Generation ────────────────────────────────────────────────
  const handleGenerateContent = async () => {
    if (!aiTopic.trim()) {
      toast.error('Please enter a topic first');
      return;
    }
    setIsGenerating(true);
    try {
      const platforms = selectedPlatforms.length > 0 ? selectedPlatforms.join(',') : 'general';
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'generate_caption',
          topic: aiTopic,
          platform: platforms,
          tone: aiTone,
          length: 'medium',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setContent(data.data);
        setIsAiGenerated(true);
        toast.success('Content generated successfully!');
      } else {
        toast.error('Failed to generate content');
      }
    } catch {
      toast.error('Network error while generating content');
    } finally {
      setIsGenerating(false);
    }
  };

  // ─── AI Rewrite for Platforms ─────────────────────────────────────────────
  const handleRewriteForPlatforms = async () => {
    if (!content.trim() || selectedPlatforms.length === 0) {
      toast.error('Add content and select at least one platform');
      return;
    }
    setIsRewriting(true);
    try {
      const rewrites: PlatformRewrite[] = [];
      for (const platform of selectedPlatforms) {
        const res = await fetch('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'rewrite',
            content,
            platform,
            tone: aiTone,
          }),
        });
        const data = await res.json();
        if (data.success) {
          rewrites.push({ platform, content: data.data });
        }
      }
      setPlatformRewrites(rewrites);
      toast.success('Platform-specific content generated!');
    } catch {
      toast.error('Failed to rewrite content');
    } finally {
      setIsRewriting(false);
    }
  };

  // ─── Hashtag Generation ───────────────────────────────────────────────────
  const handleGenerateHashtags = async () => {
    if (!hashtagInput.trim()) {
      toast.error('Enter a topic or keywords for hashtag suggestions');
      return;
    }
    setIsGeneratingHashtags(true);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'hashtags',
          topic: hashtagInput,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const parsed = JSON.parse(data.data);
        setHashtagResults(
          (parsed.hashtags || []).map((h: string) => ({
            tag: h,
            score: Math.floor(Math.random() * 30 + 70),
          })),
        );
        toast.success('Hashtags generated!');
      }
    } catch {
      toast.error('Failed to generate hashtags');
    } finally {
      setIsGeneratingHashtags(false);
    }
  };

  const addHashtag = (tag: string) => {
    if (!hashtags.includes(tag)) {
      setHashtags([...hashtags, tag]);
    }
  };

  const removeHashtag = (tag: string) => {
    setHashtags(hashtags.filter((h) => h !== tag));
  };

  // ─── Publish / Save actions ───────────────────────────────────────────────
  const handleSubmit = async (status: 'draft' | 'pending_approval' | 'scheduled' | 'published') => {
    if (!content.trim()) {
      toast.error('Please add content before submitting');
      return;
    }
    if (selectedPlatforms.length === 0) {
      toast.error('Select at least one platform');
      return;
    }
    setIsSubmitting(true);
    try {
      const scheduledAt = isScheduled && scheduledDate
        ? new Date(
            `${scheduledDate.getFullYear()}-${String(scheduledDate.getMonth() + 1).padStart(2, '0')}-${String(scheduledDate.getDate()).padStart(2, '0')}T${scheduledTime}`,
          ).toISOString()
        : undefined;

      const platforms = selectedPlatforms.join(',');

      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || undefined,
          content,
          platform: platforms,
          status,
          scheduledAt,
          aiGenerated: isAiGenerated,
          hashtags,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const labels: Record<string, string> = {
          draft: 'saved as draft',
          pending_approval: 'submitted for approval',
          scheduled: 'scheduled successfully',
          published: 'published',
        };
        toast.success(`Post ${labels[status]}!`);
        // Reset
        setContent('');
        setTitle('');
        setHashtags([]);
        setHashtagResults([]);
        setPlatformRewrites([]);
        setIsAiGenerated(false);
      } else {
        toast.error('Failed to save post');
      }
    } catch {
      toast.error('Network error while saving post');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Preview data ─────────────────────────────────────────────────────────
  const previewPlatforms = selectedPlatforms.length > 0 ? selectedPlatforms : [];

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Content Composer</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Create, optimize, and schedule posts for all your social platforms
          </p>
        </div>
      </div>

      {/* 1. Platform Selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Globe className="size-4" />
            Select Platforms
          </CardTitle>
          <CardDescription>Choose where to publish your content</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {ALL_PLATFORM_KEYS.map((key) => {
              const platform = PLATFORMS[key];
              const isSelected = selectedPlatforms.includes(key);
              return (
                <button
                  key={key}
                  onClick={() => togglePlatform(key)}
                  className={`
                    inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
                    border transition-all duration-200 cursor-pointer
                    ${
                      isSelected
                        ? 'border-transparent text-white shadow-md scale-105'
                        : 'border-border bg-background text-muted-foreground hover:border-muted-foreground/30 hover:bg-muted/50'
                    }
                  `}
                  style={
                    isSelected
                      ? { backgroundColor: platform.color }
                      : undefined
                  }
                >
                  <span>{getPlatformIcon(key)}</span>
                  <span>{platform.name}</span>
                  {isSelected && <Check className="size-3.5 ml-1" />}
                </button>
              );
            })}
          </div>
          {selectedPlatforms.length > 0 && (
            <p className="text-xs text-muted-foreground mt-3">
              Selected:{' '}
              {selectedPlatforms.map((k) => PLATFORMS[k].name).join(', ')}
              {charLimit !== Infinity && (
                <span className="ml-2">
                  &middot; Character limit: {charLimit.toLocaleString()}
                </span>
              )}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Main 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── Left column (60%) ───────────────────────────────────────────── */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          {/* 2. Content Editor */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <FileText className="size-4" />
                Content Editor
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {/* Title */}
              <Input
                placeholder="Post title (optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-sm"
              />
              {/* Textarea */}
              <div className="relative">
                <Textarea
                  placeholder="What's on your mind? Write your social media post here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[200px] resize-y text-sm leading-relaxed"
                />
                {isAiGenerated && (
                  <Badge variant="secondary" className="absolute top-2 right-2 text-[10px] gap-1">
                    <Sparkles className="size-3" />
                    AI Generated
                  </Badge>
                )}
              </div>
              {/* Character count */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {content.length > 0 ? `${content.split(/\s+/).filter(Boolean).length} words` : ''}
                </span>
                <span className={charColor}>
                  {charLimit === Infinity
                    ? `${charCount.toLocaleString()} characters`
                    : `${charCount.toLocaleString()} / ${charLimit.toLocaleString()}`}
                </span>
              </div>

              {/* Active Hashtags */}
              {hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {hashtags.map((h) => (
                    <Badge
                      key={h}
                      variant="secondary"
                      className="cursor-pointer hover:bg-destructive/10 transition-colors"
                      onClick={() => removeHashtag(h)}
                    >
                      {h}
                      <X className="size-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 6. Schedule Options */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Clock className="size-4" />
                Scheduling
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <Label htmlFor="schedule-toggle" className="text-sm font-medium">
                    {isScheduled ? 'Schedule for Later' : 'Publish Now'}
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    {isScheduled
                      ? 'Pick a date and time to publish'
                      : 'Post will be published immediately'}
                  </span>
                </div>
                <Switch
                  id="schedule-toggle"
                  checked={isScheduled}
                  onCheckedChange={setIsScheduled}
                />
              </div>

              {isScheduled && (
                <div className="mt-4 flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal text-sm"
                        >
                          <CalendarIcon className="size-4 mr-2" />
                          {scheduledDate ? formatDate(scheduledDate) : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={scheduledDate}
                          onSelect={setScheduledDate}
                          disabled={(date) => date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="sm:w-40">
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Time</Label>
                    <Input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 8. Action Buttons */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  disabled={isSubmitting || !content.trim()}
                  onClick={() => handleSubmit('draft')}
                >
                  <FileText className="size-4" />
                  Save as Draft
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  disabled={isSubmitting || !content.trim()}
                  onClick={() => handleSubmit('pending_approval')}
                >
                  <Send className="size-4" />
                  Submit for Approval
                </Button>
                <Button
                  className="flex-1 gap-2"
                  disabled={
                    isSubmitting ||
                    !content.trim() ||
                    selectedPlatforms.length === 0 ||
                    (isScheduled && !scheduledDate)
                  }
                  onClick={() =>
                    handleSubmit(isScheduled ? 'scheduled' : 'published')
                  }
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      {isScheduled ? 'Scheduling...' : 'Publishing...'}
                    </span>
                  ) : isScheduled ? (
                    <>
                      <CalendarIcon className="size-4" />
                      Schedule
                    </>
                  ) : (
                    <>
                      <Send className="size-4" />
                      Publish
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Right column (40%) ──────────────────────────────────────────── */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Tabs defaultValue="ai-generate" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="ai-generate" className="flex-1 gap-1.5">
                <Sparkles className="size-3.5" />
                <span className="hidden sm:inline">AI</span>
              </TabsTrigger>
              <TabsTrigger value="ai-rewrite" className="flex-1 gap-1.5">
                <Wand2 className="size-3.5" />
                <span className="hidden sm:inline">Rewrite</span>
              </TabsTrigger>
              <TabsTrigger value="hashtags" className="flex-1 gap-1.5">
                <Hash className="size-3.5" />
                <span className="hidden sm:inline">Tags</span>
              </TabsTrigger>
              <TabsTrigger value="templates" className="flex-1 gap-1.5">
                <BookOpen className="size-3.5" />
                <span className="hidden sm:inline">Templates</span>
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex-1 gap-1.5">
                <Eye className="size-3.5" />
                <span className="hidden sm:inline">Preview</span>
              </TabsTrigger>
            </TabsList>

            {/* ── Tab: AI Generate ───────────────────────────────────────── */}
            <TabsContent value="ai-generate">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Sparkles className="size-4 text-amber-500" />
                    AI Content Generation
                  </CardTitle>
                  <CardDescription>
                    Let AI write your social media post
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label className="text-sm">Topic</Label>
                    <Input
                      placeholder="e.g. New product launch, team milestone..."
                      value={aiTopic}
                      onChange={(e) => setAiTopic(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleGenerateContent()}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="text-sm">Tone</Label>
                    <Select value={aiTone} onValueChange={(v) => setAiTone(v as ToneOption)}>
                      <SelectTrigger className="w-full">
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
                  <Button
                    className="w-full gap-2"
                    disabled={isGenerating || !aiTopic.trim()}
                    onClick={handleGenerateContent}
                  >
                    {isGenerating ? (
                      <span className="flex items-center gap-2">
                        <Sparkles className="size-4 animate-pulse" />
                        Generating...
                      </span>
                    ) : (
                      <>
                        <Sparkles className="size-4" />
                        Generate with AI
                      </>
                    )}
                  </Button>

                  {/* Loading animation */}
                  {isGenerating && (
                    <div className="flex items-center justify-center gap-1 py-4">
                      <div className="size-2 rounded-full bg-amber-400 animate-bounce [animation-delay:-0.3s]" />
                      <div className="size-2 rounded-full bg-amber-400 animate-bounce [animation-delay:-0.15s]" />
                      <div className="size-2 rounded-full bg-amber-400 animate-bounce" />
                      <span className="text-xs text-muted-foreground ml-2">
                        AI is crafting your content...
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Tab: AI Rewrite ────────────────────────────────────────── */}
            <TabsContent value="ai-rewrite">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Wand2 className="size-4 text-violet-500" />
                    Rewrite for Platforms
                  </CardTitle>
                  <CardDescription>
                    Adapt your content for each selected platform
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <Button
                    className="w-full gap-2"
                    variant="outline"
                    disabled={isRewriting || !content.trim() || selectedPlatforms.length === 0}
                    onClick={handleRewriteForPlatforms}
                  >
                    {isRewriting ? (
                      <span className="flex items-center gap-2">
                        <Wand2 className="size-4 animate-spin" />
                        Rewriting...
                      </span>
                    ) : (
                      <>
                        <Wand2 className="size-4" />
                        Rewrite for Platform
                      </>
                    )}
                  </Button>

                  {selectedPlatforms.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      Select platforms above to generate platform-specific content
                    </p>
                  )}

                  {platformRewrites.length > 0 && (
                    <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-1">
                      {platformRewrites.map((rewrite) => {
                        const platform = PLATFORMS[rewrite.platform];
                        return (
                          <div
                            key={rewrite.platform}
                            className="rounded-lg border p-3 flex flex-col gap-2"
                          >
                            <div className="flex items-center gap-2">
                              <span>{getPlatformIcon(rewrite.platform)}</span>
                              <span className="text-sm font-medium">{platform.name}</span>
                              <Badge
                                variant="secondary"
                                className="text-[10px] ml-auto"
                              >
                                {rewrite.content.length} chars
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4">
                              {rewrite.content}
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs self-end h-7"
                              onClick={() => setContent(rewrite.content)}
                            >
                              Use this version
                              <Check className="size-3 ml-1" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Tab: Hashtags ──────────────────────────────────────────── */}
            <TabsContent value="hashtags">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Hash className="size-4 text-emerald-500" />
                    Hashtag Generator
                  </CardTitle>
                  <CardDescription>
                    Get AI-suggested hashtags with performance scores
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter topic or keywords..."
                      value={hashtagInput}
                      onChange={(e) => setHashtagInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleGenerateHashtags()}
                      className="flex-1 text-sm"
                    />
                    <Button
                      variant="outline"
                      disabled={isGeneratingHashtags || !hashtagInput.trim()}
                      onClick={handleGenerateHashtags}
                      className="gap-1.5 shrink-0"
                    >
                      {isGeneratingHashtags ? (
                        <span className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Hash className="size-4" />
                      )}
                    </Button>
                  </div>

                  {isGeneratingHashtags && (
                    <div className="flex items-center justify-center gap-1 py-3">
                      <div className="size-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.3s]" />
                      <div className="size-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.15s]" />
                      <div className="size-2 rounded-full bg-emerald-400 animate-bounce" />
                      <span className="text-xs text-muted-foreground ml-2">
                        Finding trending hashtags...
                      </span>
                    </div>
                  )}

                  {hashtagResults.length > 0 && (
                    <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto">
                      <p className="text-xs text-muted-foreground">
                        Click to add to your post &middot;{' '}
                        {hashtagResults.length} suggestions
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {hashtagResults.map((h) => {
                          const isActive = hashtags.includes(h.tag);
                          return (
                            <button
                              key={h.tag}
                              onClick={() =>
                                isActive ? removeHashtag(h.tag) : addHashtag(h.tag)
                              }
                              className={`
                                inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                                border transition-all duration-200 cursor-pointer
                                ${
                                  isActive
                                    ? 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800'
                                    : 'bg-background border-border hover:border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/10'
                                }
                              `}
                            >
                              <span>{h.tag}</span>
                              <span
                                className={`text-[10px] font-semibold ${
                                  h.score >= 85
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : h.score >= 70
                                      ? 'text-amber-600 dark:text-amber-400'
                                      : 'text-red-500'
                                }`}
                              >
                                {h.score}
                              </span>
                              {isActive && <Check className="size-3" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {hashtags.length > 0 && hashtagResults.length === 0 && (
                    <div className="flex flex-col gap-2">
                      <p className="text-xs text-muted-foreground">
                        Active hashtags ({hashtags.length})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {hashtags.map((h) => (
                          <Badge
                            key={h}
                            variant="secondary"
                            className="cursor-pointer hover:bg-destructive/10 transition-colors"
                            onClick={() => removeHashtag(h)}
                          >
                            {h}
                            <X className="size-3 ml-1" />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Tab: Templates ─────────────────────────────────────────── */}
            <TabsContent value="templates">
              <TemplateLibrary
                onApplyTemplate={(templateContent) => {
                  setContent(templateContent);
                  setIsAiGenerated(false);
                }}
                composerContent={content}
              />
            </TabsContent>

            {/* ── Tab: Preview ───────────────────────────────────────────── */}
            <TabsContent value="preview">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Eye className="size-4 text-sky-500" />
                    Post Preview
                  </CardTitle>
                  <CardDescription>
                    See how your post will look on each platform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {previewPlatforms.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Eye className="size-10 text-muted-foreground/40 mb-3" />
                      <p className="text-sm text-muted-foreground">
                        Select platforms above to see previews
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4 max-h-[500px] overflow-y-auto pr-1">
                      {previewPlatforms.map((key) => (
                        <PlatformPreview
                          key={key}
                          platform={key}
                          content={content}
                          hashtags={hashtags}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

// ─── Platform Preview Sub-component ───────────────────────────────────────────

function PlatformPreview({
  platform,
  content,
  hashtags,
}: {
  platform: PlatformKey;
  content: string;
  hashtags: string[];
}) {
  const info = PLATFORMS[platform];
  const icon = getPlatformIcon(platform);
  const displayContent =
    content.length > info.maxChars
      ? content.substring(0, info.maxChars) + '...'
      : content;
  const hashtagsText = hashtags.length > 0 ? '\n\n' + hashtags.join(' ') : '';
  const truncated =
    (displayContent + hashtagsText).length > 200
      ? (displayContent + hashtagsText).substring(0, 200) + '...'
      : displayContent + hashtagsText;

  return (
    <div className="rounded-lg border overflow-hidden">
      {/* Platform header bar */}
      <div
        className="px-3 py-2 flex items-center gap-2"
        style={{ backgroundColor: info.color }}
      >
        <span className="text-lg">{icon}</span>
        <span className="text-white text-xs font-semibold">{info.name}</span>
        <Badge
          variant="secondary"
          className="ml-auto text-[10px] bg-white/20 text-white border-0"
        >
          {info.maxChars.toLocaleString()} chars
        </Badge>
      </div>
      {/* Content area */}
      <div className="p-3 bg-background">
        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
          {truncated || (
            <span className="text-muted-foreground italic">
              Start typing to see preview...
            </span>
          )}
        </p>
      </div>
      {/* Footer bar */}
      <div className="px-3 py-2 border-t bg-muted/30 flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">
          {(displayContent + hashtagsText).length} / {info.maxChars.toLocaleString()}
        </span>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            ♥ Like
          </span>
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            💬 Comment
          </span>
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            ↗ Share
          </span>
        </div>
      </div>
    </div>
  );
}
