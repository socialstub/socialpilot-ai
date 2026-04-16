// OAuth 2.0 Configuration for all supported social media platforms
// Each platform's authorization endpoints, scopes, and settings

export interface PlatformOAuthConfig {
  platform: string;
  name: string;
  authUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  defaultScopes: string[];
  scopeSeparator: string;
  responseType: string;
  grantType: string;
  docsUrl: string;
  developerPortalUrl: string;
  instructions: string[];
  color: string;
}

export const PLATFORM_OAUTH_CONFIGS: Record<string, PlatformOAuthConfig> = {
  facebook: {
    platform: 'facebook',
    name: 'Facebook',
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
    userInfoUrl: 'https://graph.facebook.com/me?fields=id,name,email,picture.width(200)',
    defaultScopes: ['public_profile', 'email', 'pages_show_list', 'pages_read_engagement'],
    scopeSeparator: ',',
    responseType: 'code',
    grantType: 'authorization_code',
    docsUrl: 'https://developers.facebook.com/docs/facebook-login/',
    developerPortalUrl: 'https://developers.facebook.com/apps/',
    instructions: [
      'Go to Meta for Developers and create a new app',
      'Select "Business" as the app type',
      'Add "Facebook Login" product to your app',
      'In Settings > Basic, copy your App ID and App Secret',
      'Set "Valid OAuth Redirect URIs" to your callback URL',
      'Set the app to "Live" mode when ready for production',
    ],
    color: '#1877F2',
  },
  instagram: {
    platform: 'instagram',
    name: 'Instagram',
    authUrl: 'https://api.instagram.com/oauth/authorize',
    tokenUrl: 'https://api.instagram.com/oauth/access_token',
    userInfoUrl: 'https://graph.instagram.com/me?fields=id,username,name,account_type,media_count,followers_count,follows_count,profile_picture_url',
    defaultScopes: ['instagram_business_basic', 'instagram_business_content_publish', 'instagram_business_manage_comments', 'instagram_business_manage_messages'],
    scopeSeparator: ',',
    responseType: 'code',
    grantType: 'authorization_code',
    docsUrl: 'https://developers.facebook.com/docs/instagram-api/getting-started/',
    developerPortalUrl: 'https://developers.facebook.com/apps/',
    instructions: [
      'Go to Meta for Developers and create a new app',
      'Select "Business" as the app type',
      'Add "Instagram Basic Display" or "Instagram Graph API" product',
      'In Settings > Basic, copy your App ID and App Secret',
      'Set "Valid OAuth Redirect URIs" to your callback URL',
      'Note: Instagram requires a linked Facebook Page or Instagram Business/Creator account',
    ],
    color: '#E4405F',
  },
  twitter: {
    platform: 'twitter',
    name: 'X (Twitter)',
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    tokenUrl: 'https://api.twitter.com/2/oauth2/token',
    userInfoUrl: 'https://api.twitter.com/2/users/me?user.fields=profile_image_url,public_metrics,description,created_at',
    defaultScopes: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
    scopeSeparator: ' ',
    responseType: 'code',
    grantType: 'authorization_code',
    docsUrl: 'https://developer.twitter.com/en/docs/authentication/oauth-2-0',
    developerPortalUrl: 'https://developer.twitter.com/en/portal/dashboard',
    instructions: [
      'Go to Twitter Developer Portal and create a new project & app',
      'Enable OAuth 2.0 in "User authentication settings"',
      'Set "App permissions" to "Read and Write"',
      'Set "Type of App" to "Web App, Automated App or Bot"',
      'Enter your callback URL in "Callback URI / Redirect URL"',
      'Copy your Client ID and Client Secret',
    ],
    color: '#000000',
  },
  linkedin: {
    platform: 'linkedin',
    name: 'LinkedIn',
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    userInfoUrl: 'https://api.linkedin.com/v2/userinfo',
    defaultScopes: ['openid', 'profile', 'email', 'w_member_social'],
    scopeSeparator: ' ',
    responseType: 'code',
    grantType: 'authorization_code',
    docsUrl: 'https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow',
    developerPortalUrl: 'https://www.linkedin.com/developers/apps',
    instructions: [
      'Go to LinkedIn Developer Portal and create a new app',
      'In the "Auth" tab, add the "Sign In with LinkedIn" product',
      'Under "OAuth 2.0 Scopes", select the required permissions',
      'Copy your Client ID and Client Secret',
      'Add your redirect URL under "Authorized redirect URLs"',
      'For posting, request "w_member_social" scope during app review',
    ],
    color: '#0A66C2',
  },
  tiktok: {
    platform: 'tiktok',
    name: 'TikTok',
    authUrl: 'https://www.tiktok.com/v2/auth/authorize/',
    tokenUrl: 'https://open.tiktokapis.com/v2/oauth/token/',
    userInfoUrl: 'https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,username,avatar_url,follower_count,following_count,likes_count,video_count',
    defaultScopes: ['user.info.basic', 'user.info.profile', 'video.publish', 'video.list'],
    scopeSeparator: ',',
    responseType: 'code',
    grantType: 'authorization_code',
    docsUrl: 'https://developers.tiktok.com/doc/get-started/get-access-token/',
    developerPortalUrl: 'https://developers.tiktok.com/apps',
    instructions: [
      'Go to TikTok for Developers and create a new app',
      'Select "Web App" as the app type',
      'Set the redirect URL in "Manage apps" > "Security"',
      'Apply for required scopes (user.info.basic, video.publish, etc.)',
      'Copy your Client Key and Client Secret',
      'Note: Some scopes require TikTok review and approval',
    ],
    color: '#000000',
  },
  youtube: {
    platform: 'youtube',
    name: 'YouTube',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
    defaultScopes: [
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
    scopeSeparator: ' ',
    responseType: 'code',
    grantType: 'authorization_code',
    docsUrl: 'https://developers.google.com/youtube/v3/guides/auth/server-side-web-apps',
    developerPortalUrl: 'https://console.cloud.google.com/apis/credentials',
    instructions: [
      'Go to Google Cloud Console and create a new project',
      'Enable "YouTube Data API v3" in "APIs & Services > Library"',
      'Go to "APIs & Services > Credentials" and create "OAuth client ID"',
      'Select "Web application" as the application type',
      'Add your domain to "Authorized JavaScript origins"',
      'Add your callback URL to "Authorized redirect URIs"',
      'Copy your Client ID and Client Secret',
    ],
    color: '#FF0000',
  },
};

export function getPlatformConfig(platform: string): PlatformOAuthConfig | undefined {
  return PLATFORM_OAUTH_CONFIGS[platform];
}

export function getPlatformList(): PlatformOAuthConfig[] {
  return Object.values(PLATFORM_OAUTH_CONFIGS);
}
