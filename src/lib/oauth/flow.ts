// OAuth 2.0 Flow utilities for generating auth URLs and exchanging tokens

import { getPlatformConfig } from './config';
import { db } from '@/lib/db';
import crypto from 'crypto';

/**
 * Generate a random state parameter for CSRF protection
 */
export function generateState(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate PKCE code verifier and challenge (for platforms like Twitter)
 */
export function generatePKCE() {
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');
  return { codeVerifier, codeChallenge };
}

/**
 * Get OAuth app config from database
 */
export async function getOAuthConfig(platform: string) {
  const config = await db.oAuthAppConfig.findUnique({
    where: { platform },
  });
  return config;
}

/**
 * Check if a platform has real OAuth configured
 */
export async function isPlatformConfigured(platform: string): Promise<boolean> {
  const config = await getOAuthConfig(platform);
  return !!(config && config.isEnabled && config.clientId && config.clientSecret);
}

/**
 * Get the base URL of the application
 */
export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  }
  // Fallback for development
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  return `${protocol}://localhost:3000`;
}

/**
 * Generate the OAuth authorization URL for a platform
 */
export function buildAuthorizationUrl(
  platform: string,
  clientId: string,
  redirectUri: string,
  scopes: string[],
  state: string,
  codeChallenge?: string
): string {
  const config = getPlatformConfig(platform);
  if (!config) throw new Error(`Unknown platform: ${platform}`);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scopes.join(config.scopeSeparator),
    response_type: config.responseType,
    state,
  });

  // Add PKCE for platforms that require it (Twitter)
  if (codeChallenge) {
    params.set('code_challenge', codeChallenge);
    params.set('code_challenge_method', 'S256');
  }

  // Platform-specific parameters
  if (platform === 'youtube' || platform === 'google') {
    params.set('access_type', 'offline');
    params.set('prompt', 'consent');
  }

  if (platform === 'linkedin') {
    params.set('prompt', 'consent');
  }

  return `${config.authUrl}?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(
  platform: string,
  code: string,
  redirectUri: string,
  clientId: string,
  clientSecret: string
): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
}> {
  const config = getPlatformConfig(platform);
  if (!config) throw new Error(`Unknown platform: ${platform}`);

  const params = new URLSearchParams({
    grant_type: config.grantType,
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Token exchange failed (${response.status}): ${errorData}`);
  }

  const data = await response.json();
  return data;
}

/**
 * Fetch user profile from platform API using access token
 */
export async function fetchUserProfile(
  platform: string,
  accessToken: string
): Promise<{
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  followersCount?: number;
  followingCount?: number;
}> {
  const config = getPlatformConfig(platform);
  if (!config) throw new Error(`Unknown platform: ${platform}`);

  const response = await fetch(config.userInfoUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Failed to fetch user profile (${response.status}): ${errorData}`);
  }

  const data = await response.json();

  // Normalize response across platforms
  switch (platform) {
    case 'facebook':
      return {
        id: data.id,
        username: data.id,
        displayName: data.name || 'Facebook User',
        avatar: data.picture?.data?.url,
      };
    case 'instagram':
      return {
        id: data.id,
        username: data.username || data.id,
        displayName: data.name || data.username || 'Instagram User',
        avatar: data.profile_picture_url,
        followersCount: data.followers_count || 0,
        followingCount: data.follows_count || 0,
      };
    case 'twitter': {
      const user = data.data;
      return {
        id: user.id,
        username: user.username,
        displayName: user.name || user.username,
        avatar: user.profile_image_url?.replace('_normal', ''),
        followersCount: user.public_metrics?.followers_count || 0,
        followingCount: user.public_metrics?.following_count || 0,
      };
    }
    case 'linkedin':
      return {
        id: data.sub,
        username: data.email || data.sub,
        displayName: data.name || data.given_name
          ? `${data.given_name} ${data.family_name || ''}`
          : 'LinkedIn User',
        avatar: data.picture,
      };
    case 'tiktok': {
      const tiktokUser = data.data?.user || data;
      return {
        id: tiktokUser.open_id || tiktokUser.id,
        username: tiktokUser.username || tiktokUser.display_name,
        displayName: tiktokUser.display_name || tiktokUser.username || 'TikTok User',
        avatar: tiktokUser.avatar_url,
        followersCount: tiktokUser.follower_count || 0,
        followingCount: tiktokUser.following_count || 0,
      };
    }
    case 'youtube':
      return {
        id: data.id,
        username: data.email || data.id,
        displayName: data.name || 'YouTube User',
        avatar: data.picture,
      };
    default:
      throw new Error(`Unknown platform for profile fetch: ${platform}`);
  }
}

/**
 * Store OAuth state temporarily for CSRF validation
 */
export function storeOAuthState(state: string, data: { platform: string; codeVerifier?: string }) {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(`oauth_state_${state}`, JSON.stringify(data));
  }
}

/**
 * Retrieve and validate OAuth state
 */
export function retrieveOAuthState(state: string): { platform: string; codeVerifier?: string } | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(`oauth_state_${state}`);
  if (!raw) return null;
  sessionStorage.removeItem(`oauth_state_${state}`);
  return JSON.parse(raw);
}
