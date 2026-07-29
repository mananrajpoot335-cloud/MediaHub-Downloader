import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { generateMetadataForUrl } from './src/data/mockVideos';
import { isValidVideoUrl, detectPlatform } from './src/utils/mediaUtils';
import { PlatformType } from './src/types';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Simple in-memory rate limiting store & admin statistics state
interface RateLimitRecord {
  count: number;
  resetTime: number;
}
const ipRateLimits = new Map<string, RateLimitRecord>();
const RATE_LIMIT_MAX = 100; // max 100 requests per 15 min window
const WINDOW_MS = 15 * 60 * 1000;

// Admin Stats State
let totalDownloadsCount = 1428;
let totalBandwidthServedBytes = 8920400500; // ~8.9 GB
let activeUsersCount = 24;
const platformStatsCounter: Record<PlatformType, number> = {
  youtube: 642,
  tiktok: 310,
  instagram: 215,
  twitter: 130,
  facebook: 65,
  vimeo: 34,
  threads: 20,
  dailymotion: 12,
  generic: 0,
};

const recentErrorsList: Array<{
  id: string;
  time: string;
  url: string;
  error: string;
  ip: string;
}> = [
  {
    id: 'err_1',
    time: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    url: 'https://youtube.com/watch?v=private_video_001',
    error: 'Video is marked private or restricted by creator.',
    ip: '192.168.1.45',
  },
  {
    id: 'err_2',
    time: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    url: 'https://tiktok.com/@user/invalid_id',
    error: '404 Not Found: Could not resolve video ID on TikTok servers.',
    ip: '10.0.0.12',
  },
];

// Rate limiting middleware
function rateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  const now = Date.now();
  const record = ipRateLimits.get(ip);

  if (!record || now > record.resetTime) {
    ipRateLimits.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    res.setHeader('X-RateLimit-Limit', RATE_LIMIT_MAX);
    res.setHeader('X-RateLimit-Remaining', RATE_LIMIT_MAX - 1);
    return next();
  }

  if (record.count >= RATE_LIMIT_MAX) {
    res.setHeader('X-RateLimit-Limit', RATE_LIMIT_MAX);
    res.setHeader('X-RateLimit-Remaining', 0);
    res.setHeader('Retry-After', Math.ceil((record.resetTime - now) / 1000));
    return res.status(429).json({
      error: 'Too many requests. Please slow down and try again shortly.',
      retryAfterSeconds: Math.ceil((record.resetTime - now) / 1000),
    });
  }

  record.count += 1;
  res.setHeader('X-RateLimit-Limit', RATE_LIMIT_MAX);
  res.setHeader('X-RateLimit-Remaining', RATE_LIMIT_MAX - record.count);
  next();
}

app.use('/api', rateLimiter);

// --- API ENDPOINTS ---

// 1. Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'online',
    system: 'MediaHub Downloader Server',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// 2. Extract Metadata API
app.post('/api/extract-metadata', (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid "url" parameter.' });
    }

    const trimmedUrl = url.trim();
    if (!isValidVideoUrl(trimmedUrl)) {
      return res.status(400).json({
        error: 'Invalid URL format. Please paste a full http:// or https:// video URL.',
      });
    }

    // Simulate private / restricted url error for explicit mock testing
    if (trimmedUrl.includes('private') || trimmedUrl.includes('restricted')) {
      const errObj = {
        id: 'err_' + Date.now(),
        time: new Date().toISOString(),
        url: trimmedUrl,
        error: 'Target video is set to private or requires account login.',
        ip: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
      };
      recentErrorsList.unshift(errObj);
      return res.status(403).json({ error: errObj.error });
    }

    const metadata = generateMetadataForUrl(trimmedUrl);
    
    // Increment platform analytics counter
    if (metadata.platform in platformStatsCounter) {
      platformStatsCounter[metadata.platform] += 1;
    }

    res.json({ success: true, metadata });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to extract video metadata.' });
  }
});

// 3. Initiate / Track Download API
app.post('/api/download/record', (req: Request, res: Response) => {
  try {
    const { platform, sizeBytes } = req.body;
    totalDownloadsCount += 1;
    if (typeof sizeBytes === 'number' && sizeBytes > 0) {
      totalBandwidthServedBytes += sizeBytes;
    }
    const plat = (platform as PlatformType) || 'generic';
    if (plat in platformStatsCounter) {
      platformStatsCounter[plat] += 1;
    }
    res.json({
      success: true,
      totalDownloads: totalDownloadsCount,
      totalBandwidthBytes: totalBandwidthServedBytes,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to record download metrics.' });
  }
});

// 4. Video Tools Processing Engine API
app.post('/api/tools/process', (req: Request, res: Response) => {
  try {
    const { toolType, options, videoUrl } = req.body;

    if (!toolType) {
      return res.status(400).json({ error: 'Missing toolType parameter.' });
    }

    // Simulate server side processing and return output metadata / sample processed link
    const outputId = 'proc_' + Math.random().toString(36).substring(2, 9);
    let outputTitle = 'Processed_Media.mp4';
    let outputFormat = 'mp4';

    switch (toolType) {
      case 'trim':
        outputTitle = `Trimmed_Clip_${options?.startTime || 0}s_to_${options?.endTime || 10}s.mp4`;
        break;
      case 'crop':
        outputTitle = `Cropped_${options?.aspectRatio || '16x9'}_Media.mp4`;
        break;
      case 'compress':
        outputTitle = `Compressed_${options?.qualityLevel || 'high'}_Media.mp4`;
        break;
      case 'convert':
        outputFormat = options?.targetFormat || 'mp4';
        outputTitle = `Converted_Media.${outputFormat}`;
        break;
      case 'extract_audio':
        outputFormat = options?.audioFormat || 'mp3';
        outputTitle = `Extracted_Audio_${options?.bitrate || '320k'}.${outputFormat}`;
        break;
      case 'merge':
        outputTitle = `Merged_${options?.clips?.length || 2}_Clips_Sequence.mp4`;
        break;
    }

    // Return process result
    res.json({
      success: true,
      jobId: outputId,
      outputTitle,
      outputFormat,
      downloadUrl: videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      message: `Successfully processed ${toolType} task on server media engine.`,
      processedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error processing media file.' });
  }
});

// 5. Admin Statistics Endpoint
app.get('/api/admin/stats', (req: Request, res: Response) => {
  const stats = {
    totalDownloads: totalDownloadsCount,
    totalBandwidthBytes: totalBandwidthServedBytes,
    activeUsers: activeUsersCount + Math.floor(Math.random() * 5) - 2,
    averageSpeedMbps: 45.8 + parseFloat((Math.random() * 4 - 2).toFixed(1)),
    platformBreakdown: platformStatsCounter,
    recentErrors: recentErrorsList,
    serverHealth: {
      cpuUsagePct: Math.floor(18 + Math.random() * 12),
      memoryUsagePct: Math.floor(42 + Math.random() * 8),
      uptimeSeconds: Math.floor(process.uptime()),
      apiLatencyMs: Math.floor(15 + Math.random() * 10),
      status: 'healthy' as const,
    },
  };
  res.json(stats);
});

// 6. Admin Clear Errors API
app.delete('/api/admin/logs', (req: Request, res: Response) => {
  recentErrorsList.length = 0;
  res.json({ success: true, message: 'All error logs cleared.' });
});

// --- VITE MIDDLEWARE SETUP ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MediaHub Downloader Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
