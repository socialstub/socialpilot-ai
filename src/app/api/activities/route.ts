import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const activities = await db.activity.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return NextResponse.json({
      success: true,
      data: activities.map((a) => ({
        id: a.id,
        type: a.type,
        message: a.message,
        metadata: a.metadata ? JSON.parse(a.metadata) : null,
        createdAt: a.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch activities' }, { status: 500 });
  }
}
