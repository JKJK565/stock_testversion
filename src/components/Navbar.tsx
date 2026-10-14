import React, { useState } from 'react';
import {
  Zap,
  TrendingUp,
  BarChart2,
  PieChart,
  ShieldAlert,
  Activity,
  Bell,
  Volume2,
  VolumeX,
  Search,
  Target,
  SlidersHorizontal,
  Wallet,
  Layers,
  RefreshCw,
} from 'lucide-react';

import { MarketIndexData, searchStocksApi } from '../services/stockApi';
import { PWAInstallButton } from './PWAInstallButton';
import { getTaipeiMarketSession } from '../utils/marketTime';

export type MainTab =
  | 'radar'
  | 'portfolio'
  | 'sectors'
  | 'screener'
  | 'chips'
  | 'chart'
  | 'watchlist'
  | 'paper'
  | 'alerts';

interface NavbarProps {
  activeTab?: MainTab;
  onSelectTab?: (tab: MainTab) => void;
  colorMode: 'tw' | 'intl';
  onToggleColorMode: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  isSimulating: boolean;
  onToggleSimulation: () => void;
  unreadCount: number;
  onOpenNotifications: () => void;
  marketIndex?: MarketIndexData | null;
  tsmcPrice?: number;
  tsmcChange?: number;
  onRefreshLive?: () => void;
  isLiveLoading?: boolean;
  onQuickSearchStock?: (symbol: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  colorMode,
  onToggleColorMode,
  soundEnabled,
  onToggleSound,
  isSimulating,
  onToggleSimulation,
  unreadCount,
  onOpenNotifications,
  marketIndex,
  tsmcPrice = 2565,
  tsmcChange = -20,
  onRefreshLive,
  isLiveLoading,
  onQuickSearchStock,
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const POPULAR_STOCKS = [
    { symbol: '8086', name: '宏捷科', tag: '砷化鎵PA代工' },
    { symbol: '2330', name: '台積電', tag: '晶圓代工' },
    { symbol: '2454', name: '聯發科', tag: 'AI旗艦晶片' },
    { symbol: '2317', name: '鴻海', tag: 'AI伺服器' },
    { symbol: '3105', name: '穩懋', tag: '砷化鎵晶圓' },
    { symbol: '2455', name: '全新', tag: '砷化鎵磊晶' },
    { symbol: '6488', name: '環球晶', tag: '矽晶圓龍頭' },
    { symbol: '8299', name: '群聯', tag: 'NAND控制IC' },
    { symbol: '2303', name: '聯電', tag: '成熟製程' },
    { symbol: '2382', name: '廣達', tag: 'AI雲端整機' },
    { symbol: '3017', name: '奇鋐', tag: '水冷散熱' },
    { symbol: '3324', name: '雙鴻', tag: '液冷散熱' },
    { symbol: '3037', name: '欣興', tag: 'ABF載板' },
    { symbol: '3443', name: '創意', tag: 'AI ASIC' },
    { symbol: '3661', name: '世芯-KY', tag: '3nm ASIC' },
    { symbol: '2356', name: '英業達', tag: 'AI伺服器代工' },
    { symbol: '2353', name: '宏碁', tag: 'AI PC筆電' },
    { symbol: '2324', name: '仁寶', tag: '筆電代工' },
    { symbol: '2354', name: '鴻準', tag: '機殼散熱' },
    { symbol: '2412', name: '中華電', tag: '電信龍頭' },
    { symbol: '3450', name: '聯鈞', tag: 'CPO矽光子' },
    { symbol: '6442', name: '光聖', tag: '光通訊' },
    { symbol: '3081', name: '聯亞', tag: '矽光子雷射' },
    { symbol: '3711', name: '日月光投控', tag: '先進封測' },
    { symbol: '2449', name: '京元電子', tag: '半導體測試' },
    { symbol: '1519', name: '華城', tag: '重電變壓器' },
    { symbol: '1503', name: '士電', tag: '電網重電' },
    { symbol: '2603', name: '長榮', tag: '遠洋貨櫃' },
    { symbol: '2609', name: '陽明', tag: 'SCFI航運' },
    { symbol: '2615', name: '萬海', tag: '近遠洋航運' },
    { symbol: '2881', name: '富邦金', tag: '獲利王金控' },
    { symbol: '2882', name: '國泰金', tag: '壽險金控' },
    { symbol: '2891', name: '中信金', tag: '銀行金控' },
    { symbol: '0050', name: '元大台灣50', tag: '市值型龍頭' },
    { symbol: '00878', name: '國泰永續高股息', tag: '人氣高股息' },
    { symbol: '00919', name: '群益台灣精選高息', tag: '高配息ETF' },
  ];

  const [apiSuggestions, setApiSuggestions] = useState<Array<{ symbol: string; name: string; tag: string }>>([]);

  React.useEffect(() => {
    const q = searchInput.trim();
    if (!q) {
      setApiSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const results = await searchStocksApi(q);
        if (Array.isArray(results) && results.length > 0) {
          setApiSuggestions(
            results.map((r: any) => ({
              symbol: r.symbol,
              name: r.name,
              tag: r.industry || (r.market === '上櫃' ? '上櫃標的' : '上市標的'),
            }))
          );
        }
      } catch (e) {}
    }, 120);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const filteredSuggestions = React.useMemo(() => {
    const q = searchInput.trim().toLowerCase();
    if (!q) {
      return POPULAR_STOCKS.slice(0, 8);
    }
    const localMatches = POPULAR_STOCKS.filter(
      (s) =>
        s.symbol.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.tag.toLowerCase().includes(q)
    );
    // Combine with API suggestions avoiding duplicates
    const combined = [...localMatches];
    apiSuggestions.forEach((apiItem) => {
      if (!combined.some((c) => c.symbol === apiItem.symbol)) {
        combined.push(apiItem);
      }
    });
    return combined.slice(0, 10);
  }, [searchInput, apiSuggestions]);

  const isRedUp = colorMode === 'tw';
  const upColor = isRedUp ? '#ef4444' : '#10b981';
  const downColor = isRedUp ? '#10b981' : '#ef4444';

  const marketSession = getTaipeiMarketSession();

  const taiexPrice = marketIndex?.price ?? 48341.96;
  const taiexChange = marketIndex?.change ?? -960;
  const taiexPct = marketIndex?.changePercent ?? -1.95;
  const taiexTurnover = marketIndex?.turnoverEst ?? 11250;

  const isNight = Boolean(
    marketIndex?.isNightSession || marketIndex?.txf?.isNightSession || marketSession.isNightFutures
  );
  const txfPrice = marketIndex?.txf?.price ?? 48400;
  const txfChange = marketIndex?.txf?.change ?? -945;
  const txfPct = marketIndex?.txf?.changePercent ?? -1.91;
  const txfNightChange = marketIndex?.txf?.nightChange;
  const txfNightPct = marketIndex?.txf?.nightChangePercent;

  const otcPrice = marketIndex?.otc?.price ?? 414.31;
  const otcChange = marketIndex?.otc?.change ?? -13.59;
  const otcPct = marketIndex?.otc?.changePercent ?? -3.18;

  const handleSearchSubmit = (e?: React.FormEvent, customSymbol?: string) => {
    if (e) e.preventDefault();
    const query = customSymbol || searchInput;
    if (!query.trim()) return;
    if (onQuickSearchStock) {
      onQuickSearchStock(query.trim());
      setSearchInput('');
      setIsDropdownOpen(false);
      setIsMobileSearchOpen(false);
    }
  };

  return (
    <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-40">
      {/* Top Ticker Bar */}
      <div className="px-4 py-1.5 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between text-xs font-mono overflow-x-auto gap-4">
        {/* Index ticks */}
        <div className="flex items-center gap-4 sm:gap-5 shrink-0">
          {/* TAIEX 加權指數 */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-sans font-semibold text-[11px]">加權指數</span>
            <span className="font-bold text-white">{taiexPrice.toLocaleString()}</span>
            <span className="font-semibold" style={{ color: taiexChange >= 0 ? upColor : downColor }}>
              {taiexChange >= 0 ? '+' : ''}{Math.abs(taiexChange) % 1 === 0 ? taiexChange : taiexChange.toFixed(2)} ({taiexPct >= 0 ? '+' : ''}{taiexPct.toFixed(2)}%)
            </span>
            <span
              className="text-amber-300 font-mono text-[10px] bg-slate-800/90 px-1.5 py-0.5 rounded border border-slate-700/60 hidden md:inline-block"
              title="大盤最新總成交金額 (億元)"
            >
              {taiexTurnover.toLocaleString()} 億
            </span>
          </div>

          {/* TXF 台指近全 / 夜盤 */}
          <div className="flex items-center gap-1.5 bg-slate-950/70 border border-indigo-900/60 px-2 py-0.5 rounded">
            <span className="text-indigo-300 font-sans font-semibold text-[11px] flex items-center gap-1">
              {isNight && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>}
              {isNight ? '🌙 台指夜盤' : '台指期'}
            </span>
            <span className="font-bold text-white">{txfPrice.toLocaleString()}</span>
            {isNight && txfNightChange !== undefined ? (
              <span
                className="font-semibold"
                style={{ color: txfNightChange >= 0 ? upColor : downColor }}
                title={`夜盤漲跌: ${txfNightChange >= 0 ? '+' : ''}${txfNightChange} (${txfNightPct !== undefined && txfNightPct >= 0 ? '+' : ''}${txfNightPct}%) · 全天累計: ${txfChange >= 0 ? '+' : ''}${txfChange} (${txfPct >= 0 ? '+' : ''}${txfPct.toFixed(2)}%)`}
              >
                {txfNightChange >= 0 ? '+' : ''}{txfNightChange} ({txfNightPct !== undefined && txfNightPct >= 0 ? '+' : ''}{txfNightPct}%)
              </span>
            ) : (
              <span className="font-semibold" style={{ color: txfChange >= 0 ? upColor : downColor }}>
                {txfChange >= 0 ? '+' : ''}{txfChange} ({txfPct >= 0 ? '+' : ''}{txfPct.toFixed(2)}%)
              </span>
            )}
          </div>

          {/* OTC 櫃買指數 */}
          <div className="hidden md:flex items-center gap-1.5">
            <span className="text-sky-300 font-sans font-semibold text-[11px]">櫃買</span>
            <span className="font-bold text-white">{otcPrice.toFixed(2)}</span>
            <span className="font-semibold" style={{ color: otcChange >= 0 ? upColor : downColor }}>
              {otcChange >= 0 ? '+' : ''}{otcChange.toFixed(2)} ({otcPct >= 0 ? '+' : ''}{otcPct.toFixed(2)}%)
            </span>
          </div>

          {/* 2330 台積電 */}
          <div className="hidden lg:flex items-center gap-1.5">
            <span className="text-slate-400 font-sans font-semibold text-[11px]">台積電</span>
            <span className="font-bold text-white">{tsmcPrice.toFixed(1)}</span>
            <span className="font-semibold" style={{ color: tsmcChange >= 0 ? upColor : downColor }}>
              {tsmcChange >= 0 ? '+' : ''}{tsmcChange.toFixed(1)}
            </span>
          </div>

          <div
            className={`flex items-center gap-1.5 text-[11px] font-sans border px-2.5 py-0.5 rounded transition-colors ${marketSession.badgeClass}`}
            title={`台北時間 ${marketSession.taipeiTimeStr} · ${marketSession.statusLabel}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${marketSession.dotClass}`}></span>
            <span>{marketSession.statusLabel}</span>
          </div>
        </div>

        {/* Real-time Status & Utilities */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 text-slate-400 text-xs">
          {/* Quick Refresh Button */}
          {onRefreshLive && (
            <button
              onClick={onRefreshLive}
              disabled={isLiveLoading}
              className="flex items-center gap-1 hover:text-white transition-colors text-[11px] font-sans px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60 disabled:opacity-50"
              title="即時同步台指夜盤與大盤最新報價"
            >
              <RefreshCw className={`w-3 h-3 text-indigo-400 ${isLiveLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isLiveLoading ? '更新中' : '即時刷新'}</span>
            </button>
          )}

          {/* PWA Mobile Install Button */}
          <PWAInstallButton variant="badge" />

          {/* Color Mode Toggle */}
          <button
            onClick={onToggleColorMode}
            className="hover:text-white transition-colors text-[11px] font-sans px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60 hidden sm:inline-block"
            title="切換顏色慣例"
          >
            {colorMode === 'tw' ? '台股慣例 (紅漲綠跌)' : '國際慣例 (綠漲紅跌)'}
          </button>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            className="p-1 hover:text-white transition-colors"
            title={soundEnabled ? '音效開啟' : '音效已靜音'}
          >
            {soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-slate-500" />
            )}
          </button>

          {/* Notification Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-1 hover:text-white transition-colors"
            title="通知中心"
          >
            <Bell className="w-4 h-4 text-slate-300" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Nav Bar */}
      <div className="px-4 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Brand & Quick Search Bar */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-rose-600 flex items-center justify-center text-white shadow-md">
              <Zap className="w-4 h-4 fill-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                台股雷達 Pro
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-normal">
                  DNAI
                </span>
              </h1>
              <p className="text-[11px] text-slate-400">趨勢投資人 · 智能選股決策 · 原物料新聞</p>
            </div>
          </div>

          {/* Quick Search Input with Dropdown */}
          <div className="relative max-w-xs w-full hidden sm:block">
            <form onSubmit={handleSearchSubmit}>
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchInput}
                onFocus={() => setIsDropdownOpen(true)}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setIsDropdownOpen(true);
                }}
                placeholder="查台股代號/名稱 (如 2303, 聯電, 2603)..."
                className="w-full pl-8 pr-16 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 text-[10px] font-bold text-white transition-colors"
              >
                查詢
              </button>
            </form>

            {/* Dropdown Suggestions */}
            {isDropdownOpen && (
              <div
                className="absolute left-0 right-0 top-full mt-1.5 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl z-50 p-2 max-h-72 overflow-y-auto animate-in fade-in duration-150"
                onMouseLeave={() => setIsDropdownOpen(false)}
              >
                <div className="flex items-center justify-between text-[11px] text-slate-400 px-2 py-1 font-semibold border-b border-slate-800">
                  <span>熱門標的快速選取</span>
                  <span className="text-[10px] text-slate-500">輸入代號或名稱可直搜</span>
                </div>
                <div className="space-y-1 mt-1">
                  {filteredSuggestions.map((stk) => (
                    <button
                      key={stk.symbol}
                      type="button"
                      onClick={() => handleSearchSubmit(undefined, stk.symbol)}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-800 text-left transition-colors text-xs group"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white group-hover:text-indigo-400">{stk.name}</span>
                        <span className="font-mono text-slate-400 text-[11px]">{stk.symbol}</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/80 font-mono">
                        {stk.tag}
                      </span>
                    </button>
                  ))}
                  {filteredSuggestions.length === 0 && searchInput && (
                    <button
                      type="button"
                      onClick={() => handleSearchSubmit()}
                      className="w-full p-2.5 rounded-lg bg-indigo-950/70 text-indigo-300 hover:bg-indigo-900 text-center text-xs font-semibold"
                    >
                      直接查詢代號/名稱：「{searchInput}」
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Mobile Search Button */}
          <button
            onClick={() => setIsMobileSearchOpen(true)}
            className="sm:hidden px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white flex items-center gap-1.5 text-xs"
          >
            <Search className="w-3.5 h-3.5 text-indigo-400" />
            <span>查個股</span>
          </button>
        </div>

        {/* Mobile Search Overlay Modal */}
        {isMobileSearchOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center p-4 pt-16">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-4 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-indigo-400" />
                  <h3 className="font-bold text-white text-sm">個股即時查詢與產業雷達</h3>
                </div>
                <button
                  onClick={() => setIsMobileSearchOpen(false)}
                  className="text-slate-400 hover:text-white text-sm p-1"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  autoFocus
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="輸入股票代號 (如 2330, 2303, 2603)..."
                  className="w-full pl-3 pr-16 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white"
                >
                  搜尋
                </button>
              </form>

              <div>
                <span className="text-[11px] font-semibold text-slate-400 block mb-2">熱門追蹤個股：</span>
                <div className="grid grid-cols-2 gap-1.5 max-h-60 overflow-y-auto">
                  {POPULAR_STOCKS.map((stk) => (
                    <button
                      key={stk.symbol}
                      onClick={() => handleSearchSubmit(undefined, stk.symbol)}
                      className="p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-indigo-500 text-left text-xs flex items-center justify-between"
                    >
                      <span className="text-white font-medium">{stk.name}</span>
                      <span className="text-slate-400 font-mono text-[11px]">{stk.symbol}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
