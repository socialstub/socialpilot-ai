import { NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

// Lazy singleton for LLM client
let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null;

async function getLLM() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create();
  }
  return zaiInstance;
}

// AI-powered content generation endpoint (uses z-ai-web-dev-sdk)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, topic, platform, tone, length, content, url } = body;

    let result = '';

    switch (type) {
      case 'generate_caption':
        result = await generateCaptionWithAI(topic, platform, tone, length);
        break;
      case 'rewrite':
        result = await rewriteForPlatformWithAI(content, platform, tone);
        break;
      case 'hashtags':
        result = await generateHashtagsWithAI(topic || content, platform);
        break;
      case 'auto_reply':
        result = await generateAutoReplyWithAI(content);
        break;
      case 'trends':
        result = JSON.stringify(getTrendingTopics());
        break;
      case 'best_time':
        result = JSON.stringify(getBestTime(platform));
        break;
      case 'schedule_suggestions':
        result = JSON.stringify(getScheduleSuggestions());
        break;
      default:
        result = 'AI feature not yet implemented.';
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error in AI endpoint:', error);
    return NextResponse.json({ success: false, error: 'AI request failed' }, { status: 500 });
  }
}

// ─── AI-Powered Functions (with fallback to mock) ───────────────────────────

async function generateCaptionWithAI(topic: string, platform: string, tone: string, length: string): Promise<string> {
  const platformLabel = platform ? platform.charAt(0).toUpperCase() + platform.slice(1) : 'General';
  const toneLabel = tone || 'professional';
  const lengthLabel = length || 'medium';

  const lengthGuidance: Record<string, string> = {
    short: 'Keep it concise — 1-2 short sentences maximum, under 150 characters.',
    medium: 'Write a moderately detailed caption — 3-5 sentences, around 150-300 characters.',
    long: 'Write a detailed, engaging caption — 5-8 sentences, around 300-500 characters with bullet points or line breaks.',
  };

  try {
    const zai = await getLLM();
    const response = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content:
            'You are a world-class social media content strategist with expertise in crafting viral, engaging posts across all major platforms. You understand platform-specific nuances, audience psychology, and what drives engagement. Always produce original, authentic content that feels human — never generic or robotic. Include relevant emojis naturally but don\'t overdo them.',
        },
        {
          role: 'user',
          content: `Generate a social media caption for the following:\n\n- Topic: ${topic}\n- Platform: ${platformLabel}\n- Tone: ${toneLabel}\n- Length: ${lengthLabel}\n\nGuidelines:\n${lengthGuidance[lengthLabel] || lengthGuidance.medium}\nTailor the style to ${platformLabel}\'s culture and audience. Make it feel native to the platform. Include 2-4 relevant hashtags at the end.`,
        },
      ],
      thinking: { type: 'disabled' },
    });

    const text = response.choices[0]?.message?.content?.trim();
    if (text) return text;
  } catch (error) {
    console.error('LLM generate_caption failed, falling back to mock:', error);
  }

  return generateCaption(topic, platform, tone, length);
}

async function rewriteForPlatformWithAI(content: string, platform: string, tone: string): Promise<string> {
  const platformLabel = platform ? platform.charAt(0).toUpperCase() + platform.slice(1) : 'General';
  const toneLabel = tone || 'professional';

  const platformConstraints: Record<string, string> = {
    twitter: 'Maximum 280 characters. Be punchy and direct. Use 1-2 hashtags max.',
    instagram: 'Can be longer (up to 2,200 characters). Use line breaks, emojis, and 5-10 hashtags. Style should be visual and aspirational.',
    linkedin: 'Professional tone, thought-leadership style. Can be up to 3,000 characters. Use bullet points and clear structure. Avoid excessive emojis.',
    facebook: 'Conversational and engaging. 200-500 characters optimal. Encourage likes, comments, and shares. Use a couple of emojis.',
    tiktok: 'Short, punchy, Gen-Z friendly. Use trending language and 3-5 hashtags. High energy.',
  };

  try {
    const zai = await getLLM();
    const response = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content:
            'You are a social media content adapter. Your job is to take existing content and rewrite it to perfectly fit a specific platform\'s style, constraints, and audience. Preserve the core message while optimizing for maximum engagement on the target platform.',
        },
        {
          role: 'user',
          content: `Rewrite the following content for ${platformLabel}:\n\nOriginal content: "${content}"\n\nTarget tone: ${toneLabel}\nPlatform constraints: ${platformConstraints[platform] || 'Keep it engaging and native to the platform.'}\n\nRewrite the content to feel natural and native to ${platformLabel}. Do NOT wrap in quotes.`,
        },
      ],
      thinking: { type: 'disabled' },
    });

    const text = response.choices[0]?.message?.content?.trim();
    if (text) return text;
  } catch (error) {
    console.error('LLM rewrite failed, falling back to mock:', error);
  }

  return rewriteForPlatform(content, platform, tone);
}

