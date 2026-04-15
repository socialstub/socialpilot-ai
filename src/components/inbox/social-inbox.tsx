'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  MessageSquare,
  Search,
  Sparkles,
  Send,
  Check,
  X,
  Inbox,
  Clock,
  Reply,
  Loader2,
  Square,
  SquareCheckBig,
  Bot,
  ArrowLeftRight,
  MoreHorizontal,
  MessageCircle,
  RotateCcw,
  Pencil,
} from 'lucide-react';
import { PLATFORMS, type PlatformKey } from '@/lib/constants';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

// ── Types ───────────────────────────────────────────────────────────────────

interface Comment {
  id: string;
  platform: PlatformKey;
  content: string;
  authorName: string;
  authorAvatar?: string;
  isReplied: boolean;
  aiReply?: string;
  createdAt: string;
}

type ReplyStatus = 'idle' | 'generating' | 'pending' | 'sending';

interface PendingReply {
  status: ReplyStatus;
  text: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function getPlatformColor(platform: PlatformKey): string {
  return PLATFORMS[platform]?.color ?? '#6b7280';
}

function getPlatformBadgeClass(platform: PlatformKey): string {
  const color = getPlatformColor(platform);
  switch (platform) {
    case 'facebook':
      return 'bg-[#1877F2]/10 text-[#1877F2] border-[#1877F2]/20';
    case 'instagram':
      return 'bg-[#E4405F]/10 text-[#E4405F] border-[#E4405F]/20';
    case 'twitter':
      return 'bg-zinc-900/10 text-zinc-900 dark:bg-zinc-100/10 dark:text-zinc-100 border-zinc-900/20 dark:border-zinc-100/20';
    case 'linkedin':
      return 'bg-[#0A66C2]/10 text-[#0A66C2] border-[#0A66C2]/20';
    case 'tiktok':
      return 'bg-zinc-900/10 text-zinc-900 dark:bg-zinc-100/10 dark:text-zinc-100 border-zinc-900/20 dark:border-zinc-100/20';
    case 'youtube':
      return 'bg-red-600/10 text-red-600 border-red-600/20';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
}

function getPlatformName(platform: PlatformKey): string {
  return PLATFORMS[platform]?.name ?? platform;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getAvatarBgClass(platform: PlatformKey): string {
  switch (platform) {
    case 'facebook':
      return 'bg-[#1877F2]';
    case 'instagram':
      return 'bg-[#E4405F]';
    case 'twitter':
      return 'bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900';
    case 'linkedin':
      return 'bg-[#0A66C2]';
    case 'tiktok':
      return 'bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900';
    case 'youtube':
      return 'bg-red-600';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

// ── Platform Keys ───────────────────────────────────────────────────────────

const ALL_PLATFORMS: PlatformKey[] = [
  'facebook',
  'instagram',
  'twitter',
  'linkedin',
  'tiktok',
  'youtube',
];

const ALL_TABS: { key: string; label: string }[] = [
  { key: 'all', label: 'All' },
  ...ALL_PLATFORMS.map((p) => ({ key: p, label: PLATFORMS[p].name })),
];

// ── Loading Skeleton ────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-start gap-3 rounded-lg border border-border/50 p-4"
        >
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex gap-2 pt-1">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Empty State ─────────────────────────────────────────────────────────────

function EmptyState({ searchQuery }: { searchQuery: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 px-4">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
        <Inbox className="size-8 text-muted-foreground" />
      </div>
      <div className="text-center space-y-1">
        <h3 className="text-lg font-semibold text-foreground">No comments found</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          {searchQuery
            ? `No comments matching "${searchQuery}" were found. Try a different search term.`
            : 'Your unified inbox is empty. Comments from connected platforms will appear here.'}
        </p>
      </div>
      {!searchQuery && (
        <div className="flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm text-muted-foreground">
          <MessageSquare className="size-4" />
          <span>Connect social accounts to start receiving comments</span>
        </div>
      )}
    </div>
  );
}

// ── AI Reply Badge ──────────────────────────────────────────────────────────

function AIGradientBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 px-2.5 py-0.5 text-xs font-medium text-violet-600 dark:text-violet-400 ring-1 ring-violet-500/20">
      <Sparkles className="size-3" />
      {children}
    </span>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

export function SocialInbox() {
  // ── State ────────────────────────────────────────────────────────────────
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [pendingReplies, setPendingReplies] = useState<Record<string, PendingReply>>({});
  const [dialogComment, setDialogComment] = useState<Comment | null>(null);
  const [dialogReplyText, setDialogReplyText] = useState('');
  const [dialogPendingReply, setDialogPendingReply] = useState<PendingReply | null>(null);

  // ── Fetch Comments ───────────────────────────────────────────────────────
  const fetchComments = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/comments');
      if (!res.ok) throw new Error('Failed to fetch comments');
      const json = await res.json();
      if (json.success) {
        setComments(json.data as Comment[]);
      }
    } catch {
      toast.error('Failed to load comments');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // ── Computed ─────────────────────────────────────────────────────────────
  const filteredComments = useMemo(() => {
    let filtered = comments;

    // Platform filter
    if (activeTab !== 'all') {
      filtered = filtered.filter((c) => c.platform === activeTab);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.content.toLowerCase().includes(q) ||
          c.authorName.toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [comments, activeTab, searchQuery]);

  const unreadCounts = useMemo(() => {
    const counts: Record<string, number> = { all: 0 };
    for (const p of ALL_PLATFORMS) {
      counts[p] = 0;
    }
    for (const c of comments) {
      if (!c.isReplied) {
        counts.all++;
        counts[c.platform] = (counts[c.platform] ?? 0) + 1;
      }
    }
    return counts;
  }, [comments]);

  const filteredUnrepliedIds = useMemo(() => {
    return filteredComments.filter((c) => !c.isReplied).map((c) => c.id);
  }, [filteredComments]);

  const isAllSelected =
    filteredUnrepliedIds.length > 0 &&
    filteredUnrepliedIds.every((id) => selectedIds.has(id));

  // ── Selection ────────────────────────────────────────────────────────────
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredUnrepliedIds));
    }
  }, [isAllSelected, filteredUnrepliedIds]);

  // ── AI Reply ─────────────────────────────────────────────────────────────
  const handleAIReply = useCallback(
    async (commentId: string) => {
      const comment = comments.find((c) => c.id === commentId);
      if (!comment) return;

      setPendingReplies((prev) => ({
        ...prev,
        [commentId]: { status: 'generating', text: '' },
      }));

      try {
        const res = await fetch('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'auto_reply', content: comment.content }),
        });
        if (!res.ok) throw new Error('AI reply failed');
        const json = await res.json();
        const replyText = json.reply ?? json.data ?? 'Thanks for your comment! We appreciate your engagement.';

        setPendingReplies((prev) => ({
          ...prev,
          [commentId]: { status: 'pending', text: replyText },
        }));

        toast.success('AI reply generated', {
          description: 'Review and approve the reply before sending.',
        });
      } catch {
        setPendingReplies((prev) => {
          const next = { ...prev };
          delete next[commentId];
          return next;
        });
        toast.error('Failed to generate AI reply');
      }
    },
    [comments]
  );

  // ── Approve & Send ───────────────────────────────────────────────────────
  const handleApproveReply = useCallback(
    async (commentId: string) => {
      const pending = pendingReplies[commentId];
      if (!pending || pending.status !== 'pending') return;

      setPendingReplies((prev) => ({
        ...prev,
        [commentId]: { ...pending, status: 'sending' },
      }));

      try {
        const res = await fetch('/api/comments', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: commentId, reply: pending.text }),
        });
        if (!res.ok) throw new Error('Send failed');

        setComments((prev) =>
          prev.map((c) =>
            c.id === commentId
              ? { ...c, isReplied: true, aiReply: pending.text }
              : c
          )
        );
        setPendingReplies((prev) => {
          const next = { ...prev };
          delete next[commentId];
          return next;
        });
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(commentId);
          return next;
        });

        toast.success('Reply sent successfully');
      } catch {
        setPendingReplies((prev) => ({
          ...prev,
          [commentId]: { ...pending, status: 'pending' },
        }));
        toast.error('Failed to send reply');
      }
    },
    [pendingReplies]
  );

  // ── Discard AI Reply ─────────────────────────────────────────────────────
  const handleDiscardReply = useCallback((commentId: string) => {
    setPendingReplies((prev) => {
      const next = { ...prev };
      delete next[commentId];
      return next;
    });
    toast.info('AI reply discarded');
  }, []);

  // ── Manual Reply ─────────────────────────────────────────────────────────
  const handleManualReply = useCallback(async (commentId: string) => {
    const text = replyTexts[commentId]?.trim();
    if (!text) return;

    try {
      const res = await fetch('/api/comments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: commentId, reply: text }),
      });
      if (!res.ok) throw new Error('Send failed');

      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId ? { ...c, isReplied: true, aiReply: text } : c
        )
      );
      setReplyTexts((prev) => {
        const next = { ...prev };
        delete next[commentId];
        return next;
      });
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(commentId);
        return next;
      });

      toast.success('Reply sent successfully');
    } catch {
      toast.error('Failed to send reply');
    }
  }, [replyTexts]);

  // ── Bulk AI Reply ────────────────────────────────────────────────────────
  const handleBulkAIReply = useCallback(async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    const unrepliedIds = ids.filter((id) => {
      const comment = comments.find((c) => c.id === id);
      return comment && !comment.isReplied && !pendingReplies[id];
    });

    if (unrepliedIds.length === 0) {
      toast.info('All selected comments already have replies');
      return;
    }

    toast.info(`Generating AI replies for ${unrepliedIds.length} comment${unrepliedIds.length > 1 ? 's' : ''}...`);

    for (const id of unrepliedIds) {
      handleAIReply(id);
    }
  }, [selectedIds, comments, pendingReplies, handleAIReply]);

  // ── Bulk Approve ─────────────────────────────────────────────────────────
  const handleBulkApprove = useCallback(async () => {
    const pendingIds = Object.entries(pendingReplies)
      .filter(([, r]) => r.status === 'pending')
      .filter(([id]) => selectedIds.has(id))
      .map(([id]) => id);

    if (pendingIds.length === 0) {
      toast.info('No pending replies to approve');
      return;
    }

    for (const id of pendingIds) {
      handleApproveReply(id);
    }
  }, [selectedIds, pendingReplies, handleApproveReply]);

  const hasPendingInSelection = useMemo(() => {
    return Array.from(selectedIds).some((id) => {
      const r = pendingReplies[id];
      return r?.status === 'pending';
    });
  }, [selectedIds, pendingReplies]);

  // ── Dialog Handlers ──────────────────────────────────────────────────────
  const openDialog = useCallback((comment: Comment) => {
    setDialogComment(comment);
    setDialogReplyText('');
    setDialogPendingReply(pendingReplies[comment.id] ?? null);
  }, [pendingReplies]);

  const handleDialogAIReply = useCallback(async () => {
    if (!dialogComment) return;
    setDialogPendingReply({ status: 'generating', text: '' });

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'auto_reply', content: dialogComment.content }),
      });
      if (!res.ok) throw new Error('AI reply failed');
      const json = await res.json();
      const replyText = json.reply ?? json.data ?? 'Thanks for your comment! We appreciate your engagement.';
      setDialogPendingReply({ status: 'pending', text: replyText });
      setPendingReplies((prev) => ({
        ...prev,
        [dialogComment.id]: { status: 'pending', text: replyText },
      }));
      toast.success('AI reply generated');
    } catch {
      setDialogPendingReply(null);
      toast.error('Failed to generate AI reply');
    }
  }, [dialogComment]);

  const handleDialogApprove = useCallback(async () => {
    if (!dialogComment || !dialogPendingReply || dialogPendingReply.status !== 'pending') return;

    setDialogPendingReply((prev) => prev ? { ...prev, status: 'sending' as ReplyStatus } : null);

    try {
      const res = await fetch('/api/comments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: dialogComment.id, reply: dialogPendingReply.text }),
      });
      if (!res.ok) throw new Error('Send failed');

      setComments((prev) =>
        prev.map((c) =>
          c.id === dialogComment.id
            ? { ...c, isReplied: true, aiReply: dialogPendingReply.text }
            : c
        )
      );
      setPendingReplies((prev) => {
        const next = { ...prev };
        delete next[dialogComment.id];
        return next;
      });
      setDialogComment((prev) =>
        prev ? { ...prev, isReplied: true, aiReply: dialogPendingReply.text } : null
      );
      setDialogPendingReply(null);
      toast.success('Reply sent successfully');
    } catch {
      setDialogPendingReply({ status: 'pending', text: dialogPendingReply.text });
      toast.error('Failed to send reply');
    }
  }, [dialogComment, dialogPendingReply]);

  const handleDialogManualReply = useCallback(async () => {
    if (!dialogComment || !dialogReplyText.trim()) return;

    try {
      const res = await fetch('/api/comments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: dialogComment.id, reply: dialogReplyText.trim() }),
      });
      if (!res.ok) throw new Error('Send failed');

      setComments((prev) =>
        prev.map((c) =>
          c.id === dialogComment.id
            ? { ...c, isReplied: true, aiReply: dialogReplyText.trim() }
            : c
        )
      );
      setDialogComment((prev) =>
        prev
          ? { ...prev, isReplied: true, aiReply: dialogReplyText.trim() }
          : null
      );
      setDialogReplyText('');
      toast.success('Reply sent successfully');
    } catch {
      toast.error('Failed to send reply');
    }
  }, [dialogComment, dialogReplyText]);

  // ── Render Comment Card ──────────────────────────────────────────────────
  const renderCommentCard = (comment: Comment) => {
    const pending = pendingReplies[comment.id];
    const isSelected = selectedIds.has(comment.id);
    const replyText = replyTexts[comment.id] ?? '';
    const platform = comment.platform;
    const platformName = getPlatformName(platform);

    return (
      <div
        key={comment.id}
        className={`
          group relative flex items-start gap-3 rounded-lg border p-4 transition-all duration-200
          ${
            isSelected
              ? 'border-primary/40 bg-primary/5 shadow-sm'
              : 'border-border/60 bg-background hover:border-border hover:bg-muted/30'
          }
          ${comment.isReplied ? 'opacity-70' : ''}
        `}
      >
        {/* Checkbox */}
        {!comment.isReplied && (
          <div className="pt-0.5">
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => toggleSelect(comment.id)}
              aria-label={`Select comment from ${comment.authorName}`}
              className="size-4"
            />
          </div>
        )}

        {/* Avatar */}
        <Avatar className="mt-0.5 size-10 shrink-0 ring-1 ring-border/50">
          <AvatarImage src={comment.authorAvatar} alt={comment.authorName} />
          <AvatarFallback className={`text-xs font-semibold text-white ${getAvatarBgClass(platform)}`}>
            {getInitials(comment.authorName)}
          </AvatarFallback>
        </Avatar>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Header row */}
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="text-sm font-semibold text-foreground truncate max-w-[160px] sm:max-w-none">
              {comment.authorName}
            </span>
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 font-semibold ${getPlatformBadgeClass(platform)}`}
            >
              {platformName}
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="size-3" />
              {formatTime(comment.createdAt)}
            </span>
            {comment.isReplied && (
              <Badge variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                <Check className="size-2.5 mr-0.5" />
                Replied
              </Badge>
            )}
          </div>

          {/* Comment text */}
          <p className="text-sm text-foreground leading-relaxed mb-3">
            {comment.content}
          </p>

          {/* Show existing reply */}
          {comment.isReplied && comment.aiReply && (
            <div className="rounded-lg bg-muted/60 border border-border/40 p-3 mb-3 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Bot className="size-3 text-violet-500" />
                <span>Your reply</span>
              </div>
              <p className="text-sm text-foreground">{comment.aiReply}</p>
            </div>
          )}

          {/* Pending AI reply */}
          {pending && (
            <div className="rounded-lg border-2 border-dashed border-violet-500/30 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 p-3 mb-3 space-y-2">
              {pending.status === 'generating' ? (
                <div className="flex items-center gap-2 text-sm text-violet-600 dark:text-violet-400">
                  <Loader2 className="size-4 animate-spin" />
                  <span>Generating AI reply...</span>
                </div>
              ) : pending.status === 'sending' ? (
                <div className="flex items-center gap-2 text-sm text-violet-600 dark:text-violet-400">
                  <Loader2 className="size-4 animate-spin" />
                  <span>Sending reply...</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-xs text-violet-600 dark:text-violet-400 mb-1">
                    <Sparkles className="size-3" />
                    <span>AI Suggested Reply</span>
                    <AIGradientBadge>Pending Review</AIGradientBadge>
                  </div>
                  <p className="text-sm text-foreground bg-background/50 rounded-md p-2 border border-border/30">
                    {pending.text}
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      size="sm"
                      onClick={() => handleApproveReply(comment.id)}
                      className="h-7 text-xs bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:from-violet-600 hover:to-fuchsia-600 border-0 shadow-sm"
                    >
                      <Check className="size-3 mr-1" />
                      Approve &amp; Send
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDiscardReply(comment.id)}
                      className="h-7 text-xs text-muted-foreground hover:text-destructive"
                    >
                      <X className="size-3 mr-1" />
                      Discard
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Action buttons */}
          {!comment.isReplied && !pending && (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleAIReply(comment.id)}
                className="h-7 text-xs bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 text-violet-600 dark:text-violet-400 hover:from-violet-500/20 hover:to-fuchsia-500/20 border border-violet-500/20"
              >
                <Sparkles className="size-3 mr-1" />
                AI Reply
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => openDialog(comment)}
                className="h-7 text-xs"
              >
                <MoreHorizontal className="size-3 mr-1" />
                Details
              </Button>
            </div>
          )}

          {/* Quick reply input */}
          {!comment.isReplied && (
            <div className="mt-3 flex items-center gap-2">
              <Input
                placeholder="Type a quick reply..."
                value={replyText}
                onChange={(e) =>
                  setReplyTexts((prev) => ({
                    ...prev,
                    [comment.id]: e.target.value,
                  }))
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleManualReply(comment.id);
                  }
                }}
                className="h-8 text-xs flex-1"
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleManualReply(comment.id)}
                disabled={!replyText.trim()}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              >
                <Send className="size-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── Main Render ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <MessageSquare className="size-6" />
          Unified Inbox
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage comments and messages from all connected platforms in one place
        </p>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="pb-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-base">Comments &amp; Messages</CardTitle>
              <CardDescription>
                {comments.length} total · {unreadCounts.all} unreplied
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search comments or authors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 w-full sm:w-64 pl-8 text-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4 pb-6">
          {/* Platform Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex items-center justify-between gap-2 mb-4">
              <TabsList className="h-9 overflow-x-auto">
                {ALL_TABS.map((tab) => (
                  <TabsTrigger key={tab.key} value={tab.key} className="text-xs gap-1.5 px-2.5">
                    {tab.key !== 'all' && (
                      <span
                        className="size-2 rounded-full shrink-0"
                        style={{
                          backgroundColor: getPlatformColor(tab.key as PlatformKey),
                        }}
                      />
                    )}
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">
                      {tab.key === 'all'
                        ? 'All'
                        : PLATFORMS[tab.key as PlatformKey]?.name?.slice(0, 4) ?? tab.label}
                    </span>
                    {(unreadCounts[tab.key] ?? 0) > 0 && (
                      <span className="ml-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold leading-none">
                        {unreadCounts[tab.key]}
                      </span>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Bulk Actions */}
              {selectedIds.size > 0 && (
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {selectedIds.size} selected
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleBulkAIReply}
                    className="h-7 text-xs bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20"
                  >
                    <Sparkles className="size-3 mr-1" />
                    AI Reply All
                  </Button>
                  {hasPendingInSelection && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleBulkApprove}
                      className="h-7 text-xs bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20"
                    >
                      <Check className="size-3 mr-1" />
                      Approve All
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedIds(new Set())}
                    className="h-7 text-xs"
                  >
                    <X className="size-3 mr-1" />
                    Clear
                  </Button>
                </div>
              )}
            </div>

            {/* All tabs share the same content area since we filter above */}
            {ALL_TABS.map((tab) => (
              <TabsContent key={tab.key} value={tab.key} className="mt-0">
                {/* Select All */}
                {!isLoading && filteredComments.length > 0 && filteredUnrepliedIds.length > 0 && (
                  <div className="flex items-center gap-2 px-4 pb-2">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all unreplied comments"
                      className="size-4"
                    />
                    <span className="text-xs text-muted-foreground">
                      {isAllSelected
                        ? 'Deselect all'
                        : `Select all ${filteredUnrepliedIds.length} unreplied`}
                    </span>
                  </div>
                )}

                {/* Content area */}
                <div className="max-h-[600px] overflow-y-auto rounded-lg border border-border/40 scrollbar-thin">
                  {/* Custom scrollbar styling via inline style */}
                  <style>{`
                    .scrollbar-thin::-webkit-scrollbar { width: 6px; }
                    .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
                    .scrollbar-thin::-webkit-scrollbar-thumb { background-color: hsl(var(--border)); border-radius: 3px; }
                    .scrollbar-thin::-webkit-scrollbar-thumb:hover { background-color: hsl(var(--muted-foreground)); }
                  `}</style>
                  {isLoading ? (
                    <LoadingSkeleton />
                  ) : filteredComments.length === 0 ? (
                    <EmptyState searchQuery={searchQuery} />
                  ) : (
                    <div className="divide-y divide-border/40">
                      {filteredComments.map(renderCommentCard)}
                    </div>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* ── Comment Detail Dialog ────────────────────────────────────────── */}
      <Dialog
        open={!!dialogComment}
        onOpenChange={(open) => {
          if (!open) {
            setDialogComment(null);
            setDialogReplyText('');
            setDialogPendingReply(null);
          }
        }}
      >
        {dialogComment && (
          <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <Avatar className="size-10 ring-1 ring-border/50">
                  <AvatarImage
                    src={dialogComment.authorAvatar}
                    alt={dialogComment.authorName}
                  />
                  <AvatarFallback
                    className={`text-xs font-semibold text-white ${getAvatarBgClass(dialogComment.platform)}`}
                  >
                    {getInitials(dialogComment.authorName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <DialogTitle className="text-base">
                    {dialogComment.authorName}
                  </DialogTitle>
                  <DialogDescription className="flex items-center gap-2 text-xs">
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 font-semibold ${getPlatformBadgeClass(dialogComment.platform)}`}
                    >
                      {getPlatformName(dialogComment.platform)}
                    </Badge>
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      {new Date(dialogComment.createdAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4">
              {/* Original Comment */}
              <div className="rounded-lg bg-muted/50 border border-border/40 p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <MessageCircle className="size-3.5" />
                  <span>Original Comment</span>
                  {dialogComment.isReplied && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 ml-auto"
                    >
                      <Check className="size-2.5 mr-0.5" />
                      Replied
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-foreground leading-relaxed">
                  {dialogComment.content}
                </p>
              </div>

              {/* Existing Reply */}
              {dialogComment.isReplied && dialogComment.aiReply && (
                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-900/30 p-4">
                  <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 mb-2">
                    <Reply className="size-3.5" />
                    <span>Your Reply</span>
                  </div>
                  <p className="text-sm text-foreground">{dialogComment.aiReply}</p>
                </div>
              )}

              {/* AI Pending Reply (in dialog) */}
              {dialogPendingReply && dialogPendingReply.status !== 'idle' && (
                <div className="rounded-lg border-2 border-dashed border-violet-500/30 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 p-4 space-y-3">
                  {dialogPendingReply.status === 'generating' ? (
                    <div className="flex items-center gap-2 text-sm text-violet-600 dark:text-violet-400">
                      <Loader2 className="size-4 animate-spin" />
                      <span>Generating AI reply...</span>
                    </div>
                  ) : dialogPendingReply.status === 'sending' ? (
                    <div className="flex items-center gap-2 text-sm text-violet-600 dark:text-violet-400">
                      <Loader2 className="size-4 animate-spin" />
                      <span>Sending reply...</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 text-xs text-violet-600 dark:text-violet-400">
                        <Sparkles className="size-3.5" />
                        <span className="font-medium">AI Suggested Reply</span>
                        <AIGradientBadge>Pending Review</AIGradientBadge>
                      </div>
                      <p className="text-sm text-foreground bg-background/50 rounded-md p-3 border border-border/30">
                        {dialogPendingReply.text}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={handleDialogApprove}
                          className="h-8 text-xs bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:from-violet-600 hover:to-fuchsia-600 border-0 shadow-sm"
                        >
                          <Check className="size-3.5 mr-1.5" />
                          Approve &amp; Send
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setDialogPendingReply(null);
                            setPendingReplies((prev) => {
                              const next = { ...prev };
                              delete next[dialogComment.id];
                              return next;
                            });
                            toast.info('AI reply discarded');
                          }}
                          className="h-8 text-xs text-muted-foreground hover:text-destructive"
                        >
                          <X className="size-3.5 mr-1.5" />
                          Discard
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {!dialogComment.isReplied && !dialogPendingReply && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">
                        Compose Reply
                      </span>
                      {!dialogPendingReply && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleDialogAIReply}
                          className="h-7 text-xs bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 text-violet-600 dark:text-violet-400 hover:from-violet-500/20 hover:to-fuchsia-500/20 border border-violet-500/20"
                        >
                          <Sparkles className="size-3 mr-1" />
                          Generate with AI
                        </Button>
                      )}
                    </div>
                    <Textarea
                      placeholder="Write your reply..."
                      value={dialogReplyText}
                      onChange={(e) => setDialogReplyText(e.target.value)}
                      className="min-h-[80px] text-sm resize-none"
                    />
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        onClick={handleDialogManualReply}
                        disabled={!dialogReplyText.trim()}
                        className="h-8 text-xs"
                      >
                        <Send className="size-3.5 mr-1.5" />
                        Send Reply
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
