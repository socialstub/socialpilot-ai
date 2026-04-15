// ──────────────────────────────────────────────────────────
// SocialPilot Posting Service — Platform Publisher Adapters
// ──────────────────────────────────────────────────────────
import type {
  PlatformAdapter,
  PostJob,
  PublishResult,
  ValidationResult,
  Platform,
} from './types.js';

// ── Helpers ──────────────────────────────────────────────

/** 5 % simulated failure rate */
function shouldSimulateFailure(): boolean {
  return Math.random() < 0.05;
}

/** Simulated network latency (200 – 900 ms) */
function simulateLatency(): Promise<number> {
  const ms = 200 + Math.floor(Math.random() * 700);
  return new Promise<number>((resolve) => setTimeout(() => resolve(ms), ms));
}

/** Generate a fake platform post ID */
function fakePostId(platform: string): string {
  const prefixes: Record<string, string> = {
    facebook: 'fb_',
    instagram: 'ig_',
    twitter: 'tw_',
    linkedin: 'li_',
    tiktok: 'tk_',
    youtube: 'yt_',
  };
  return `${prefixes[platform] || 'xx_'}${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Build a fake platform URL for the post */
function fakePostUrl(platform: Platform, postId: string): string {
  const bases: Record<Platform, string> = {
    facebook: 'https://facebook.com',
    instagram: 'https://instagram.com/p',
    twitter: 'https://x.com/user/status',
    linkedin: 'https://linkedin.com/posts',
    tiktok: 'https://tiktok.com/@user/video',
    youtube: 'https://youtube.com/watch',
  };
  return `${bases[platform]}/${postId}`;
}

// ── Validation helpers ───────────────────────────────────

function validateContentLength(content: string, max: number): string[] {
  const errors: string[] = [];
  if (!content || content.trim().length === 0) {
    errors.push('Content cannot be empty');
  } else if (content.length > max) {
    errors.push(`Content exceeds maximum length of ${max} characters (current: ${content.length})`);
  }
  return errors;
}

function validateMedia(urls: string[] | undefined, supported: string[]): string[] {
  const errors: string[] = [];
  if (!urls || urls.length === 0) return errors;

  for (const url of urls) {
    const ext = url.split('.').pop()?.toLowerCase() || '';
    if (!supported.some((s) => ext.endsWith(s) || ext === s)) {
      errors.push(`Unsupported media format: .${ext} (supported: ${supported.join(', ')})`);
    }
  }

  return errors;
}

// ── Adapters ─────────────────────────────────────────────

class FacebookAdapter implements PlatformAdapter {
  name: Platform = 'facebook';
  displayName = 'Facebook';
  maxContentLength = 63_206;
  supportedMediaTypes = ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov'];
  rateLimitPerWindow = 200;
  rateLimitWindowMs = 3_600_000; // 1 hour

  validate(post: PostJob): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    errors.push(...validateContentLength(post.content, this.maxContentLength));
    errors.push(...validateMedia(post.mediaUrls, this.supportedMediaTypes));

    if (post.content.length > 300) {
      warnings.push('Posts longer than 300 characters may be truncated in the feed');
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  async publish(post: PostJob): Promise<PublishResult> {
    const start = performance.now();
    const latency = await simulateLatency();

    if (shouldSimulateFailure()) {
      return {
        success: false,
        error: 'Graph API error: (OAuthException) Permissions error',
        responseTime: latency,
      };
    }

    // Simulate Graph API response
    const platformPostId = fakePostId('facebook');
    return {
      success: true,
      platformPostId,
      platformUrl: fakePostUrl('facebook', platformPostId),
      responseTime: latency,
      metadata: {
        api: 'Graph API v18.0',
        reachEstimate: Math.floor(100 + Math.random() * 2000),
      },
    };
  }
}

class InstagramAdapter implements PlatformAdapter {
  name: Platform = 'instagram';
  displayName = 'Instagram';
  maxContentLength = 2_200;
  supportedMediaTypes = ['jpg', 'jpeg', 'png', 'mp4', 'mov'];
  rateLimitPerWindow = 25;
  rateLimitWindowMs = 3_600_000;

  validate(post: PostJob): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    errors.push(...validateContentLength(post.content, this.maxContentLength));
    errors.push(...validateMedia(post.mediaUrls, this.supportedMediaTypes));

    if (!post.mediaUrls || post.mediaUrls.length === 0) {
      warnings.push('Instagram posts perform best with at least one image or video');
    }

    if (post.hashtags && post.hashtags.length > 30) {
      errors.push('Instagram allows a maximum of 30 hashtags per post');
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  async publish(post: PostJob): Promise<PublishResult> {
    const latency = await simulateLatency();

    if (shouldSimulateFailure()) {
      return {
        success: false,
        error: 'Content Publishing API error: media processing failed',
        responseTime: latency,
      };
    }

    const platformPostId = fakePostId('instagram');
    return {
      success: true,
      platformPostId,
      platformUrl: fakePostUrl('instagram', platformPostId),
      responseTime: latency,
      metadata: {
        api: 'Content Publishing API',
        mediaProcessed: post.mediaUrls?.length || 0,
      },
    };
  }
}

class TwitterAdapter implements PlatformAdapter {
  name: Platform = 'twitter';
  displayName = 'Twitter / X';
  maxContentLength = 280;
  supportedMediaTypes = ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'webp'];
  rateLimitPerWindow = 50;
  rateLimitWindowMs = 3_600_000;

  validate(post: PostJob): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    errors.push(...validateContentLength(post.content, this.maxContentLength));
    errors.push(...validateMedia(post.mediaUrls, this.supportedMediaTypes));

    if (post.mediaUrls && post.mediaUrls.length > 4) {
      errors.push('Twitter allows a maximum of 4 media attachments per tweet');
    }

    const hashtagCount = (post.hashtags || []).length;
    if (hashtagCount > 5) {
      warnings.push('Best practice: limit hashtags to 1–2 per tweet for optimal engagement');
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  async publish(post: PostJob): Promise<PublishResult> {
    const latency = await simulateLatency();

    if (shouldSimulateFailure()) {
      return {
        success: false,
        error: 'API v2 error: Tweet creation rate limit exceeded',
        responseTime: latency,
      };
    }

    const platformPostId = fakePostId('twitter');
    return {
      success: true,
      platformPostId,
      platformUrl: fakePostUrl('twitter', platformPostId),
      responseTime: latency,
      metadata: {
        api: 'Twitter API v2',
        characterCount: post.content.length,
      },
    };
  }
}

class LinkedInAdapter implements PlatformAdapter {
  name: Platform = 'linkedin';
  displayName = 'LinkedIn';
  maxContentLength = 3_000;
  supportedMediaTypes = ['jpg', 'jpeg', 'png', 'mp4'];
  rateLimitPerWindow = 100;
  rateLimitWindowMs = 86_400_000; // 24 hours

  validate(post: PostJob): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    errors.push(...validateContentLength(post.content, this.maxContentLength));
    errors.push(...validateMedia(post.mediaUrls, this.supportedMediaTypes));

    if (post.mediaUrls && post.mediaUrls.length > 9) {
      errors.push('LinkedIn allows a maximum of 9 media items per post');
    }

    if (post.content.length > 1_200) {
      warnings.push('LinkedIn shows a "see more" link after ~1,200 characters');
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  async publish(post: PostJob): Promise<PublishResult> {
    const latency = await simulateLatency();

    if (shouldSimulateFailure()) {
      return {
        success: false,
        error: 'Share API error: unauthorized access (403)',
        responseTime: latency,
      };
    }

    const platformPostId = fakePostId('linkedin');
    return {
      success: true,
      platformPostId,
      platformUrl: fakePostUrl('linkedin', platformPostId),
      responseTime: latency,
      metadata: {
        api: 'LinkedIn Share API v2',
        isArticle: post.content.length > 700,
      },
    };
  }
}

class TikTokAdapter implements PlatformAdapter {
  name: Platform = 'tiktok';
  displayName = 'TikTok';
  maxContentLength = 150;
  supportedMediaTypes = ['mp4', 'mov', 'avi'];
  rateLimitPerWindow = 30;
  rateLimitWindowMs = 3_600_000;

  validate(post: PostJob): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    errors.push(...validateContentLength(post.content, this.maxContentLength));
    errors.push(...validateMedia(post.mediaUrls, this.supportedMediaTypes));

    if (!post.mediaUrls || post.mediaUrls.length === 0) {
      errors.push('TikTok requires at least one video attachment');
    }

    if (post.hashtags && post.hashtags.length > 8) {
      warnings.push('TikTok recommends 3–5 hashtags per video');
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  async publish(post: PostJob): Promise<PublishResult> {
    const latency = await simulateLatency();

    if (shouldSimulateFailure()) {
      return {
        success: false,
        error: 'Content Posting API error: video upload timed out',
        responseTime: latency,
      };
    }

    const platformPostId = fakePostId('tiktok');
    return {
      success: true,
      platformPostId,
      platformUrl: fakePostUrl('tiktok', platformPostId),
      responseTime: latency,
      metadata: {
        api: 'TikTok Content Posting API',
        videoDuration: `${Math.floor(15 + Math.random() * 60)}s`,
      },
    };
  }
}

class YouTubeAdapter implements PlatformAdapter {
  name: Platform = 'youtube';
  displayName = 'YouTube';
  maxContentLength = 5_000;
  supportedMediaTypes = ['mp4', 'mov', 'avi', 'mkv', 'webm'];
  rateLimitPerWindow = 10_000;
  rateLimitWindowMs = 86_400_000;

  validate(post: PostJob): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    errors.push(...validateContentLength(post.content, this.maxContentLength));
    errors.push(...validateMedia(post.mediaUrls, this.supportedMediaTypes));

    if (!post.mediaUrls || post.mediaUrls.length === 0) {
      errors.push('YouTube requires at least one video attachment');
    }

    if (post.mediaUrls && post.mediaUrls.length > 1) {
      warnings.push('YouTube Shorts supports only one video; extra media will be ignored');
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  async publish(post: PostJob): Promise<PublishResult> {
    const latency = await simulateLatency();

    if (shouldSimulateFailure()) {
      return {
        success: false,
        error: 'Data API v3 error: quota exceeded for this project',
        responseTime: latency,
      };
    }

    const platformPostId = fakePostId('youtube');
    return {
      success: true,
      platformPostId,
      platformUrl: fakePostUrl('youtube', platformPostId),
      responseTime: latency,
      metadata: {
        api: 'YouTube Data API v3',
        uploadStatus: 'uploaded',
        processingStatus: 'processed',
      },
    };
  }
}

// ── Registry ─────────────────────────────────────────────

/** All available platform adapters keyed by platform name */
export const adapters: Record<Platform, PlatformAdapter> = {
  facebook: new FacebookAdapter(),
  instagram: new InstagramAdapter(),
  twitter: new TwitterAdapter(),
  linkedin: new LinkedInAdapter(),
  tiktok: new TikTokAdapter(),
  youtube: new YouTubeAdapter(),
};

/** Get an adapter by platform name */
export function getAdapter(platform: string): PlatformAdapter | undefined {
  return adapters[platform as Platform];
}

/** Get all adapter names */
export function getSupportedPlatforms(): Platform[] {
  return Object.keys(adapters) as Platform[];
}
