export type PlatformType = 
  | 'youtube' 
  | 'tiktok' 
  | 'instagram' 
  | 'twitter' 
  | 'facebook' 
  | 'vimeo' 
  | 'threads' 
  | 'dailymotion' 
  | 'generic';

export interface VideoQualityOption {
  id: string;
  label: string;
  resolution: string;
  fps: number;
  format: 'mp4' | 'mp3' | 'webm' | 'avi' | 'mov' | 'wav';
  sizeBytes: number;
  bitrate: string;
  type: 'video' | 'audio';
  isBest?: boolean;
}

export interface VideoMetadata {
  id: string;
  originalUrl: string;
  platform: PlatformType;
  title: string;
  author: string;
  authorAvatar?: string;
  durationSeconds: number;
  viewCount?: number;
  likesCount?: number;
  thumbnail: string;
  sampleVideoUrl?: string;
  qualities: VideoQualityOption[];
  createdAt: string;
  description?: string;
}

export interface DownloadTask {
  id: string;
  metadata: VideoMetadata;
  quality: VideoQualityOption;
  status: 'queued' | 'downloading' | 'completed' | 'failed' | 'paused';
  progress: number; // 0 - 100
  speedMbps: number;
  downloadedBytes: number;
  totalBytes: number;
  downloadUrl: string;
  fileName: string;
  timestamp: string;
  error?: string;
}

export type VideoToolType = 'trim' | 'crop' | 'compress' | 'convert' | 'extract_audio' | 'merge';

export interface TrimOptions {
  startTime: number;
  endTime: number;
}

export interface CropOptions {
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:3' | 'free';
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CompressOptions {
  qualityLevel: 'low' | 'medium' | 'high' | 'ultra';
  targetSizeBytes: number;
  presetBitrate: string;
}

export interface ConvertOptions {
  targetFormat: 'mp4' | 'webm' | 'avi' | 'mov' | 'gif' | 'mp3' | 'wav' | 'aac' | 'flac';
  audioBitrate?: string;
  videoCodec?: string;
}

export interface AudioExtractOptions {
  audioFormat: 'mp3' | 'wav' | 'aac' | 'flac';
  bitrate: '128k' | '192k' | '256k' | '320k';
  fadeInSeconds: number;
  fadeOutSeconds: number;
}

export interface MergeClip {
  id: string;
  title: string;
  url: string;
  durationSeconds: number;
  thumbnail: string;
}

export interface MergeOptions {
  clips: MergeClip[];
  transition: 'none' | 'fade' | 'dissolve' | 'wipe';
  outputResolution: string;
}

export interface AdminStats {
  totalDownloads: number;
  totalBandwidthBytes: number;
  activeUsers: number;
  averageSpeedMbps: number;
  platformBreakdown: Record<PlatformType, number>;
  recentErrors: Array<{
    id: string;
    time: string;
    url: string;
    error: string;
    ip: string;
  }>;
  serverHealth: {
    cpuUsagePct: number;
    memoryUsagePct: number;
    uptimeSeconds: number;
    apiLatencyMs: number;
    status: 'healthy' | 'degraded' | 'offline';
  };
}

export interface AppSettings {
  theme: 'dark' | 'light' | 'system';
  defaultQuality: '1080p' | '720p' | 'best' | 'mp3';
  defaultAudioFormat: 'mp3' | 'wav' | 'aac';
  downloadFolder: string;
  concurrentLimit: number;
  autoStartDownload: boolean;
  language: string;
  autoUpdate: boolean;
  enableNotifications: boolean;
}
