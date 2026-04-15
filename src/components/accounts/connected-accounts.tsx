'use client';

import { useState, useEffect } from 'react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
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

export function ConnectedAccounts() {
  const { accounts, setAccounts } = useAppStore();
  const [connectOpen, setConnectOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformKey | null>(null);
  const [connectUsername, setConnectUsername] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authStep, setAuthStep] = useState<'select' | 'auth' | 'done'>('select');

  useEffect(() => {
    async function fetchAccounts() {
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
      } finally {
        setLoading(false);
      }
    }
    fetchAccounts();
  }, [setAccounts]);

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

  // Count accounts per platform (allows multi-account)
  const platformCounts: Record<string, number> = {};
  for (const a of accounts) {
    platformCounts[a.platform] = (platformCounts[a.platform] || 0) + 1;
  }

  const totalFollowers = accounts.reduce(
    (sum, a) => sum + (a.followersCount || 0),
    0
  );
  const totalFollowing = accounts.reduce(
    (sum, a) => sum + (a.followingCount || 0),
    0
  );
  const activeAccounts = accounts.filter((a) => a.isActive).length;

  const formatNumber = (num: number): string => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
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
    const now = new Date();
    const date = new Date(dateStr);
    const diffHr = Math.floor((now.getTime() - date.getTime()) / 3600000);
    if (diffHr < 1) return 'text-emerald-600 dark:text-emerald-400';
    if (diffHr < 24) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const refreshAccounts = async () => {
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
  };

  const handleConnect = async () => {
    if (!selectedPlatform || !connectUsername.trim()) return;
    setConnecting(true);
    setAuthStep('auth');
    try {
      // Simulate OAuth authorization flow
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const platform = PLATFORMS[selectedPlatform];
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: selectedPlatform,
          username: connectUsername.trim(),
          displayName: connectUsername.trim(),
          followersCount: Math.floor(Math.random() * 50000) + 500,
          followingCount: Math.floor(Math.random() * 2000) + 100,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setAuthStep('done');
        toast.success(`${platform.name} account "@${connectUsername.trim()}" connected successfully!`);
        await refreshAccounts();
        setTimeout(() => {
          setConnectUsername('');
          setSelectedPlatform(null);
          setConnectOpen(false);
          setAuthStep('select');
        }, 1500);
      } else {
        toast.error('Failed to connect account');
        setAuthStep('select');
      }
    } catch {
      toast.error('Connection failed. Please try again.');
      setAuthStep('select');
    } finally {
      setConnecting(false);
    }
  };

  const handleDelete = async (accountId: string, accountName: string) => {
    setDeletingId(accountId);
    try {
      const res = await fetch(`/api/accounts?id=${accountId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`${accountName} removed successfully`);
        await refreshAccounts();
      } else {
        toast.error('Failed to remove account');
      }
    } catch {
      toast.error('Failed to remove account');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSync = async (accountId: string, accountName: string) => {
    setSyncingId(accountId);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success(`${accountName} synced successfully`);
      await refreshAccounts();
    } catch {
      toast.error('Failed to sync account');
    } finally {
      setSyncingId(null);
    }
  };

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Connected Accounts</h1>
          <p className="text-muted-foreground mt-1">
            Manage your social media connections. Connect multiple accounts per platform.
          </p>
        </div>
        <Dialog open={connectOpen} onOpenChange={(open) => { setConnectOpen(open); if (!open) { setAuthStep('select'); setSelectedPlatform(null); setConnectUsername(''); } }}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-700 hover:to-fuchsia-700 shadow-lg shadow-violet-500/20">
              <Link2 className="h-4 w-4" />
              Connect Account
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            {/* Step 1: Platform Selection */}
            {authStep === 'select' && (
              <>
                <DialogHeader>
                  <DialogTitle>Connect a New Account</DialogTitle>
                  <DialogDescription>
                    Choose a platform. You can connect multiple accounts per platform.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-3 py-4">
                  {platformOptions.map((platform) => (
                    <button
                      key={platform.key}
                      onClick={() => setSelectedPlatform(platform.key)}
                      className="flex items-center gap-3 p-4 rounded-lg border text-left transition-all hover:shadow-md hover:border-foreground/20 cursor-pointer"
                      style={{ borderLeftWidth: '3px', borderLeftColor: platform.color }}
                    >
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-lg text-white text-sm font-bold shrink-0"
                        style={{ backgroundColor: platform.color }}
                      >
                        {platform.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{platform.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {platformCounts[platform.key]
                            ? `${platformCounts[platform.key]} connected`
                            : 'Not connected'}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Step 2: Authorization */}
            {authStep === 'auth' && selectedPlatform && (
              <>
                <DialogHeader>
                  <DialogTitle>Authorizing {getPlatformOption(selectedPlatform)?.name}</DialogTitle>
                  <DialogDescription>
                    Enter your username to complete the connection.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setSelectedPlatform(null); setAuthStep('select'); }}
                    className="gap-1 -ml-2"
                  >
                    ← Back to platforms
                  </Button>
                  <div className="flex items-center gap-3 p-4 rounded-lg border" style={{ borderLeftWidth: '3px', borderLeftColor: getPlatformOption(selectedPlatform)?.color }}>
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-xl text-white text-lg font-bold"
                      style={{ backgroundColor: getPlatformOption(selectedPlatform)?.color }}
                    >
                      {getPlatformOption(selectedPlatform)?.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold">{getPlatformOption(selectedPlatform)?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Connect your account to start managing content
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="connect-username">
                      {getPlatformOption(selectedPlatform)?.name} Username
                    </Label>
                    <Input
                      id="connect-username"
                      placeholder={`@your_${selectedPlatform}_handle`}
                      value={connectUsername}
                      onChange={(e) => setConnectUsername(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
                      autoFocus
                    />
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
                    <p className="font-medium text-foreground/80 flex items-center gap-1.5">
                      <Shield className="h-3.5 w-3.5" />
                      Secure OAuth 2.0 Connection
                    </p>
                    <ul className="list-disc list-inside space-y-0.5 ml-4">
                      <li>Read your profile information</li>
                      <li>Post content on your behalf</li>
                      <li>View basic analytics</li>
                    </ul>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setConnectOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleConnect}
                    disabled={!connectUsername.trim() || connecting}
                    className="gap-2"
                    style={{ backgroundColor: getPlatformOption(selectedPlatform)?.color }}
                  >
                    {connecting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Authorizing...
                      </>
                    ) : (
                      <>
                        <Link2 className="h-4 w-4" />
                        Connect {getPlatformOption(selectedPlatform)?.name}
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </>
            )}

            {/* Step 3: Success */}
            {authStep === 'done' && (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                  <Check className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-lg">Account Connected!</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your {getPlatformOption(selectedPlatform)?.name} account is now linked.
                  </p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

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
          <CardDescription>{Object.keys(platformCounts).length} of {platformOptions.length} platforms connected</CardDescription>
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
              <Card key={account.id} className="overflow-hidden transition-shadow hover:shadow-md" style={{ borderLeftWidth: '4px', borderLeftColor: brandColor }}>
                <CardContent className="p-0">
                  {/* Card Header */}
                  <div className="p-4 pb-0">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-11 w-11 items-center justify-center rounded-xl text-white text-base font-bold shrink-0"
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
                          <p className="text-xs text-muted-foreground truncate">
                            @{account.username}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="px-4 pt-3">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                        <p className="text-base font-bold">{formatNumber(account.followersCount)}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Followers</p>
                      </div>
                      <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                        <p className="text-base font-bold">{formatNumber(account.followingCount)}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Following</p>
                      </div>
                      <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                        <p className="text-base font-bold">
                          {account.followersCount > 0
                            ? ((account.followingCount / account.followersCount) * 100).toFixed(1)
                            : 0}%
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Ratio</p>
                      </div>
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
                      <div className="flex items-center gap-1">
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
                          onClick={() => handleDelete(account.id, account.displayName || account.username)}
                          disabled={deletingId === account.id}
                          title="Remove account"
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
              <Link2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-semibold text-lg">No Accounts Connected</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Connect your social media accounts to start managing content, scheduling posts, and tracking analytics.
              </p>
            </div>
            <Button
                onClick={() => setConnectOpen(true)}
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
