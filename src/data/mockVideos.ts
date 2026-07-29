import { VideoMetadata, PlatformType } from '../types';
import { detectPlatform } from '../utils/mediaUtils';

export const SAMPLE_VIDEOS_LIST: Array<{ label: string; url: string; platform: PlatformType; desc: string }> = [
  {
    label: '4K Nature Reel (YouTube 1080p/4K)',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    platform: 'youtube',
    desc: 'Cinematic 4K Wildlife & Nature Scenes in Costa Rica',
  },
  {
    label: 'Viral Travel Clip (TikTok)',
    url: 'https://www.tiktok.com/@nature_explorer/video/7239102839102',
    platform: 'tiktok',
    desc: 'Mindblowing Alps Mountain Sunset #travel #nature',
  },
  {
    label: 'Fitness Tutorial Reel (Instagram)',
    url: 'https://www.instagram.com/reel/C8x9Y12vK3L/',
    platform: 'instagram',
    desc: '10-Minute Daily Mobility & Posture Routine',
  },
  {
    label: 'Tech Event Announcement (Twitter/X)',
    url: 'https://x.com/tech_insider/status/1798239012839102',
    platform: 'twitter',
    desc: 'Next-Gen AI & Robotics Showcase Keynote Highlights',
  },
  {
    label: 'Ocean Drone Footage (Vimeo HD)',
    url: 'https://vimeo.com/769493012',
    platform: 'vimeo',
    desc: 'Deep Blue Coral Reefs & Marine Life Conservation',
  },
];

export function generateMetadataForUrl(url: string): VideoMetadata {
  const platform = detectPlatform(url);
  const cleanUrl = url.trim();
  const id = 'vid_' + Math.abs(hashCode(cleanUrl)).toString(36);

  // Customized title and authors based on platform and URL string hints
  let title = 'High Definition Video Clip';
  let author = 'Media Creator';
  let thumbnail = 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=800&q=80';
  let viewCount = 485200;
  let likesCount = 34200;
  let durationSeconds = 214;
  let sampleVideoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

  if (platform === 'youtube') {
    title = 'Ultra HD 4K Cinematic Nature & Wildlife Experience';
    author = '4K Earth Adventures';
    thumbnail = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80';
    durationSeconds = 645;
    viewCount = 1420900;
    likesCount = 98400;
    sampleVideoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
  } else if (platform === 'tiktok') {
    title = 'Mindblowing Sunset over Swiss Alps #TravelTok #Nature';
    author = '@alps_wanderlust';
    thumbnail = 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80';
    durationSeconds = 42;
    viewCount = 892000;
    likesCount = 145000;
    sampleVideoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
  } else if (platform === 'instagram') {
    title = '10 Min Daily Stretching & Posture Correction Reel';
    author = '@fit_life_daily';
    thumbnail = 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&q=80';
    durationSeconds = 58;
    viewCount = 312000;
    likesCount = 42300;
    sampleVideoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4';
  } else if (platform === 'twitter') {
    title = 'Breakthrough Tech Keynote: Autonomous Robotics & AI';
    author = '@TechPulseLive';
    thumbnail = 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&q=80';
    durationSeconds = 135;
    viewCount = 654000;
    likesCount = 52100;
    sampleVideoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4';
  } else if (platform === 'vimeo') {
    title = 'Deep Ocean Blue: Coral Reef Ecosystem Documentary';
    author = 'Oceanic Films Lab';
    thumbnail = 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80';
    durationSeconds = 840;
    viewCount = 192000;
    likesCount = 28900;
    sampleVideoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4';
  }

  // Calculate realistic file sizes based on duration
  const baseSizeMb = (durationSeconds / 60) * 18;

  return {
    id,
    originalUrl: cleanUrl,
    platform,
    title,
    author,
    authorAvatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${author}`,
    durationSeconds,
    viewCount,
    likesCount,
    thumbnail,
    sampleVideoUrl,
    createdAt: new Date().toISOString(),
    description: `Universal Media metadata extracted for ${platform.toUpperCase()} content. Download available in multiple high definition MP4 and MP3 audio formats.`,
    qualities: [
      {
        id: 'q_360',
        label: '360p Standard',
        resolution: '640x360',
        fps: 30,
        format: 'mp4',
        sizeBytes: Math.round(baseSizeMb * 0.25 * 1024 * 1024),
        bitrate: '800 kbps',
        type: 'video',
      },
      {
        id: 'q_480',
        label: '480p SD',
        resolution: '854x480',
        fps: 30,
        format: 'mp4',
        sizeBytes: Math.round(baseSizeMb * 0.45 * 1024 * 1024),
        bitrate: '1500 kbps',
        type: 'video',
      },
      {
        id: 'q_720',
        label: '720p HD',
        resolution: '1280x720',
        fps: 60,
        format: 'mp4',
        sizeBytes: Math.round(baseSizeMb * 0.85 * 1024 * 1024),
        bitrate: '3500 kbps',
        type: 'video',
      },
      {
        id: 'q_1080',
        label: '1080p Full HD',
        resolution: '1920x1080',
        fps: 60,
        format: 'mp4',
        sizeBytes: Math.round(baseSizeMb * 1.5 * 1024 * 1024),
        bitrate: '7500 kbps',
        type: 'video',
        isBest: true,
      },
      {
        id: 'q_mp3_high',
        label: 'Audio MP3 (320kbps High Quality)',
        resolution: 'Audio Only',
        fps: 0,
        format: 'mp3',
        sizeBytes: Math.round((durationSeconds / 60) * 2.4 * 1024 * 1024),
        bitrate: '320 kbps',
        type: 'audio',
      },
      {
        id: 'q_mp3_std',
        label: 'Audio MP3 (128kbps Standard)',
        resolution: 'Audio Only',
        fps: 0,
        format: 'mp3',
        sizeBytes: Math.round((durationSeconds / 60) * 1.0 * 1024 * 1024),
        bitrate: '128 kbps',
        type: 'audio',
      },
    ],
  };
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash;
}
