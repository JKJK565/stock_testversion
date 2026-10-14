import React from 'react';
import { MainTab } from './Navbar';
import {
  Zap,
  Layers,
  Target,
  PieChart,
  BarChart2,
  TrendingUp,
  Wallet,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';

interface BottomNavProps {
  activeTab: MainTab;
  onSelectTab: (tab: MainTab) => void;
  unreadCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  unreadCount = 0,
}) => {
  const tabs = [
    {
      id: 'radar' as MainTab,
      label: '首頁雷達',
      icon: Zap,
    },
    {
      id: 'portfolio' as MainTab,
      label: '波段投組',
      icon: Sparkles,
      badge: '10檔',
    },
    {
      id: 'screener' as MainTab,
      label: '選股決策',
      icon: Target,
    },
    {
      id: 'sectors' as MainTab,
      label: '題材排行',
      icon: Layers,
    },
    {
      id: 'chips' as MainTab,
      label: '籌碼追蹤',
      icon: PieChart,
    },
    {
      id: 'chart' as MainTab,
      label: '技術型態',
      icon: BarChart2,
    },
    {
      id: 'watchlist' as MainTab,
      label: '自選股',
      icon: TrendingUp,
    },
    {
      id: 'paper' as MainTab,
      label: '模擬下單',
      icon: Wallet,
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/90 shadow-[0_-8px_30px_rgba(0,0,0,0.5)]">
      <div className="max-w-7xl mx-auto px-2 sm:px-4">
        <nav className="flex items-center justify-around py-1.5 gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`relative flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all duration-150 group ${
                  isActive
                    ? 'text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200 font-medium'
                }`}
              >
                {/* Active indicator glowing pill */}
                {isActive && (
                  <span className="absolute -top-1.5 w-6 h-1 bg-gradient-to-r from-indigo-500 to-rose-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                )}

                <div
                  className={`relative p-1 rounded-lg transition-transform ${
                    isActive
                      ? 'bg-gradient-to-tr from-indigo-600/30 to-rose-600/30 text-rose-400 scale-105'
                      : 'group-hover:bg-slate-900 text-slate-400 group-hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5 sm:w-5 sm:h-5" />
                  {tab.badge && !isActive && (
                    <span className="absolute -top-1 -right-1.5 text-[8px] font-mono font-bold bg-rose-600 text-white px-1 py-0.2 rounded-full scale-90">
                      {tab.badge}
                    </span>
                  )}
                </div>

                <span
                  className={`text-[10px] sm:text-[11px] mt-0.5 tracking-tight transition-colors ${
                    isActive ? 'text-white font-bold' : 'text-slate-400'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
