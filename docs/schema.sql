-- =============================================================================
-- SocialPilot AI - Production PostgreSQL Schema
-- =============================================================================
-- This schema is designed for production deployment on PostgreSQL.
-- The development environment uses SQLite via Prisma ORM.
--
-- Generated for SocialPilot AI - AI-Powered Social Media Management SaaS
-- Version: 1.0.0
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- For gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; -- For uuid_generate_v4() fallback

-- =============================================================================
-- ENUM TYPES
-- =============================================================================

-- User roles within the application
CREATE TYPE user_role AS ENUM ('admin', 'editor', 'viewer');

-- Team member roles (maps to permission levels)
CREATE TYPE team_role AS ENUM ('admin', 'editor', 'viewer');

-- Social media platforms supported by SocialPilot
CREATE TYPE platform AS ENUM (
    'facebook',
    'instagram',
    'twitter',
    'linkedin',
    'tiktok',
    'youtube'
);

-- Post lifecycle statuses
CREATE TYPE post_status AS ENUM (
    'draft',              -- Post is being composed, not yet submitted
    'pending_approval',   -- Post submitted and awaiting team admin approval
    'scheduled',          -- Post approved and scheduled for future publishing
    'published',          -- Post has been successfully published to platform(s)
    'failed'              -- Publishing attempt failed (may retry up to 3x)
);

-- Activity event types for the activity log
CREATE TYPE activity_type AS ENUM (
    'post_created',       -- New post drafted
    'post_published',     -- Post published to platform(s)
    'post_scheduled',     -- Post scheduled for future publishing
    'post_failed',        -- Post publishing failed
    'account_connected',  -- Social account linked
    'account_disconnected', -- Social account unlinked
    'ai_generated',       -- AI content generation event
    'comment_replied',    -- Auto-reply sent to a comment
    'analytics_report',   -- Analytics report generated
    'team_member_added',  -- New team member joined
    'team_member_removed' -- Team member removed
);

-- Content template categories
CREATE TYPE template_category AS ENUM (
    'promotion',          -- Product/service promotion posts
    'educational',        -- Educational/how-to content
    'engagement',         -- Community engagement posts
    'announcement',       -- Company announcements
    'behind-scenes',      -- Behind-the-scenes content
    'user-generated',     -- User-generated content reposts
    'testimonial',        -- Customer testimonials
    'how-to'              -- Step-by-step guides
);

-- =============================================================================
-- TABLES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- users
-- Application users who manage social media accounts and content.
-- Each user can belong to multiple teams and manage multiple social accounts.
-- -----------------------------------------------------------------------------
CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       VARCHAR(255) NOT NULL,
    name        VARCHAR(255) NOT NULL,
    avatar      VARCHAR(1024),                                    -- URL to user avatar image
    role        user_role NOT NULL DEFAULT 'editor',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT ck_users_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Index for fast user lookup by email (login)
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- -----------------------------------------------------------------------------
-- teams
-- Organizational teams for collaborative content management.
-- Teams allow admins to manage permissions and approval workflows.
-- -----------------------------------------------------------------------------
CREATE TABLE teams (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT ck_teams_name_length CHECK (CHAR_LENGTH(name) >= 2 AND CHAR_LENGTH(name) <= 255)
);

-- -----------------------------------------------------------------------------
-- team_members
-- Junction table linking users to teams with role-based permissions.
-- A user can belong to multiple teams with different roles.
-- The UNIQUE constraint prevents duplicate memberships.
-- -----------------------------------------------------------------------------
CREATE TABLE team_members (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role        team_role NOT NULL DEFAULT 'editor',
    user_id     UUID NOT NULL,
    team_id     UUID NOT NULL,
    joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_team_members_user_team UNIQUE (user_id, team_id),
    CONSTRAINT fk_team_members_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_team_members_team FOREIGN KEY (team_id)
        REFERENCES teams (id) ON DELETE CASCADE
);

