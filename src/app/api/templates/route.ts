import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const templates = await db.contentTemplate.findMany({
      orderBy: { createdAt: 'desc' },
    });
    const hashtagGroups = await db.hashtagGroup.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({
      success: true,
      data: {
        templates: templates.map((t) => ({
          id: t.id,
          name: t.name,
          category: t.category,
          platform: t.platform,
          content: t.content,
          variables: t.variables ? JSON.parse(t.variables) : [],
        })),
        hashtagGroups: hashtagGroups.map((h) => ({
          id: h.id,
          name: h.name,
          tags: JSON.parse(h.tags),
          platform: h.platform,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch templates' }, { status: 500 });
  }
}
