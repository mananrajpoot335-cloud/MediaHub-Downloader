import React, { useState } from 'react';
import { 
  VideoMetadata, 
  VideoQualityOption, 
  VideoToolType 
} from '../types';
import { 
  formatDuration, 
  formatNumber, 
  formatBytes, 
  getPlatformBadgeDetails 
} from '../utils/mediaUtils';
import { 
  Download, 
  Play, 
  Check, 
  Eye, 
  ThumbsUp, 
  Clock, 
  Sparkles, 
  Wrench, 
  Music, 
  FileVideo, 
  ExternalLink,
  Info
} from 'lucide-react';
import { motion } from 'motion/react';

interface VideoPreviewCardProps {
  metadata: VideoMetadata;
  onStartDownload: (quality: VideoQualityOption) => void;
  onSendToTools: (metadata: VideoMetadata, toolType: VideoToolType) => void;
}

export const VideoPreviewCard: React.FC<VideoPreviewCardProps> = ({
  metadata,
  onStartDownload,
  onSendToTools,
}) => {
  const [activeTab, setActiveTab] = useState<'video' | 'audio'>('video');
  const [selectedQuality, setSelectedQuality] = useState<VideoQualityOption>(
    metadata.qualities.find((q) => q.isBest) || metadata.qualities[0]
  );
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  const badge = getPlatformBadgeDetails(metadata.platform);

  const filteredQualities = metadata.qualities.filter((q) => q.type === activeTab);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-4xl mx-auto rounded-3xl overflow-hidden bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-2xl backdrop-blur-xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
        
        {/* Left Column: Video Thumbnail & Live Preview Player */}
        <div className="md:col-span-5 relative bg-slate-950 flex flex-col justify-between group overflow-hidden min-h-[260px]">
          {isPlayingPreview && metadata.sampleVideoUrl ? (
            <video
              src={metadata.sampleVideoUrl}
              controls
              autoPlay
              className="w-full h-full object-cover"
            />
          ) : (
            <>
              <img
                src={metadata.thumbnail}
                alt={metadata.title}
                className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500 min-h-[260px]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
              
              {/* Play Overlay */}
              <button
                onClick={() => setIsPlayingPreview(true)}
                className="absolute inset-0 flex items-center justify-center group/btn"
              >
                <div className="w-16 h-16 rounded-full bg-indigo-600/90 hover:bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/50 backdrop-blur-md transform group-hover/btn:scale-110 transition-transform">
                  <Play className="w-7 h-7 ml-1 fill-white" />
                </div>
              </button>
            </>
          )}

          {/* Platform Badge Overlay */}
          <div className="absolute top-4 left-4 z-10">
            <span className={`px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md ${badge.bgColor} ${badge.color} ${badge.borderColor}`}>
              {badge.name}
            </span>
          </div>

          {/* Duration Badge */}
          <div className="absolute bottom-4 right-4 z-10">
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md text-white text-xs font-mono border border-slate-800">
              <Clock className="w-3 h-3 text-indigo-400" />
              <span>{formatDuration(metadata.durationSeconds)}</span>
            </span>
          </div>
        </div>

        {/* Right Column: Video Details & Download Options */}
        <div className="md:col-span-7 p-6 sm:p-7 flex flex-col justify-between space-y-6">
          
          {/* Title & Author Meta */}
          <div className="space-y-3">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug line-clamp-2">
              {metadata.title}
            </h3>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
              {/* Author */}
              <div className="flex items-center space-x-2">
                {metadata.authorAvatar && (
                  <img
                    src={metadata.authorAvatar}
                    alt={metadata.author}
                    className="w-6 h-6 rounded-full border border-slate-300 dark:border-slate-700"
                  />
                )}
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {metadata.author}
                </span>
              </div>

              {/* View Count */}
              {metadata.viewCount && (
                <div className="flex items-center space-x-1">
                  <Eye className="w-3.5 h-3.5" />
                  <span>{formatNumber(metadata.viewCount)} views</span>
                </div>
              )}

              {/* Likes Count */}
              {metadata.likesCount && (
                <div className="flex items-center space-x-1">
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>{formatNumber(metadata.likesCount)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Format Type Selector Tabs: MP4 Video vs MP3 Audio */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Select Quality & Format
              </span>

              <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
                <button
                  onClick={() => {
                    setActiveTab('video');
                    const firstVid = metadata.qualities.find((q) => q.type === 'video');
                    if (firstVid) setSelectedQuality(firstVid);
                  }}
                  className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'video'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <FileVideo className="w-3.5 h-3.5" />
                  <span>MP4 Video</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('audio');
                    const firstAud = metadata.qualities.find((q) => q.type === 'audio');
                    if (firstAud) setSelectedQuality(firstAud);
                  }}
                  className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'audio'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Music className="w-3.5 h-3.5" />
                  <span>MP3 Audio</span>
                </button>
              </div>
            </div>

            {/* Quality Options Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredQualities.map((q) => {
                const isSelected = selectedQuality.id === q.id;
                return (
                  <button
                    key={q.id}
                    onClick={() => setSelectedQuality(q)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200 shadow-sm ring-1 ring-indigo-500'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center space-x-1.5 font-semibold text-xs">
                        <span>{q.label}</span>
                        {q.isBest && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400">
                            BEST
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {q.resolution} • {formatBytes(q.sizeBytes)} • {q.bitrate}
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-600 text-white'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Download Action & Send to Video Tools Actions */}
          <div className="pt-2 space-y-2">
            <button
              onClick={() => onStartDownload(selectedQuality)}
              className="w-full flex items-center justify-center space-x-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-sm shadow-xl shadow-indigo-600/25 active:scale-[0.99] transition-all"
            >
              <Download className="w-5 h-5" />
              <span>
                Download {selectedQuality.label} ({formatBytes(selectedQuality.sizeBytes)})
              </span>
            </button>

            <div className="flex items-center justify-between pt-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center space-x-1">
                <Info className="w-3.5 h-3.5 text-indigo-500" />
                <span>Fast Direct Stream • No Watermark</span>
              </span>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onSendToTools(metadata, 'trim')}
                  className="flex items-center space-x-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Open in Video Tools</span>
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
};