async function generateHashtagsWithAI(topic: string, platform: string): Promise<string> {
  const platformLabel = platform ? platform.charAt(0).toUpperCase() + platform.slice(1) : 'General';

  try {
    const zai = await getLLM();
    const response = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content:
            'You are a social media hashtag expert. You know which hashtags perform well on each platform and understand hashtag strategy — mixing broad, niche, and trending tags. Always respond with valid JSON only, no markdown, no extra text.',
        },
        {
          role: 'user',
          content: `Generate relevant hashtags for the following:\n\n- Topic/Content: "${topic}"\n- Platform: ${platformLabel}\n\nRespond ONLY with a JSON object in this exact format (no markdown, no code fences):\n{"hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5", "#tag6", "#tag7", "#tag8", "#tag9", "#tag10", "#tag11", "#tag12", "#tag13", "#tag14", "#tag15"], "performance_score": <number 60-95>, "trending": ["#trending1", "#trending2", "#trending3"]}\n\nGenerate 15 hashtags total. Include a mix of high-volume, niche, and platform-specific tags. The performance_score estimates how well these tags would perform (60-95). The trending array should have 3 tags that are currently trending.`,
        },
      ],
      thinking: { type: 'disabled' },
    });

    const raw = response.choices[0]?.message?.content?.trim();
    if (raw) {
      // Strip markdown code fences if present
      const cleaned = raw.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim();
      const parsed = JSON.parse(cleaned);
      if (parsed.hashtags && Array.isArray(parsed.hashtags)) {
        return JSON.stringify(parsed);
      }
    }
  } catch (error) {
    console.error('LLM hashtags failed, falling back to mock:', error);
  }

  return JSON.stringify(generateHashtags(topic, platform, 15));
}

async function generateAutoReplyWithAI(commentContent: string): Promise<string> {
  try {
    const zai = await getLLM();
    const response = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content:
            'You are a social media community manager for a brand. You reply to comments in a friendly, genuine, and engaging way. Your replies should feel human — not corporate. Keep replies concise (1-2 sentences). Use emojis occasionally when it feels natural. Be helpful, appreciative, and conversational. Never be defensive or dismissive.',
        },
        {
          role: 'user',
          content: `Generate a reply to this social media comment:\n\n"${commentContent}"\n\nWrite a friendly, contextual reply that acknowledges what the person said. Keep it brief and natural. Do NOT wrap in quotes.`,
        },
      ],
      thinking: { type: 'disabled' },
    });

    const text = response.choices[0]?.message?.content?.trim();
    if (text) return text;
  } catch (error) {
    console.error('LLM auto_reply failed, falling back to mock:', error);
  }

  return generateAutoReply(commentContent);
}

// ─── Mock Fallback Functions ────────────────────────────────────────────────

