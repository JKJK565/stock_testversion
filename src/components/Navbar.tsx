import React from 'react';
import {
  Activity,
  BarChart3,
  Target,
  Briefcase,
  Search,
  Bell,
} from 'lucide-react';

interface NavbarProps {
  activeModule: 'market' | 'screener' | 'watchlist';
  setActiveModule: (m: 'market' | 'screener' | 'watchlist') => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  unreadAlertCount: number;
  screenerMatchedCount: number;
  watchlistCount: number;
  alertWatchlistCount: number;
  onToggleNotificationCenter: () => void;
  isNotificationCenterOpen: boolean;
  onOpenStrategyAudit?: (symbol: string) => void;
}

export function Navbar({
  activeModule,
  setActiveModule,
  searchQuery,
  setSearchQuery,
  unreadAlertCount,
  screenerMatchedCount,
  watchlistCount,
  alertWatchlistCount,
  onToggleNotificationCenter,
  isNotificationCenterOpen,
  onOpenStrategyAudit,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-xl">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5">
        {/* Main Nav Row */}
        <div className="flex items-center justify-between gap-2 sm:gap-4 flex-wrap sm:flex-nowrap">
          {/* Logo Brand */}
          <div
            onClick={() => setActiveModule('market')}
            className="flex items-center gap-2.5 cursor-pointer group select-none flex-shrink-0"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-amber-500 to-indigo-600 flex items-center justify-center shadow-md shadow-rose-900/30 group-hover:scale-105 transition-transform">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-black tracking-tight text-white group-hover:text-rose-400 transition-colors whitespace-nowrap">
                  台股量化波段雷達
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-bold flex-shrink-0">
                  v2.6.3
                </span>
                <span className="hidden xl:inline-block text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 font-semibold whitespace-nowrap">
                  全市場投信連買 × 價值轉型
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden md:block">
                大盤總覽 × 每日深度早報 × 投信連買掃描 × 自選健康警報
              </p>
            </div>
          </div>

          {/* Module Switcher Tabs - Guaranteed ample width, never wrapped */}
          <div className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700/80 shadow-inner overflow-x-auto flex-shrink-0">
            <button
              onClick={() => setActiveModule('market')}
              className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeModule === 'market'
                  ? 'bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4 flex-shrink-0" />
              <span>大盤總覽</span>
            </button>

            <button
              onClick={() => setActiveModule('screener')}
              className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeModule === 'screener'
                  ? 'bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Target className="w-4 h-4 flex-shrink-0" />
              <span>波段篩選器</span>
              {screenerMatchedCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[11px] font-bold font-mono">
                  {screenerMatchedCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveModule('watchlist')}
              className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap relative cursor-pointer ${
                activeModule === 'watchlist'
                  ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Briefcase className="w-4 h-4 flex-shrink-0" />
              <span>自選清單</span>
              {watchlistCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-slate-700 text-slate-200 text-[11px] font-mono">
                  {watchlistCount}
                </span>
              )}
              {alertWatchlistCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[11px] font-bold animate-pulse">
                  🚨 {alertWatchlistCount}
                </span>
              )}
            </button>
          </div>

          {/* Right Actions: 個股健檢 Shortcut Button & Notification Center Bell */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* 🔍 個股健檢快捷按鈕 (桌機圖示+文字，手機只顯示放大鏡圖示) */}
            <button
              onClick={() => onOpenStrategyAudit?.('')}
              className="px-2.5 sm:px-3.5 py-2 rounded-xl bg-indigo-600/25 hover:bg-indigo-600 border border-indigo-500/40 text-indigo-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
              title="輸入台股 4 碼代號開啟雙策略量化健檢"
            >
              <Search className="w-4 h-4 text-indigo-400 group-hover:text-white flex-shrink-0" />
              <span className="hidden sm:inline">個股健檢</span>
            </button>

            {/* Notification Bell */}
            <button
              onClick={onToggleNotificationCenter}
              className={`relative p-2 sm:p-2.5 rounded-xl border transition-all cursor-pointer ${
                isNotificationCenterOpen
                  ? 'bg-rose-600/20 border-rose-500 text-rose-300'
                  : unreadAlertCount > 0
                  ? 'bg-slate-800 border-rose-500/40 text-slate-200 hover:border-rose-400'
                  : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
              }`}
              title="通知中心 (波段健康警報與早報)"
            >
              <Bell className={`w-5 h-5 ${unreadAlertCount > 0 ? 'text-rose-400' : ''}`} />
              {unreadAlertCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-600 text-white text-[10px] font-bold shadow-sm animate-bounce">
                  {unreadAlertCount > 99 ? '99+' : unreadAlertCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
