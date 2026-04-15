// Social Media Platforms Configuration
export const PLATFORMS = {
  facebook: {
    name: 'Facebook',
    icon: 'Facebook',
    color: '#1877F2',
    bgColor: 'bg-blue-600',
    textColor: 'text-blue-600',
    maxChars: 63206,
    hashtagSupport: true,
    imageFormats: ['jpg', 'png', 'gif'],
    videoFormats: ['mp4', 'mov'],
  },
  instagram: {
    name: 'Instagram',
    icon: 'Instagram',
    color: '#E4405F',
    bgColor: 'bg-pink-600',
    textColor: 'text-pink-600',
    maxChars: 2200,
    hashtagSupport: true,
    imageFormats: ['jpg', 'png'],
    videoFormats: ['mp4'],
  },
  twitter: {
    name: 'X (Twitter)',
    icon: 'Twitter',
    color: '#000000',
    bgColor: 'bg-zinc-900',
    textColor: 'text-zinc-900',
    maxChars: 280,
    hashtagSupport: true,
    imageFormats: ['jpg', 'png', 'gif', 'webp'],
    videoFormats: ['mp4'],
  },
  linkedin: {
    name: 'LinkedIn',
    icon: 'Linkedin',
    color: '#0A66C2',
    bgColor: 'bg-blue-700',
    textColor: 'text-blue-700',
    maxChars: 3000,
    hashtagSupport: true,
    imageFormats: ['jpg', 'png'],
    videoFormats: ['mp4'],
  },
  tiktok: {
    name: 'TikTok',
    icon: 'Music',
    color: '#000000',
    bgColor: 'bg-zinc-900',
    textColor: 'text-zinc-900',
    maxChars: 2200,
    hashtagSupport: true,
    imageFormats: ['jpg', 'png', 'webp'],
    videoFormats: ['mp4'],
  },
  youtube: {
    name: 'YouTube',
    icon: 'Youtube',
    color: '#FF0000',
    bgColor: 'bg-red-600',
    textColor: 'text-red-600',
    maxChars: 5000,
    hashtagSupport: true,
    imageFormats: ['jpg', 'png', 'bmp'],
    videoFormats: ['mp4', 'mov', 'avi'],
  },
} as const;

export type PlatformKey = keyof typeof PLATFORMS;

export const POST_STATUSES = {
  draft: { label: 'Draft', color: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300' },
  pending_approval: { label: 'Pending Approval', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  scheduled: { label: 'Scheduled', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  published: { label: 'Published', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
} as const;

export type PostStatus = keyof typeof POST_STATUSES;

export const TEAM_ROLES = {
  admin: { label: 'Admin', description: 'Full access to all features', color: 'bg-purple-100 text-purple-700' },
  editor: { label: 'Editor', description: 'Create and edit posts', color: 'bg-blue-100 text-blue-700' },
  viewer: { label: 'Viewer', description: 'View-only access', color: 'bg-zinc-100 text-zinc-700' },
} as const;

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { id: 'compose', label: 'Compose', icon: 'PenSquare' },
  { id: 'scheduler', label: 'Scheduler', icon: 'CalendarDays' },
  { id: 'analytics', label: 'Analytics', icon: 'BarChart3' },
  { id: 'ai-tools', label: 'AI Tools', icon: 'Sparkles' },
  { id: 'accounts', label: 'Accounts', icon: 'Link2' },
  { id: 'team', label: 'Team', icon: 'Users' },
  { id: 'architecture', label: 'Architecture', icon: 'Blueprint' },
] as const;

export type NavItem = (typeof NAV_ITEMS)[number]['id'];

export const CONTENT_CATEGORIES = [
  { id: 'promotion', label: 'Promotion', icon: 'Megaphone' },
  { id: 'educational', label: 'Educational', icon: 'GraduationCap' },
  { id: 'engagement', label: 'Engagement', icon: 'MessageCircle' },
  { id: 'announcement', label: 'Announcement', icon: 'Bell' },
  { id: 'behind-scenes', label: 'Behind the Scenes', icon: 'Camera' },
  { id: 'user-generated', label: 'User Generated', icon: 'Users' },
  { id: 'testimonial', label: 'Testimonial', icon: 'Quote' },
  { id: 'how-to', label: 'How-To Guide', icon: 'BookOpen' },
] as const;

export const BEST_POSTING_TIMES = [
  { platform: 'Facebook', times: ['9:00 AM', '1:00 PM', '3:00 PM'], bestDay: 'Wednesday' },
  { platform: 'Instagram', times: ['11:00 AM', '1:00 PM', '7:00 PM'], bestDay: 'Tuesday' },
  { platform: 'X (Twitter)', times: ['8:00 AM', '12:00 PM', '5:00 PM'], bestDay: 'Thursday' },
  { platform: 'LinkedIn', times: ['7:00 AM', '12:00 PM', '5:00 PM'], bestDay: 'Tuesday' },
  { platform: 'TikTok', times: ['7:00 AM', '12:00 PM', '7:00 PM'], bestDay: 'Saturday' },
  { platform: 'YouTube', times: ['2:00 PM', '4:00 PM', '6:00 PM'], bestDay: 'Saturday' },
] as const;
