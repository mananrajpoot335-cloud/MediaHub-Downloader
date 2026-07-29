import { PlatformType } from '../types';

export function detectPlatform(url: string): PlatformType {
  const lowerUrl = url.toLowerCase().trim();
  if (!lowerUrl) return 'generic';

  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) return 'youtube';
  if (lowerUrl.includes('tiktok.com')) return 'tiktok';
  if (lowerUrl.includes('instagram.com') || lowerUrl.includes('instagr.am')) return 'instagram';
  if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) return 'twitter';
  if (lowerUrl.includes('facebook.com') || lowerUrl.includes('fb.watch')) return 'facebook';
  if (lowerUrl.includes('vimeo.com')) return 'vimeo';
  if (lowerUrl.includes('threads.net')) return 'threads';
  if (lowerUrl.includes('dailymotion.com') || lowerUrl.includes('dai.ly')) return 'dailymotion';

  return 'generic';
}

export function isValidVideoUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const formattedMins = mins.toString().padStart(2, '0');
  const formattedSecs = secs.toString().padStart(2, '0');

  if (hrs > 0) {
    const formattedHrs = hrs.toString().padStart(2, '0');
    return `${formattedHrs}:${formattedMins}:${formattedSecs}`;
  }
  return `${formattedMins}:${formattedSecs}`;
}

export function formatNumber(num?: number): string {
  if (!num && num !== 0) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toLocaleString();
}

export function getPlatformBadgeDetails(platform: PlatformType): {
  name: string;
  color: string;
  bgColor: string;
  borderColor: string;
  iconName: string;
} {
  switch (platform) {
    case 'youtube':
      return {
        name: 'YouTube',
        color: 'text-red-500 dark:text-red-400',
        bgColor: 'bg-red-500/10 dark:bg-red-500/20',
        borderColor: 'border-red-500/30',
        iconName: 'Youtube',
      };
    case 'tiktok':
      return {
        name: 'TikTok',
        color: 'text-cyan-500 dark:text-cyan-400',
        bgColor: 'bg-cyan-500/10 dark:bg-cyan-500/20',
        borderColor: 'border-cyan-500/30',
        iconName: 'Video',
      };
    case 'instagram':
      return {
        name: 'Instagram',
        color: 'text-pink-500 dark:text-pink-400',
        bgColor: 'bg-pink-500/10 dark:bg-pink-500/20',
        borderColor: 'border-pink-500/30',
        iconName: 'Instagram',
      };
    case 'twitter':
      return {
        name: 'Twitter / X',
        color: 'text-sky-500 dark:text-sky-400',
        bgColor: 'bg-sky-500/10 dark:bg-sky-500/20',
        borderColor: 'border-sky-500/30',
        iconName: 'Twitter',
      };
    case 'facebook':
      return {
        name: 'Facebook',
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-600/10 dark:bg-blue-600/20',
        borderColor: 'border-blue-600/30',
        iconName: 'Facebook',
      };
    case 'vimeo':
      return {
        name: 'Vimeo',
        color: 'text-teal-500 dark:text-teal-400',
        bgColor: 'bg-teal-500/10 dark:bg-teal-500/20',
        borderColor: 'border-teal-500/30',
        iconName: 'Tv',
      };
    case 'threads':
      return {
        name: 'Threads',
        color: 'text-emerald-500 dark:text-emerald-400',
        bgColor: 'bg-emerald-500/10 dark:bg-emerald-500/20',
        borderColor: 'border-emerald-500/30',
        iconName: 'AtSign',
      };
    case 'dailymotion':
      return {
        name: 'Dailymotion',
        color: 'text-amber-500 dark:text-amber-400',
        bgColor: 'bg-amber-500/10 dark:bg-amber-500/20',
        borderColor: 'border-amber-500/30',
        iconName: 'PlaySquare',
      };
    default:
      return {
        name: 'Universal Media',
        color: 'text-indigo-500 dark:text-indigo-400',
        bgColor: 'bg-indigo-500/10 dark:bg-indigo-500/20',
        borderColor: 'border-indigo-500/30',
        iconName: 'Globe',
      };
  }
}

// Sample fallback videos with actual playable Big Buck Bunny / HTML5 sample videos
export const SAMPLE_PLAYABLE_VIDEOS = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
];
