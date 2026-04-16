'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Eye,
  EyeOff,
  ExternalLink,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Save,
  Trash2,
  AlertTriangle,
  Shield,
  Globe,
  Info,
  Loader2,
  BookOpen,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
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
import { PLATFORM_OAUTH_CONFIGS, type PlatformOAuthConfig } from '@/lib/oauth/config';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────────────

interface OAuthSetting {
  id?: string;
  platform: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  isEnabled: boolean;
  scopes: string;
  isConfigured: boolean;
}

interface PlatformFormData {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  isEnabled: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function getPlatformList(): PlatformOAuthConfig[] {
  return Object.values(PLATFORM_OAUTH_CONFIGS);
}

function getPlatformIcon(platform: string) {
  const name = platform.toLowerCase();
  switch (name) {
    case 'facebook':
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      );
    case 'instagram':
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
        </svg>
      );
    case 'twitter':
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case 'linkedin':
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      );
    case 'tiktok':
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
        </svg>
      );
    case 'youtube':
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      );
    default:
      return <Globe className="h-5 w-5" />;
  }
}

// ── Main Component ─────────────────────────────────────────────────────────

export function OAuthSettings() {
  const [settings, setSettings] = useState<Record<string, OAuthSetting>>({});
  const [formData, setFormData] = useState<Record<string, PlatformFormData>>({});
  const [expandedPlatforms, setExpandedPlatforms] = useState<Set<string>>(new Set());
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingPlatform, setSavingPlatform] = useState<string | null>(null);
  const [deleteDialogPlatform, setDeleteDialogPlatform] = useState<string | null>(null);

  const callbackUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/oauth/callback`
      : '/api/oauth/callback';

  const platforms = getPlatformList();

  // ── Fetch settings ─────────────────────────────────────────────────────

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/oauth/settings');
      const json = await res.json();

      if (json.success && json.data) {
        const settingsMap: Record<string, OAuthSetting> = {};
        const formDataMap: Record<string, PlatformFormData> = {};

        for (const s of json.data) {
          settingsMap[s.platform] = s;
          formDataMap[s.platform] = {
            clientId: s.clientId || '',
            clientSecret: '', // Don't populate secret from API (masked)
            redirectUri: s.redirectUri || callbackUrl,
            isEnabled: s.isEnabled,
          };
        }

        // Initialize form data for platforms without saved settings
        for (const p of platforms) {
          if (!formDataMap[p.platform]) {
            formDataMap[p.platform] = {
              clientId: '',
              clientSecret: '',
              redirectUri: callbackUrl,
              isEnabled: false,
            };
          }
        }

        setSettings(settingsMap);
        setFormData(formDataMap);
      }
    } catch (err) {
      console.error('Failed to fetch OAuth settings:', err);
      toast.error('Failed to load OAuth settings');
    } finally {
      setLoading(false);
    }
  }, [callbackUrl]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // ── Handlers ───────────────────────────────────────────────────────────

  const updateFormField = (platform: string, field: keyof PlatformFormData, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        [field]: value,
      },
    }));
  };

  const handleSave = async (platformKey: string) => {
    const config = PLATFORM_OAUTH_CONFIGS[platformKey];
    const data = formData[platformKey];

    if (!data.clientId.trim()) {
      toast.error(`${config.name}: Client ID is required`);
      return;
    }

    // For new configs or when secret is entered
    const existingSetting = settings[platformKey];
    if (!existingSetting && !data.clientSecret.trim()) {
      toast.error(`${config.name}: Client Secret is required for new configuration`);
      return;
    }

    setSavingPlatform(platformKey);
    try {
      const body: Record<string, unknown> = {
        platform: platformKey,
        clientId: data.clientId.trim(),
        redirectUri: data.redirectUri || callbackUrl,
        scopes: config.defaultScopes,
        isEnabled: data.isEnabled,
      };

      // Only send clientSecret if it's been entered (not empty)
      // If it's empty and we're updating, keep the existing one
      if (data.clientSecret.trim()) {
        body.clientSecret = data.clientSecret.trim();
      } else if (existingSetting) {
        // Updating without changing secret — API should keep old one
        // We need to send it, but we don't have the real one (it's masked)
        // So we skip — the API will keep existing value
        body.clientSecret = existingSetting.clientSecret;
      }

      const res = await fetch('/api/oauth/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const json = await res.json();

      if (json.success) {
        toast.success(`${config.name} settings saved successfully`);
        // Clear the secret field after saving (since API masks it)
        updateFormField(platformKey, 'clientSecret', '');
        await fetchSettings();
      } else {
        toast.error(json.error || `Failed to save ${config.name} settings`);
      }
    } catch {
      toast.error(`Failed to save ${config.name} settings`);
    } finally {
      setSavingPlatform(null);
    }
  };

  const handleToggle = async (platformKey: string, enabled: boolean) => {
    const config = PLATFORM_OAUTH_CONFIGS[platformKey];
    updateFormField(platformKey, 'isEnabled', enabled);

    try {
      const res = await fetch('/api/oauth/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: platformKey, isEnabled: enabled }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(
          enabled ? `${config.name} enabled` : `${config.name} disabled`
        );
        await fetchSettings();
      } else {
        toast.error(`Failed to update ${config.name}`);
        updateFormField(platformKey, 'isEnabled', !enabled);
      }
    } catch {
      toast.error(`Failed to update ${config.name}`);
      updateFormField(platformKey, 'isEnabled', !enabled);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialogPlatform) return;
    const config = PLATFORM_OAUTH_CONFIGS[deleteDialogPlatform];

    try {
      const res = await fetch(
        `/api/oauth/settings?platform=${deleteDialogPlatform}`,
        { method: 'DELETE' }
      );
      const json = await res.json();

      if (json.success) {
        toast.success(`${config.name} configuration deleted`);
        setFormData((prev) => ({
          ...prev,
          [deleteDialogPlatform]: {
            clientId: '',
            clientSecret: '',
            redirectUri: callbackUrl,
            isEnabled: false,
          },
        }));
        await fetchSettings();
      } else {
        toast.error(json.error || `Failed to delete ${config.name}`);
      }
    } catch {
      toast.error(`Failed to delete ${config.name}`);
    } finally {
      setDeleteDialogPlatform(null);
    }
  };

  const handleCopyCallbackUrl = async () => {
    try {
      await navigator.clipboard.writeText(callbackUrl);
      setCopied(true);
      toast.success('Callback URL copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy URL');
    }
  };

  const toggleInstructions = (platform: string) => {
    setExpandedPlatforms((prev) => {
      const next = new Set(prev);
      if (next.has(platform)) {
        next.delete(platform);
      } else {
        next.add(platform);
      }
      return next;
    });
  };

  const toggleShowSecret = (platform: string) => {
    setShowSecrets((prev) => ({
      ...prev,
      [platform]: !prev[platform],
    }));
  };

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto space-y-6">
      {/* ── Header Section ───────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-start gap-3 mb-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 shrink-0">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">OAuth Configuration</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Configure your social media app credentials to enable real account connections
            </p>
          </div>
        </div>

        <Alert className="mt-4 border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Important:</strong> Enter your app&apos;s OAuth credentials from each platform&apos;s developer
            portal. These credentials are required to authenticate and connect real social media accounts.
          </AlertDescription>
        </Alert>
      </motion.div>

      {/* ── Callback URL Section ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted shrink-0 mt-0.5">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">OAuth Callback URL</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Use this URL in each platform&apos;s developer portal redirect settings
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <code className="text-xs bg-muted px-2.5 py-1.5 rounded-md font-mono break-all select-all">
                      {callbackUrl}
                    </code>
                  </div>
                </div>
              </div>
              <Button
                variant={copied ? 'default' : 'outline'}
                size="sm"
                onClick={handleCopyCallbackUrl}
                className="shrink-0 gap-1.5"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy URL
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Platform Cards Grid ──────────────────────────────────────────── */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {platforms.map((p) => (
            <Card key={p.platform} className="overflow-hidden">
              <CardContent className="p-5 space-y-4">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-9 w-24" />
                  <Skeleton className="h-9 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {platforms.map((platform, index) => (
            <PlatformCard
              key={platform.platform}
              platform={platform}
              setting={settings[platform.platform]}
              formData={formData[platform.platform]}
              isExpanded={expandedPlatforms.has(platform.platform)}
              showSecret={!!showSecrets[platform.platform]}
              isSaving={savingPlatform === platform.platform}
              onSave={() => handleSave(platform.platform)}
              onToggle={(enabled) => handleToggle(platform.platform, enabled)}
              onDelete={() => setDeleteDialogPlatform(platform.platform)}
              onToggleInstructions={() => toggleInstructions(platform.platform)}
              onToggleSecret={() => toggleShowSecret(platform.platform)}
              onFieldChange={(field, value) =>
                updateFormField(platform.platform, field, value)
              }
              index={index}
            />
          ))}
        </div>
      )}

      {/* ── Delete Confirmation Dialog ───────────────────────────────────── */}
      <AlertDialog
        open={!!deleteDialogPlatform}
        onOpenChange={(open) => !open && setDeleteDialogPlatform(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete OAuth Configuration</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the OAuth configuration for{' '}
              <strong>
                {deleteDialogPlatform
                  ? PLATFORM_OAUTH_CONFIGS[deleteDialogPlatform]?.name
                  : ''}
              </strong>
              ? This will disconnect all accounts using these credentials. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── Platform Card Component ────────────────────────────────────────────────

interface PlatformCardProps {
  platform: PlatformOAuthConfig;
  setting?: OAuthSetting;
  formData: PlatformFormData;
  isExpanded: boolean;
  showSecret: boolean;
  isSaving: boolean;
  index: number;
  onSave: () => void;
  onToggle: (enabled: boolean) => void;
  onDelete: () => void;
  onToggleInstructions: () => void;
  onToggleSecret: () => void;
  onFieldChange: (field: keyof PlatformFormData, value: string | boolean) => void;
}

function PlatformCard({
  platform,
  setting,
  formData,
  isExpanded,
  showSecret,
  isSaving,
  index,
  onSave,
  onToggle,
  onDelete,
  onToggleInstructions,
  onToggleSecret,
  onFieldChange,
}: PlatformCardProps) {
  const isConfigured = setting?.isConfigured ?? false;
  const hasExistingConfig = !!setting?.id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.05 * index }}
    >
      <Card
        className="overflow-hidden border transition-shadow hover:shadow-md"
        style={{ borderLeftWidth: '4px', borderLeftColor: platform.color }}
      >
        {/* Card Header */}
        <CardHeader className="pb-3 p-4 lg:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0"
                style={{ backgroundColor: `${platform.color}15`, color: platform.color }}
              >
                {getPlatformIcon(platform.platform)}
              </div>
              <div className="min-w-0">
                <CardTitle className="text-base">{platform.name}</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  {isConfigured ? 'Ready to connect accounts' : 'Not yet configured'}
                </CardDescription>
              </div>
            </div>

            {/* Status Badge */}
            <Badge
              variant={isConfigured ? 'default' : 'secondary'}
              className={cn(
                'shrink-0 text-[11px] font-medium gap-1',
                isConfigured
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 hover:bg-emerald-100'
                  : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
              )}
            >
              {isConfigured ? (
                <>
                  <CheckCircle2 className="h-3 w-3" />
                  Configured
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3" />
                  Not Configured
                </>
              )}
            </Badge>
          </div>

          {/* Quick Links */}
          <div className="flex items-center gap-3 mt-3">
            <a
              href={platform.developerPortalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
            >
              Get credentials
              <ExternalLink className="h-3 w-3" />
            </a>
            <a
              href={platform.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <BookOpen className="h-3 w-3" />
              Documentation
            </a>
          </div>
        </CardHeader>

        <Separator />

        {/* Card Body */}
        <CardContent className="p-4 lg:p-5 space-y-4">
          {/* Client ID */}
          <div className="space-y-1.5">
            <Label htmlFor={`client-id-${platform.platform}`} className="text-xs font-medium">
              Client ID
            </Label>
            <Input
              id={`client-id-${platform.platform}`}
              placeholder={`Enter your ${platform.name} Client ID`}
              value={formData.clientId}
              onChange={(e) => onFieldChange('clientId', e.target.value)}
              className="h-9 text-sm"
            />
          </div>

          {/* Client Secret */}
          <div className="space-y-1.5">
            <Label htmlFor={`client-secret-${platform.platform}`} className="text-xs font-medium">
              Client Secret
            </Label>
            <div className="relative">
              <Input
                id={`client-secret-${platform.platform}`}
                type={showSecret ? 'text' : 'password'}
                placeholder={
                  hasExistingConfig
                    ? 'Enter new secret to update (leave blank to keep existing)'
                    : `Enter your ${platform.name} Client Secret`
                }
                value={formData.clientSecret}
                onChange={(e) => onFieldChange('clientSecret', e.target.value)}
                className="h-9 text-sm pr-10"
              />
              <button
                type="button"
                onClick={onToggleSecret}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5"
                aria-label={showSecret ? 'Hide secret' : 'Show secret'}
              >
                {showSecret ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Redirect URI */}
          <div className="space-y-1.5">
            <Label htmlFor={`redirect-uri-${platform.platform}`} className="text-xs font-medium">
              Redirect URI
            </Label>
            <Input
              id={`redirect-uri-${platform.platform}`}
              value={formData.redirectUri}
              onChange={(e) => onFieldChange('redirectUri', e.target.value)}
              className="h-9 text-sm font-mono text-xs"
            />
            <p className="text-[11px] text-muted-foreground">
              Must match the redirect URL in your developer portal
            </p>
          </div>

          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2">
              <Label htmlFor={`enable-${platform.platform}`} className="text-xs font-medium cursor-pointer">
                Enable OAuth
              </Label>
              {formData.isEnabled && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                  Active
                </Badge>
              )}
            </div>
            <Switch
              id={`enable-${platform.platform}`}
              checked={formData.isEnabled}
              onCheckedChange={onToggle}
            />
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={onSave}
              disabled={isSaving || !formData.clientId.trim()}
              className="gap-1.5"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  Save
                </>
              )}
            </Button>

            {hasExistingConfig && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            )}

            <div className="flex-1" />

            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleInstructions}
              className="gap-1.5 text-muted-foreground"
            >
              <Info className="h-3.5 w-3.5" />
              {isExpanded ? 'Hide' : 'Setup'} Guide
              {isExpanded ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>

          {/* Expandable Setup Instructions */}
          <AnimatePresence initial={false}>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="rounded-lg bg-muted/50 p-3 mt-2 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Setup Instructions
                  </p>
                  <ol className="space-y-1.5">
                    {platform.instructions.map((step, i) => (
                      <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span className="leading-relaxed">{step}</span>
                      </li>
                    ))}
                  </ol>
                  <div className="pt-1">
                    <a
                      href={platform.developerPortalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                    >
                      Open Developer Portal
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}


