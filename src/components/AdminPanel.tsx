import React, { useState, useEffect } from 'react';
import { AdminStats, PlatformType } from '../types';
import { formatBytes } from '../utils/mediaUtils';
import { 
  BarChart3, 
  Activity, 
  Download, 
  HardDrive, 
  Users, 
  Zap, 
  Cpu, 
  Database, 
  AlertTriangle, 
  Trash2, 
  RefreshCw,
  CheckCircle2,
  Server
} from 'lucide-react';
import { motion } from 'motion/react';

interface AdminPanelProps {
  onToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onToast }) => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      setStats(data);
    } catch (err: any) {
      onToast('error', 'Admin API Error', 'Failed to fetch server statistics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const handleClearLogs = async () => {
    try {
      const res = await fetch('/api/admin/logs', { method: 'DELETE' });
      if (res.ok) {
        onToast('success', 'Logs Cleared', 'Error logs have been wiped from memory.');
        fetchStats();
      }
    } catch {
      onToast('error', 'Error', 'Failed to clear error logs.');
    }
  };

  if (isLoading && !stats) {
    return (
      <div className="w-full max-w-5xl mx-auto py-20 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
          Connecting to MediaHub Express Server Analytics...
        </p>
      </div>
    );
  }

  if (!stats) return null;

  const platformPairs = Object.entries(stats.platformBreakdown || {}) as Array<[PlatformType, number]>;
  const maxPlatformCount = Math.max(...platformPairs.map(([, c]) => c), 1);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
      
      {/* Top Banner & Refresh Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl backdrop-blur-xl">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              System Admin & Analytics Dashboard
            </h2>
            <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-1" />
              Live Telemetry
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time monitoring for bandwidth, API rate limiting, platform distribution, and server health.
          </p>
        </div>

        <button
          onClick={fetchStats}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors shrink-0"
        >
          <RefreshCw className="w-4 h-4 text-indigo-500" />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Downloads */}
        <div className="p-5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Downloads
            </span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Download className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-3">
            {stats.totalDownloads.toLocaleString()}
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
            +14% from last hour
          </p>
        </div>

        {/* Total Bandwidth */}
        <div className="p-5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Bandwidth Served
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <HardDrive className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-3">
            {formatBytes(stats.totalBandwidthBytes)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Ultra fast direct streaming
          </p>
        </div>

        {/* Active Users */}
        <div className="p-5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Active Sessions
            </span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-3">
            {stats.activeUsers} Users
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
            100% Rate Limit Safe
          </p>
        </div>

        {/* Average Speed */}
        <div className="p-5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Avg Speed
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-3">
            {stats.averageSpeedMbps} MB/s
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            CDN Edge Acceleration
          </p>
        </div>

      </div>

      {/* Platform Distribution & Server Health Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Platform Breakdown Chart */}
        <div className="lg:col-span-7 bg-white/90 dark:bg-slate-900/90 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-indigo-500" />
              <span>Downloads by Social Platform</span>
            </h3>
            <span className="text-xs text-slate-400">Lifetime Share</span>
          </div>

          <div className="space-y-3">
            {platformPairs.map(([platform, count]) => {
              const pct = Math.round((count / maxPlatformCount) * 100);
              return (
                <div key={platform} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="capitalize text-slate-700 dark:text-slate-300">{platform}</span>
                    <span className="text-slate-500 font-mono">{count} downloads</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Server Health Gauges */}
        <div className="lg:col-span-5 bg-white/90 dark:bg-slate-900/90 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
              <Server className="w-4 h-4 text-emerald-500" />
              <span>Node Express Server Health</span>
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 uppercase">
              {stats.serverHealth.status}
            </span>
          </div>

          <div className="space-y-4">
            {/* CPU */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5" /> CPU Load
                </span>
                <span className="font-mono text-slate-900 dark:text-white">{stats.serverHealth.cpuUsagePct}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-500 h-full transition-all duration-300"
                  style={{ width: `${stats.serverHealth.cpuUsagePct}%` }}
                />
              </div>
            </div>

            {/* RAM */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  <Database className="w-3.5 h-3.5" /> RAM Memory
                </span>
                <span className="font-mono text-slate-900 dark:text-white">{stats.serverHealth.memoryUsagePct}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-purple-500 h-full transition-all duration-300"
                  style={{ width: `${stats.serverHealth.memoryUsagePct}%` }}
                />
              </div>
            </div>

            {/* Latency & Uptime */}
            <div className="pt-2 grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-center">
                <div className="text-slate-400 text-[10px] uppercase font-bold">API Latency</div>
                <div className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                  {stats.serverHealth.apiLatencyMs} ms
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-center">
                <div className="text-slate-400 text-[10px] uppercase font-bold">Server Uptime</div>
                <div className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                  {Math.floor(stats.serverHealth.uptimeSeconds / 60)} mins
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Error Logs Table */}
      <div className="bg-white/90 dark:bg-slate-900/90 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              System Error Logs ({stats.recentErrors.length})
            </h3>
          </div>

          {stats.recentErrors.length > 0 && (
            <button
              onClick={handleClearLogs}
              className="flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Error Logs</span>
            </button>
          )}
        </div>

        {stats.recentErrors.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
            <span>No errors logged. All system API endpoints operating smoothly!</span>
          </div>
        ) : (
          <div className="space-y-2 overflow-x-auto">
            {stats.recentErrors.map((err) => (
              <div
                key={err.id}
                className="p-3 rounded-xl bg-red-500/5 border border-red-500/20 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <div className="font-semibold text-red-600 dark:text-red-400">{err.error}</div>
                  <div className="text-slate-400 text-[11px] truncate mt-0.5">{err.url}</div>
                </div>
                <div className="text-right text-[11px] text-slate-400 font-mono shrink-0">
                  {new Date(err.time).toLocaleTimeString()} • IP: {err.ip}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
