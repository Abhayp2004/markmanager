export type Platform = 'twitter' | 'youtube' | 'linkedin';

export type Priority = 'normal' | 'important' | 'pinned' | 'reference';

export interface Highlight {
  timestamp: string;
  title: string;
  summary: string;
}

export interface Bookmark {
  id: string;
  tweet_url: string;
  embed_html: string | null;
  author_name: string | null;
  folder_id: string | null;
  created_at: string;
  tags?: string[];
  content?: string | null;
  notes?: string | null;
  priority?: Priority;
  platform: Platform;
  // Multi-modal archiving fields
  thumbnail_url?: string | null;
  duration?: string | null;
  highlights?: Highlight[] | null;
  transcript?: string | null;
  archived_at?: string | null;
}

export interface Folder {
  id: string;
  name: string;
}

export const PLATFORM_CONFIG: Record<Platform, {
  label: string;
  icon: string;
  urlPatterns: RegExp[];
  placeholder: string;
}> = {
  twitter: {
    label: 'Twitter / X',
    icon: '𝕏',
    urlPatterns: [
      /(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/,
      /(?:twitter\.com|x\.com)\/\w+\/statuses\/(\d+)/,
    ],
    placeholder: 'https://x.com/user/status/123...',
  },
  youtube: {
    label: 'YouTube',
    icon: '▶️',
    urlPatterns: [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]+)/,
    ],
    placeholder: 'https://youtube.com/watch?v=...',
  },
  linkedin: {
    label: 'LinkedIn',
    icon: '💼',
    urlPatterns: [
      /linkedin\.com\/(?:posts|pulse|feed\/update)/,
    ],
    placeholder: 'https://linkedin.com/posts/...',
  },
};

export function detectPlatform(url: string): Platform | null {
  for (const [platform, config] of Object.entries(PLATFORM_CONFIG)) {
    for (const pattern of config.urlPatterns) {
      if (pattern.test(url)) {
        return platform as Platform;
      }
    }
  }
  return null;
}

export function extractVideoId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}
