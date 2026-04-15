// ──────────────────────────────────────────────────────────────
// SocialPilot Posting Service — Main Entry Point
// ──────────────────────────────────────────────────────────────
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type {
  Platform,
  Priority,
  PostJob,
  EnqueueRequest,
  PublishNowRequest,
  BulkPublishRequest,
  WebhookEvent,
  RateLimitInfo,
} from './types.js';
import { PostQueue } from './queue.js';
import { getAdapter, getSupportedPlatforms } from './adapters.js';

// ── ANSI colours ─────────────────────────────────────────────
const CYAN   = '\x1b[36m';
const GREEN  = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED    = '\x1b[31m';
const MAGENTA= '\x1b[35m';
const BOLD   = '\x1b[1m';
const DIM    = '\x1b[2m';
const RESET  = '\x1b[0m';

// ── Service bootstrap ────────────────────────────────────────
const PORT = 3010;
const VERSION = '1.0.0';
const startTime = Date.now();

// Print banner
console.log('');
console.log(`  ${MAGENTA}${BOLD}═══════════════════════════════════════════════════════${RESET}`);
console.log(`  ${CYAN}${BOLD}  🚀  SocialPilot Posting Service v${VERSION}${RESET}`);
console.log(`  ${MAGENTA}${BOLD}═══════════════════════════════════════════════════════${RESET}`);
console.log(`  ${DIM}  Priority Queue  │  6 Platform Adapters  │  Webhooks${RESET}`);
console.log(`  ${DIM}  Rate Limiter    │  Scheduled Posts      │  Bulk API${RESET}`);
console.log(`  ${MAGENTA}${BOLD}───────────────────────────────────────────────────────${RESET}`);
console.log('');

// ── Queue instance ───────────────────────────────────────────
const queue = new PostQueue();

// Initialise platform stats
for (const p of getSupportedPlatforms()) {
  queue.ensurePlatformStats(p);
}

// ── Webhook event store ──────────────────────────────────────
const webhookEvents: WebhookEvent[] = [];

// ── Hono app ─────────────────────────────────────────────────
const app = new Hono();

// Middleware
app.use('*', cors());

// Helper: json response wrapper
function ok<T>(data: T, c: any) {
  return c.json({ success: true, data, timestamp: new Date().toISOString() });
}
function err(message: string, status = 400, c: any) {
  return c.json({ success: false, error: message, timestamp: new Date().toISOString() }, status);
}

