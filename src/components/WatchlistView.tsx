import React, { useState } from 'react';
import {
  Briefcase,
  AlertTriangle,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  TrendingDown,
  UserMinus,
  Trash2,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  PlusCircle,
  FileText,
  Search,
  RefreshCw,
  Clock,
  Building2,
  Plus,
  ChevronDown,
  ChevronUp,
  SunMedium,
  ShieldCheck,
} from 'lucide-react';
import { PortfolioStockItem, WatchlistAlertDetail, WatchlistBriefingResponse } from '../types/stock';
import { MarkdownRenderer } from './MarkdownRenderer';

interface WatchlistViewProps {
  portfolio: PortfolioStockItem[];
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
}

export function WatchlistView({
  portfolio,
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
}: WatchlistViewProps) {
  const [isBriefingExpanded, setIsBriefingExpanded] = useState(true);
  const [quickSymbol, setQuickSymbol] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

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

  // Calculate stocks with active health alerts (排除已判定為主力洗盤甩轎・建議續抱之標的)
  const alertStocks = portfolio.filter(
    (item) =>
      item.decisionRating !== 'SHAKEOUT_HOLD' &&
      item.healthAlerts &&
      item.healthAlerts.some((a) => a.severity === 'danger' || a.severity === 'warning')
  );

  // Summary Metrics
  const summary = React.useMemo(() => {
    let totalCost = 0;
    let totalValue = 0;
    let totalPL = 0;

    for (const item of portfolio) {
      const curPrice = item.currentPrice ?? item.entryPrice;
      const cost = item.entryPrice * item.sharesLots * 1000;
      const value = curPrice * item.sharesLots * 1000;
      totalCost += cost;
      totalValue += value;
      totalPL += value - cost;
    }

    const totalReturnPct = totalCost > 0 ? Number(((totalPL / totalCost) * 100).toFixed(2)) : 0;
    return {
      totalCost,
      totalValue,
      totalPL,
      totalReturnPct,
      totalCount: portfolio.length,
      alertCount: alertStocks.length,
      healthyCount: portfolio.length - alertStocks.length,
    };
  }, [portfolio, alertStocks]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ========================================================================= */}
      {/* 0. 📊 TOP SECTION: 自選持股每日量化晨會戰報 (Gemini 2.5 Pro 旗艦體檢)        */}
      {/* ========================================================================= */}
      <section className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-2xl p-5 sm:p-7 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
              <SunMedium className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">自選持股每日量化晨會戰報</h2>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-mono flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  {watchlistBriefing?.model ? `${watchlistBriefing.model} 旗艦推理` : 'Gemini 2.5 Pro 旗艦推理'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                專屬體檢當前 {portfolio.length} 檔自選持股：防主力甩轎、昨日法人融資籌碼消長與 20MA 防守點
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {watchlistBriefing && watchlistBriefing.isGenerated && watchlistBriefing.markdown && (
              <button
                onClick={() => onGenerateBriefing?.(true)}
                disabled={isBriefingGenerating}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
                title="重新啟動 Gemini 2.5 Pro 進行專屬體檢"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${
                    isBriefingGenerating ? 'animate-spin text-amber-400' : ''
                  }`}
                />
                <span>{isBriefingGenerating ? '體檢中...' : '🔄 重新分析'}</span>
              </button>
            )}

            <button
              onClick={() => setIsBriefingExpanded((prev) => !prev)}
              className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              title={isBriefingExpanded ? '收合戰報' : '展開戰報'}
            >
              {isBriefingExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* State 1: Generating animation */}
        {isBriefingGenerating ? (
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
                Gemini 2.5 Pro 自選持股量化體檢中...
              </h4>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md">
                正在全維度對帳昨日法人籌碼、融資浮額消長與每檔股票 20MA 防守點位...
              </p>
            </div>
            <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-500 w-full animate-pulse" />
            </div>
          </div>
        ) : (!watchlistBriefing || !watchlistBriefing.isGenerated || !watchlistBriefing.markdown) ? (
          /* State 2: Un-generated Prompt Guidance Card */
          <div className="mt-5 p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-indigo-950/20 via-slate-950 to-slate-900 border border-indigo-500/30 text-center flex flex-col items-center justify-center shadow-inner">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-2xl mb-3 shadow-md">
              📊
            </div>
            <h4 className="text-lg sm:text-xl font-bold text-white tracking-wide">
              今日自選持股量化戰報尚未產出
            </h4>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-md leading-relaxed">
              建議於早上 08:00 ~ 08:50 或開盤前點擊產出，由 Gemini 2.5 Pro 針對您當前關注的 {portfolio.length} 檔持股進行深度量化體檢。
            </p>
            <button
              onClick={() => onGenerateBriefing?.(true)}
              disabled={isBriefingGenerating || portfolio.length === 0}
              className="mt-5 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 hover:from-amber-400 hover:via-rose-400 hover:to-indigo-500 text-white font-bold text-sm sm:text-base shadow-lg shadow-indigo-950/60 hover:shadow-indigo-900/80 transition-all flex items-center gap-2.5 transform active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-5 h-5 text-amber-200" />
              <span>⚡ 產出今日自選持股戰報 (Gemini 2.5 Pro)</span>
            </button>
          </div>
        ) : isBriefingExpanded ? (
          /* State 3: Display Generated Briefing */
          <div className="mt-5 p-5 rounded-2xl bg-slate-950/80 border border-slate-800/90 shadow-inner">
            <MarkdownRenderer content={watchlistBriefing.markdown} />
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5 text-indigo-400/90 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                當日持久快取生效中（Gemini 2.5 Pro 自選股專屬量化體檢・0秒秒開）
              </span>
              <button
                onClick={() => onGenerateBriefing?.(true)}
                disabled={isBriefingGenerating}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-indigo-300 hover:text-white border border-indigo-500/30 text-[11px] font-medium flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
                title="重新啟動 Gemini 2.5 Pro 深度體檢"
              >
                <RefreshCw
                  className={`w-3 h-3 ${isBriefingGenerating ? 'animate-spin text-amber-400' : ''}`}
                />
                <span>{isBriefingGenerating ? '體檢中...' : '🔄 重新分析最新持股'}</span>
              </button>
            </div>
          </div>
        ) : null}
      </section>

      {/* ========================================================================= */}
      {/* 1. 🚨 TOP SECTION: 自選股破線/減碼警訊清單 (Red Alert Card)                 */}
      {/* ========================================================================= */}
      {alertStocks.length > 0 && (
        <section className="rounded-3xl bg-gradient-to-br from-rose-950/60 via-slate-900 to-rose-950/40 border-2 border-rose-500/80 shadow-2xl p-5 sm:p-6 relative overflow-hidden">
          {/* Background Ambient Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Alert Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-rose-500/30">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-600/20 border border-rose-500/50 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-950">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-black text-rose-300 tracking-tight">
                    🚨 自選股破線/減碼警訊清單
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-xs font-black animate-bounce">
                    {alertStocks.length} 檔警戒
                  </span>
                </div>
                <p className="text-xs text-rose-200/80 mt-0.5">
                  波段紀律最高原則：破線即走、杜絕凹單！請依序檢視下方警訊個股並果斷處理。
                </p>
              </div>
            </div>

            <div className="text-xs text-rose-300/80 font-mono flex items-center gap-1.5 self-start sm:self-auto bg-rose-950/80 px-3 py-1.5 rounded-xl border border-rose-800/60">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>晚間 21:30 籌碼深層防洗盤雙重驗證</span>
            </div>
          </div>

          {/* Alert Stocks Grid */}
          <div className="mt-4 space-y-3">
            {alertStocks.map((stock) => {
              const curPrice = stock.currentPrice ?? stock.entryPrice;

              return (
                <div
                  key={`alert-${stock.id}`}
                  className="rounded-2xl bg-slate-950/90 border border-rose-500/40 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg hover:border-rose-400 transition"
                >
                  {/* Left: Stock info & detailed trigger reasons */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="text-lg font-black text-white">{stock.name}</span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                        {stock.symbol}
                      </span>
                      {stock.decisionRating === 'CONFIRMED_STOP_LOSS' ? (
                        <span className="text-xs px-2.5 py-0.5 rounded bg-rose-600 text-white font-extrabold border border-rose-400 shadow-md animate-pulse">
                          🚨 破線出貨・執行停損
                        </span>
                      ) : stock.decisionRating === 'SHAKEOUT_HOLD' ? (
                        <span className="text-xs px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                          🛡️ 主力洗盤甩轎・建議續抱
                        </span>
                      ) : stock.decisionRating === 'SELL' ? (
                        <span className="text-xs px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40">
                          🔴 評定翻空 (SELL)
                        </span>
                      ) : stock.decisionRating === 'TRIM' ? (
                        <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                          🟠 建議減碼 (TRIM)
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40">
                          🚨 破線警戒
                        </span>
                      )}
                      <span className="text-xs text-slate-400">
                        現價 <strong className="text-white text-sm">${curPrice.toFixed(2)}</strong> / 停損錨定價 <strong className="text-rose-400 text-sm">${stock.stopLossPrice.toFixed(2)}</strong>
                      </span>
                    </div>

                    {/* Breakdown Reasons */}
                    <div className="space-y-1 pt-1">
                      {stock.healthAlerts?.map((alert, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2 text-xs text-rose-200/90"
                        >
                          <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
                          <div>
                            <strong className="text-rose-300">{alert.title}：</strong>
                            <span>{alert.description}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-wrap items-center gap-3 self-end md:self-center flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800 w-full md:w-auto justify-between md:justify-end">
                    <div className="text-right">
                      <div className="text-[11px] text-slate-400">當前損益</div>
                      <div
                        className={`text-sm font-extrabold ${
                          (stock.unrealizedPL ?? 0) >= 0 ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {(stock.unrealizedPL ?? 0) >= 0 ? '+' : ''}
                        ${stock.unrealizedPL?.toLocaleString()} TWD
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onOpenStockDetail?.(stock.symbol)}
                        className="px-3 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                        title="查看主力分點籌碼與走勢"
                      >
                        <Building2 className="w-3.5 h-3.5" />
                        <span>主力分點籌碼</span>
                      </button>

                      <button
                        onClick={() => onRemoveItem(stock.id)}
                        className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-900/40 transition active:scale-95 cursor-pointer"
                        title="一鍵將此破線股票從自選清單移除"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>從自選移除</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 2. Portfolio Summary Header & Real-time Live Price Refresh Controls       */}
      {/* ========================================================================= */}
      <section className="rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-5 border-b border-slate-800">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-amber-400" />
                自選持股波段管理儀表板
              </h1>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>證交所 MIS 即時撮合同步</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              自動依據市場最新即時價格動態試算未實現損益，全天候監控停損防守、均線排列與籌碼風控
            </p>
          </div>

          {/* Real-time Refresh Action & Profit Status */}
          <div className="flex flex-wrap items-center gap-4 justify-between lg:justify-end">
            {/* Real-time Refresh Quotes Button */}
            {onRefreshQuotes && (
              <div className="flex flex-col items-end gap-1">
                <button
                  onClick={onRefreshQuotes}
                  disabled={isRefreshingQuotes}
                  className="px-3.5 py-2 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 hover:text-white flex items-center gap-2 transition active:scale-95 shadow cursor-pointer disabled:opacity-50"
                  title="立即連線證交所 MIS 刷新自選股即時價格"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-rose-400 ${isRefreshingQuotes ? 'animate-spin' : ''}`} />
                  <span>{isRefreshingQuotes ? '正在更新最新現價...' : '即時刷新現價'}</span>
                </button>
                {lastQuotesUpdatedAt && (
                  <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    最後更新：{lastQuotesUpdatedAt}
                  </span>
                )}
              </div>
            )}

            <div className="text-right">
              <div className="text-xs text-slate-500">未實現總損益</div>
              <div
                className={`text-2xl font-black ${
                  summary.totalPL >= 0 ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {summary.totalPL >= 0 ? '+' : ''}
                ${summary.totalPL.toLocaleString()} TWD
                <span className="text-sm font-bold ml-2">
                  ({summary.totalReturnPct > 0 ? '+' : ''}
                  {summary.totalReturnPct}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Add Custom Stock Input Bar */}
        <div className="mt-4 pt-4 border-t border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <form onSubmit={handleQuickAdd} className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <input
                type="text"
                value={quickSymbol}
                onChange={(e) => {
                  setQuickSymbol(e.target.value);
                  if (addError) setAddError(null);
                }}
                placeholder="輸入 4 碼股票代號 (例: 2330)"
                maxLength={4}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 font-mono uppercase"
              />
            </div>
            <button
              type="submit"
              disabled={isAdding || !quickSymbol.trim()}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-xs font-bold transition flex items-center gap-1.5 shadow shadow-rose-900/30 disabled:opacity-50 cursor-pointer flex-shrink-0"
            >
              {isAdding ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>新增中...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>加入自選</span>
                </>
              )}
            </button>
          </form>
          {addError && <span className="text-xs text-rose-400 font-medium">{addError}</span>}
          <div className="text-[11px] text-slate-500 hidden sm:block">
            支援輸入任意上市櫃股票代號，自動抓取即時撮合現價與 20MA 均線風控
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80">
            <span className="text-slate-500">總追蹤檔數</span>
            <div className="text-lg font-bold text-white mt-0.5">
              {summary.totalCount} 檔
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80">
            <span className="text-slate-500">總持股市值</span>
            <div className="text-lg font-bold text-white mt-0.5">
              ${summary.totalValue.toLocaleString()} TWD
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80">
            <span className="text-slate-500">健康運行檔數</span>
            <div className="text-lg font-bold text-emerald-400 mt-0.5 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>{summary.healthyCount} 檔正常</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80">
            <span className="text-slate-500">破線警報警戒</span>
            <div className="text-lg font-bold text-rose-400 mt-0.5 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" />
              <span>{summary.alertCount} 檔警戒</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. Watchlist Items List                                                   */}
      {/* ========================================================================= */}
      {filteredPortfolio.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900/50 border border-slate-800 text-slate-400">
          <Briefcase className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-300">
            {portfolio.length === 0 ? '自選清單目前尚無任何標的' : '查無符合搜尋條件之自選個股'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            {portfolio.length === 0
              ? '可使用上方輸入框直接新增任意股票，或至「波段篩選器」挑選優質個股加入自選追蹤。'
              : '請嘗試清除搜尋關鍵字以檢視所有自選持股。'}
          </p>
          {portfolio.length === 0 && (
            <button
              onClick={onNavigateToScreener}
              className="mt-4 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-xs font-bold transition shadow-lg shadow-rose-900/30 cursor-pointer"
            >
              前往波段篩選器選股
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>共有 {filteredPortfolio.length} 檔自選持股（點擊股票名稱可查看「主力分點籌碼」）</span>
            <span>可直接編輯「成本價」、「張數」與「停損/目標價」即時試算</span>
          </div>

          {filteredPortfolio.map((item) => {
            const curPrice = item.currentPrice ?? item.entryPrice;
            const hasAlert = item.healthAlerts && item.healthAlerts.length > 0;
            const isStopBroken = curPrice < item.stopLossPrice;
            const isTargetReached = curPrice >= item.targetPrice;
            const isPriceUp = (item.change ?? 0) >= 0;

            return (
              <div
                key={item.id}
                className={`p-5 sm:p-6 rounded-3xl bg-slate-900 border transition-all ${
                  item.decisionRating === 'SHAKEOUT_HOLD'
                    ? 'border-blue-500/70 bg-gradient-to-b from-slate-900 to-blue-950/20'
                    : isStopBroken || (hasAlert && item.decisionRating === 'SELL') || item.decisionRating === 'CONFIRMED_STOP_LOSS'
                    ? 'border-rose-500/80 bg-gradient-to-b from-slate-900 to-rose-950/20'
                    : hasAlert
                    ? 'border-amber-500/70 bg-gradient-to-b from-slate-900 to-amber-950/15'
                    : isTargetReached
                    ? 'border-emerald-500/70 bg-gradient-to-b from-slate-900 to-emerald-950/15'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Header Row: Symbol, Name, Strategy, Price & Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => onOpenStockDetail?.(item.symbol)}
                        className="text-xl font-black text-white hover:text-rose-400 transition cursor-pointer flex items-center gap-1.5"
                        title="點擊查看個股詳情與主力分點籌碼"
                      >
                        <span>{item.name}</span>
                      </button>
                      <button
                        onClick={() => onOpenStockDetail?.(item.symbol)}
                        className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition cursor-pointer"
                        title="點擊查看個股詳情與主力分點籌碼"
                      >
                        {item.symbol}
                      </button>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-medium">
                        {item.strategyType === 'turnaround' ? '價值轉型' : '動能突破'}
                      </span>

                      {/* Health Status Badge */}
                      {item.decisionRating === 'SHAKEOUT_HOLD' ? (
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 font-bold flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          🛡️ 主力洗盤甩轎・建議續抱
                        </span>
                      ) : (item.decisionRating === 'CONFIRMED_STOP_LOSS' || isStopBroken) ? (
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 font-bold flex items-center gap-1">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          🚨 破線出貨・執行停損
                        </span>
                      ) : hasAlert ? (
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          ⚠️ 減碼警戒中
                        </span>
                      ) : (
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          波段健康運行
                        </span>
                      )}

                      <span className="text-xs text-slate-500">加入日 {item.entryDate}</span>
                    </div>

                    {/* Diagnostic Note or Alert Reasons List */}
                    {item.diagnosticNote && (
                      <div className="mt-2 text-xs text-blue-200/90 bg-blue-950/40 border border-blue-800/40 rounded-lg px-2.5 py-1.5 flex items-start gap-1.5">
                        <span className="flex-shrink-0 font-bold">💡 籌碼深層診斷：</span>
                        <span>{item.diagnosticNote}</span>
                      </div>
                    )}

                    {item.healthAlerts && item.healthAlerts.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {item.healthAlerts.map((alert, idx) => (
                          <div
                            key={idx}
                            className={`text-xs flex items-center gap-1.5 ${
                              alert.severity === 'shakeout'
                                ? 'text-blue-300'
                                : alert.severity === 'danger'
                                ? 'text-rose-300'
                                : 'text-amber-300'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                alert.severity === 'shakeout'
                                  ? 'bg-blue-400'
                                  : alert.severity === 'danger'
                                  ? 'bg-rose-400'
                                  : 'bg-amber-400'
                              }`}
                            />
                            <span>
                              <strong>{alert.title}：</strong>
                              {alert.description}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Real-time Current Price & Unrealized P&L */}
                  <div className="text-right flex sm:flex-col justify-between sm:justify-center items-end">
                    <div className="text-xs text-slate-400">
                      最新現價{' '}
                      <span className="text-white font-extrabold text-base font-mono">
                        ${curPrice.toFixed(2)}
                      </span>
                      {item.change !== undefined && (
                        <span
                          className={`ml-1.5 font-bold font-mono text-xs ${
                            isPriceUp ? 'text-rose-400' : 'text-emerald-400'
                          }`}
                        >
                          {isPriceUp ? '+' : ''}
                          {item.change.toFixed(2)} ({isPriceUp ? '+' : ''}
                          {item.changePercent?.toFixed(2)}%)
                        </span>
                      )}
                      {item.updateTime && (
                        <span className="text-[10px] text-slate-500 font-mono ml-1.5">
                          撮合 {item.updateTime}
                        </span>
                      )}
                    </div>
                    <div
                      className={`text-base font-black ${
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

                {/* Edit Controls: Entry Price, Lots, Stop Loss, Target */}
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
                        onUpdateItem(item.id, {
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
                        onUpdateItem(item.id, {
                          sharesLots: parseFloat(e.target.value) || 1,
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white font-mono focus:border-rose-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                      <label className="text-[11px] text-rose-400 font-semibold">
                        停損防守價 (TWD)
                      </label>
                      <div className="flex items-center gap-1">
                        {item.ma20 !== undefined && item.ma20 > 0 && (
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateItem(item.id, {
                                stopLossPrice: Number(item.ma20?.toFixed(1)),
                              })
                            }
                            className="px-1.5 py-0.5 rounded bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-[10px] font-mono text-blue-300 font-bold transition active:scale-95 cursor-pointer flex items-center gap-0.5"
                            title={`一鍵對齊最新 20MA 防守價 $${item.ma20.toFixed(1)}`}
                          >
                            <span>⚡ 對齊 20MA (${item.ma20.toFixed(1)})</span>
                          </button>
                        )}
                        {(item.returnPct ?? 0) > 10 && item.ma10 !== undefined && item.ma10 > 0 && (
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateItem(item.id, {
                                stopLossPrice: Number(item.ma10?.toFixed(1)),
                              })
                            }
                            className="px-1.5 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-[10px] font-mono text-amber-300 font-bold transition active:scale-95 cursor-pointer flex items-center gap-0.5"
                            title={`目前報酬率 +${item.returnPct}% 達標！一鍵對齊 10MA 鎖利 $${item.ma10.toFixed(1)}`}
                          >
                            <span>🔥 鎖利 10MA (${item.ma10.toFixed(1)})</span>
                          </button>
                        )}
                      </div>
                    </div>
                    <input
                      type="number"
                      step="0.1"
                      value={item.stopLossPrice}
                      onChange={(e) =>
                        onUpdateItem(item.id, {
                          stopLossPrice: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full bg-slate-950 border border-rose-900/60 rounded-xl px-2.5 py-1.5 text-rose-300 font-mono focus:border-rose-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-emerald-400 block mb-1 font-semibold">
                      目標獲利價 (TWD)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={item.targetPrice}
                      onChange={(e) =>
                        onUpdateItem(item.id, {
                          targetPrice: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full bg-slate-950 border border-emerald-900/60 rounded-xl px-2.5 py-1.5 text-emerald-300 font-mono focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Bottom Bar: Action buttons (主力分點籌碼 + 移除) */}
                <div className="mt-3 pt-3 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3 text-slate-400">
                    {item.ma20 !== undefined && (
                      <span>
                        20MA月線 <strong className="text-slate-300 font-mono">${item.ma20.toFixed(1)}</strong>
                      </span>
                    )}
                    {item.notes && (
                      <span className="text-slate-500 truncate max-w-xs">{item.notes}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenStockDetail?.(item.symbol)}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                      title="查看此檔個股最近 5 日主力分點券商買賣超金額與籌碼動向"
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span>主力分點籌碼</span>
                    </button>

                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="p-1.5 px-2.5 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700/60 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                      title="從自選移除此標的"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>移除</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