function generateCaption(topic: string, platform: string, tone: string, length: string) {
  const captions: Record<string, string[]> = {
    professional: [
      `📈 ${topic}\n\nIn today's competitive landscape, staying ahead means embracing innovation and data-driven strategies. Our latest analysis reveals key insights that can transform your approach.\n\nKey takeaways:\n• Data-informed decision making drives 3x better results\n• Automation reduces operational costs by up to 40%\n• AI-powered analytics provide real-time competitive advantage\n\nWhat strategies are you implementing? Share your thoughts below.\n\n#BusinessGrowth #Innovation #Leadership #Strategy`,
      `🚀 Exciting developments in ${topic}!\n\nWe've been exploring how forward-thinking organizations are adapting to the changing landscape. Here's what we found:\n\n1. The shift towards AI-first strategies is accelerating\n2. Customer experience remains the top differentiator\n3. Cross-platform consistency drives brand trust\n4. Measurable ROI from content marketing is at an all-time high\n\nThe future belongs to those who prepare today. Are you ready?\n\n#Growth #Innovation #FutureOfWork`,
    ],
    casual: [
      `Hey everyone! 👋 Let's talk about ${topic} today!\n\nWe've been experimenting with some new approaches and honestly? The results have been INSANE 🤯\n\nHere's what worked:\n✅ Authentic storytelling\n✅ Real-time engagement\n✅ Consistency over perfection\n\nDrop a 🔥 if you agree!\n\n#${topic.replace(/\s+/g, '')} #Growth`,
      `PSA: ${topic} just hit different lately 💯\n\nWe tried something new this week and the engagement went through the roof! Want to know the secret?\n\nHint: It involves being more human and less corporate 😅\n\nComment "SEND" and I'll share the full breakdown! 👇\n\n#MarketingTips #ContentCreator`,
    ],
    inspiring: [
      `✨ ${topic}\n\nEvery great journey begins with a single step. Today, we're sharing the story behind our mission to empower creators and businesses worldwide.\n\nThe road hasn't always been easy, but every challenge has shaped us into who we are today. And we're just getting started.\n\nTo everyone who's been part of this journey - thank you. Your support means everything. 🙏\n\nHere's to bigger dreams and bolder actions. The best is yet to come! 🚀\n\n#Inspiration #Growth #Entrepreneurship #DreamBig`,
    ],
  };

  const toneKey = tone || 'professional';
  const toneCaptions = captions[toneKey] || captions.professional;
  return toneCaptions[Math.floor(Math.random() * toneCaptions.length)];
}

function rewriteForPlatform(content: string, platform: string, tone: string) {
  const platformAdaptations: Record<string, { prefix: string; suffix: string; maxLen: number; emoji: string }> = {
    twitter: { prefix: '', suffix: '', maxLen: 270, emoji: '🧵' },
    instagram: { prefix: '', suffix: '\n\n.\n.\n.\nFollow for more! ✨', maxLen: 2200, emoji: '📸' },
    linkedin: { prefix: '', suffix: '\n\nWhat are your thoughts? I\'d love to hear your perspective in the comments.\n\n#Professional #Leadership', maxLen: 3000, emoji: '💼' },
    facebook: { prefix: '📢 ', suffix: '\n\nLike ❤️ Comment 💬 Share 🔄 Save 🔖', maxLen: 500, emoji: '📢' },
    tiktok: { prefix: '', suffix: '\n\n#fyp #viral', maxLen: 2200, emoji: '🎬' },
  };

  const adaptation = platformAdaptations[platform] || platformAdaptations.facebook;
  let adapted = `${adaptation.emoji} ${content}`;

  if (adapted.length > adaptation.maxLen) {
    adapted = adapted.substring(0, adaptation.maxLen - 3) + '...';
  }

  return adapted + adaptation.suffix;
}

function generateHashtags(topic: string, platform: string, count: number) {
  const allHashtags = [
    '#SocialMedia', '#Marketing', '#ContentCreation', '#DigitalMarketing', '#Growth',
    '#Branding', '#Entrepreneur', '#Business', '#AI', '#Technology',
    '#Innovation', '#Productivity', '#Success', '#Motivation', '#Leadership',
    '#Startup', '#MarketingTips', '#SocialMediaMarketing', '#ContentMarketing',
    '#DigitalTransformation', '#FutureOfWork', '#CreatorEconomy', '#Viral',
    '#Trending', '#InfluencerMarketing', '#SocialMediaStrategy', '#GrowthHacking',
    '#MarketingDigital', '#BusinessGrowth', '#Onlinemarketing',
  ];

  const shuffled = allHashtags.sort(() => Math.random() - 0.5);
  return {
    hashtags: shuffled.slice(0, count),
    performance_score: Math.floor(Math.random() * 30 + 70),
    trending: shuffled.slice(0, 5),
  };
}

