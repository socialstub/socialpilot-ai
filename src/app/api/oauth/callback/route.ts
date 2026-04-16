import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken, fetchUserProfile, getOAuthConfig, getBaseUrl } from '@/lib/oauth/flow';
import { db } from '@/lib/db';

// Helper to get or create default user
async function getOrCreateDefaultUser(): Promise<string> {
  let user = await db.user.findFirst();
  if (!user) {
    user = await db.user.create({
      data: {
        email: 'admin@socialpilot.ai',
        name: 'Admin',
        role: 'admin',
      },
    });
  }
  return user.id;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle OAuth errors from provider
    if (error) {
      const errorDesc = searchParams.get('error_description') || error;
      return NextResponse.redirect(
        `${getBaseUrl()}/?oauth_error=${encodeURIComponent(errorDesc)}&oauth_platform=unknown`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${getBaseUrl()}/?oauth_error=${encodeURIComponent('Missing code or state parameter')}&oauth_platform=unknown`
      );
    }

    // Look up the state and platform from our stored data
    // We search all platform configs to find the matching state
    const allConfigs = await db.oAuthAppConfig.findMany();
    let matchedPlatform: string | null = null;
    let matchedConfig: typeof allConfigs[0] | null = null;
    let codeVerifier: string | undefined;

    for (const config of allConfigs) {
      if (config.extraConfig) {
        try {
          const extra = JSON.parse(config.extraConfig);
          if (extra.oauthState === state) {
            matchedPlatform = config.platform;
            matchedConfig = config;
            codeVerifier = extra.pkceVerifier;
            break;
          }
        } catch {
          // Skip malformed configs
        }
      }
    }

    if (!matchedPlatform || !matchedConfig) {
      return NextResponse.redirect(
        `${getBaseUrl()}/?oauth_error=${encodeURIComponent('Invalid or expired OAuth state. Please try again.')}&oauth_platform=unknown`
      );
    }

    // Exchange code for tokens
    const redirectUri = matchedConfig.redirectUri || `${getBaseUrl()}/api/oauth/callback`;
    const tokenData = await exchangeCodeForToken(
      matchedPlatform,
      code,
      redirectUri,
      matchedConfig.clientId,
      matchedConfig.clientSecret
    );

    // Fetch user profile
    const profile = await fetchUserProfile(matchedPlatform, tokenData.access_token);

    // Calculate token expiry
    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000)
      : null;

    // Save to database
    const userId = await getOrCreateDefaultUser();

    // Check if account already exists
    const existingAccount = await db.socialAccount.findFirst({
      where: {
        platform: matchedPlatform,
        platformUserId: profile.id,
      },
    });

    if (existingAccount) {
      // Update existing account
      await db.socialAccount.update({
        where: { id: existingAccount.id },
        data: {
          username: profile.username,
          displayName: profile.displayName,
          avatar: profile.avatar || existingAccount.avatar,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token || existingAccount.refreshToken,
          tokenExpiresAt: expiresAt || existingAccount.tokenExpiresAt,
          followersCount: profile.followersCount || existingAccount.followersCount,
          followingCount: profile.followingCount || existingAccount.followingCount,
          isActive: true,
          lastSyncedAt: new Date(),
        },
      });
    } else {
      // Create new account
      await db.socialAccount.create({
        data: {
          platform: matchedPlatform,
          platformUserId: profile.id,
          username: profile.username,
          displayName: profile.displayName,
          avatar: profile.avatar,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token || null,
          tokenExpiresAt: expiresAt,
          followersCount: profile.followersCount || 0,
          followingCount: profile.followingCount || 0,
          isActive: true,
          lastSyncedAt: new Date(),
          userId,
        },
      });
    }

    // Clean up stored state
    try {
      const extra = matchedConfig.extraConfig ? JSON.parse(matchedConfig.extraConfig) : {};
      delete extra.oauthState;
      delete extra.pkceVerifier;
      await db.oAuthAppConfig.update({
        where: { platform: matchedPlatform },
        data: { extraConfig: JSON.stringify(extra) },
      });
    } catch {
      // Non-critical
    }

    // Log activity
    await db.activity.create({
      data: {
        type: 'account_connected',
        message: `Connected ${profile.displayName} (@${profile.username}) on ${matchedPlatform}`,
        userId,
        metadata: JSON.stringify({ platform: matchedPlatform, username: profile.username }),
      },
    });

    // Redirect to app with success
    return NextResponse.redirect(
      `${getBaseUrl()}/?oauth_success=true&oauth_platform=${matchedPlatform}&oauth_username=${encodeURIComponent(profile.username)}`
    );
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      `${getBaseUrl()}/?oauth_error=${encodeURIComponent(error instanceof Error ? error.message : 'OAuth connection failed')}&oauth_platform=unknown`
    );
  }
}
