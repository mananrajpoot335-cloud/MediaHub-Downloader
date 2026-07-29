import fs from 'fs';
import path from 'path';

export interface LogEntry {
  id: string;
  time: string;
  category: 'validation' | 'metadata' | 'download_start' | 'progress' | 'completion' | 'failure' | 'ffmpeg' | 'yt_dlp' | 'network' | 'file_io';
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  url?: string;
  ip?: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private logFilePath: string;
  private maxLogs = 500;

  constructor() {
    const logDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logDir)) {
      try {
        fs.mkdirSync(logDir, { recursive: true });
      } catch (err) {
        // Fallback to memory only if directory cannot be created
      }
    }
    this.logFilePath = path.join(logDir, 'mediahub.log');
  }

  public log(category: LogEntry['category'], level: LogEntry['level'], message: string, url?: string, ip?: string) {
    const entry: LogEntry = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      time: new Date().toISOString(),
      category,
      level,
      message,
      url,
      ip,
    };

    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    const fileLine = `[${entry.time}] [${level.toUpperCase()}] [${category}] ${message} ${url ? `(URL: ${url})` : ''}\n`;
    try {
      fs.appendFileSync(this.logFilePath, fileLine);
    } catch {
      // Ignore file append errors
    }

    console.log(`[${level.toUpperCase()}] [${category}] ${message}`);
  }

  public info(category: LogEntry['category'], message: string, url?: string, ip?: string) {
    this.log(category, 'info', message, url, ip);
  }

  public warn(category: LogEntry['category'], message: string, url?: string, ip?: string) {
    this.log(category, 'warn', message, url, ip);
  }

  public error(category: LogEntry['category'], message: string, url?: string, ip?: string) {
    this.log(category, 'error', message, url, ip);
  }

  public getLogs(): LogEntry[] {
    return this.logs;
  }

  public getErrorsOnly() {
    return this.logs
      .filter((l) => l.level === 'error')
      .map((l) => ({
        id: l.id,
        time: l.time,
        url: l.url || 'N/A',
        error: l.message,
        ip: l.ip || '127.0.0.1',
      }));
  }

  public clearLogs() {
    this.logs = [];
    try {
      if (fs.existsSync(this.logFilePath)) {
        fs.writeFileSync(this.logFilePath, '');
      }
    } catch {
      // Ignore
    }
  }
}

export const logger = new Logger();
