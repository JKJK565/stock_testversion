import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  MarketOverviewResponse,
  ScreenerResponse,
  ScreenerStockItem,
  TurnaroundScreenerResponse,
  TurnaroundStockItem,
  MorningBriefingResponse,
  PortfolioStockItem,
} from './types/stock';
import {
  fetchMarketOverview,
  fetchMorningBriefing,
  fetchScreenerData,
  refreshScreenerData,
  fetchTurnaroundScreenerData,
  refreshTurnaroundScreenerData,
} from './services/stockApi';
import {
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  ShieldCheck,
  Briefcase,
  Search,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  Activity,
  FileText,
  SunMedium,
  Check,
  Percent,
  SlidersHorizontal,
  Flame,
  Layers,
  Compass,
  Cpu,
  Globe2,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

/**
 * 輕量優雅的 Markdown 渲染組件 (支援標題、重點、粗體、清單、分隔線)
 */
function MarkdownRenderer({ content }: { content: string }) {
  const sections = useMemo(() => {
    return content.split('\n');
  }, [content]);

  return (
    <div className="space-y-2 text-slate-200 text-sm leading-relaxed">
      {sections.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }

        // H1 Title
        if (trimmed.startsWith('# ')) {
          return (
            <h2 key={idx} className="text-xl font-black text-white pt-2 pb-1 border-b border-slate-800 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <span>{trimmed.replace(/^#\s+/, '')}</span>
            </h2>
          );
        }

        // H3 Subheaders (A. B. C. D. E.)
        if (trimmed.startsWith('### ')) {
          return (
            <div key={idx} className="pt-3 pb-1">
              <h3 className="text-base font-bold text-rose-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>{trimmed.replace(/^###\s+/, '')}</span>
              </h3>
            </div>
          );
        }

        // Horizontal line
        if (trimmed === '---') {
          return <hr key={idx} className="border-slate-800/80 my-3" />;
        }

        // Unordered list
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const listText = trimmed.replace(/^[-*]\s+/, '');
          return (
            <div key={idx} className="flex items-start gap-2.5 ml-2 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 flex-shrink-0" />
              <div
                className="text-slate-300 text-xs sm:text-sm"
                dangerouslySetInnerHTML={{
                  __html: listText
                    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em class="text-amber-300">$1</em>'),
                }}
              />
            </div>
          );
        }

        // Regular paragraph with bold support
        return (
          <p
            key={idx}
            className="text-slate-300 text-xs sm:text-sm leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: trimmed
                .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
                .replace(/\*(.*?)\*/g, '<em class="text-amber-300">$1</em>'),
            }}
          />
        );
      })}
    </div>
  );
}

