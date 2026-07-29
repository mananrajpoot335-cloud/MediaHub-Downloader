import React, { useState, useRef } from 'react';
import { 
  VideoMetadata, 
  VideoToolType, 
  TrimOptions, 
  CropOptions, 
  CompressOptions, 
  ConvertOptions, 
  AudioExtractOptions,
  MergeClip,
  MergeOptions
} from '../types';
import { formatDuration, formatBytes } from '../utils/mediaUtils';
import { 
  Scissors, 
  Crop, 
  Zap, 
  RefreshCw, 
  Music, 
  Layers, 
  Play, 
  Pause, 
  Download, 
  Loader2, 
  Upload, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  CheckCircle2,
  Sparkles,
  FileVideo
} from 'lucide-react';
import { motion } from 'motion/react';

interface VideoToolsSuiteProps {
  initialMetadata?: VideoMetadata | null;
  onToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export const VideoToolsSuite: React.FC<VideoToolsSuiteProps> = ({
  initialMetadata,
  onToast,
}) => {
  const [activeTool, setActiveTool] = useState<VideoToolType>('trim');
  const [videoUrl, setVideoUrl] = useState<string>(
    initialMetadata?.sampleVideoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
  );
  const [videoTitle, setVideoTitle] = useState<string>(
    initialMetadata?.title || 'Sample_Nature_Clip.mp4'
  );
  const [duration, setDuration] = useState<number>(initialMetadata?.durationSeconds || 60);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedResult, setProcessedResult] = useState<{
    downloadUrl: string;
    outputTitle: string;
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Tool Specific States
  // 1. Trim
  const [trimOptions, setTrimOptions] = useState<TrimOptions>({
    startTime: 0,
    endTime: initialMetadata?.durationSeconds || 30,
  });

  // 2. Crop
  const [cropOptions, setCropOptions] = useState<CropOptions>({
    aspectRatio: '16:9',
    x: 0,
    y: 0,
    width: 100,
    height: 100,
  });

  // 3. Compress
  const [compressOptions, setCompressOptions] = useState<CompressOptions>({
    qualityLevel: 'medium',
    targetSizeBytes: 15 * 1024 * 1024,
    presetBitrate: '2500 kbps',
  });

  // 4. Convert
  const [convertOptions, setConvertOptions] = useState<ConvertOptions>({
    targetFormat: 'mp4',
    videoCodec: 'h264',
    audioBitrate: '320k',
  });

  // 5. Audio Extract
  const [audioOptions, setAudioOptions] = useState<AudioExtractOptions>({
    audioFormat: 'mp3',
    bitrate: '320k',
    fadeInSeconds: 1,
    fadeOutSeconds: 1,
  });

  // 6. Merge
  const [mergeClips, setMergeClips] = useState<MergeClip[]>([
    {
      id: 'clip_1',
      title: 'Intro Scene - Nature Opening',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      durationSeconds: 15,
      thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80',
    },
    {
      id: 'clip_2',
      title: 'Main Feature - Mountain Aerials',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      durationSeconds: 25,
      thumbnail: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&q=80',
    },
  ]);
  const [mergeTransition, setMergeTransition] = useState<'none' | 'fade' | 'dissolve' | 'wipe'>('fade');

  // Handle Video File Upload for Editing
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const blobUrl = URL.createObjectURL(file);
      setVideoUrl(blobUrl);
      setVideoTitle(file.name);
      setProcessedResult(null);
      onToast('success', 'Video Loaded', `Ready to edit "${file.name}"`);
    }
  };

  // Run Process Action via Server API Endpoint `/api/tools/process`
  const handleProcess = async () => {
    setIsProcessing(true);
    setProcessedResult(null);

    let optionsPayload: any = {};
    if (activeTool === 'trim') optionsPayload = trimOptions;
    if (activeTool === 'crop') optionsPayload = cropOptions;
    if (activeTool === 'compress') optionsPayload = compressOptions;
    if (activeTool === 'convert') optionsPayload = convertOptions;
    if (activeTool === 'extract_audio') optionsPayload = audioOptions;
    if (activeTool === 'merge') optionsPayload = { clips: mergeClips, transition: mergeTransition };

    try {
      const res = await fetch('/api/tools/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolType: activeTool,
          options: optionsPayload,
          videoUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Server tool processing failed');

      setProcessedResult({
        downloadUrl: data.downloadUrl,
        outputTitle: data.outputTitle,
      });
      onToast('success', 'Processing Complete!', `Output generated: ${data.outputTitle}`);
    } catch (err: any) {
      onToast('error', 'Processing Error', err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const toolsList = [
    { id: 'trim' as VideoToolType, label: 'Trimmer', icon: Scissors, desc: 'Cut & trim exact video segments' },
    { id: 'crop' as VideoToolType, label: 'Cropper', icon: Crop, desc: 'Resize aspect ratio (16:9, 9:16, 1:1)' },
    { id: 'compress' as VideoToolType, label: 'Compressor', icon: Zap, desc: 'Reduce file size without quality loss' },
    { id: 'convert' as VideoToolType, label: 'Converter', icon: RefreshCw, desc: 'Convert format (MP4, WebM, GIF, MP3)' },
    { id: 'extract_audio' as VideoToolType, label: 'Audio Extract', icon: Music, desc: 'Extract pure MP3/WAV audio track' },
    { id: 'merge' as VideoToolType, label: 'Merger', icon: Layers, desc: 'Combine multiple clips into one video' },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
      
      {/* Tool Selection Grid Header */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {toolsList.map((tool) => {
          const IconComp = tool.icon;
          const isActive = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => {
                setActiveTool(tool.id);
                setProcessedResult(null);
              }}
              className={`flex flex-col items-center p-4 rounded-2xl border transition-all text-center ${
                isActive
                  ? 'bg-gradient-to-b from-indigo-600 to-indigo-700 text-white border-indigo-500 shadow-xl shadow-indigo-600/30 font-semibold'
                  : 'bg-white/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
              }`}
            >
              <IconComp className="w-6 h-6 mb-2" />
              <span className="text-xs font-bold">{tool.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Working Stage Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Stage Column: Video Canvas & Preview Player */}
        <div className="lg:col-span-7 bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col justify-between">
          <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
            <video
              ref={videoRef}
              src={videoUrl}
              onLoadedMetadata={(e) => {
                const dur = e.currentTarget.duration;
                if (dur && !isNaN(dur)) {
                  setDuration(dur);
                  if (trimOptions.endTime === 30 || trimOptions.endTime > dur) {
                    setTrimOptions((prev) => ({ ...prev, endTime: Math.floor(dur) }));
                  }
                }
              }}
              controls
              className="w-full h-full object-contain"
            />

            {/* Crop Overlay Frame if Cropper Active */}
            {activeTool === 'crop' && (
              <div
                className={`absolute pointer-events-none border-2 border-indigo-400 border-dashed bg-indigo-500/10 backdrop-blur-[1px] ${
                  cropOptions.aspectRatio === '16:9'
                    ? 'w-full h-[56.25%]'
                    : cropOptions.aspectRatio === '9:16'
                    ? 'w-[56.25%] h-full'
                    : cropOptions.aspectRatio === '1:1'
                    ? 'w-[75%] h-[75%]'
                    : cropOptions.aspectRatio === '4:3'
                    ? 'w-[80%] h-[60%]'
                    : 'w-4/5 h-4/5'
                }`}
              >
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-indigo-600 text-white text-[10px] font-bold">
                  Crop Box: {cropOptions.aspectRatio}
                </div>
              </div>
            )}
          </div>

          {/* Video Meta bar & Local File Upload Trigger */}
          <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center space-x-2 truncate pr-2">
              <FileVideo className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="font-semibold text-slate-200 truncate">{videoTitle}</span>
              <span>({formatDuration(duration)})</span>
            </div>

            <label className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer font-semibold transition-colors shrink-0">
              <Upload className="w-3.5 h-3.5 text-indigo-400" />
              <span>Load Local File</span>
              <input type="file" accept="video/*,audio/*" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>

        {/* Right Stage Column: Tool Controls Panel */}
        <div className="lg:col-span-5 rounded-3xl p-6 bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-xl backdrop-blur-xl flex flex-col justify-between space-y-6">
          
          <div>
            <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-4 mb-5">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              <h3 className="font-bold text-lg text-slate-900 dark:text-white capitalize">
                {activeTool.replace('_', ' ')} Studio Settings
              </h3>
            </div>

            {/* 1. TRIM CONTROLS */}
            {activeTool === 'trim' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select start and end timestamp to extract segment.
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex justify-between">
                      <span>Start Time:</span>
                      <span className="font-mono text-indigo-600 dark:text-indigo-400">
                        {formatDuration(trimOptions.startTime)}
                      </span>
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={duration}
                      value={trimOptions.startTime}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (val < trimOptions.endTime) {
                          setTrimOptions((prev) => ({ ...prev, startTime: val }));
                        }
                      }}
                      className="w-full accent-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex justify-between">
                      <span>End Time:</span>
                      <span className="font-mono text-indigo-600 dark:text-indigo-400">
                        {formatDuration(trimOptions.endTime)}
                      </span>
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={duration}
                      value={trimOptions.endTime}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (val > trimOptions.startTime) {
                          setTrimOptions((prev) => ({ ...prev, endTime: val }));
                        }
                      }}
                      className="w-full accent-indigo-600"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 flex justify-between">
                  <span>Output Duration:</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-mono">
                    {formatDuration(trimOptions.endTime - trimOptions.startTime)}
                  </span>
                </div>
              </div>
            )}

            {/* 2. CROP CONTROLS */}
            {activeTool === 'crop' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Choose aspect ratio preset for social platforms.
                </p>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: '16:9', label: '16:9 Landscape (YouTube)' },
                    { id: '9:16', label: '9:16 Vertical (TikTok/Reels)' },
                    { id: '1:1', label: '1:1 Square (Feed)' },
                    { id: '4:3', label: '4:3 Standard Video' },
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => setCropOptions((prev) => ({ ...prev, aspectRatio: preset.id as any }))}
                      className={`p-3 rounded-xl text-xs font-semibold border text-left ${
                        cropOptions.aspectRatio === preset.id
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                          : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 3. COMPRESS CONTROLS */}
            {activeTool === 'compress' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Adjust compression level to balance quality and file size.
                </p>

                <div className="space-y-2">
                  {[
                    { id: 'low', label: 'Low Compression (High Quality)', est: 'Reduce ~20%' },
                    { id: 'medium', label: 'Balanced (Recommended)', est: 'Reduce ~50%' },
                    { id: 'high', label: 'High Compression (Web / Mail)', est: 'Reduce ~75%' },
                  ].map((level) => (
                    <button
                      key={level.id}
                      onClick={() => setCompressOptions((prev) => ({ ...prev, qualityLevel: level.id as any }))}
                      className={`w-full p-3 rounded-xl text-xs font-semibold border flex justify-between items-center ${
                        compressOptions.qualityLevel === level.id
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                          : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span>{level.label}</span>
                      <span className="text-[10px] font-bold uppercase opacity-80">{level.est}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 4. CONVERT CONTROLS */}
            {activeTool === 'convert' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Convert media file into popular format extensions.
                </p>

                <div className="grid grid-cols-3 gap-2">
                  {['mp4', 'webm', 'avi', 'mov', 'gif', 'mp3', 'wav', 'flac'].map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => setConvertOptions((prev) => ({ ...prev, targetFormat: fmt as any }))}
                      className={`p-3 rounded-xl text-xs font-bold uppercase border text-center ${
                        convertOptions.targetFormat === fmt
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                          : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      .{fmt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 5. AUDIO EXTRACT CONTROLS */}
            {activeTool === 'extract_audio' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Strip audio track and export high-fidelity audio file.
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
                      Bitrate Quality:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['128k', '192k', '320k'].map((b) => (
                        <button
                          key={b}
                          onClick={() => setAudioOptions((prev) => ({ ...prev, bitrate: b as any }))}
                          className={`p-2 rounded-xl text-xs font-bold border text-center ${
                            audioOptions.bitrate === b
                              ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                              : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {b}ps
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 6. MERGER CONTROLS */}
            {activeTool === 'merge' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Clip sequence list to combine into output video.
                </p>

                <div className="space-y-2">
                  {mergeClips.map((clip, index) => (
                    <div
                      key={clip.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs"
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center">
                          {index + 1}
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {clip.title}
                        </span>
                      </div>
                      <span className="text-slate-400 font-mono text-[11px] shrink-0">
                        {clip.durationSeconds}s
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Process Trigger Button & Download Result Output */}
          <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            {processedResult ? (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Output Ready: {processedResult.outputTitle}</span>
                </div>
                <a
                  href={processedResult.downloadUrl}
                  download={processedResult.outputTitle}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Processed Media File</span>
                </a>
              </div>
            ) : (
              <button
                onClick={handleProcess}
                disabled={isProcessing}
                className="w-full flex items-center justify-center space-x-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-sm shadow-xl shadow-indigo-600/20 disabled:opacity-50 transition-all"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Media on Server...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Process & Export {activeTool.toUpperCase()}</span>
                  </>
                )}
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
