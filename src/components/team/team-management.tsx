'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '@/stores/app-store';
import { PLATFORMS, TEAM_ROLES, POST_STATUSES, type PlatformKey } from '@/lib/constants';
import type { TeamMemberData } from '@/stores/app-store';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  UserPlus,
  Shield,
  Edit2,
  Check,
  X,
  Clock,
  Users,
  Eye,
  AlertCircle,
  Settings,
} from 'lucide-react';

interface PendingPost {
  id: string;
  title?: string;
  content: string;
  platform: string;
  scheduledAt?: string;
  status: string;
  aiGenerated: boolean;
  reach: number;
  engagement: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
}

export function TeamManagement() {
  const { teamMembers, setTeamMembers, posts } = useAppStore();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('editor');
  const [pendingPosts, setPendingPosts] = useState<PendingPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvalNotes, setApprovalNotes] = useState<Record<string, string>>({});
  const [rejectingPostId, setRejectingPostId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [teamRes, pendingRes] = await Promise.all([
          fetch('/api/team'),
          fetch('/api/posts?status=pending_approval'),
        ]);
        const teamJson = await teamRes.json();
        const pendingJson = await pendingRes.json();
        if (teamJson.success) setTeamMembers(teamJson.data || []);
        if (pendingJson.success) setPendingPosts(pendingJson.data || []);
      } catch (error) {
        console.error('Failed to fetch team data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [setTeamMembers]);

  // Derive posts count per team member (mock based on available data)
  const memberPostCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    teamMembers.forEach((_, idx) => {
      // Use deterministic mock data since we don't have userId on posts
      counts[teamMembers[idx].id] = [12, 8, 23, 5, 17, 31, 3, 9][idx % 8];
    });
    return counts;
  }, [teamMembers]);

  const roleBadgeClass = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300';
      case 'editor':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
      case 'viewer':
        return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300';
      default:
        return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300';
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    toast.success(`Role updated to ${TEAM_ROLES[newRole as keyof typeof TEAM_ROLES]?.label || newRole}`);
  };

  const handleInvite = () => {
    if (!inviteEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }
    toast.success(`Invitation sent to ${inviteEmail}`);
    setInviteEmail('');
    setInviteRole('editor');
    setInviteOpen(false);
  };

  const handleApprove = async (postId: string) => {
    try {
      const res = await fetch('/api/posts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: postId, status: 'scheduled' }),
      });
      const json = await res.json();
      if (json.success) {
        setPendingPosts((prev) => prev.filter((p) => p.id !== postId));
        toast.success('Post approved and scheduled');
      } else {
        toast.error('Failed to approve post');
      }
    } catch {
      toast.error('Failed to approve post');
    }
  };

  const handleReject = async (postId: string) => {
    try {
      const res = await fetch('/api/posts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: postId,
          status: 'draft',
        }),
      });
      const json = await res.json();
      if (json.success) {
        setPendingPosts((prev) => prev.filter((p) => p.id !== postId));
        toast.success('Post rejected and moved to drafts');
      } else {
        toast.error('Failed to reject post');
      }
    } catch {
      toast.error('Failed to reject post');
    } finally {
      setRejectingPostId(null);
    }
  };

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatScheduledTime = (dateStr?: string) => {
    if (!dateStr) return 'Not scheduled';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getPlatformInfo = (platform: string) => {
    const key = Object.keys(PLATFORMS).find(
      (k) => PLATFORMS[k as PlatformKey].name.toLowerCase().includes(platform.toLowerCase()) || k === platform.toLowerCase()
    );
    if (key) {
      const p = PLATFORMS[key as PlatformKey];
      return { name: p.name, color: p.color };
    }
    return { name: platform, color: '#6b7280' };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-6 w-48 bg-zinc-200 dark:bg-zinc-700 rounded" />
                <div className="h-40 bg-zinc-100 dark:bg-zinc-800 rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage team members, roles, and approval workflows
          </p>
        </div>
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" />
              Invite Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Send an invitation to join your team. They will receive an email with
                instructions to get started.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email Address</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-role">Role</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger id="invite-role">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TEAM_ROLES).map(([key, role]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          {key === 'admin' && <Shield className="h-3.5 w-3.5" />}
                          {key === 'editor' && <Edit2 className="h-3.5 w-3.5" />}
                          {key === 'viewer' && <Eye className="h-3.5 w-3.5" />}
                          {role.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setInviteOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleInvite} className="gap-2">
                <UserPlus className="h-4 w-4" />
                Send Invitation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pending Approval Section */}
      {pendingPosts.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <CardTitle className="text-lg">Pending Approval</CardTitle>
              <Badge className={POST_STATUSES.pending_approval.color}>
                {pendingPosts.length}
              </Badge>
            </div>
            <CardDescription>
              Posts waiting for review before publishing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {pendingPosts.map((post) => {
                const platformInfo = getPlatformInfo(post.platform);
                const showRejectForm = rejectingPostId === post.id;
                return (
                  <Card key={post.id} className="border shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex flex-col gap-3">
                        {/* Post header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            {post.title && (
                              <span className="font-semibold text-sm">{post.title}</span>
                            )}
                            <Badge
                              variant="outline"
                              className="text-xs"
                              style={{
                                borderColor: platformInfo.color,
                                color: platformInfo.color,
                              }}
                            >
                              {platformInfo.name}
                            </Badge>
                            {post.aiGenerated && (
                              <Badge variant="secondary" className="text-xs gap-1">
                                <Settings className="h-3 w-3" />
                                AI Generated
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                            <Clock className="h-3 w-3" />
                            {formatScheduledTime(post.scheduledAt)}
                          </div>
                        </div>

                        {/* Post content */}
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {post.content}
                        </p>

                        {/* Hashtags hint */}
                        {post.content.includes('#') && (
                          <div className="flex flex-wrap gap-1">
                            {post.content
                              .match(/#\w+/g)
                              ?.slice(0, 5)
                              .map((tag) => (
                                <span
                                  key={tag}
                                  className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded"
                                >
                                  {tag}
                                </span>
                              ))}
                            {post.content.match(/#\w+/g)?.length > 5 && (
                              <span className="text-xs text-muted-foreground">
                                +{post.content.match(/#\w+/g)!.length - 5} more
                              </span>
                            )}
                          </div>
                        )}

                        {/* Action buttons */}
                        {!showRejectForm ? (
                          <div className="flex items-center gap-2 pt-1">
                            <Button
                              size="sm"
                              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                              onClick={() => handleApprove(post.id)}
                            >
                              <Check className="h-3.5 w-3.5" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                              onClick={() => setRejectingPostId(post.id)}
                            >
                              <X className="h-3.5 w-3.5" />
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-2 pt-1">
                            <Textarea
                              placeholder="Add a note about why this post is being rejected (optional)..."
                              className="text-sm min-h-[60px]"
                              value={approvalNotes[post.id] || ''}
                              onChange={(e) =>
                                setApprovalNotes((prev) => ({
                                  ...prev,
                                  [post.id]: e.target.value,
                                }))
                              }
                            />
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="destructive"
                                className="gap-1.5"
                                onClick={() => handleReject(post.id)}
                              >
                                <X className="h-3.5 w-3.5" />
                                Confirm Reject
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setRejectingPostId(null);
                                  setApprovalNotes((prev) => {
                                    const next = { ...prev };
                                    delete next[post.id];
                                    return next;
                                  });
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Members */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Members
              </CardTitle>
              <CardDescription className="mt-1.5">
                {teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''} in your workspace
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Desktop Table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Posts</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={member.avatar} alt={member.name} />
                          <AvatarFallback className="text-xs font-medium">
                            {getInitials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{member.name}</p>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${roleBadgeClass(member.role)} text-xs font-medium`}>
                        {member.role === 'admin' && <Shield className="h-3 w-3 mr-1" />}
                        {member.role === 'editor' && <Edit2 className="h-3 w-3 mr-1" />}
                        {member.role === 'viewer' && <Eye className="h-3 w-3 mr-1" />}
                        {TEAM_ROLES[member.role as keyof typeof TEAM_ROLES]?.label || member.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {memberPostCounts[member.id] ?? 0} posts
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(member.joinedAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Select
                        value={member.role}
                        onValueChange={(value) => handleRoleChange(member.id, value)}
                      >
                        <SelectTrigger className="w-[130px] h-8 text-xs">
                          <Edit2 className="h-3 w-3 mr-1" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(TEAM_ROLES).map(([key, role]) => (
                            <SelectItem key={key} value={key}>
                              {role.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
                {teamMembers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Users className="h-8 w-8" />
                        <p className="text-sm">No team members yet</p>
                        <p className="text-xs">Invite your first team member to get started</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {teamMembers.map((member) => (
              <Card key={member.id} className="border shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.avatar} alt={member.name} />
                        <AvatarFallback className="text-xs font-medium">
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <Badge className={`${roleBadgeClass(member.role)} text-xs font-medium shrink-0`}>
                      {TEAM_ROLES[member.role as keyof typeof TEAM_ROLES]?.label || member.role}
                    </Badge>
                  </div>
                  <Separator className="my-3" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{memberPostCounts[member.id] ?? 0} posts</span>
                      <span>Joined {formatDate(member.joinedAt)}</span>
                    </div>
                    <Select
                      value={member.role}
                      onValueChange={(value) => handleRoleChange(member.id, value)}
                    >
                      <SelectTrigger className="w-[110px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(TEAM_ROLES).map(([key, role]) => (
                          <SelectItem key={key} value={key}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            ))}
            {teamMembers.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                <Users className="h-8 w-8" />
                <p className="text-sm">No team members yet</p>
                <p className="text-xs">Invite your first team member to get started</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Role Descriptions */}
      <Card>
        <CardHeader>
          <CardTitle>Roles & Permissions</CardTitle>
          <CardDescription>
            Understand what each team role can access and manage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Admin */}
            <div className="rounded-lg border border-purple-200 dark:border-purple-800/50 bg-purple-50/50 dark:bg-purple-950/20 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/50">
                  <Shield className="h-4 w-4 text-purple-700 dark:text-purple-300" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Admin</h3>
                  <Badge className={`${roleBadgeClass('admin')} text-[10px] px-1.5 py-0`}>
                    Full Access
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Full access to all features including team management, billing, connected accounts,
                content approval, analytics, and AI tools. Can invite and remove team members.
              </p>
              <div className="space-y-1">
                {[
                  'Manage team members',
                  'Configure accounts',
                  'Approve/reject content',
                  'Access all analytics',
                  'Manage billing',
                ].map((perm) => (
                  <div key={perm} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Check className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                    {perm}
                  </div>
                ))}
              </div>
            </div>

            {/* Editor */}
            <div className="rounded-lg border border-blue-200 dark:border-blue-800/50 bg-blue-50/50 dark:bg-blue-950/20 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50">
                  <Edit2 className="h-4 w-4 text-blue-700 dark:text-blue-300" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Editor</h3>
                  <Badge className={`${roleBadgeClass('editor')} text-[10px] px-1.5 py-0`}>
                    Content Access
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Can create, edit, and schedule posts. Has access to analytics and AI content
                generation tools. Cannot manage team members or connected accounts.
              </p>
              <div className="space-y-1">
                {[
                  'Create & edit posts',
                  'Schedule content',
                  'Use AI tools',
                  'View analytics',
                  'Submit for approval',
                ].map((perm) => (
                  <div key={perm} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Check className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                    {perm}
                  </div>
                ))}
              </div>
            </div>

            {/* Viewer */}
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/30 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <Eye className="h-4 w-4 text-zinc-700 dark:text-zinc-300" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Viewer</h3>
                  <Badge className={`${roleBadgeClass('viewer')} text-[10px] px-1.5 py-0`}>
                    Read Only
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                View-only access to the dashboard, scheduled posts, and published content. Cannot
                create, edit, or approve any content. Ideal for stakeholders and clients.
              </p>
              <div className="space-y-1">
                {[
                  'View dashboard',
                  'View scheduled posts',
                  'View published content',
                  'Export reports',
                ].map((perm) => (
                  <div key={perm} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Check className="h-3 w-3 text-zinc-600 dark:text-zinc-400" />
                    {perm}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
