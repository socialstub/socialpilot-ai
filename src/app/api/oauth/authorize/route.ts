import { NextRequest, NextResponse } from 'next/server';
import { buildAuthorizationUrl, generateState, generatePKCE, getOAuthConfig, getBaseUrl } from '@/lib/oauth/flow';
import { getPlatformConfig } from '@/lib/oauth/config';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');

    if (!platform) {
      return NextResponse.json(
        { success: false, error: 'Platform is required' },
        { status: 400 }
      );
    }

    const platformOAuthConfig = getPlatformConfig(platform);
    if (!platformOAuthConfig) {
      return NextResponse.json(
        { success: false, error: `Unsupported platform: ${platform}` },
        { status: 400 }
      );
    }

    // Check if OAuth is configured for this platform
    const appConfig = await getOAuthConfig(platform);
    if (!appConfig || !appConfig.isEnabled || !appConfig.clientId) {
      return NextResponse.json(
        {
          success: false,
          error: `${platformOAuthConfig.name} OAuth is not configured. Please set up OAuth credentials in Settings first.`,
          requiresSetup: true,
          developerPortalUrl: platformOAuthConfig.developerPortalUrl,
          instructions: platformOAuthConfig.instructions,
        },
        { status: 400 }
      );
    }

    // Generate state for CSRF protection
    const state = generateState();

    // Generate PKCE for platforms that need it (Twitter)
    let codeChallenge: string | undefined;
    if (platform === 'twitter') {
      const pkce = generatePKCE();
      codeChallenge = pkce.codeChallenge;
      // Store code verifier in the app config temporarily
      // In production, use a proper state storage (Redis, DB, etc.)
      await import('@/lib/db').then(({ db }) =>
        db.oAuthAppConfig.update({
          where: { platform },
          data: {
            extraConfig: JSON.stringify({
              ...(appConfig.extraConfig ? JSON.parse(appConfig.extraConfig) : {}),
              pkceVerifier: pkce.codeVerifier,
              oauthState: state,
            }),
          },
        })
      );
    }

    // Parse scopes
    const scopes = appConfig.scopes
      ? JSON.parse(appConfig.scopes)
      : platformOAuthConfig.defaultScopes;

    const redirectUri = appConfig.redirectUri || `${getBaseUrl()}/api/oauth/callback`;

    // Build authorization URL
    const authUrl = buildAuthorizationUrl(
      platform,
      appConfig.clientId,
      redirectUri,
      scopes,
      state,
      codeChallenge
    );

    return NextResponse.json({
      success: true,
      data: {
        authUrl,
        state,
        platform,
        redirectUri,
      },
    });
  } catch (error) {
    console.error('OAuth authorize error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate authorization URL' },
      { status: 500 }
    );
  }
}
