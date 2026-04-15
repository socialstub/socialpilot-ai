import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const members = await db.teamMember.findMany({
      include: { user: true },
      orderBy: { joinedAt: 'desc' },
    });
    return NextResponse.json({
      success: true,
      data: members.map((m) => ({
        id: m.id,
        name: m.user.name,
        email: m.user.email,
        avatar: m.user.avatar,
        role: m.role,
        joinedAt: m.joinedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Error fetching team:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch team' }, { status: 500 });
  }
}
