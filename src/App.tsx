import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Stock, RadarSignal, PriceAlert, AlertCondition } from './types/stock';
import { INITIAL_STOCKS, INITIAL_STOCKS_CONFIG } from './data/mockStocks';
import { Navbar, MainTab } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { StockChart } from './components/StockChart';
import { MoneyRadarView } from './components/MoneyRadarView';
import { WatchlistView } from './components/WatchlistView';
import { ChipsView } from './components/ChipsView';
import { AlertsManagerView } from './components/AlertsManagerView';
import { NotificationCenter } from './components/NotificationCenter';
import { ToastAlert, ToastData } from './components/ToastAlert';
import { AlertModal } from './components/AlertModal';
import { ScreenerDecisionView } from './components/ScreenerDecisionView';
import { SwingPortfolioView } from './components/SwingPortfolioView';
import { StockDeepResearchModal } from './components/StockDeepResearchModal';
import { PaperTradingView } from './components/PaperTradingView';
import { SectorFlowView } from './components/SectorFlowView';
import { playBreakoutSound, playAlertPing } from './utils/audio';
import { calculateSupportResistance, enrichKlineData } from './utils/indicators';
import { getTaipeiMarketSession } from './utils/marketTime';
import { fetchAllStocks, fetchSingleStock, fetchMarketIndex, MarketIndexData } from './services/stockApi';
import { RefreshCw, Radio, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [stocks, setStocks] = useState<Stock[]>(INITIAL_STOCKS);
  const [marketIndex, setMarketIndex] = useState<MarketIndexData | null>(null);
  const [isLiveLoading, setIsLiveLoading] = useState<boolean>(false);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>('');

  const [watchlistSymbols, setWatchlistSymbols] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('tw_radar_watchlist');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return ['5274', '3529', '6669', '2330', '3081', '8086', '4583', '6187', '1513', '3363'];
  });

  const [selectedSymbol, setSelectedSymbol] = useState<string>('2330');
  const [activeTab, setActiveTab] = useState<MainTab>('radar');
  const [colorMode, setColorMode] = useState<'tw' | 'intl'>('tw');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [deepResearchStock, setDeepResearchStock] = useState<Stock | null>(null);

  // Quick search any stock symbol from navbar or screener
  const handleQuickSearchStock = async (symbol: string) => {
    const cleanSym = symbol.trim();
    if (!cleanSym) return;

    const existing = stocks.find(
      (s) => s.symbol.toUpperCase() === cleanSym.toUpperCase() || s.name.includes(cleanSym)
    );
    if (existing) {
      setSelectedSymbol(existing.symbol);
      setDeepResearchStock(existing);
      setActiveToast({
        id: `search-found-${Date.now()}`,
        type: 'radar',
        title: `已定位標的：${existing.name} (${existing.symbol})`,
        stockSymbol: existing.symbol,
        stockName: existing.name,
        description: `現價 ${existing.price} 元 (${existing.change >= 0 ? '+' : ''}${existing.changePercent}%)，已開啟該股完整技術型態與產業情報。`,
        timestamp: Date.now(),
      });
      return;
    }

    setIsLiveLoading(true);
    try {
      const fetched = await fetchSingleStock(cleanSym);
      if (fetched) {
        setStocks((prev) => [fetched, ...prev.filter((s) => s.symbol !== fetched.symbol)]);
        setSelectedSymbol(fetched.symbol);
        setDeepResearchStock(fetched);
        setActiveToast({
          id: `search-ok-${Date.now()}`,
          type: 'radar',
          title: `已載入即時行情：${fetched.name} (${fetched.symbol})`,
          stockSymbol: fetched.symbol,
          stockName: fetched.name,
          description: `最新報價 ${fetched.price} 元，已開啟完整技術型態與籌碼情報，可點擊加入自選股！`,
          timestamp: Date.now(),
        });
      } else {
        setActiveToast({
          id: `search-err-${Date.now()}`,
          type: 'alert',
          title: '個股查詢提示',
          stockSymbol: cleanSym,
          stockName: cleanSym,
          description: `查無標的「${cleanSym}」，請確認台股代號（如 2303, 3008, 6669）或名稱（如 聯電, 大立光, 緯穎）後重試。`,
          timestamp: Date.now(),
        });
      }
    } catch (e: any) {
      setActiveToast({
        id: `search-err-${Date.now()}`,
        type: 'alert',
        title: '查詢失敗',
        stockSymbol: cleanSym,
        stockName: cleanSym,
        description: '網路連線或伺服器逾時，請稍候重試。',
        timestamp: Date.now(),
      });
    } finally {
      setIsLiveLoading(false);
    }
  };

  // Notifications State
  const [notifications, setNotifications] = useState<any[]>(() => {
    return [
      {
        id: 'notif-1',
        type: 'radar',
        title: '【強勢突破】2330 台積電 突破平台壓力位',
        stockSymbol: '2330',
        stockName: '台積電',
        description: '以 2,565 元突破平台壓力線 2,550 元！成交量放大，支撐位 2,530 元，壓力位 2,580 元。',
        timestamp: Date.now() - 1000 * 60 * 15,
        read: false,
        triggerPrice: 2565,
        volume: 9740,
        volumeMultiple: 2.1,
        supportPrice: 2530,
        resistancePrice: 2580,
      },
      {
        id: 'notif-2',
        type: 'radar',
        title: '【爆量急湧】3017 奇鋐 資金雷達爆量突破',
        stockSymbol: '3017',
        stockName: '奇鋐',
        description: 'AI散熱族群獲大筆資金買盤點火，盤中突破 3,460 元關鍵阻力，多頭排列成形。',
        timestamp: Date.now() - 1000 * 60 * 35,
        read: false,
        triggerPrice: 3460,
        volume: 6820,
        volumeMultiple: 2.4,
        supportPrice: 3380,
        resistancePrice: 3550,
      },
    ];
  });

  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [activeToast, setActiveToast] = useState<ToastData | null>(null);

  // Custom Price Alerts State
  const [alerts, setAlerts] = useState<PriceAlert[]>(() => {
    try {
      const saved = localStorage.getItem('tw_radar_alerts');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: 'alert-init-1',
        symbol: '2330',
        stockName: '台積電',
        condition: 'PRICE_ABOVE',
        targetValue: 2580,
        active: true,
        triggered: false,
        createdAt: Date.now() - 1000 * 3600 * 2,
        note: '突破波段新高壓力加碼',
      },
      {
        id: 'alert-init-2',
        symbol: '2454',
        stockName: '聯發科',
        condition: 'PRICE_ABOVE',
        targetValue: 4800,
        active: true,
        triggered: false,
        createdAt: Date.now() - 1000 * 3600 * 3,
        note: '突破4800大關',
      },
      {
        id: 'alert-init-3',
        symbol: '2382',
        stockName: '廣達',
        condition: 'PRICE_ABOVE',
        targetValue: 335,
        active: true,
        triggered: false,
        createdAt: Date.now() - 1000 * 3600 * 4,
        note: 'AI伺服器出貨放量突破',
      },
      {
        id: 'alert-init-4',
        symbol: '2317',
        stockName: '鴻海',
        condition: 'PCT_GAIN_ABOVE',
        targetValue: 2.5,
        active: true,
        triggered: false,
        createdAt: Date.now() - 1000 * 3600 * 5,
        note: '漲幅逾2.5%動能警示',
      },
    ];
  });

  const [alertModalStock, setAlertModalStock] = useState<Stock | null>(null);

  // Load real-time live data from Express backend
  const loadLiveData = useCallback(async () => {
    setIsLiveLoading(true);
    try {
      const allSymbolsToSync = Array.from(
        new Set([
          ...INITIAL_STOCKS_CONFIG.map((s) => s.symbol),
          ...watchlistSymbols,
        ])
      );

      const [stocksResult, marketResult] = await Promise.allSettled([
        fetchAllStocks(allSymbolsToSync),
        fetchMarketIndex(),
      ]);

      if (stocksResult.status === 'fulfilled' && stocksResult.value.length > 0) {
        setStocks((prev) => {
          const liveMap = new Map(stocksResult.value.map((s) => [s.symbol, s]));
          const updated = prev.map((old) => liveMap.get(old.symbol) || old);
          for (const s of stocksResult.value) {
            if (!updated.some((u) => u.symbol === s.symbol)) {
              updated.push(s);
            }
          }
          return updated;
        });
      }

      if (marketResult.status === 'fulfilled' && marketResult.value) {
        setMarketIndex(marketResult.value);
      }

      setLastUpdatedTime(new Date().toLocaleTimeString('zh-TW'));
    } catch (err) {
      console.warn('Live data sync notice:', err);
    } finally {
      setIsLiveLoading(false);
    }
  }, []);

  // Fetch live on mount, on focus, and periodic sync (15 seconds for responsive night session updates)
  useEffect(() => {
    loadLiveData();

    const interval = setInterval(() => {
      loadLiveData();
    }, 15000);

    const handleFocus = () => {
      loadLiveData();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [loadLiveData]);

  // Save watchlist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('tw_radar_watchlist', JSON.stringify(watchlistSymbols));
    } catch (e) {}
  }, [watchlistSymbols]);

  // Save alerts to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('tw_radar_alerts', JSON.stringify(alerts));
    } catch (e) {}
  }, [alerts]);

  // Active stock reference
  const selectedStock = stocks.find((s) => s.symbol === selectedSymbol) || stocks[0];

  // Aggregated radar signals from stocks
  const radarSignals = React.useMemo(() => {
    const list: RadarSignal[] = [];
    stocks.forEach((stk) => {
      stk.activeSignals.forEach((sig) => {
        list.push(sig);
      });
    });
    return list.sort((a, b) => b.timestamp - a.timestamp);
  }, [stocks]);

  // Toggle watchlist
  const handleToggleWatchlist = (symbol: string) => {
    setWatchlistSymbols((prev) => {
      if (prev.includes(symbol)) {
        return prev.filter((s) => s !== symbol);
      }
      return [...prev, symbol];
    });
  };

  // Add custom stock with real API lookup
  const handleAddNewCustomStock = async (
    symbol: string,
    name: string,
    price: number,
    industry: string
  ) => {
    const exists = stocks.find((s) => s.symbol === symbol);
    if (exists) {
      if (!watchlistSymbols.includes(symbol)) {
        setWatchlistSymbols((prev) => [...prev, symbol]);
      }
      setSelectedSymbol(symbol);
      return;
    }

    // Try fetching real quote from backend API first!
    let newStock: Stock | null = null;
    try {
      newStock = await fetchSingleStock(symbol);
    } catch (e) {}

    if (!newStock) {
      // Safe baseline without artificial simulated drift
      const safePrice = Number(price.toFixed(2));
      newStock = {
        symbol,
        name,
        industry,
        market: '上市',
        price: safePrice,
        change: 0,
        changePercent: 0,
        prevClose: safePrice,
        open: safePrice,
        high: safePrice,
        low: safePrice,
        volume: 1000,
        turnover: Number(((safePrice * 1000 * 1000) / 100000000).toFixed(1)),
        volumeAvg5d: 1000,
        supportPrice: Number((safePrice * 0.95).toFixed(1)),
        resistancePrice: Number((safePrice * 1.05).toFixed(1)),
        bid: [safePrice - 0.5, safePrice - 1, safePrice - 1.5, safePrice - 2, safePrice - 2.5],
        bidVol: [100, 100, 100, 100, 100],
        ask: [safePrice + 0.5, safePrice + 1, safePrice + 1.5, safePrice + 2, safePrice + 2.5],
        askVol: [100, 100, 100, 100, 100],
        history: selectedStock.history.map((h) => ({
          ...h,
          close: safePrice,
          open: safePrice,
          high: safePrice,
          low: safePrice,
        })),
        intraday: [],
        chips: {
          ...selectedStock.chips,
          foreignBuySell: 0,
          trustBuySell: 0,
        },
        activeSignals: [],
      };
    }

    setStocks((prev) => [newStock!, ...prev]);
    setWatchlistSymbols((prev) => [symbol, ...prev]);
    setSelectedSymbol(symbol);
  };

  // Add custom alert
  const handleAddAlert = (newAlert: Omit<PriceAlert, 'id' | 'createdAt' | 'triggered'>) => {
    const alertItem: PriceAlert = {
      ...newAlert,
      id: `alert-${Date.now()}`,
      createdAt: Date.now(),
      triggered: false,
    };
    setAlerts((prev) => [alertItem, ...prev]);
  };

  // Toggle alert active
  const handleToggleAlertActive = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, active: !a.active } : a))
    );
  };

  // Delete alert
  const handleDeleteAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  // Test trigger alert
  const handleTestTriggerAlert = (id: string) => {
    const target = alerts.find((a) => a.id === id);
    if (!target) return;

    const stk = stocks.find((s) => s.symbol === target.symbol);
    const triggerPrice = stk?.price || target.targetValue;

    playAlertPing(soundEnabled);

    const toast: ToastData = {
      id: `toast-${Date.now()}`,
      type: 'alert',
      title: '🎯 自定義價格提醒觸發',
      stockSymbol: target.symbol,
      stockName: target.stockName,
      description: `【提醒觸發】${target.stockName} (${target.symbol}) 已滿足條件：${
        target.condition === 'PRICE_ABOVE'
          ? `市價突破 ${target.targetValue} 元`
          : target.condition === 'PRICE_BELOW'
          ? `市價跌破停損 ${target.targetValue} 元`
          : target.condition === 'PCT_GAIN_ABOVE'
          ? `當日漲幅超過 +${target.targetValue}%`
          : target.condition === 'PCT_DROP_ABOVE'
          ? `當日跌幅超過 -${target.targetValue}%`
          : `成交量突破 ${target.targetValue} 張`
      }！${target.note ? `備註: ${target.note}` : ''}`,
      triggerPrice,
      volume: stk?.volume,
      supportPrice: stk?.supportPrice,
      resistancePrice: stk?.resistancePrice,
    };

    setActiveToast(toast);

    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        type: 'alert',
        title: `【價格提醒】${target.stockName} 達成觸發條件`,
        stockSymbol: target.symbol,
        stockName: target.stockName,
        description: toast.description,
        timestamp: Date.now(),
        read: false,
        triggerPrice,
        volume: stk?.volume,
        supportPrice: stk?.supportPrice,
        resistancePrice: stk?.resistancePrice,
      },
      ...prev,
    ]);

    setAlerts((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              triggered: true,
              triggeredAt: Date.now(),
              triggeredPrice: triggerPrice,
            }
          : a
      )
    );
  };

  // Manual Scan Action
  const handleManualScan = () => {
    setIsScanning(true);
    loadLiveData().finally(() => {
      setTimeout(() => {
        setIsScanning(false);
        playBreakoutSound(soundEnabled);

        const targetStock = stocks.find((s) => s.symbol === '2454') || stocks[1];
        const toast: ToastData = {
          id: `toast-scan-${Date.now()}`,
          type: 'radar',
          title: '【資金雷達最新推播】聯發科 爆量突破壓力！',
          stockSymbol: targetStock.symbol,
          stockName: targetStock.name,
          description: `盤中掃描偵測：${targetStock.name} (${targetStock.symbol}) 出現爆量長紅突破，主力買單大舉敲進，突破前高壓力線 ${targetStock.resistancePrice} 元！`,
          triggerPrice: targetStock.price,
          volume: targetStock.volume,
          volumeMultiple: 2.3,
          supportPrice: targetStock.supportPrice,
          resistancePrice: targetStock.resistancePrice,
        };

        setActiveToast(toast);

        setNotifications((prev) => [
          {
            id: `notif-scan-${Date.now()}`,
            type: 'radar',
            title: `【突破推播】${targetStock.name} 爆量突破壓力`,
            stockSymbol: targetStock.symbol,
            stockName: targetStock.name,
            description: toast.description,
            timestamp: Date.now(),
            read: false,
            triggerPrice: targetStock.price,
            volume: targetStock.volume,
            volumeMultiple: 2.3,
            supportPrice: targetStock.supportPrice,
            resistancePrice: targetStock.resistancePrice,
          },
          ...prev,
        ]);
      }, 600);
    });
  };

  // Check custom alerts when real stock prices update
  useEffect(() => {
    if (!stocks || stocks.length === 0) return;

    alerts.forEach((alert) => {
      const current = stocks.find((s) => s.symbol === alert.symbol);
      if (!current || !alert.active || alert.triggered) return;

      let isTriggered = false;
      if (alert.condition === 'PRICE_ABOVE' && current.price >= alert.targetValue) {
        isTriggered = true;
      } else if (alert.condition === 'PRICE_BELOW' && current.price <= alert.targetValue) {
        isTriggered = true;
      } else if (alert.condition === 'PCT_GAIN_ABOVE' && current.changePercent >= alert.targetValue) {
        isTriggered = true;
      } else if (alert.condition === 'PCT_DROP_ABOVE' && current.changePercent <= -alert.targetValue) {
        isTriggered = true;
      } else if (alert.condition === 'VOLUME_ABOVE' && current.volume >= alert.targetValue) {
        isTriggered = true;
      }

      if (isTriggered) {
        playAlertPing(soundEnabled);
        const toast: ToastData = {
          id: `toast-${Date.now()}`,
          type: 'alert',
          title: '🎯 自定義價格提醒觸發',
          stockSymbol: alert.symbol,
          stockName: alert.stockName,
          description: `【提醒通知】${alert.stockName} (${
            alert.symbol
          }) 市價觸及 ${current.price} 元，滿足條件：${
            alert.condition === 'PRICE_ABOVE'
              ? `突破 ${alert.targetValue} 元`
              : alert.condition === 'PRICE_BELOW'
              ? `跌破 ${alert.targetValue} 元`
              : `漲跌幅達到門檻`
          }！`,
          triggerPrice: current.price,
          volume: current.volume,
          supportPrice: current.supportPrice,
          resistancePrice: current.resistancePrice,
        };
        setActiveToast(toast);

        setNotifications((prevN) => [
          {
            id: `notif-${Date.now()}`,
            type: 'alert',
            title: `【價格提醒】${alert.stockName} 達成設定目標`,
            stockSymbol: alert.symbol,
            stockName: alert.stockName,
            description: toast.description,
            timestamp: Date.now(),
            read: false,
            triggerPrice: current.price,
            volume: current.volume,
            supportPrice: current.supportPrice,
            resistancePrice: current.resistancePrice,
          },
          ...prevN,
        ]);

        setAlerts((prevAlerts) =>
          prevAlerts.map((a) =>
            a.id === alert.id
              ? {
                  ...a,
                  triggered: true,
                  triggeredAt: Date.now(),
                  triggeredPrice: current.price,
                }
              : a
          )
        );
      }
    });
  }, [stocks, alerts, soundEnabled]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const tsmcStock = stocks.find((s) => s.symbol === '2330');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Fixed Navbar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        colorMode={colorMode}
        onToggleColorMode={() =>
          setColorMode((m) => (m === 'tw' ? 'intl' : 'tw'))
        }
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((s) => !s)}
        isSimulating={isSimulating}
        onToggleSimulation={() => setIsSimulating((s) => !s)}
        unreadCount={unreadCount}
        onOpenNotifications={() => setIsNotificationCenterOpen(true)}
        marketIndex={marketIndex}
        tsmcPrice={tsmcStock?.price ?? 1045}
        tsmcChange={tsmcStock?.change ?? 15}
        onRefreshLive={loadLiveData}
        isLiveLoading={isLiveLoading}
        onQuickSearchStock={handleQuickSearchStock}
      />


      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 pb-28 space-y-6">
        {/* VIEW: 波段核心投組與未來產業趨勢推薦 (Swing Portfolio) */}
        {activeTab === 'portfolio' && (
          <SwingPortfolioView
            stocks={stocks}
            watchlistSymbols={watchlistSymbols}
            onToggleWatchlist={(stk) => handleToggleWatchlist(stk.symbol)}
            onOpenChart={(stk) => {
              setSelectedSymbol(stk.symbol);
              setActiveTab('chart');
            }}
            onOpenResearch={(stk) => {
              const matched = stocks.find((s) => s.symbol === stk.symbol);
              if (matched) {
                setDeepResearchStock(matched);
              } else {
                handleQuickSearchStock(stk.symbol);
              }
            }}
            colorMode={colorMode}
            onRefreshStocks={loadLiveData}
            isRefreshing={isLiveLoading}
          />
        )}

        {/* VIEW 0: 講義選股與買賣決策中心 (Screener) */}
        {activeTab === 'screener' && (
          <ScreenerDecisionView
            stocks={stocks}
            watchlistSymbols={watchlistSymbols}
            onSelectStock={(stk) => {
              setSelectedSymbol(stk.symbol);
              setActiveTab('chart');
            }}
            onToggleWatchlist={(stk) => handleToggleWatchlist(stk.symbol)}
            onOpenResearch={(stk) => setDeepResearchStock(stk)}
            onOpenChart={(stk) => {
              setSelectedSymbol(stk.symbol);
              setActiveTab('chart');
            }}
            onOpenPaperTrade={(stk: Stock) => {
              setSelectedSymbol(stk.symbol);
              setActiveTab('paper');
            }}
            colorMode={colorMode}
            onRefreshStocks={loadLiveData}
            isRefreshing={isLiveLoading}
          />
        )}

        {/* VIEW: 實戰模擬交易中心 (Paper Trading) */}
        {activeTab === 'paper' && (
          <PaperTradingView
            stocks={stocks}
            selectedStock={selectedStock}
            onSelectStock={(stk) => setSelectedSymbol(stk.symbol)}
            colorMode={colorMode}
          />
        )}

        {/* VIEW: 產業資金流向 (Sector Capital Flow) */}
        {activeTab === 'sectors' && (
          <SectorFlowView
            stocks={stocks}
            onSelectStock={(stk) => {
              setSelectedSymbol(stk.symbol);
              setActiveTab('chart');
            }}
            colorMode={colorMode}
          />
        )}

        {/* VIEW 1: 即時資金雷達首頁 (Money Radar Home Dashboard) */}
        {activeTab === 'radar' && (
          <MoneyRadarView
            stocks={stocks}
            signals={radarSignals}
            colorMode={colorMode}
            marketIndex={marketIndex}
            watchlistSymbols={watchlistSymbols}
            onToggleWatchlist={(stk) => handleToggleWatchlist(stk.symbol)}
            onNavigateToPortfolio={() => setActiveTab('portfolio')}
            onSelectStock={(stk) => {
              setSelectedSymbol(stk.symbol);
              setActiveTab('chart');
            }}
            onOpenAlertModal={(stk) => setAlertModalStock(stk)}
            onOpenResearch={(stk) => setDeepResearchStock(stk)}
            onOpenChart={(stk) => {
              setSelectedSymbol(stk.symbol);
              setActiveTab('chart');
            }}
            onNavigateToSectors={() => setActiveTab('sectors')}
            onNavigateToScreener={() => setActiveTab('screener')}
            onManualScan={handleManualScan}
            isScanning={isScanning || isLiveLoading}
          />
        )}

        {/* VIEW 2: 自選股看盤 (Watchlist) */}
        {activeTab === 'watchlist' && (
          <WatchlistView
            stocks={stocks}
            watchlistSymbols={watchlistSymbols}
            selectedSymbol={selectedSymbol}
            colorMode={colorMode}
            onSelectStock={(stk) => {
              setSelectedSymbol(stk.symbol);
              setActiveTab('chart');
            }}
            onToggleWatchlist={handleToggleWatchlist}
            onOpenAlertModal={(stk) => setAlertModalStock(stk)}
            onAddNewCustomStock={handleAddNewCustomStock}
            onOpenResearch={(stk) => setDeepResearchStock(stk)}
          />
        )}

        {/* VIEW 3: 技術指標分析 (Technical Chart) */}
        {activeTab === 'chart' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <span className="text-slate-400 whitespace-nowrap">自選快速切換:</span>
              {stocks
                .filter((s) => watchlistSymbols.includes(s.symbol))
                .map((stk) => (
                  <button
                    key={stk.symbol}
                    onClick={() => setSelectedSymbol(stk.symbol)}
                    className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                      stk.symbol === selectedSymbol
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    {stk.name} ({stk.symbol}) · {stk.price}
                  </button>
                ))}
            </div>

            <StockChart
              stock={selectedStock}
              colorMode={colorMode}
              watchlistSymbols={watchlistSymbols}
              onToggleWatchlist={() => handleToggleWatchlist(selectedStock.symbol)}
              onOpenAlertModal={() => setAlertModalStock(selectedStock)}
              onOpenResearch={() => setDeepResearchStock(selectedStock)}
              onOpenPaperTrade={() => setActiveTab('paper')}
            />
          </div>
        )}

        {/* VIEW 4: 每日盤後籌碼 (Chips & Institutional) */}
        {activeTab === 'chips' && (
          <ChipsView
            stocks={stocks}
            selectedStock={selectedStock}
            onSelectStock={(stk) => setSelectedSymbol(stk.symbol)}
            colorMode={colorMode}
          />
        )}

        {/* VIEW 5: 價格提醒中心 (Alerts Manager) */}
        {activeTab === 'alerts' && (
          <AlertsManagerView
            stocks={stocks}
            alerts={alerts}
            onAddAlert={handleAddAlert}
            onToggleAlertActive={handleToggleAlertActive}
            onDeleteAlert={handleDeleteAlert}
            onTestTriggerAlert={handleTestTriggerAlert}
            colorMode={colorMode}
          />
        )}
      </main>

      {/* Persistent Bottom Navigation Dock (參考即時資金雷達 App 介面，功能放最下面) */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        unreadCount={unreadCount}
      />

      {/* Proactive Breakout & Alert Floating Toast */}
      <ToastAlert
        toast={activeToast}
        onClose={() => setActiveToast(null)}
        onViewStock={(sym) => {
          setSelectedSymbol(sym);
          setActiveTab('chart');
        }}
      />

      {/* Notification Center Drawer */}
      <NotificationCenter
        notifications={notifications}
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
        onMarkAllRead={() => {
          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        }}
        onClearAll={() => setNotifications([])}
        onSelectStockBySymbol={(sym) => {
          setSelectedSymbol(sym);
          setActiveTab('chart');
        }}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((s) => !s)}
      />

      {/* Quick Alert Setup Modal */}
      <AlertModal
        stock={alertModalStock}
        isOpen={!!alertModalStock}
        onClose={() => setAlertModalStock(null)}
        onSave={(symbol, stockName, cond, targetVal, note) => {
          handleAddAlert({
            symbol,
            stockName,
            condition: cond,
            targetValue: targetVal,
            active: true,
            note,
          });
        }}
      />

      {/* Stock Deep Research Modal (News, Commodities, Broker Notices) */}
      <StockDeepResearchModal
        stock={deepResearchStock || selectedStock}
        isOpen={!!deepResearchStock}
        onClose={() => setDeepResearchStock(null)}
        watchlistSymbols={watchlistSymbols}
        onToggleWatchlist={(s) => handleToggleWatchlist(s.symbol)}
        onSelectStock={(s) => setSelectedSymbol(s.symbol)}
        onOpenChart={(s) => {
          setSelectedSymbol(s.symbol);
          setActiveTab('chart');
        }}
        colorMode={colorMode}
      />
    </div>
  );
}
