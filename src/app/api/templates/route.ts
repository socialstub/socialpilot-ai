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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, category, platform, content, variables } = body;

    if (!name || !content) {
      return NextResponse.json(
        { success: false, error: 'Name and content are required' },
        { status: 400 },
      );
    }

    // Auto-detect variables from content if not provided
    const detectedVariables = variables || extractVariables(content);

    const template = await db.contentTemplate.create({
      data: {
        name,
        category: category || 'engagement',
        platform: platform || null,
        content,
        variables: JSON.stringify(detectedVariables),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: template.id,
        name: template.name,
        category: template.category,
        platform: template.platform,
        content: template.content,
        variables: detectedVariables,
      },
    });
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json({ success: false, error: 'Failed to create template' }, { status: 500 });
  }
}

function extractVariables(content: string): string[] {
  const regex = /\{(\w+)\}/g;
  const variables: string[] = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }
  return variables;
}
