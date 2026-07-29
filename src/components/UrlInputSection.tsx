import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Clipboard, 
  ArrowRight, 
  Sparkles, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  X,
  Globe,
  Youtube,
  Instagram,
  Twitter,
  Facebook,
  Tv,
  AtSign,
  PlaySquare,
  Video
} from 'lucide-react';
import { detectPlatform, isValidVideoUrl, getPlatformBadgeDetails } from '../utils/mediaUtils';
import { PlatformType } from '../types';
import { SAMPLE_VIDEOS_LIST } from '../data/mockVideos';

interface UrlInputSectionProps {
  onAnalyzeUrl: (url: string) => void;
  isLoading: boolean;
  errorMessage: string | null;
  onClearError: () => void;
}

export const UrlInputSection: React.FC<UrlInputSectionProps> = ({
  onAnalyzeUrl,
  isLoading,
  errorMessage,
  onClearError,
}) => {
  const [url, setUrl] = useState('');
  const [detectedPlatform, setDetectedPlatform] = useState<PlatformType>('generic');
  const [isValid, setIsValid] = useState<boolean | null>(null);

  useEffect(() => {
    if (!url.trim()) {
      setDetectedPlatform('generic');
      setIsValid(null);
      return;
    }
    const plat = detectPlatform(url);
    const valid = isValidVideoUrl(url);
    setDetectedPlatform(plat);
    setIsValid(valid);
    if (errorMessage) {
      onClearError();
    }
  }, [url]);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text);
      }
    } catch {
      // Browser permission blocked fallback
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || isLoading) return;
    onAnalyzeUrl(url.trim());
  };

  const handleSampleClick = (sampleUrl: string) => {
    setUrl(sampleUrl);
    onAnalyzeUrl(sampleUrl);
  };

  const badge = getPlatformBadgeDetails(detectedPlatform);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Main Glassmorphic Input Card */}
      <div className="relative rounded-3xl p-6 sm:p-8 bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-xl backdrop-blur-xl">
        
        {/* Decorative Top Accent Line */}
        <div className="absolute top-0 left-8 right-8 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-b-full opacity-80" />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              <span>Universal Media Downloader</span>
            </h2>

            {/* Platform Badge Indicator */}
            {detectedPlatform !== 'generic' && (
              <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${badge.bgColor} ${badge.color} ${badge.borderColor} animate-pulse`}>
                <span>{badge.name} Detected</span>
              </span>
            )}
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-400">
            Paste any video URL from YouTube, TikTok, Instagram, Twitter/X, Facebook, Vimeo, Threads or Dailymotion.
          </p>

          <form onSubmit={handleSubmit} className="relative mt-4">
            <div className="relative flex items-center">
              {/* Search Icon */}
              <div className="absolute left-4 text-slate-400">
                <Search className="w-5 h-5" />
              </div>

              {/* Main URL Text Field */}
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste video URL here (e.g. https://www.youtube.com/watch?v=...)"
                className="w-full pl-12 pr-36 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400 border border-slate-200 dark:border-slate-700/70 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent text-sm sm:text-base transition-all"
                disabled={isLoading}
              />

              {/* Right Action Group: Clear & Paste & Submit */}
              <div className="absolute right-2.5 flex items-center space-x-1.5">
                {url && (
                  <button
                    type="button"
                    onClick={() => setUrl('')}
                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={handlePaste}
                  className="hidden sm:flex items-center space-x-1 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-200/60 dark:bg-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                >
                  <Clipboard className="w-3.5 h-3.5" />
                  <span>Paste</span>
                </button>

                <button
                  type="submit"
                  disabled={!url.trim() || isLoading}
                  className="flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm shadow-md shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="hidden sm:inline">Detecting...</span>
                    </>
                  ) : (
                    <>
                      <span>Fetch</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Validation Feedback */}
          {isValid === false && url.length > 5 && (
            <div className="flex items-center space-x-2 text-xs text-amber-600 dark:text-amber-400 pt-1">
              <AlertCircle className="w-4 h-4" />
              <span>Please double-check the URL format. Must start with http:// or https://</span>
            </div>
          )}

          {errorMessage && (
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button onClick={onClearError} className="p-1 hover:opacity-80">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Supported Platforms Grid */}
        <div className="mt-6 pt-6 border-t border-slate-200/60 dark:border-slate-800">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
            Supported Media Platforms
          </p>

          <div className="flex flex-wrap gap-2 sm:gap-3">
            {[
              { label: 'YouTube', icon: Youtube, color: 'hover:text-red-500 hover:bg-red-500/10' },
              { label: 'TikTok', icon: Video, color: 'hover:text-cyan-500 hover:bg-cyan-500/10' },
              { label: 'Instagram', icon: Instagram, color: 'hover:text-pink-500 hover:bg-pink-500/10' },
              { label: 'Twitter / X', icon: Twitter, color: 'hover:text-sky-500 hover:bg-sky-500/10' },
              { label: 'Facebook', icon: Facebook, color: 'hover:text-blue-600 hover:bg-blue-600/10' },
              { label: 'Vimeo', icon: Tv, color: 'hover:text-teal-500 hover:bg-teal-500/10' },
              { label: 'Threads', icon: AtSign, color: 'hover:text-emerald-500 hover:bg-emerald-500/10' },
              { label: 'Dailymotion', icon: PlaySquare, color: 'hover:text-amber-500 hover:bg-amber-500/10' },
            ].map((item) => {
              const IconComp = item.icon;
              return (
                <div
                  key={item.label}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50 transition-colors ${item.color}`}
                >
                  <IconComp className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Sample Media Launchers */}
      <div className="bg-slate-100/70 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Quick Sample Test URLs
          </span>
          <span className="text-xs text-slate-400">Click to auto-fetch metadata</span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {SAMPLE_VIDEOS_LIST.slice(0, 3).map((sample, idx) => (
            <button
              key={idx}
              onClick={() => handleSampleClick(sample.url)}
              disabled={isLoading}
              className="text-left p-2.5 rounded-xl bg-white dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200/80 dark:border-slate-700/60 transition-all text-xs group"
            >
              <div className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">
                {sample.label}
              </div>
              <div className="text-slate-400 truncate mt-0.5">{sample.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
