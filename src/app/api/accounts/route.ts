import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Account ID required' }, { status: 400 });
    }
    await db.socialAccount.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Account deleted' });
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete account' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const accounts = await db.socialAccount.findMany({
      orderBy: { connectedAt: 'desc' },
    });
    return NextResponse.json({
      success: true,
      data: accounts.map((a) => ({
        id: a.id,
        platform: a.platform,
        username: a.username,
        displayName: a.displayName,
        avatar: a.avatar,
        followersCount: a.followersCount,
        followingCount: a.followingCount,
        isActive: a.isActive,
        connectedAt: a.connectedAt.toISOString(),
        lastSyncedAt: a.lastSyncedAt?.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch accounts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const account = await db.socialAccount.create({
      data: {
        platform: body.platform,
        platformUserId: `plt-${Date.now()}`,
        username: body.username,
        displayName: body.displayName || body.username,
        avatar: body.avatar,
        followersCount: body.followersCount || 0,
        followingCount: body.followingCount || 0,
        accessToken: body.accessToken || 'mock_token',
        refreshToken: body.refreshToken || 'mock_refresh',
        isActive: true,
        userId: body.userId || 'usr-001',
      },
    });
    return NextResponse.json({ success: true, data: account });
  } catch (error) {
    console.error('Error creating account:', error);
    return NextResponse.json({ success: false, error: 'Failed to create account' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    const account = await db.socialAccount.update({
      where: { id },
      data,
    });
    return NextResponse.json({ success: true, data: account });
  } catch (error) {
    console.error('Error updating account:', error);
    return NextResponse.json({ success: false, error: 'Failed to update account' }, { status: 500 });
  }
}
