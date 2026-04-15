import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get aggregate stats
    const totalPosts = await db.post.count();
    const publishedPosts = await db.post.count({ where: { status: 'published' } });
    const scheduledPosts = await db.post.count({ where: { status: 'scheduled' } });
    const draftPosts = await db.post.count({ where: { status: 'draft' } });
    const pendingPosts = await db.post.count({ where: { status: 'pending_approval' } });

    // Get aggregate engagement
    const aggregateStats = await db.post.aggregate({
      where: { status: 'published' },
      _sum: {
        reach: true,
        likes: true,
        comments: true,
        shares: true,
        clicks: true,
        engagement: true,
      },
    });

    // Get analytics data for charts
    const analytics = await db.postAnalytics.findMany({
      orderBy: { date: 'asc' },
    });

    // Group analytics by date
    const analyticsByDate = analytics.reduce((acc, item) => {
      const dateKey = item.date.toISOString().split('T')[0];
      if (!acc[dateKey]) {
        acc[dateKey] = { date: dateKey, reach: 0, impressions: 0, likes: 0, comments: 0, shares: 0, clicks: 0 };
      }
      acc[dateKey].reach += item.reach;
      acc[dateKey].impressions += item.impressions;
      acc[dateKey].likes += item.likes;
      acc[dateKey].comments += item.comments;
      acc[dateKey].shares += item.shares;
      acc[dateKey].clicks += item.clicks;
      return acc;
    }, {} as Record<string, { date: string; reach: number; impressions: number; likes: number; comments: number; shares: number; clicks: number }>);

    // Get platform-specific stats
    const postsByPlatform = await db.post.groupBy({
      by: ['platform'],
      where: { status: 'published' },
      _sum: {
        reach: true,
        likes: true,
        comments: true,
        shares: true,
        engagement: true,
      },
      _count: true,
    });

    // Get connected accounts
    const accounts = await db.socialAccount.findMany({
      where: { isActive: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        posts: {
          total: totalPosts,
          published: publishedPosts,
          scheduled: scheduledPosts,
          drafts: draftPosts,
          pending: pendingPosts,
        },
        engagement: {
          totalReach: aggregateStats._sum.reach || 0,
          totalLikes: aggregateStats._sum.likes || 0,
          totalComments: aggregateStats._sum.comments || 0,
          totalShares: aggregateStats._sum.shares || 0,
          totalClicks: aggregateStats._sum.clicks || 0,
          totalEngagement: aggregateStats._sum.engagement || 0,
        },
        timeline: Object.values(analyticsByDate),
        platforms: postsByPlatform,
        accounts: {
          total: accounts.length,
          totalFollowers: accounts.reduce((sum, a) => sum + a.followersCount, 0),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
