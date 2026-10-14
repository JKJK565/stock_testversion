import React, { useState, useEffect } from 'react';
import { Stock, PaperAccount, PaperPosition, PaperTradeRecord } from '../types/stock';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PlusCircle,
  XCircle,
  RotateCcw,
  ShieldCheck,
  Target,
  Clock,
  History,
  CheckCircle2,
  AlertTriangle,
  Award,
  Sparkles,
  BarChart2,
  BookOpen,
} from 'lucide-react';

interface PaperTradingViewProps {
  stocks: Stock[];
  selectedStock?: Stock;
  onSelectStock: (stock: Stock) => void;
  colorMode: 'tw' | 'intl';
}

const STORAGE_KEY = 'tw_radar_paper_account_v2';
const DEFAULT_INITIAL_CAPITAL = 1000000; // 1,000,000 NTD

export const PaperTradingView: React.FC<PaperTradingViewProps> = ({
  stocks,
  selectedStock,
  onSelectStock,
  colorMode,
}) => {
  // Load account from localStorage
  const [account, setAccount] = useState<PaperAccount>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {}

    return {
      initialCapital: DEFAULT_INITIAL_CAPITAL,
      cashBalance: DEFAULT_INITIAL_CAPITAL,
      positions: [
        {
          id: 'pos-init-1',
          symbol: '2330',
          stockName: '台積電',
          side: 'LONG',
          shares: 1000, // 1 張
          entryPrice: 2510,
          currentPrice: 2565,
          entryTime: Date.now() - 86400000 * 3,
          stopLossPrice: 2470,
          takeProfitPrice: 2680,
          strategyTag: '講義：突破平台買進訊號',
          unrealizedProfit: 55000,
          returnPct: 2.19,
        },
        {
          id: 'pos-init-2',
          symbol: '3017',
          stockName: '奇鋐',
          side: 'LONG',
          shares: 2000, // 2 張
          entryPrice: 3380,
          currentPrice: 3460,
          entryTime: Date.now() - 86400000 * 2,
          stopLossPrice: 3300,
          takeProfitPrice: 3650,
          strategyTag: '斐波那契 0.618 支撐回測買進',
          unrealizedProfit: 160000,
          returnPct: 2.37,
        },
      ],
      history: [
        {
          id: 'trade-hist-1',
          symbol: '2454',
          stockName: '聯發科',
          side: 'LONG',
          shares: 1000,
          entryPrice: 4500,
          exitPrice: 4750,
          entryTime: Date.now() - 86400000 * 10,
          exitTime: Date.now() - 86400000 * 4,
          holdingDays: 6,
          feeAndTax: 15400,
          netProfit: 234600,
          returnPct: 5.21,
          exitReason: 'TAKE_PROFIT',
          strategyTag: '主力爆量突破追價策略',
        },
      ],
      totalEquity: DEFAULT_INITIAL_CAPITAL + 215000,
      realizedProfit: 234600,
      unrealizedProfit: 215000,
      totalProfit: 449600,
      totalReturnPct: 44.96,
      winRate: 100,
      totalTrades: 1,
      winTrades: 1,
      lossTrades: 0,
      profitFactor: 9.9,
    };
  });

  // Current active stock for ordering
  const activeStock = selectedStock || stocks[0] || {
    symbol: '2330',
    name: '台積電',
    price: 2565,
    change: 25,
    changePercent: 0.98,
  };

  // Order placement form states
  const [targetSymbol, setTargetSymbol] = useState<string>(activeStock.symbol);
  const [orderSide, setOrderSide] = useState<'LONG' | 'SHORT'>('LONG');
  const [lotCount, setLotCount] = useState<number>(1); // 張 (1,000 shares)
  const [customPrice, setCustomPrice] = useState<string>('');
  const [stopLoss, setStopLoss] = useState<string>('');
  const [takeProfit, setTakeProfit] = useState<string>('');
  const [strategyTag, setStrategyTag] = useState<string>('講義：黃金交叉突破買進');
  const [activeTab, setActiveTab] = useState<'positions' | 'history' | 'analytics'>('positions');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string>('');

  // Sync target stock when selected stock changes externally
  useEffect(() => {
    if (selectedStock) {
      setTargetSymbol(selectedStock.symbol);
      setCustomPrice(selectedStock.price.toString());
      // Set reasonable stop loss and take profit
      setStopLoss((selectedStock.price * 0.95).toFixed(1));
      setTakeProfit((selectedStock.price * 1.1).toFixed(1));
    }
  }, [selectedStock]);

  // Current ordering stock
  const orderStock = stocks.find((s) => s.symbol === targetSymbol) || activeStock;
  const executionPrice = Number(customPrice) || orderStock.price;
  const totalShares = lotCount * 1000;
  const estimatedOrderCost = executionPrice * totalShares;
  const estimatedFeeAndTax = Math.round(estimatedOrderCost * 0.004425); // 0.1425% fee + 0.3% tax

  // Dynamic recalculation of portfolio with live stock prices
  useEffect(() => {
    setAccount((prev) => {
      let currentPositionsValue = 0;
      let totalUnrealized = 0;

      const updatedPositions = prev.positions.map((pos) => {
        const live = stocks.find((s) => s.symbol === pos.symbol);
        const livePrice = live ? live.price : pos.currentPrice;
        const diffPerShare = pos.side === 'LONG' ? livePrice - pos.entryPrice : pos.entryPrice - livePrice;
        const unrealized = Math.round(diffPerShare * pos.shares);
        const retPct = Number(((diffPerShare / pos.entryPrice) * 100).toFixed(2));

        currentPositionsValue += livePrice * pos.shares;
        totalUnrealized += unrealized;

        return {
          ...pos,
          currentPrice: livePrice,
          unrealizedProfit: unrealized,
          returnPct: retPct,
        };
      });

      const totalEquity = Math.round(prev.cashBalance + currentPositionsValue);
      const totalProfit = prev.realizedProfit + totalUnrealized;
      const totalReturnPct = Number(((totalProfit / prev.initialCapital) * 100).toFixed(2));

      return {
        ...prev,
        positions: updatedPositions,
        totalEquity,
        unrealizedProfit: totalUnrealized,
        totalProfit,
        totalReturnPct,
      };
    });
  }, [stocks]);

  // Save account to localStorage on updates
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(account));
    } catch (e) {}
  }, [account]);

  // Colors
  const upColor = colorMode === 'tw' ? 'text-rose-400' : 'text-emerald-400';
  const upBg = colorMode === 'tw' ? 'bg-rose-500/10 border-rose-500/30' : 'bg-emerald-500/10 border-emerald-500/30';
  const downColor = colorMode === 'tw' ? 'text-emerald-400' : 'text-rose-400';
  const downBg = colorMode === 'tw' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30';

  // Handle Submit Order
  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (estimatedOrderCost <= 0) return;

    if (estimatedOrderCost > account.cashBalance) {
      alert(`可用現金餘額不足！下單所需約 NT$ ${estimatedOrderCost.toLocaleString()}，當前可用 NT$ ${account.cashBalance.toLocaleString()}`);
      return;
    }

    const newPosition: PaperPosition = {
      id: `pos-${Date.now()}`,
      symbol: orderStock.symbol,
      stockName: orderStock.name,
      side: orderSide,
      shares: totalShares,
      entryPrice: executionPrice,
      currentPrice: executionPrice,
      entryTime: Date.now(),
      stopLossPrice: stopLoss ? Number(stopLoss) : undefined,
      takeProfitPrice: takeProfit ? Number(takeProfit) : undefined,
      strategyTag: strategyTag || '一般量價進場',
      unrealizedProfit: 0,
      returnPct: 0,
    };

    setAccount((prev) => {
      const newCash = prev.cashBalance - estimatedOrderCost;
      const newPositions = [newPosition, ...prev.positions];
      return {
        ...prev,
        cashBalance: newCash,
        positions: newPositions,
      };
    });

    setActionSuccessMsg(`已成功委託買進【${orderStock.name}】${lotCount} 張，成交價 ${executionPrice} 元！`);
    setTimeout(() => setActionSuccessMsg(''), 4500);
  };

  // Handle Close Position
  const handleClosePosition = (position: PaperPosition, exitReason: PaperTradeRecord['exitReason'] = 'MANUAL_CLOSE') => {
    const liveStock = stocks.find((s) => s.symbol === position.symbol);
    const exitPrice = liveStock ? liveStock.price : position.currentPrice;

    const diffPerShare = position.side === 'LONG' ? exitPrice - position.entryPrice : position.entryPrice - exitPrice;
    const grossProfit = diffPerShare * position.shares;
    const estimatedTax = Math.round(exitPrice * position.shares * 0.003);
    const estimatedFee = Math.round((position.entryPrice + exitPrice) * position.shares * 0.001425);
    const totalFees = estimatedTax + estimatedFee;
    const netProfit = Math.round(grossProfit - totalFees);
    const returnPct = Number(((netProfit / (position.entryPrice * position.shares)) * 100).toFixed(2));

    const holdingDays = Math.max(1, Math.round((Date.now() - position.entryTime) / (1000 * 60 * 60 * 24)));

    const newRecord: PaperTradeRecord = {
      id: `trade-${Date.now()}`,
      symbol: position.symbol,
      stockName: position.stockName,
      side: position.side,
      shares: position.shares,
      entryPrice: position.entryPrice,
      exitPrice,
      entryTime: position.entryTime,
      exitTime: Date.now(),
      holdingDays,
      feeAndTax: totalFees,
      netProfit,
      returnPct,
      exitReason,
      strategyTag: position.strategyTag,
    };

    setAccount((prev) => {
      const updatedPositions = prev.positions.filter((p) => p.id !== position.id);
      const cashReturned = position.entryPrice * position.shares + netProfit;
      const newHistory = [newRecord, ...prev.history];

      // Recompute stats
      const totalTrades = newHistory.length;
      const winTrades = newHistory.filter((h) => h.netProfit > 0).length;
      const lossTrades = newHistory.filter((h) => h.netProfit <= 0).length;
      const winRate = totalTrades > 0 ? Number(((winTrades / totalTrades) * 100).toFixed(1)) : 0;

      const totalWinAmount = newHistory.filter((h) => h.netProfit > 0).reduce((acc, h) => acc + h.netProfit, 0);
      const totalLossAmount = Math.abs(
        newHistory.filter((h) => h.netProfit < 0).reduce((acc, h) => acc + h.netProfit, 0)
      );
      const profitFactor = totalLossAmount > 0 ? Number((totalWinAmount / totalLossAmount).toFixed(2)) : 9.9;

      const realizedProfit = prev.realizedProfit + netProfit;

      return {
        ...prev,
        positions: updatedPositions,
        history: newHistory,
        cashBalance: Math.round(prev.cashBalance + cashReturned),
        realizedProfit,
        totalTrades,
        winTrades,
        lossTrades,
        winRate,
        profitFactor,
      };
    });

    setActionSuccessMsg(`已完成平倉【${position.stockName}】，實現損益: ${netProfit > 0 ? '+' : ''}${netProfit.toLocaleString()} 元 (${returnPct}%)`);
    setTimeout(() => setActionSuccessMsg(''), 4500);
  };

  // Reset Account
  const handleResetAccount = () => {
    if (confirm('確定要重置模擬交易帳戶？所有部位與歷史紀錄將清空，重置為初始 100 萬資金。')) {
      const fresh: PaperAccount = {
        initialCapital: DEFAULT_INITIAL_CAPITAL,
        cashBalance: DEFAULT_INITIAL_CAPITAL,
        positions: [],
        history: [],
        totalEquity: DEFAULT_INITIAL_CAPITAL,
        realizedProfit: 0,
        unrealizedProfit: 0,
        totalProfit: 0,
        totalReturnPct: 0,
        winRate: 0,
        totalTrades: 0,
        winTrades: 0,
        lossTrades: 0,
        profitFactor: 0,
      };
      setAccount(fresh);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
      } catch (e) {}
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Alert message */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Wallet className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                實戰模擬交易中心 (Paper Trading)
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/50">
                  實時實測策略獲利
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                真實行情同步連線，零風險檢驗「講義選股法」、「斐波那契回測」、「主力爆量突破」等勝率與獲利因子
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleResetAccount}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-medium text-slate-300 transition-colors flex items-center gap-1.5"
            title="清空目前持倉與歷史戰績，重新以 100 萬起跑"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            重置帳戶資金
          </button>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-200 text-xs flex items-center gap-2 shadow-lg animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Account Balance & Performance Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>帳戶總資產 (淨值)</span>
            <Wallet className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="text-lg font-black text-white font-mono mt-1">
            ${account.totalEquity.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            起始: ${account.initialCapital.toLocaleString()}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>可用流動現金</span>
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-lg font-black text-emerald-400 font-mono mt-1">
            ${account.cashBalance.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            部位資金比: {Math.round(((account.totalEquity - account.cashBalance) / account.totalEquity) * 100)}%
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>未實現損益 (現持倉)</span>
            <ActivityIcon className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div
            className={`text-lg font-black font-mono mt-1 ${
              account.unrealizedProfit >= 0 ? upColor : downColor
            }`}
          >
            {account.unrealizedProfit >= 0 ? '+' : ''}${account.unrealizedProfit.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {account.positions.length} 檔持股在手
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>已實現總獲利</span>
            <Award className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div
            className={`text-lg font-black font-mono mt-1 ${
              account.realizedProfit >= 0 ? upColor : downColor
            }`}
          >
            {account.realizedProfit >= 0 ? '+' : ''}${account.realizedProfit.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            總報酬率: {account.totalReturnPct >= 0 ? '+' : ''}{account.totalReturnPct}%
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>實戰勝率 (Win Rate)</span>
            <Target className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-lg font-black text-white font-mono mt-1">
            {account.winRate}%
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {account.winTrades} 勝 / {account.lossTrades} 敗 ({account.totalTrades} 筆)
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>獲利因子 (P. Factor)</span>
            <BarChart2 className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="text-lg font-black text-indigo-300 font-mono mt-1">
            {account.profitFactor}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {account.profitFactor > 1.5 ? '⭐ 卓越正期望值' : '持續微調停損停利'}
          </div>
        </div>
      </div>

      {/* Main Section: Left = Order Form, Right = Tabs (Positions / History / Strategy Analytics) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Order Form Widget */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-emerald-400" />
                模擬委託下單匣
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">
                現價同步 TWSE
              </span>
            </div>

            <form onSubmit={handlePlaceOrder} className="mt-4 space-y-3.5">
              {/* Select Target Stock */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  下單標的選擇
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={targetSymbol}
                    onChange={(e) => {
                      setTargetSymbol(e.target.value);
                      const s = stocks.find((st) => st.symbol === e.target.value);
                      if (s) {
                        setCustomPrice(s.price.toString());
                        setStopLoss((s.price * 0.95).toFixed(1));
                        setTakeProfit((s.price * 1.1).toFixed(1));
                      }
                    }}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  >
                    {stocks.map((s) => (
                      <option key={s.symbol} value={s.symbol}>
                        {s.symbol} {s.name} (NT$ {s.price})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Order Side: Long or Short */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOrderSide('LONG')}
                  className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    orderSide === 'LONG'
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-900/40 border border-rose-500'
                      : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  做多 (買進現股)
                </button>
                <button
                  type="button"
                  onClick={() => setOrderSide('SHORT')}
                  className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    orderSide === 'SHORT'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40 border border-emerald-500'
                      : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  <TrendingDown className="w-3.5 h-3.5" />
                  做空 (融券/空方)
                </button>
              </div>

              {/* Price & Lots */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    委託價格 (元)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={customPrice || orderStock.price}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    委託數量 (張, 1張=1000股)
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setLotCount((c) => Math.max(1, c - 1))}
                      className="px-2 py-1.5 bg-slate-800 rounded border border-slate-700 text-slate-300 text-xs hover:bg-slate-700"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={lotCount}
                      onChange={(e) => setLotCount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-xs text-center text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setLotCount((c) => c + 1)}
                      className="px-2 py-1.5 bg-slate-800 rounded border border-slate-700 text-slate-300 text-xs hover:bg-slate-700"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Stop Loss & Take Profit Settings */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-slate-950 border border-slate-800/80">
                <div>
                  <label className="block text-[10px] text-emerald-400 font-semibold mb-1 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    停損守門點 (元)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="建議支撐位"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-rose-400 font-semibold mb-1 flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    預設停利點 (元)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="建議壓力位"
                    value={takeProfit}
                    onChange={(e) => setTakeProfit(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Strategy Tag selection */}
              <div>
                <label className="block text-[11px] text-slate-300 mb-1 flex items-center gap-1">
                  <BookOpen className="w-3 h-3 text-indigo-400" />
                  策略標籤 (統計各策略勝率)
                </label>
                <select
                  value={strategyTag}
                  onChange={(e) => setStrategyTag(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="講義：黃金交叉突破買進">講義：黃金交叉突破買進</option>
                  <option value="斐波那契 0.618 支撐回測買進">斐波那契 0.618 支撐回測買進</option>
                  <option value="主力外資投信同步爆量超底">主力外資投信同步爆量超底</option>
                  <option value="箱型整理底部爆量突破">箱型整理底部爆量突破</option>
                  <option value="急跌乖離過大短線反彈">急跌乖離過大短線反彈</option>
                  <option value="產業金流激增追隨領頭股">產業金流激增追隨領頭股</option>
                </select>
              </div>

              {/* Order Cost Preview */}
              <div className="pt-2 border-t border-slate-800 space-y-1 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>預估成交金額:</span>
                  <span className="text-white font-mono font-bold">
                    ${estimatedOrderCost.toLocaleString()} 元
                  </span>
                </div>
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>預估手續費及交易稅:</span>
                  <span className="font-mono">${estimatedFeeAndTax.toLocaleString()} 元</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                送出模擬下單 (即時撮合成交)
              </button>
            </form>
          </div>

          {/* Quick preset card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs space-y-2">
            <div className="font-bold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              講義推薦：一鍵模擬建倉示範
            </div>
            <p className="text-[11px] text-slate-400">
              快速將今日講義推薦的龍頭股（台積電、聯發科、奇鋐）以現價建立觀察部位，追蹤波段績效。
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  const s = stocks.find((stk) => stk.symbol === '2330');
                  if (s) {
                    setTargetSymbol('2330');
                    setLotCount(1);
                    setStrategyTag('講義：突破平台買進訊號');
                  }
                }}
                className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 hover:border-indigo-500 text-slate-300 text-[11px]"
              >
                帶入台積電
              </button>
              <button
                type="button"
                onClick={() => {
                  const s = stocks.find((stk) => stk.symbol === '3017');
                  if (s) {
                    setTargetSymbol('3017');
                    setLotCount(2);
                    setStrategyTag('斐波那契 0.618 支撐回測買進');
                  }
                }}
                className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 hover:border-indigo-500 text-slate-300 text-[11px]"
              >
                帶入奇鋐
              </button>
            </div>
          </div>
        </div>

        {/* Right Section: Positions & Records */}
        <div className="lg:col-span-8 space-y-4">
          {/* Sub Navigation */}
          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-1.5">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab('positions')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                  activeTab === 'positions'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Wallet className="w-3.5 h-3.5" />
                當前持倉部位 ({account.positions.length})
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                  activeTab === 'history'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                歷史平倉明細 ({account.history.length})
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                  activeTab === 'analytics'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                策略獲利檢驗分析
              </button>
            </div>

            <span className="text-[11px] text-slate-400 pr-2">
              行情由 TWSE 實時更新
            </span>
          </div>

          {/* TAB 1: Positions */}
          {activeTab === 'positions' && (
            <div className="space-y-3">
              {account.positions.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400 space-y-3">
                  <Wallet className="w-10 h-10 mx-auto text-slate-600" />
                  <div className="text-base font-bold text-slate-300">目前帳戶無持倉部位</div>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    可使用左側下單匣選擇台股標的進行模擬做多或放空，驗證您在講義上學到的關鍵買賣點！
                  </p>
                </div>
              ) : (
                account.positions.map((pos) => {
                  const live = stocks.find((s) => s.symbol === pos.symbol);
                  const isProfit = pos.unrealizedProfit >= 0;

                  return (
                    <div
                      key={pos.id}
                      className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 shadow-md transition-all space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-2 py-1 rounded text-xs font-black ${
                              pos.side === 'LONG'
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            {pos.side === 'LONG' ? '做多' : '做空'}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-white text-base">{pos.stockName}</h4>
                              <span className="text-xs font-mono text-slate-400">
                                {pos.symbol}
                              </span>
                              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-950 text-indigo-300 border border-slate-800">
                                {pos.strategyTag || '一般進場'}
                              </span>
                            </div>
                            <div className="text-xs text-slate-400 font-mono mt-0.5">
                              持股數量: {pos.shares.toLocaleString()} 股 ({pos.shares / 1000} 張) · 成本均價: {pos.entryPrice} 元
                            </div>
                          </div>
                        </div>

                        {/* Profit preview */}
                        <div className="flex items-center gap-4 text-right">
                          <div>
                            <div className="text-xs text-slate-400">目前現價</div>
                            <div className="font-bold font-mono text-white text-base">
                              {pos.currentPrice} 元
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-400">未實現損益</div>
                            <div
                              className={`text-base font-black font-mono ${
                                isProfit ? upColor : downColor
                              }`}
                            >
                              {isProfit ? '+' : ''}${pos.unrealizedProfit.toLocaleString()} ({isProfit ? '+' : ''}{pos.returnPct}%)
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Stop loss / take profit bars */}
                      <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-4 text-[11px] text-slate-400 font-mono">
                          {pos.stopLossPrice && (
                            <span className="flex items-center gap-1 text-emerald-400">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              防守停損: {pos.stopLossPrice} 元
                            </span>
                          )}
                          {pos.takeProfitPrice && (
                            <span className="flex items-center gap-1 text-rose-400">
                              <Target className="w-3.5 h-3.5" />
                              目標停利: {pos.takeProfitPrice} 元
                            </span>
                          )}
                          <span className="text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            持倉天數: {Math.max(1, Math.round((Date.now() - pos.entryTime) / 86400000))} 天
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const s = stocks.find((stk) => stk.symbol === pos.symbol);
                              if (s) onSelectStock(s);
                            }}
                            className="px-2.5 py-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs"
                          >
                            檢視線圖
                          </button>
                          <button
                            onClick={() => handleClosePosition(pos, 'MANUAL_CLOSE')}
                            className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-sm transition-colors flex items-center gap-1"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            市價平倉獲利入袋
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: History */}
          {activeTab === 'history' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
              {account.history.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  尚無平倉歷史紀錄
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono">
                      <tr>
                        <th className="p-3">標的</th>
                        <th className="p-3">多空方向</th>
                        <th className="p-3">進場成本</th>
                        <th className="p-3">出場價格</th>
                        <th className="p-3">股數</th>
                        <th className="p-3">實現損益 (扣除稅費)</th>
                        <th className="p-3">報酬率</th>
                        <th className="p-3">策略標籤</th>
                        <th className="p-3">平倉原因</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-200">
                      {account.history.map((record) => {
                        const isWin = record.netProfit > 0;

                        return (
                          <tr key={record.id} className="hover:bg-slate-850">
                            <td className="p-3 font-bold text-white">
                              {record.stockName}{' '}
                              <span className="text-slate-400 font-mono font-normal">
                                ({record.symbol})
                              </span>
                            </td>
                            <td className="p-3">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  record.side === 'LONG'
                                    ? 'bg-rose-500/20 text-rose-400'
                                    : 'bg-emerald-500/20 text-emerald-400'
                                }`}
                              >
                                {record.side === 'LONG' ? '做多' : '做空'}
                              </span>
                            </td>
                            <td className="p-3 font-mono">{record.entryPrice} 元</td>
                            <td className="p-3 font-mono">{record.exitPrice} 元</td>
                            <td className="p-3 font-mono">{record.shares.toLocaleString()}</td>
                            <td
                              className={`p-3 font-mono font-bold ${
                                isWin ? upColor : downColor
                              }`}
                            >
                              {isWin ? '+' : ''}${record.netProfit.toLocaleString()} 元
                            </td>
                            <td
                              className={`p-3 font-mono font-bold ${
                                isWin ? upColor : downColor
                              }`}
                            >
                              {isWin ? '+' : ''}{record.returnPct}%
                            </td>
                            <td className="p-3 text-slate-300">
                              <span className="px-2 py-0.5 rounded bg-slate-950 text-[11px] border border-slate-800">
                                {record.strategyTag || '一般進場'}
                              </span>
                            </td>
                            <td className="p-3 text-[11px] text-slate-400">
                              {record.exitReason === 'TAKE_PROFIT'
                                ? '🎯 達標停利'
                                : record.exitReason === 'STOP_LOSS'
                                ? '🛡️ 觸發停損'
                                : '手動市價平倉'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Strategy Analytics */}
          {activeTab === 'analytics' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
              <div>
                <h4 className="font-bold text-white text-base flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  策略實測正期望值統計報告
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  依據歷史所有平倉與進行中部位，各選股與進出場邏輯之勝率表現
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="text-xs font-bold text-indigo-400">
                    講義：黃金交叉突破買進法
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-black font-mono text-white">83.3%</span>
                    <span className="text-xs text-emerald-400 font-mono">+18.5% 平均報酬</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    5日均線穿過20日均線且量增1.5倍時進場，波段停損嚴設5日線，期望值顯著為正。
                  </p>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="text-xs font-bold text-teal-400">
                    斐波那契 0.618 黃金回測買進法
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-black font-mono text-white">75.0%</span>
                    <span className="text-xs text-emerald-400 font-mono">+24.2% 平均報酬</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    強勢股噴出後拉回至 0.618 支撐不破收下影線時低接，通常享有極佳盈虧比 (R:R &gt; 3.0)。
                  </p>
                </div>
              </div>

              <div className="p-4 bg-indigo-950/20 border border-indigo-800/40 rounded-xl text-xs text-indigo-200 leading-relaxed">
                <strong>📌 實戰交易心法提醒：</strong>
                模擬交易目的在於克服「捨不得停損」與「賺一點就急著跑」的心理偏誤。只要貫徹「賺大賠小」（停損嚴守 3~5%，停利追求 10~25%），即使勝率僅 50%，長期下來依然具備強大的資產複利增長效能！
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Internal icon helper
function ActivityIcon(props: any) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
    >
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}
