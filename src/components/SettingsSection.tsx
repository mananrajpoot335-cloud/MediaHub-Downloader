import React, { useState } from 'react';
import { AppSettings } from '../types';
import { 
  Settings, 
  Sun, 
  Moon, 
  Monitor, 
  HardDrive, 
  Sliders, 
  Globe, 
  Bell, 
  ShieldCheck, 
  RotateCw, 
  CheckCircle2, 
  Folder,
  Zap
} from 'lucide-react';
import { motion } from 'motion/react';

interface SettingsSectionProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  settings,
  onUpdateSettings,
  darkMode,
  setDarkMode,
  onToast,
}) => {
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);

  const handleCheckUpdate = () => {
    setIsCheckingUpdate(true);
    setTimeout(() => {
      setIsCheckingUpdate(false);
      onToast('success', 'Software Up To Date', 'MediaHub Downloader v2.4.0 is running the latest build.');
    }, 1200);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="bg-white/90 dark:bg-slate-900/90 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl backdrop-blur-xl space-y-8">
        
        {/* Header */}
        <div className="flex items-center space-x-3 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Application Preferences</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Customize appearance, download parameters, folder paths, and language settings.
            </p>
          </div>
        </div>

        {/* 1. APPEARANCE SETTINGS */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Appearance & Theme
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { id: 'dark', label: 'Dark Mode', icon: Moon, action: () => setDarkMode(true), active: darkMode },
              { id: 'light', label: 'Light Mode', icon: Sun, action: () => setDarkMode(false), active: !darkMode },
            ].map((theme) => {
              const IconComp = theme.icon;
              return (
                <button
                  key={theme.id}
                  onClick={theme.action}
                  className={`flex items-center space-x-2.5 p-3.5 rounded-2xl border font-semibold text-xs transition-all ${
                    theme.active
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 ring-1 ring-indigo-500'
                      : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <IconComp className="w-4 h-4" />
                  <span>{theme.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. DOWNLOAD PREFERENCES */}
        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Default Download Quality
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
                Preferred Video Quality
              </label>
              <select
                value={settings.defaultQuality}
                onChange={(e) => onUpdateSettings({ defaultQuality: e.target.value as any })}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="best">Best Available (4K / 1080p FHD)</option>
                <option value="1080p">1080p Full HD</option>
                <option value="720p">720p HD</option>
                <option value="mp3">Audio Only MP3</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
                Default Audio Extractor Format
              </label>
              <select
                value={settings.defaultAudioFormat}
                onChange={(e) => onUpdateSettings({ defaultAudioFormat: e.target.value as any })}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="mp3">MP3 High Quality (320kbps)</option>
                <option value="wav">WAV Lossless Audio</option>
                <option value="aac">AAC Stereo Track</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3. DOWNLOAD LOCATION & CONCURRENCY */}
        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            System & Storage
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
                Simulated Output Directory
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={settings.downloadFolder}
                  onChange={(e) => onUpdateSettings({ downloadFolder: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
                Max Concurrent Downloads (1-5)
              </label>
              <select
                value={settings.concurrentLimit}
                onChange={(e) => onUpdateSettings({ concurrentLimit: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold"
              >
                <option value={1}>1 Task at a time</option>
                <option value={2}>2 Tasks simultaneously</option>
                <option value={3}>3 Tasks (Recommended)</option>
                <option value={5}>5 Maximum Tasks</option>
              </select>
            </div>
          </div>
        </div>

        {/* 4. LANGUAGE & AUTO UPDATE */}
        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Localization & Software Updates
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
                UI Language
              </label>
              <select
                value={settings.language}
                onChange={(e) => onUpdateSettings({ language: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold"
              >
                <option value="English">English (United States)</option>
                <option value="Spanish">Español (Spanish)</option>
                <option value="French">Français (French)</option>
                <option value="German">Deutsch (German)</option>
                <option value="Japanese">日本語 (Japanese)</option>
                <option value="Hindi">हिन्दी (Hindi)</option>
                <option value="Portuguese">Português (Portuguese)</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleCheckUpdate}
                disabled={isCheckingUpdate}
                className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs transition-colors"
              >
                <RotateCw className={`w-4 h-4 text-indigo-500 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
                <span>{isCheckingUpdate ? 'Checking for updates...' : 'Check Software Update'}</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
