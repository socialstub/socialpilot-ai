import { db } from '@/lib/db';
import { PlatformKey } from '@/lib/constants';

// Seed data for development
async function main() {
  console.log('🌱 Seeding database...');

  // Create main user
  const user = await db.user.upsert({
    where: { email: 'sarah@socialpilot.ai' },
    update: {},
    create: {
      email: 'sarah@socialpilot.ai',
      name: 'Sarah Chen',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      role: 'admin',
    },
  });

  // Create team members
  const teamMembers = [
    { email: 'alex@socialpilot.ai', name: 'Alex Rivera', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex', role: 'editor' },
    { email: 'emma@socialpilot.ai', name: 'Emma Wilson', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma', role: 'editor' },
    { email: 'mike@socialpilot.ai', name: 'Mike Johnson', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike', role: 'viewer' },
    { email: 'lisa@socialpilot.ai', name: 'Lisa Park', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa', role: 'viewer' },
  ];

  for (const member of teamMembers) {
    await db.user.upsert({
      where: { email: member.email },
      update: {},
      create: member,
    });
  }

  // Create team
  const team = await db.team.upsert({
    where: { id: 'team-main' },
    update: {},
    create: {
      id: 'team-main',
      name: 'Marketing Team',
      description: 'Main social media marketing team',
    },
  });

  // Create social accounts
  const accountsData = [
    { platform: 'facebook' as PlatformKey, platformUserId: 'fb-001', username: 'socialpilot_official', displayName: 'SocialPilot Official', followersCount: 45200, followingCount: 320 },
    { platform: 'instagram' as PlatformKey, platformUserId: 'ig-001', username: '@socialpilot', displayName: '@socialpilot', followersCount: 89400, followingCount: 540 },
    { platform: 'twitter' as PlatformKey, platformUserId: 'tw-001', username: '@socialpilot_ai', displayName: '@socialpilot_ai', followersCount: 32100, followingCount: 890 },
    { platform: 'linkedin' as PlatformKey, platformUserId: 'li-001', username: 'socialpilot-company', displayName: 'SocialPilot Inc.', followersCount: 28700, followingCount: 150 },
    { platform: 'tiktok' as PlatformKey, platformUserId: 'tt-001', username: '@socialpilot', displayName: '@socialpilot', followersCount: 156000, followingCount: 120 },
    { platform: 'youtube' as PlatformKey, platformUserId: 'yt-001', username: 'SocialPilot', displayName: 'SocialPilot Channel', followersCount: 12400, followingCount: 45 },
  ];

  const createdAccounts = [];
  for (const acc of accountsData) {
    const account = await db.socialAccount.upsert({
      where: { id: `acc-${acc.platform}` },
      update: {},
      create: {
        id: `acc-${acc.platform}`,
        ...acc,
        userId: user.id,
        isActive: true,
        accessToken: 'mock_token_' + acc.platform,
        refreshToken: 'mock_refresh_' + acc.platform,
        lastSyncedAt: new Date(),
      },
    });
    createdAccounts.push(account);
  }

  // Create posts
  const postsData = [
    {
      id: 'post-1',
      title: 'AI Revolution in Social Media',
      content: '🚀 The AI revolution is transforming how we create and manage social media content. From automated scheduling to smart analytics, the future is here! #SocialMedia #AI #Marketing',
      platform: 'multi',
      status: 'published',
      aiGenerated: true,
      reach: 45200,
      engagement: 3200,
      likes: 2800,
      comments: 210,
      shares: 190,
      clicks: 450,
      publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      userId: user.id,
    },
    {
      id: 'post-2',
      title: '10 Tips for Instagram Growth',
      content: '📈 Want to grow your Instagram in 2025? Here are 10 proven strategies:\n\n1. Post consistently\n2. Use Reels\n3. Engage with your community\n4. Use relevant hashtags\n5. Collaborate with others\n6. Share behind-the-scenes content\n7. Run contests\n8. Use Stories daily\n9. Optimize your bio\n10. Analyze your analytics\n\n#InstagramGrowth #SocialMediaTips',
      platform: 'instagram',
      status: 'published',
      aiGenerated: false,
      reach: 28900,
      engagement: 4500,
      likes: 4100,
      comments: 180,
      shares: 220,
      clicks: 320,
      publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      userId: user.id,
    },
    {
      id: 'post-3',
      title: 'Product Launch Announcement',
      content: '🎉 We\'re thrilled to announce our new AI-powered scheduling feature! Now you can let AI choose the best time to post based on your audience insights. Try it today! #ProductLaunch #Innovation',
      platform: 'linkedin',
      status: 'published',
      aiGenerated: true,
      reach: 35100,
      engagement: 2800,
      likes: 1900,
      comments: 340,
      shares: 560,
      clicks: 780,
      publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      userId: user.id,
    },
    {
      id: 'post-4',
      title: 'Behind the Scenes',
      content: 'Take a peek behind the scenes at SocialPilot HQ! Our team works hard to bring you the best social media management tools. 💪 #BehindTheScenes #TeamWork',
      platform: 'tiktok',
      status: 'published',
      aiGenerated: false,
      reach: 128000,
      engagement: 18900,
      likes: 15200,
      comments: 2100,
      shares: 1600,
      clicks: 890,
      publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      userId: user.id,
    },
    {
      id: 'post-5',
      title: 'Weekly Marketing Tips',
      content: 'Thread: 5 marketing trends to watch in 2025\n\n1/ AI-generated content is becoming mainstream\n\n2/ Short-form video continues to dominate\n\n3/ Social commerce is booming\n\n4/ Authenticity beats perfection\n\n5/ Micro-influencers deliver better ROI',
      platform: 'twitter',
      status: 'published',
      aiGenerated: true,
      reach: 18500,
      engagement: 1200,
      likes: 890,
      comments: 120,
      shares: 190,
      clicks: 340,
      publishedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      userId: user.id,
    },
    {
      id: 'post-6',
      title: 'Upcoming Webinar',
      content: '📚 Free Webinar: Master Social Media Analytics\n\nJoin us next Thursday at 2 PM EST for an in-depth session on understanding your social media metrics.\n\nTopics:\n- Key metrics that matter\n- Cross-platform analysis\n- AI-driven insights\n- Actionable strategies\n\nLink in bio! #Webinar #SocialMediaAnalytics',
      platform: 'multi',
      status: 'scheduled',
      scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      aiGenerated: false,
      userId: user.id,
    },
    {
      id: 'post-7',
      title: 'Customer Success Story',
      content: 'How @TechStartup increased their social media engagement by 340% in just 3 months using our platform. Read the full case study! #CustomerSuccess #SocialMedia',
      platform: 'linkedin',
      status: 'pending_approval',
      aiGenerated: true,
      userId: user.id,
    },
    {
      id: 'post-8',
      title: 'Weekend Fun Post',
      content: 'Sunday vibes! What\'s your social media strategy for the week ahead? Drop your goals in the comments! 👇 #SundayMotivation #SocialMediaStrategy',
      platform: 'facebook',
      status: 'draft',
      aiGenerated: false,
      userId: user.id,
    },
    {
      id: 'post-9',
      title: 'Tutorial: Content Calendar',
      content: 'New video tutorial: How to create an effective content calendar for your business in 2025. Full walkthrough with tips and templates! 🎬',
      platform: 'youtube',
      status: 'published',
      aiGenerated: false,
      reach: 8900,
      engagement: 670,
      likes: 520,
      comments: 89,
      shares: 61,
      clicks: 230,
      publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      userId: user.id,
    },
    {
      id: 'post-10',
      title: 'Friday Tips',
      content: 'It\'s Friday! Time for our weekly social media roundup. Here are the top performing posts from our community this week. Check them out! 🏆 #FridayRoundup',
      platform: 'multi',
      status: 'scheduled',
      scheduledAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      aiGenerated: true,
      userId: user.id,
    },
  ];

  for (const post of postsData) {
    await db.post.upsert({
      where: { id: post.id },
      update: {},
      create: post,
    });
  }

  // Create analytics data for each published post
  const publishedPosts = postsData.filter(p => p.status === 'published');
  for (const post of publishedPosts) {
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      await db.postAnalytics.create({
        data: {
          date,
          postId: post.id,
          reach: Math.floor(post.reach * (0.1 + Math.random() * 0.15)),
          impressions: Math.floor(post.reach * (0.2 + Math.random() * 0.3)),
          likes: Math.floor(post.likes * (0.08 + Math.random() * 0.12)),
          comments: Math.floor(post.comments * (0.1 + Math.random() * 0.15)),
          shares: Math.floor(post.shares * (0.08 + Math.random() * 0.12)),
          clicks: Math.floor(post.clicks * (0.1 + Math.random() * 0.15)),
          saves: Math.floor(Math.random() * 50),
        },
      });
    }
  }

  // Create comments
  const commentsData = [
    { platform: 'facebook', content: 'This is amazing! We need more tools like this.', authorName: 'David Miller', postId: 'post-1' },
    { platform: 'facebook', content: 'How much does it cost?', authorName: 'Jessica Brown', postId: 'post-1' },
    { platform: 'instagram', content: 'Great tips! Already seeing results 😍', authorName: 'Amanda Lee', postId: 'post-2' },
    { platform: 'instagram', content: 'The Reels tip is a game changer!', authorName: 'Chris Taylor', postId: 'post-2' },
    { platform: 'linkedin', content: 'Congratulations on the launch! This is exactly what the industry needs.', authorName: 'Robert Chen', postId: 'post-3' },
    { platform: 'linkedin', content: 'The AI scheduling feature sounds incredible. Would love a demo.', authorName: 'Sarah Williams', postId: 'post-3' },
    { platform: 'twitter', content: 'Spot on! AI content is the future 🤖', authorName: 'Alex Kumar', postId: 'post-5' },
    { platform: 'twitter', content: 'Micro-influencers all the way! Much better engagement.', authorName: 'Maria Garcia', postId: 'post-5' },
    { platform: 'youtube', content: 'Best tutorial I\'ve seen on content calendars. Subscribed!', authorName: 'Tom Harris', postId: 'post-9' },
    { platform: 'youtube', content: 'Can you do one on hashtag strategy next?', authorName: 'Nina Patel', postId: 'post-9' },
    { platform: 'tiktok', content: 'Love the team energy! 🔥🔥🔥', authorName: 'Zoe Zhang', postId: 'post-4' },
    { platform: 'tiktok', content: 'This is goals! How can I join?', authorName: 'Jake Wilson', postId: 'post-4' },
  ];

  for (const comment of commentsData) {
    await db.comment.create({
      data: {
        id: `comment-${Math.random().toString(36).substr(2, 9)}`,
        ...comment,
        platformId: `plt-${Math.random().toString(36).substr(2, 9)}`,
        authorAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.authorName.replace(' ', '')}`,
        isReplied: Math.random() > 0.5,
        aiReply: Math.random() > 0.5 ? 'Thanks for your comment! We appreciate your support and feedback. 🙏' : null,
      },
    });
  }

  // Create activities
  const activitiesData = [
    { type: 'post_published', message: 'Published "AI Revolution in Social Media" across all platforms' },
    { type: 'post_published', message: 'Published "10 Tips for Instagram Growth" on Instagram' },
    { type: 'post_scheduled', message: 'Scheduled "Upcoming Webinar" for Thursday at 2 PM' },
    { type: 'account_connected', message: 'Connected TikTok account @socialpilot' },
    { type: 'ai_generated', message: 'AI generated 3 content suggestions for next week' },
    { type: 'comment_replied', message: 'Auto-replied to 5 comments across platforms' },
    { type: 'analytics_report', message: 'Weekly analytics report generated' },
    { type: 'team_member_added', message: 'Emma Wilson joined as Editor' },
  ];

  for (let i = 0; i < activitiesData.length; i++) {
    await db.activity.create({
      data: {
        ...activitiesData[i],
        userId: user.id,
        createdAt: new Date(Date.now() - i * 2 * 60 * 60 * 1000),
      },
    });
  }

  // Create content templates
  const templates = [
    { name: 'Product Promotion', category: 'promotion', platform: null, content: '🚀 Introducing {product_name}!\n\n{product_description}\n\n✨ Key Features:\n{features_list}\n\n🎉 Special launch offer: {offer}\n\n#{hashtags}\n\nLink in bio!' },
    { name: 'Educational Post', category: 'educational', platform: null, content: '📚 {topic_title}\n\nDid you know? {interesting_fact}\n\nHere are {number} tips to help you:\n{tips_list}\n\nSave this for later! 🔖\n\n#{hashtags}' },
    { name: 'Engagement Question', category: 'engagement', platform: null, content: '💬 {question}\n\nDrop your answer in the comments! 👇\n\nLike & share if you agree! ❤️\n\n#{hashtags}' },
    { name: 'LinkedIn Announcement', category: 'announcement', platform: 'linkedin', content: '🚀 Exciting news!\n\n{announcement_text}\n\n{additional_details}\n\nWe\'re thrilled to share this with our community. Stay tuned for more updates!\n\n#{hashtags}' },
    { name: 'Instagram Story Template', category: 'engagement', platform: 'instagram', content: '✨ {hook}\n\n{main_content}\n\n👉 Swipe up for more!\n\n#{hashtags}' },
    { name: 'Twitter Thread Opener', category: 'educational', platform: 'twitter', content: '🧵 {thread_title}\n\n{first_point}\n\nA thread 🧵👇' },
  ];

  for (const template of templates) {
    await db.contentTemplate.create({
      data: {
        id: `template-${template.name.toLowerCase().replace(/\s+/g, '-')}`,
        ...template,
        variables: '["product_name", "product_description", "features_list", "offer", "hashtags", "topic_title", "interesting_fact", "number", "tips_list", "question", "announcement_text", "additional_details", "hook", "main_content", "thread_title", "first_point"]',
      },
    });
  }

  // Create hashtag groups
  const hashtagGroups = [
    { name: 'General Marketing', platform: null, tags: '["#Marketing", "#DigitalMarketing", "#SocialMedia", "#ContentMarketing", "#MarketingTips", "#MarketingStrategy"]' },
    { name: 'Instagram Growth', platform: 'instagram', tags: '["#InstagramGrowth", "#InstaTips", "#ReelsInstagram", "#InstagramStrategy", "#IGGrowth", "#InstaDaily"]' },
    { name: 'Tech & AI', platform: null, tags: '["#AI", "#ArtificialIntelligence", "#MachineLearning", "#TechNews", "#Innovation", "#FutureTech"]' },
    { name: 'Business & LinkedIn', platform: 'linkedin', tags: '["#Business", "#Leadership", "#Entrepreneurship", "#ProfessionalDevelopment", "#B2BMarketing", "#LinkedInTips"]' },
    { name: 'Trending', platform: null, tags: '["#Trending", "#Viral", "#ForYou", "#FYP", "#TrendingNow", "#MustRead"]' },
  ];

  for (const group of hashtagGroups) {
    await db.hashtagGroup.create({
      data: {
        id: `hashtags-${group.name.toLowerCase().replace(/\s+/g, '-')}`,
        ...group,
      },
    });
  }

  // Create team
  const team2 = await db.team.upsert({
    where: { id: 'team-2' },
    update: {},
    create: {
      id: 'team-2',
      name: 'Content Team',
      description: 'Content creation and curation team',
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log(`- Created ${accountsData.length} social accounts`);
  console.log(`- Created ${postsData.length} posts`);
  console.log(`- Created ${commentsData.length} comments`);
  console.log(`- Created ${activitiesData.length} activities`);
  console.log(`- Created ${templates.length} templates`);
  console.log(`- Created ${hashtagGroups.length} hashtag groups`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
