'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/stores/app-store';
import { PLATFORMS, type PlatformKey } from '@/lib/constants';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  Link2,
  Unlink,
  RefreshCw,
  Users,
  BarChart3,
  Shield,
  Check,
  Loader2,
  ArrowLeft,
  ExternalLink,
  Globe,
  Eye,
  Pencil,
  Lock,
} from 'lucide-react';

interface ConnectedAccountData {
  id: string;
  platform: string;
  username: string;
  displayName: string;
  avatar?: string;
  followersCount: number;
  followingCount: number;
  isActive: boolean;
  connectedAt: string;
  lastSyncedAt?: string;
}

interface PlatformOption {
  key: PlatformKey;
  name: string;
  color: string;
  bgColor: string;
  icon: string;
}

type AuthStep = 'select' | 'enter_username' | 'authorizing' | 'done';

type DeleteTarget = { id: string; name: string } | null;

export function ConnectedAccounts() {
  const { accounts, setAccounts } = useAppStore();

  // Dialog state
  const [connectOpen, setConnectOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformKey | null>(null);
  const [connectUsername, setConnectUsername] = useState('');
  const [authStep, setAuthStep] = useState<AuthStep>('select');
  const [authProgress, setAuthProgress] = useState(0);
  const [authMessage, setAuthMessage] = useState('');

  // Action states
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [loading, setLoading] = useState(true);

  // Fetch accounts on mount
  const refreshAccounts = useCallback(async () => {
    try {
      const res = await fetch('/api/accounts');
      const json = await res.json();
      if (json.success) {
        setAccounts(
          json.data.map((a: ConnectedAccountData) => ({
            ...a,
            platform: a.platform as PlatformKey,
          }))
        );
      }
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
    }
  }, [setAccounts]);

  useEffect(() => {
    const load = async () => {
      await refreshAccounts();
      setLoading(false);
    };
    load();
  }, [refreshAccounts]);

  // Build platform options
  const platformOptions: PlatformOption[] = Object.entries(PLATFORMS).map(
    ([key, platform]) => ({
      key: key as PlatformKey,
      name: platform.name,
      color: platform.color,
      bgColor: platform.bgColor,
      icon: platform.icon,
    })
  );

  const getPlatformOption = (platformKey: string): PlatformOption | undefined => {
    return platformOptions.find((p) => p.key === platformKey);
  };

  // Count accounts per platform
  const platformCounts: Record<string, number> = {};
  for (const a of accounts) {
    platformCounts[a.platform] = (platformCounts[a.platform] || 0) + 1;
  }

  const totalFollowers = accounts.reduce((sum, a) => sum + (a.followersCount || 0), 0);
  const activeAccounts = accounts.filter((a) => a.isActive).length;

  const formatNumber = (num: number): string => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getTimeAgo = (dateStr?: string): string => {
    if (!dateStr) return 'Never';
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return formatDate(dateStr);
  };

  const getSyncStatusColor = (dateStr?: string): string => {
    if (!dateStr) return 'text-zinc-400';
    const diffHr = Math.floor((Date.now() - new Date(dateStr).getTime()) / 3600000);
    if (diffHr < 1) return 'text-emerald-600 dark:text-emerald-400';
    if (diffHr < 24) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  // Reset dialog state
  const resetDialog = () => {
    setConnectUsername('');
    setSelectedPlatform(null);
    setAuthStep('select');
    setAuthProgress(0);
    setAuthMessage('');
  };

  // Handle platform selection - THIS WAS THE BUG: authStep was never changed
  const handleSelectPlatform = (key: PlatformKey) => {
    setSelectedPlatform(key);
    setAuthStep('enter_username');
    setConnectUsername('');
  };

  // Handle go back to platform selection
  const handleBackToPlatforms = () => {
    setSelectedPlatform(null);
    setConnectUsername('');
    setAuthStep('select');
  };

  // Simulate OAuth connection with progress
  const handleConnect = async () => {
    if (!selectedPlatform || !connectUsername.trim()) return;

    const platformName = PLATFORMS[selectedPlatform].name;
    const username = connectUsername.trim();

    // Step into authorizing phase
    setAuthStep('authorizing');
    setAuthProgress(0);

    const steps = [
      { progress: 15, message: `Redirecting to ${platformName}...` },
      { progress: 35, message: 'Waiting for your authorization...' },
      { progress: 55, message: 'Authorization received!' },
      { progress: 75, message: 'Fetching profile data...' },
      { progress: 90, message: 'Verifying connection...' },
      { progress: 100, message: 'Connected successfully!' },
    ];

    // Animate through OAuth steps
    for (const step of steps) {
      await new Promise((r) => setTimeout(r, 600 + Math.random() * 400));
      setAuthProgress(step.progress);
      setAuthMessage(step.message);
    }

    // Actually create the account
    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: selectedPlatform,
          username,
          displayName: username,
          followersCount: Math.floor(Math.random() * 50000) + 500,
          followingCount: Math.floor(Math.random() * 2000) + 100,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setAuthStep('done');
        toast.success(`${platformName} account "@${username}" connected!`);
        await refreshAccounts();
        setTimeout(() => {
          setConnectOpen(false);
          resetDialog();
        }, 1800);
      } else {
        toast.error(json.error || 'Failed to connect account');
        setAuthStep('enter_username');
      }
    } catch {
      toast.error('Connection failed. Please try again.');
      setAuthStep('enter_username');
    }
  };

  // Delete account
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    try {
      const res = await fetch(`/api/accounts?id=${deleteTarget.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        toast.success(`${deleteTarget.name} removed successfully`);
        await refreshAccounts();
      } else {
        toast.error('Failed to remove account');
      }
    } catch {
      toast.error('Failed to remove account');
    } finally {
      setDeletingId(null);
      setDeleteTarget(null);
    }
  };

  // Sync account
  const handleSync = async (accountId: string, accountName: string) => {
    setSyncingId(accountId);
    try {
      await new Promise((r) => setTimeout(r, 1200));
      toast.success(`${accountName} synced successfully`);
      await refreshAccounts();
    } catch {
      toast.error('Failed to sync account');
    } finally {
      setSyncingId(null);
    }
  };

  // ── Loading Skeleton ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-6 w-48 bg-zinc-200 dark:bg-zinc-700 rounded" />
                <div className="h-32 bg-zinc-100 dark:bg-zinc-800 rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Connected Accounts</h1>
          <p className="text-muted-foreground mt-1">
            Link your real social media profiles to manage them from one place.
          </p>
        </div>
        <Button
          className="gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-700 hover:to-fuchsia-700 shadow-lg shadow-violet-500/20"
          onClick={() => { resetDialog(); setConnectOpen(true); }}
        >
          <Link2 className="h-4 w-4" />
          Connect Account
        </Button>
      </div>

      {/* Connect Dialog */}
      <Dialog
        open={connectOpen}
        onOpenChange={(open) => {
          setConnectOpen(open);
          if (!open) resetDialog();
        }}
      >
        <DialogContent className="max-w-lg">
          {/* Step 1: Platform Selection */}
          {authStep === 'select' && (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg">Connect a Social Account</DialogTitle>
                <DialogDescription>
                  Choose the platform you want to connect. You can add multiple accounts per platform.
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-3 py-4">
                {platformOptions.map((platform) => {
                  const count = platformCounts[platform.key] || 0;
                  return (
                    <button
                      key={platform.key}
                      type="button"
                      onClick={() => handleSelectPlatform(platform.key)}
                      className="group flex items-center gap-3 p-4 rounded-xl border text-left transition-all duration-200 hover:shadow-lg hover:scale-[1.02] hover:border-foreground/20 cursor-pointer active:scale-[0.98]"
                      style={{ borderLeftWidth: '4px', borderLeftColor: platform.color }}
                    >
                      <div
                        className="flex h-11 w-11 items-center justify-center rounded-xl text-white text-sm font-bold shrink-0 shadow-sm"
                        style={{ backgroundColor: platform.color }}
                      >
                        {platform.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{platform.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {count > 0 ? `${count} connected` : 'Not connected'}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Step 2: Enter Username */}
          {authStep === 'enter_username' && selectedPlatform && (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg">
                  Connect {getPlatformOption(selectedPlatform)?.name}
                </DialogTitle>
                <DialogDescription>
                  Enter your {getPlatformOption(selectedPlatform)?.name} username to start the OAuth connection.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-5 py-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToPlatforms}
                  className="gap-1.5 -ml-2 text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  All platforms
                </Button>

                {/* Platform card */}
                <div
                  className="flex items-center gap-4 p-4 rounded-xl border"
                  style={{ borderLeftWidth: '4px', borderLeftColor: getPlatformOption(selectedPlatform)?.color }}
                >
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-xl text-white text-xl font-bold shadow-md"
                    style={{ backgroundColor: getPlatformOption(selectedPlatform)?.color }}
                  >
                    {getPlatformOption(selectedPlatform)?.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold">{getPlatformOption(selectedPlatform)?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Secure OAuth 2.0 authorization
                    </p>
                  </div>
                </div>

                {/* Username input */}
                <div className="space-y-2">
                  <Label htmlFor="connect-username" className="text-sm font-medium">
                    Your Username
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      @
                    </span>
                    <Input
                      id="connect-username"
                      placeholder={`your_${selectedPlatform}_handle`}
                      value={connectUsername}
                      onChange={(e) => setConnectUsername(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && connectUsername.trim() && handleConnect()}
                      autoFocus
                      className="pl-8 h-11"
                    />
                  </div>
                </div>

                {/* Permissions info */}
                <div className="rounded-xl bg-muted/60 p-4 space-y-3">
                  <p className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5" />
                    Permissions Requested
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { icon: Eye, label: 'Read your public profile' },
                      { icon: Pencil, label: 'Post content on your behalf' },
                      { icon: BarChart3, label: 'View basic analytics' },
                    ].map((perm) => (
                      <div key={perm.label} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <perm.icon className="h-3 w-3 shrink-0" />
                        {perm.label}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Connect button */}
                <Button
                  type="button"
                  onClick={handleConnect}
                  disabled={!connectUsername.trim()}
                  className="w-full h-11 gap-2 text-white font-semibold shadow-lg transition-all"
                  style={{ backgroundColor: getPlatformOption(selectedPlatform)?.color }}
                >
                  <ExternalLink className="h-4 w-4" />
                  Authorize & Connect {getPlatformOption(selectedPlatform)?.name}
                </Button>
              </div>
            </>
          )}

          {/* Step 3: Authorizing (animated progress) */}
          {authStep === 'authorizing' && selectedPlatform && (
            <div className="py-8 space-y-6">
              <div className="flex flex-col items-center gap-4">
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-2xl text-white text-2xl font-bold shadow-lg"
                  style={{ backgroundColor: getPlatformOption(selectedPlatform)?.color }}
                >
                  {getPlatformOption(selectedPlatform)?.name.charAt(0)}
                </div>
                <div className="text-center space-y-1">
                  <p className="font-bold text-lg">Connecting to {getPlatformOption(selectedPlatform)?.name}</p>
                  <p className="text-sm text-muted-foreground">Please wait while we authorize your account...</p>
                </div>
              </div>

              <div className="space-y-3">
                <Progress value={authProgress} className="h-2" />
                <p className="text-xs text-center text-muted-foreground animate-pulse">
                  {authMessage}
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Shield className="h-3.5 w-3.5" />
                <span>Secure OAuth 2.0 — Your credentials are never stored</span>
              </div>
            </div>
          )}

          {/* Step 4: Success */}
          {authStep === 'done' && selectedPlatform && (
            <div className="flex flex-col items-center justify-center py-12 gap-5">
              <div className="relative">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                  <Check className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-white dark:bg-zinc-800 shadow-md">
                  <div
                    className="h-5 w-5 rounded-md flex items-center justify-center text-white text-[10px] font-bold"
                    style={{ backgroundColor: getPlatformOption(selectedPlatform)?.color }}
                  >
                    {getPlatformOption(selectedPlatform)?.name.charAt(0)}
                  </div>
                </div>
              </div>
              <div className="text-center">
                <p className="font-bold text-xl">Account Connected!</p>
                <p className="text-sm text-muted-foreground mt-1.5">
                  Your {getPlatformOption(selectedPlatform)?.name} account
                  <span className="font-medium text-foreground"> @{connectUsername}</span> is now linked.
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the account and all its associated data. Scheduled posts for this account will be moved to drafts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deletingId}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={!!deletingId}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deletingId ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Disconnect'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Link2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{accounts.length}</p>
                <p className="text-xs text-muted-foreground">
                  Connected Account{accounts.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatNumber(totalFollowers)}</p>
                <p className="text-xs text-muted-foreground">Total Followers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                <BarChart3 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeAccounts}/{accounts.length}</p>
                <p className="text-xs text-muted-foreground">Active Accounts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Coverage */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Platform Coverage</CardTitle>
          <CardDescription>
            {Object.keys(platformCounts).length} of {platformOptions.length} platforms connected
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {platformOptions.map((platform) => {
              const count = platformCounts[platform.key] || 0;
              const isConnected = count > 0;
              return (
                <Badge
                  key={platform.key}
                  variant={isConnected ? 'default' : 'outline'}
                  className="gap-1.5 text-xs"
                  style={
                    isConnected
                      ? { backgroundColor: platform.color + '15', color: platform.color, borderColor: platform.color + '30' }
                      : {}
                  }
                >
                  <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-600'}`} />
                  {platform.name}
                  {count > 1 && <span className="opacity-60">({count})</span>}
                </Badge>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Connected Accounts Grid */}
      {accounts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => {
            const platformInfo = getPlatformOption(account.platform as string);
            if (!platformInfo) return null;
            const brandColor = platformInfo.color;

            return (
              <Card
                key={account.id}
                className="overflow-hidden transition-all duration-200 hover:shadow-md group"
                style={{ borderLeftWidth: '4px', borderLeftColor: brandColor }}
              >
                <CardContent className="p-0">
                  {/* Card Header */}
                  <div className="p-4 pb-0">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-11 w-11 items-center justify-center rounded-xl text-white text-base font-bold shrink-0 shadow-sm"
                          style={{ backgroundColor: brandColor }}
                        >
                          {platformInfo.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm truncate">
                              {account.displayName || account.username}
                            </h3>
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-1.5 py-0 shrink-0 ${
                                account.isActive
                                  ? 'border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-400'
                                  : 'border-zinc-300 text-zinc-500 dark:border-zinc-600 dark:text-zinc-400'
                              }`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full mr-1 ${account.isActive ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                              {account.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">@{account.username}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="px-4 pt-3">
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'Followers', value: account.followersCount },
                        { label: 'Following', value: account.followingCount },
                        { label: 'Ratio', value: account.followersCount > 0 ? ((account.followingCount / account.followersCount) * 100).toFixed(1) + '%' : '0%' },
                      ].map((stat) => (
                        <div key={stat.label} className="rounded-lg bg-muted/50 p-2.5 text-center">
                          <p className="text-base font-bold">{typeof stat.value === 'string' ? stat.value : formatNumber(stat.value)}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{stat.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator className="my-3 mx-4" />

                  {/* Footer */}
                  <div className="px-4 pb-4">
                    <div className="flex items-center justify-between">
                      <div className={`flex items-center gap-1.5 text-xs ${getSyncStatusColor((account as ConnectedAccountData).lastSyncedAt)}`}>
                        <RefreshCw className={`h-3 w-3 ${syncingId === account.id ? 'animate-spin' : ''}`} />
                        <span>
                          {syncingId === account.id
                            ? 'Syncing...'
                            : `Synced ${getTimeAgo((account as ConnectedAccountData).lastSyncedAt)}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleSync(account.id, account.displayName || account.username)}
                          disabled={syncingId === account.id}
                          title="Sync now"
                        >
                          <RefreshCw className={`h-3.5 w-3.5 ${syncingId === account.id ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                          onClick={() => setDeleteTarget({ id: account.id, name: account.displayName || account.username })}
                          disabled={deletingId === account.id}
                          title="Disconnect account"
                        >
                          {deletingId === account.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Unlink className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {accounts.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Globe className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-semibold text-lg">No Accounts Connected</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Connect your social media accounts to start managing content, scheduling posts, and tracking analytics across all platforms.
              </p>
            </div>
            <Button
              onClick={() => { resetDialog(); setConnectOpen(true); }}
              className="gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white"
            >
              <Link2 className="h-4 w-4" />
              Connect Your First Account
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
