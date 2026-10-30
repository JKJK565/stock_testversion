import React, { useState, useMemo, useRef } from 'react';
import {
  Briefcase,
  AlertTriangle,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Trash2,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  PlusCircle,
  RefreshCw,
  Clock,
  Building2,
  ChevronDown,
  ChevronUp,
  SunMedium,
  Wallet,
  Trophy,
  DollarSign,
  Edit3,
  Download,
  Upload,
  Database,
  Calendar,
  X,
  Target,
  FileSpreadsheet,
} from 'lucide-react';
import {
  PortfolioStockItem,
  TradeRecordItem,
  WatchlistBriefingResponse,
} from '../types/stock';
import { MarkdownRenderer } from './MarkdownRenderer';

interface WatchlistViewProps {
  portfolio: PortfolioStockItem[];
  tradeHistory?: TradeRecordItem[];
  initialCapital?: number;
  syncStatus?: {
    connected: boolean;
    provider: 'supabase' | 'local_store';
    message: string;
  };
  onUpdateInitialCapital?: (capital: number) => void;
  onClosePosition?: (trade: Omit<TradeRecordItem, 'id'>, removePortfolioId: string) => void;
  onDeleteTradeRecord?: (id: string) => void;
  onUpdateItem: (id: string, updates: Partial<PortfolioStockItem>) => void;
  onRemoveItem: (id: string) => void;
  onNavigateToScreener: () => void;
  searchQuery?: string;
  onRefreshQuotes?: () => void;
  isRefreshingQuotes?: boolean;
  lastQuotesUpdatedAt?: string;
  onOpenStockDetail?: (symbol: string) => void;
  onAddStockBySymbol?: (symbol: string) => Promise<boolean>;
  watchlistBriefing?: WatchlistBriefingResponse | null;
  isBriefingLoading?: boolean;
  isBriefingGenerating?: boolean;
  onGenerateBriefing?: (force?: boolean) => void;
  onExportBackup?: () => void;
  onImportBackup?: (file: File) => void;
}

