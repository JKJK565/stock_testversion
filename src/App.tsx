import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  MarketOverviewResponse,
  ScreenerResponse,
  ScreenerStockItem,
  TurnaroundScreenerResponse,
  TurnaroundStockItem,
  MorningBriefingResponse,
  PortfolioStockItem,
  TradeRecordItem,
  WatchlistAlertDetail,
  NotificationItem,
  WatchlistBriefingResponse,
  WatchlistStockDiagnostic,
} from './types/stock';
import {
  fetchMarketOverview,
  fetchMorningBriefing,
  fetchScreenerData,
  refreshScreenerData,
  fetchTurnaroundScreenerData,
  refreshTurnaroundScreenerData,
  fetchBatchQuotes,
  fetchWatchlistMorningBriefing,
  BatchQuoteItem,
} from './services/stockApi';
import { Navbar } from './components/Navbar';
import { NotificationCenter } from './components/NotificationCenter';
import { WatchlistView } from './components/WatchlistView';
import { StockDetailModal } from './components/StockDetailModal';
import { StockStrategyAuditModal } from './components/StockStrategyAuditModal';
import {
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  Clock,
  Building2,

  ArrowUpRight,
  ArrowDownRight,
  Target,
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
  Zap,
  Ban,
  ShieldCheck,
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
            <h2
              key={idx}
              className="text-xl font-black text-white pt-2 pb-1 border-b border-slate-800 flex items-center gap-2"
            >
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
  // Navigation tabs between the three core modules
  const [activeModule, setActiveModule] = useState<'market' | 'screener' | 'watchlist'>('market');

  // Screener Strategy Mode: 強勢動能突破 vs 低基期價值轉型
  const [strategyMode, setStrategyMode] = useState<'momentum' | 'turnaround'>('momentum');

  // Screener sub-view filter
  const [screenerTab, setScreenerTab] = useState<'matched' | 'all' | 'portfolio'>('matched');
  const [searchQuery, setSearchQuery] = useState('');

  // 優先聚焦產業白名單篩選器
  const [selectedIndustryFilter, setSelectedIndustryFilter] = useState<
    'all' | 'ai' | 'cowos' | 'cpo' | 'power' | 'turnaround'
  >('all');

  // Notification Center modal open state
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);

  // Data states
  const [marketData, setMarketData] = useState<MarketOverviewResponse | null>(null);
  const [morningBriefing, setMorningBriefing] = useState<MorningBriefingResponse | null>(null);
  const [watchlistBriefing, setWatchlistBriefing] = useState<WatchlistBriefingResponse | null>(null);
  const [screenerData, setScreenerData] = useState<ScreenerResponse | null>(null);
  const [turnaroundData, setTurnaroundData] = useState<TurnaroundScreenerResponse | null>(null);
  const [watchlistDiagnostics, setWatchlistDiagnostics] = useState<Record<string, WatchlistStockDiagnostic>>({});

  // Loading states
  const [isMarketLoading, setIsMarketLoading] = useState(true);
  const [isMarketRefreshing, setIsMarketRefreshing] = useState(false);
  const [isBriefingLoading, setIsBriefingLoading] = useState(true);
  const [isBriefingGenerating, setIsBriefingGenerating] = useState(false);
  const [isWatchlistBriefingLoading, setIsWatchlistBriefingLoading] = useState(false);
  const [isWatchlistBriefingGenerating, setIsWatchlistBriefingGenerating] = useState(false);
  const [isScreenerLoading, setIsScreenerLoading] = useState(true);
  const [isTurnaroundLoading, setIsTurnaroundLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Markdown Briefing Expansion state
  const [isBriefingExpanded, setIsBriefingExpanded] = useState(true);

  // Stock Detail Modal state (主力分點籌碼與個股詳情)
  const [selectedStockSymbol, setSelectedStockSymbol] = useState<string | null>(null);
  const [isStockDetailOpen, setIsStockDetailOpen] = useState(false);

  // Watchlist real-time quotes state (證交所 MIS 即時撮合報價快取)
  const [watchlistQuotes, setWatchlistQuotes] = useState<Record<string, BatchQuoteItem>>({});
  const [isRefreshingWatchlistQuotes, setIsRefreshingWatchlistQuotes] = useState(false);
  const [lastWatchlistQuotesUpdatedAt, setLastWatchlistQuotesUpdatedAt] = useState<string>('');

  const handleOpenStockDetail = (symbol: string) => {
    setSelectedStockSymbol(symbol);
    setIsStockDetailOpen(true);
  };

  const handleCloseStockDetail = () => {
    setIsStockDetailOpen(false);
    setSelectedStockSymbol(null);
  };

  // Stock Strategy Audit Modal state (個股量化策略健檢)
  const [auditSymbol, setAuditSymbol] = useState<string | null>(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  const handleOpenStrategyAudit = (symbol: string) => {
    setAuditSymbol(symbol);
    setIsAuditModalOpen(true);
  };

  const handleCloseStrategyAudit = () => {
    setIsAuditModalOpen(false);
    setAuditSymbol(null);
  };

  // 操盤手資金管理：初始本金 (預設 1,000,000 TWD)
  const [initialCapital, setInitialCapital] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('tw_swing_initial_capital');
      if (saved) {
        const val = Number(saved);
        if (!isNaN(val) && val > 0) return val;
      }
    } catch {}
    return 1000000;
  });

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

  // 操盤手已平倉歷史戰績交易日記 (Trade Diary)
  const [tradeHistory, setTradeHistory] = useState<TradeRecordItem[]>(() => {
    try {
      const saved = localStorage.getItem('tw_swing_trade_history');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load tradeHistory from localStorage:', e);
    }
    return [];
  });

  // Supabase / 本機資料庫同步狀態
  const [syncStatus, setSyncStatus] = useState<{
    connected: boolean;
    provider: 'supabase' | 'local_store';
    message: string;
  }>({
    connected: false,
    provider: 'local_store',
    message: '本機資料持久化中',
  });

  const hasInitialSyncedRef = useRef(false);

  const syncUserPortfolioToServer = useCallback(
    async (currentPortfolio: PortfolioStockItem[], cap?: number) => {
      try {
        await fetch('/api/user/portfolio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ portfolio: currentPortfolio, initialCapital: cap }),
        });
      } catch (e) {
        console.warn('Failed to sync user portfolio to server:', e);
      }
    },
    []
  );

  const syncTradesToServer = useCallback(async (trades: TradeRecordItem[]) => {
    if (!trades || trades.length === 0) return;
    try {
      const res = await fetch('/api/user/trades/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trades }),
      });
      if (res.ok) {
        console.log(`[App] Synced ${trades.length} trades to cloud database`);
      }
    } catch (e) {
      console.warn('Failed to sync trades to server:', e);
    }
  }, []);

  // 7. Supabase 雲端資料庫串接與資料持久化同步 (Auto-Sync on Load)
  useEffect(() => {
    let isMounted = true;
    const syncCloudUserData = async () => {
      try {
        const res = await fetch('/api/user/portfolio');
        if (res.ok) {
          const serverData = await res.json();
          if (isMounted) {
            // 1. Initial Capital
            if (typeof serverData.initialCapital === 'number' && serverData.initialCapital > 0) {
              setInitialCapital(serverData.initialCapital);
              localStorage.setItem('tw_swing_initial_capital', String(serverData.initialCapital));
            }

            // 2. Portfolio: 雙向同步
            let localItems: PortfolioStockItem[] = [];
            try {
              const saved = localStorage.getItem('tw_swing_portfolio');
              if (saved) localItems = JSON.parse(saved);
            } catch {}

            if (Array.isArray(serverData.portfolio) && serverData.portfolio.length > 0) {
              setPortfolio(serverData.portfolio);
              localStorage.setItem('tw_swing_portfolio', JSON.stringify(serverData.portfolio));
            } else if (localItems.length > 0) {
              // 伺服器/Supabase 為空但本機有，自動補上傳寫入 Supabase
              setPortfolio(localItems);
              syncUserPortfolioToServer(localItems, serverData.initialCapital || initialCapital);
            }

            // 3. Trade History: 雙向同步 (解決本機已有平倉戰績但 Supabase 仍是空的問題)
            let localTrades: TradeRecordItem[] = [];
            try {
              const savedTrades = localStorage.getItem('tw_swing_trade_history');
              if (savedTrades) localTrades = JSON.parse(savedTrades);
            } catch {}

            if (Array.isArray(serverData.tradeHistory) && serverData.tradeHistory.length > 0) {
              // 伺服器已有平倉紀錄，若本機有尚未上傳的紀錄進行合併補齊
              const serverIds = new Set(serverData.tradeHistory.map((t: any) => t.id));
              const missingOnServer = localTrades.filter((lt) => !serverIds.has(lt.id));
              if (missingOnServer.length > 0) {
                const merged = [...serverData.tradeHistory, ...missingOnServer];
                setTradeHistory(merged);
                localStorage.setItem('tw_swing_trade_history', JSON.stringify(merged));
                syncTradesToServer(merged);
              } else {
                setTradeHistory(serverData.tradeHistory);
                localStorage.setItem('tw_swing_trade_history', JSON.stringify(serverData.tradeHistory));
              }
            } else if (localTrades.length > 0) {
              // 伺服器/Supabase 為空但本機已有紀錄（如圖中的智易與台積電），立即批次上傳寫入 Supabase！
              setTradeHistory(localTrades);
              syncTradesToServer(localTrades);
            }

            if (serverData.syncStatus) {
              setSyncStatus(serverData.syncStatus);
            }
            hasInitialSyncedRef.current = true;
          }
          return;
        }
      } catch (err) {
        console.warn('User portfolio initial sync error:', err);
      }
    };
    syncCloudUserData();
    return () => {
      isMounted = false;
    };
  }, [syncUserPortfolioToServer, syncTradesToServer, initialCapital]);

  // 修改初始本金
  const handleUpdateInitialCapital = useCallback(
    (newCap: number) => {
      setInitialCapital(newCap);
      try {
        localStorage.setItem('tw_swing_initial_capital', String(newCap));
      } catch {}
      syncUserPortfolioToServer(portfolio, newCap);
    },
    [portfolio, syncUserPortfolioToServer]
  );

  // 🎯 停利平倉 / 🛑 停損平倉：自動計算已實現損益、持有天數，移入交易日記並即時呼叫 Supabase 持久化
  const handleClosePosition = useCallback(
    async (tradeData: Omit<TradeRecordItem, 'id'>, removePortfolioId: string) => {
      const tradeItem: TradeRecordItem = {
        ...tradeData,
        id: `trade_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      };

      setTradeHistory((prev) => {
        const updated = [tradeItem, ...prev];
        try {
          localStorage.setItem('tw_swing_trade_history', JSON.stringify(updated));
        } catch {}
        return updated;
      });

      const nextPortfolio = portfolio.filter((p) => p.id !== removePortfolioId);
      setPortfolio(nextPortfolio);
      try {
        localStorage.setItem('tw_swing_portfolio', JSON.stringify(nextPortfolio));
      } catch {}

      try {
        const res = await fetch('/api/user/trades', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tradeItem),
        });
        if (!res.ok) {
          console.warn('[App] Failed to save trade via /api/user/trades, retrying with syncTradesToServer');
          syncTradesToServer([tradeItem]);
        }
        syncUserPortfolioToServer(nextPortfolio, initialCapital);
      } catch (e) {
        console.warn('Failed to record closed trade to server, fallback to bulk sync:', e);
        syncTradesToServer([tradeItem]);
      }
    },
    [portfolio, initialCapital, syncUserPortfolioToServer, syncTradesToServer]
  );

  // 刪除單筆歷史平倉紀錄
  const handleDeleteTradeRecord = useCallback(async (id: string) => {
    setTradeHistory((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      try {
        localStorage.setItem('tw_swing_trade_history', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    try {
      await fetch(`/api/user/trades/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('Failed to delete trade record from server:', e);
    }
  }, []);

  // 備份匯出 (JSON 下載)
  const handleExportBackup = useCallback(() => {
    const backupData = {
      version: '2.6.0',
      exportedAt: new Date().toISOString(),
      initialCapital,
      portfolio,
      tradeHistory,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `台股量化波段雷達_交易紀錄備份_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [initialCapital, portfolio, tradeHistory]);

  // 備份匯入還原
  const handleImportBackup = useCallback(
    async (file: File) => {
      try {
        const text = await file.text();
        const json = JSON.parse(text);
        let cap = initialCapital;
        if (typeof json.initialCapital === 'number' && json.initialCapital > 0) {
          cap = json.initialCapital;
          setInitialCapital(cap);
          localStorage.setItem('tw_swing_initial_capital', String(cap));
        }
        let port = portfolio;
        if (Array.isArray(json.portfolio)) {
          port = json.portfolio;
          setPortfolio(port);
          localStorage.setItem('tw_swing_portfolio', JSON.stringify(port));
        }
        if (Array.isArray(json.tradeHistory)) {
          setTradeHistory(json.tradeHistory);
          localStorage.setItem('tw_swing_trade_history', JSON.stringify(json.tradeHistory));
          syncTradesToServer(json.tradeHistory);
        }
        syncUserPortfolioToServer(port, cap);
        alert('🎉 交易紀錄備份還原成功！已自動同步至雲端與本機。');
      } catch (e) {
        alert('匯入備份失敗，請確認檔案是否為正確的 JSON 格式。');
      }
    },
    [portfolio, initialCapital, syncUserPortfolioToServer, syncTradesToServer]
  );

  // Notifications stored in localStorage
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem('tw_swing_notifications');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load notifications from localStorage:', e);
    }
    return [];
  });

  // Save portfolio to localStorage & sync to server (only after initial load has finished)
  useEffect(() => {
    try {
      localStorage.setItem('tw_swing_portfolio', JSON.stringify(portfolio));
    } catch (e) {
      console.error('Failed to save portfolio to localStorage:', e);
    }
    if (hasInitialSyncedRef.current) {
      syncUserPortfolioToServer(portfolio, initialCapital);
    }
  }, [portfolio, initialCapital, syncUserPortfolioToServer]);

  // Save notifications to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('tw_swing_notifications', JSON.stringify(notifications));
    } catch (e) {
      console.error('Failed to save notifications to localStorage:', e);
    }
  }, [notifications]);

  // Load Market Data (cached 15s on server)
  const loadMarket = useCallback(async (force = false) => {
    if (force) setIsMarketRefreshing(true);
    else setIsMarketLoading(true);

    try {
      const data = await fetchMarketOverview(force);
      if (data) {
        setMarketData(data);
      }
    } catch (e: any) {
      console.error('Error loading market:', e);
    } finally {
      setIsMarketLoading(false);
      setIsMarketRefreshing(false);
    }
  }, []);

  const handleRefreshMarket = () => {
    loadMarket(true);
  };

  // Load or Generate Gemini 2.5 Pro Morning Briefing
  const loadBriefing = useCallback(async (generate = false) => {
    if (generate) setIsBriefingGenerating(true);
    else setIsBriefingLoading(true);

    try {
      const data = await fetchMorningBriefing(generate);
      if (data) {
        setMorningBriefing(data);
      }
    } catch (e: any) {
      console.error('Error loading briefing:', e);
    } finally {
      setIsBriefingLoading(false);
      setIsBriefingGenerating(false);
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

  // 避免 15 秒輪詢報價更新時因 portfolio 陣列參照改變而反覆重新觸發/中斷戰報
  const portfolioSymbolsKey = useMemo(() => {
    return Array.from(new Set(portfolio.map((p) => p.symbol))).sort().join(',');
  }, [portfolio]);
  const isGeneratingWatchlistRef = useRef(false);

  // 載入自選持股每日量化晨會戰報與深層防洗盤籌碼診斷
  const loadWatchlistBriefing = useCallback(async (generate = false) => {
    if (!portfolioSymbolsKey) {
      setWatchlistBriefing(null);
      return;
    }
    // 若當前正在進行 Gemini 深度生成，嚴禁被背景自動檢查 (generate = false) 覆蓋或中斷
    if (!generate && isGeneratingWatchlistRef.current) {
      return;
    }

    const symbols = portfolioSymbolsKey.split(',').filter(Boolean);
    if (symbols.length === 0) {
      setWatchlistBriefing(null);
      return;
    }

    if (generate) {
      isGeneratingWatchlistRef.current = true;
      setIsWatchlistBriefingGenerating(true);
    } else {
      setIsWatchlistBriefingLoading(true);
    }

    try {
      const res = await fetchWatchlistMorningBriefing(symbols, generate);
      if (res) {
        // 若背景查詢完成時已有正在生成中的戰報，避免覆蓋生成中狀態
        if (!generate && isGeneratingWatchlistRef.current) {
          return;
        }
        setWatchlistBriefing(res);
        if (res.diagnostics) {
          setWatchlistDiagnostics((prev) => ({ ...prev, ...res.diagnostics }));
        }
      }
    } catch (e) {
      console.error('Failed to load watchlist morning briefing:', e);
    } finally {
      if (generate) {
        isGeneratingWatchlistRef.current = false;
        setIsWatchlistBriefingGenerating(false);
      } else {
        setIsWatchlistBriefingLoading(false);
      }
    }
  }, [portfolioSymbolsKey]);

  // Initial load once on mount
  useEffect(() => {
    loadMarket();
    loadBriefing();
    loadScreener();
    loadTurnaround();
  }, [loadMarket, loadBriefing, loadScreener, loadTurnaround]);

  // 當自選股代碼變更時，自動檢查並獲取今日晨會戰報狀態與診斷
  useEffect(() => {
    if (portfolioSymbolsKey) {
      loadWatchlistBriefing(false);
    }
  }, [portfolioSymbolsKey, loadWatchlistBriefing]);

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
          ma5: stock.ma5,
          ma10: stock.ma10,
          ma20: stock.ma20,
          trustNetBuyDays: stock.consecutiveTrustDays,
          trustNetBuyLots: stock.trustNetLots,
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

  const handleRemovePortfolioItemBySymbol = (symbol: string) => {
    setPortfolio((prev) => prev.filter((item) => item.symbol !== symbol));
  };

  // 批次即時刷新自選股最新撮合報價（直連證交所 MIS，解決固定價格問題）
  const refreshWatchlistQuotes = useCallback(async () => {
    if (portfolio.length === 0) return;
    const symbols = Array.from(new Set(portfolio.map((p) => p.symbol)));
    setIsRefreshingWatchlistQuotes(true);
    try {
      const quotes = await fetchBatchQuotes(symbols);
      if (quotes.length > 0) {
        const quoteMap: Record<string, BatchQuoteItem> = {};
        for (const q of quotes) {
          quoteMap[q.symbol] = q;
        }
        setWatchlistQuotes((prev) => ({ ...prev, ...quoteMap }));
        setLastWatchlistQuotesUpdatedAt(
          new Date().toLocaleTimeString('zh-TW', { timeZone: 'Asia/Taipei' })
        );

        // 同步更新自選股列表之 currentPrice / change / updateTime 並寫入 localStorage，確保價格永久即時更新
        setPortfolio((prev) =>
          prev.map((item) => {
            const q = quoteMap[item.symbol];
            if (q && q.price > 0) {
              return {
                ...item,
                currentPrice: q.price,
                change: q.change,
                changePercent: q.changePercent,
                updateTime: q.updateTime,
              };
            }
            return item;
          })
        );
      }
    } catch (e) {
      console.error('Failed to refresh watchlist quotes:', e);
    } finally {
      setIsRefreshingWatchlistQuotes(false);
    }
  }, [portfolio]);

  // 自選股清單自動與週期性同步最新現價
  useEffect(() => {
    if (portfolio.length > 0) {
      refreshWatchlistQuotes();
    }
  }, [portfolio.length]);

  useEffect(() => {
    if (portfolio.length === 0) return;
    // 自選股頁面 15 秒更新一次，其他頁面 30 秒背景更新
    const intervalMs = activeModule === 'watchlist' ? 15000 : 30000;
    const timer = setInterval(() => {
      refreshWatchlistQuotes();
    }, intervalMs);
    return () => clearInterval(timer);
  }, [portfolio.length, activeModule, refreshWatchlistQuotes]);

  // 手動輸入台股 4 碼代號新增自選股
  const handleAddStockBySymbol = async (symbol: string): Promise<boolean> => {
    try {
      const quotes = await fetchBatchQuotes([symbol]);
      const q = quotes.find((item) => item.symbol === symbol);
      if (!q || q.price <= 0) return false;

      const newItem: PortfolioStockItem = {
        id: `${symbol}-${Date.now()}`,
        symbol: q.symbol,
        name: q.name || `股票${symbol}`,
        entryPrice: q.price,
        currentPrice: q.price,
        change: q.change,
        changePercent: q.changePercent,
        sharesLots: 1,
        stopLossPrice: Number((q.price * 0.95).toFixed(2)),
        targetPrice: Number((q.price * 1.25).toFixed(2)),
        entryDate: new Date().toISOString().split('T')[0],
        updateTime: q.updateTime,
        notes: `【自選加入】${q.industryTheme || '波段觀察標的'}`,
        strategyType: 'momentum',
      };

      setPortfolio((prev) => [newItem, ...prev.filter((p) => p.symbol !== symbol)]);
      setWatchlistQuotes((prev) => ({ ...prev, [symbol]: q }));
      return true;
    } catch (e) {
      console.error('Failed to add stock by symbol:', e);
      return false;
    }
  };


  // 產業黑名單防護驗證 (電信三雄、金融保險、公用事業油電燃氣)
  const isBlacklisted = useCallback((symbol: string, name: string) => {
    if (['2412', '3045', '4904'].includes(symbol)) return true;
    if (symbol.startsWith('28') || symbol.startsWith('58')) return true;
    if (['9908', '8926', '9918', '9926', '9931', '9937', '8931', '6505', '9933'].includes(symbol)) return true;
    if (/電信|金控|銀行|證券|保險|瓦斯|天然氣|汽電/.test(name)) return true;
    return false;
  }, []);

  // Filtered Momentum stocks
  const displayedMomentumStocks = useMemo(() => {
    if (!screenerData) return [];
    let list = screenerTab === 'matched' ? screenerData.screenerList : screenerData.allStocks;

    // 嚴格剔除產業黑名單
    list = list.filter((s) => !isBlacklisted(s.symbol, s.name));

    // 依產業白名單篩選
    if (selectedIndustryFilter !== 'all') {
      list = list.filter((s) => {
        const theme = `${s.industryTheme || ''} ${s.industry || ''} ${s.name}`;
        if (selectedIndustryFilter === 'ai') return /AI|散熱|機殼|滑軌|電源|伺服器|技嘉|奇鋐|雙鴻|廣達|緯創|健策|勤誠|晟銘電|川湖|台達電|光寶科/.test(theme);
        if (selectedIndustryFilter === 'cowos') return /CoWoS|半導體|封裝|封測|載板|設備|弘塑|辛耘|萬潤|欣興|矽格|台表科|台燿|京元電|日月光|南電/.test(theme);
        if (selectedIndustryFilter === 'cpo') return /CPO|矽光子|光通訊|光聖|聯鈞|眾達|波若威|華星光|上詮|聯亞|前鼎|訊芯/.test(theme);
        if (selectedIndustryFilter === 'power') return /重電|電網|儲能|綠能|風電|變壓器|華城|中興電|士電|東元|上緯|大亞|華新|世紀鋼|雲豹/.test(theme);
        if (selectedIndustryFilter === 'turnaround') return /轉型|高值化|循環材料|車電|脫離谷底|南亞|台塑|遠東新|仁寶|智易|裕隆|正新|宏碁|美利達|長榮/.test(theme);
        return true;
      });
    }

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
  }, [screenerData, screenerTab, searchQuery, selectedIndustryFilter, isBlacklisted]);

  // Filtered Turnaround stocks
  const displayedTurnaroundStocks = useMemo(() => {
    if (!turnaroundData) return [];
    let list =
      screenerTab === 'matched'
        ? turnaroundData.screenerList
        : turnaroundData.allStocks;

    // 嚴格剔除產業黑名單
    list = list.filter((s) => !isBlacklisted(s.symbol, s.name));

    // 依產業白名單篩選
    if (selectedIndustryFilter !== 'all') {
      list = list.filter((s) => {
        const theme = `${s.industryTheme || ''} ${s.industry || ''} ${s.catalyst || ''} ${s.name}`;
        if (selectedIndustryFilter === 'ai') return /AI|散熱|機殼|滑軌|電源|伺服器|仁寶|宏碁|光寶科|勤誠/.test(theme);
        if (selectedIndustryFilter === 'cowos') return /CoWoS|半導體|封裝|封測|載板|設備|欣興|南電/.test(theme);
        if (selectedIndustryFilter === 'cpo') return /CPO|矽光子|光通訊|智易|網通/.test(theme);
        if (selectedIndustryFilter === 'power') return /重電|電網|儲能|綠能|風電|變壓器|東元|上緯|華新/.test(theme);
        if (selectedIndustryFilter === 'turnaround') return /轉型|高值化|循環材料|車電|脫離谷底|南亞|遠東新|美利達|正新|裕隆|寶成/.test(theme);
        return true;
      });
    }

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
  }, [turnaroundData, screenerTab, searchQuery, selectedIndustryFilter, isBlacklisted]);

  // Portfolio items enriched with live current price & 4 health evaluation conditions
  const enrichedPortfolio = useMemo(() => {
    const stockPriceMap = new Map<string, number>();
    const stockMaMap = new Map<string, { ma5: number; ma10: number; ma20: number; trustDays: number }>();

    if (screenerData?.allStocks) {
      for (const s of screenerData.allStocks) {
        stockPriceMap.set(s.symbol, s.price);
        stockMaMap.set(s.symbol, {
          ma5: s.ma5,
          ma10: s.ma10,
          ma20: s.ma20,
          trustDays: s.consecutiveTrustDays,
        });
      }
    }
    if (turnaroundData?.allStocks) {
      for (const s of turnaroundData.allStocks) {
        stockPriceMap.set(s.symbol, s.price);
      }
    }

    return portfolio.map((item) => {
      // 優先使用證交所 MIS 即時批次報價 (watchlistQuotes)
      const liveQuote = watchlistQuotes[item.symbol];
      const curPrice =
        (liveQuote && liveQuote.price > 0 ? liveQuote.price : undefined) ??
        stockPriceMap.get(item.symbol) ??
        item.currentPrice ??
        item.entryPrice;
      const change = liveQuote?.change ?? item.change;
      const changePercent = liveQuote?.changePercent ?? item.changePercent;
      const updateTime = liveQuote?.updateTime ?? item.updateTime;
      // Retrieve server-level chip diagnostic for this symbol
      const diag = watchlistDiagnostics[item.symbol];
      const maInfo = stockMaMap.get(item.symbol);
      const ma5 = diag?.ma5 ?? maInfo?.ma5 ?? item.ma5;
      const ma10 = diag?.ma10 ?? maInfo?.ma10 ?? item.ma10;
      const ma20 = diag?.ma20 ?? maInfo?.ma20 ?? item.ma20;
      const trustDays = maInfo?.trustDays ?? item.trustNetBuyDays ?? 2;

      // 精準台股交易成本計算：
      const feeDiscount = typeof item.feeDiscount === 'number' && !isNaN(item.feeDiscount) ? item.feeDiscount : 60;
      const discountRatio = feeDiscount / 100;
      const buyTotal = item.entryPrice * item.sharesLots * 1000;
      const curMarketTotal = curPrice * item.sharesLots * 1000;
      const buyFee = Math.max(20, Math.round(buyTotal * 0.001425 * discountRatio));
      const sellFee = Math.max(20, Math.round(curMarketTotal * 0.001425 * discountRatio));
      const sellTax = Math.round(curMarketTotal * 0.003); // 現股 0.3%
      const feeCostTotal = buyFee + sellFee + sellTax;
      const grossPL = Math.round(curMarketTotal - buyTotal);
      const netPL = grossPL - feeCostTotal;
      const netReturnPct = buyTotal > 0 ? Number(((netPL / buyTotal) * 100).toFixed(2)) : 0;
      const returnPct = item.entryPrice > 0 ? Number((((curPrice - item.entryPrice) / item.entryPrice) * 100).toFixed(2)) : 0;
      const unrealizedPL = grossPL;

      // 4 Health Risk Evaluation Conditions & Anti-Shakeout Dual Verification
      const healthAlerts: WatchlistAlertDetail[] = [];

      // Check if price breaks 20MA or stop loss price
      const isBelow20MA = ma20 !== undefined ? curPrice < ma20 : false;

      // 2. 均線走空 (5MA、10MA、20MA 轉為空頭排列: 5MA < 10MA < 20MA)
      const isMaBearish =
        ma5 !== undefined &&
        ma10 !== undefined &&
        ma20 !== undefined &&
        ma5 < ma10 &&
        ma10 < ma20;
      if (isMaBearish) {
        healthAlerts.push({
          type: 'MA_BEARISH',
          title: '均線轉為空頭排列',
          description: `短中天期均線轉為空頭發散 (5MA $${ma5.toFixed(1)} < 10MA $${ma10.toFixed(1)} < 20MA $${ma20.toFixed(1)})，趨勢結構破壞。`,
          severity: 'danger',
        });
      }

      // 3. 法人轉賣 (投信由買超轉為連續賣超)
      const isTrustSelling = diag?.trustNetLots !== undefined ? diag.trustNetLots < 0 : trustDays <= 0;
      if (isTrustSelling) {
        healthAlerts.push({
          type: 'TRUST_SELLING',
          title: '法人由買轉賣出脫',
          description: `投信由連續買超轉為賣超，法人籌碼認養力道減弱，留意籌碼調節賣壓。`,
          severity: 'warning',
        });
      }

      // 4. 決策評級與防洗盤機制 (SHAKEOUT_HOLD vs CONFIRMED_STOP_LOSS)
      let decisionRating: 'BUY' | 'HOLD' | 'TRIM' | 'SELL' | 'SHAKEOUT_HOLD' | 'CONFIRMED_STOP_LOSS' = 'BUY';

      if (diag) {
        decisionRating = diag.decisionRating;
        if (diag.decisionRating === 'SHAKEOUT_HOLD') {
          healthAlerts.push({
            type: 'SHAKEOUT_HOLD',
            title: '主力洗盤甩轎・建議續抱',
            description: diag.diagnosticNote || '雖跌破 20MA，但法人未出貨，融資大減浮額沉澱，判定為主力量縮洗盤，給予 1~2 日防守緩衝，暫不停損。',
            severity: 'shakeout',
          });
        } else if (diag.decisionRating === 'CONFIRMED_STOP_LOSS') {
          healthAlerts.push({
            type: 'CONFIRMED_STOP_LOSS',
            title: '破線出貨・執行停損',
            description: diag.diagnosticNote || '跌破 20MA 防守點，且伴隨法人大額出貨，多頭架構已破壞，請嚴格執行紀律出場。',
            severity: 'danger',
          });
        } else if (diag.decisionRating === 'SELL') {
          healthAlerts.push({
            type: 'RATING_BEARISH',
            title: '決策評級翻空 (SELL)',
            description: diag.diagnosticNote || '綜合技術與籌碼結構轉弱，建議紀律出場。',
            severity: 'danger',
          });
        } else if (diag.decisionRating === 'TRIM') {
          healthAlerts.push({
            type: 'RATING_BEARISH',
            title: '決策評級轉為減碼 (TRIM)',
            description: diag.diagnosticNote || '波段上攻動能趨緩，建議部分獲利了結或減碼防守。',
            severity: 'warning',
          });
        }
      } else {
        // Fallback evaluation if server diagnostic is pending:
        if (isBelow20MA || curPrice < item.stopLossPrice) {
          // If trust is still buying or net lots positive: identify as SHAKEOUT_HOLD
          if (trustDays > 0 || (item.trustNetBuyLots && item.trustNetBuyLots > 0)) {
            decisionRating = 'SHAKEOUT_HOLD';
            healthAlerts.push({
              type: 'SHAKEOUT_HOLD',
              title: '主力洗盤甩轎・建議續抱',
              description: `雖跌破 20MA 防守價，但法人籌碼未出脫（投信連買 ${trustDays} 日），判定為主力量縮洗盤，給予 1~2 日防守緩衝，暫不停損。`,
              severity: 'shakeout',
            });
          } else {
            decisionRating = 'CONFIRMED_STOP_LOSS';
            healthAlerts.push({
              type: 'CONFIRMED_STOP_LOSS',
              title: '破線出貨・執行停損',
              description: `跌破 20MA 防守點，多頭架構已破壞，請嚴格執行紀律出場。`,
              severity: 'danger',
            });
          }
        } else if (isMaBearish || isTrustSelling || curPrice < item.entryPrice * 0.96) {
          decisionRating = 'TRIM';
          healthAlerts.push({
            type: 'RATING_BEARISH',
            title: '決策評級轉為減碼 (TRIM)',
            description: `波段上攻動能趨緩，決策評級轉為「TRIM (減碼防守)」，建議獲利了結或縮減持股部位。`,
            severity: 'warning',
          });
        }
      }

      // If stock is SHAKEOUT_HOLD, isStopLossTriggered is overridden to false to prevent premature panic stop loss
      const finalStopLossTriggered = decisionRating === 'SHAKEOUT_HOLD' ? false : (curPrice < item.stopLossPrice || decisionRating === 'CONFIRMED_STOP_LOSS');
      const isTargetTriggered = curPrice >= item.targetPrice;

      return {
        ...item,
        currentPrice: curPrice,
        change,
        changePercent,
        updateTime,
        unrealizedPL,
        returnPct,
        feeDiscount,
        feeCostTotal,
        netPL,
        netReturnPct,
        isStopLossTriggered: finalStopLossTriggered,
        isTargetTriggered,
        ma5,
        ma10,
        ma20,
        trustNetBuyDays: trustDays,
        decisionRating,
        diagnosticNote: diag?.diagnosticNote,
        volumeLots: diag?.volumeLots,
        volumeAvg5d: diag?.volumeAvg5d,
        foreignNetLots: diag?.foreignNetLots,
        marginChangeLots: diag?.marginChangeLots,
        healthAlerts,
      };
    });
  }, [portfolio, screenerData, turnaroundData, watchlistQuotes, watchlistDiagnostics]);


  // Synchronize detected health alerts into NotificationCenter
  useEffect(() => {
    if (enrichedPortfolio.length === 0) return;

    setNotifications((prev) => {
      const existingIds = new Set(prev.map((n) => n.id));
      const todayStr = new Date().toISOString().split('T')[0];
      const newItems: NotificationItem[] = [];

      for (const stock of enrichedPortfolio) {
        if (stock.healthAlerts && stock.healthAlerts.length > 0) {
          for (const alert of stock.healthAlerts) {
            const id = `alert-${stock.symbol}-${alert.type}-${todayStr}`;
            if (!existingIds.has(id)) {
              newItems.push({
                id,
                stockSymbol: stock.symbol,
                stockName: stock.name,
                type: alert.severity,
                title: alert.title,
                message: `${stock.name} (${stock.symbol}) ${alert.description}`,
                alertType: alert.type,
                timestamp: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }),
                isRead: false,
              });
            }
          }
        }
      }

      if (newItems.length > 0) {
        return [...newItems, ...prev];
      }
      return prev;
    });
  }, [enrichedPortfolio]);

  // Unread notification count
  const unreadAlertCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  // Count of stocks currently triggering health alert in watchlist
  const alertWatchlistCount = useMemo(() => {
    return enrichedPortfolio.filter((p) => p.healthAlerts && p.healthAlerts.length > 0).length;
  }, [enrichedPortfolio]);

  // Mark all notifications as read
  const handleMarkAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  // Clear all notifications
  const handleClearAllNotifications = () => {
    setNotifications([]);
  };

  // Handle click on stock from notification
  const handleSelectStockFromNotification = (symbol: string) => {
    setActiveModule('watchlist');
    setSearchQuery(symbol);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      {/* ========================================================================= */}
      {/* 1. TOP NAVBAR (Search bar is persistent on all screen sizes, no hidden sm:block) */}
      {/* ========================================================================= */}
      <Navbar
        activeModule={activeModule}
        setActiveModule={setActiveModule}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        unreadAlertCount={unreadAlertCount}
        screenerMatchedCount={
          (screenerData?.totalMatched ?? 0) + (turnaroundData?.totalMatched ?? 0)
        }
        watchlistCount={portfolio.length}
        alertWatchlistCount={alertWatchlistCount}
        onToggleNotificationCenter={() => setIsNotificationCenterOpen((prev) => !prev)}
        isNotificationCenterOpen={isNotificationCenterOpen}
        onOpenStrategyAudit={handleOpenStrategyAudit}
      />

      {/* Notification Center Popover */}
      <NotificationCenter
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
        notifications={notifications}
        onMarkAllAsRead={handleMarkAllNotificationsAsRead}
        onClearAll={handleClearAllNotifications}
        onSelectStock={handleSelectStockFromNotification}
        onRemoveStockFromWatchlist={handleRemovePortfolioItemBySymbol}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 pb-32 space-y-6">
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
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-rose-400" />
                    大盤核心即時三大指數
                  </h2>
                  <button
                    onClick={handleRefreshMarket}
                    disabled={isMarketRefreshing}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 text-xs font-semibold text-slate-200 hover:text-white transition disabled:opacity-50 shadow-sm cursor-pointer"
                    title="點擊立即重新整理大盤核心三大指數最新撮合行情"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${
                        isMarketRefreshing ? 'animate-spin text-rose-400' : 'text-slate-400'
                      }`}
                    />
                    <span>{isMarketRefreshing ? '即時更新中...' : '重新整理指數'}</span>
                  </button>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>臺灣證交所 MIS &amp; Yahoo 全時直連</span>
                </div>
              </div>

              {isMarketLoading && !marketData ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-32 rounded-2xl bg-slate-900 border border-slate-800 animate-pulse p-5"
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* 加權指數 (TAIEX) */}
                  <div className="rounded-2xl bg-gradient-to-b from-slate-900 to-slate-900/80 border border-slate-800 p-5 shadow-sm hover:border-slate-700 transition">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span className="font-semibold text-slate-300">加權指數 (TAIEX)</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        集中市場實報
                      </span>
                    </div>
                    {marketData?.taiex ? (
                      <div>
                        <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
                          {marketData.taiex.price.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
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
                            {marketData.taiex.change.toFixed(2)} (
                            {marketData.taiex.changePercent > 0 ? '+' : ''}
                            {marketData.taiex.changePercent.toFixed(2)}%)
                          </span>
                          <span className="text-xs text-slate-500">
                            昨收 {marketData.taiex.prevClose.toFixed(2)}
                          </span>
                        </div>
                        {marketData.taiex.volume ? (
                          <div className="text-xs text-slate-400 mt-2 pt-2 border-t border-slate-800/80 flex justify-between">
                            <span>成交金額</span>
                            <span className="text-slate-300 font-medium">
                              約 {marketData.taiex.volume} 億元
                            </span>
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
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        中小型成長股動能
                      </span>
                    </div>
                    {marketData?.tpex ? (
                      <div>
                        <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
                          {marketData.tpex.price.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
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
                            {marketData.tpex.change.toFixed(2)} (
                            {marketData.tpex.changePercent > 0 ? '+' : ''}
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
                          {marketData.wtx.price.toLocaleString(undefined, {
                            minimumFractionDigits: 0,
                          })}
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

            {/* 2. 美股四大指標橫幅 (真實數據前日昨收對比) */}
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
                          marketData.usIndices.sox.changePercent >= 0
                            ? 'text-rose-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {marketData.usIndices.sox.change >= 0 ? '+' : ''}
                        {marketData.usIndices.sox.change.toFixed(2)} (
                        {marketData.usIndices.sox.changePercent > 0 ? '+' : ''}
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
                          marketData.usIndices.tsm.changePercent >= 0
                            ? 'text-rose-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {marketData.usIndices.tsm.change >= 0 ? '+' : ''}
                        {marketData.usIndices.tsm.change.toFixed(2)} (
                        {marketData.usIndices.tsm.changePercent > 0 ? '+' : ''}
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
                          marketData.usIndices.nasdaq.changePercent >= 0
                            ? 'text-rose-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {marketData.usIndices.nasdaq.change >= 0 ? '+' : ''}
                        {marketData.usIndices.nasdaq.change.toFixed(2)} (
                        {marketData.usIndices.nasdaq.changePercent > 0 ? '+' : ''}
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
                          marketData.usIndices.dow.changePercent >= 0
                            ? 'text-rose-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {marketData.usIndices.dow.change >= 0 ? '+' : ''}
                        {marketData.usIndices.dow.change.toFixed(2)} (
                        {marketData.usIndices.dow.changePercent > 0 ? '+' : ''}
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

            {/* 3. 升級版每日深度操盤早報 (Gemini 2.5 Pro 旗艦推理 + 手動觸發機制 + 當日持久快取) */}
            <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-2xl p-5 sm:p-7 relative overflow-hidden">
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
                        {morningBriefing?.model && morningBriefing.isGenerated !== false
                          ? `${morningBriefing.model} 旗艦推理`
                          : 'Gemini 2.5 Pro 旗艦推理'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      美股四大指標 + 台指期夜盤 + 外資期貨淨留倉與三大法人籌碼深層因果推演
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {morningBriefing && morningBriefing.isGenerated !== false && morningBriefing.markdown && (
                    <button
                      onClick={() => loadBriefing(true)}
                      disabled={isBriefingGenerating}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
                      title="手動重新調用 Gemini 2.5 Pro 重整最新戰報"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${
                          isBriefingGenerating ? 'animate-spin text-amber-400' : ''
                        }`}
                      />
                      <span>{isBriefingGenerating ? '深度推演中...' : '🔄 重新產出'}</span>
                    </button>
                  )}

                  <button
                    onClick={() => setIsBriefingExpanded((prev) => !prev)}
                    className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                    title={isBriefingExpanded ? '收合早報' : '展開早報'}
                  >
                    {isBriefingExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
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
              ) : isBriefingGenerating ? (
                <div className="mt-5 p-8 rounded-2xl bg-slate-950/90 border border-indigo-500/30 flex flex-col items-center justify-center text-center space-y-4 shadow-2xl">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-rose-500 to-amber-500 animate-spin flex items-center justify-center p-1">
                      <div className="w-full h-full bg-slate-950 rounded-xl flex items-center justify-center">
                        <Sparkles className="w-7 h-7 text-amber-400 animate-pulse" />
                      </div>
                    </div>
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500"></span>
                    </span>
                  </div>
                  <div>
                    <h4 className="text-base sm:text-lg font-bold text-white flex items-center justify-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-400" />
                      Gemini 2.5 Pro 深度推演中...
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md">
                      正在全維度推演昨夜費半、台積電 ADR、台指期夜盤及外資期貨淨留倉對今日開盤之衝擊影響...
                    </p>
                  </div>
                  <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-500 w-full animate-pulse" />
                  </div>
                </div>
              ) : (!morningBriefing || morningBriefing.isGenerated === false || !morningBriefing.markdown) ? (
                <div className="mt-5 p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-amber-950/20 via-slate-950 to-slate-900 border border-amber-500/30 text-center flex flex-col items-center justify-center shadow-inner">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-rose-500/20 border border-amber-500/30 flex items-center justify-center text-2xl mb-3 shadow-md">
                    ☕
                  </div>
                  <h4 className="text-lg sm:text-xl font-bold text-white tracking-wide">
                    今日盤前操盤戰報尚未產出
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-md leading-relaxed">
                    建議於早上 08:00 ~ 08:50，外圍美股與台指期夜盤正式收盤後點擊產出。
                  </p>
                  <button
                    onClick={() => loadBriefing(true)}
                    disabled={isBriefingGenerating}
                    className="mt-5 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 hover:from-amber-400 hover:via-rose-400 hover:to-indigo-500 text-white font-bold text-sm sm:text-base shadow-lg shadow-rose-950/60 hover:shadow-rose-900/80 transition-all flex items-center gap-2.5 transform active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-5 h-5 text-amber-200" />
                    <span>⚡ 立即產出今日操盤戰報 (Gemini 2.5 Pro)</span>
                  </button>
                </div>
              ) : morningBriefing && isBriefingExpanded ? (
                <div className="mt-5 p-5 rounded-2xl bg-slate-950/80 border border-slate-800/90 shadow-inner">
                  <MarkdownRenderer content={morningBriefing.markdown} />
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1.5 text-indigo-400/90 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      當日持久快取生效中（Gemini 2.5 Pro 旗艦深度推演・0秒秒開）
                    </span>
                    <button
                      onClick={() => loadBriefing(true)}
                      disabled={isBriefingGenerating}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-indigo-300 hover:text-white border border-indigo-500/30 text-[11px] font-medium flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
                      title="重新呼叫 Gemini 2.5 Pro 進行全維度即時深度推演"
                    >
                      <RefreshCw
                        className={`w-3 h-3 ${isBriefingGenerating ? 'animate-spin text-amber-400' : ''}`}
                      />
                      <span>{isBriefingGenerating ? '深度推演中...' : '🔄 重新產出最新戰報'}</span>
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODULE 2: 波段股票篩選器                                                   */}
        {/* ========================================================================= */}
        {activeModule === 'screener' && (
          <div className="space-y-6 animate-fadeIn">
            {/* 雙軌時間自動切換頂部醒目標示 */}
            {(() => {
              const activeMode =
                strategyMode === 'momentum'
                  ? screenerData?.mode
                  : turnaroundData?.mode || screenerData?.mode;
              const activeUpdated =
                strategyMode === 'momentum'
                  ? screenerData?.lastUpdated
                  : turnaroundData?.lastUpdated || screenerData?.lastUpdated;

              return (
                <div
                  className={`p-4 sm:p-5 rounded-3xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all shadow-xl ${
                    activeMode === 'intraday'
                      ? 'bg-gradient-to-r from-emerald-950/80 via-slate-900 to-emerald-950/60 border-emerald-500/60 shadow-emerald-950/30'
                      : 'bg-gradient-to-r from-blue-950/80 via-slate-900 to-indigo-950/60 border-blue-500/60 shadow-blue-950/30'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner ${
                        activeMode === 'intraday'
                          ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400'
                          : 'bg-blue-500/20 border border-blue-500/50 text-blue-400'
                      }`}
                    >
                      <Activity
                        className={`w-6 h-6 ${
                          activeMode === 'intraday' ? 'animate-pulse text-emerald-400' : ''
                        }`}
                      />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                          {activeMode === 'intraday'
                            ? '🟢 盤中即時雷達監控中（臺灣證交所官方直連撮合）'
                            : '🔵 盤後官方籌碼正式結算完成'}
                        </h3>
                        <span
                          className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full border font-semibold ${
                            activeMode === 'intraday'
                              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                              : 'bg-blue-500/15 border-blue-500/40 text-blue-300'
                          }`}
                        >
                          {activeMode === 'intraday'
                            ? '09:00~13:30 MIS 即時撮合'
                            : '15:30後 官方正式結算'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        {activeMode === 'intraday'
                          ? strategyMode === 'momentum'
                            ? '直接介接臺灣證交所 MIS 撮合成交價與累計成交量，依「開盤分鐘數」預估全日量能，嚴禁消耗 FinMind 額度。'
                            : '直接介接臺灣證交所 MIS 撮合成交價與累計張數，盤中 100% 直連更新且不消耗 FinMind 額度。'
                          : '整合臺灣證交所與 FinMind 正式收盤價與三大法人買賣超正式數據，驗證投信大買，產出明日精選名單。'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-800">
                    {activeUpdated && (
                      <div className="text-left md:text-right">
                        <div className="text-[10px] text-slate-400">撮合更新時間</div>
                        <div className="text-xs font-mono font-bold text-slate-200">
                          {activeUpdated}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handleForceRefresh}
                      disabled={isRefreshing}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer ${
                        activeMode === 'intraday'
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/40'
                          : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/40'
                      }`}
                      title="點擊立即獲取臺灣證交所最新撮合行情"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                      <span>{isRefreshing ? '撮合更新中...' : '重新整理行情'}</span>
                    </button>
                  </div>
                </div>
              );
            })()}

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
                <span>
                  雙重過濾機制：全面排除電信三雄、金融保險、油電燃氣牛皮股，鎖定動能突破 ≥ 2.5%、價值轉型 ≥ 2.2%與五大爆發白名單
                </span>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* 【四、 產業屬性與客觀量化波動度雙重過濾機制（嚴禁牛皮存股與電信業）】PANEL */}
            {/* ========================================================================= */}
            {/* ========================================================================= */}
            {/* 【四、 產業屬性與客觀量化波動度雙重過濾機制】極簡精緻面板 */}
            {/* ========================================================================= */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/60 pb-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-bold text-white">選股雙重過濾與產業聚焦</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                    量化防護
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  剔除牛皮存股，鎖定具爆發空間之強勢與轉型標的
                </div>
              </div>

              {/* 三大機制簡約卡片 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
                {/* 1. 產業黑名單 */}
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-rose-300 text-xs">
                    <Ban className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                    <span>1. 產業黑名單（全數剔除）</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    剔除<strong className="text-white">電信三雄</strong>、<strong className="text-white">金融保險</strong>、<strong className="text-white">公用事業與油電燃氣</strong>等低波動牛皮存股。
                  </p>
                </div>

                {/* 2. 客觀量化雙濾網 */}
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-300 text-xs">
                    <Zap className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    <span>2. 客觀量化雙濾網</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    20日 ATR 波動度 <strong className="text-white">≥ 2.5%</strong>（低基期 <strong className="text-white">≥ 2.2%</strong>）、5日均量 <strong className="text-white">&gt; 1,000 張</strong>、股價 <strong className="text-white">15 ~ 500 元</strong>。
                  </p>
                </div>

                {/* 3. 優先聚焦五大產業白名單 */}
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-300 text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span>3. 聚焦五大產業白名單</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    聚焦 <strong className="text-white">AI 硬體周邊</strong>、<strong className="text-white">CoWoS/半導體設備</strong>、<strong className="text-white">CPO 矽光子</strong>、<strong className="text-white">重電儲能</strong>、<strong className="text-white">低基期轉型</strong>。
                  </p>
                </div>
              </div>

              {/* 產業白名單快速篩選按鈕列 */}
              <div className="pt-2 border-t border-slate-800/80">
                <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-2">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                  <span>產業白名單即時快篩：</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'all', label: '全部白名單標的', icon: Sparkles },
                    { id: 'ai', label: 'AI 硬體周邊', icon: Cpu },
                    { id: 'cowos', label: '半導體設備與 CoWoS', icon: Layers },
                    { id: 'cpo', label: 'CPO 矽光子與光通訊', icon: Zap },
                    { id: 'power', label: '重電電網與儲能', icon: Flame },
                    { id: 'turnaround', label: '低基期轉型爆發 (利基傳產/電子)', icon: Compass },
                  ].map((filter) => {
                    const Icon = filter.icon;
                    const isSelected = selectedIndustryFilter === filter.id;
                    return (
                      <button
                        key={filter.id}
                        onClick={() => setSelectedIndustryFilter(filter.id as any)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-rose-600 text-white shadow-md shadow-rose-900/30 ring-1 ring-rose-400'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{filter.label}</span>
                      </button>
                    );
                  })}
                </div>
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
                      ? screenerData?.mode === 'intraday'
                        ? `🟢 盤中進場訊號 (${screenerData?.totalMatched ?? 0} 檔)`
                        : `符合動能突破 (${screenerData?.totalMatched ?? 0} 檔)`
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
                      ? `投信連買監控池 (${screenerData?.totalScanned ?? 0} 檔)`
                      : `潛在價值轉型池 (${turnaroundData?.totalScanned ?? 0} 檔)`}
                  </span>
                </button>

                <button
                  onClick={() => setActiveModule('watchlist')}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 bg-slate-800 text-slate-400 hover:text-white"
                >
                  <Briefcase className="w-3.5 h-3.5 text-amber-400" />
                  <span>前往自選清單 ({portfolio.length} 檔)</span>
                </button>
              </div>

              {/* Cache status & Refresh Button */}
              <div className="flex items-center gap-3">
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>
                    {screenerData?.mode === 'intraday'
                      ? '盤中 15 秒即時撮合快取'
                      : '盤後官方籌碼結算快取 30 分鐘'}
                  </span>
                </div>

                <button
                  onClick={handleForceRefresh}
                  disabled={isRefreshing}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 disabled:opacity-50 transition"
                  title="重新整理獲取最新行情"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-rose-400' : ''}`}
                  />
                  <span>{isRefreshing ? '掃描中...' : '重新整理'}</span>
                </button>
              </div>
            </div>

            {/* TAB 1: MOMENTUM SCREENER CARDS */}
            {strategyMode === 'momentum' && (
              <div>
                {isScreenerLoading && !screenerData ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="h-64 rounded-3xl bg-slate-900 border border-slate-800 animate-pulse p-6"
                      />
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
                            stock.isIntradaySignal
                              ? 'border-emerald-500/80 hover:border-emerald-400 bg-gradient-to-b from-slate-900 via-emerald-950/25 to-slate-950 shadow-xl shadow-emerald-950/40 ring-1 ring-emerald-500/40'
                              : stock.isMatched
                              ? 'border-rose-500/40 hover:border-rose-500/80 bg-gradient-to-b from-slate-900 to-rose-950/10'
                              : 'border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div>
                            {/* Card Header */}
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <button
                                    onClick={() => handleOpenStockDetail(stock.symbol)}
                                    className="text-xl font-extrabold text-white hover:text-rose-400 transition cursor-pointer text-left"
                                    title="查看此股最近 5 日主力分點券商買賣超金額"
                                  >
                                    {stock.name}
                                  </button>
                                  <button
                                    onClick={() => handleOpenStockDetail(stock.symbol)}
                                    className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 transition cursor-pointer"
                                    title="查看此股最近 5 日主力分點券商買賣超金額"
                                  >
                                    {stock.symbol}
                                  </button>
                                  {stock.isIntradaySignal ? (
                                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-bold flex items-center gap-1.5 shadow-sm">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                      🟢 盤中即時進場訊號
                                    </span>
                                  ) : stock.isMatched ? (
                                    <span className="text-xs px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 font-medium">
                                      {screenerData?.mode === 'intraday' ? '動能蓄勢' : '🔵 盤後精選觀察'}
                                    </span>
                                  ) : (
                                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-medium">
                                      波段認養池
                                    </span>
                                  )}
                                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 font-semibold flex items-center gap-1">
                                    <Sparkles className="w-3 h-3 text-rose-400" />
                                    {stock.industryTheme || stock.industry}
                                  </span>
                                </div>
                                <div className="text-xs text-slate-400 mt-1">
                                  5MA ${stock.ma5.toFixed(1)} / 10MA ${stock.ma10.toFixed(1)} / 20MA
                                  ${stock.ma20.toFixed(1)}
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
                                  {stock.change.toFixed(2)} (
                                  {stock.changePercent > 0 ? '+' : ''}
                                  {stock.changePercent.toFixed(2)}%)
                                </div>
                              </div>
                            </div>

                            {/* Quant Indicators Row (5 Dimensions) */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mt-4 text-center">
                              <div
                                className={`p-2.5 rounded-xl border text-xs ${
                                  stock.isBullishMa
                                    ? stock.isIntradaySignal
                                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                                    : 'bg-slate-950 border-slate-800 text-slate-400'
                                }`}
                              >
                                <div className="text-[10px] text-slate-500 mb-0.5">均線排列</div>
                                <div className="font-bold">
                                  {stock.isBullishMa ? '5>10>20 多頭排列' : '整理未發散'}
                                </div>
                              </div>

                              <div
                                className={`p-2.5 rounded-xl border text-xs ${
                                  stock.isVolumeExpanding
                                    ? stock.isIntradaySignal
                                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                                      : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                                    : 'bg-slate-950 border-slate-800 text-slate-400'
                                }`}
                              >
                                <div className="text-[10px] text-slate-500 mb-0.5">
                                  {screenerData?.mode === 'intraday' ? '預估全天成交量' : '量能攻擊'}
                                </div>
                                <div className="font-bold">
                                  {screenerData?.mode === 'intraday' && stock.estVolume ? (
                                    <>
                                      {stock.estVolume.toLocaleString()} 張
                                      <span className="text-[10px] text-emerald-400 ml-1">
                                        ({stock.estVolumeRatio?.toFixed(1) || stock.volumeRatio.toFixed(1)}x)
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      {stock.volumeRatio.toFixed(1)}x 均量
                                      {stock.isVolumeExpanding ? ' (出量)' : ''}
                                    </>
                                  )}
                                </div>
                              </div>

                              <div
                                className={`p-2.5 rounded-xl border text-xs ${
                                  stock.isTrustAccumulating
                                    ? 'bg-purple-500/10 border-purple-500/30 text-purple-300'
                                    : 'bg-slate-950 border-slate-800 text-slate-400'
                                }`}
                              >
                                <div className="text-[10px] text-slate-500 mb-0.5">投信籌碼</div>
                                <div className="font-bold flex items-center justify-between">
                                  <span>
                                    {stock.consecutiveTrustDays > 0
                                      ? `連 ${stock.consecutiveTrustDays} 日買超`
                                      : '今日買超'}
                                  </span>
                                  <span className="font-mono text-rose-400 font-extrabold ml-1">
                                    {stock.trustNetLots > 0 ? '+' : ''}
                                    {stock.trustNetLots.toLocaleString()} 張
                                  </span>
                                </div>
                              </div>

                              {/* 20日 ATR% 波動度 */}
                              <div className="p-2.5 rounded-xl border text-xs bg-slate-950 border-slate-800 text-slate-300">
                                <div className="text-[10px] text-slate-500 mb-0.5">20日 ATR% 波動度</div>
                                <div className="font-bold text-emerald-400">
                                  {stock.atrPct ? `${stock.atrPct}%` : '≥2.5%'}
                                  <span className="text-[10px] text-emerald-500 font-normal ml-1">≥2.5% 達標 (高動能波段股)</span>
                                </div>
                              </div>

                              {/* 5日均量流動性 */}
                              <div className="p-2.5 rounded-xl border text-xs bg-slate-950 border-slate-800 text-slate-300 col-span-2 sm:col-span-1">
                                <div className="text-[10px] text-slate-500 mb-0.5">5日均量流動性</div>
                                <div className="font-bold text-sky-400">
                                  {stock.volumeAvg5d ? `${stock.volumeAvg5d.toLocaleString()} 張` : '>1,000張'}
                                  <span className="text-[10px] text-sky-500 font-normal ml-1">&gt;1,000張達標</span>
                                </div>
                              </div>
                            </div>

                            {/* Overheated Warning */}
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

                            {/* 三大法人當日籌碼買賣超與土洋對策 */}
                            <div className="mt-3 p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] font-semibold text-slate-400">法人籌碼走向</span>
                                  {stock.foreignNetLots !== null && stock.foreignNetLots > 0 && stock.trustNetLots > 0 ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 animate-pulse">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                      土洋同步作多
                                    </span>
                                  ) : stock.foreignNetLots !== null && stock.foreignNetLots < 0 && stock.trustNetLots > 0 ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                                      外資對作調節
                                    </span>
                                  ) : stock.trustNetLots > 0 ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                                      投信單獨認養
                                    </span>
                                  ) : null}
                                </div>

                                {stock.consecutiveTrustDays > 0 && (
                                  <span className="text-[10px] text-purple-300 font-mono">
                                    連 {stock.consecutiveTrustDays} 日買超
                                  </span>
                                )}
                              </div>

                              <div className="grid grid-cols-3 gap-1.5 sm:gap-2 pt-1 font-mono text-center">
                                <div className="p-1.5 rounded-xl bg-slate-900/90 border border-slate-800/80">
                                  <span className="text-[10px] text-slate-500 block font-sans">外資買賣超</span>
                                  <strong
                                    className={`text-[11px] sm:text-xs block font-bold whitespace-nowrap ${
                                      stock.foreignNetLots === null
                                        ? 'text-slate-500 font-normal'
                                        : stock.foreignNetLots > 0
                                        ? 'text-rose-400'
                                        : stock.foreignNetLots < 0
                                        ? 'text-emerald-400'
                                        : 'text-slate-300'
                                    }`}
                                  >
                                    {stock.foreignNetLots !== null
                                      ? `${stock.foreignNetLots > 0 ? '+' : ''}${stock.foreignNetLots.toLocaleString()} 張`
                                      : '無數據'}
                                  </strong>
                                </div>

                                <div className="p-1.5 rounded-xl bg-slate-900/90 border border-slate-800/80">
                                  <span className="text-[10px] text-slate-500 block font-sans">投信買賣超</span>
                                  <strong
                                    className={`text-[11px] sm:text-xs block font-bold whitespace-nowrap ${
                                      stock.trustNetLots > 0
                                        ? 'text-rose-400'
                                        : stock.trustNetLots < 0
                                        ? 'text-emerald-400'
                                        : 'text-slate-300'
                                    }`}
                                  >
                                    {stock.trustNetLots > 0 ? '+' : ''}
                                    {stock.trustNetLots.toLocaleString()} 張
                                  </strong>
                                </div>

                                <div className="p-1.5 rounded-xl bg-slate-900/90 border border-slate-800/80">
                                  <span className="text-[10px] text-slate-500 block font-sans">自營商</span>
                                  <strong
                                    className={`text-[11px] sm:text-xs block font-bold whitespace-nowrap ${
                                      stock.dealerNetLots === null
                                        ? 'text-slate-500 font-normal'
                                        : stock.dealerNetLots > 0
                                        ? 'text-rose-400'
                                        : stock.dealerNetLots < 0
                                        ? 'text-emerald-400'
                                        : 'text-slate-300'
                                    }`}
                                  >
                                    {stock.dealerNetLots !== null
                                      ? `${stock.dealerNetLots > 0 ? '+' : ''}${stock.dealerNetLots.toLocaleString()} 張`
                                      : '無數據'}
                                  </strong>
                                </div>
                              </div>
                            </div>

                            {/* Quant Anchors */}
                            <div
                              className={`mt-3.5 p-3.5 rounded-2xl border space-y-2 ${
                                stock.isIntradaySignal
                                  ? 'bg-slate-950/90 border-emerald-500/40'
                                  : 'bg-slate-950/80 border-slate-800/80'
                              }`}
                            >
                              <div className="text-[11px] font-semibold flex items-center justify-between">
                                <span className={stock.isIntradaySignal ? 'text-emerald-300 font-bold' : 'text-slate-400'}>
                                  {stock.isIntradaySignal ? '🟢 盤中即時進場錨定 (盈虧比 1:2)' : '波段量化錨定 (盈虧比 1:2)'}
                                </span>
                                <span className="text-slate-500 font-mono text-[10px]">
                                  當周低點 ${stock.weeklyLow.toFixed(1)}
                                </span>
                              </div>

                              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                <div
                                  className={`p-2 rounded-xl border ${
                                    stock.isIntradaySignal
                                      ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-200'
                                      : 'bg-slate-900 border-slate-800 text-slate-200'
                                  }`}
                                >
                                  <div className="text-[10px] text-emerald-400 font-medium">即時進場點</div>
                                  <div className="font-extrabold text-base text-white mt-0.5">
                                    ${stock.suggestedEntryPrice.toFixed(1)}
                                  </div>
                                </div>

                                <div className="p-2 rounded-xl bg-amber-950/40 border border-amber-900/60">
                                  <div className="text-[10px] text-amber-400 font-medium">建議防守價 (20MA)</div>
                                  <div className="font-extrabold text-base text-amber-300 mt-0.5">
                                    ${stock.stopLossPrice.toFixed(1)}
                                  </div>
                                </div>

                                <div className="p-2 rounded-xl bg-rose-950/40 border border-rose-900/60">
                                  <div className="text-[10px] text-rose-400 font-medium">目標獲利價</div>
                                  <div className="font-extrabold text-base text-rose-300 mt-0.5">
                                    ${stock.targetPrice.toFixed(1)}
                                  </div>
                                </div>
                              </div>

                              <div className="text-[11px] text-slate-400 pt-1 flex items-center justify-between">
                                <span>{stock.actionNote}</span>
                              </div>
                            </div>
                          </div>

                          {/* Action Button & Match Time */}
                          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                            <div className="text-xs text-slate-400 flex items-center gap-2">
                              <span>成交量 {stock.volume.toLocaleString()} 張</span>
                              {stock.updateTime && (
                                <span className="text-[10px] text-slate-500 font-mono px-1.5 py-0.5 rounded bg-slate-950">
                                  撮合 {stock.updateTime}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleOpenStockDetail(stock.symbol)}
                                className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 flex items-center gap-1 transition cursor-pointer shadow-sm"
                                title="查看最近 5 日成交量最大前 5 家券商買賣超金額"
                              >
                                <Building2 className="w-3.5 h-3.5" />
                                <span>主力籌碼</span>
                              </button>

                              <button
                                onClick={() => handleToggleMomentumPortfolio(stock)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                                  inPortfolio
                                    ? 'bg-slate-800 text-rose-400 border border-rose-500/30 hover:bg-slate-750'
                                    : stock.isIntradaySignal
                                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40'
                                    : 'bg-rose-600 hover:bg-rose-500 text-white shadow'
                                }`}
                              >
                                {inPortfolio ? (
                                  <>
                                    <Check className="w-3.5 h-3.5" />
                                    <span>已在自選</span>
                                  </>
                                ) : (
                                  <>
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>加入自選</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: TURNAROUND VALUE SCREENER CARDS */}
            {strategyMode === 'turnaround' && (
              <div>
                {isTurnaroundLoading && !turnaroundData ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="h-64 rounded-3xl bg-slate-900 border border-slate-800 animate-pulse p-6"
                      />
                    ))}
                  </div>
                ) : displayedTurnaroundStocks.length === 0 ? (
                  <div className="p-12 text-center rounded-3xl bg-slate-900/60 border border-slate-800 text-slate-400">
                    <Compass className="w-12 h-12 text-indigo-400/50 mx-auto mb-3" />
                    <p className="text-lg font-bold text-slate-200">
                      今日無符合低基期轉型之安全標的
                    </p>
                    <p className="text-xs text-slate-400 mt-2 max-w-lg mx-auto leading-relaxed">
                      系統遵循嚴格量化紀律（近一年位階 &le; 35% 低檔、現價站穩 20MA 且均線走平微揚、單月營收 YoY &ge; 8%、5日均量 &gt; 1,000張、ATR% &ge; 2.2%），絕不濫竽充數推薦未達標標的。
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
                            {/* Card Header */}
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <button
                                    onClick={() => handleOpenStockDetail(stock.symbol)}
                                    className="text-xl font-extrabold text-white hover:text-indigo-400 transition cursor-pointer text-left"
                                    title="查看此股最近 5 日主力分點券商買賣超金額"
                                  >
                                    {stock.name}
                                  </button>
                                  <button
                                    onClick={() => handleOpenStockDetail(stock.symbol)}
                                    className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 transition cursor-pointer"
                                    title="查看此股最近 5 日主力分點券商買賣超金額"
                                  >
                                    {stock.symbol}
                                  </button>
                                  <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-medium">
                                    {stock.industry}
                                  </span>
                                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-gradient-to-r from-indigo-500/15 to-purple-500/15 border border-indigo-500/30 text-indigo-200 font-semibold flex items-center gap-1">
                                    <Sparkles className="w-3 h-3 text-indigo-400" />
                                    {stock.industryTheme || stock.industry}
                                  </span>
                                  {turnaroundData?.mode === 'intraday' && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-semibold flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                      盤中即時報價
                                    </span>
                                  )}
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
                                  {stock.change.toFixed(2)} (
                                  {stock.changePercent > 0 ? '+' : ''}
                                  {stock.changePercent.toFixed(2)}%)
                                </div>
                              </div>
                            </div>

                            {/* Position Bar */}
                            <div className="mt-3">
                              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                                <span>近 1 年股價位階區間</span>
                                <span className={`font-bold ${stock.isLowBase ? 'text-indigo-300' : 'text-amber-400'}`}>
                                  {stock.positionPct}% {stock.isLowBase ? '低檔安全區間' : '高於35%門檻'}
                                </span>
                              </div>
                              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
                                <div
                                  className="h-full bg-gradient-to-r from-emerald-500 via-indigo-500 to-rose-500"
                                  style={{
                                    width: `${Math.min(100, Math.max(5, stock.positionPct))}%`,
                                  }}
                                />
                              </div>
                              <div className="flex justify-between text-[10px] text-slate-500 mt-0.5 font-mono">
                                <span>年低 ${stock.yearLow}</span>
                                <span className="text-indigo-400">35% 低檔閥值</span>
                                <span>年高 ${stock.yearHigh}</span>
                              </div>
                            </div>

                            {/* Quant Indicators Row (5 Dimensions) */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mt-3.5 text-center">
                              <div
                                className={`p-2 rounded-xl border text-xs ${
                                  stock.isRevGrowing
                                    ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                                    : 'bg-slate-950 border-slate-800 text-slate-400'
                                }`}
                              >
                                <div className="text-[10px] text-slate-500 mb-0.5">
                                  最新營收年增率
                                </div>
                                <div className="font-bold">
                                  YoY +{stock.revenueYoY.toFixed(1)}%
                                </div>
                              </div>

                              <div
                                className={`p-2 rounded-xl border text-xs ${
                                  stock.isProfitable
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                                    : 'bg-slate-950 border-slate-800 text-slate-400'
                                }`}
                              >
                                <div className="text-[10px] text-slate-500 mb-0.5">
                                  近四季累計 EPS
                                </div>
                                <div className="font-bold">
                                  {stock.eps4Q !== null && stock.eps4Q !== undefined
                                    ? `$${stock.eps4Q.toFixed(2)} 元`
                                    : '未揭露'}
                                </div>
                              </div>

                              <div
                                className={`p-2 rounded-xl border text-xs ${
                                  stock.isSafeBottom
                                    ? 'bg-purple-500/10 border-purple-500/30 text-purple-300'
                                    : stock.price < stock.stopLossPrice
                                    ? 'bg-rose-950/25 border-rose-800/40 text-rose-300'
                                    : 'bg-slate-950 border-slate-800 text-slate-400'
                                }`}
                              >
                                <div className="text-[10px] text-slate-500 mb-0.5">
                                  20MA 剛性安全閥
                                </div>
                                <div className="font-bold">
                                  {stock.isSafeBottom
                                    ? '站上20MA微揚'
                                    : stock.price < stock.stopLossPrice
                                    ? '跌破20MA弱勢'
                                    : '均線整理中'}
                                </div>
                              </div>

                              {/* 20日 ATR% 波動度 */}
                              <div className="p-2 rounded-xl border text-xs bg-slate-950 border-slate-800 text-slate-300">
                                <div className="text-[10px] text-slate-500 mb-0.5">20日 ATR% 波動度</div>
                                <div className="font-bold text-emerald-400">
                                  {stock.atrPct ? `${stock.atrPct}%` : '≥2.2%'}
                                  <span className="text-[10px] text-emerald-500 font-normal ml-1">≥2.2% 達標</span>
                                </div>
                              </div>

                              {/* 5日均量流動性 */}
                              <div className="p-2 rounded-xl border text-xs bg-slate-950 border-slate-800 text-slate-300 col-span-2 sm:col-span-1">
                                <div className="text-[10px] text-slate-500 mb-0.5">5日均量流動性</div>
                                <div className="font-bold text-sky-400">
                                  {stock.volumeAvg5d ? `${stock.volumeAvg5d.toLocaleString()} 張` : '>1,000張'}
                                  <span className="text-[10px] text-sky-500 font-normal ml-1">&gt;1,000張達標</span>
                                </div>
                              </div>
                            </div>

                            {/* Catalyst Description */}
                            <div className="mt-3.5 p-3.5 rounded-2xl bg-indigo-950/20 border border-indigo-900/50 space-y-1.5">
                              <div className="text-[11px] font-bold text-indigo-300 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                                <span>全市場動態轉型爆發剖析</span>
                              </div>
                              <p className="text-xs text-slate-300 leading-relaxed">
                                {stock.catalyst}
                              </p>
                            </div>

                            {/* Anchors */}
                            <div className="mt-3 p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between text-xs">
                              <div>
                                <span className="text-[10px] text-slate-500 block">
                                  建議防守價 (20MA 停損)
                                </span>
                                <span className="font-bold text-emerald-400">
                                  ${stock.stopLossPrice.toFixed(2)} (跌破 20MA 出場)
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] text-slate-500 block">
                                  潛在波段獲利目標
                                </span>
                                <span className="font-bold text-indigo-300">
                                  ${(stock.price * 1.35).toFixed(1)} (+35%)
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Action Button & Time/Volume */}
                          <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                            <div className="text-xs text-slate-400 flex items-center gap-2">
                              {stock.volume !== undefined && (
                                <span>成交量 {stock.volume.toLocaleString()} 張</span>
                              )}
                              {stock.updateTime && (
                                <span className="text-[10px] text-slate-500 font-mono px-1.5 py-0.5 rounded bg-slate-950">
                                  撮合 {stock.updateTime}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleOpenStockDetail(stock.symbol)}
                                className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 flex items-center gap-1 transition cursor-pointer shadow-sm"
                                title="查看最近 5 日成交量最大前 5 家券商買賣超金額"
                              >
                                <Building2 className="w-3.5 h-3.5" />
                                <span>主力籌碼</span>
                              </button>

                              <button
                                onClick={() => handleToggleTurnaroundPortfolio(stock)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                                  inPortfolio
                                    ? 'bg-slate-800 text-indigo-400 border border-indigo-500/30 hover:bg-slate-700'
                                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow'
                                }`}
                              >
                                {inPortfolio ? (
                                  <>
                                    <Check className="w-3.5 h-3.5" />
                                    <span>已在自選</span>
                                  </>
                                ) : (
                                  <>
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>加入自選</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODULE 3: 自選股清單 (WatchlistView) 與波段健康度警報機制                    */}
        {/* ========================================================================= */}
        {activeModule === 'watchlist' && (
          <WatchlistView
            portfolio={enrichedPortfolio}
            tradeHistory={tradeHistory}
            initialCapital={initialCapital}
            syncStatus={syncStatus}
            onUpdateInitialCapital={handleUpdateInitialCapital}
            onClosePosition={handleClosePosition}
            onDeleteTradeRecord={handleDeleteTradeRecord}
            onUpdateItem={handleUpdatePortfolioItem}
            onRemoveItem={handleRemovePortfolioItem}
            onNavigateToScreener={() => setActiveModule('screener')}
            searchQuery={searchQuery}
            onRefreshQuotes={refreshWatchlistQuotes}
            isRefreshingQuotes={isRefreshingWatchlistQuotes}
            lastQuotesUpdatedAt={lastWatchlistQuotesUpdatedAt}
            onOpenStockDetail={handleOpenStockDetail}
            onAddStockBySymbol={handleAddStockBySymbol}
            watchlistBriefing={watchlistBriefing}
            isBriefingLoading={isWatchlistBriefingLoading}
            isBriefingGenerating={isWatchlistBriefingGenerating}
            onGenerateBriefing={loadWatchlistBriefing}
            onExportBackup={handleExportBackup}
            onImportBackup={handleImportBackup}
          />
        )}
      </main>

      {/* ========================================================================= */}
      {/* 股票詳情與主力分點籌碼統計面板 (Stock Detail & Top 5 Brokers Modal)         */}
      {/* ========================================================================= */}
      {selectedStockSymbol && (
        <StockDetailModal
          symbol={selectedStockSymbol}
          isOpen={isStockDetailOpen}
          onClose={handleCloseStockDetail}
          isInPortfolio={portfolio.some((p) => p.symbol === selectedStockSymbol)}
          onTogglePortfolio={(stk) => {
            const exists = portfolio.some((p) => p.symbol === stk.symbol);
            if (exists) {
              setPortfolio((prev) => prev.filter((p) => p.symbol !== stk.symbol));
            } else {
              handleAddStockBySymbol(stk.symbol);
            }
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* 個股量化雙策略體檢對話框 (Stock Strategy Audit Modal)                     */}
      {/* ========================================================================= */}
      {auditSymbol && (
        <StockStrategyAuditModal
          symbol={auditSymbol}
          isOpen={isAuditModalOpen}
          onClose={handleCloseStrategyAudit}
          onOpenStockDetail={handleOpenStockDetail}
          onAddToPortfolio={handleAddStockBySymbol}
          isInPortfolio={portfolio.some((p) => p.symbol === auditSymbol)}
        />
      )}
    </div>
  );
}