function generateAutoReply(commentContent: string) {
  const replies = [
    'Thank you so much for your kind words! We truly appreciate your support. 🙏',
    'Great question! We\'d love to share more details. Stay tuned for our upcoming post about this! 🚀',
    'Thanks for engaging! We love hearing from our community. What topics would you like us to cover next?',
    'That means a lot to us! Our team works hard to deliver value. Your feedback keeps us motivated! 💪',
    'Absolutely! We\'re always looking to improve. Your input helps us serve you better. Thank you! ✨',
    'We\'re glad you found this helpful! Feel free to share it with anyone who might benefit too. 🤝',
  ];
  return replies[Math.floor(Math.random() * replies.length)];
}

// ─── Mock Data Functions (kept as-is) ───────────────────────────────────────

function getTrendingTopics() {
  return [
    { topic: 'AI-Generated Content', trend: '+340%', category: 'Technology', velocity: 'high' },
    { topic: 'Short-Form Video', trend: '+210%', category: 'Content Type', velocity: 'high' },
    { topic: 'Authentic Branding', trend: '+180%', category: 'Marketing', velocity: 'medium' },
    { topic: 'Micro-Influencers', trend: '+150%', category: 'Strategy', velocity: 'medium' },
    { topic: 'Social Commerce', trend: '+125%', category: 'E-Commerce', velocity: 'medium' },
    { topic: 'Sustainability Marketing', trend: '+98%', category: 'Values', velocity: 'low' },
    { topic: 'Interactive Content', trend: '+87%', category: 'Engagement', velocity: 'medium' },
    { topic: 'Employee Advocacy', trend: '+76%', category: 'HR/Marketing', velocity: 'low' },
  ];
}

function getBestTime(platform: string) {
  const times: Record<string, { times: string[]; bestDay: string; score: number }> = {
    facebook: { times: ['9:00 AM EST', '1:00 PM EST', '3:00 PM EST'], bestDay: 'Wednesday', score: 87 },
    instagram: { times: ['11:00 AM EST', '1:00 PM EST', '7:00 PM EST'], bestDay: 'Tuesday', score: 92 },
    twitter: { times: ['8:00 AM EST', '12:00 PM EST', '5:00 PM EST'], bestDay: 'Thursday', score: 78 },
    linkedin: { times: ['7:00 AM EST', '12:00 PM EST', '5:00 PM EST'], bestDay: 'Tuesday', score: 85 },
    tiktok: { times: ['7:00 AM EST', '12:00 PM EST', '7:00 PM EST'], bestDay: 'Saturday', score: 94 },
    youtube: { times: ['2:00 PM EST', '4:00 PM EST', '6:00 PM EST'], bestDay: 'Saturday', score: 81 },
  };
  return times[platform] || times.facebook;
}

function getScheduleSuggestions() {
  return [
    { day: 'Monday', time: '9:00 AM', platform: 'linkedin', reason: 'High professional engagement start of week' },
    { day: 'Tuesday', time: '11:00 AM', platform: 'instagram', reason: 'Peak Instagram engagement window' },
    { day: 'Tuesday', time: '12:00 PM', platform: 'twitter', reason: 'Lunch break browsing peak' },
    { day: 'Wednesday', time: '1:00 PM', platform: 'facebook', reason: 'Mid-week engagement peak' },
    { day: 'Thursday', time: '5:00 PM', platform: 'linkedin', reason: 'End of workday browsing' },
    { day: 'Saturday', time: '12:00 PM', platform: 'tiktok', reason: 'Weekend leisure browsing peak' },
    { day: 'Saturday', time: '4:00 PM', platform: 'youtube', reason: 'Weekend video watching peak' },
  ];
}