export function WatchlistView({
  portfolio,
  tradeHistory = [],
  initialCapital = 1000000,
  syncStatus,
  onUpdateInitialCapital,
  onClosePosition,
  onDeleteTradeRecord,
  onUpdateItem,
  onRemoveItem,
  onNavigateToScreener,
  searchQuery = '',
  onRefreshQuotes,
  isRefreshingQuotes = false,
  lastQuotesUpdatedAt = '',
  onOpenStockDetail,
  onAddStockBySymbol,
  watchlistBriefing,
  isBriefingLoading = false,
  isBriefingGenerating = false,
  onGenerateBriefing,
  onExportBackup,
  onImportBackup,
}: WatchlistViewProps) {
  // Tab Switcher: 'active' (持股中部位) | 'history' (已平倉歷史戰績)
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

  const [isBriefingExpanded, setIsBriefingExpanded] = useState(true);
  const [quickSymbol, setQuickSymbol] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Capital Edit Modal
  const [isCapitalModalOpen, setIsCapitalModalOpen] = useState(false);
  const [capitalInput, setCapitalInput] = useState<string>(String(initialCapital));

  // Close Position Modal State
  const [closingStock, setClosingStock] = useState<PortfolioStockItem | null>(null);
  const [closeType, setCloseType] = useState<'TAKE_PROFIT' | 'STOP_LOSS'>('TAKE_PROFIT');
  const [closePrice, setClosePrice] = useState<number>(0);
  const [closeLots, setCloseLots] = useState<number>(1);
  const [closeNote, setCloseNote] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSymbol = quickSymbol.trim();
    if (!/^[1-9][0-9]{3}$/.test(cleanSymbol)) {
      setAddError('請輸入正確的 4 碼台股代號 (如 2330)');
      return;
    }
    if (portfolio.some((p) => p.symbol === cleanSymbol)) {
      setAddError(`股票 ${cleanSymbol} 已在自選清單中`);
      return;
    }
    if (onAddStockBySymbol) {
      setIsAdding(true);
      setAddError(null);
      const success = await onAddStockBySymbol(cleanSymbol);
      setIsAdding(false);
      if (success) {
        setQuickSymbol('');
      } else {
        setAddError(`查無股票 ${cleanSymbol} 之即時報價，請確認代碼`);
      }
    }
  };

  // Filter portfolio by search query
  const filteredPortfolio = portfolio.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    return (
      item.symbol.toLowerCase().includes(q) ||
      item.name.toLowerCase().includes(q) ||
      (item.notes && item.notes.toLowerCase().includes(q))
    );
  });

  // Calculate stocks with active health alerts
  const alertStocks = portfolio.filter(
    (item) =>
      item.decisionRating !== 'SHAKEOUT_HOLD' &&
      item.healthAlerts &&
      item.healthAlerts.some((a) => a.severity === 'danger' || a.severity === 'warning')
  );

  // 1. 現存持股未實現損益統計 (含真實台股手續費低消 20 元與 0.3% 證交稅)
  const activeMetrics = useMemo(() => {
    let totalCost = 0;
    let totalValue = 0;
    let totalGrossPL = 0;
    let totalFeeCost = 0;
    let totalNetPL = 0;

    for (const item of portfolio) {
      const curPrice = item.currentPrice ?? item.entryPrice;
      const cost = item.entryPrice * item.sharesLots * 1000;
      const value = curPrice * item.sharesLots * 1000;
      const feeDiscount = typeof item.feeDiscount === 'number' && !isNaN(item.feeDiscount) ? item.feeDiscount : 60;
      const discountRatio = feeDiscount / 100;
      const buyFee = Math.max(20, Math.round(cost * 0.001425 * discountRatio));
      const sellFee = Math.max(20, Math.round(value * 0.001425 * discountRatio));
      const sellTax = Math.round(value * 0.003);
      const feeTotal = item.feeCostTotal ?? (buyFee + sellFee + sellTax);
      const gross = item.unrealizedPL ?? (value - cost);
      const net = item.netPL ?? (gross - feeTotal);

      totalCost += cost;
      totalValue += value;
      totalGrossPL += gross;
      totalFeeCost += feeTotal;
      totalNetPL += net;
    }

    const unrealizedReturnPct = totalCost > 0 ? Number(((totalNetPL / totalCost) * 100).toFixed(2)) : 0;
    return {
      totalCost,
      totalValue,
      totalGrossPL,
      totalFeeCost,
      totalNetPL,
      totalUnrealizedPL: totalNetPL, // 對齊淨值真實金額
      unrealizedReturnPct,
      count: portfolio.length,
    };
  }, [portfolio]);

  // 2. 已平倉歷史交易紀錄統計 (Trade Diary Statistics)
  const historyMetrics = useMemo(() => {
    const totalTrades = tradeHistory.length;
    let totalRealizedPL = 0;
    let winCount = 0;
    let lossCount = 0;
    let totalWinAmount = 0;
    let totalLossAmount = 0;

    for (const t of tradeHistory) {
      totalRealizedPL += t.realizedPL;
      if (t.realizedPL > 0) {
        winCount++;
        totalWinAmount += t.realizedPL;
      } else if (t.realizedPL < 0) {
        lossCount++;
        totalLossAmount += Math.abs(t.realizedPL);
      }
    }

    const winRate = totalTrades > 0 ? Number(((winCount / totalTrades) * 100).toFixed(1)) : 0;
    const avgWin = winCount > 0 ? totalWinAmount / winCount : 0;
    const avgLoss = lossCount > 0 ? totalLossAmount / lossCount : 0;
    const profitFactor = avgLoss > 0 ? Number((avgWin / avgLoss).toFixed(2)) : avgWin > 0 ? 99 : 0;

    return {
      totalTrades,
      winCount,
      lossCount,
      winRate,
      totalRealizedPL,
      profitFactor,
    };
  }, [tradeHistory]);

  // 3. 操盤手總資產淨值統計 (初始本金 + 已實現損益 + 未實現淨損益)
  const netWorth = initialCapital + historyMetrics.totalRealizedPL + activeMetrics.totalNetPL;
  const netWorthReturnPct = initialCapital > 0 ? Number((((netWorth - initialCapital) / initialCapital) * 100).toFixed(2)) : 0;

  // 打開平倉確認對話框
  const handleOpenCloseModal = (stock: PortfolioStockItem, type: 'TAKE_PROFIT' | 'STOP_LOSS') => {
    setClosingStock(stock);
    setCloseType(type);
    setClosePrice(stock.currentPrice ?? stock.entryPrice);
    setCloseLots(stock.sharesLots);
    setCloseNote(type === 'TAKE_PROFIT' ? '波段達標停利落袋' : '跌破均線紀律停損');
  };

  // 確認平倉並存入交易日記 (扣除買賣手續費及 0.3% 證交稅之真實淨已實現損益)
  const handleConfirmClose = () => {
    if (!closingStock) return;
    const exitP = closePrice > 0 ? closePrice : (closingStock.currentPrice ?? closingStock.entryPrice);
    const lots = closeLots > 0 ? closeLots : closingStock.sharesLots;
    const costAmt = closingStock.entryPrice * lots * 1000;
    const exitAmt = exitP * lots * 1000;
    const feeDiscount = typeof closingStock.feeDiscount === 'number' && !isNaN(closingStock.feeDiscount) ? closingStock.feeDiscount : 60;
    const discountRatio = feeDiscount / 100;
    const buyFee = Math.max(20, Math.round(costAmt * 0.001425 * discountRatio));
    const sellFee = Math.max(20, Math.round(exitAmt * 0.001425 * discountRatio));
    const sellTax = Math.round(exitAmt * 0.003);
    const totalFees = buyFee + sellFee + sellTax;
    const grossPL = exitAmt - costAmt;
    const realizedPL = grossPL - totalFees;
    const returnPct = costAmt > 0
      ? Number(((realizedPL / costAmt) * 100).toFixed(2))
      : 0;

    // 計算持有天數
    let holdingDays = 1;
    if (closingStock.entryDate) {
      try {
        const eTime = new Date(closingStock.entryDate).getTime();
        const nowTime = new Date().getTime();
        holdingDays = Math.max(1, Math.round((nowTime - eTime) / (1000 * 60 * 60 * 24)));
      } catch {}
    }

    const todayDate = new Date().toISOString().split('T')[0];

    if (onClosePosition) {
      onClosePosition(
        {
          symbol: closingStock.symbol,
          name: closingStock.name,
          strategyType: closingStock.strategyType || 'momentum',
          entryPrice: closingStock.entryPrice,
          exitPrice: exitP,
          sharesLots: lots,
          entryDate: closingStock.entryDate || todayDate,
          exitDate: todayDate,
          exitType: closeType,
          realizedPL,
          returnPct,
          holdingDays,
          feeDiscount,
          feeCostTotal: totalFees,
          netPL: realizedPL,
          netReturnPct: returnPct,
          notes: closeNote,
        },
        closingStock.id
      );
    }

    setClosingStock(null);
  };

  const handleSaveCapital = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(capitalInput.replace(/,/g, ''));
    if (!isNaN(val) && val > 0 && onUpdateInitialCapital) {
      onUpdateInitialCapital(val);
      setIsCapitalModalOpen(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImportBackup) {
      onImportBackup(file);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ========================================================================= */}
      {/* 0. 📊 TOP SECTION: 操盤手資金管理與總淨值總覽 (Capital Management Card)    */}
      {/* ========================================================================= */}
      <section className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-2xl p-5 sm:p-7 relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-5 border-b border-slate-800">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500/20 via-amber-500/20 to-rose-500/20 border border-indigo-500/40 flex items-center justify-center shadow-md">
                <Wallet className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black text-white">操盤手資金管理與歷史交易日記</h1>
                  {syncStatus && (
                    <span
                      className={`text-[11px] px-2.5 py-0.5 rounded-full font-mono font-bold flex items-center gap-1 border ${
                        syncStatus.connected
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                          : 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                      }`}
                      title={syncStatus.message}
                    >
                      <Database className="w-3 h-3" />
                      <span>{syncStatus.connected ? 'Supabase 雲端同步中' : '本機持久化備援'}</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  自訂本金、總淨值試算、生涯勝率統計與已平倉真實損益紀錄
                </p>
              </div>
            </div>
          </div>

          {/* Backup / Export / Import / Refresh buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {onRefreshQuotes && (
              <button
                onClick={onRefreshQuotes}
                disabled={isRefreshingQuotes}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 hover:text-white flex items-center gap-1.5 transition active:scale-95 cursor-pointer disabled:opacity-50"
                title="立即刷新持股現價"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-rose-400 ${isRefreshingQuotes ? 'animate-spin' : ''}`} />
                <span>{isRefreshingQuotes ? '更新中...' : '刷新現價'}</span>
              </button>
            )}

            {onExportBackup && (
              <button
                onClick={onExportBackup}
                className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1.5 transition cursor-pointer"
                title="匯出持股與交易日記備份檔 (JSON)"
              >
                <Download className="w-3.5 h-3.5 text-indigo-400" />
                <span>匯出備份</span>
              </button>
            )}

            {onImportBackup && (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileInputChange}
                  accept=".json"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1.5 transition cursor-pointer"
                  title="從備份檔恢復持股與交易日記"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-400" />
                  <span>匯入還原</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* 4 核心資金指標面板 Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 pt-5">
          {/* 指標 1: 自訂初始本金 */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between relative group">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>初始操作本金</span>
              <button
                onClick={() => {
                  setCapitalInput(String(initialCapital));
                  setIsCapitalModalOpen(true);
                }}
                className="p-1 rounded-md bg-slate-800 text-slate-400 hover:text-amber-400 hover:bg-slate-700 transition cursor-pointer"
                title="修改初始本金金額"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="mt-2">
              <div className="text-xl sm:text-2xl font-black font-mono text-white">
                ${initialCapital.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                可隨時點擊 ✏️ 調整本金基數
              </div>
            </div>
          </div>

          {/* 指標 2: 總資產淨值與總報酬率 */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
            <div className="text-xs text-slate-400">總資產淨值 (含已/未實現)</div>
            <div className="mt-2">
              <div className="text-xl sm:text-2xl font-black font-mono text-white">
                ${Math.round(netWorth).toLocaleString()}
              </div>
              <div
                className={`text-[11px] font-mono font-bold mt-0.5 flex items-center gap-1 ${
                  netWorthReturnPct >= 0 ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                <span>總報酬率</span>
                <span>{netWorthReturnPct >= 0 ? '+' : ''}{netWorthReturnPct}%</span>
              </div>
            </div>
          </div>

          {/* 指標 3: 累計已實現損益 (平倉戰績) */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
            <div className="text-xs text-slate-400">累計已實現損益 (平倉累積)</div>
            <div className="mt-2">
              <div
                className={`text-xl sm:text-2xl font-black font-mono ${
                  historyMetrics.totalRealizedPL >= 0 ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {historyMetrics.totalRealizedPL >= 0 ? '+' : ''}${Math.round(historyMetrics.totalRealizedPL).toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                共平倉 {historyMetrics.totalTrades} 筆交易日記
              </div>
            </div>
          </div>

          {/* 指標 4: 生涯勝率與獲利因子 */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>歷史勝率戰績</span>
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="mt-2">
              <div className="text-xl sm:text-2xl font-black font-mono text-amber-400">
                {historyMetrics.winRate}%
              </div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                {historyMetrics.winCount}勝 {historyMetrics.lossCount}敗 (賺賠比 {historyMetrics.profitFactor}x)
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 1. 📊 GEMINI 2.5 PRO 自選持股每日量化晨會戰報 (可展開/收合)                 */}
      {/* ========================================================================= */}
      <section className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-xl p-5 sm:p-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
              <SunMedium className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">自選持股量化晨會戰報</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-mono flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  {watchlistBriefing?.model || 'Gemini 2.5 Pro 旗艦推理'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                專屬體檢 {portfolio.length} 檔持股：防主力甩轎、昨日法人融資消長與 20MA 防守點
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {watchlistBriefing?.isGenerated && watchlistBriefing.markdown && (
              <button
                onClick={() => onGenerateBriefing?.(true)}
                disabled={isBriefingGenerating}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isBriefingGenerating ? 'animate-spin text-amber-400' : ''}`} />
                <span>{isBriefingGenerating ? '體檢中...' : '🔄 重新分析'}</span>
              </button>
            )}

            <button
              onClick={() => setIsBriefingExpanded((prev) => !prev)}
              className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            >
              {isBriefingExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {isBriefingGenerating ? (
          <div className="mt-4 p-6 rounded-2xl bg-slate-950/90 border border-indigo-500/30 flex flex-col items-center justify-center text-center space-y-3">
            <Sparkles className="w-8 h-8 text-amber-400 animate-spin" />
            <p className="text-sm font-bold text-white">Gemini 2.5 Pro 正在為您的持股進行量化體檢...</p>
          </div>
        ) : (!watchlistBriefing || !watchlistBriefing.isGenerated || !watchlistBriefing.markdown) ? (
          <div className="mt-4 p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-center flex flex-col items-center justify-center">
            <p className="text-xs text-slate-400 mb-3">今日自選持股戰報尚未產出，建議於開盤前產出量化評析</p>
            <button
              onClick={() => onGenerateBriefing?.(true)}
              disabled={isBriefingGenerating || portfolio.length === 0}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg cursor-pointer disabled:opacity-50 active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>⚡ 產出今日自選持股戰報 (Gemini 2.5 Pro)</span>
            </button>
          </div>
        ) : isBriefingExpanded ? (
          <div className="mt-4 p-5 rounded-2xl bg-slate-950/80 border border-slate-800/90">
            <MarkdownRenderer content={watchlistBriefing.markdown} />
          </div>
        ) : null}
      </section>

      {/* ========================================================================= */}
      {/* 2. 🚨 自選股破線/減碼警訊清單 (Red Alert Card)                             */}
      {/* ========================================================================= */}
      {alertStocks.length > 0 && (
        <section className="rounded-3xl bg-gradient-to-br from-rose-950/50 via-slate-900 to-rose-950/30 border-2 border-rose-500/70 shadow-2xl p-5 relative overflow-hidden">
          <div className="flex items-center gap-3 pb-3 border-b border-rose-500/30">
            <ShieldAlert className="w-6 h-6 text-rose-400 animate-pulse" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-rose-300">
                  🚨 自選股破線/減碼警訊 ({alertStocks.length} 檔)
                </h3>
              </div>
              <p className="text-xs text-rose-200/80">
                波段紀律最高原則：破線即走、杜絕凹單！
              </p>
            </div>
          </div>

          <div className="mt-3 space-y-2.5">
            {alertStocks.map((stock) => {
              const curPrice = stock.currentPrice ?? stock.entryPrice;
              return (
                <div
                  key={`alert-${stock.id}`}
                  className="rounded-xl bg-slate-950/90 border border-rose-500/40 p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-bold text-white">{stock.name}</span>
                      <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {stock.symbol}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-rose-600 text-white font-bold">
                        {stock.decisionRating === 'CONFIRMED_STOP_LOSS' ? '🚨 破線出貨・執行停損' : '🔴 破線警戒'}
                      </span>
                      <span className="text-xs text-slate-400">
                        現價 <strong className="text-white">${curPrice.toFixed(2)}</strong> / 停損價 <strong className="text-rose-400">${stock.stopLossPrice.toFixed(2)}</strong>
                      </span>
                    </div>
                    {stock.diagnosticNote && (
                      <p className="text-xs text-rose-200/90">{stock.diagnosticNote}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenCloseModal(stock, 'STOP_LOSS')}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow"
                    >
                      <span>🛑 紀律停損平倉</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 3. 雙分頁切換：📈 持股中部位 (${portfolio.length}) ｜ 📜 已平倉歷史戰績     */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              activeTab === 'active'
                ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg shadow-amber-950/40'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>📈 持股中部位 ({portfolio.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              activeTab === 'history'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-950/40'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>📜 已平倉歷史戰績 ({tradeHistory.length})</span>
          </button>
        </div>

        {/* 快速加入個股表單 (僅在持股分頁顯示) */}
        {activeTab === 'active' && onAddStockBySymbol && (
          <form onSubmit={handleQuickAdd} className="hidden sm:flex items-center gap-1.5">
            <input
              type="text"
              value={quickSymbol}
              onChange={(e) => setQuickSymbol(e.target.value)}
              placeholder="快速加入代號 (例: 2330)"
              maxLength={4}
              className="w-48 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 font-mono focus:border-amber-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={isAdding}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{isAdding ? '加入中...' : '加入'}</span>
            </button>
          </form>
        )}
      </div>

      {addError && (
        <div className="p-2.5 rounded-xl bg-rose-950/50 border border-rose-500/40 text-xs text-rose-300">
          {addError}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. 分頁內容展示                                                           */}
      {/* ========================================================================= */}

      {/* 分頁 A: 持股中部位清單 */}
      {activeTab === 'active' && (
        <>
          {filteredPortfolio.length === 0 ? (
            <div className="rounded-3xl bg-slate-900/60 border border-slate-800 p-10 text-center space-y-4">
              <Briefcase className="w-12 h-12 text-slate-600 mx-auto" />
              <div>
                <h3 className="text-base font-bold text-white">自選清單目前為空</h3>
                <p className="text-xs text-slate-400 mt-1">
                  您可以透過波段篩選器納入潛力標的，或直接於上方輸入 4 碼代號加入持股追蹤。
                </p>
              </div>
              <button
                onClick={onNavigateToScreener}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition cursor-pointer shadow-md"
              >
                前往波段篩選器選股
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPortfolio.map((item) => {
                const curPrice = item.currentPrice ?? item.entryPrice;
                const costTotal = item.entryPrice * item.sharesLots * 1000;
                const valTotal = curPrice * item.sharesLots * 1000;
                const feeDiscount = typeof item.feeDiscount === 'number' && !isNaN(item.feeDiscount) ? item.feeDiscount : 60;
                const discountRatio = feeDiscount / 100;
                const buyFee = Math.max(20, Math.round(costTotal * 0.001425 * discountRatio));
                const sellFee = Math.max(20, Math.round(valTotal * 0.001425 * discountRatio));
                const sellTax = Math.round(valTotal * 0.003);
                const feeCostTotal = item.feeCostTotal ?? (buyFee + sellFee + sellTax);
                const grossPL = item.unrealizedPL ?? (valTotal - costTotal);
                const netPL = item.netPL ?? (grossPL - feeCostTotal);
                const grossReturnPct = costTotal > 0 ? Number(((grossPL / costTotal) * 100).toFixed(2)) : 0;
                const netReturnPct = costTotal > 0 ? Number(((netPL / costTotal) * 100).toFixed(2)) : 0;

                return (
                  <div
                    key={item.id}
                    className="rounded-2xl bg-slate-900 border border-slate-800 p-4 sm:p-5 flex flex-col justify-between space-y-4 shadow-lg hover:border-slate-700 transition"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-black text-white">{item.name}</h3>
                          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            {item.symbol}
                          </span>
                          {item.strategyType && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-semibold">
                              {item.strategyType === 'turnaround' ? '低基期轉型' : '動能突破'}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          建倉日期：{item.entryDate || '未設定'} ｜ 最新現價 <strong className="text-white">${curPrice.toFixed(2)}</strong>
                        </div>
                      </div>

                      {/* 損益金額與百分比 (以扣除手續費與證交稅之實拿淨損益為主，輔以毛損益小字) */}
                      <div className="text-right font-mono">
                        <div
                          className={`text-lg sm:text-xl font-black ${
                            netPL >= 0 ? 'text-rose-400' : 'text-emerald-400'
                          }`}
                        >
                          {netPL >= 0 ? '+' : ''}${Math.round(netPL).toLocaleString()}
                        </div>
                        <div
                          className={`text-xs font-bold ${
                            netReturnPct >= 0 ? 'text-rose-400' : 'text-emerald-400'
                          }`}
                        >
                          實拿淨報酬 {netReturnPct >= 0 ? '+' : ''}{netReturnPct}%
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          毛損益 {grossPL >= 0 ? '+' : ''}${Math.round(grossPL).toLocaleString()} (含預估稅費 -${Math.round(feeCostTotal).toLocaleString()})
                        </div>
                      </div>
                    </div>

                    {/* 5 項交易參數即時編輯 Grid (成本價, 張數, 手續費折數 %, 停損價, 目標價) */}
                    <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium border-b border-slate-900 pb-1.5">
                        <span className="flex items-center gap-1 text-slate-300">
                          <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                          <span>部位試算參數 (即時精算手續費低消20元與0.3%證交稅)</span>
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          市值 ${(valTotal).toLocaleString()}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono">
                        {/* 1. 進場成本價 */}
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 block font-sans">成本價 ($)</label>
                          <input
                            type="number"
                            step="0.05"
                            min="0"
                            value={item.entryPrice}
                            onChange={(e) =>
                              onUpdateItem(item.id, { entryPrice: parseFloat(e.target.value) || 0 })
                            }
                            className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2 py-1 text-white font-bold focus:border-amber-500 focus:outline-none text-xs"
                          />
                        </div>

                        {/* 2. 持有張數 */}
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 block font-sans">張數 (張)</label>
                          <input
                            type="number"
                            step="1"
                            min="1"
                            value={item.sharesLots}
                            onChange={(e) =>
                              onUpdateItem(item.id, { sharesLots: parseInt(e.target.value, 10) || 1 })
                            }
                            className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2 py-1 text-white font-bold focus:border-amber-500 focus:outline-none text-xs"
                          />
                        </div>

                        {/* 3. 券商折數 */}
                        <div className="space-y-1">
                          <label className="text-[10px] text-amber-300 block font-sans">折數 (%折)</label>
                          <input
                            type="number"
                            step="1"
                            min="0"
                            max="100"
                            value={item.feeDiscount ?? 60}
                            placeholder="60"
                            title="預設60代表6折 (60%)，低消20元"
                            onChange={(e) =>
                              onUpdateItem(item.id, { feeDiscount: parseFloat(e.target.value) || 60 })
                            }
                            className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2 py-1 text-amber-300 font-bold focus:border-amber-500 focus:outline-none text-xs"
                          />
                        </div>

                        {/* 4. 停損防守價 */}
                        <div className="space-y-1">
                          <label className="text-[10px] text-rose-400 block font-sans">停損防守 ($)</label>
                          <input
                            type="number"
                            step="0.05"
                            min="0"
                            value={item.stopLossPrice}
                            onChange={(e) =>
                              onUpdateItem(item.id, { stopLossPrice: parseFloat(e.target.value) || 0 })
                            }
                            className="w-full bg-slate-900 border border-rose-900/60 rounded-lg px-2 py-1 text-rose-300 font-bold focus:border-rose-500 focus:outline-none text-xs"
                          />
                        </div>

                        {/* 5. 目標獲利價 */}
                        <div className="space-y-1 col-span-2 sm:col-span-1">
                          <label className="text-[10px] text-emerald-400 block font-sans">目標價 ($)</label>
                          <input
                            type="number"
                            step="0.05"
                            min="0"
                            value={item.targetPrice || ''}
                            placeholder="未設定"
                            onChange={(e) =>
                              onUpdateItem(item.id, { targetPrice: parseFloat(e.target.value) || 0 })
                            }
                            className="w-full bg-slate-900 border border-emerald-900/60 rounded-lg px-2 py-1 text-emerald-300 font-bold focus:border-emerald-500 focus:outline-none text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 均線快速對齊按鈕 */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                      <div className="flex items-center gap-1.5">
                        {item.ma20 !== undefined && item.ma20 > 0 && (
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateItem(item.id, {
                                stopLossPrice: Number(item.ma20?.toFixed(1)),
                              })
                            }
                            className="px-2 py-0.5 rounded bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-[10px] font-mono text-blue-300 font-bold transition cursor-pointer"
                            title={`一鍵對齊 20MA 防守價 $${item.ma20.toFixed(1)}`}
                          >
                            ⚡ 對齊 20MA (${item.ma20.toFixed(1)})
                          </button>
                        )}
                        {netReturnPct > 10 && item.ma10 !== undefined && item.ma10 > 0 && (
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateItem(item.id, {
                                stopLossPrice: Number(item.ma10?.toFixed(1)),
                              })
                            }
                            className="px-2 py-0.5 rounded bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-[10px] font-mono text-amber-300 font-bold transition cursor-pointer"
                            title={`淨報酬率破10%！一鍵對齊 10MA 鎖利 $${item.ma10.toFixed(1)}`}
                          >
                            🔥 鎖利 10MA (${item.ma10.toFixed(1)})
                          </button>
                        )}
                      </div>

                      {item.notes && (
                        <span className="text-[11px] text-slate-500 truncate max-w-[150px]">
                          {item.notes}
                        </span>
                      )}
                    </div>

                    {/* Card Actions: 🎯 停利平倉 | 🛑 停損平倉 | 📊 主力分點 | 🗑️ 移除 */}
                    <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenCloseModal(item, 'TAKE_PROFIT')}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-500/40 text-emerald-300 hover:text-white text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-sm"
                          title="獲利達標，記錄平倉至交易日記"
                        >
                          <Target className="w-3.5 h-3.5" />
                          <span>🎯 停利平倉</span>
                        </button>

                        <button
                          onClick={() => handleOpenCloseModal(item, 'STOP_LOSS')}
                          className="px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 border border-rose-500/40 text-rose-300 hover:text-white text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-sm"
                          title="破線出場，記錄平倉虧損至交易日記"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>🛑 停損平倉</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onOpenStockDetail?.(item.symbol)}
                          className="p-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-bold border border-slate-700 transition cursor-pointer flex items-center gap-1"
                          title="查看主力分點籌碼"
                        >
                          <Building2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">主力分點</span>
                        </button>

                        <button
                          onClick={() => onRemoveItem(item.id)}
                          className="p-1.5 px-2 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700/60 text-xs transition cursor-pointer"
                          title="單純從自選移除 (不記入已實現損益)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* 分頁 B: 已平倉歷史戰績 (Trade Diary Table) */}
      {activeTab === 'history' && (
        <section className="rounded-3xl bg-slate-900 border border-slate-800 p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
                已平倉波段歷史戰績表
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                完整記錄每一筆交易的進出場價位、持有天數、已實現金額與出場紀律
              </p>
            </div>

            <div className="text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
              累計已實現淨損益：
              <strong
                className={`ml-1 text-sm ${
                  historyMetrics.totalRealizedPL >= 0 ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {historyMetrics.totalRealizedPL >= 0 ? '+' : ''}${Math.round(historyMetrics.totalRealizedPL).toLocaleString()} TWD
              </strong>
            </div>
          </div>

          {tradeHistory.length === 0 ? (
            <div className="py-12 text-center space-y-3 text-slate-400">
              <Trophy className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-white">尚無歷史平倉紀錄</p>
              <p className="text-xs max-w-md mx-auto">
                當您在持股部位卡片上點擊「🎯 停利平倉」或「🛑 停損平倉」時，將自動在此歸檔計算生涯勝率。
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px]">
                  <tr>
                    <th className="py-3 px-3">標的名稱</th>
                    <th className="py-3 px-3">策略 / 標籤</th>
                    <th className="py-3 px-3">進場 ~ 平倉日</th>
                    <th className="py-3 px-3 text-right">進場價</th>
                    <th className="py-3 px-3 text-right">出場價</th>
                    <th className="py-3 px-3 text-center">張數</th>
                    <th className="py-3 px-3 text-center">持有天數</th>
                    <th className="py-3 px-3 text-right">已實現損益 (TWD)</th>
                    <th className="py-3 px-3 text-right">報酬率 %</th>
                    <th className="py-3 px-3 text-center">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {tradeHistory.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-850/50 transition">
                      <td className="py-3 px-3">
                        <div className="font-bold text-white text-sm">{t.name}</div>
                        <div className="text-[11px] text-slate-400">{t.symbol}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            t.exitType === 'TAKE_PROFIT'
                              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                              : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                          }`}
                        >
                          {t.exitType === 'TAKE_PROFIT' ? '🎯 達標停利' : '🛑 紀律停損'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-300 text-[11px]">
                        <div>{t.entryDate || '-'}</div>
                        <div className="text-slate-500">至 {t.exitDate}</div>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-300">
                        ${t.entryPrice.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-white">
                        ${t.exitPrice.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-center text-slate-300">
                        {t.sharesLots} 張
                      </td>
                      <td className="py-3 px-3 text-center text-slate-400">
                        {t.holdingDays} 天
                      </td>
                      <td
                        className={`py-3 px-3 text-right font-black text-sm ${
                          t.realizedPL >= 0 ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {t.realizedPL >= 0 ? '+' : ''}${Math.round(t.realizedPL).toLocaleString()}
                      </td>
                      <td
                        className={`py-3 px-3 text-right font-bold ${
                          t.returnPct >= 0 ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {t.returnPct >= 0 ? '+' : ''}{t.returnPct}%
                      </td>
                      <td className="py-3 px-3 text-center">
                        {onDeleteTradeRecord && (
                          <button
                            onClick={() => onDeleteTradeRecord(t.id)}
                            className="p-1 rounded bg-slate-800 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                            title="刪除此平倉紀錄"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL: 修改初始本金對話框 (Edit Initial Capital Modal)                 */}
      {/* ========================================================================= */}
      {isCapitalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-750 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-400" />
                設定初始本金金額
              </h3>
              <button
                onClick={() => setIsCapitalModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCapital} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  請輸入您的初始操作本金 (TWD)
                </label>
                <input
                  type="number"
                  step="10000"
                  value={capitalInput}
                  onChange={(e) => setCapitalInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold focus:border-amber-500 focus:outline-none"
                  placeholder="例: 1000000"
                  required
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  將以此本金計算全帳戶資產總淨值與報酬率 %
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCapitalModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition cursor-pointer shadow-md"
                >
                  確認儲存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL: 平倉確認對話框 (Close Position Confirm Modal)                   */}
      {/* ========================================================================= */}
      {closingStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-750 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                {closeType === 'TAKE_PROFIT' ? (
                  <Target className="w-5 h-5 text-emerald-400" />
                ) : (
                  <ShieldAlert className="w-5 h-5 text-rose-400" />
                )}
                <h3 className="text-base font-bold text-white">
                  {closeType === 'TAKE_PROFIT' ? '🎯 停利平倉確認' : '🛑 停損平倉確認'}
                </h3>
              </div>
              <button
                onClick={() => setClosingStock(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">股票標的</span>
                <span className="text-white font-bold">{closingStock.name} ({closingStock.symbol})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">原始成本</span>
                <span className="text-slate-200 font-bold">${closingStock.entryPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">最新現價</span>
                <span className="text-white font-bold">${(closingStock.currentPrice ?? closingStock.entryPrice).toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  平倉賣出成交價 (TWD)
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={closePrice}
                  onChange={(e) => setClosePrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  平倉賣出張數 (張)
                </label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  max={closingStock.sharesLots}
                  value={closeLots}
                  onChange={(e) => setCloseLots(parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  交易日記備註
                </label>
                <input
                  type="text"
                  value={closeNote}
                  onChange={(e) => setCloseNote(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  placeholder="例: 達標停利 / 跌破20MA紀律停損"
                />
              </div>

              {/* 預估試算損益 (精算扣除手續費低消20元與0.3%證交稅) */}
              {(() => {
                const lots = closeLots > 0 ? closeLots : closingStock.sharesLots;
                const costAmt = closingStock.entryPrice * lots * 1000;
                const exitAmt = closePrice * lots * 1000;
                const feeDiscount = typeof closingStock.feeDiscount === 'number' && !isNaN(closingStock.feeDiscount) ? closingStock.feeDiscount : 60;
                const discountRatio = feeDiscount / 100;
                const buyFee = Math.max(20, Math.round(costAmt * 0.001425 * discountRatio));
                const sellFee = Math.max(20, Math.round(exitAmt * 0.001425 * discountRatio));
                const sellTax = Math.round(exitAmt * 0.003);
                const totalFees = buyFee + sellFee + sellTax;
                const grossPL = exitAmt - costAmt;
                const netPL = grossPL - totalFees;
                const netReturnPct = costAmt > 0 ? Number(((netPL / costAmt) * 100).toFixed(2)) : 0;

                return (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">試算實拿淨損益：</span>
                      <span
                        className={`text-base font-black ${
                          netPL >= 0 ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {netPL >= 0 ? '+' : ''}${Math.round(netPL).toLocaleString()} TWD
                        {' '}({netReturnPct >= 0 ? '+' : ''}{netReturnPct}%)
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-900 pt-1">
                      <span>毛損益: {grossPL >= 0 ? '+' : ''}${Math.round(grossPL).toLocaleString()}</span>
                      <span>預估稅費: -${Math.round(totalFees).toLocaleString()} ({feeDiscount}折手續費+0.3%稅)</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setClosingStock(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmClose}
                className={`px-4 py-2 rounded-xl text-white text-xs font-bold transition cursor-pointer shadow-md ${
                  closeType === 'TAKE_PROFIT'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                確認平倉並存入交易日記
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
