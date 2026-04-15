# SocialPilot AI — MVP Roadmap & Technical Documentation

> **Version**: 1.0.0  
> **Last Updated**: January 2025  
> **Status**: Active Development  

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [API Flow — How Posting Works](#2-api-flow--how-posting-works)
3. [AI Feature Implementation Plan](#3-ai-feature-implementation-plan)
4. [MVP Roadmap (Step-by-Step Build Plan)](#4-mvp-roadmap-step-by-step-build-plan)
5. [Monetization Model](#5-monetization-model)
6. [Security Considerations](#6-security-considerations)

---

## 1. System Architecture

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 16 + React 19 | Server-rendered React application with App Router |
| **Styling** | Tailwind CSS 4 + shadcn/ui | Utility-first CSS with production-ready component library |
| **State (Client)** | Zustand | Lightweight client-side state management for view switching and UI |
| **State (Server)** | TanStack Query (React Query) | Server state caching, background refetching, and optimistic updates |
| **Backend** | Next.js API Routes | RESTful API endpoints for CRUD operations |
| **Microservice** | Hono (port 3010) | Lightweight posting service for platform API interactions |
| **Database** | PostgreSQL (prod) / SQLite (dev) | Relational database via Prisma ORM |
| **ORM** | Prisma | Type-safe database client with migrations |
| **AI** | z-ai-web-dev-sdk / OpenAI | Content generation, rewriting, sentiment analysis, trend detection |
| **Queue** | In-memory priority queue | Post scheduling and retry logic (Redis for production) |
| **Real-time** | Socket.io (port 3003) | Live activity feed and posting status updates |
| **Auth** | NextAuth.js v4 | Authentication with OAuth providers and credentials |
| **Icons** | Lucide React | Consistent iconography |

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT (Browser)                           │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  Next.js 16 / React 19 / Tailwind CSS 4 / shadcn/ui         │    │
│  │                                                              │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │    │
│  │  │ Zustand  │ │ TanStack │ │  Socket  │ │  Framer      │   │    │
│  │  │ (UI)     │ │  Query   │ │  .io     │ │  Motion      │   │    │
│  │  └──────────┘ └────┬─────┘ └────┬─────┘ └──────────────┘   │    │
│  └───────────────────┬──┴────────────┴──┬──────────────────────┘    │
│                      │                   │                           │
└──────────────────────┼───────────────────┼───────────────────────────┘
                       │ HTTP/REST         │ WebSocket
                       ▼                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    NEXT.JS SERVER (Port 3000)                        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    API Routes (REST)                          │   │
│  │  /api/posts  /api/accounts  /api/analytics  /api/ai          │   │
│  │  /api/team   /api/comments   /api/activities /api/templates   │   │
│  └──────────────┬──────────────────────────────┬────────────────┘   │
│                 │                              │                     │
│  ┌──────────────▼──────────┐    ┌─────────────▼────────────────┐   │
│  │     Prisma ORM          │    │    Caddy Reverse Proxy       │   │
│  │  ┌─────────────────┐    │    │  (Gateway / Port Forwarding) │   │
│  │  │   PostgreSQL     │    │    └────────────────────────────┘   │
│  │  │   (or SQLite)    │    │                                     │
│  │  └─────────────────┘    │    ┌────────────────────────────────┐ │
│  └─────────────────────────┘    │  z-ai-web-dev-sdk (AI/LLM)    │ │
│                                 └────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
                       │                       │
                       │ Internal RPC           │ HTTP
                       ▼                       ▼
┌──────────────────────────────────────────────────────────────────────┐
│                   MICROSERVICES (Separate Processes)                 │
│                                                                      │
│  ┌──────────────────────────┐    ┌──────────────────────────────┐  │
│  │   Posting Service         │    │   Real-time Service          │  │
│  │   (Hono :3010)            │    │   (Socket.io :3003)          │  │
│  │                           │    │                              │  │
│  │   ┌───────────────────┐   │    │   • Activity feed            │  │
│  │   │  Priority Queue   │   │    │   • Post status updates      │  │
│  │   │  ┌─────────────┐  │   │    │   • Comment notifications    │  │
│  │   │  │ Post 1 (P1) │  │   │    │   • Team collaboration       │  │
│  │   │  │ Post 2 (P2) │  │   │    │                              │  │
│  │   │  │ Post 3 (P3) │  │   │    │                              │  │
│  │   │  └─────────────┘  │   │    │                              │  │
│  │   └────────┬──────────┘   │    │                              │  │
│  │            ▼              │    │                              │  │
│  │   ┌───────────────────┐   │    │                              │  │
│  │   │ Platform Adapters │   │    │                              │  │
│  │   │  • Facebook       │   │    │                              │  │
│  │   │  • Instagram      │   │    │                              │  │
│  │   │  • Twitter/X      │   │    │                              │  │
│  │   │  • LinkedIn       │   │    │                              │  │
│  │   │  • TikTok         │   │    │                              │  │
│  │   │  • YouTube        │   │    │                              │  │
│  │   └────────┬──────────┘   │    │                              │  │
│  └───────────┼──────────────┘    └──────────────────────────────┘  │
│              │                                                     │
└──────────────┼─────────────────────────────────────────────────────┘
               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     EXTERNAL PLATFORM APIs                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │ Facebook │ │Instagram │ │Twitter/X │ │ LinkedIn │ │ TikTok   │ │
│  │  Graph   │ │   API    │ │   API    │ │   API    │ │   API    │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

### Data Flow Summary

1. **Client** renders a single-page application with 7 views (Dashboard, Compose, Scheduler, Analytics, AI Tools, Accounts, Team)
2. **View switching** is handled client-side via Zustand store — no page reloads
3. **API Routes** serve as the backend, communicating with PostgreSQL through Prisma
4. **Posting Service** (Hono microservice) handles scheduled post publishing independently
5. **Real-time Service** (Socket.io) pushes live updates for activity feed and post status changes

---

## 2. API Flow — How Posting Works

### Complete Post Lifecycle

```
┌────────┐     ┌────────┐     ┌────────┐     ┌──────────┐     ┌──────────┐
│ Create │ ──▶ │ Draft  │ ──▶ │ Review │ ──▶ │ Schedule │ ──▶ │ Publish  │
│  Post  │     │  Save  │     │(opt.)  │     │          │     │          │
└────────┘     └────────┘     └────────┘     └──────────┘     └──────────┘
                  │              │               │                │
                  ▼              ▼               ▼                ▼
              DB: draft     DB: pending    DB: scheduled    DB: published
                           _approval        + scheduled_at   + platform_post_id
```

### Step-by-Step Flow

1. **User creates post in Composer**
   - Selects target platform(s) from the platform selector
   - Writes or AI-generates content in the rich text editor
   - Optionally attaches media URLs and selects hashtags
   - Clicks "Save Draft" to persist the post

2. **`POST /api/posts` saves to DB as "draft"**
   - API route validates the request body (content length, platform validity)
   - Prisma creates the post record with `status: "draft"`
   - Response returns the created post with its generated ID
   - Zustand store updates the UI optimistically

3. **User clicks "Schedule" → status becomes "scheduled"**
   - User selects a date/time from the scheduler or composer
   - `PUT /api/posts/:id` updates `status: "scheduled"` and sets `scheduled_at`
   - Post appears in the calendar view with a platform-colored indicator
   - If team approval is required, status becomes "pending_approval" first

4. **Posting Service polls for scheduled posts every 30 seconds**
   - Hono service (port 3010) runs a cron-like polling loop
   - Query: `SELECT * FROM posts WHERE status = 'scheduled' AND scheduled_at <= NOW()`
   - Each eligible post is enqueued in the in-memory priority queue
   - Priority is determined by: scheduled time (earliest first), platform importance

5. **Post enqueued in priority queue**
   - Queue item includes: post ID, content, platform, media, account credentials
   - Retry counter initialized to 0
   - Queue supports concurrent processing with a concurrency limit (default: 3)

6. **Platform adapter validates content**
   - Adapter checks: character limits, hashtag count, media format, content restrictions
   - Twitter: max 280 chars, Instagram: max 2200 chars, LinkedIn: max 3000 chars
   - Media validation: file size, dimensions, format per platform
   - Invalid content is flagged and status set to "failed" with error details

7. **Adapter calls platform API (simulated in MVP)**
   - Real implementation uses platform-specific SDKs:
     - Facebook: Graph API v18.0
     - Instagram: Instagram Graph API
     - Twitter/X: Twitter API v2
     - LinkedIn: LinkedIn Marketing API
     - TikTok: TikTok Content Posting API
     - YouTube: YouTube Data API v3
   - MVP uses simulated responses with random delays (2-5s)
   - OAuth tokens are decrypted and attached to API requests

8. **On success: status → "published", platformPostId saved**
   - Platform returns a post ID and URL
   - `UPDATE posts SET status = 'published', platform_post_id = ?, published_at = NOW()`
   - Socket.io emits `post:published` event to connected clients
   - Activity log entry created: "Published 'Post Title' on Platform"
   - Analytics tracking begins (see step 11)

9. **On failure: status → "failed", retry scheduled (max 3x)**
   - Error details logged to post metadata
   - If retry_count < 3: re-enqueue with exponential backoff (30s, 120s, 480s)
   - If retry_count >= 3: status stays "failed", user notified via toast + activity feed
   - Socket.io emits `post:failed` event with error details

10. **Webhook receives confirmation from platform**
    - Platform sends webhook callback when post is fully processed
    - Webhook handler updates analytics counters (reach, impressions)
    - In MVP, webhooks are simulated by the posting service after a delay

11. **Analytics tracking starts**
    - Post analytics collection begins via platform API polling (every 6 hours)
    - Daily snapshots saved to `post_analytics` table
    - Aggregate metrics (reach, engagement, likes, comments, shares, clicks) updated on `posts`
    - Trending detection runs on accumulated data weekly

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/posts` | List posts with optional filters (status, platform, date range) |
| `POST` | `/api/posts` | Create a new post (draft) |
| `GET` | `/api/posts/:id` | Get single post with analytics |
| `PUT` | `/api/posts/:id` | Update post content or status |
| `DELETE` | `/api/posts/:id` | Delete a post (drafts only) |
| `POST` | `/api/posts/:id/schedule` | Schedule a post for publishing |
| `POST` | `/api/posts/:id/approve` | Approve a pending post |
| `POST` | `/api/posts/:id/publish` | Immediately publish a post |
| `GET` | `/api/analytics` | Get dashboard analytics summary |
| `GET` | `/api/analytics/posts/:id` | Get detailed post analytics |
| `POST` | `/api/ai/generate` | AI content generation |
| `POST` | `/api/ai/rewrite` | AI content rewriting for platform |
| `POST` | `/api/ai/hashtags` | AI hashtag scoring and suggestions |
| `POST` | `/api/ai/reply` | AI comment reply generation |
| `GET` | `/api/accounts` | List connected social accounts |
| `POST` | `/api/accounts/connect` | Initiate OAuth flow for a platform |
| `DELETE` | `/api/accounts/:id` | Disconnect a social account |
| `GET` | `/api/team` | List team members |
| `POST` | `/api/team/invite` | Invite a new team member |
| `PUT` | `/api/team/:id/role` | Update team member role |
| `GET` | `/api/comments` | List comments with filters |
| `POST` | `/api/comments/:id/reply` | Reply to a comment (manual or AI) |
| `GET` | `/api/activities` | Get activity feed |
| `GET` | `/api/templates` | List content templates |
| `POST` | `/api/templates` | Create a content template |

---

## 3. AI Feature Implementation Plan

### 3.1 Content Generation

**Capability**: Generate social media posts from a topic, tone, and platform specification.

**Implementation**:

- **Prompt Engineering**:
  - System prompt defines SocialPilot's AI persona: "You are an expert social media strategist with deep knowledge of each platform's culture, best practices, and engagement patterns."
  - Platform-specific sub-prompts adjust tone, format, and length constraints
  - Few-shot examples included for each platform style

- **Platform-Specific Templates**:
  - **Facebook**: Conversational, emoji-rich, 100-500 words, encourages shares
  - **Instagram**: Visual-first, hashtag-heavy, 50-220 chars, aesthetic tone
  - **Twitter/X**: Concise, witty, max 280 chars, thread support
  - **LinkedIn**: Professional, insight-driven, 200-3000 chars, CTA-focused
  - **TikTok**: Casual, trend-aware, 50-220 chars, hook-driven
  - **YouTube**: Descriptive, SEO-friendly, 200-5000 chars, keyword-optimized

- **Tone Controls**:
  - Professional, Casual, Witty, Inspirational, Urgent, Educational
  - Each tone maps to specific vocabulary, emoji usage, and sentence structure rules

- **Content Pipeline**:
  ```
  User Input (topic, tone, platform, length)
       │
       ▼
  Prompt Builder ──▶ Assembles context + constraints + examples
       │
       ▼
  LLM API Call ─────▶ Generates raw content
       │
       ▼
  Post-Processor ────▶ Validates length, adds hashtags, formats
       │
       ▼
  Platform Adapter ──▶ Ensures platform compliance
       │
       ▼
  Output ───────────▶ Content + suggested hashtags + posting time
  ```

### 3.2 Platform Rewriting

**Capability**: Adapt content from one platform style to another while preserving the core message.

**Implementation**:

- **Style Transfer Algorithm**:
  1. Extract core message and intent from source content
  2. Identify platform-specific elements (hashtags, mentions, formatting)
  3. Apply target platform's style rules (length, tone, emoji density)
  4. Optimize for target platform's engagement patterns

- **Character Limit Handling**:
  - Twitter (280): Aggressive summarization, link shortening, thread splitting
  - Instagram (2200): Moderate editing, hashtag optimization
  - LinkedIn (3000): Expand with professional context, add CTA
  - Facebook (63206): Preserve original, add engagement prompts

- **Hashtag Optimization**:
  - Source hashtags mapped to platform-specific trending tags
  - Instagram: 20-30 targeted hashtags
  - Twitter: 1-3 high-impact hashtags
  - LinkedIn: 3-5 professional hashtags

- **Side-by-Side Comparison**:
  - UI shows original and rewritten versions simultaneously
  - Character count and readability scores displayed
  - User can accept, edit, or regenerate

### 3.3 Hashtag Scoring

**Capability**: Score and rank hashtags by relevance, reach potential, and competition level.

**Implementation**:

- **Scoring Algorithm**:
  ```
  hashtag_score = (reach_score × 0.3) + (relevance_score × 0.4) + (competition_score × 0.3)

  where:
  - reach_score: Estimated impressions (1-100, based on follower counts of posts using tag)
  - relevance_score: Topic similarity to post content (1-100, NLP cosine similarity)
  - competition_score: Inverse of post volume (100 = low competition, 1 = saturated)
  ```

- **Trend Analysis**:
  - Weekly hashtag velocity tracking (growth rate of usage)
  - Seasonal pattern detection (recurring spikes)
  - Emerging tag identification (new tags with high velocity)

- **Competitor Research**:
  - Track hashtags used by competitor accounts
  - Identify hashtag gaps (high-reach tags competitors miss)
  - Niche hashtag discovery (low competition, moderate reach)

- **Relevance Scoring**:
  - NLP-based content analysis extracts key topics
  - Hashtag embeddings compared to content embedding
  - Semantic similarity threshold filtering

### 3.4 Auto-Reply

**Capability**: Generate contextually appropriate replies to social media comments using AI.

**Implementation**:

- **Sentiment Analysis Pipeline**:
  ```
  Comment Text
       │
       ▼
  Sentiment Classifier ──▶ Positive / Negative / Neutral / Question / Spam
       │
       ▼
  Urgency Detector ──────▶ High (complaint, urgent) / Low (general)
       │
       ▼
  Intent Extractor ──────▶ What is the commenter asking/saying?
       │
       ▼
  Context Builder ───────▶ Original post + brand voice + comment thread
       │
       ▼
  Reply Generator ───────▶ AI-generated reply with tone matching
       │
       ▼
  Approval Gate ──────────▶ Auto-post (positive) or Queue for review (negative)
  ```

- **Sentiment-Based Routing**:
  - **Positive comments**: Auto-reply immediately with gratitude + brand personality
  - **Questions**: Generate helpful answer, auto-post if confident (confidence > 0.85)
  - **Negative comments**: Generate empathetic reply, **always queue for human review**
  - **Spam/complaints**: Flag for human review immediately, no auto-reply
  - **Complex questions**: Queue for human review with AI-suggested draft

- **Context-Aware Replies**:
  - Original post content used as context
  - Comment thread history included for multi-turn conversations
  - Brand voice guidelines enforced (tone, vocabulary, emoji usage)
  - Platform-specific reply style (Twitter: short, Instagram: emoji-friendly)

- **Approval Gate**:
  - Configurable per-team: auto-approve threshold (0-100%)
  - Admin can review all AI replies before posting
  - Reply history tracked for quality improvement
  - User can edit AI reply before posting

### 3.5 Best Time Prediction

**Capability**: Predict optimal posting times based on historical performance data.

**Implementation**:

- **Historical Data Analysis**:
  - Collect post timestamps and engagement metrics over 90-day window
  - Build engagement heatmap: hour × day-of-week → average engagement
  - Weight recent data more heavily (exponential decay: last 7 days = 3x weight of 60-90 days ago)

- **Audience Timezone Mapping**:
  - Analyze follower location data from platform insights APIs
  - Build timezone distribution model (percentage of audience in each UTC offset)
  - Account for daylight saving time transitions

- **Prediction Algorithm**:
  ```
  For each hour slot (0-23, each day of week):
    score = (
      historical_engagement(hour, day) × 0.40 +
      audience_active_ratio(hour, timezone_dist) × 0.30 +
      platform_best_practice(hour) × 0.15 +
      competition_low(hour) × 0.15
    )

  Return top 3 scored time slots with confidence intervals
  ```

- **Platform-Specific Best Practices**:
  - Facebook: Weekdays 9 AM - 3 PM (avoid weekends)
  - Instagram: Tuesday-Thursday 11 AM - 1 PM, 7 PM
  - Twitter/X: Weekdays 8 AM - 10 AM, 12 PM, 5 PM
  - LinkedIn: Tuesday-Thursday 7 AM - 8 AM, 12 PM, 5 PM
  - TikTok: Tuesday-Saturday 7 AM, 12 PM, 7 PM
  - YouTube: Saturday-Sunday 2 PM - 4 PM

- **Output**:
  - Top 3 recommended posting times with confidence scores
  - Visual calendar heat map showing engagement patterns
  - Comparison of user's actual posting times vs. recommended times

### 3.6 Trend Detection

**Capability**: Identify emerging topics and trends relevant to the user's audience and niche.

**Implementation**:

- **NLP Topic Extraction**:
  - Monitor popular posts from followed accounts and competitor accounts
  - Use named entity recognition (NER) to extract topics
  - Build topic frequency distribution with time-series tracking
  - Cluster similar topics using DBSCAN or hierarchical clustering

- **Growth Velocity Calculation**:
  ```
  velocity(t) = (mention_count(t) - mention_count(t-1)) / mention_count(t-1) × 100

  trend_score = velocity × relevance_to_brand × audience_affinity

  Categories:
  - Emerging:  velocity > 50%, mentions < 10K
  - Growing:   velocity > 20%, mentions < 100K
  - Trending:  velocity > 10%, mentions > 100K
  - Peaking:   velocity < 5% (approaching saturation)
  - Declining: velocity < -10%
  ```

- **Data Sources**:
  - Platform trending APIs (Twitter Trends, TikTok Discover)
  - Google Trends API for cross-platform validation
  - Competitor account monitoring (post content analysis)
  - Industry-specific RSS feeds and news sources

- **Output**:
  - Trend cards with: topic name, velocity score, relevance score, suggested content angle
  - Trend history visualization (growth/decline over time)
  - "Create post from trend" one-click action
  - Weekly trend digest email/in-app notification

---

## 4. MVP Roadmap (Step-by-Step Build Plan)

### Phase 1: Core Infrastructure (Week 1-2)

> Goal: Project scaffolding, database, authentication, and base layout

#### Week 1: Foundation

- [x] Initialize Next.js 16 project with TypeScript and App Router
- [x] Configure Tailwind CSS 4 and shadcn/ui component library
- [x] Set up Prisma ORM with SQLite (dev) and PostgreSQL (prod) configuration
- [x] Define complete database schema (10 models)
- [x] Implement seed data script with realistic demo data
- [x] Set up Zustand store for client state management
- [x] Configure NextAuth.js v4 with credentials provider

#### Week 2: Layout & Navigation

- [x] Build responsive sidebar navigation with collapsible state
- [x] Implement header component with search, notifications, and user menu
- [x] Set up dark/light mode with next-themes
- [x] Create API route structure (8 routes: posts, accounts, analytics, team, comments, activities, ai, templates)
- [x] Implement Caddy gateway configuration for microservice routing
- [ ] Add loading skeletons and error boundary components
- [ ] Set up logging and error tracking (Sentry integration)

---

### Phase 2: Content Management (Week 3-4)

> Goal: Complete content creation, scheduling, and management workflow

#### Week 3: Composer & Editor

- [x] Build Content Composer view with multi-platform support
- [x] Implement rich text editor with character counting
- [x] Add platform selector with visual platform cards
- [x] Build content preview panel (platform-adapted previews)
- [x] Implement draft auto-save functionality
- [ ] Add media upload with drag-and-drop (using S3-compatible storage)
- [ ] Build media gallery browser component

#### Week 4: Scheduler & Posts

- [x] Build Smart Scheduler view with custom calendar grid
- [x] Implement scheduled post management (create, edit, cancel, reschedule)
- [x] Add upcoming posts timeline view
- [ ] Implement post approval workflow (pending → approved → scheduled)
- [ ] Build post list view with filtering and bulk actions
- [ ] Add post versioning and edit history

---

### Phase 3: AI Integration (Week 5-6)

> Goal: Integrate AI features for content generation and optimization

#### Week 5: Core AI Features

- [x] Build AI Tools page with tabbed interface
- [x] Implement AI content generation (topic, platform, tone, length)
- [x] Implement platform-specific content rewriting
- [x] Build AI hashtag generator with scoring algorithm
- [ ] Add content tone analysis and suggestions
- [ ] Implement AI content improvement suggestions

#### Week 6: Advanced AI Features

- [x] Build AI auto-reply system for comments
- [x] Implement sentiment analysis for incoming comments
- [ ] Add AI trend detection with velocity indicators
- [ ] Implement best time prediction engine
- [ ] Build AI content calendar auto-generation
- [ ] Add AI-powered A/B testing for post variants

---

### Phase 4: Analytics & Team (Week 7-8)

> Goal: Analytics dashboard and team collaboration features

#### Week 7: Analytics

- [x] Build Analytics Dashboard with date range selector
- [x] Implement key metric cards with trend indicators
- [x] Build engagement over time multi-line chart
- [x] Implement platform comparison grouped bar chart
- [x] Add platform performance table
- [x] Build engagement distribution donut chart
- [ ] Add export analytics to CSV/PDF
- [ ] Implement custom analytics report builder

#### Week 8: Team & Accounts

- [x] Build Team Management view with members table
- [x] Implement role-based access control (admin, editor, viewer)
- [x] Add team member invitation flow
- [x] Build Connected Accounts view with platform cards
- [x] Implement account connection/disconnection flow
- [ ] Add OAuth 2.0 integration for all 6 platforms
- [ ] Implement token refresh mechanism
- [ ] Add team activity audit log

---

### Phase 5: Polish & Launch (Week 9-10)

> Goal: Production readiness, performance optimization, and launch

#### Week 9: Hardening

- [ ] Implement Posting Service (Hono microservice on port 3010)
- [ ] Build priority queue with retry logic (max 3 retries, exponential backoff)
- [ ] Add platform adapters with content validation
- [ ] Implement real-time updates via Socket.io (port 3003)
- [ ] Add WebSocket events for post status and activity feed
- [ ] Implement rate limiting on all API endpoints
- [ ] Add CSRF protection and input sanitization
- [ ] Set up content moderation filters

#### Week 10: Launch Preparation

- [ ] Performance optimization (code splitting, lazy loading, image optimization)
- [ ] Implement automated analytics collection from platform APIs
- [ ] Build onboarding wizard for new users
- [ ] Add notification system (email + in-app)
- [ ] Implement data export and GDPR compliance features
- [ ] Set up monitoring and alerting (uptime, error rates, API latency)
- [ ] Write user documentation and help center
- [ ] Beta testing with 50 users and feedback collection
- [ ] Production deployment on Vercel + managed PostgreSQL

---

## 5. Monetization Model

### Pricing Tiers

| Feature | Free | Pro ($19/mo) | Business ($49/mo) | Enterprise (Custom) |
|---------|------|-------------|-------------------|-------------------|
| **Social Accounts** | 3 | 10 | 25 | Unlimited |
| **Team Members** | 1 | 5 | 15 | Unlimited |
| **Scheduled Posts/mo** | 30 | 300 | 1,000 | Unlimited |
| **AI Generations/mo** | 10 | 200 | 1,000 | Unlimited |
| **Post Analytics** | 7 days | 90 days | 365 days | Custom |
| **Platforms Supported** | 3 | 6 | 6 | 6 + Custom |
| **Content Templates** | 5 | 50 | Unlimited | Unlimited |
| **Hashtag Groups** | 3 | 20 | Unlimited | Unlimited |
| **AI Auto-Reply** | — | ✅ | ✅ | ✅ |
| **AI Trend Detection** | — | ✅ | ✅ | ✅ |
| **Best Time Prediction** | — | ✅ | ✅ | ✅ |
| **Approval Workflow** | — | ✅ | ✅ | ✅ |
| **Analytics Export** | — | CSV | CSV + PDF | CSV + PDF + API |
| **Priority Support** | — | — | ✅ | ✅ |
| **Custom Branding** | — | — | — | ✅ |
| **SSO / SAML** | — | — | — | ✅ |
| **Dedicated Account Mgr** | — | — | — | ✅ |
| **API Access** | — | — | Read-only | Full |
| **SLA** | 99% | 99.5% | 99.9% | 99.99% |

### Free Tier Strategy

The free tier is designed as a **product-led growth funnel**:
- **Generous enough** to deliver real value (3 accounts, 30 posts/mo, AI generation)
- **Limited enough** to create upgrade friction (team collaboration, advanced analytics)
- **Time-gated AI features** to showcase power before requiring payment
- **In-app upgrade prompts** triggered at usage thresholds (80% of limit)

### Revenue Projections (Year 1)

| Metric | Conservative | Moderate | Aggressive |
|--------|-------------|----------|-----------|
| Monthly signups | 2,000 | 5,000 | 10,000 |
| Free → Pro conversion | 3% | 5% | 8% |
| Pro → Business conversion | 0.5% | 1% | 2% |
| Enterprise deals | 5 | 15 | 30 |
| **Monthly Recurring Revenue** | **$14,880** | **$53,750** | **$139,200** |
| **Annual Revenue** | **$178,560** | **$645,000** | **$1,670,400** |

---

## 6. Security Considerations

### 6.1 OAuth 2.0 Flow

Each social platform integration follows the standard OAuth 2.0 Authorization Code flow:

```
┌────────┐       ┌────────────┐       ┌──────────────┐       ┌────────────────┐
│ Client │──────▶│  Next.js   │──────▶│  Platform    │──────▶│  Platform User │
│        │       │  Backend   │       │  Auth Server │       │  Grants Access │
└────────┘       └─────┬──────┘       └──────┬───────┘       └────────────────┘
                       │                     │
                       │   1. /api/accounts/ │
                       │      connect?platform=twitter
                       │                     │
                       │   2. Redirect to    │
                       │      Platform Auth  │
                       │◀────────────────────│
                       │                     │
                       │   3. User grants    │
                       │      permission     │
                       │────────────────────▶│
                       │                     │
                       │   4. Auth code      │
                       │◀────────────────────│
                       │                     │
                       │   5. Exchange code  │
                       │      for tokens     │
                       │────────────────────▶│
                       │                     │
                       │   6. Access token   │
                       │      + refresh      │
                       │◀────────────────────│
                       │                     │
                       │   7. Encrypt & store│
                       │      in DB          │
                       │                     │
```

**Platform-specific considerations**:
- **Facebook/Instagram**: Meta API requires App Review for full permissions
- **Twitter/X**: API v2 has tiered access (Free, Basic, Pro)
- **LinkedIn**: Requires Developer Application approval for Marketing API
- **TikTok**: Requires business account for Content Posting API
- **YouTube**: Requires Google Cloud project with YouTube Data API enabled

### 6.2 Token Encryption

All OAuth tokens are encrypted at rest using **AES-256-GCM**:

```
Encryption Pipeline:
1. Generate encryption key from environment variable (ENCRYPTION_KEY)
2. Derive key using HKDF-SHA256 with random salt per token
3. Encrypt token plaintext with AES-256-GCM
4. Store: salt (16 bytes) + IV (12 bytes) + ciphertext + auth tag
5. Decryption: extract salt/IV, derive key, decrypt, verify auth tag
```

**Implementation**:
- Encryption/decryption happens in API routes (server-side only)
- Tokens never sent to the client in decrypted form
- Key rotation supported without re-encrypting all tokens
- Token auto-refresh runs 24 hours before expiry

### 6.3 Rate Limiting

| Endpoint Category | Limit (per user) | Window |
|-------------------|-----------------|--------|
| Read endpoints (GET) | 100 requests | 1 minute |
| Write endpoints (POST/PUT) | 30 requests | 1 minute |
| AI generation | 10 requests | 1 minute |
| File uploads | 5 requests | 1 minute |
| OAuth connect | 5 requests | 15 minutes |
| Login attempts | 5 attempts | 15 minutes |

**Implementation**:
- Token bucket algorithm using in-memory store (Redis for production)
- Rate limit headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- 429 Too Many Requests response with retry-after header

### 6.4 CSRF Protection

- **Next.js built-in**: SameSite cookies (Strict) for session tokens
- **API routes**: Verify `Origin` header matches expected domain
- **State mutations**: Require `X-CSRF-Token` header for POST/PUT/DELETE
- **Double-submit cookie pattern**: Compare cookie value with header value

### 6.5 Content Moderation

**Pre-publish content scanning**:
- Profanity filter (custom word list + ML classifier)
- Spam detection (repetitive content, URL patterns, excessive mentions)
- Image moderation (NSFW detection via cloud ML service)
- Link safety check (malware/phishing URL database)

**Auto-moderation rules** (configurable per team):
- Flag content with profanity → require manual review
- Block known spam patterns → prevent posting
- Warn about potentially sensitive content → require confirmation

### 6.6 GDPR Compliance

| Requirement | Implementation |
|------------|----------------|
| **Data Collection** | Only collect necessary data; explicit consent for analytics |
| **Right to Access** | `/api/user/data-export` — export all user data as JSON/CSV |
| **Right to Erasure** | `/api/user/delete-account` — cascade delete all user data within 30 days |
| **Right to Portability** | Data export in machine-readable format (JSON) |
| **Data Processing** | Privacy policy page; cookie consent banner |
| **Data Retention** | Auto-delete analytics after 24 months; activity logs after 12 months |
| **Breach Notification** | Automated breach detection; notify users within 72 hours |
| **Data Minimization** | PII fields encrypted; social account tokens encrypted |
| **Consent Management** | Granular consent toggles for each data processing purpose |

### 6.7 Additional Security Measures

- **Input Validation**: Zod schemas on all API inputs; parameterized queries via Prisma
- **Authentication**: NextAuth.js with secure HTTP-only cookies, CSRF tokens
- **Authorization**: Role-based access control checked on every API route
- **Logging**: Structured audit logs for all sensitive operations (login, data export, role changes)
- **Dependency Security**: `npm audit` in CI pipeline; Dependabot for automated updates
- **Environment Variables**: Secrets managed via encrypted env vars (never committed to git)
- **HTTPS Enforced**: All traffic over TLS 1.3; HSTS headers enabled
- **Content Security Policy**: Strict CSP headers preventing XSS
- **Infrastructure**: VPC isolation; database firewalls; no public database access

---

## Appendix: Key Decisions & Rationale

| Decision | Rationale |
|----------|-----------|
| **SQLite for dev, PostgreSQL for prod** | Zero-config local dev; production-grade reliability |
| **Zustand over Redux** | Simpler API, less boilerplate, sufficient for SPA state |
| **Hono for posting service** | Ultra-lightweight (14KB), TypeScript-native, fast |
| **In-memory queue** | Eliminates infrastructure complexity for MVP; Redis when needed |
| **Socket.io over raw WebSocket** | Built-in rooms, reconnection, fallback transport |
| **Prisma over raw SQL** | Type safety, migration management, excellent DX |
| **shadcn/ui over MUI/Ant** | Unstyled primitives, full customization, no vendor lock-in |
| **next-themes** | Simple dark mode with system preference detection |
| **Recharts for charts** | React-native, good performance, flexible API |
