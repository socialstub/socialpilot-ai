import { create } from 'zustand';
import type { NavItem, PlatformKey, PostStatus } from '@/lib/constants';

// Types for our store
export interface SocialAccountData {
  id: string;
  platform: PlatformKey;
  username: string;
  displayName: string;
  avatar?: string;
  followersCount: number;
  followingCount: number;
  isActive: boolean;
  connectedAt: string;
}

export interface PostData {
  id: string;
  title?: string;
  content: string;
  platform: string;
  mediaUrls?: string[];
  hashtags?: string[];
  scheduledAt?: string;
  publishedAt?: string;
  status: PostStatus;
  aiGenerated: boolean;
  reach: number;
  engagement: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
}

export interface CommentData {
  id: string;
  platform: string;
  content: string;
  authorName: string;
  authorAvatar?: string;
  isReplied: boolean;
  aiReply?: string;
  createdAt: string;
}

export interface ActivityData {
  id: string;
  type: string;
  message: string;
  createdAt: string;
}

export interface TeamMemberData {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  joinedAt: string;
}

interface AppState {
  // Navigation
  activeView: NavItem;
  setActiveView: (view: NavItem) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;

  // Data
  accounts: SocialAccountData[];
  setAccounts: (accounts: SocialAccountData[]) => void;
  posts: PostData[];
  setPosts: (posts: PostData[]) => void;
  comments: CommentData[];
  setComments: (comments: CommentData[]) => void;
  activities: ActivityData[];
  setActivities: (activities: ActivityData[]) => void;
  teamMembers: TeamMemberData[];
  setTeamMembers: (members: TeamMemberData[]) => void;

  // Composer
  selectedPlatforms: PlatformKey[];
  setSelectedPlatforms: (platforms: PlatformKey[]) => void;
  composerContent: string;
  setComposerContent: (content: string) => void;

  // Loading states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Refresh data
  refreshData: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Navigation
  activeView: 'dashboard',
  setActiveView: (view) => set({ activeView: view }),
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // Data
  accounts: [],
  setAccounts: (accounts) => set({ accounts }),
  posts: [],
  setPosts: (posts) => set({ posts }),
  comments: [],
  setComments: (comments) => set({ comments }),
  activities: [],
  setActivities: (activities) => set({ activities }),
  teamMembers: [],
  setTeamMembers: (members) => set({ teamMembers: members }),

  // Composer
  selectedPlatforms: [],
  setSelectedPlatforms: (platforms) => set({ selectedPlatforms: platforms }),
  composerContent: '',
  setComposerContent: (content) => set({ composerContent: content }),

  // Loading
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),

  // Refresh
  refreshData: async () => {
    set({ isLoading: true });
    try {
      const [accountsRes, postsRes, activitiesRes, teamRes] = await Promise.all([
        fetch('/api/accounts'),
        fetch('/api/posts'),
        fetch('/api/activities'),
        fetch('/api/team'),
      ]);

      const [accounts, posts, activities, teamMembers] = await Promise.all([
        accountsRes.json(),
        postsRes.json(),
        activitiesRes.json(),
        teamRes.json(),
      ]);

      set({
        accounts: accounts.data || [],
        posts: posts.data || [],
        activities: activities.data || [],
        teamMembers: teamMembers.data || [],
      });
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      set({ isLoading: false });
    }
  },
}));
