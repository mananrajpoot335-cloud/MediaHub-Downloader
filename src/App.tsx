import React, { useState, useEffect } from 'react';
import { Navbar, NavTab } from './components/Navbar';
import { UrlInputSection } from './components/UrlInputSection';
import { VideoPreviewCard } from './components/VideoPreviewCard';
import { ActiveDownloadsManager } from './components/ActiveDownloadsManager';
import { VideoToolsSuite } from './components/VideoToolsSuite';
import { DownloadHistory } from './components/DownloadHistory';
import { AdminPanel } from './components/AdminPanel';
import { SettingsSection } from './components/SettingsSection';
import { ToastNotification, ToastMessage } from './components/ToastNotification';
import { 
  VideoMetadata, 
  VideoQualityOption, 
  DownloadTask, 
  VideoToolType, 
  AppSettings 
} from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('downloader');
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentMetadata, setCurrentMetadata] = useState<VideoMetadata | null>(null);
  const [activeTasks, setActiveTasks] = useState<DownloadTask[]>([]);
  const [historyTasks, setHistoryTasks] = useState<DownloadTask[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [rateLimitRemaining, setRateLimitRemaining] = useState<number>(98);

  const [settings, setSettings] = useState<AppSettings>({
    theme: 'dark',
    defaultQuality: '1080p',
    defaultAudioFormat: 'mp3',
    downloadFolder: '~/Downloads/MediaHub',
    concurrentLimit: 3,
    autoStartDownload: true,
    language: 'English',
    autoUpdate: true,
    enableNotifications: true,
  });

  // Dark Mode side effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Toast Helper
  const addToast = (type: 'success' | 'error' | 'info', title: string, message?: string) => {
    const newToast: ToastMessage = {
      id: 'toast_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
      type,
      title,
      message,
    };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Analyze URL via Server `/api/extract-metadata`
  const handleAnalyzeUrl = async (url: string) => {
    setIsLoadingUrl(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/extract-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const remainingHeader = res.headers.get('X-RateLimit-Remaining');
      if (remainingHeader) {
        setRateLimitRemaining(parseInt(remainingHeader, 10));
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to analyze URL.');
      }

      setCurrentMetadata(data.metadata);
      addToast('success', 'Video Detected!', `${data.metadata.title} metadata fetched.`);
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while parsing the URL.');
      addToast('error', 'Metadata Error', err.message);
    } finally {
      setIsLoadingUrl(false);
    }
  };

  // Start Download Simulation & Progress Engine
  const handleStartDownload = (quality: VideoQualityOption) => {
    if (!currentMetadata) return;

    const taskId = 'task_' + Date.now();
    const newTask: DownloadTask = {
      id: taskId,
      metadata: currentMetadata,
      quality,
      status: 'downloading',
      progress: 0,
      speedMbps: 25.4 + Math.random() * 15,
      downloadedBytes: 0,
      totalBytes: quality.sizeBytes,
      downloadUrl: currentMetadata.sampleVideoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      fileName: `${currentMetadata.title.slice(0, 25).replace(/[^a-zA-Z0-9]/g, '_')}_${quality.label.replace(/\s+/g, '_')}.${quality.format}`,
      timestamp: new Date().toISOString(),
    };

    setActiveTasks((prev) => [newTask, ...prev]);
    addToast('info', 'Download Started', `Downloading ${quality.label} (${newTask.fileName})`);

    // Record server-side download metrics
    fetch('/api/download/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform: currentMetadata.platform,
        sizeBytes: quality.sizeBytes,
      }),
    }).catch(() => {});

    // Stream / Progress Timer Simulation
    const interval = setInterval(() => {
      setActiveTasks((prevTasks) => {
        return prevTasks.map((t) => {
          if (t.id !== taskId || t.status !== 'downloading') return t;

          const newProgress = Math.min(100, t.progress + (15 + Math.random() * 20));
          const newDownloaded = Math.round((newProgress / 100) * t.totalBytes);

          if (newProgress >= 100) {
            clearInterval(interval);
            const finishedTask: DownloadTask = {
              ...t,
              progress: 100,
              status: 'completed',
              downloadedBytes: t.totalBytes,
            };

            // Add to history
            setHistoryTasks((hist) => [finishedTask, ...hist]);
            addToast('success', 'Download Complete!', finishedTask.fileName);

            return finishedTask;
          }

          return {
            ...t,
            progress: newProgress,
            downloadedBytes: newDownloaded,
            speedMbps: 20 + Math.random() * 25,
          };
        });
      });
    }, 400);
  };

  // Task Control Handlers
  const handlePauseTask = (id: string) => {
    setActiveTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'paused' } : t))
    );
  };

  const handleResumeTask = (id: string) => {
    setActiveTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'downloading' } : t))
    );
  };

  const handleCancelTask = (id: string) => {
    setActiveTasks((prev) => prev.filter((t) => t.id !== id));
    addToast('info', 'Download Cancelled');
  };

  const handleClearCompleted = () => {
    setActiveTasks((prev) => prev.filter((t) => t.status !== 'completed'));
  };

  const handleOpenInTools = (item: VideoMetadata | DownloadTask, toolType: VideoToolType) => {
    const meta = 'metadata' in item ? item.metadata : item;
    setCurrentMetadata(meta);
    setActiveTab('tools');
    addToast('info', 'Opened in Video Tools', `Switched studio to ${toolType.toUpperCase()} mode.`);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200 selection:bg-indigo-500 selection:text-white">
      
      {/* Toast Notifications */}
      <ToastNotification toasts={toasts} onDismiss={removeToast} />

      {/* Main Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        activeDownloadsCount={activeTasks.filter((t) => t.status === 'downloading').length}
        rateLimitRemaining={rateLimitRemaining}
      />

      {/* Primary Page Content Router */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        
        {/* TAB 1: DOWNLOADER */}
        {activeTab === 'downloader' && (
          <div className="space-y-10">
            <UrlInputSection
              onAnalyzeUrl={handleAnalyzeUrl}
              isLoading={isLoadingUrl}
              errorMessage={errorMessage}
              onClearError={() => setErrorMessage(null)}
            />

            {/* Analyzed Metadata Preview */}
            {currentMetadata && (
              <VideoPreviewCard
                metadata={currentMetadata}
                onStartDownload={handleStartDownload}
                onSendToTools={(meta, tool) => handleOpenInTools(meta, tool)}
              />
            )}

            {/* Active Downloads List */}
            <ActiveDownloadsManager
              tasks={activeTasks}
              onPauseTask={handlePauseTask}
              onResumeTask={handleResumeTask}
              onCancelTask={handleCancelTask}
              onClearCompleted={handleClearCompleted}
              onOpenInTools={(task, tool) => handleOpenInTools(task, tool)}
            />
          </div>
        )}

        {/* TAB 2: VIDEO TOOLS SUITE */}
        {activeTab === 'tools' && (
          <VideoToolsSuite
            initialMetadata={currentMetadata}
            onToast={addToast}
          />
        )}

        {/* TAB 3: HISTORY */}
        {activeTab === 'history' && (
          <DownloadHistory
            history={historyTasks}
            onClearHistory={() => setHistoryTasks([])}
            onRedownload={(task) => {
              setActiveTab('downloader');
              setCurrentMetadata(task.metadata);
              handleStartDownload(task.quality);
            }}
            onToast={addToast}
          />
        )}

        {/* TAB 4: ADMIN ANALYTICS */}
        {activeTab === 'admin' && (
          <AdminPanel onToast={addToast} />
        )}

        {/* TAB 5: SETTINGS */}
        {activeTab === 'settings' && (
          <SettingsSection
            settings={settings}
            onUpdateSettings={(newSettings) =>
              setSettings((prev) => ({ ...prev, ...newSettings }))
            }
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            onToast={addToast}
          />
        )}

      </main>

      {/* Subtle Footer */}
      <footer className="mt-16 border-t border-slate-200 dark:border-slate-800/80 py-8 bg-white/40 dark:bg-slate-900/40 text-xs text-center text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-800 dark:text-slate-200">MediaHub Downloader</span>
            <span>•</span>
            <span>Universal Social Video Downloader & Processing Suite</span>
          </div>
          <div>
            Built with React 19, Express, TypeScript & Tailwind CSS
          </div>
        </div>
      </footer>
    </div>
  );
}
