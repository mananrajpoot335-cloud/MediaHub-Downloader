import React from 'react';
import { DownloadTask, VideoQualityOption, VideoToolType } from '../types';
import { formatBytes, formatDuration } from '../utils/mediaUtils';
import { 
  Download, 
  Pause, 
  Play, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  FileCheck, 
  Wrench, 
  ExternalLink,
  Loader2,
  Trash2,
  Folder
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';

interface ActiveDownloadsManagerProps {
  tasks: DownloadTask[];
  onPauseTask: (id: string) => void;
  onResumeTask: (id: string) => void;
  onCancelTask: (id: string) => void;
  onClearCompleted: () => void;
  onOpenInTools: (task: DownloadTask, tool: VideoToolType) => void;
}

export const ActiveDownloadsManager: React.FC<ActiveDownloadsManagerProps> = ({
  tasks,
  onPauseTask,
  onResumeTask,
  onCancelTask,
  onClearCompleted,
  onOpenInTools,
}) => {
  if (tasks.length === 0) return null;

  const activeCount = tasks.filter((t) => t.status === 'downloading' || t.status === 'queued').length;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;

  const handleOpenFolder = async (task: DownloadTask) => {
    try {
      const res = await fetch(`/api/download/open-folder/${task.id}`);
      if (res.ok) {
        const data = await res.json();
        alert(`Saved Location:\n${data.absolutePath}`);
      }
    } catch {
      // ignore
    }
  };

  const triggerFileDownload = (task: DownloadTask) => {
    // Fire confetti for celebration
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch {
      // ignore
    }

    // Download actual saved file from real backend server endpoint
    const fileApiUrl = `/api/download/file/${task.id}`;
    const a = document.createElement('a');
    a.href = fileApiUrl;
    a.download = task.fileName;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Download Manager
          </h3>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-600 dark:bg-indigo-400/20 dark:text-indigo-300">
            {activeCount} Active • {completedCount} Finished
          </span>
        </div>

        {completedCount > 0 && (
          <button
            onClick={onClearCompleted}
            className="flex items-center space-x-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Finished</span>
          </button>
        )}
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {tasks.map((task) => {
            const isCompleted = task.status === 'completed';
            const isDownloading = task.status === 'downloading';
            const isPaused = task.status === 'paused';
            const isFailed = task.status === 'failed';

            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className={`p-4 rounded-2xl border transition-all ${
                  isCompleted
                    ? 'bg-emerald-500/5 border-emerald-500/20 dark:bg-emerald-950/20'
                    : isFailed
                    ? 'bg-red-500/5 border-red-500/20 dark:bg-red-950/20'
                    : 'bg-white/90 dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-800 shadow-lg'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left: Thumbnail & Video Info */}
                  <div className="flex items-center space-x-3 min-w-0">
                    <img
                      src={task.metadata.thumbnail}
                      alt={task.metadata.title}
                      className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                        {task.metadata.title}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400 uppercase">
                          {task.quality.label}
                        </span>
                        <span>•</span>
                        <span>{formatBytes(task.totalBytes)}</span>
                        {isDownloading && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                              {task.speedMbps.toFixed(1)} MB/s
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Actions & Progress Bar */}
                  <div className="flex items-center justify-between sm:justify-end space-x-3 shrink-0">
                    {/* Status Label & Percent */}
                    <div className="text-right">
                      {isDownloading && (
                        <div className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {Math.round(task.progress)}%
                        </div>
                      )}
                      {isCompleted && (
                        <div className="flex items-center space-x-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Complete</span>
                        </div>
                      )}
                      {isPaused && (
                        <span className="text-xs font-semibold text-amber-500">Paused</span>
                      )}
                      {isFailed && (
                        <span className="text-xs font-semibold text-red-500">Failed</span>
                      )}
                    </div>

                    {/* Controls */}
                    <div className="flex items-center space-x-1.5">
                      {isDownloading && (
                        <button
                          onClick={() => onPauseTask(task.id)}
                          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                          title="Pause Download"
                        >
                          <Pause className="w-4 h-4" />
                        </button>
                      )}

                      {isPaused && (
                        <button
                          onClick={() => onResumeTask(task.id)}
                          className="p-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500"
                          title="Resume Download"
                        >
                          <Play className="w-4 h-4 fill-white" />
                        </button>
                      )}

                      {isCompleted && (
                        <>
                          <button
                            onClick={() => triggerFileDownload(task)}
                            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/20"
                            title="Save File to Disk"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Save File</span>
                          </button>

                          <button
                            onClick={() => handleOpenFolder(task)}
                            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                            title="Open Saved Folder Location"
                          >
                            <Folder className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => onOpenInTools(task, 'trim')}
                            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 hover:text-indigo-600"
                            title="Edit in Video Tools"
                          >
                            <Wrench className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      {!isCompleted && (
                        <button
                          onClick={() => onCancelTask(task.id)}
                          className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                          title="Cancel Download"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress Bar Line */}
                {!isCompleted && !isFailed && (
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-3">
                    <motion.div
                      className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-full"
                      initial={{ width: '0%' }}
                      animate={{ width: `${task.progress}%` }}
                      transition={{ ease: 'linear', duration: 0.2 }}
                    />
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};
