import React, { useState } from 'react';
import { Stock, DecisionVerdict } from '../types/stock';
import {
  Target,
  Filter,
  TrendingUp,
  ShieldAlert,
  Sparkles,
  ArrowUpRight,
  Flame,
  CheckCircle2,
  AlertTriangle,
  BarChart2,
  Newspaper,
  Compass,
  Building,
  Star,
  RefreshCw,
  XCircle,
  ChevronDown,
  ChevronUp,
  Eye,
} from 'lucide-react';

interface ScreenerDecisionViewProps {
  stocks: Stock[];
  onSelectStock: (stock: Stock) => void;
  onOpenResearch: (stock: Stock) => void;
  onOpenChart: (stock: Stock) => void;
  onOpenPaperTrade?: (stock: Stock) => void;
  colorMode: 'tw' | 'intl';
  watchlistSymbols?: string[];
  onToggleWatchlist?: (stock: Stock) => void;
  onRefreshStocks?: () => void;
  isRefreshing?: boolean;
}

type ScreenerFilter =
  | 'ALL'
  | 'PATTERN_1_MA'
  | 'PATTERN_2_RULE123'
  | 'PATTERN_3_BOX_BREAKOUT'
  | 'BUY_SIGNAL'
  | 'SUITABLE_ENTRY';

type PoolSource = 'STRATEGY_AND_FLOW' | 'WATCHLIST' | 'ALL';