// Helper: generate unique job id
function jobId(): string {
  return `job_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// Helper: create a PostJob from request data
function createJob(
  data: { postId: string; content: string; platform: Platform; scheduledAt?: string; mediaUrls?: string[]; hashtags?: string[] },
  priority: Priority = 5,
): PostJob {
  queue.ensurePlatformStats(data.platform);
  return {
    id: jobId(),
    postId: data.postId,
    content: data.content,
    platform: data.platform,
    scheduledAt: data.scheduledAt,
    mediaUrls: data.mediaUrls,
    hashtags: data.hashtags,
    priority,
    status: data.scheduledAt ? 'scheduled' : 'queued',
    retryCount: 0,
    maxRetries: 3,
    createdAt: new Date().toISOString(),
  };
}

// ══════════════════════════════════════════════════════════════
//  ROUTES
// ══════════════════════════════════════════════════════════════

// ── Health Check ─────────────────────────────────────────────
app.get('/health', (c) => {
  const hc = queue.getHistoryCount();
  return ok({
    status: 'ok',
    uptime: Math.floor((Date.now() - startTime) / 1000),
    version: VERSION,
    queueSize: queue.getSize(),
    publishedCount: hc.published,
    failedCount: hc.failed,
    timestamp: new Date().toISOString(),
  }, c);
});

// ── Queue Status ─────────────────────────────────────────────
app.get('/queue', (c) => {
  return ok(queue.getStatus(), c);
});

// ── Enqueue ──────────────────────────────────────────────────
app.post('/enqueue', async (c) => {
  try {
    const body = await c.req.json<EnqueueRequest>();

    if (!body.postId || !body.content || !body.platform) {
      return err('Missing required fields: postId, content, platform', 400, c);
    }

    const adapter = getAdapter(body.platform);
    if (!adapter) {
      return err(`Unsupported platform: ${body.platform}. Supported: ${getSupportedPlatforms().join(', ')}`, 400, c);
    }

    const priority: Priority = (body.priority as Priority) ?? 5;
    const job = createJob(body, priority);

    // Pre-validate
    const validation = adapter.validate(job);
    if (!validation.valid) {
      return err(`Validation failed: ${validation.errors.join('; ')}`, 422, c);
    }

    queue.enqueue(job);

    return ok({
      jobId: job.id,
      status: job.status,
      priority: job.priority,
      platform: job.platform,
      scheduledAt: job.scheduledAt,
    }, c);
  } catch (e: any) {
    return err(`Invalid request body: ${e.message}`, 400, c);
  }
});

// ── Publish Now ──────────────────────────────────────────────
app.post('/publish/now', async (c) => {
  try {
    const body = await c.req.json<PublishNowRequest>();

    if (!body.postId || !body.content || !body.platform) {
      return err('Missing required fields: postId, content, platform', 400, c);
    }

    const adapter = getAdapter(body.platform);
    if (!adapter) {
      return err(`Unsupported platform: ${body.platform}`, 400, c);
    }

    const job = createJob(body, 1); // highest priority for immediate
    job.priority = 1;
    job.status = 'queued';

    const result = await queue.publishNow(job);
    if (!result) {
      return err(`Publish failed for job ${job.id}`, 500, c);
    }

    return ok({
      jobId: job.id,
      success: result.success,
      platformPostId: result.platformPostId,
      platformUrl: result.platformUrl,
      responseTime: result.responseTime,
      error: result.error,
    }, c);
  } catch (e: any) {
    return err(`Invalid request body: ${e.message}`, 400, c);
  }
});

// ── Bulk Publish ─────────────────────────────────────────────
app.post('/publish/bulk', async (c) => {
  try {
    const body = await c.req.json<BulkPublishRequest>();

    if (!body.postId || !body.content || !body.platforms || body.platforms.length === 0) {
      return err('Missing required fields: postId, content, platforms[]', 400, c);
    }

    for (const p of body.platforms) {
      if (!getAdapter(p)) {
        return err(`Unsupported platform: ${p}`, 400, c);
      }
    }

    const results: Array<{
      platform: Platform;
      jobId: string;
      success: boolean;
      platformPostId?: string;
      error?: string;
    }> = [];

    console.log(
      `${MAGENTA}📦${RESET} ${CYAN}[BULK]${RESET} Publishing to ${BOLD}${body.platforms.length}${RESET} platform(s)…`,
    );

    for (const platform of body.platforms) {
      const job = createJob({ ...body, platform }, 2);
      const result = await queue.publishNow(job);
      results.push({
        platform,
        jobId: job.id,
        success: result?.success ?? false,
        platformPostId: result?.platformPostId,
        error: result?.error,
      });
    }

    const successes = results.filter((r) => r.success).length;
    console.log(
      `${GREEN}✔${RESET} ${CYAN}[BULK]${RESET} ${BOLD}${successes}/${results.length}${RESET} platforms succeeded`,
    );

    return ok({
      totalPlatforms: body.platforms.length,
      succeeded: successes,
      failed: results.length - successes,
      results,
    }, c);
  } catch (e: any) {
    return err(`Invalid request body: ${e.message}`, 400, c);
  }
});

// ── History ──────────────────────────────────────────────────
app.get('/history', (c) => {
  const limit = Math.min(50, parseInt(c.req.query('limit') || '50', 10));
  return ok(queue.getHistory(limit), c);
});

// ── Retry a Failed Post ──────────────────────────────────────
app.post('/retry/:postId', async (c) => {
  const jobId = c.req.param('postId');
  const result = await queue.retryJob(jobId);
  if (!result) {
    return err(`Could not retry job ${jobId}. It may not exist or may not be in a failed state.`, 404, c);
  }
  return ok({
    jobId,
    success: result.success,
    platformPostId: result.platformPostId,
    error: result.error,
  }, c);
});

// ── Publishing Stats ─────────────────────────────────────────
app.get('/stats', (c) => {
  return ok(queue.getStats(), c);
});

// ── Webhook Receiver ─────────────────────────────────────────
app.post('/webhook/:platform', async (c) => {
  try {
    const platform = c.req.param('platform') as Platform;
    const adapter = getAdapter(platform);

    if (!adapter) {
      return err(`Unsupported webhook platform: ${platform}`, 400, c);
    }

    const payload = await c.req.json().catch(() => ({}));

    const event: WebhookEvent = {
      id: `wh_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      platform,
      type: (payload.type as string) || 'unknown',
      payload,
      receivedAt: new Date().toISOString(),
    };

    webhookEvents.unshift(event);
    // Keep only the last 200 events
    if (webhookEvents.length > 200) webhookEvents.length = 200;

    console.log(
      `${CYAN}📡${RESET} ${CYAN}[WEBHOOK]${RESET} Received from ${BOLD}${platform}${RESET}` +
        ` | type: ${event.type}` +
        ` | event_id: ${event.id}`,
    );

    return ok({
      eventId: event.id,
      platform,
      type: event.type,
      received: true,
    }, c);
  } catch (e: any) {
    return err(`Webhook processing error: ${e.message}`, 400, c);
  }
});

