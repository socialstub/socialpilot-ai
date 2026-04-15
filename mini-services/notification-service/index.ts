import { createServer } from 'http';
import { Server } from 'socket.io';

const httpServer = createServer();
const io = new Server(httpServer, {
  path: '/',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// ── Types ─────────────────────────────────────────────────────────────────────

type NotificationType = 'comment' | 'publish' | 'engagement' | 'reminder' | 'follower_milestone';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  platform: string;
  timestamp: string;
  read: boolean;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const generateId = () => Math.random().toString(36).substr(2, 9);

const PLATFORMS = ['Instagram', 'Facebook', 'Twitter/X', 'LinkedIn', 'TikTok', 'YouTube'];

const COMMENT_TEMPLATES = [
  { title: 'New comment on Instagram', message: 'Sarah left a comment: "Love this post!"' },
  { title: 'New comment on LinkedIn', message: 'John shared his thoughts on your article.' },
  { title: 'New comment on Facebook', message: 'Mike commented: "This is amazing content!"' },
  { title: 'New reply on Twitter/X', message: 'Alex replied to your thread about marketing tips.' },
  { title: 'New comment on TikTok', message: 'Emily commented: "Can you make a part 2?"' },
  { title: 'New comment on YouTube', message: 'David commented: "Best tutorial I\'ve seen!"' },
];

const PUBLISH_TEMPLATES = [
  { title: 'Post published successfully', message: 'Your Instagram post is now live.' },
  { title: 'Post published successfully', message: 'Your LinkedIn article was published.' },
  { title: 'Video uploaded successfully', message: 'Your TikTok video is now live.' },
  { title: 'Post published successfully', message: 'Your Facebook post is now visible.' },
  { title: 'Tweet posted successfully', message: 'Your tweet was sent successfully.' },
  { title: 'Video published', message: 'Your YouTube video is now public.' },
];

const ENGAGEMENT_TEMPLATES = [
  { title: 'Engagement spike detected!', message: 'Your Instagram post reached 1K likes!' },
  { title: 'Trending on TikTok', message: 'TikTok video trending — 10K views!' },
  { title: 'LinkedIn milestone', message: 'Your post got 500+ impressions in 1 hour.' },
  { title: 'Facebook virality alert', message: 'Your post was shared 200 times!' },
  { title: 'Twitter engagement boost', message: 'Your tweet was retweeted 50 times.' },
  { title: 'YouTube milestone', message: 'Your video hit 5K views!' },
  { title: 'Instagram Reel viral', message: 'Your Reel has been viewed 25K times!' },
  { title: 'LinkedIn engagement record', message: '100+ comments on your latest post!' },
];

const REMINDER_TEMPLATES = [
  { title: 'Best time to post', message: 'Engagement peak on Instagram in 30 minutes.' },
  { title: 'Posting reminder', message: 'Your audience is most active on Twitter/X right now.' },
  { title: 'Schedule reminder', message: 'You have 3 posts scheduled for today.' },
  { title: 'Content calendar alert', message: 'No posts scheduled for tomorrow. Plan ahead!' },
  { title: 'Optimal posting window', message: 'LinkedIn engagement peaks in 15 minutes.' },
];

const FOLLOWER_MILESTONE_TEMPLATES = [
  { title: 'Follower milestone reached!', message: 'Your Instagram account just hit 10,000 followers!' },
  { title: 'New follower milestone', message: 'LinkedIn connections reached 5,000!' },
  { title: 'Follower milestone', message: 'Your TikTok account surpassed 25K followers!' },
  { title: 'Growing fast!', message: 'Facebook page likes crossed 2,000!' },
  { title: 'Milestone unlocked', message: 'YouTube subscribers hit 1,000!' },
  { title: 'Community growth', message: 'Twitter/X followers reached 15,000!' },
];

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function createNotification(type: NotificationType): Notification {
  let template;
  let platform;

  switch (type) {
    case 'comment':
      template = getRandomItem(COMMENT_TEMPLATES);
      platform = template.title.split('on ')[1] || 'Instagram';
      return {
        id: generateId(),
        type,
        title: template.title,
        message: template.message,
        platform,
        timestamp: new Date().toISOString(),
        read: false,
      };
    case 'publish':
      template = getRandomItem(PUBLISH_TEMPLATES);
      platform = template.message.split('Your ')[1]?.split(' ')[0] || 'Instagram';
      return {
        id: generateId(),
        type,
        title: template.title,
        message: template.message,
        platform,
        timestamp: new Date().toISOString(),
        read: false,
      };
    case 'engagement':
      template = getRandomItem(ENGAGEMENT_TEMPLATES);
      platform = template.title.includes('Instagram') ? 'Instagram'
        : template.title.includes('TikTok') ? 'TikTok'
        : template.title.includes('LinkedIn') ? 'LinkedIn'
        : template.title.includes('Facebook') ? 'Facebook'
        : template.title.includes('Twitter') ? 'Twitter/X'
        : template.title.includes('YouTube') ? 'YouTube'
        : getRandomItem(PLATFORMS);
      return {
        id: generateId(),
        type,
        title: template.title,
        message: template.message,
        platform,
        timestamp: new Date().toISOString(),
        read: false,
      };
    case 'reminder':
      template = getRandomItem(REMINDER_TEMPLATES);
      platform = template.message.split('on ')[1]?.split(' ')[0]?.replace(/[.,]/g, '') || getRandomItem(PLATFORMS);
      return {
        id: generateId(),
        type,
        title: template.title,
        message: template.message,
        platform,
        timestamp: new Date().toISOString(),
        read: false,
      };
    case 'follower_milestone':
      template = getRandomItem(FOLLOWER_MILESTONE_TEMPLATES);
      platform = template.title.includes('Instagram') ? 'Instagram'
        : template.title.includes('LinkedIn') ? 'LinkedIn'
        : template.title.includes('TikTok') ? 'TikTok'
        : template.title.includes('Facebook') ? 'Facebook'
        : template.title.includes('YouTube') ? 'YouTube'
        : template.title.includes('Twitter') ? 'Twitter/X'
        : getRandomItem(PLATFORMS);
      return {
        id: generateId(),
        type,
        title: template.title,
        message: template.message,
        platform,
        timestamp: new Date().toISOString(),
        read: false,
      };
  }
}

function getRandomType(): NotificationType {
  const types: NotificationType[] = ['comment', 'publish', 'engagement', 'reminder', 'follower_milestone'];
  const weights = [0.25, 0.2, 0.2, 0.2, 0.15];
  const rand = Math.random();
  let cumulative = 0;
  for (let i = 0; i < types.length; i++) {
    cumulative += weights[i];
    if (rand <= cumulative) return types[i];
  }
  return 'comment';
}

// ── Server Logic ─────────────────────────────────────────────────────────────

const connectedClients = new Map<string, { subscriptions: Set<NotificationType> }>();

// Schedule a notification for a specific client after random delay
function scheduleNextNotification(socketId: string) {
  const client = connectedClients.get(socketId);
  if (!client) return;

  const delay = 25000 + Math.random() * 15000; // 25-40 seconds
  setTimeout(() => {
    // Check client still connected
    if (!connectedClients.has(socketId)) return;

    const type = getRandomType();
    const notification = createNotification(type);

    // Only send if client subscribes to this type (or subscribes to all)
    if (client.subscriptions.size === 0 || client.subscriptions.has(type)) {
      io.to(socketId).emit('notification', notification);
    }

    // Schedule next one
    scheduleNextNotification(socketId);
  }, delay);
}

io.on('connection', (socket) => {
  console.log(`[Notification Service] Client connected: ${socket.id}`);

  // Initialize client
  connectedClients.set(socket.id, { subscriptions: new Set() });

  // Send welcome event with initial data
  const welcomeNotifications: Notification[] = [
    createNotification('publish'),
    createNotification('comment'),
    createNotification('engagement'),
  ];
  // Mark the older ones as read
  welcomeNotifications[0].read = true;
  welcomeNotifications[1].read = true;
  welcomeNotifications[0].timestamp = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago
  welcomeNotifications[1].timestamp = new Date(Date.now() - 1800000).toISOString(); // 30 min ago

  socket.emit('welcome', {
    message: 'Connected to SocialPilot AI Notification Service',
    notifications: welcomeNotifications.reverse(),
    serverTime: new Date().toISOString(),
  });

  // Start sending periodic notifications
  scheduleNextNotification(socket.id);

  // Subscribe to notification types
  socket.on('subscribe', (types: NotificationType[] | NotificationType) => {
    const client = connectedClients.get(socket.id);
    if (!client) return;

    const typeArray = Array.isArray(types) ? types : [types];
    typeArray.forEach((t) => client.subscriptions.add(t));
    console.log(`[Notification Service] ${socket.id} subscribed to: ${typeArray.join(', ')}`);
    socket.emit('subscribed', { types: Array.from(client.subscriptions) });
  });

  // Unsubscribe from notification types
  socket.on('unsubscribe', (types: NotificationType[] | NotificationType) => {
    const client = connectedClients.get(socket.id);
    if (!client) return;

    const typeArray = Array.isArray(types) ? types : [types];
    typeArray.forEach((t) => client.subscriptions.delete(t));
    console.log(`[Notification Service] ${socket.id} unsubscribed from: ${typeArray.join(', ')}`);
    socket.emit('subscribed', { types: Array.from(client.subscriptions) });
  });

  // Mark notification as read
  socket.on('mark_as_read', (notificationId: string) => {
    socket.emit('notification_read', { id: notificationId });
  });

  // Mark all notifications as read
  socket.on('mark_all_read', () => {
    socket.emit('all_read');
  });

  // Disconnect
  socket.on('disconnect', () => {
    connectedClients.delete(socket.id);
    console.log(`[Notification Service] Client disconnected: ${socket.id}`);
  });

  socket.on('error', (error) => {
    console.error(`[Notification Service] Socket error (${socket.id}):`, error);
  });
});

const PORT = 3010;
httpServer.listen(PORT, () => {
  console.log(`[Notification Service] WebSocket server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Notification Service] Shutting down...');
  httpServer.close(() => {
    console.log('[Notification Service] Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[Notification Service] Shutting down...');
  httpServer.close(() => {
    console.log('[Notification Service] Server closed');
    process.exit(0);
  });
});
