import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/oauth/settings - Get all OAuth configurations
export async function GET() {
  try {
    const configs = await db.oAuthAppConfig.findMany({
      orderBy: { platform: 'asc' },
    });

    // Return configs with secrets partially masked
    const safeConfigs = configs.map((config) => ({
      id: config.id,
      platform: config.platform,
      clientId: config.clientId,
      clientSecret: config.clientSecret
        ? `${config.clientSecret.substring(0, 6)}${'*'.repeat(Math.max(0, config.clientSecret.length - 6))}`
        : '',
      redirectUri: config.redirectUri,
      isEnabled: config.isEnabled,
      scopes: config.scopes,
      isConfigured: !!(config.clientId && config.clientSecret && config.isEnabled),
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    }));

    return NextResponse.json({ success: true, data: safeConfigs });
  } catch (error) {
    console.error('Error fetching OAuth settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch OAuth settings' },
      { status: 500 }
    );
  }
}

// POST /api/oauth/settings - Create or update OAuth configuration for a platform
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { platform, clientId, clientSecret, redirectUri, scopes, isEnabled } = body;

    if (!platform || !clientId || !clientSecret) {
      return NextResponse.json(
        { success: false, error: 'platform, clientId, and clientSecret are required' },
        { status: 400 }
      );
    }

    // Upsert: create if not exists, update if exists
    const config = await db.oAuthAppConfig.upsert({
      where: { platform },
      create: {
        platform,
        clientId,
        clientSecret,
        redirectUri: redirectUri || null,
        scopes: scopes ? JSON.stringify(scopes) : null,
        isEnabled: isEnabled !== false,
      },
      update: {
        clientId,
        clientSecret,
        redirectUri: redirectUri || null,
        scopes: scopes ? JSON.stringify(scopes) : undefined,
        isEnabled: isEnabled !== false,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: config.id,
        platform: config.platform,
        isEnabled: config.isEnabled,
      },
    });
  } catch (error) {
    console.error('Error saving OAuth settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save OAuth settings' },
      { status: 500 }
    );
  }
}

// PATCH /api/oauth/settings - Toggle OAuth enabled/disabled
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { platform, isEnabled } = body;

    if (!platform) {
      return NextResponse.json(
        { success: false, error: 'Platform is required' },
        { status: 400 }
      );
    }

    const config = await db.oAuthAppConfig.update({
      where: { platform },
      data: { isEnabled },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: config.id,
        platform: config.platform,
        isEnabled: config.isEnabled,
      },
    });
  } catch (error) {
    console.error('Error toggling OAuth:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update OAuth settings' },
      { status: 500 }
    );
  }
}

// PUT /api/oauth/settings - Full update (including clientSecret if provided)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { platform, clientId, clientSecret, redirectUri, scopes, isEnabled } = body;

    if (!platform) {
      return NextResponse.json(
        { success: false, error: 'Platform is required' },
        { status: 400 }
      );
    }

    // Build update data - only include clientSecret if it's a new real value (not masked)
    const updateData: Record<string, unknown> = {};
    if (clientId) updateData.clientId = clientId;
    if (clientSecret && !clientSecret.includes('******')) updateData.clientSecret = clientSecret;
    if (redirectUri !== undefined) updateData.redirectUri = redirectUri;
    if (scopes) updateData.scopes = JSON.stringify(scopes);
    if (isEnabled !== undefined) updateData.isEnabled = isEnabled;

    const config = await db.oAuthAppConfig.update({
      where: { platform },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: config.id,
        platform: config.platform,
        isEnabled: config.isEnabled,
      },
    });
  } catch (error) {
    console.error('Error updating OAuth settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update OAuth settings' },
      { status: 500 }
    );
  }
}

// DELETE /api/oauth/settings?platform=xxx - Remove OAuth configuration
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');

    if (!platform) {
      return NextResponse.json(
        { success: false, error: 'Platform is required' },
        { status: 400 }
      );
    }

    await db.oAuthAppConfig.delete({
      where: { platform },
    });

    return NextResponse.json({ success: true, message: 'OAuth configuration deleted' });
  } catch (error) {
    console.error('Error deleting OAuth settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete OAuth settings' },
      { status: 500 }
    );
  }
}