export const ScreenerDecisionView: React.FC<ScreenerDecisionViewProps> = ({
  stocks,
  onSelectStock,
  onOpenResearch,
  onOpenChart,
  onOpenPaperTrade,
  colorMode,
  watchlistSymbols = [],
  onToggleWatchlist,
  onRefreshStocks,
  isRefreshing = false,
}) => {
  const [filter, setFilter] = useState<ScreenerFilter>('ALL');
  const [poolSource, setPoolSource] = useState<PoolSource>('STRATEGY_AND_FLOW');
  const [showEliminated, setShowEliminated] = useState(false);

  const isRedUp = colorMode === 'tw';
  const upColor = isRedUp ? '#ef4444' : '#10b981';
  const downColor = isRedUp ? '#10b981' : '#ef4444';

  // 1. 純依據量化策略門檻動態過濾基礎池 (完全移除任何寫死代號)
  const basePool = stocks.filter((stk) => {
    if (poolSource === 'WATCHLIST') {
      return watchlistSymbols.includes(stk.symbol);
    }
    if (poolSource === 'STRATEGY_AND_FLOW') {
      const decision = stk.decision;
      if (!decision) return false;
      // 策略門檻：必須至少具備「強勢評定」、「123反轉確認」、「均線多頭排列」或「放量起漲」任一核心多方條件
      return (
        decision.verdict === 'STRONG_BUY' ||
        decision.verdict === 'BUY' ||
        decision.rule123Status === 'PASSED' ||
        decision.maAlignment === 'BULLISH' ||
        decision.volumeStatus === 'EXPANDING'
      );
    }
    return true;
  });

  // 2. 嚴格依照策略條件篩選，不符合者即時自清單剔除
  const filteredStocks = basePool
    .filter((stk) => {
      const decision = stk.decision;
      if (!decision) return false;

      if (filter === 'BUY_SIGNAL') {
        return decision.verdict === 'STRONG_BUY' || decision.verdict === 'BUY';
      }
      if (filter === 'PATTERN_1_MA') {
        return decision.maAlignment === 'BULLISH';
      }
      if (filter === 'PATTERN_2_RULE123') {
        return decision.rule123Status === 'PASSED';
      }
      if (filter === 'PATTERN_3_BOX_BREAKOUT') {
        return decision.volumeStatus === 'EXPANDING' || (stk.changePercent > 0 && decision.riskRewardRatio >= 2.0);
      }
      if (filter === 'SUITABLE_ENTRY') {
        return (
          decision.entryTiming?.suitability === 'SUITABLE_NOW' ||
          decision.entryTiming?.suitability === 'BREAKOUT_EARLY'
        );
      }
      return true;
    })
    .sort((a, b) => {
      const scoreA = a.decision?.score ?? 50;
      const scoreB = b.decision?.score ?? 50;
      if (scoreB !== scoreA) return scoreB - scoreA;
      return (b.decision?.riskRewardRatio ?? 0) - (a.decision?.riskRewardRatio ?? 0);
    });

  // 計算因當前篩選條件被剔除之標的清單與具體淘汰原因
  const eliminatedStocks = basePool
    .filter((stk) => !filteredStocks.some((f) => f.symbol === stk.symbol))
    .map((stk) => {
      const decision = stk.decision;
      let brokenReason = '未達標';
      if (filter === 'BUY_SIGNAL') {
        brokenReason = `評定為 ${decision?.verdict === 'WATCH' ? '區間觀望' : decision?.verdict === 'TRIM' ? '分批減碼' : '賣出'} (未達買進訊號門檻)`;
      } else if (filter === 'PATTERN_1_MA') {
        brokenReason = decision?.maAlignment === 'BEARISH' ? '均線空頭排列（5MA < 10MA < 20MA）' : '均線震盪糾結，尚未多頭排列發散';
      } else if (filter === 'PATTERN_2_RULE123') {
        brokenReason = decision?.rule123Status === 'FAILED' ? '跌破當周低點，破底危機未解' : '裸K 123反轉型態建構中，尚未突破頸線';
      } else if (filter === 'PATTERN_3_BOX_BREAKOUT') {
        brokenReason = (decision?.riskRewardRatio ?? 0) < 2.0 ? `盈虧比僅 1:${decision?.riskRewardRatio}，風報比不足` : '成交量未達 1.5~4 倍主力放量起漲點火標準';
      } else if (filter === 'SUITABLE_ENTRY') {
        brokenReason = (decision?.entryTiming?.bias5ma ?? 0) > 6 ? `5MA短線乖離過大 (+${decision?.entryTiming?.bias5ma}%)，短線過熱嚴禁追高` : '回測均線支撐尚未確認';
      } else {
        brokenReason = decision?.verdict === 'SELL' ? '模型賣出訊號' : '未達多方策略篩選條件';
      }
      return {
        symbol: stk.symbol,
        name: stk.name,
        price: stk.price,
        changePercent: stk.changePercent,
        score: decision?.score ?? 50,
        brokenReason,
      };
    });

  return (
    <div className="space-y-5">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Target className="w-4 h-4" />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                【講義選股體系】智能買賣決策篩選器
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300 font-medium">
                DNAI 股票班法則
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              依據趨勢投資人講義精華：結合「日周線均線多頭排列」、「裸K 123 法則反轉確認」、「壓力線帶量突破 (預估量1.5~4倍)」、「盈虧比至少 1:2」與「當周低點嚴格停損」，為您快速過濾最佳買賣標的！
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {onRefreshStocks && (
              <button
                onClick={onRefreshStocks}
                disabled={isRefreshing}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
                <span>{isRefreshing ? '策略掃描中...' : '重新依策略篩選'}</span>
              </button>
            )}

            <div className="flex items-center gap-3 font-mono text-xs text-slate-300 bg-slate-950/70 p-3 rounded-xl border border-slate-800 shrink-0">
              <div>
                <span className="text-slate-400 text-[11px] block">篩選標的池</span>
                <strong className="text-white text-sm">{stocks.length} 檔</strong>
              </div>
              <div className="border-l border-slate-800 pl-3">
                <span className="text-emerald-400 text-[11px] block">買進訊號</span>
                <strong className="text-emerald-400 text-sm">
                  {stocks.filter((s) => s.decision?.verdict === 'STRONG_BUY' || s.decision?.verdict === 'BUY').length} 檔
                </strong>
              </div>
              <div className="border-l border-slate-800 pl-3">
                <span className="text-amber-400 text-[11px] block">區間觀望/減碼</span>
                <strong className="text-amber-400 text-sm">
                  {stocks.filter((s) => s.decision?.verdict === 'WATCH' || s.decision?.verdict === 'TRIM').length} 檔
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pool Source Selector (策略選出 / 題材資金流入 vs 自選股) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-300">選股來源池：</span>
          <div className="inline-flex rounded-lg bg-slate-900 p-0.5 border border-slate-700/80">
            <button
              onClick={() => setPoolSource('STRATEGY_AND_FLOW')}
              className={`px-3 py-1.5 rounded-md font-bold transition-colors flex items-center gap-1.5 ${
                poolSource === 'STRATEGY_AND_FLOW'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              【策略選出與題材資金流】({stocks.filter((s) => s.decision && (s.decision.verdict === 'STRONG_BUY' || s.decision.verdict === 'BUY' || s.decision.rule123Status === 'PASSED' || s.decision.maAlignment === 'BULLISH' || s.decision.volumeStatus === 'EXPANDING')).length})
            </button>
            <button
              onClick={() => setPoolSource('WATCHLIST')}
              className={`px-3 py-1.5 rounded-md font-bold transition-colors flex items-center gap-1.5 ${
                poolSource === 'WATCHLIST'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              我的自選股診斷 ({watchlistSymbols.length})
            </button>
            <button
              onClick={() => setPoolSource('ALL')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                poolSource === 'ALL'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              全部市場標的 ({stocks.length})
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-[11px] font-mono text-slate-400 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800 flex items-center gap-2">
            <span>策略篩選結果：</span>
            <strong className="text-emerald-400">{filteredStocks.length} 檔符合</strong>
            <span className="text-slate-500">/</span>
            <span className="text-rose-400">已自動剔除 {eliminatedStocks.length} 檔破線不符</span>
          </div>

          {eliminatedStocks.length > 0 && (
            <button
              onClick={() => setShowEliminated((prev) => !prev)}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold bg-rose-950/40 px-2.5 py-1 rounded-lg border border-rose-900/60"
            >
              <Eye className="w-3 h-3" />
              <span>{showEliminated ? '收起淘汰診斷' : `查看汰除原因 (${eliminatedStocks.length})`}</span>
              {showEliminated ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
        </div>
      </div>

      {/* 展開：不符合策略之淘汰清單 */}
      {showEliminated && eliminatedStocks.length > 0 && (
        <div className="bg-slate-950/80 border border-rose-950/60 rounded-xl p-3.5 space-y-2 text-xs">
          <div className="flex items-center justify-between pb-1 border-b border-rose-950/50">
            <span className="text-slate-400">以下標的因不符合目前策略條件（如均線走空、123型態未完成、乖離過大或未放量），已自動由清單中剔除：</span>
            <span className="font-mono text-rose-400">{eliminatedStocks.length} 檔</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
            {eliminatedStocks.map((e) => (
              <div key={e.symbol} className="bg-slate-900/90 border border-slate-800 rounded p-2 text-xs">
                <div className="flex items-center justify-between font-mono mb-1">
                  <strong className="text-white">{e.name} ({e.symbol})</strong>
                  <span className={e.changePercent >= 0 ? 'text-rose-400' : 'text-emerald-400'}>
                    {e.price}元 ({e.changePercent >= 0 ? '+' : ''}{e.changePercent}%)
                  </span>
                </div>
                <p className="text-[11px] text-rose-300 leading-snug">{e.brokenReason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
            filter === 'ALL'
              ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
              : 'text-slate-400 hover:text-white bg-slate-900/60'
          }`}
        >
          全體候選 ({basePool.length})
        </button>
        <button
          onClick={() => setFilter('PATTERN_1_MA')}
          className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
            filter === 'PATTERN_1_MA'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-emerald-400 hover:text-white bg-slate-900/60 border border-emerald-900/50'
          }`}
        >
          🔥【型態一】均線多頭排列 ({basePool.filter((s) => s.decision?.maAlignment === 'BULLISH').length})
        </button>
        <button
          onClick={() => setFilter('PATTERN_2_RULE123')}
          className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
            filter === 'PATTERN_2_RULE123'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-indigo-400 hover:text-white bg-slate-900/60 border border-indigo-900/50'
          }`}
        >
          🚀【型態二】裸K 1-2-3 反轉 ({basePool.filter((s) => s.decision?.rule123Status === 'PASSED').length})
        </button>
        <button
          onClick={() => setFilter('PATTERN_3_BOX_BREAKOUT')}
          className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
            filter === 'PATTERN_3_BOX_BREAKOUT'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-amber-400 hover:text-white bg-slate-900/60 border border-amber-900/50'
          }`}
        >
          ⚡【型態三】帶量突破整理箱 ({basePool.filter((s) => s.decision?.volumeStatus === 'EXPANDING' || (s.changePercent > 0 && (s.decision?.riskRewardRatio || 0) >= 2.0)).length})
        </button>
        <button
          onClick={() => setFilter('BUY_SIGNAL')}
          className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
            filter === 'BUY_SIGNAL'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-rose-400 hover:text-white bg-slate-900/60 border border-rose-900/50'
          }`}
        >
          👑 買進訊號標的 ({basePool.filter((s) => s.decision?.verdict === 'STRONG_BUY' || s.decision?.verdict === 'BUY').length})
        </button>
        <button
          onClick={() => setFilter('SUITABLE_ENTRY')}
          className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
            filter === 'SUITABLE_ENTRY'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-sky-400 hover:text-white bg-slate-900/60 border border-sky-900/50'
          }`}
        >
          💎 適宜現價進場 ({basePool.filter((s) => s.decision?.entryTiming?.suitability === 'SUITABLE_NOW' || s.decision?.entryTiming?.suitability === 'BREAKOUT_EARLY').length})
        </button>
      </div>

      {/* Decision Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredStocks.map((stock) => {
          const decision = stock.decision;
          const brokerNotice = stock.chips.brokerAlerts || [];
          const hasDayTradingWhale = brokerNotice.some((b) => b.broker.includes('凱基') || b.broker.includes('摩根') || b.broker.includes('嘉義'));

          return (
            <div
              key={stock.symbol}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg space-y-3.5 transition-all"
            >
              {/* Header: Name, Price, Verdict badge */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white tracking-tight">{stock.name}</h3>
                    <span className="font-mono text-xs text-slate-400">{stock.symbol}</span>
                    <span className="text-[11px] text-slate-400">{stock.industry}</span>
                  </div>
                  <div className="flex items-baseline gap-2 mt-0.5 font-mono">
                    <span className="text-xl font-bold" style={{ color: stock.change >= 0 ? upColor : downColor }}>
                      {stock.price.toFixed(1)} 元
                    </span>
                    <span className="text-xs font-semibold" style={{ color: stock.change >= 0 ? upColor : downColor }}>
                      {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(1)} ({stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%)
                    </span>
                    <span className="text-slate-400 text-xs">量: {stock.volume.toLocaleString()} 張</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {onToggleWatchlist && (
                    <button
                      onClick={() => onToggleWatchlist(stock)}
                      className={`p-1.5 rounded-lg border transition-all active:scale-90 ${
                        watchlistSymbols.includes(stock.symbol)
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                      title={watchlistSymbols.includes(stock.symbol) ? '已在自選股 (點擊移除)' : '加入自選股'}
                    >
                      <Star className={`w-4 h-4 ${watchlistSymbols.includes(stock.symbol) ? 'fill-amber-400 text-amber-400' : ''}`} />
                    </button>
                  )}

                  {decision && (
                    <div className="text-right">
                      <span
                        className={`inline-block px-3 py-1 rounded-lg text-xs font-bold border ${
                          decision.verdict === 'STRONG_BUY'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : decision.verdict === 'BUY'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : decision.verdict === 'WATCH'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : decision.verdict === 'TRIM'
                            ? 'bg-slate-800 text-amber-300 border-amber-500/30'
                            : 'bg-rose-950/60 text-rose-400 border-rose-800'
                        }`}
                      >
                      {decision.verdict === 'STRONG_BUY'
                        ? '🔥 強烈買進'
                        : decision.verdict === 'BUY'
                        ? '🟢 偏多買進'
                        : decision.verdict === 'WATCH'
                        ? '🟡 區間觀望'
                        : decision.verdict === 'TRIM'
                        ? '🟠 逢高減碼'
                        : '🛑 停損出場'}
                    </span>
                    <div className="text-[11px] font-mono text-slate-400 mt-1">
                      評分: <strong className="text-white">{decision.score}</strong> 分
                    </div>
                  </div>
                )}
              </div>
            </div>

              {/* 3 Core Points: Entry, Stop Loss, Target */}
              {decision && (
                <div className="grid grid-cols-3 gap-2 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80 text-xs font-mono">
                  <div>
                    <span className="text-slate-400 text-[10px] block">進場參考價</span>
                    <strong className="text-white text-sm">{decision.entryPrice}</strong>
                  </div>
                  <div>
                    <span className="text-rose-400 text-[10px] block">停損點 (當周低)</span>
                    <strong className="text-rose-400 text-sm">{decision.stopLossPrice}</strong>
                  </div>
                  <div>
                    <span className="text-emerald-400 text-[10px] block">目標價 (盈虧比1:{decision.riskRewardRatio})</span>
                    <strong className="text-emerald-400 text-sm">{decision.targetPrice}</strong>
                  </div>
                </div>
              )}

              {/* 【評定二：現階段當下價位與進場時機即時判斷】 */}
              {decision && (
                <div
                  className={`p-3 rounded-xl border text-xs space-y-2 ${
                    decision.entryTiming?.suitability === 'DO_NOT_CHASE'
                      ? 'bg-rose-950/30 border-rose-700/60'
                      : decision.entryTiming?.suitability === 'WAIT_PULLBACK'
                      ? 'bg-amber-950/30 border-amber-700/60'
                      : decision.entryTiming?.suitability === 'SUITABLE_NOW'
                      ? 'bg-emerald-950/30 border-emerald-700/60'
                      : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between flex-wrap gap-1.5">
                    <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
                      【評定二】現價買進時機評定
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded shadow-sm flex items-center gap-1 ${
                        decision.entryTiming?.suitability === 'DO_NOT_CHASE'
                          ? 'bg-rose-600 text-white animate-pulse'
                          : decision.entryTiming?.suitability === 'WAIT_PULLBACK'
                          ? 'bg-amber-600 text-white'
                          : decision.entryTiming?.suitability === 'SUITABLE_NOW'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {decision.entryTiming?.suitability === 'DO_NOT_CHASE' && <AlertTriangle className="w-3 h-3" />}
                      {decision.entryTiming?.label || (decision.entryTiming?.bias5ma > 6 ? '🚨 短線過熱・嚴禁追高' : '🟢 適宜切入・回測守均線')}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                    {decision.entryTiming?.timingAdvice || '依據講義紀律：嚴守均線支撐，不追高過熱個股。'}
                  </p>

                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 bg-slate-900/80 px-2.5 py-1.5 rounded border border-slate-800">
                    <span>
                      5MA乖離:{' '}
                      <strong className={decision.entryTiming?.bias5ma > 5 ? 'text-rose-400 font-bold' : 'text-slate-200'}>
                        {decision.entryTiming?.bias5ma > 0 ? '+' : ''}{decision.entryTiming?.bias5ma}%
                      </strong>
                    </span>
                    <span>
                      隔日沖倒貨風險:{' '}
                      <strong className={decision.entryTiming?.overnightDumpingRisk === 'HIGH' ? 'text-rose-400' : 'text-emerald-400'}>
                        {decision.entryTiming?.overnightDumpingRisk === 'HIGH' ? '⚠️ 高' : '低'}
                      </strong>
                    </span>
                    <span className="text-emerald-400">
                      建議切入點: {decision.entryTiming?.idealBuyZone?.min || decision.entryPrice}~{decision.entryTiming?.idealBuyZone?.max || decision.entryPrice}
                    </span>
                  </div>
                </div>
              )}

              {/* 【講義3大高把握技術型態】精準數據檢定與建議面板 */}
              {decision && (
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="text-[11px] font-bold text-slate-300 flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                    <span className="flex items-center gap-1.5 text-indigo-300">
                      <Target className="w-3.5 h-3.5 text-indigo-400" />
                      講義 3 大高把握技術型態數據驗證
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      盈虧比 1:{decision.riskRewardRatio}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[11px] font-mono">
                    {/* 型態一 */}
                    <div
                      className={`p-2 rounded-lg border flex flex-col justify-between ${
                        decision.maAlignment === 'BULLISH'
                          ? 'bg-emerald-950/40 border-emerald-800/60'
                          : 'bg-slate-900/60 border-slate-800/80'
                      }`}
                    >
                      <div>
                        <span className="text-slate-400 block text-[10px]">① 均線多頭</span>
                        <strong className={decision.maAlignment === 'BULLISH' ? 'text-emerald-400 text-xs' : 'text-slate-300 text-xs'}>
                          {decision.maAlignment === 'BULLISH' ? '✅ 多頭排列' : '糾結震盪'}
                        </strong>
                      </div>
                      <span className="text-slate-400 block text-[10px] mt-1 border-t border-slate-800/60 pt-0.5">
                        5MA乖離 {decision.entryTiming?.bias5ma > 0 ? '+' : ''}{decision.entryTiming?.bias5ma}%
                      </span>
                    </div>

                    {/* 型態二 */}
                    <div
                      className={`p-2 rounded-lg border flex flex-col justify-between ${
                        decision.rule123Status === 'PASSED'
                          ? 'bg-indigo-950/40 border-indigo-800/60'
                          : 'bg-slate-900/60 border-slate-800/80'
                      }`}
                    >
                      <div>
                        <span className="text-slate-400 block text-[10px]">② 裸K 123</span>
                        <strong className={decision.rule123Status === 'PASSED' ? 'text-indigo-300 text-xs' : 'text-slate-300 text-xs'}>
                          {decision.rule123Status === 'PASSED' ? '✅ 反轉確立' : '醞釀第2腳'}
                        </strong>
                      </div>
                      <span className="text-rose-400 block text-[10px] mt-1 border-t border-slate-800/60 pt-0.5">
                        防守 {decision.stopLossPrice} 元
                      </span>
                    </div>

                    {/* 型態三 */}
                    <div
                      className={`p-2 rounded-lg border flex flex-col justify-between ${
                        decision.volumeStatus === 'EXPANDING'
                          ? 'bg-amber-950/40 border-amber-800/60'
                          : 'bg-slate-900/60 border-slate-800/80'
                      }`}
                    >
                      <div>
                        <span className="text-slate-400 block text-[10px]">③ 箱型突破</span>
                        <strong className={decision.volumeStatus === 'EXPANDING' ? 'text-amber-300 text-xs' : 'text-slate-300 text-xs'}>
                          {decision.volumeStatus === 'EXPANDING' ? '✅ 帶量放量' : '量縮蓄勢'}
                        </strong>
                      </div>
                      <span className="text-emerald-400 block text-[10px] mt-1 border-t border-slate-800/60 pt-0.5">
                        目標 {decision.targetPrice} 元
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed font-sans pt-1 border-t border-slate-800/80">
                    {decision.reason}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-800 text-xs">
                <button
                  onClick={() => onOpenResearch(stock)}
                  className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors flex items-center justify-center gap-1.5"
                >
                  <Newspaper className="w-3.5 h-3.5 text-indigo-400" />
                  重大新聞與原物料
                </button>

                <button
                  onClick={() => onOpenChart(stock)}
                  className="flex-1 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                  斐波那契與供需線圖
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
