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

  // Sync tasks with backend
  const fetchTasksFromBackend = async () => {
    try {
      const res = await fetch('/api/download/list');
      if (res.ok) {
        const data = await res.json();
        setActiveTasks(data.active || []);
        setHistoryTasks(data.history || []);
      }
    } catch {
      // Ignore network errors during polling
    }
  };

  useEffect(() => {
    fetchTasksFromBackend();
    const interval = setInterval(fetchTasksFromBackend, 800);
    return () => clearInterval(interval);
  }, []);

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

  // Start Real Download via Server API `/api/download/start`
  const handleStartDownload = async (quality: VideoQualityOption) => {
    if (!currentMetadata) return;

    try {
      addToast('info', 'Starting Download...', `Initiating ${quality.label} download.`);
      const res = await fetch('/api/download/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metadata: currentMetadata,
          quality,
          downloadFolder: settings.downloadFolder,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to start download process.');
      }

      if (data.task) {
        setActiveTasks((prev) => [data.task, ...prev]);
        addToast('success', 'Download Active!', `${data.task.fileName} is downloading.`);
      }
      fetchTasksFromBackend();
    } catch (err: any) {
      addToast('error', 'Download Error', err.message);
    }
  };

  // Task Control Handlers with Real Backend API Calls
  const handlePauseTask = async (id: string) => {
    try {
      await fetch(`/api/download/pause/${id}`, { method: 'POST' });
      fetchTasksFromBackend();
      addToast('info', 'Download Paused');
    } catch {
      // Ignore
    }
  };

  const handleResumeTask = async (id: string) => {
    try {
      await fetch(`/api/download/resume/${id}`, { method: 'POST' });
      fetchTasksFromBackend();
      addToast('info', 'Download Resumed');
    } catch {
      // Ignore
    }
  };

  const handleCancelTask = async (id: string) => {
    try {
      await fetch(`/api/download/cancel/${id}`, { method: 'POST' });
      setActiveTasks((prev) => prev.filter((t) => t.id !== id));
      addToast('info', 'Download Cancelled');
      fetchTasksFromBackend();
    } catch {
      // Ignore
    }
  };

  const handleClearCompleted = () => {
    setActiveTasks((prev) => prev.filter((t) => t.status !== 'completed'));
  };

  const handleClearHistory = async () => {
    try {
      await fetch('/api/download/history', { method: 'DELETE' });
      setHistoryTasks([]);
      addToast('info', 'History Cleared', 'All download history records wiped.');
    } catch {
      // Ignore
    }
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
            onClearHistory={handleClearHistory}
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
            onUpdateSettings={(newSettings) => {
              setSettings((prev) => ({ ...prev, ...newSettings }));
              fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newSettings),
              }).catch(() => {});
            }}
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
