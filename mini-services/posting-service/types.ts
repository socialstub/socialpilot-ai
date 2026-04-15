// ──────────────────────────────────────────────
// SocialPilot Posting Service — Type Definitions
// ──────────────────────────────────────────────

/** Supported social media platforms */
export type Platform = 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'tiktok' | 'youtube';

/** Post priority levels (lower = higher priority) */
export type Priority = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

/** Job status lifecycle */
export type JobStatus = 'queued' | 'scheduled' | 'processing' | 'published' | 'failed' | 'retrying';

/** A single post job to be published */
export interface PostJob {
  id: string;
  postId: string;
  content: string;
  platform: Platform;
  scheduledAt?: string; // ISO date string
  mediaUrls?: string[];
  hashtags?: string[];
  priority: Priority;
  status: JobStatus;
  retryCount: number;
  maxRetries: number;
  createdAt: string;
  publishedAt?: string;
  failedAt?: string;
  lastError?: string;
  platformPostId?: string;
  metadata?: Record<string, unknown>;
}

/** Result returned after a publish attempt */
export interface PublishResult {
  success: boolean;
  platformPostId?: string;
  platformUrl?: string;
  error?: string;
  responseTime: number; // ms
  metadata?: Record<string, unknown>;
}

/** Validation result for a post before publishing */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/** Enqueue request body */
export interface EnqueueRequest {
  postId: string;
  content: string;
  platform: Platform;
  scheduledAt?: string;
  mediaUrls?: string[];
  hashtags?: string[];
  priority?: Priority;
}

/** Publish-now request body */
export interface PublishNowRequest {
  postId: string;
  content: string;
  platform: Platform;
  mediaUrls?: string[];
  hashtags?: string[];
}

/** Bulk publish request body */
export interface BulkPublishRequest {
  postId: string;
  content: string;
  platforms: Platform[];
  mediaUrls?: string[];
  hashtags?: string[];
}

/** Webhook event from a platform */
export interface WebhookEvent {
  id: string;
  platform: Platform;
  type: string; // e.g. 'post_published', 'post_failed', 'engagement_update'
  payload: Record<string, unknown>;
  receivedAt: string;
}

/** Publishing statistics */
export interface PublishingStats {
  totalPublished: number;
  totalFailed: number;
  totalQueued: number;
  successRate: number;
  avgResponseTime: number; // ms
  byPlatform: Record<Platform, {
    published: number;
    failed: number;
    avgTime: number;
    successRate: number;
  }>;
  recentFailures: Array<{
    postId: string;
    platform: Platform;
    error: string;
    timestamp: string;
  }>;
}

/** Rate limit info per platform */
export interface RateLimitInfo {
  platform: Platform;
  remaining: number;
  limit: number;
  resetAt: string;
  windowMs: number;
}

/** Queue status snapshot */
export interface QueueStatus {
  total: number;
  byPriority: Record<string, number>;
  byPlatform: Record<string, number>;
  byStatus: Record<string, number>;
  items: PostJob[];
}

/** Platform adapter interface */
export interface PlatformAdapter {
  name: Platform;
  displayName: string;
  maxContentLength: number;
  supportedMediaTypes: string[];
  rateLimitPerWindow: number;
  rateLimitWindowMs: number;
  publish(post: PostJob): Promise<PublishResult>;
  validate(post: PostJob): ValidationResult;
}

/** Health check response */
export interface HealthResponse {
  status: 'ok' | 'degraded' | 'down';
  uptime: number;
  version: string;
  queueSize: number;
  publishedCount: number;
  failedCount: number;
  timestamp: string;
}

/** API response wrapper */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}
