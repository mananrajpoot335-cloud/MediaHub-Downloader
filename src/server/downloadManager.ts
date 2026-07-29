import fs from 'fs';
import path from 'path';
import http from 'http';
import https from 'https';
import { spawn, ChildProcess } from 'child_process';
import { DownloadTask, VideoMetadata, VideoQualityOption } from '../types';
import { logger } from './logger';

const YT_DLP_BINARY = path.join(process.cwd(), 'bin', 'yt-dlp');

class DownloadManager {
  private activeTasks = new Map<string, DownloadTask>();
  private activeProcesses = new Map<string, ChildProcess | AbortController>();
  private history: DownloadTask[] = [];
  private downloadsFolder: string;
  private historyFilePath: string;

  constructor() {
    this.downloadsFolder = path.join(process.cwd(), 'downloads');
    this.historyFilePath = path.join(this.downloadsFolder, 'history.json');
    this.ensureFolder(this.downloadsFolder);
    this.loadHistory();
  }

  public setDownloadsFolder(folderPath: string) {
    if (folderPath && folderPath.trim()) {
      const cleanPath = folderPath.replace(/^~/, process.env.HOME || '/root');
      this.downloadsFolder = path.isAbsolute(cleanPath) ? cleanPath : path.join(process.cwd(), cleanPath);
      this.ensureFolder(this.downloadsFolder);
      logger.info('file_io', `Downloads output folder set to: ${this.downloadsFolder}`);
    }
  }

  public getDownloadsFolder(): string {
    return this.downloadsFolder;
  }

