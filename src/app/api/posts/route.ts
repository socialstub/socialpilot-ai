import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const platform = searchParams.get('platform');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (platform) where.platform = platform;

    const posts = await db.post.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        analytics: {
          orderBy: { date: 'desc' },
          take: 7,
        },
        postComments: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: posts.map((p) => ({
        id: p.id,
        title: p.title,
        content: p.content,
        platform: p.platform,
        mediaUrls: p.mediaUrls ? JSON.parse(p.mediaUrls) : undefined,
        hashtags: p.hashtags ? JSON.parse(p.hashtags) : undefined,
        scheduledAt: p.scheduledAt?.toISOString(),
        publishedAt: p.publishedAt?.toISOString(),
        status: p.status,
        aiGenerated: p.aiGenerated,
        reach: p.reach,
        engagement: p.engagement,
        likes: p.likes,
        comments: p.comments,
        shares: p.shares,
        clicks: p.clicks,
        analytics: p.analytics.map((a) => ({
          date: a.date.toISOString(),
          reach: a.reach,
          impressions: a.impressions,
          likes: a.likes,
          comments: a.comments,
          shares: a.shares,
          clicks: a.clicks,
          saves: a.saves,
        })),
        commentCount: p.postComments.length,
      })),
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch posts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const post = await db.post.create({
      data: {
        title: body.title,
        content: body.content,
        platform: body.platform || 'multi',
        mediaUrls: body.mediaUrls ? JSON.stringify(body.mediaUrls) : undefined,
        hashtags: body.hashtags ? JSON.stringify(body.hashtags) : undefined,
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
        status: body.status || 'draft',
        aiGenerated: body.aiGenerated || false,
        userId: body.userId || 'usr-001',
        accountId: body.accountId,
      },
    });
    return NextResponse.json({ success: true, data: post });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json({ success: false, error: 'Failed to create post' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, scheduledAt, status, ...data } = body;
    const post = await db.post.update({
      where: { id },
      data: {
        ...data,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        publishedAt: status === 'published' ? new Date() : undefined,
      },
    });
    return NextResponse.json({ success: true, data: post });
  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json({ success: false, error: 'Failed to update post' }, { status: 500 });
  }
}