-- Indexes for team member queries
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members (user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members (team_id);

-- -----------------------------------------------------------------------------
-- social_accounts
-- Connected social media platform accounts.
-- Stores OAuth tokens and platform-specific user data.
-- Tokens are encrypted at rest in production (AES-256).
-- -----------------------------------------------------------------------------
CREATE TABLE social_accounts (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform          platform NOT NULL,                             -- Which social platform
    platform_user_id  VARCHAR(255) NOT NULL,                         -- User ID on the platform
    username          VARCHAR(255) NOT NULL,                         -- Platform username/handle
    display_name      VARCHAR(255) NOT NULL,                         -- Display name on the platform
    avatar            VARCHAR(1024),                                 -- Platform profile avatar URL
    access_token      TEXT,                                          -- OAuth access token (encrypted)
    refresh_token     TEXT,                                          -- OAuth refresh token (encrypted)
    token_expires_at  TIMESTAMPTZ,                                   -- When access token expires
    followers_count   INTEGER NOT NULL DEFAULT 0,
    following_count   INTEGER NOT NULL DEFAULT 0,
    is_active         BOOLEAN NOT NULL DEFAULT TRUE,                 -- Whether account is currently connected
    connected_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_synced_at    TIMESTAMPTZ,                                   -- Last time account data was synced
    user_id           UUID NOT NULL,

    CONSTRAINT uq_social_accounts_platform_user UNIQUE (platform, platform_user_id),
    CONSTRAINT fk_social_accounts_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT ck_social_accounts_followers CHECK (followers_count >= 0),
    CONSTRAINT ck_social_accounts_following CHECK (following_count >= 0)
);

-- Indexes for account lookups
CREATE INDEX IF NOT EXISTS idx_social_accounts_user_id ON social_accounts (user_id);
CREATE INDEX IF NOT EXISTS idx_social_accounts_platform ON social_accounts (platform);
CREATE INDEX IF NOT EXISTS idx_social_accounts_active ON social_accounts (user_id, is_active);

-- -----------------------------------------------------------------------------
-- posts
-- Core content table for social media posts.
-- Supports single-platform and multi-platform publishing.
-- Tracks full lifecycle from draft to published with analytics.
-- -----------------------------------------------------------------------------
CREATE TABLE posts (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title            VARCHAR(500),                                  -- Optional post title (internal use)
    content          TEXT NOT NULL,                                  -- Post content/caption
    platform         VARCHAR(50) NOT NULL DEFAULT 'multi',          -- Target platform(s)
    media_urls       JSONB,                                         -- Array of media URLs ["url1", "url2"]
    hashtags         JSONB,                                         -- Array of hashtags ["#tag1", "#tag2"]
    scheduled_at     TIMESTAMPTZ,                                   -- When post is scheduled to publish
    published_at     TIMESTAMPTZ,                                   -- When post was actually published
    status           post_status NOT NULL DEFAULT 'draft',
    ai_generated     BOOLEAN NOT NULL DEFAULT FALSE,                -- Whether content was AI-generated
    platform_post_id VARCHAR(255),                                  -- Post ID returned by the platform
    reach            INTEGER NOT NULL DEFAULT 0,
    engagement       INTEGER NOT NULL DEFAULT 0,                    -- likes + comments + shares
    likes            INTEGER NOT NULL DEFAULT 0,
    comments         INTEGER NOT NULL DEFAULT 0,
    shares           INTEGER NOT NULL DEFAULT 0,
    clicks           INTEGER NOT NULL DEFAULT 0,
    approved_by      UUID,                                          -- User who approved the post
    approved_at      TIMESTAMPTZ,                                   -- When approval was granted
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id          UUID NOT NULL,
    account_id       UUID,                                          -- Specific social account to post to

    CONSTRAINT fk_posts_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_posts_account FOREIGN KEY (account_id)
        REFERENCES social_accounts (id) ON DELETE SET NULL,
    CONSTRAINT fk_posts_approver FOREIGN KEY (approved_by)
        REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT ck_posts_engagement CHECK (engagement >= 0),
    CONSTRAINT ck_posts_counts CHECK (
        likes >= 0 AND comments >= 0 AND shares >= 0 AND clicks >= 0 AND reach >= 0
    ),
    CONSTRAINT ck_posts_platform_valid CHECK (
        platform IN ('facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'youtube', 'multi')
    )
);

-- Indexes for post queries (critical for performance)
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts (status);
CREATE INDEX IF NOT EXISTS idx_posts_platform ON posts (platform);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts (user_id);
CREATE INDEX IF NOT EXISTS idx_posts_scheduled_at ON posts (scheduled_at) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON posts (published_at) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_posts_user_status ON posts (user_id, status);
CREATE INDEX IF NOT EXISTS idx_posts_account_id ON posts (account_id);

-- Partial index for the posting service to poll scheduled posts efficiently
CREATE INDEX IF NOT EXISTS idx_posts_scheduled_pending ON posts (scheduled_at)
    WHERE status = 'scheduled' AND scheduled_at IS NOT NULL;

-- GIN index for JSONB hashtag searches
CREATE INDEX IF NOT EXISTS idx_posts_hashtags ON posts USING GIN (hashtags);

-- -----------------------------------------------------------------------------
-- post_analytics
-- Daily analytics snapshots for each published post.
-- Aggregated from platform APIs on a scheduled basis.
-- One row per post per day.
-- -----------------------------------------------------------------------------
CREATE TABLE post_analytics (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date         DATE NOT NULL,                                     -- The analytics date (no timezone)
    reach        INTEGER NOT NULL DEFAULT 0,                        -- Unique accounts reached
    impressions  INTEGER NOT NULL DEFAULT 0,                        -- Total content views
    likes        INTEGER NOT NULL DEFAULT 0,
    comments     INTEGER NOT NULL DEFAULT 0,
    shares       INTEGER NOT NULL DEFAULT 0,
    clicks       INTEGER NOT NULL DEFAULT 0,
    saves        INTEGER NOT NULL DEFAULT 0,                        -- Content saves/bookmarks
    post_id      UUID NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_post_analytics_post FOREIGN KEY (post_id)
        REFERENCES posts (id) ON DELETE CASCADE,
    CONSTRAINT uq_post_analytics_post_date UNIQUE (post_id, date),
    CONSTRAINT ck_analytics_non_negative CHECK (
        reach >= 0 AND impressions >= 0 AND likes >= 0 AND
        comments >= 0 AND shares >= 0 AND clicks >= 0 AND saves >= 0
    )
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_post_analytics_post_id ON post_analytics (post_id);
CREATE INDEX IF NOT EXISTS idx_post_analytics_date ON post_analytics (date);
CREATE INDEX IF NOT EXISTS idx_post_analytics_post_date ON post_analytics (post_id, date DESC);

-- -----------------------------------------------------------------------------
-- comments
-- Comments received on published posts across platforms.
-- Supports AI-generated auto-replies with sentiment analysis.
-- -----------------------------------------------------------------------------
CREATE TABLE comments (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform      platform NOT NULL,                                -- Source platform
    platform_id   VARCHAR(255) NOT NULL,                            -- Comment ID on the platform
    content       TEXT NOT NULL,                                    -- Comment text
    author_name   VARCHAR(255) NOT NULL,                            -- Commenter's display name
    author_avatar VARCHAR(1024),                                    -- Commenter's avatar URL
    post_id       UUID NOT NULL,
    is_replied    BOOLEAN NOT NULL DEFAULT FALSE,                   -- Whether a reply has been sent
    ai_reply      TEXT,                                             -- AI-generated reply (if any)
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_comments_post FOREIGN KEY (post_id)
        REFERENCES posts (id) ON DELETE CASCADE,
    CONSTRAINT uq_comments_platform_id UNIQUE (platform, platform_id)
);

-- Indexes for comment queries
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments (post_id);
CREATE INDEX IF NOT EXISTS idx_comments_platform ON comments (platform);
CREATE INDEX IF NOT EXISTS idx_comments_unreplied ON comments (post_id)
    WHERE is_replied = FALSE;

-- -----------------------------------------------------------------------------
-- activities
-- Audit log of user actions and system events.
-- Used for the activity feed, debugging, and compliance.
-- Metadata is stored as JSONB for flexible event data.
-- -----------------------------------------------------------------------------
CREATE TABLE activities (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type        activity_type NOT NULL,
    message     TEXT NOT NULL,                                      -- Human-readable description
    metadata    JSONB,                                             -- Additional event data as key-value pairs
    user_id     UUID NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_activities_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE
);

-- Indexes for activity feed queries
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities (user_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities (type);
CREATE INDEX IF NOT EXISTS idx_activities_user_created ON activities (user_id, created_at DESC);

-- -----------------------------------------------------------------------------
-- content_templates
-- Reusable content templates with variable placeholders.
-- Variables use the {variable_name} syntax and are stored as JSONB.
-- Category-specific templates help maintain consistent brand voice.
-- -----------------------------------------------------------------------------
CREATE TABLE content_templates (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255) NOT NULL,
    category    template_category NOT NULL,
    platform    platform,                                          -- NULL means all platforms
    content     TEXT NOT NULL,                                     -- Template body with {variables}
    variables   JSONB,                                             -- Array of variable names
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT ck_templates_name_length CHECK (CHAR_LENGTH(name) >= 2 AND CHAR_LENGTH(name) <= 255)
);

-- Indexes for template queries
CREATE INDEX IF NOT EXISTS idx_content_templates_category ON content_templates (category);
CREATE INDEX IF NOT EXISTS idx_content_templates_platform ON content_templates (platform);

-- -----------------------------------------------------------------------------
-- hashtag_groups
-- Predefined groups of hashtags organized by topic/platform.
-- Tags are stored as JSONB array for flexible querying.
-- Used by the AI hashtag generator to suggest relevant tags.
-- -----------------------------------------------------------------------------
CREATE TABLE hashtag_groups (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255) NOT NULL,
    tags        JSONB NOT NULL,                                    -- Array of hashtag strings
    platform    platform,                                          -- NULL means all platforms
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT ck_hashtag_groups_name_length CHECK (CHAR_LENGTH(name) >= 2 AND CHAR_LENGTH(name) <= 255)
);

-- GIN index for JSONB tag searches
CREATE INDEX IF NOT EXISTS idx_hashtag_groups_tags ON hashtag_groups USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_hashtag_groups_platform ON hashtag_groups (platform);

-- =============================================================================
-- FUNCTIONS & TRIGGERS
-- =============================================================================

-- Auto-update updated_at timestamp on row modification
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all tables with updated_at
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_teams_updated_at BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_posts_updated_at BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_content_templates_updated_at BEFORE UPDATE ON content_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- SEEDING: Demo Data
-- =============================================================================
-- This section contains INSERT statements matching the seed.ts data used
-- in the development environment. Run this section after schema creation
-- to populate the database with demo data.
-- =============================================================================

-- Main admin user
INSERT INTO users (id, email, name, avatar, role) VALUES
    ('a0000000-0000-4000-a000-000000000001', 'sarah@socialpilot.ai', 'Sarah Chen',
     'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', 'admin');

-- Team members
INSERT INTO users (id, email, name, avatar, role) VALUES
    ('a0000000-0000-4000-a000-000000000002', 'alex@socialpilot.ai', 'Alex Rivera',
     'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex', 'editor'),
    ('a0000000-0000-4000-a000-000000000003', 'emma@socialpilot.ai', 'Emma Wilson',
     'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma', 'editor'),
    ('a0000000-0000-4000-a000-000000000004', 'mike@socialpilot.ai', 'Mike Johnson',
     'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike', 'viewer'),
    ('a0000000-0000-4000-a000-000000000005', 'lisa@socialpilot.ai', 'Lisa Park',
     'https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa', 'viewer');

-- Teams
INSERT INTO teams (id, name, description) VALUES
    ('b0000000-0000-4000-b000-000000000001', 'Marketing Team',
     'Main social media marketing team'),
    ('b0000000-0000-4000-b000-000000000002', 'Content Team',
     'Content creation and curation team');

-- Team memberships
INSERT INTO team_members (id, role, user_id, team_id) VALUES
    ('c0000000-0000-4000-c000-000000000001', 'admin',
     'a0000000-0000-4000-a000-000000000001', 'b0000000-0000-4000-b000-000000000001'),
    ('c0000000-0000-4000-c000-000000000002', 'editor',
     'a0000000-0000-4000-a000-000000000002', 'b0000000-0000-4000-b000-000000000001'),
    ('c0000000-0000-4000-c000-000000000003', 'editor',
     'a0000000-0000-4000-a000-000000000003', 'b0000000-0000-4000-b000-000000000001'),
    ('c0000000-0000-4000-c000-000000000004', 'viewer',
     'a0000000-0000-4000-a000-000000000004', 'b0000000-0000-4000-b000-000000000001'),
    ('c0000000-0000-4000-c000-000000000005', 'viewer',
     'a0000000-0000-4000-a000-000000000005', 'b0000000-0000-4000-b000-000000000002');

-- Social accounts (one per platform)
INSERT INTO social_accounts (id, platform, platform_user_id, username, display_name, followers_count, following_count, is_active, access_token, refresh_token, user_id, last_synced_at) VALUES
    ('d0000000-0000-4000-d000-000000000001', 'facebook', 'fb-001', 'socialpilot_official', 'SocialPilot Official', 45200, 320, TRUE, 'mock_token_facebook', 'mock_refresh_facebook', 'a0000000-0000-4000-a000-000000000001', NOW()),
    ('d0000000-0000-4000-d000-000000000002', 'instagram', 'ig-001', '@socialpilot', '@socialpilot', 89400, 540, TRUE, 'mock_token_instagram', 'mock_refresh_instagram', 'a0000000-0000-4000-a000-000000000001', NOW()),
    ('d0000000-0000-4000-d000-000000000003', 'twitter', 'tw-001', '@socialpilot_ai', '@socialpilot_ai', 32100, 890, TRUE, 'mock_token_twitter', 'mock_refresh_twitter', 'a0000000-0000-4000-a000-000000000001', NOW()),
    ('d0000000-0000-4000-d000-000000000004', 'linkedin', 'li-001', 'socialpilot-company', 'SocialPilot Inc.', 28700, 150, TRUE, 'mock_token_linkedin', 'mock_refresh_linkedin', 'a0000000-0000-4000-a000-000000000001', NOW()),
    ('d0000000-0000-4000-d000-000000000005', 'tiktok', 'tt-001', '@socialpilot', '@socialpilot', 156000, 120, TRUE, 'mock_token_tiktok', 'mock_refresh_tiktok', 'a0000000-0000-4000-a000-000000000001', NOW()),
    ('d0000000-0000-4000-d000-000000000006', 'youtube', 'yt-001', 'SocialPilot', 'SocialPilot Channel', 12400, 45, TRUE, 'mock_token_youtube', 'mock_refresh_youtube', 'a0000000-0000-4000-a000-000000000001', NOW());

-- Posts (10 demo posts across different statuses)
INSERT INTO posts (id, title, content, platform, status, ai_generated, reach, engagement, likes, comments, shares, clicks, published_at, scheduled_at, user_id) VALUES
    ('e0000000-0000-4000-e000-000000000001',
     'AI Revolution in Social Media',
     '🚀 The AI revolution is transforming how we create and manage social media content. From automated scheduling to smart analytics, the future is here! #SocialMedia #AI #Marketing',
     'multi', 'published', TRUE, 45200, 3200, 2800, 210, 190, 450,
     NOW() - INTERVAL '2 hours', NULL,
     'a0000000-0000-4000-a000-000000000001'),

    ('e0000000-0000-4000-e000-000000000002',
     '10 Tips for Instagram Growth',
     '📈 Want to grow your Instagram in 2025? Here are 10 proven strategies:

1. Post consistently
2. Use Reels
3. Engage with your community
4. Use relevant hashtags
5. Collaborate with others
6. Share behind-the-scenes content
7. Run contests
8. Use Stories daily
9. Optimize your bio
10. Analyze your analytics

#InstagramGrowth #SocialMediaTips',
     'instagram', 'published', FALSE, 28900, 4500, 4100, 180, 220, 320,
     NOW() - INTERVAL '1 day', NULL,
     'a0000000-0000-4000-a000-000000000001'),

    ('e0000000-0000-4000-e000-000000000003',
     'Product Launch Announcement',
     '🎉 We''re thrilled to announce our new AI-powered scheduling feature! Now you can let AI choose the best time to post based on your audience insights. Try it today! #ProductLaunch #Innovation',
     'linkedin', 'published', TRUE, 35100, 2800, 1900, 340, 560, 780,
     NOW() - INTERVAL '3 days', NULL,
     'a0000000-0000-4000-a000-000000000001'),

    ('e0000000-0000-4000-e000-000000000004',
     'Behind the Scenes',
     'Take a peek behind the scenes at SocialPilot HQ! Our team works hard to bring you the best social media management tools. 💪 #BehindTheScenes #TeamWork',
     'tiktok', 'published', FALSE, 128000, 18900, 15200, 2100, 1600, 890,
     NOW() - INTERVAL '2 days', NULL,
     'a0000000-0000-4000-a000-000000000001'),

    ('e0000000-0000-4000-e000-000000000005',
     'Weekly Marketing Tips',
     'Thread: 5 marketing trends to watch in 2025

1/ AI-generated content is becoming mainstream

2/ Short-form video continues to dominate

3/ Social commerce is booming

4/ Authenticity beats perfection

5/ Micro-influencers deliver better ROI',
     'twitter', 'published', TRUE, 18500, 1200, 890, 120, 190, 340,
     NOW() - INTERVAL '4 days', NULL,
     'a0000000-0000-4000-a000-000000000001'),

    ('e0000000-0000-4000-e000-000000000006',
     'Upcoming Webinar',
     '📚 Free Webinar: Master Social Media Analytics

Join us next Thursday at 2 PM EST for an in-depth session on understanding your social media metrics.

Topics:
- Key metrics that matter
- Cross-platform analysis
- AI-driven insights
- Actionable strategies

Link in bio! #Webinar #SocialMediaAnalytics',
     'multi', 'scheduled', FALSE, 0, 0, 0, 0, 0, 0,
     NULL, NOW() + INTERVAL '3 days',
     'a0000000-0000-4000-a000-000000000001'),

    ('e0000000-0000-4000-e000-000000000007',
     'Customer Success Story',
     'How @TechStartup increased their social media engagement by 340% in just 3 months using our platform. Read the full case study! #CustomerSuccess #SocialMedia',
     'linkedin', 'pending_approval', TRUE, 0, 0, 0, 0, 0, 0,
     NULL, NULL,
     'a0000000-0000-4000-a000-000000000001'),

    ('e0000000-0000-4000-e000-000000000008',
     'Weekend Fun Post',
     'It''s Friday! Time for our weekly social media roundup. Here are the top performing posts from our community this week. Check them out! 🏆 #FridayRoundup',
     'facebook', 'draft', FALSE, 0, 0, 0, 0, 0, 0,
     NULL, NULL,
     'a0000000-0000-4000-a000-000000000001'),

    ('e0000000-0000-4000-e000-000000000009',
     'Tutorial: Content Calendar',
     'New video tutorial: How to create an effective content calendar for your business in 2025. Full walkthrough with tips and templates! 🎬',
     'youtube', 'published', FALSE, 8900, 670, 520, 89, 61, 230,
     NOW() - INTERVAL '5 days', NULL,
     'a0000000-0000-4000-a000-000000000001'),

    ('e0000000-0000-4000-e000-000000000010',
     'Friday Tips',
     'Sunday vibes! What''s your social media strategy for the week ahead? Drop your goals in the comments! 👇 #SundayMotivation #SocialMediaStrategy',
     'multi', 'scheduled', TRUE, 0, 0, 0, 0, 0, 0,
     NULL, NOW() + INTERVAL '1 day',
     'a0000000-0000-4000-a000-000000000001');

-- Post analytics (7 days of data for each published post)
INSERT INTO post_analytics (post_id, date, reach, impressions, likes, comments, shares, clicks, saves) VALUES
    -- Post 1 (AI Revolution) - 7 days
    ('e0000000-0000-4000-e000-000000000001', CURRENT_DATE - INTERVAL '6 days', 5400, 10800, 224, 21, 15, 45, 12),
    ('e0000000-0000-4000-e000-000000000001', CURRENT_DATE - INTERVAL '5 days', 6300, 12600, 336, 31, 19, 68, 18),
    ('e0000000-0000-4000-e000-000000000001', CURRENT_DATE - INTERVAL '4 days', 7200, 14400, 280, 25, 24, 56, 22),
    ('e0000000-0000-4000-e000-000000000001', CURRENT_DATE - INTERVAL '3 days', 5800, 11600, 308, 28, 20, 49, 15),
    ('e0000000-0000-4000-e000-000000000001', CURRENT_DATE - INTERVAL '2 days', 8100, 16200, 392, 37, 27, 72, 28),
    ('e0000000-0000-4000-e000-000000000001', CURRENT_DATE - INTERVAL '1 day', 6700, 13400, 336, 32, 23, 58, 20),
    ('e0000000-0000-4000-e000-000000000001', CURRENT_DATE, 5700, 11400, 284, 26, 18, 47, 14),
    -- Post 2 (Instagram Growth) - 7 days
    ('e0000000-0000-4000-e000-000000000002', CURRENT_DATE - INTERVAL '6 days', 3800, 7600, 328, 18, 18, 38, 10),
    ('e0000000-0000-4000-e000-000000000002', CURRENT_DATE - INTERVAL '5 days', 4100, 8200, 410, 22, 22, 48, 14),
    ('e0000000-0000-4000-e000-000000000002', CURRENT_DATE - INTERVAL '4 days', 3500, 7000, 369, 20, 20, 42, 11),
    ('e0000000-0000-4000-e000-000000000002', CURRENT_DATE - INTERVAL '3 days', 4600, 9200, 451, 24, 24, 54, 16),
    ('e0000000-0000-4000-e000-000000000002', CURRENT_DATE - INTERVAL '2 days', 3900, 7800, 388, 21, 21, 45, 12),
    ('e0000000-0000-4000-e000-000000000002', CURRENT_DATE - INTERVAL '1 day', 4400, 8800, 430, 23, 23, 52, 15),
    ('e0000000-0000-4000-e000-000000000002', CURRENT_DATE, 3600, 7200, 347, 19, 19, 40, 11),
    -- Post 3 (Product Launch) - 7 days
    ('e0000000-0000-4000-e000-000000000003', CURRENT_DATE - INTERVAL '6 days', 4200, 8400, 152, 34, 45, 78, 8),
    ('e0000000-0000-4000-e000-000000000003', CURRENT_DATE - INTERVAL '5 days', 4900, 9800, 190, 41, 56, 94, 11),
    ('e0000000-0000-4000-e000-000000000003', CURRENT_DATE - INTERVAL '4 days', 5300, 10600, 209, 44, 61, 101, 13),
    ('e0000000-0000-4000-e000-000000000003', CURRENT_DATE - INTERVAL '3 days', 4600, 9200, 180, 38, 53, 86, 9),
    ('e0000000-0000-4000-e000-000000000003', CURRENT_DATE - INTERVAL '2 days', 5800, 11600, 228, 47, 67, 109, 15),
    ('e0000000-0000-4000-e000-000000000003', CURRENT_DATE - INTERVAL '1 day', 5100, 10200, 209, 41, 59, 94, 12),
    ('e0000000-0000-4000-e000-000000000003', CURRENT_DATE, 4200, 8400, 171, 36, 50, 78, 9),
    -- Post 4 (Behind the Scenes) - 7 days
    ('e0000000-0000-4000-e000-000000000004', CURRENT_DATE - INTERVAL '6 days', 16600, 33200, 1216, 168, 128, 71, 6),
    ('e0000000-0000-4000-e000-000000000004', CURRENT_DATE - INTERVAL '5 days', 18900, 37800, 1368, 189, 144, 80, 8),
    ('e0000000-0000-4000-e000-000000000004', CURRENT_DATE - INTERVAL '4 days', 20800, 41600, 1520, 210, 160, 89, 9),
    ('e0000000-0000-4000-e000-000000000004', CURRENT_DATE - INTERVAL '3 days', 17600, 35200, 1296, 176, 136, 75, 7),
    ('e0000000-0000-4000-e000-000000000004', CURRENT_DATE - INTERVAL '2 days', 22400, 44800, 1632, 231, 176, 98, 11),
    ('e0000000-0000-4000-e000-000000000004', CURRENT_DATE - INTERVAL '1 day', 19700, 39400, 1440, 199, 152, 85, 9),
    ('e0000000-0000-4000-e000-000000000004', CURRENT_DATE, 17300, 34600, 1264, 175, 134, 74, 7),
    -- Post 5 (Marketing Tips) - 7 days
    ('e0000000-0000-4000-e000-000000000005', CURRENT_DATE - INTERVAL '6 days', 2400, 4800, 71, 12, 15, 34, 5),
    ('e0000000-0000-4000-e000-000000000005', CURRENT_DATE - INTERVAL '5 days', 2700, 5400, 80, 13, 17, 38, 6),
    ('e0000000-0000-4000-e000-000000000005', CURRENT_DATE - INTERVAL '4 days', 2200, 4400, 71, 12, 15, 34, 5),
    ('e0000000-0000-4000-e000-000000000005', CURRENT_DATE - INTERVAL '3 days', 2900, 5800, 89, 14, 19, 41, 7),
    ('e0000000-0000-4000-e000-000000000005', CURRENT_DATE - INTERVAL '2 days', 2600, 5200, 80, 13, 17, 37, 6),
    ('e0000000-0000-4000-e000-000000000005', CURRENT_DATE - INTERVAL '1 day', 2800, 5600, 84, 14, 18, 39, 6),
    ('e0000000-0000-4000-e000-000000000005', CURRENT_DATE, 2500, 5000, 75, 13, 16, 36, 5),
    -- Post 9 (Content Calendar Tutorial) - 7 days
    ('e0000000-0000-4000-e000-000000000009', CURRENT_DATE - INTERVAL '6 days', 1100, 2200, 42, 7, 5, 23, 4),
    ('e0000000-0000-4000-e000-000000000009', CURRENT_DATE - INTERVAL '5 days', 1300, 2600, 52, 9, 6, 27, 5),
    ('e0000000-0000-4000-e000-000000000009', CURRENT_DATE - INTERVAL '4 days', 1200, 2400, 47, 8, 5, 25, 4),
    ('e0000000-0000-4000-e000-000000000009', CURRENT_DATE - INTERVAL '3 days', 1400, 2800, 57, 9, 7, 29, 5),
    ('e0000000-0000-4000-e000-000000000009', CURRENT_DATE - INTERVAL '2 days', 1100, 2200, 46, 8, 6, 23, 4),
    ('e0000000-0000-4000-e000-000000000009', CURRENT_DATE - INTERVAL '1 day', 1300, 2600, 52, 9, 6, 27, 5),
    ('e0000000-0000-4000-e000-000000000009', CURRENT_DATE, 1100, 2200, 42, 7, 5, 23, 4);

-- Comments (12 demo comments across posts)
INSERT INTO comments (id, platform, platform_id, content, author_name, author_avatar, post_id, is_replied, ai_reply) VALUES
    ('f0000000-0000-4000-f000-000000000001', 'facebook', 'plt-fb-001',
     'This is amazing! We need more tools like this.',
     'David Miller', 'https://api.dicebear.com/7.x/avataaars/svg?seed=DavidMiller',
     'e0000000-0000-4000-e000-000000000001', TRUE,
     'Thanks for your comment! We appreciate your support and feedback. 🙏'),

    ('f0000000-0000-4000-f000-000000000002', 'facebook', 'plt-fb-002',
     'How much does it cost?',
     'Jessica Brown', 'https://api.dicebear.com/7.x/avataaars/svg?seed=JessicaBrown',
     'e0000000-0000-4000-e000-000000000001', FALSE, NULL),

    ('f0000000-0000-4000-f000-000000000003', 'instagram', 'plt-ig-001',
     'Great tips! Already seeing results 😍',
     'Amanda Lee', 'https://api.dicebear.com/7.x/avataaars/svg?seed=AmandaLee',
     'e0000000-0000-4000-e000-000000000002', TRUE,
     'Thanks for your comment! We appreciate your support and feedback. 🙏'),

    ('f0000000-0000-4000-f000-000000000004', 'instagram', 'plt-ig-002',
     'The Reels tip is a game changer!',
     'Chris Taylor', 'https://api.dicebear.com/7.x/avataaars/svg?seed=ChrisTaylor',
     'e0000000-0000-4000-e000-000000000002', FALSE, NULL),

    ('f0000000-0000-4000-f000-000000000005', 'linkedin', 'plt-li-001',
     'Congratulations on the launch! This is exactly what the industry needs.',
     'Robert Chen', 'https://api.dicebear.com/7.x/avataaars/svg?seed=RobertChen',
     'e0000000-0000-4000-e000-000000000003', TRUE,
     'Thanks for your comment! We appreciate your support and feedback. 🙏'),

    ('f0000000-0000-4000-f000-000000000006', 'linkedin', 'plt-li-002',
     'The AI scheduling feature sounds incredible. Would love a demo.',
     'Sarah Williams', 'https://api.dicebear.com/7.x/avataaars/svg?seed=SarahWilliams',
     'e0000000-0000-4000-e000-000000000003', FALSE, NULL),

    ('f0000000-0000-4000-f000-000000000007', 'twitter', 'plt-tw-001',
     'Spot on! AI content is the future 🤖',
     'Alex Kumar', 'https://api.dicebear.com/7.x/avataaars/svg?seed=AlexKumar',
     'e0000000-0000-4000-e000-000000000005', TRUE,
     'Thanks for your comment! We appreciate your support and feedback. 🙏'),

    ('f0000000-0000-4000-f000-000000000008', 'twitter', 'plt-tw-002',
     'Micro-influencers all the way! Much better engagement.',
     'Maria Garcia', 'https://api.dicebear.com/7.x/avataaars/svg?seed=MariaGarcia',
     'e0000000-0000-4000-e000-000000000005', FALSE, NULL),

    ('f0000000-0000-4000-f000-000000000009', 'youtube', 'plt-yt-001',
     'Best tutorial I''ve seen on content calendars. Subscribed!',
     'Tom Harris', 'https://api.dicebear.com/7.x/avataaars/svg?seed=TomHarris',
     'e0000000-0000-4000-e000-000000000009', TRUE,
     'Thanks for your comment! We appreciate your support and feedback. 🙏'),

    ('f0000000-0000-4000-f000-000000000010', 'youtube', 'plt-yt-002',
     'Can you do one on hashtag strategy next?',
     'Nina Patel', 'https://api.dicebear.com/7.x/avataaars/svg?seed=NinaPatel',
     'e0000000-0000-4000-e000-000000000009', FALSE, NULL),

    ('f0000000-0000-4000-f000-000000000011', 'tiktok', 'plt-tt-001',
     'Love the team energy! 🔥🔥🔥',
     'Zoe Zhang', 'https://api.dicebear.com/7.x/avataaars/svg?seed=ZoeZhang',
     'e0000000-0000-4000-e000-000000000004', TRUE,
     'Thanks for your comment! We appreciate your support and feedback. 🙏'),

    ('f0000000-0000-4000-f000-000000000012', 'tiktok', 'plt-tt-002',
     'This is goals! How can I join?',
     'Jake Wilson', 'https://api.dicebear.com/7.x/avataaars/svg?seed=JakeWilson',
     'e0000000-0000-4000-e000-000000000004', FALSE, NULL);

-- Activities (8 demo activity log entries)
INSERT INTO activities (id, type, message, metadata, user_id, created_at) VALUES
    ('g0000000-0000-4000-g000-000000000001', 'post_published',
     'Published "AI Revolution in Social Media" across all platforms',
     '{"post_id": "e0000000-0000-4000-e000-000000000001", "platforms": ["facebook", "instagram", "twitter", "linkedin"]}',
     'a0000000-0000-4000-a000-000000000001', NOW() - INTERVAL '14 hours'),

    ('g0000000-0000-4000-g000-000000000002', 'post_published',
     'Published "10 Tips for Instagram Growth" on Instagram',
     '{"post_id": "e0000000-0000-4000-e000-000000000002", "platform": "instagram"}',
     'a0000000-0000-4000-a000-000000000001', NOW() - INTERVAL '12 hours'),

    ('g0000000-0000-4000-g000-000000000003', 'post_scheduled',
     'Scheduled "Upcoming Webinar" for Thursday at 2 PM',
     '{"post_id": "e0000000-0000-4000-e000-000000000006", "scheduled_at": "2025-01-23T14:00:00Z"}',
     'a0000000-0000-4000-a000-000000000001', NOW() - INTERVAL '10 hours'),

    ('g0000000-0000-4000-g000-000000000004', 'account_connected',
     'Connected TikTok account @socialpilot',
     '{"platform": "tiktok", "username": "@socialpilot"}',
     'a0000000-0000-4000-a000-000000000001', NOW() - INTERVAL '8 hours'),

    ('g0000000-0000-4000-g000-000000000005', 'ai_generated',
     'AI generated 3 content suggestions for next week',
     '{"count": 3, "categories": ["promotion", "educational", "engagement"]}',
     'a0000000-0000-4000-a000-000000000001', NOW() - INTERVAL '6 hours'),

    ('g0000000-0000-4000-g000-000000000006', 'comment_replied',
     'Auto-replied to 5 comments across platforms',
     '{"platforms": ["facebook", "instagram", "linkedin"], "count": 5}',
     'a0000000-0000-4000-a000-000000000001', NOW() - INTERVAL '4 hours'),

    ('g0000000-0000-4000-g000-000000000007', 'analytics_report',
     'Weekly analytics report generated',
     '{"period": "7d", "total_reach": 264500, "total_engagement": 31270}',
     'a0000000-0000-4000-a000-000000000001', NOW() - INTERVAL '2 hours'),

    ('g0000000-0000-4000-g000-000000000008', 'team_member_added',
     'Emma Wilson joined as Editor',
     '{"member_name": "Emma Wilson", "role": "editor"}',
     'a0000000-0000-4000-a000-000000000001', NOW());

-- Content templates (6 demo templates)
INSERT INTO content_templates (id, name, category, platform, content, variables) VALUES
    ('h0000000-0000-4000-h000-000000000001', 'Product Promotion', 'promotion', NULL,
     '🚀 Introducing {product_name}!

{product_description}

✨ Key Features:
{features_list}

🎉 Special launch offer: {offer}

#{hashtags}

Link in bio!',
     '["product_name", "product_description", "features_list", "offer", "hashtags"]'),

    ('h0000000-0000-4000-h000-000000000002', 'Educational Post', 'educational', NULL,
     '📚 {topic_title}

Did you know? {interesting_fact}

Here are {number} tips to help you:
{tips_list}

Save this for later! 🔖

#{hashtags}',
     '["topic_title", "interesting_fact", "number", "tips_list", "hashtags"]'),

    ('h0000000-0000-4000-h000-000000000003', 'Engagement Question', 'engagement', NULL,
     '💬 {question}

Drop your answer in the comments! 👇

Like & share if you agree! ❤️

#{hashtags}',
     '["question", "hashtags"]'),

    ('h0000000-0000-4000-h000-000000000004', 'LinkedIn Announcement', 'announcement', 'linkedin',
     '🚀 Exciting news!

{announcement_text}

{additional_details}

We''re thrilled to share this with our community. Stay tuned for more updates!

#{hashtags}',
     '["announcement_text", "additional_details", "hashtags"]'),

    ('h0000000-0000-4000-h000-000000000005', 'Instagram Story Template', 'engagement', 'instagram',
     '✨ {hook}

{main_content}

👉 Swipe up for more!

#{hashtags}',
     '["hook", "main_content", "hashtags"]'),

    ('h0000000-0000-4000-h000-000000000006', 'Twitter Thread Opener', 'educational', 'twitter',
     '🧵 {thread_title}

{first_point}

A thread 🧵👇',
     '["thread_title", "first_point"]');

-- Hashtag groups (5 demo groups)
INSERT INTO hashtag_groups (id, name, tags, platform) VALUES
    ('i0000000-0000-4000-i000-000000000001', 'General Marketing',
     '["#Marketing", "#DigitalMarketing", "#SocialMedia", "#ContentMarketing", "#MarketingTips", "#MarketingStrategy"]',
     NULL),

    ('i0000000-0000-4000-i000-000000000002', 'Instagram Growth',
     '["#InstagramGrowth", "#InstaTips", "#ReelsInstagram", "#InstagramStrategy", "#IGGrowth", "#InstaDaily"]',
     'instagram'),

    ('i0000000-0000-4000-i000-000000000003', 'Tech & AI',
     '["#AI", "#ArtificialIntelligence", "#MachineLearning", "#TechNews", "#Innovation", "#FutureTech"]',
     NULL),

    ('i0000000-0000-4000-i000-000000000004', 'Business & LinkedIn',
     '["#Business", "#Leadership", "#Entrepreneurship", "#ProfessionalDevelopment", "#B2BMarketing", "#LinkedInTips"]',
     'linkedin'),

    ('i0000000-0000-4000-i000-000000000005', 'Trending',
     '["#Trending", "#Viral", "#ForYou", "#FYP", "#TrendingNow", "#MustRead"]',
     NULL);
