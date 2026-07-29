import React, { useState } from 'react';
import { DownloadTask, PlatformType } from '../types';
import { formatBytes, getPlatformBadgeDetails } from '../utils/mediaUtils';
import { 
  Search, 
  Download, 
  Trash2, 
  FileText, 
  Filter, 
  ExternalLink, 
  Copy, 
  Check, 
  Clock, 
  ArrowUpDown,
  FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DownloadHistoryProps {
  history: DownloadTask[];
  onClearHistory: () => void;
  onRedownload: (task: DownloadTask) => void;
  onToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export const DownloadHistory: React.FC<DownloadHistoryProps> = ({
  history,
  onClearHistory,
  onRedownload,
  onToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [selectedFormat, setSelectedFormat] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredHistory = history.filter((item) => {
    const matchesQuery =
      item.metadata.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.metadata.originalUrl.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.metadata.author.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPlatform =
      selectedPlatform === 'all' || item.metadata.platform === selectedPlatform;

    const matchesFormat =
      selectedFormat === 'all' || item.quality.format === selectedFormat;

    return matchesQuery && matchesPlatform && matchesFormat;
  });

  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    onToast('info', 'Link Copied', 'Original URL copied to clipboard.');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(history, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `MediaHub_Download_History_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    onToast('success', 'History Exported', 'JSON export file downloaded.');
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Header & Control Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl backdrop-blur-xl">
        
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Clock className="w-5 h-5 text-indigo-500" />
            <span>Download History</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Total {history.length} completed downloads recorded locally.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {history.length > 0 && (
            <>
              <button
                onClick={handleExportJSON}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                <span>Export JSON</span>
              </button>

              <button
                onClick={onClearHistory}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-xs font-semibold text-red-600 dark:text-red-400 border border-red-500/20 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear All</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        {/* Search */}
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search history by title, author or URL..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Platform Filter */}
        <div className="sm:col-span-3">
          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            className="w-full px-3 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Platforms</option>
            <option value="youtube">YouTube</option>
            <option value="tiktok">TikTok</option>
            <option value="instagram">Instagram</option>
            <option value="twitter">Twitter / X</option>
            <option value="vimeo">Vimeo</option>
          </select>
        </div>

        {/* Format Filter */}
        <div className="sm:col-span-3">
          <select
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value)}
            className="w-full px-3 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Formats</option>
            <option value="mp4">MP4 Video</option>
            <option value="mp3">MP3 Audio</option>
          </select>
        </div>
      </div>

      {/* History Table / List */}
      {filteredHistory.length === 0 ? (
        <div className="text-center py-16 bg-white/60 dark:bg-slate-900/60 rounded-3xl border border-slate-200/80 dark:border-slate-800">
          <Clock className="w-10 h-10 text-slate-400 mx-auto mb-3 opacity-60" />
          <h3 className="font-semibold text-slate-700 dark:text-slate-300">No Download History Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {history.length === 0
              ? 'Your downloaded media items will appear here automatically.'
              : 'No items match your current search and filter criteria.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filteredHistory.map((item) => {
              const badge = getPlatformBadgeDetails(item.metadata.platform);
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  {/* Left: Video Info */}
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <img
                      src={item.metadata.thumbnail}
                      alt={item.metadata.title}
                      className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${badge.bgColor} ${badge.color}`}>
                          {badge.name}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate mt-1">
                        {item.metadata.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {item.quality.label} • {formatBytes(item.totalBytes)} • {item.metadata.author}
                      </p>
                    </div>
                  </div>

                  {/* Right: Quick Re-download & Copy Links */}
                  <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => handleCopyLink(item.metadata.originalUrl, item.id)}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                      title="Copy Original Video Link"
                    >
                      {copiedId === item.id ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      onClick={() => onRedownload(item)}
                      className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/20"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Re-Download</span>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