// ── Rate Limit Status ────────────────────────────────────────
app.get('/rate-limits', (c) => {
  const platform = c.req.query('platform');
  if (platform) {
    const info = queue.getRateLimitInfo(platform);
    if (!info) return err(`Unknown platform: ${platform}`, 400, c);
    return ok(info as RateLimitInfo, c);
  }

  const allLimits = getSupportedPlatforms().map((p) => queue.getRateLimitInfo(p));
  return ok(allLimits, c);
});

// ══════════════════════════════════════════════════════════════
//  SCHEDULED POST CHECKER (background)
// ══════════════════════════════════════════════════════════════

const SCHEDULED_CHECK_INTERVAL_MS = 30_000; // 30 seconds

setInterval(() => {
  const status = queue.getStatus();
  const scheduledCount = status.byStatus['scheduled'] || 0;
  if (scheduledCount > 0) {
    const now = new Date().toISOString();
    console.log(
      `${DIM}[SCHEDULER] Checking scheduled posts at ${now} (${scheduledCount} scheduled)${RESET}`,
    );
    queue.processQueue();
  }
}, SCHEDULED_CHECK_INTERVAL_MS);

// Also run a periodic queue flush every 10 seconds
setInterval(() => {
  if (queue.getSize() > 0) {
    queue.processQueue();
  }
}, 10_000);

// ══════════════════════════════════════════════════════════════
//  START SERVER
// ══════════════════════════════════════════════════════════════

export default app;

const server = Bun.serve({
  port: PORT,
  fetch: app.fetch,
});

console.log(`  ${GREEN}${BOLD}✓${RESET}  Server running on ${CYAN}${BOLD}http://localhost:${PORT}${RESET}`);
console.log(`  ${DIM}  Endpoints:${RESET}`);
console.log(`  ${DIM}    GET  /health          — Health check & queue stats${RESET}`);
console.log(`  ${DIM}    GET  /queue           — Queue status (items by priority)${RESET}`);
console.log(`  ${DIM}    POST /enqueue         — Add post to queue${RESET}`);
console.log(`  ${DIM}    POST /publish/now     — Immediate publish${RESET}`);
console.log(`  ${DIM}    POST /publish/bulk    — Bulk multi-platform publish${RESET}`);
console.log(`  ${DIM}    GET  /history         — Publishing history (last 50)${RESET}`);
console.log(`  ${DIM}    POST /retry/:postId   — Retry a failed post${RESET}`);
console.log(`  ${DIM}    GET  /stats           — Publishing statistics${RESET}`);
console.log(`  ${DIM}    POST /webhook/:platform — Receive platform webhooks${RESET}`);
console.log(`  ${DIM}    GET  /rate-limits     — Rate limit status per platform${RESET}`);
console.log('');
console.log(`  ${DIM}  Background:${RESET}`);
console.log(`  ${DIM}    Scheduled post checker: every ${SCHEDULED_CHECK_INTERVAL_MS / 1000}s${RESET}`);
console.log(`  ${DIM}    Queue processor:      every 10s${RESET}`);
console.log(`  ${MAGENTA}${BOLD}═══════════════════════════════════════════════════════${RESET}`);
console.log('');
