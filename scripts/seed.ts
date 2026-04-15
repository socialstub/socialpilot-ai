import { db } from '../src/lib/db';

async function seed() {
  const userCount = await db.user.count();
  if (userCount > 0) {
    console.log('Database already has data, skipping seed');
    return;
  }

  console.log('Seeding database...');

  const user = await db.user.create({
    data: { email: 'sarah@socialpilot.ai', name: 'Sarah Chen', role: 'admin' },
  });

  const platforms = [
    { platform: 'facebook', username: 'SocialPilotHQ', displayName: 'SocialPilot', followersCount: 24500, followingCount: 1200 },
    { platform: 'instagram', username: 'socialpilot.official', displayName: 'SocialPilot', followersCount: 52000, followingCount: 890 },
    { platform: 'twitter', username: 'SocialPilotAI', displayName: 'SocialPilot AI', followersCount: 18000, followingCount: 2100 },
    { platform: 'linkedin', username: 'socialpilot-company', displayName: 'SocialPilot Inc.', followersCount: 8500, followingCount: 450 },
    { platform: 'tiktok', username: 'socialpilot', displayName: 'SocialPilot', followersCount: 125000, followingCount: 320 },
    { platform: 'youtube', username: 'SocialPilotChannel', displayName: 'SocialPilot Channel', followersCount: 4200, followingCount: 150 },
  ];

  for (const p of platforms) {
    await db.socialAccount.create({
      data: { ...p, platformUserId: `plt-${p.platform}`, userId: user.id, accessToken: 'mock', refreshToken: 'mock' },
    });
  }

  const contents = [
    { title: '5 Tips for Better Social Media Engagement', content: 'Want to boost your engagement? Here are our top 5 strategies that helped us grow 300% this quarter!', platform: 'instagram', status: 'published', likes: 1240, comments: 89, shares: 234, clicks: 456 },
    { title: 'Behind the Scenes: Our AI-Powered Dashboard', content: 'Take a peek at how our team built the most intuitive social media dashboard!', platform: 'facebook', status: 'published', likes: 890, comments: 56, shares: 123, clicks: 789 },
    { title: 'The Future of Content Creation', content: 'AI is transforming content creation. Here is what brands need to know to stay ahead.', platform: 'linkedin', status: 'published', likes: 2100, comments: 145, shares: 567, clicks: 1230 },
    { title: 'Viral TikTok Strategy Guide', content: 'We analyzed 10K viral TikToks and found the 3 key patterns. Thread incoming...', platform: 'twitter', status: 'published', likes: 4500, comments: 312, shares: 890, clicks: 2100 },
    { title: 'Our Journey to 100K Followers', content: 'What a milestone! Here are the exact strategies that got us here. Save this for later!', platform: 'tiktok', status: 'published', likes: 15000, comments: 890, shares: 3400, clicks: 5600 },
    { title: 'New Feature: AI Content Generator', content: 'Introducing our newest AI-powered tool! Generate engaging social media posts in seconds.', platform: 'youtube', status: 'published', likes: 670, comments: 45, shares: 89, clicks: 340 },
    { title: 'Monday Motivation Post', content: 'Start your week strong! Here are our top 3 productivity hacks for social media managers.', platform: 'instagram', status: 'scheduled', likes: 0, comments: 0, shares: 0, clicks: 0 },
    { title: 'Industry Trends Q4 2025', content: 'The biggest social media trends for Q4 2025. From short-form video to AI-generated content.', platform: 'linkedin', status: 'scheduled', likes: 0, comments: 0, shares: 0, clicks: 0 },
    { title: 'Customer Spotlight: TechStartup', content: 'How @TechStartup used our platform to grow their social media presence by 300% in just 3 months!', platform: 'facebook', status: 'pending_approval', likes: 0, comments: 0, shares: 0, clicks: 0 },
    { title: 'Quick Tip: Hashtag Strategy', content: 'Stop using the same 20 hashtags! Here is a data-driven approach to finding the best hashtags for your niche.', platform: 'instagram', status: 'draft', likes: 0, comments: 0, shares: 0, clicks: 0, aiGenerated: true },
    { title: 'Product Update v2.5', content: 'We just shipped 5 new features including AI scheduling, multi-platform analytics, and team collaboration tools!', platform: 'twitter', status: 'published', likes: 3200, comments: 198, shares: 445, clicks: 1800 },
    { title: 'Weekly Social Media Checklist', content: 'Never miss a post again! Here is our ultimate weekly checklist for social media managers.', platform: 'linkedin', status: 'published', likes: 980, comments: 67, shares: 234, clicks: 560 },
  ];

  for (let i = 0; i < contents.length; i++) {
    const post = contents[i];
    const reach = post.likes * 10 + post.comments * 20 + post.shares * 50 + post.clicks * 5;
    const engagement = post.likes + post.comments + post.shares + post.clicks;
    const scheduledAt = post.status === 'scheduled' ? new Date(Date.now() + (i + 1) * 86400000) : null;
    const publishedAt = post.status === 'published' ? new Date(Date.now() - Math.random() * 7 * 86400000) : null;

    await db.post.create({
      data: {
        title: post.title,
        content: post.content,
        platform: post.platform,
        status: post.status,
        likes: post.likes,
        comments: post.comments,
        shares: post.shares,
        clicks: post.clicks,
        reach,
        engagement,
        aiGenerated: post.aiGenerated || false,
        userId: user.id,
        publishedAt,
        scheduledAt,
      },
    });
  }

  const activities = [
    { type: 'post_published', message: 'Published "5 Tips for Better Social Media Engagement" on Instagram' },
    { type: 'post_published', message: 'Published "Behind the Scenes" on Facebook' },
    { type: 'post_published', message: 'Published "The Future of Content Creation" on LinkedIn' },
    { type: 'comment', message: 'New comment on Instagram post' },
    { type: 'milestone', message: 'Instagram reached 50K followers!' },
    { type: 'post_scheduled', message: 'Scheduled "Monday Motivation Post" for tomorrow' },
    { type: 'post_published', message: 'Published "Product Update v2.5" on Twitter' },
    { type: 'account_connected', message: 'Connected new TikTok account: @socialpilot' },
    { type: 'engagement', message: 'Your TikTok video reached 10K views!' },
    { type: 'post_published', message: 'Published "Weekly Social Media Checklist" on LinkedIn' },
  ];

  for (const act of activities) {
    await db.activity.create({ data: { ...act, userId: user.id } });
  }

  const teamData = [
    { name: 'Alex Rivera', email: 'alex@socialpilot.ai', role: 'editor' },
    { name: 'Jordan Lee', email: 'jordan@socialpilot.ai', role: 'editor' },
    { name: 'Morgan Taylor', email: 'morgan@socialpilot.ai', role: 'viewer' },
  ];

  for (const member of teamData) {
    await db.user.create({ data: member });
  }

  const commentsData = [
    { platform: 'instagram', content: 'This is exactly what I needed! Your tips on content scheduling are incredible', authorName: 'sarah_creates' },
    { platform: 'facebook', content: 'Can you do a deep dive on hashtag strategy for 2025?', authorName: 'MarketingMike' },
    { platform: 'linkedin', content: 'Great insights! I shared this with my entire team.', authorName: 'Jennifer Chen' },
    { platform: 'twitter', content: 'disagree with the posting frequency recommendation. less is more imo', authorName: '@digital_nomad_joe' },
    { platform: 'tiktok', content: 'Made this recipe and it turned out amazing! Thanks for sharing', authorName: 'foodie_anna' },
    { platform: 'instagram', content: 'Love the new dashboard update! So much cleaner now', authorName: 'design_dan' },
  ];

  for (const comment of commentsData) {
    await db.comment.create({
      data: {
        ...comment,
        platformId: `cmt-${Math.random().toString(36).slice(2, 10)}`,
        userId: user.id,
      },
    });
  }

  console.log('Database seeded successfully!');
}

seed().catch(console.error).finally(() => db.$disconnect());