export default function App() {
  // Navigation tabs between the two core modules
  const [activeModule, setActiveModule] = useState<'market' | 'screener'>('market');

  // Screener Strategy Mode: 強勢動能突破 vs 低基期價值轉型
  const [strategyMode, setStrategyMode] = useState<'momentum' | 'turnaround'>('momentum');

  // Screener sub-view filter
  const [screenerTab, setScreenerTab] = useState<'matched' | 'all' | 'portfolio'>('matched');
  const [searchQuery, setSearchQuery] = useState('');

  // Data states
  const [marketData, setMarketData] = useState<MarketOverviewResponse | null>(null);
  const [morningBriefing, setMorningBriefing] = useState<MorningBriefingResponse | null>(null);
  const [screenerData, setScreenerData] = useState<ScreenerResponse | null>(null);
  const [turnaroundData, setTurnaroundData] = useState<TurnaroundScreenerResponse | null>(null);

  // Loading states
  const [isMarketLoading, setIsMarketLoading] = useState(true);
  const [isBriefingLoading, setIsBriefingLoading] = useState(true);
  const [isBriefingRefreshing, setIsBriefingRefreshing] = useState(false);
  const [isScreenerLoading, setIsScreenerLoading] = useState(true);
  const [isTurnaroundLoading, setIsTurnaroundLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Markdown Briefing Expansion state
  const [isBriefingExpanded, setIsBriefingExpanded] = useState(true);

  // Portfolio stored in localStorage
  const [portfolio, setPortfolio] = useState<PortfolioStockItem[]>(() => {
    try {
      const saved = localStorage.getItem('tw_swing_portfolio');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load portfolio from localStorage:', e);
    }
    return [];
  });

  // Save portfolio to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('tw_swing_portfolio', JSON.stringify(portfolio));
    } catch (e) {
      console.error('Failed to save portfolio to localStorage:', e);
    }
  }, [portfolio]);

  // Load Market Data (cached 15s on server)
  const loadMarket = useCallback(async () => {
    try {
      const data = await fetchMarketOverview();
      if (data) {
        setMarketData(data);
      }
    } catch (e: any) {
      console.error('Error loading market:', e);
    } finally {
      setIsMarketLoading(false);
    }
  }, []);

  // Load Gemini Morning Briefing (cached 30m on server)
  const loadBriefing = useCallback(async (force = false) => {
    if (force) setIsBriefingRefreshing(true);
    else setIsBriefingLoading(true);

    try {
      const data = await fetchMorningBriefing(force);
      if (data) {
        setMorningBriefing(data);
      }
    } catch (e: any) {
      console.error('Error loading briefing:', e);
    } finally {
      setIsBriefingLoading(false);
      setIsBriefingRefreshing(false);
    }
  }, []);

  // Load Momentum Screener Data (cached 30m on server)
  const loadScreener = useCallback(async (force = false) => {
    try {
      const data = await fetchScreenerData(force);
      if (data) {
        setScreenerData(data);
      }
    } catch (e: any) {
      console.error('Error loading screener:', e);
    } finally {
      setIsScreenerLoading(false);
    }
  }, []);

  // Load Turnaround Value Screener Data (cached 30m on server)
  const loadTurnaround = useCallback(async (force = false) => {
    try {
      const data = await fetchTurnaroundScreenerData(force);
      if (data) {
        setTurnaroundData(data);
      }
    } catch (e: any) {
      console.error('Error loading turnaround screener:', e);
    } finally {
      setIsTurnaroundLoading(false);
    }
  }, []);

  // Initial load once on mount
  useEffect(() => {
    loadMarket();
    loadBriefing();
    loadScreener();
    loadTurnaround();
  }, [loadMarket, loadBriefing, loadScreener, loadTurnaround]);

  // Force Refresh Screener Handler
  const handleForceRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setErrorMessage(null);

    if (strategyMode === 'momentum') {
      const result = await refreshScreenerData();
      if (result.success && result.data) {
        setScreenerData(result.data);
      } else {
        setErrorMessage(result.message || '更新失敗，請稍候重試');
        setTimeout(() => setErrorMessage(null), 6000);
      }
    } else {
      const result = await refreshTurnaroundScreenerData();
      if (result.success && result.data) {
        setTurnaroundData(result.data);
      } else {
        setErrorMessage(result.message || '更新失敗，請稍候重試');
        setTimeout(() => setErrorMessage(null), 6000);
      }
    }

    setIsRefreshing(false);
  };

  // Add / Remove from Portfolio (Momentum)
  const handleToggleMomentumPortfolio = (stock: ScreenerStockItem) => {
    setPortfolio((prev) => {
      const exists = prev.some((p) => p.symbol === stock.symbol);
      if (exists) {
        return prev.filter((p) => p.symbol !== stock.symbol);
      } else {
        const newItem: PortfolioStockItem = {
          id: `${stock.symbol}-${Date.now()}`,
          symbol: stock.symbol,
          name: stock.name,
          entryPrice: stock.suggestedEntryPrice || stock.price,
          sharesLots: 1, // 預設 1 張
          stopLossPrice: stock.stopLossPrice,
          targetPrice: stock.targetPrice,
          entryDate: new Date().toISOString().split('T')[0],
          notes: `【強勢動能】${stock.actionNote}`,
          strategyType: 'momentum',
        };
        return [newItem, ...prev];
      }
    });
  };

  // Add / Remove from Portfolio (Turnaround)
  const handleToggleTurnaroundPortfolio = (stock: TurnaroundStockItem) => {
    setPortfolio((prev) => {
      const exists = prev.some((p) => p.symbol === stock.symbol);
      if (exists) {
        return prev.filter((p) => p.symbol !== stock.symbol);
      } else {
        const targetPrice = Number((stock.price * 1.35).toFixed(1)); // 35% 轉型爆發目標
        const newItem: PortfolioStockItem = {
          id: `${stock.symbol}-${Date.now()}`,
          symbol: stock.symbol,
          name: stock.name,
          entryPrice: stock.price,
          sharesLots: 1,
          stopLossPrice: stock.stopLossPrice,
          targetPrice,
          entryDate: new Date().toISOString().split('T')[0],
          notes: `【價值轉型】${stock.positionLabel}，${stock.catalyst}`,
          strategyType: 'turnaround',
        };
        return [newItem, ...prev];
      }
    });
  };

  const handleUpdatePortfolioItem = (id: string, updates: Partial<PortfolioStockItem>) => {
    setPortfolio((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const handleRemovePortfolioItem = (id: string) => {
    setPortfolio((prev) => prev.filter((item) => item.id !== id));
  };

  // Filtered Momentum stocks
  const displayedMomentumStocks = useMemo(() => {
    if (!screenerData) return [];
    let list = screenerTab === 'matched' ? screenerData.screenerList : screenerData.allStocks;

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (s) =>
          s.symbol.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          s.industry.toLowerCase().includes(q)
      );
    }
    return list;
  }, [screenerData, screenerTab, searchQuery]);

  // Filtered Turnaround stocks
  const displayedTurnaroundStocks = useMemo(() => {
    if (!turnaroundData) return [];
    let list = screenerTab === 'matched' ? turnaroundData.screenerList : turnaroundData.allStocks;

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (s) =>
          s.symbol.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          s.industry.toLowerCase().includes(q) ||
          s.catalyst.toLowerCase().includes(q)
      );
    }
    return list;
  }, [turnaroundData, screenerTab, searchQuery]);

  // Portfolio items enriched with live current price from all pools
  const enrichedPortfolio = useMemo(() => {
    const stockPriceMap = new Map<string, number>();

    if (screenerData?.allStocks) {
      for (const s of screenerData.allStocks) {
        stockPriceMap.set(s.symbol, s.price);
      }
    }
    if (turnaroundData?.allStocks) {
      for (const s of turnaroundData.allStocks) {
        stockPriceMap.set(s.symbol, s.price);
      }
    }

    return portfolio.map((item) => {
      const curPrice = stockPriceMap.get(item.symbol) ?? item.entryPrice;
      const plPerShare = curPrice - item.entryPrice;
      const unrealizedPL = Math.round(plPerShare * (item.sharesLots * 1000));
      const returnPct = Number((((curPrice - item.entryPrice) / item.entryPrice) * 100).toFixed(2));
      const isStopLossTriggered = curPrice <= item.stopLossPrice;
      const isTargetTriggered = curPrice >= item.targetPrice;

      return {
        ...item,
        currentPrice: curPrice,
        unrealizedPL,
        returnPct,
        isStopLossTriggered,
        isTargetTriggered,
      };
    });
  }, [portfolio, screenerData, turnaroundData]);

  // Portfolio summary calculation
  const portfolioSummary = useMemo(() => {
    let totalCost = 0;
    let totalValue = 0;
    let totalPL = 0;

    for (const item of enrichedPortfolio) {
      const cost = item.entryPrice * item.sharesLots * 1000;
      const value = (item.currentPrice ?? item.entryPrice) * item.sharesLots * 1000;
      totalCost += cost;
      totalValue += value;
      totalPL += value - cost;
    }

    const totalReturnPct = totalCost > 0 ? Number(((totalPL / totalCost) * 100).toFixed(2)) : 0;
    return { totalCost, totalValue, totalPL, totalReturnPct };
  }, [enrichedPortfolio]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-amber-500 to-indigo-600 flex items-center justify-center shadow-md shadow-rose-900/30">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white">台股量化波段雷達</h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 font-semibold">
                  全市場投信連買掃描 × 低基期價值轉型
                </span>
              </div>
              <p className="text-xs text-slate-400">
                FinMind 全市場籌碼 × Yahoo 全時台指期 × Gemini 深度早報 × 零虛構真數據
              </p>
            </div>
          </div>

          {/* Module Switcher Tabs */}
          <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/80">
            <button
              onClick={() => setActiveModule('market')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeModule === 'market'
                  ? 'bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>大盤總覽與開盤早報</span>
            </button>
            <button
              onClick={() => setActiveModule('screener')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeModule === 'screener'
                  ? 'bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Target className="w-4 h-4" />
              <span>波段篩選與投組管理</span>
              {(screenerData?.totalMatched || turnaroundData?.totalMatched) ? (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-xs font-bold">
                  {(screenerData?.totalMatched ?? 0) + (turnaroundData?.totalMatched ?? 0)}
                </span>
              ) : null}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-32 space-y-6">
        {/* Error notification banner if any */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center justify-between text-sm animate-pulse">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-400" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-xs text-slate-400 hover:text-white underline ml-3"
            >
              關閉
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODULE 1: 大盤總覽與每日開盤早報                                             */}
        {/* ========================================================================= */}
        {activeModule === 'market' && (
          <div className="space-y-6 animate-fadeIn">
            {/* 1. 三大核心指數卡片 */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-rose-400" />
                  大盤核心即時三大指數
                </h2>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>FinMind & Yahoo 真實連續撮合</span>
                </div>
              </div>

              {isMarketLoading && !marketData ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-32 rounded-2xl bg-slate-900 border border-slate-800 animate-pulse p-5" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* 加權指數 (TAIEX) */}
                  <div className="rounded-2xl bg-gradient-to-b from-slate-900 to-slate-900/80 border border-slate-800 p-5 shadow-sm hover:border-slate-700 transition">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span className="font-semibold text-slate-300">加權指數 (TAIEX)</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">集中市場實報</span>
                    </div>
                    {marketData?.taiex ? (
                      <div>
                        <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
                          {marketData.taiex.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span
                            className={`inline-flex items-center text-sm font-bold ${
                              marketData.taiex.change >= 0 ? 'text-rose-400' : 'text-emerald-400'
                            }`}
                          >
                            {marketData.taiex.change >= 0 ? (
                              <ArrowUpRight className="w-4 h-4 mr-0.5" />
                            ) : (
                              <ArrowDownRight className="w-4 h-4 mr-0.5" />
                            )}
                            {marketData.taiex.change > 0 ? '+' : ''}
                            {marketData.taiex.change.toFixed(2)} ({marketData.taiex.changePercent > 0 ? '+' : ''}
                            {marketData.taiex.changePercent.toFixed(2)}%)
                          </span>
                          <span className="text-xs text-slate-500">
                            昨收 {marketData.taiex.prevClose.toFixed(2)}
                          </span>
                        </div>
                        {marketData.taiex.volume ? (
                          <div className="text-xs text-slate-400 mt-2 pt-2 border-t border-slate-800/80 flex justify-between">
                            <span>成交金額</span>
                            <span className="text-slate-300 font-medium">約 {marketData.taiex.volume} 億元</span>
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <div className="text-sm text-slate-500 py-4">API 連線更新中...</div>
                    )}
                  </div>

                  {/* 櫃買指數 (TPEx) */}
                  <div className="rounded-2xl bg-gradient-to-b from-slate-900 to-slate-900/80 border border-slate-800 p-5 shadow-sm hover:border-slate-700 transition">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span className="font-semibold text-slate-300">櫃買指數 (TPEx)</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">中小型成長股動能</span>
                    </div>
                    {marketData?.tpex ? (
                      <div>
                        <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
                          {marketData.tpex.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span
                            className={`inline-flex items-center text-sm font-bold ${
                              marketData.tpex.change >= 0 ? 'text-rose-400' : 'text-emerald-400'
                            }`}
                          >
                            {marketData.tpex.change >= 0 ? (
                              <ArrowUpRight className="w-4 h-4 mr-0.5" />
                            ) : (
                              <ArrowDownRight className="w-4 h-4 mr-0.5" />
                            )}
                            {marketData.tpex.change > 0 ? '+' : ''}
                            {marketData.tpex.change.toFixed(2)} ({marketData.tpex.changePercent > 0 ? '+' : ''}
                            {marketData.tpex.changePercent.toFixed(2)}%)
                          </span>
                          <span className="text-xs text-slate-500">
                            昨收 {marketData.tpex.prevClose.toFixed(2)}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-2 pt-2 border-t border-slate-800/80 flex justify-between">
                          <span>中小型股動態</span>
                          <span className="text-slate-300 font-medium">
                            {marketData.tpex.changePercent > 0 ? '買盤進駐' : '震盪換手'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-slate-500 py-4">API 連線更新中...</div>
                    )}
                  </div>

                  {/* 台指期貨全時盤 (WTX&) */}
                  <div className="rounded-2xl bg-gradient-to-b from-slate-900 to-slate-900/80 border border-rose-900/40 p-5 shadow-sm hover:border-rose-700/60 transition relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl" />
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                        台指期全時盤 (WTX&)
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono text-[10px]">
                        日夜盤連續撮合
                      </span>
                    </div>
                    {marketData?.wtx ? (
                      <div>
                        <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
                          {marketData.wtx.price.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span
                            className={`inline-flex items-center text-sm font-bold ${
                              marketData.wtx.change >= 0 ? 'text-rose-400' : 'text-emerald-400'
                            }`}
                          >
                            {marketData.wtx.change >= 0 ? (
                              <ArrowUpRight className="w-4 h-4 mr-0.5" />
                            ) : (
                              <ArrowDownRight className="w-4 h-4 mr-0.5" />
                            )}
                            {marketData.wtx.change > 0 ? '+' : ''}
                            {marketData.wtx.change} ({marketData.wtx.changePercent > 0 ? '+' : ''}
                            {marketData.wtx.changePercent.toFixed(2)}%)
                          </span>
                          <span className="text-xs text-slate-500">
                            昨收 {marketData.wtx.prevClose}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-2 pt-2 border-t border-slate-800/80 flex justify-between">
                          <span>期現貨價差</span>
                          <span className="text-slate-300 font-mono font-medium">
                            {marketData.taiex
                              ? `${marketData.wtx.price - marketData.taiex.price >= 0 ? '+' : ''}${(
                                  marketData.wtx.price - marketData.taiex.price
                                ).toFixed(0)} 點`
                              : '--'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-slate-500 py-4">讀取中或非開盤時段</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 2. 美股四大指標橫幅 (已修復真實數據比較) */}
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
              <div className="text-xs font-semibold text-slate-400 mb-3 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Globe2 className="w-4 h-4 text-indigo-400" />
                  美股四大關鍵連動指標（100% 精確前日昨收對比真實數據）
                </span>
                <span className="text-[11px] text-slate-500">Yahoo Finance 即時連線</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* 費半 */}
                <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80">
                  <div className="text-xs text-slate-400 font-medium">費城半導體 (^SOX)</div>
                  {marketData?.usIndices.sox ? (
                    <div className="mt-1">
                      <div className="text-base font-bold text-white">
                        {marketData.usIndices.sox.price.toFixed(2)}
                      </div>
                      <div
                        className={`text-xs font-semibold flex items-center gap-1 ${
                          marketData.usIndices.sox.changePercent >= 0 ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {marketData.usIndices.sox.change >= 0 ? '+' : ''}
                        {marketData.usIndices.sox.change.toFixed(2)} ({marketData.usIndices.sox.changePercent > 0 ? '+' : ''}
                        {marketData.usIndices.sox.changePercent.toFixed(2)}%)
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        昨收 {marketData.usIndices.sox.prevClose.toFixed(2)}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 mt-1">連線中...</div>
                  )}
                </div>

                {/* 台積電 ADR */}
                <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80">
                  <div className="text-xs text-slate-400 font-medium">台積電 ADR (TSM)</div>
                  {marketData?.usIndices.tsm ? (
                    <div className="mt-1">
                      <div className="text-base font-bold text-white">
                        ${marketData.usIndices.tsm.price.toFixed(2)}
                      </div>
                      <div
                        className={`text-xs font-semibold flex items-center gap-1 ${
                          marketData.usIndices.tsm.changePercent >= 0 ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {marketData.usIndices.tsm.change >= 0 ? '+' : ''}
                        {marketData.usIndices.tsm.change.toFixed(2)} ({marketData.usIndices.tsm.changePercent > 0 ? '+' : ''}
                        {marketData.usIndices.tsm.changePercent.toFixed(2)}%)
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        昨收 ${marketData.usIndices.tsm.prevClose.toFixed(2)}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 mt-1">連線中...</div>
                  )}
                </div>

                {/* 那斯達克 */}
                <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80">
                  <div className="text-xs text-slate-400 font-medium">那斯達克 (^IXIC)</div>
                  {marketData?.usIndices.nasdaq ? (
                    <div className="mt-1">
                      <div className="text-base font-bold text-white">
                        {marketData.usIndices.nasdaq.price.toFixed(2)}
                      </div>
                      <div
                        className={`text-xs font-semibold flex items-center gap-1 ${
                          marketData.usIndices.nasdaq.changePercent >= 0 ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {marketData.usIndices.nasdaq.change >= 0 ? '+' : ''}
                        {marketData.usIndices.nasdaq.change.toFixed(2)} ({marketData.usIndices.nasdaq.changePercent > 0 ? '+' : ''}
                        {marketData.usIndices.nasdaq.changePercent.toFixed(2)}%)
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        昨收 {marketData.usIndices.nasdaq.prevClose.toFixed(2)}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 mt-1">連線中...</div>
                  )}
                </div>

                {/* 道瓊 */}
                <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80">
                  <div className="text-xs text-slate-400 font-medium">道瓊工業 (^DJI)</div>
                  {marketData?.usIndices.dow ? (
                    <div className="mt-1">
                      <div className="text-base font-bold text-white">
                        {marketData.usIndices.dow.price.toFixed(2)}
                      </div>
                      <div
                        className={`text-xs font-semibold flex items-center gap-1 ${
                          marketData.usIndices.dow.changePercent >= 0 ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {marketData.usIndices.dow.change >= 0 ? '+' : ''}
                        {marketData.usIndices.dow.change.toFixed(2)} ({marketData.usIndices.dow.changePercent > 0 ? '+' : ''}
                        {marketData.usIndices.dow.changePercent.toFixed(2)}%)
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        昨收 {marketData.usIndices.dow.prevClose.toFixed(2)}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 mt-1">連線中...</div>
                  )}
                </div>
              </div>
            </div>

            {/* 3. 升級版每日深度操盤早報 (Gemini 2.5 Flash + 真實籌碼數據) */}
            <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-2xl p-6 sm:p-7 relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-rose-500/20 border border-amber-500/30 flex items-center justify-center">
                    <SunMedium className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white">每日深度操盤早報</h3>
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-mono flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-indigo-400" />
                        Gemini 2.5 Flash 量化生成
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      美股四大指標 + 台指期夜盤 + TWSE 三大法人即時籌碼深層解讀
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => loadBriefing(true)}
                    disabled={isBriefingRefreshing}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isBriefingRefreshing ? 'animate-spin text-amber-400' : ''}`} />
                    <span>{isBriefingRefreshing ? '分析中...' : '重新生成早報'}</span>
                  </button>

                  <button
                    onClick={() => setIsBriefingExpanded((prev) => !prev)}
                    className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
                    title={isBriefingExpanded ? '收合早報' : '展開早報'}
                  >
                    {isBriefingExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {isBriefingLoading && !morningBriefing ? (
                <div className="py-8 space-y-3">
                  <div className="h-6 w-3/4 bg-slate-800/80 rounded animate-pulse" />
                  <div className="h-4 w-full bg-slate-800/60 rounded animate-pulse" />
                  <div className="h-4 w-5/6 bg-slate-800/60 rounded animate-pulse" />
                  <div className="h-24 w-full bg-slate-800/40 rounded-xl animate-pulse mt-4" />
                </div>
              ) : morningBriefing && isBriefingExpanded ? (
                <div className="mt-5 p-5 rounded-2xl bg-slate-950/80 border border-slate-800/90 shadow-inner">
                  <MarkdownRenderer content={morningBriefing.markdown} />
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                    <span>
                      分析時間：{new Date(morningBriefing.generatedAt).toLocaleTimeString('zh-TW')}
                    </span>
                    <span>快取保護 30 分鐘 (剩餘 {Math.ceil(morningBriefing.expiresInSeconds / 60)} 分)</span>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODULE 2: 波段股票篩選器與投組管理                                           */}
        {/* ========================================================================= */}
        {activeModule === 'screener' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Top Strategy Mode Switcher Tabs */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-2 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setStrategyMode('momentum')}
                  className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    strategyMode === 'momentum'
                      ? 'bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-lg shadow-rose-900/30'
                      : 'text-slate-400 hover:text-white bg-slate-950/50 hover:bg-slate-800'
                  }`}
                >
                  <Flame className="w-4 h-4 text-rose-300" />
                  <span>強勢動能突破選股</span>
                  {screenerData && screenerData.totalMatched > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-xs font-bold">
                      {screenerData.totalMatched}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setStrategyMode('turnaround')}
                  className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    strategyMode === 'turnaround'
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-900/30'
                      : 'text-slate-400 hover:text-white bg-slate-950/50 hover:bg-slate-800'
                  }`}
                >
                  <Compass className="w-4 h-4 text-indigo-300" />
                  <span>低基期價值轉型選股</span>
                  {turnaroundData && turnaroundData.totalMatched > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-indigo-500 text-white text-xs font-bold">
                      {turnaroundData.totalMatched}
                    </span>
                  )}
                </button>
              </div>

              <div className="text-xs text-slate-400 px-3 py-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>全面過濾金控股 (28xx/58xx) 與 &gt;500元高價股，鎖定 20~300 元親民爆發標的</span>
              </div>
            </div>

            {/* Sub-Tabs: Matched / All / Portfolio */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setScreenerTab('matched')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    screenerTab === 'matched'
                      ? strategyMode === 'momentum'
                        ? 'bg-rose-600 text-white shadow'
                        : 'bg-indigo-600 text-white shadow'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    {strategyMode === 'momentum'
                      ? `符合動能突破 (${screenerData?.totalMatched ?? 0} 檔)`
                      : `符合價值轉型 (${turnaroundData?.totalMatched ?? 0} 檔)`}
                  </span>
                </button>

                <button
                  onClick={() => setScreenerTab('all')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    screenerTab === 'all'
                      ? strategyMode === 'momentum'
                        ? 'bg-rose-600 text-white shadow'
                        : 'bg-indigo-600 text-white shadow'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>
                    {strategyMode === 'momentum'
                      ? `投信連買掃描池 (${screenerData?.totalScanned ?? 0} 檔)`
                      : `潛在價值轉型池 (${turnaroundData?.totalScanned ?? 0} 檔)`}
                  </span>
                </button>

                <button
                  onClick={() => setScreenerTab('portfolio')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    screenerTab === 'portfolio'
                      ? 'bg-amber-600 text-white shadow'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>我的波段投組 ({portfolio.length} 檔)</span>
                </button>
              </div>

              {/* Cache status & Refresh Button */}
              <div className="flex items-center gap-3">
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>後端快取保護 30 分鐘</span>
                </div>

                <button
                  onClick={handleForceRefresh}
                  disabled={isRefreshing}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 disabled:opacity-50 transition"
                  title="冷卻防護：每 45 秒最多強制更新 1 次"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-rose-400' : ''}`} />
                  <span>{isRefreshing ? '掃描中...' : '重新整理'}</span>
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={
                  strategyMode === 'momentum'
                    ? '搜尋股票代號、名稱 (例如: 6505, 台塑化, 塑膠)...'
                    : '搜尋轉型題材、代號或名稱 (例如: 3596, 智易, WiFi 7, 風電, 電網)...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500 transition"
              />
            </div>

            {/* TAB 1: MOMENTUM SCREENER CARDS */}
            {strategyMode === 'momentum' && (screenerTab === 'matched' || screenerTab === 'all') && (
              <div>
                {isScreenerLoading && !screenerData ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-64 rounded-3xl bg-slate-900 border border-slate-800 animate-pulse p-6" />
                    ))}
                  </div>
                ) : displayedMomentumStocks.length === 0 ? (
                  <div className="p-12 text-center rounded-3xl bg-slate-900/50 border border-slate-800 text-slate-400">
                    <Target className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                    <p className="text-base font-medium text-slate-300">
                      {screenerTab === 'matched'
                        ? '目前無完全符合動能發散之標的，請持續保持波段耐心觀望。'
                        : '查無符合搜尋條件之標的。'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      趨勢操作鐵律：寧可錯過、不可做錯；耐心等待均線多頭、量增突破與法人買超同向。
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {displayedMomentumStocks.map((stock) => {
                      const inPortfolio = portfolio.some((p) => p.symbol === stock.symbol);

                      return (
                        <div
                          key={stock.symbol}
                          className={`rounded-3xl bg-slate-900 border p-5 sm:p-6 shadow-md transition-all flex flex-col justify-between ${
                            stock.isMatched
                              ? 'border-rose-500/40 hover:border-rose-500/80 bg-gradient-to-b from-slate-900 to-rose-950/10'
                              : 'border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div>
                            {/* Card Header: Symbol, Name, Price */}
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xl font-extrabold text-white">{stock.name}</span>
                                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                                    {stock.symbol}
                                  </span>
                                  <span className="text-xs px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 font-medium">
                                    動能突破
                                  </span>
                                </div>
                                <div className="text-xs text-slate-400 mt-1">
                                  5MA ${stock.ma5.toFixed(1)} / 10MA ${stock.ma10.toFixed(1)} / 20MA ${stock.ma20.toFixed(1)}
                                </div>
                              </div>

                              <div className="text-right">
                                <div className="text-2xl font-black text-white">
                                  ${stock.price.toFixed(2)}
                                </div>
                                <div
                                  className={`text-xs font-bold flex items-center justify-end ${
                                    stock.change >= 0 ? 'text-rose-400' : 'text-emerald-400'
                                  }`}
                                >
                                  {stock.change >= 0 ? '+' : ''}
                                  {stock.change.toFixed(2)} ({stock.changePercent > 0 ? '+' : ''}
                                  {stock.changePercent.toFixed(2)}%)
                                </div>
                              </div>
                            </div>

                            {/* Quant Indicators Row */}
                            <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                              {/* 1. 均線多頭 */}
                              <div
                                className={`p-2.5 rounded-xl border text-xs ${
                                  stock.isBullishMa
                                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                                    : 'bg-slate-950 border-slate-800 text-slate-400'
                                }`}
                              >
                                <div className="text-[10px] text-slate-500 mb-0.5">均線排列</div>
                                <div className="font-bold">
                                  {stock.isBullishMa ? '5>10>20 多頭排列' : '整理未發散'}
                                </div>
                              </div>

                              {/* 2. 量能爆發 */}
                              <div
                                className={`p-2.5 rounded-xl border text-xs ${
                                  stock.isVolumeExpanding
                                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                                    : 'bg-slate-950 border-slate-800 text-slate-400'
                                }`}
                              >
                                <div className="text-[10px] text-slate-500 mb-0.5">量能攻擊</div>
                                <div className="font-bold">
                                  {stock.volumeRatio.toFixed(1)}x 均量
                                  {stock.isVolumeExpanding ? ' (放量攻擊)' : ''}
                                </div>
                              </div>

                              {/* 3. 投信籌碼 */}
                              <div
                                className={`p-2.5 rounded-xl border text-xs ${
                                  stock.isTrustAccumulating
                                    ? 'bg-purple-500/10 border-purple-500/30 text-purple-300'
                                    : 'bg-slate-950 border-slate-800 text-slate-400'
                                }`}
                              >
                                <div className="text-[10px] text-slate-500 mb-0.5">投信籌碼</div>
                                <div className="font-bold">
                                  連 2 日買超 (法人認養)
                                </div>
                              </div>
                            </div>

                            {/* 4. 乖離率防護警示 */}
                            {stock.isOverheated ? (
                              <div className="mt-3 p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-2">
                                <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                                <div>
                                  <div className="font-bold">🚨 短線過熱・切勿追高！</div>
                                  <div className="text-amber-200/90 mt-0.5">
                                    20MA 乖離率達 +{stock.bias20ma.toFixed(1)}%（超過 10% 警戒線）。建議等待拉回 5MA (${stock.ma5.toFixed(1)}) 附近再擇機進場。
                                  </div>
                                </div>
                              </div>
                            ) : null}

                            {/* 5. 策略錨定價格 (進場 / 停損 / 目標) */}
                            <div className="mt-3.5 p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2">
                              <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
                                <span>波段量化錨定 (盈虧比 1:2)</span>
                                <span className="text-slate-500 font-mono text-[10px]">
                                  當周低點 ${stock.weeklyLow.toFixed(1)}
                                </span>
                              </div>

                              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                                  <div className="text-[10px] text-slate-500">建議進場</div>
                                  <div className="font-bold text-slate-200">
                                    ${stock.suggestedEntryPrice.toFixed(1)}
                                  </div>
                                </div>

                                <div className="p-1.5 rounded-lg bg-emerald-950/40 border border-emerald-900/60">
                                  <div className="text-[10px] text-emerald-400">停損防守</div>
                                  <div className="font-bold text-emerald-300">
                                    ${stock.stopLossPrice.toFixed(1)}
                                  </div>
                                </div>

                                <div className="p-1.5 rounded-lg bg-rose-950/40 border border-rose-900/60">
                                  <div className="text-[10px] text-rose-400">目標獲利</div>
                                  <div className="font-bold text-rose-300">
                                    ${stock.targetPrice.toFixed(1)}
                                  </div>
                                </div>
                              </div>

                              <div className="text-[11px] text-slate-400 pt-1 flex items-center justify-between">
                                <span>{stock.actionNote}</span>
                              </div>
                            </div>
                          </div>

                          {/* Action Button: Add to Portfolio */}
                          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                            <span className="text-xs text-slate-500">
                              成交量 {stock.volume.toLocaleString()} 張
                            </span>

                            <button
                              onClick={() => handleToggleMomentumPortfolio(stock)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                                inPortfolio
                                  ? 'bg-slate-800 text-rose-400 border border-rose-500/30 hover:bg-slate-700'
                                  : 'bg-rose-600 hover:bg-rose-500 text-white shadow'
                              }`}
                            >
                              {inPortfolio ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>已在波段投組</span>
                                </>
                              ) : (
                                <>
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>加入波段投組</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: TURNAROUND VALUE SCREENER CARDS */}
            {strategyMode === 'turnaround' && (screenerTab === 'matched' || screenerTab === 'all') && (
              <div>
                {isTurnaroundLoading && !turnaroundData ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-64 rounded-3xl bg-slate-900 border border-slate-800 animate-pulse p-6" />
                    ))}
                  </div>
                ) : displayedTurnaroundStocks.length === 0 ? (
                  <div className="p-12 text-center rounded-3xl bg-slate-900/50 border border-slate-800 text-slate-400">
                    <Compass className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                    <p className="text-base font-medium text-slate-300">
                      查無符合條件之價值轉型標的。
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      轉型股篩選原則：位階 &le; 35%、近四季累計 EPS &gt; 0、單月營收 YoY &gt; 5%、近 20 天未破新低。
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {displayedTurnaroundStocks.map((stock) => {
                      const inPortfolio = portfolio.some((p) => p.symbol === stock.symbol);

                      return (
                        <div
                          key={stock.symbol}
                          className={`rounded-3xl bg-slate-900 border p-5 sm:p-6 shadow-md transition-all flex flex-col justify-between ${
                            stock.isTurnaroundMatched
                              ? 'border-indigo-500/50 hover:border-indigo-500/80 bg-gradient-to-b from-slate-900 to-indigo-950/20'
                              : 'border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div>
                            {/* Card Header: Symbol, Name, Price, Position */}
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xl font-extrabold text-white">{stock.name}</span>
                                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                                    {stock.symbol}
                                  </span>
                                  <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-medium">
                                    {stock.industry}
                                  </span>
                                </div>
                                <div className="text-xs text-indigo-400 font-semibold mt-1">
                                  {stock.positionLabel} (年最低 ${stock.yearLow} ~ 年最高 ${stock.yearHigh})
                                </div>
                              </div>

                              <div className="text-right">
                                <div className="text-2xl font-black text-white">
                                  ${stock.price.toFixed(2)}
                                </div>
                                <div
                                  className={`text-xs font-bold flex items-center justify-end ${
                                    stock.change >= 0 ? 'text-rose-400' : 'text-emerald-400'
                                  }`}
                                >
                                  {stock.change >= 0 ? '+' : ''}
                                  {stock.change.toFixed(2)} ({stock.changePercent > 0 ? '+' : ''}
                                  {stock.changePercent.toFixed(2)}%)
                                </div>
                              </div>
                            </div>

                            {/* Position Visual Progress Bar */}
                            <div className="mt-3">
                              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                                <span>近 1 年股價位階區間</span>
                                <span className="font-bold text-indigo-300">{stock.positionPct}% 低檔區間</span>
                              </div>
                              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
                                <div
                                  className="h-full bg-gradient-to-r from-emerald-500 via-indigo-500 to-rose-500"
                                  style={{ width: `${Math.min(100, Math.max(5, stock.positionPct))}%` }}
                                />
                              </div>
                              <div className="flex justify-between text-[10px] text-slate-500 mt-0.5 font-mono">
                                <span>年低 ${stock.yearLow}</span>
                                <span className="text-indigo-400">35% 低檔閥值</span>
                                <span>年高 ${stock.yearHigh}</span>
                              </div>
                            </div>

                            {/* Quant 4-Condition Badges */}
                            <div className="grid grid-cols-3 gap-2 mt-3.5 text-center">
                              {/* 1. 營收 YoY */}
                              <div
                                className={`p-2 rounded-xl border text-xs ${
                                  stock.isRevGrowing
                                    ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                                    : 'bg-slate-950 border-slate-800 text-slate-400'
                                }`}
                              >
                                <div className="text-[10px] text-slate-500 mb-0.5">最新營收年增率</div>
                                <div className="font-bold">
                                  YoY +{stock.revenueYoY.toFixed(1)}%
                                </div>
                              </div>

                              {/* 2. 近四季 EPS */}
                              <div
                                className={`p-2 rounded-xl border text-xs ${
                                  stock.isProfitable
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                                    : 'bg-slate-950 border-slate-800 text-slate-400'
                                }`}
                              >
                                <div className="text-[10px] text-slate-500 mb-0.5">近四季累計 EPS</div>
                                <div className="font-bold">
                                  ${stock.eps4Q.toFixed(2)} 元
                                </div>
                              </div>

                              {/* 3. 安全底部 */}
                              <div
                                className={`p-2 rounded-xl border text-xs ${
                                  stock.isSafeBottom
                                    ? 'bg-purple-500/10 border-purple-500/30 text-purple-300'
                                    : 'bg-slate-950 border-slate-800 text-slate-400'
                                }`}
                              >
                                <div className="text-[10px] text-slate-500 mb-0.5">安全打底結構</div>
                                <div className="font-bold">
                                  {stock.isSafeBottom ? '近20日不破底' : '均線打底中'}
                                </div>
                              </div>
                            </div>

                            {/* 轉型爆發題材說明卡片 */}
                            <div className="mt-3.5 p-3.5 rounded-2xl bg-indigo-950/20 border border-indigo-900/50 space-y-1.5">
                              <div className="text-[11px] font-bold text-indigo-300 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                                <span>轉型爆發題材深層剖析</span>
                              </div>
                              <p className="text-xs text-slate-300 leading-relaxed">
                                {stock.catalyst}
                              </p>
                            </div>

                            {/* 建議防守價卡片 */}
                            <div className="mt-3 p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between text-xs">
                              <div>
                                <span className="text-[10px] text-slate-500 block">紀律防守錨定價</span>
                                <span className="font-bold text-emerald-400">
                                  ${stock.stopLossPrice.toFixed(2)} (跌破近一年最低點出場)
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] text-slate-500 block">潛在轉型獲利目標</span>
                                <span className="font-bold text-indigo-300">
                                  ${(stock.price * 1.35).toFixed(1)} (+35%)
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Action Button: Add to Portfolio */}
                          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                            <span className="text-xs text-slate-500">
                              {stock.actionNote}
                            </span>

                            <button
                              onClick={() => handleToggleTurnaroundPortfolio(stock)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                                inPortfolio
                                  ? 'bg-slate-800 text-indigo-400 border border-indigo-500/30 hover:bg-slate-700'
                                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow'
                              }`}
                            >
                              {inPortfolio ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>已在波段投組</span>
                                </>
                              ) : (
                                <>
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>加入波段投組</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: 我的波段投組管理 (PORTFOLIO MANAGER) */}
            {screenerTab === 'portfolio' && (
              <div className="space-y-6">
                {/* Portfolio Summary Card */}
                <div className="rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-6 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-rose-400" />
                        波段持股管理儀表板
                      </h3>
                      <p className="text-xs text-slate-400">
                        自動依據現價動態計算損益，嚴格追蹤停損防守與停利目標
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-xs text-slate-500">未實現總損益</div>
                        <div
                          className={`text-xl font-black ${
                            portfolioSummary.totalPL >= 0 ? 'text-rose-400' : 'text-emerald-400'
                          }`}
                        >
                          {portfolioSummary.totalPL >= 0 ? '+' : ''}
                          ${portfolioSummary.totalPL.toLocaleString()} TWD
                          <span className="text-xs font-bold ml-1.5">
                            ({portfolioSummary.totalReturnPct > 0 ? '+' : ''}
                            {portfolioSummary.totalReturnPct}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 text-xs">
                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80">
                      <span className="text-slate-500">持股檔數</span>
                      <div className="text-base font-bold text-white mt-0.5">
                        {enrichedPortfolio.length} 檔
                      </div>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80">
                      <span className="text-slate-500">總持股市值</span>
                      <div className="text-base font-bold text-white mt-0.5">
                        ${portfolioSummary.totalValue.toLocaleString()}
                      </div>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80">
                      <span className="text-slate-500">觸發停損警戒</span>
                      <div className="text-base font-bold text-emerald-400 mt-0.5">
                        {enrichedPortfolio.filter((p) => p.isStopLossTriggered).length} 檔
                      </div>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80">
                      <span className="text-slate-500">達到目標價</span>
                      <div className="text-base font-bold text-rose-400 mt-0.5">
                        {enrichedPortfolio.filter((p) => p.isTargetTriggered).length} 檔
                      </div>
                    </div>
                  </div>
                </div>

                {/* Portfolio Items List */}
                {enrichedPortfolio.length === 0 ? (
                  <div className="p-12 text-center rounded-3xl bg-slate-900/50 border border-slate-800 text-slate-400">
                    <Briefcase className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                    <p className="text-base font-medium text-slate-300">尚未加入任何波段持股標的</p>
                    <p className="text-xs text-slate-500 mt-1">
                      可從「強勢動能突破」或「低基期價值轉型」點擊「加入波段投組」進行即時追蹤。
                    </p>
                    <button
                      onClick={() => setScreenerTab('matched')}
                      className="mt-4 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition"
                    >
                      前往挑選波段標的
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {enrichedPortfolio.map((item) => (
                      <div
                        key={item.id}
                        className={`p-5 rounded-3xl bg-slate-900 border transition-all ${
                          item.isStopLossTriggered
                            ? 'border-emerald-500/80 bg-emerald-950/15'
                            : item.isTargetTriggered
                            ? 'border-rose-500/80 bg-rose-950/15'
                            : 'border-slate-800'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          {/* Left: Info */}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold text-white">{item.name}</span>
                              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                                {item.symbol}
                              </span>
                              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                                {item.strategyType === 'turnaround' ? '價值轉型' : '動能突破'}
                              </span>
                              <span className="text-xs text-slate-500">進場日 {item.entryDate}</span>
                            </div>

                            {/* Trigger Warnings */}
                            <div className="mt-1 flex flex-wrap gap-2">
                              {item.isStopLossTriggered && (
                                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                                  <ShieldAlert className="w-3.5 h-3.5" />
                                  🚨 觸發停損防守！現價已跌破 ${item.stopLossPrice}，請嚴守紀律停損
                                </span>
                              )}
                              {item.isTargetTriggered && (
                                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-bold border border-rose-500/30">
                                  <Sparkles className="w-3.5 h-3.5" />
                                  🎉 達到目標獲利價！現價已達 ${item.targetPrice}，可分批獲利了結
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Right: Real-time P&L */}
                          <div className="text-right">
                            <div className="text-xs text-slate-400">
                              現價 <span className="text-white font-bold text-base">${item.currentPrice?.toFixed(2)}</span>
                            </div>
                            <div
                              className={`text-sm font-extrabold ${
                                (item.unrealizedPL ?? 0) >= 0 ? 'text-rose-400' : 'text-emerald-400'
                              }`}
                            >
                              {(item.unrealizedPL ?? 0) >= 0 ? '+' : ''}
                              ${item.unrealizedPL?.toLocaleString()} TWD (
                              {(item.returnPct ?? 0) > 0 ? '+' : ''}
                              {item.returnPct}%)
                            </div>
                          </div>
                        </div>

                        {/* Interactive Edit Fields for User Cost and Lots */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800/80 text-xs">
                          <div>
                            <label className="text-[11px] text-slate-400 block mb-1">
                              買進成本價 (TWD)
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              value={item.entryPrice}
                              onChange={(e) =>
                                handleUpdatePortfolioItem(item.id, {
                                  entryPrice: parseFloat(e.target.value) || 0,
                                })
                              }
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white font-mono focus:border-rose-500 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] text-slate-400 block mb-1">
                              持有張數 (1張 = 1,000股)
                            </label>
                            <input
                              type="number"
                              min="0.1"
                              step="0.5"
                              value={item.sharesLots}
                              onChange={(e) =>
                                handleUpdatePortfolioItem(item.id, {
                                  sharesLots: parseFloat(e.target.value) || 1,
                                })
                              }
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white font-mono focus:border-rose-500 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] text-emerald-400 block mb-1">
                              停損防守價 (TWD)
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              value={item.stopLossPrice}
                              onChange={(e) =>
                                handleUpdatePortfolioItem(item.id, {
                                  stopLossPrice: parseFloat(e.target.value) || 0,
                                })
                              }
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-emerald-300 font-mono focus:border-emerald-500 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] text-rose-400 block mb-1">
                              目標獲利價 (TWD)
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                step="0.1"
                                value={item.targetPrice}
                                onChange={(e) =>
                                  handleUpdatePortfolioItem(item.id, {
                                    targetPrice: parseFloat(e.target.value) || 0,
                                  })
                                }
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-rose-300 font-mono focus:border-rose-500 focus:outline-none"
                              />

                              <button
                                onClick={() => handleRemovePortfolioItem(item.id)}
                                className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                                title="移除此持股"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {item.notes && (
                          <div className="mt-3 text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                            {item.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
