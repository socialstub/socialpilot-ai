// ──────────────────────────────────────────────────
// SocialPilot Posting Service — Priority Queue
// ──────────────────────────────────────────────────
import type {
  PostJob,
  Priority,
  JobStatus,
  QueueStatus,
  Platform,
  PublishResult,
} from './types.js';
import { getAdapter } from './adapters.js';

// ── ANSI colour helpers ───────────────────────────

const CYAN = '\x1b[36m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const MAGENTA = '\x1b[35m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

function timestamp(): string {
  return new Date().toISOString().slice(11, 23);
}

// ── PostQueue class ───────────────────────────────

export class PostQueue {
  /** Internal storage sorted by priority */
  private queue: PostJob[] = [];
  /** Full history of all processed jobs */
  private history: PostJob[] = [];
  /** Rate-limit counters per platform: { remaining, resetAt } */
  private rateLimits: Record<string, { remaining: number; resetAt: number }> = {};
  /** Stats accumulator */
  private stats = {
    published: 0,
    failed: 0,
    totalResponseTime: 0,
    byPlatform: {} as Record<
      Platform,
      { published: number; failed: number; totalTime: number; count: number }
    >,
    recentFailures: [] as Array<{
      postId: string;
      platform: Platform;
      error: string;
      timestamp: string;
    }>,
  };

  // ── Enqueue ──────────────────────────────────────

  /** Add a post job to the priority queue */
  enqueue(job: PostJob): PostJob {
    // Initialise rate-limit tracker if needed
    const adapter = getAdapter(job.platform);
    if (adapter && !this.rateLimits[job.platform]) {
      this.rateLimits[job.platform] = {
        remaining: adapter.rateLimitPerWindow,
        resetAt: Date.now() + adapter.rateLimitWindowMs,
      };
    }

    this.queue.push(job);
    // Keep sorted: lower priority number = higher priority → comes first
    this.queue.sort((a, b) => a.priority - b.priority);

    console.log(
      `${GREEN}✓${RESET} ${CYAN}[QUEUE]${RESET} Enqueued job ${BOLD}${job.id}${RESET}` +
        ` | Platform: ${BOLD}${job.platform}${RESET}` +
        ` | Priority: ${job.priority}` +
        (job.scheduledAt ? ` | Scheduled: ${job.scheduledAt}` : '') +
        ` | Queue size: ${this.queue.length}`,
    );

    return job;
  }

  // ── Dequeue ──────────────────────────────────────

  /** Remove and return the next highest-priority job */
  dequeue(): PostJob | undefined {
    // Pick the first non-scheduled job (or one whose scheduled time has passed)
    const now = Date.now();
    const idx = this.queue.findIndex(
      (j) => !j.scheduledAt || new Date(j.scheduledAt).getTime() <= now,
    );
    if (idx === -1) return undefined;
    return this.queue.splice(idx, 1)[0];
  }

  // ── Process ──────────────────────────────────────

  /** Process all ready (non-scheduled or due) jobs in the queue */
  async processQueue(): Promise<void> {
    const readyJobs: PostJob[] = [];

    // Drain all ready jobs
    let job: PostJob | undefined;
    while ((job = this.dequeue())) {
      readyJobs.push(job);
    }

    if (readyJobs.length === 0) return;

    console.log(
      `${MAGENTA}⚡${RESET} ${CYAN}[PROCESSOR]${RESET} Processing ${BOLD}${readyJobs.length}${RESET} job(s)…`,
    );

    // Process sequentially to honour rate limits
    for (const job of readyJobs) {
      await this.processJob(job);
      // Small stagger between jobs to look realistic
      await new Promise((r) => setTimeout(r, 100));
    }

    console.log(
      `${GREEN}✔${RESET} ${CYAN}[PROCESSOR]${RESET} Batch complete. Queue remaining: ${this.queue.length}`,
    );
  }

  // ── Process single job ───────────────────────────

  private async processJob(job: PostJob): Promise<PublishResult | null> {
    const adapter = getAdapter(job.platform);
    if (!adapter) {
      this.markFailed(job, `Unknown platform: ${job.platform}`);
      return null;
    }

    // Rate-limit check
    if (!this.checkRateLimit(job.platform)) {
      console.warn(
        `${YELLOW}⚠${RESET} ${CYAN}[RATE LIMIT]${RESET} ${BOLD}${job.platform}${RESET} rate limit hit — re-queuing job ${job.id}`,
      );
      job.status = 'queued';
      this.queue.push(job);
      this.queue.sort((a, b) => a.priority - b.priority);
      return null;
    }

    // Validate
    const validation = adapter.validate(job);
    if (!validation.valid) {
      this.markFailed(job, `Validation failed: ${validation.errors.join('; ')}`);
      return null;
    }

    // Publish
    job.status = 'processing';
    console.log(
      `${DIM}  → Publishing ${job.id} to ${job.platform}…${RESET}`,
    );

    const result = await adapter.publish(job);
    this.recordResponseTime(job.platform, result.responseTime);

    if (result.success) {
      this.markPublished(job, result);
    } else {
      this.handleFailure(job, result.error || 'Unknown error');
    }

    return result;
  }

  // ── Retry logic ──────────────────────────────────

  /** Retry a specific failed post by its job id */
  async retryJob(jobId: string): Promise<PublishResult | null> {
    const failedIdx = this.history.findIndex(
      (h) => h.id === jobId && (h.status === 'failed'),
    );
    if (failedIdx === -1) {
      console.warn(`${YELLOW}⚠${RESET} Job ${jobId} not found or not in failed state`);
      return null;
    }

    const job = this.history.splice(failedIdx, 1)[0];
    job.retryCount += 1;
    job.status = 'retrying';
    job.failedAt = undefined;
    job.lastError = undefined;

    console.log(
      `${YELLOW}↻${RESET} ${CYAN}[RETRY]${RESET} Retrying job ${BOLD}${job.id}${RESET}` +
        ` (attempt ${job.retryCount}/${job.maxRetries})`,
    );

    const result = await this.processJob(job);
    return result;
  }

  // ── Immediate publish ────────────────────────────

  /** Create a job and publish it immediately (bypasses queue) */
  async publishNow(job: PostJob): Promise<PublishResult | null> {
    console.log(
      `${MAGENTA}🚀${RESET} ${CYAN}[IMMEDIATE]${RESET} Publishing ${BOLD}${job.id}${RESET} to ${job.platform} now`,
    );
    const result = await this.processJob(job);
    return result;
  }

  // ── Internal helpers ─────────────────────────────

  private markPublished(job: PostJob, result: PublishResult): void {
    job.status = 'published';
    job.publishedAt = new Date().toISOString();
    job.platformPostId = result.platformPostId;
    this.history.unshift(job);
    this.stats.published++;
    if (this.stats.byPlatform[job.platform as Platform]) {
      this.stats.byPlatform[job.platform as Platform].published++;
    }

    console.log(
      `${GREEN}✔${RESET} ${CYAN}[PUBLISHED]${RESET} ${BOLD}${job.id}${RESET}` +
        ` → ${job.platform}` +
        ` (${result.responseTime}ms)` +
        ` | post_id: ${result.platformPostId}`,
    );
  }

  private markFailed(job: PostJob, error: string): void {
    job.status = 'failed';
    job.failedAt = new Date().toISOString();
    job.lastError = error;
    this.history.unshift(job);
    this.stats.failed++;
    if (this.stats.byPlatform[job.platform as Platform]) {
      this.stats.byPlatform[job.platform as Platform].failed++;
    }
    this.stats.recentFailures.unshift({
      postId: job.postId,
      platform: job.platform as Platform,
      error,
      timestamp: job.failedAt,
    });
    if (this.stats.recentFailures.length > 20) this.stats.recentFailures.pop();

    console.log(
      `${RED}✗${RESET} ${CYAN}[FAILED]${RESET} ${BOLD}${job.id}${RESET}` +
        ` → ${job.platform}: ${RED}${error}${RESET}`,
    );
  }

  private handleFailure(job: PostJob, error: string): void {
    if (job.retryCount < job.maxRetries) {
      // Exponential backoff re-queue
      job.retryCount++;
      job.status = 'retrying';
      job.lastError = error;
      const backoffMs = Math.min(1000 * 2 ** (job.retryCount - 1), 30_000);
      console.log(
        `${YELLOW}↻${RESET} ${CYAN}[RETRY]${RESET} ${BOLD}${job.id}${RESET}` +
          ` failed (${error}). Retrying in ${backoffMs}ms` +
          ` (attempt ${job.retryCount}/${job.maxRetries})`,
      );
      setTimeout(() => {
        this.queue.push(job);
        this.queue.sort((a, b) => a.priority - b.priority);
      }, backoffMs);
    } else {
      this.markFailed(job, `${error} (max retries exceeded)`);
    }
  }

  // ── Rate limiting ────────────────────────────────

  private checkRateLimit(platform: string): boolean {
    const limit = this.rateLimits[platform];
    if (!limit) return true;

    const adapter = getAdapter(platform);
    if (!adapter) return true;

    // Reset window if expired
    if (Date.now() >= limit.resetAt) {
      limit.remaining = adapter.rateLimitPerWindow;
      limit.resetAt = Date.now() + adapter.rateLimitWindowMs;
    }

    if (limit.remaining <= 0) return false;
    limit.remaining--;
    return true;
  }

  getRateLimitInfo(platform: string) {
    const adapter = getAdapter(platform);
    if (!adapter) return null;
    const limit = this.rateLimits[platform] || {
      remaining: adapter.rateLimitPerWindow,
      resetAt: Date.now() + adapter.rateLimitWindowMs,
    };
    return {
      platform,
      remaining: Math.max(0, limit.remaining),
      limit: adapter.rateLimitPerWindow,
      resetAt: new Date(limit.resetAt).toISOString(),
      windowMs: adapter.rateLimitWindowMs,
    };
  }

  // ── Stats tracking ───────────────────────────────

  private recordResponseTime(platform: string, ms: number): void {
    this.stats.totalResponseTime += ms;
    const p = this.stats.byPlatform[platform as Platform];
    if (p) {
      p.totalTime += ms;
      p.count++;
    }
  }

  ensurePlatformStats(platform: Platform): void {
    if (!this.stats.byPlatform[platform]) {
      this.stats.byPlatform[platform] = {
        published: 0,
        failed: 0,
        totalTime: 0,
        count: 0,
      };
    }
  }

  // ── Query methods ────────────────────────────────

  getStatus(): QueueStatus {
    const byPriority: Record<string, number> = {};
    const byPlatform: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    for (const job of this.queue) {
      byPriority[job.priority] = (byPriority[job.priority] || 0) + 1;
      byPlatform[job.platform] = (byPlatform[job.platform] || 0) + 1;
      byStatus[job.status] = (byStatus[job.status] || 0) + 1;
    }

    return {
      total: this.queue.length,
      byPriority,
      byPlatform,
      byStatus,
      items: this.queue.slice(0, 100), // cap preview
    };
  }

  getHistory(limit = 50): PostJob[] {
    return this.history.slice(0, limit);
  }

  getStats() {
    const totalProcessed = this.stats.published + this.stats.failed;
    return {
      totalPublished: this.stats.published,
      totalFailed: this.stats.failed,
      totalQueued: this.queue.length,
      successRate: totalProcessed > 0 ? Math.round((this.stats.published / totalProcessed) * 100) : 0,
      avgResponseTime:
        totalProcessed > 0 ? Math.round(this.stats.totalResponseTime / totalProcessed) : 0,
      byPlatform: Object.fromEntries(
        Object.entries(this.stats.byPlatform).map(([p, s]) => {
          const total = s.published + s.failed;
          return [
            p,
            {
              published: s.published,
              failed: s.failed,
              avgTime: s.count > 0 ? Math.round(s.totalTime / s.count) : 0,
              successRate: total > 0 ? Math.round((s.published / total) * 100) : 0,
            },
          ];
        }),
      ),
      recentFailures: this.stats.recentFailures,
    };
  }

  getSize(): number {
    return this.queue.length;
  }

  getHistoryCount(): { published: number; failed: number } {
    return {
      published: this.stats.published,
      failed: this.stats.failed,
    };
  }
}
