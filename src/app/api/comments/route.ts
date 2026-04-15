import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const comments = await db.comment.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return NextResponse.json({
      success: true,
      data: comments.map((c) => ({
        id: c.id,
        platform: c.platform,
        content: c.content,
        authorName: c.authorName,
        authorAvatar: c.authorAvatar,
        isReplied: c.isReplied,
        aiReply: c.aiReply,
        createdAt: c.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch comments' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const comment = await db.comment.update({
      where: { id: body.id },
      data: { isReplied: true, aiReply: body.reply },
    });
    return NextResponse.json({ success: true, data: comment });
  } catch (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json({ success: false, error: 'Failed to update comment' }, { status: 500 });
  }
}