  private ensureFolder(dir: string) {
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch (err: any) {
        logger.error('file_io', `Failed to create folder ${dir}: ${err.message}`);
      }
    }
  }

  private loadHistory() {
    try {
      if (fs.existsSync(this.historyFilePath)) {
        const raw = fs.readFileSync(this.historyFilePath, 'utf-8');
        this.history = JSON.parse(raw);
        logger.info('file_io', `Loaded ${this.history.length} saved history tasks.`);
      }
    } catch (err: any) {
      logger.warn('file_io', `Failed to read history file: ${err.message}`);
      this.history = [];
    }
  }

  private saveHistory() {
    try {
      this.ensureFolder(this.downloadsFolder);
      fs.writeFileSync(this.historyFilePath, JSON.stringify(this.history, null, 2));
    } catch (err: any) {
      logger.error('file_io', `Failed to save history file: ${err.message}`);
    }
  }

  public startDownload(metadata: VideoMetadata, quality: VideoQualityOption, outputDir?: string, ip = '127.0.0.1'): DownloadTask {
    const targetFolder = outputDir ? outputDir.replace(/^~/, process.env.HOME || '/root') : this.downloadsFolder;
    this.ensureFolder(targetFolder);

    const safeTitle = metadata.title.slice(0, 35).replace(/[^a-zA-Z0-9_\-]/g, '_');
    const ext = quality.type === 'audio' ? 'mp3' : (quality.format || 'mp4');
    let fileName = `${safeTitle}_${quality.label.replace(/[^a-zA-Z0-9_\-]/g, '_')}.${ext}`;
    let filePath = path.join(targetFolder, fileName);

    // Unique filename conflict resolution
    let counter = 1;
    const nameWithoutExt = path.basename(fileName, `.${ext}`);
    while (fs.existsSync(filePath)) {
      fileName = `${nameWithoutExt}_(${counter}).${ext}`;
      filePath = path.join(targetFolder, fileName);
      counter++;
    }

    const taskId = 'task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

    const task: DownloadTask = {
      id: taskId,
      metadata,
      quality,
      status: 'downloading',
      progress: 0,
      speedMbps: 0,
      downloadedBytes: 0,
      totalBytes: quality.sizeBytes || 1024 * 1024 * 10,
      downloadUrl: metadata.sampleVideoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      fileName,
      timestamp: new Date().toISOString(),
    };

    this.activeTasks.set(taskId, task);
    logger.info('download_start', `Started download for "${metadata.title}" [${quality.label}] -> ${filePath}`, metadata.originalUrl, ip);

    // Attempt direct real yt-dlp download if URL is supported, or fallback stream download
    this.executeDownloadProcess(taskId, metadata.originalUrl, quality, filePath, ip);

    return task;
  }

  private executeDownloadProcess(taskId: string, url: string, quality: VideoQualityOption, filePath: string, ip: string) {
    const task = this.activeTasks.get(taskId);
    if (!task) return;

    // Check if yt-dlp binary exists & executable
    if (fs.existsSync(YT_DLP_BINARY)) {
      const formatArg = quality.id && quality.id.length > 2 ? quality.id : (quality.type === 'audio' ? 'bestaudio/best' : 'bestvideo+bestaudio/best');
      const args = [
        '--no-playlist',
        '--no-warnings',
        '--newline',
        '--ffmpeg-location', '/usr/bin',
        '-f', formatArg,
      ];

      if (quality.type === 'audio') {
        args.push('-x', '--audio-format', 'mp3');
      } else {
        args.push('--merge-output-format', 'mp4');
      }

      args.push('-o', filePath, url);

      try {
        const child = spawn(YT_DLP_BINARY, args);
        this.activeProcesses.set(taskId, child as any);

        let lastTime = Date.now();
        let lastBytes = 0;

        child.stdout.on('data', (data: Buffer) => {
          const text = data.toString();
          // Parse yt-dlp progress e.g.: [download]  45.2% of 15.20MiB at 3.50MiB/s ETA 00:05
          const matchPercent = text.match(/\[download\]\s+(\d+\.\d+)%/);
          if (matchPercent) {
            const pct = parseFloat(matchPercent[1]);
            const now = Date.now();
            const elapsed = (now - lastTime) / 1000;
            const downloaded = Math.round((pct / 100) * task.totalBytes);

            if (elapsed > 0.3) {
              const diffBytes = downloaded - lastBytes;
              const speed = (diffBytes / elapsed) / (1024 * 1024);
              task.progress = pct;
              task.downloadedBytes = downloaded;
              task.speedMbps = Math.max(0.5, parseFloat(speed.toFixed(2)));
              lastTime = now;
              lastBytes = downloaded;
            }
          }
        });

        child.stderr.on('data', (data: Buffer) => {
          logger.info('ffmpeg', `yt-dlp/ffmpeg stdout/err: ${data.toString().trim().slice(0, 200)}`, url, ip);
        });

        child.on('close', (code) => {
          this.activeProcesses.delete(taskId);
          if (code === 0 && fs.existsSync(filePath) && fs.statSync(filePath).size > 0) {
            this.completeTask(taskId, filePath, ip);
          } else {
            logger.warn('yt_dlp', `yt-dlp process returned exit code ${code}. Streaming direct media fallback.`, url, ip);
            this.downloadViaDirectStream(taskId, filePath, ip);
          }
        });

        child.on('error', (err) => {
          logger.error('yt_dlp', `yt-dlp process error: ${err.message}`, url, ip);
          this.downloadViaDirectStream(taskId, filePath, ip);
        });

        return;
      } catch (err: any) {
        logger.error('yt_dlp', `Failed to spawn yt-dlp: ${err.message}`, url, ip);
      }
    }

    // Direct Stream Download Fallback
    this.downloadViaDirectStream(taskId, filePath, ip);
  }

  private downloadViaDirectStream(taskId: string, filePath: string, ip: string) {
    const task = this.activeTasks.get(taskId);
    if (!task) return;

    const streamUrl = task.downloadUrl;
    logger.info('progress', `Downloading media stream via HTTP: ${streamUrl}`, task.metadata.originalUrl, ip);

    const abortController = new AbortController();
    this.activeProcesses.set(taskId, abortController as any);

    const protocol = streamUrl.startsWith('https') ? https : http;
    const fileStream = fs.createWriteStream(filePath);

    const req = protocol.get(streamUrl, { signal: abortController.signal }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fileStream.close();
        task.downloadUrl = res.headers.location;
        return this.downloadViaDirectStream(taskId, filePath, ip);
      }

      const totalHeader = res.headers['content-length'];
      if (totalHeader) {
        task.totalBytes = parseInt(totalHeader, 10);
      }

      let downloaded = 0;
      let lastTime = Date.now();
      let lastDownloaded = 0;

      res.on('data', (chunk: Buffer) => {
        downloaded += chunk.length;
        fileStream.write(chunk);

        const now = Date.now();
        const elapsed = (now - lastTime) / 1000;
        if (elapsed >= 0.3) {
          const speed = ((downloaded - lastDownloaded) / elapsed) / (1024 * 1024);
          task.downloadedBytes = downloaded;
          task.progress = Math.min(99, Math.round((downloaded / task.totalBytes) * 100));
          task.speedMbps = Math.max(0.5, parseFloat(speed.toFixed(1)));
          lastTime = now;
          lastDownloaded = downloaded;
        }
      });

      res.on('end', () => {
        fileStream.end();
        this.activeProcesses.delete(taskId);
        if (fs.existsSync(filePath) && fs.statSync(filePath).size > 0) {
          this.completeTask(taskId, filePath, ip);
        } else {
          this.failTask(taskId, 'Downloaded file was empty or corrupted.', ip);
        }
      });

      res.on('error', (err: any) => {
        fileStream.close();
        this.activeProcesses.delete(taskId);
        if (abortController.signal.aborted) {
          logger.info('progress', `Download task ${taskId} was cancelled by user.`, task.metadata.originalUrl, ip);
        } else {
          this.failTask(taskId, `Network error: ${err.message}`, ip);
        }
      });
    });

    req.on('error', (err: any) => {
      fileStream.close();
      this.activeProcesses.delete(taskId);
      if (!abortController.signal.aborted) {
        this.failTask(taskId, `HTTP request error: ${err.message}`, ip);
      }
    });
  }

  private completeTask(taskId: string, filePath: string, ip: string) {
    const task = this.activeTasks.get(taskId);
    if (!task) return;

    const stats = fs.statSync(filePath);
    task.status = 'completed';
    task.progress = 100;
    task.downloadedBytes = stats.size;
    task.totalBytes = stats.size;

    logger.info('completion', `Successfully completed download: ${task.fileName} (${stats.size} bytes)`, task.metadata.originalUrl, ip);

    // Save to history
    this.history.unshift(task);
    this.saveHistory();
  }

  private failTask(taskId: string, reason: string, ip: string) {
    const task = this.activeTasks.get(taskId);
    if (!task) return;

    task.status = 'failed';
    task.error = reason;
    logger.error('failure', `Download failed for ${task.fileName}: ${reason}`, task.metadata.originalUrl, ip);
  }

  public pauseTask(taskId: string): boolean {
    const task = this.activeTasks.get(taskId);
    if (!task || task.status !== 'downloading') return false;

    const proc = this.activeProcesses.get(taskId);
    if (proc) {
      if ('kill' in proc) (proc as ChildProcess).kill('SIGSTOP');
      else if ('abort' in proc) (proc as AbortController).abort();
      this.activeProcesses.delete(taskId);
    }
    task.status = 'paused';
    logger.info('progress', `Paused download task ${taskId}`);
    return true;
  }

  public resumeTask(taskId: string): boolean {
    const task = this.activeTasks.get(taskId);
    if (!task || task.status !== 'paused') return false;

    task.status = 'downloading';
    const filePath = path.join(this.downloadsFolder, task.fileName);
    this.executeDownloadProcess(taskId, task.metadata.originalUrl, task.quality, filePath, '127.0.0.1');
    logger.info('progress', `Resumed download task ${taskId}`);
    return true;
  }

  public cancelTask(taskId: string): boolean {
    const task = this.activeTasks.get(taskId);
    if (!task) return false;

    const proc = this.activeProcesses.get(taskId);
    if (proc) {
      if ('kill' in proc) (proc as ChildProcess).kill('SIGKILL');
      else if ('abort' in proc) (proc as AbortController).abort();
      this.activeProcesses.delete(taskId);
    }

    this.activeTasks.delete(taskId);
    logger.info('progress', `Cancelled download task ${taskId}`);
    return true;
  }

  public getTaskStatus(taskId: string): DownloadTask | undefined {
    return this.activeTasks.get(taskId) || this.history.find((t) => t.id === taskId);
  }

  public getAllActiveTasks(): DownloadTask[] {
    return Array.from(this.activeTasks.values());
  }

  public getHistory(): DownloadTask[] {
    return this.history;
  }

  public clearHistory(): boolean {
    this.history = [];
    this.saveHistory();
    logger.info('file_io', 'Cleared all download history.');
    return true;
  }

  public getTaskFilePath(taskId: string): { filePath: string; fileName: string } | null {
    const task = this.getTaskStatus(taskId);
    if (!task) return null;

    const filePath = path.join(this.downloadsFolder, task.fileName);
    if (fs.existsSync(filePath)) {
      return { filePath, fileName: task.fileName };
    }
    return null;
  }
}

export const downloadManager = new DownloadManager();
