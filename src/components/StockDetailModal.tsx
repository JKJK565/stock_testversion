import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  BarChart3,
  DollarSign,
  Activity,
  Layers,
  Building2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Check,
  Plus,
  RefreshCw,
  Clock,
  Briefcase,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
} from 'lucide-react';
import { StockDetailResponse, BrokerTradeItem } from '../types/stock';
import { fetchStockDetail } from '../services/stockApi';

interface StockDetailModalProps {
  symbol: string;
  isOpen: boolean;
  onClose: () => void;
  isInPortfolio?: boolean;
  onTogglePortfolio?: (stock: { symbol: string; name: string; price: number; stopLossPrice: number }) => void;
}

export function StockDetailModal({
  symbol,
  isOpen,
  onClose,
  isInPortfolio = false,
  onTogglePortfolio,
}: StockDetailModalProps) {
  const [data, setData] = useState<StockDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'topVolume' | 'topBuy' | 'topSell' | 'institutional' | 'prices'>('topVolume');

  // Load detail whenever symbol changes or modal opens
  const loadDetail = async () => {
    if (!symbol) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchStockDetail(symbol);
      if (res) {
        setData(res);
      } else {
        setError(`無法載入股票代碼 ${symbol} 的詳細資料，請稍後重試。`);
      }
    } catch (e: any) {
      setError(e?.message || '載入個股詳情失敗');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && symbol) {
      loadDetail();
    }
  }, [isOpen, symbol]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const brokerSummary = data?.brokerTrading;
  const isUp = (data?.change ?? 0) >= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ========================================================================= */}
        {/* Modal Header: Stock Symbol, Name, Price, Industry, Close Button         */}
        {/* ========================================================================= */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-20 backdrop-blur-md">
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500/20 to-indigo-500/20 border border-slate-700 flex items-center justify-center text-white font-mono font-black text-lg shadow-inner">
              {symbol}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {data?.name || `股票 ${symbol}`}
                </h2>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                  {symbol}
                </span>

                {data?.industryTheme && (
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1 border ${
                      data.isPriorityWhiteList
                        ? 'bg-rose-500/15 border-rose-500/40 text-rose-300 shadow-sm'
                        : 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300'
                    }`}
                  >
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>{data.industryTheme}</span>
                  </span>
                )}
              </div>

              {data && (
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                  <span>
                    成交量 <strong className="text-slate-200">{data.volume?.toLocaleString()}</strong> 張
                  </span>
                  <span>•</span>
                  <span>
                    昨收 <strong className="text-slate-300">${data.prevClose?.toFixed(2)}</strong>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    撮合 {data.updateTime || '即時'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Action Controls: Price + Toggle Portfolio + Close */}
          <div className="flex items-center gap-3 self-end sm:self-center">
            {data && (
              <div className="text-right">
                <div className="text-2xl sm:text-3xl font-black text-white font-mono">
                  ${data.price?.toFixed(2)}
                </div>
                <div
                  className={`text-xs sm:text-sm font-bold flex items-center justify-end gap-1 font-mono ${
                    isUp ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {isUp ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  <span>
                    {isUp ? '+' : ''}
                    {data.change?.toFixed(2)} ({isUp ? '+' : ''}
                    {data.changePercent?.toFixed(2)}%)
                  </span>
                </div>
              </div>
            )}

            {onTogglePortfolio && data && (
              <button
                onClick={() =>
                  onTogglePortfolio({
                    symbol: data.symbol,
                    name: data.name,
                    price: data.price,
                    stopLossPrice: data.stopLossPrice || data.ma20 || data.price * 0.95,
                  })
                }
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                  isInPortfolio
                    ? 'bg-slate-800 text-rose-400 border border-rose-500/40 hover:bg-slate-750'
                    : 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/30'
                }`}
                title={isInPortfolio ? '已在自選追蹤清單中，點擊可移除' : '加入自選持股監控'}
              >
                {isInPortfolio ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>已在自選</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>加入自選</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              title="關閉 (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* Modal Body                                                               */}
        {/* ========================================================================= */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {isLoading ? (
            <div className="py-20 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-rose-500 animate-spin mx-auto" />
              <p className="text-sm font-medium text-slate-300">正在調閱證交所與主力分點券商籌碼大數據...</p>
              <p className="text-xs text-slate-500">同步計算近 5 日主力成交分點買賣超與 20MA 防守點</p>
            </div>
          ) : error ? (
            <div className="py-12 text-center rounded-2xl bg-rose-950/20 border border-rose-800/60 p-6 space-y-3">
              <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
              <h3 className="text-sm font-bold text-rose-300">{error}</h3>
              <button
                onClick={loadDetail}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-500 transition"
              >
                重新載入
              </button>
            </div>
          ) : data ? (
            <>
              {/* --------------------------------------------------------------------- */}
              {/* 1. 技術面與風控指標橫幅 (MA5, MA10, MA20, 乖離率, 停損防守, ATR%)       */}
              {/* --------------------------------------------------------------------- */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <span className="text-[11px] text-slate-500 block mb-0.5">5MA / 10MA / 20MA</span>
                  <div className="font-mono font-bold text-slate-200">
                    ${data.ma5?.toFixed(1)} / ${data.ma10?.toFixed(1)} /{' '}
                    <span className="text-amber-300">${data.ma20?.toFixed(1)}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {data.ma5 && data.ma10 && data.ma20 && data.ma5 > data.ma10 && data.ma10 > data.ma20 ? (
                      <span className="text-rose-400 font-bold">多頭發散排列 (5&gt;10&gt;20)</span>
                    ) : (
                      <span className="text-slate-400">均線震盪整理</span>
                    )}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <span className="text-[11px] text-slate-500 block mb-0.5">20MA 月線乖離率</span>
                  <div
                    className={`font-mono font-black text-base ${
                      (data.bias20ma ?? 0) >= 0 ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {(data.bias20ma ?? 0) >= 0 ? '+' : ''}
                    {data.bias20ma?.toFixed(2)}%
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {Math.abs(data.bias20ma ?? 0) > 10 ? '⚠️ 留意正乖離過大短線拉回' : '乖離健康安全區'}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-rose-900/40">
                  <span className="text-[11px] text-rose-400 font-bold block mb-0.5 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3 text-rose-500" />
                    波段停損防守錨定價
                  </span>
                  <div className="font-mono font-black text-base text-rose-300">
                    ${data.stopLossPrice?.toFixed(2) || data.ma20?.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    距防守點位{' '}
                    <span className="font-bold text-slate-200">
                      {data.price && (data.stopLossPrice || data.ma20)
                        ? `${(
                            ((data.price - (data.stopLossPrice || data.ma20!)) / data.price) *
                            100
                          ).toFixed(1)}%`
                        : '0%'}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <span className="text-[11px] text-slate-500 block mb-0.5">近 20 日 ATR% 波動度</span>
                  <div className="font-mono font-bold text-white text-base">
                    {data.atrPct?.toFixed(2)}%
                    <span className="text-xs text-slate-400 font-normal ml-1">
                      (${data.atr20?.toFixed(2)})
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {(data.atrPct ?? 0) >= 1.8 ? (
                      <span className="text-emerald-400 font-medium">具備波段活性 (&ge;1.8%)</span>
                    ) : (
                      <span className="text-slate-500">波動平緩</span>
                    )}
                  </div>
                </div>
              </div>

              {/* --------------------------------------------------------------------- */}
              {/* 2. 🌟 核心重點：【主力分點籌碼統計 (最近 5 日)】                       */}
              {/* --------------------------------------------------------------------- */}
              <section className="rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800 p-5 sm:p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

                {/* Section Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500/20 via-indigo-500/20 to-purple-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-md">
                      <Building2 className="w-5 h-5 text-indigo-300" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                          <span>主力分點籌碼統計</span>
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-bold">
                            最近 5 日
                          </span>
                        </h3>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        全市場權威統計：深度追蹤 5 日成交量最大前 5 家券商買賣超金額，判斷主力介入真實動向
                      </p>
                    </div>
                  </div>

                  {brokerSummary?.sentimentLabel && (
                    <div
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold self-start sm:self-auto flex items-center gap-1.5 shadow-sm ${
                        brokerSummary.sentiment === 'BULLISH'
                          ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                          : brokerSummary.sentiment === 'BEARISH'
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                          : 'bg-slate-800 border-slate-700 text-slate-300'
                      }`}
                    >
                      <span>{brokerSummary.sentimentLabel}</span>
                    </div>
                  )}
                </div>

                {brokerSummary ? (
                  <div className="mt-4 space-y-4">
                    {/* Top 4 Summary Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
                        <span className="text-[11px] text-slate-500 block mb-0.5">主力 5 日淨買賣超金額</span>
                        <div
                          className={`text-lg sm:text-xl font-black font-mono ${
                            brokerSummary.majorNetLots >= 0 ? 'text-rose-400' : 'text-emerald-400'
                          }`}
                        >
                          {brokerSummary.majorNetAmountFormatted ||
                            `${brokerSummary.majorNetLots >= 0 ? '+' : ''}${brokerSummary.majorNetLots} 張`}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          淨買賣超張數：
                          <span className="font-bold text-white">
                            {brokerSummary.majorNetLots >= 0 ? '+' : ''}
                            {brokerSummary.majorNetLots?.toLocaleString()} 張
                          </span>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
                        <span className="text-[11px] text-slate-500 block mb-0.5">買賣超佔成交量比重</span>
                        <div className="text-lg sm:text-xl font-black font-mono text-indigo-300">
                          {brokerSummary.volumeRate}%
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          {brokerSummary.volumeRate >= 20 ? (
                            <span className="text-amber-400 font-bold">主力控盤力道極強 (&ge;20%)</span>
                          ) : (
                            <span className="text-slate-400">主力籌碼均勻分散</span>
                          )}
                        </div>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
                        <span className="text-[11px] text-slate-500 block mb-0.5">主力累計買超張數</span>
                        <div className="text-lg sm:text-xl font-black font-mono text-rose-400">
                          +{brokerSummary.majorBuyLots?.toLocaleString()} 張
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          買方主力資金集中
                        </div>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
                        <span className="text-[11px] text-slate-500 block mb-0.5">主力累計賣超張數</span>
                        <div className="text-lg sm:text-xl font-black font-mono text-emerald-400">
                          {brokerSummary.majorSellLots?.toLocaleString()} 張
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          賣方調節籌碼流出
                        </div>
                      </div>
                    </div>

                    {/* Qualitative Analysis Box */}
                    {brokerSummary.analysis && (
                      <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-indigo-900/40 text-xs text-slate-300 flex items-start gap-2.5">
                        <Activity className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <span className="font-bold text-indigo-200">主力動態綜效評估：</span>
                          <span className="text-slate-300 leading-relaxed">{brokerSummary.analysis}</span>
                        </div>
                      </div>
                    )}

                    {/* Sub-tabs for Broker Analysis */}
                    <div className="pt-2">
                      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
                        <button
                          onClick={() => setActiveTab('topVolume')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                            activeTab === 'topVolume'
                              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40'
                              : 'bg-slate-850 text-slate-400 hover:text-white'
                          }`}
                        >
                          <BarChart3 className="w-3.5 h-3.5" />
                          <span>成交量最大前 5 家券商 (核心)</span>
                        </button>

                        <button
                          onClick={() => setActiveTab('topBuy')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                            activeTab === 'topBuy'
                              ? 'bg-rose-600 text-white shadow-md shadow-rose-900/40'
                              : 'bg-slate-850 text-slate-400 hover:text-white'
                          }`}
                        >
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span>買超前 5 名主力</span>
                        </button>

                        <button
                          onClick={() => setActiveTab('topSell')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                            activeTab === 'topSell'
                              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                              : 'bg-slate-850 text-slate-400 hover:text-white'
                          }`}
                        >
                          <TrendingDown className="w-3.5 h-3.5" />
                          <span>賣超前 5 名主力</span>
                        </button>
                      </div>

                      {/* Tab 1: 成交量最大前 5 家券商買賣超金額 (核心規格) */}
                      {activeTab === 'topVolume' && (
                        <div className="mt-3 overflow-x-auto">
                          <table className="w-full text-left text-xs text-slate-300">
                            <thead>
                              <tr className="border-b border-slate-800 text-[11px] text-slate-500 font-semibold">
                                <th className="pb-2 pl-2">排名 / 主力分點券商</th>
                                <th className="pb-2 text-right">成交量佔比</th>
                                <th className="pb-2 text-right">5日總成交量</th>
                                <th className="pb-2 text-right">買進張數 / 賣出張數</th>
                                <th className="pb-2 text-right font-bold text-slate-400">買賣超張數</th>
                                <th className="pb-2 text-right font-bold text-white pr-2">買賣超金額</th>
                                <th className="pb-2 text-center">籌碼動態</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                              {brokerSummary.topBrokersByVolume?.map((broker, idx) => {
                                const isBuy = broker.netLots > 0;
                                const isSell = broker.netLots < 0;

                                return (
                                  <tr
                                    key={idx}
                                    className="hover:bg-slate-850/60 transition group"
                                  >
                                    {/* Broker Name & Rank */}
                                    <td className="py-2.5 pl-2 font-medium">
                                      <div className="flex items-center gap-2">
                                        <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] font-mono font-bold flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition">
                                          #{idx + 1}
                                        </span>
                                        <span className="font-bold text-white text-sm">
                                          {broker.name}
                                        </span>
                                      </div>
                                    </td>

                                    {/* Volume Ratio with mini bar */}
                                    <td className="py-2.5 text-right font-mono">
                                      <div className="flex items-center justify-end gap-1.5">
                                        <span className="text-slate-300 font-bold">
                                          {broker.volumeRatioPct ?? 0}%
                                        </span>
                                        <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden hidden sm:block">
                                          <div
                                            className="h-full bg-indigo-500 rounded-full"
                                            style={{ width: `${Math.min(100, (broker.volumeRatioPct ?? 0) * 4)}%` }}
                                          />
                                        </div>
                                      </div>
                                    </td>

                                    {/* Total Lots */}
                                    <td className="py-2.5 text-right font-mono text-slate-300">
                                      {broker.totalLots?.toLocaleString()} 張
                                    </td>

                                    {/* Buy / Sell Lots */}
                                    <td className="py-2.5 text-right font-mono text-[11px] text-slate-400">
                                      <span className="text-rose-400">+{broker.buyLots?.toLocaleString()}</span>
                                      {' / '}
                                      <span className="text-emerald-400">-{broker.sellLots?.toLocaleString()}</span>
                                    </td>

                                    {/* Net Lots */}
                                    <td
                                      className={`py-2.5 text-right font-mono font-bold ${
                                        isBuy ? 'text-rose-400' : isSell ? 'text-emerald-400' : 'text-slate-400'
                                      }`}
                                    >
                                      {isBuy ? '+' : ''}
                                      {broker.netLots?.toLocaleString()} 張
                                    </td>

                                    {/* Net Amount (Crucial Requirement) */}
                                    <td className="py-2.5 text-right font-mono font-black pr-2">
                                      <span
                                        className={`px-2 py-0.5 rounded-lg text-xs ${
                                          isBuy
                                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                            : isSell
                                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                            : 'bg-slate-800 text-slate-400'
                                        }`}
                                      >
                                        {broker.netAmountFormatted}
                                      </span>
                                    </td>

                                    {/* Action Badge */}
                                    <td className="py-2.5 text-center">
                                      {isBuy ? (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40">
                                          主力買超
                                        </span>
                                      ) : isSell ? (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                                          主力調節
                                        </span>
                                      ) : (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                                          多空換手
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Tab 2: 買超前 5 名主力券商 */}
                      {activeTab === 'topBuy' && (
                        <div className="mt-3 overflow-x-auto">
                          <table className="w-full text-left text-xs text-slate-300">
                            <thead>
                              <tr className="border-b border-slate-800 text-[11px] text-slate-500 font-semibold">
                                <th className="pb-2 pl-2">主力買超券商分點</th>
                                <th className="pb-2 text-right">買進張數</th>
                                <th className="pb-2 text-right">賣出張數</th>
                                <th className="pb-2 text-right font-bold text-rose-400">淨買超張數</th>
                                <th className="pb-2 text-right font-bold text-rose-300 pr-2">淨買超金額</th>
                                <th className="pb-2 text-right">總成交金額</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                              {brokerSummary.topBuyBrokers?.map((broker, idx) => (
                                <tr key={idx} className="hover:bg-slate-850/60 transition">
                                  <td className="py-2.5 pl-2 font-bold text-white flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-mono font-bold flex items-center justify-center">
                                      +{idx + 1}
                                    </span>
                                    <span>{broker.name}</span>
                                  </td>
                                  <td className="py-2.5 text-right font-mono text-rose-400">
                                    +{broker.buyLots?.toLocaleString()}
                                  </td>
                                  <td className="py-2.5 text-right font-mono text-slate-400">
                                    -{broker.sellLots?.toLocaleString()}
                                  </td>
                                  <td className="py-2.5 text-right font-mono font-bold text-rose-400">
                                    +{broker.netLots?.toLocaleString()} 張
                                  </td>
                                  <td className="py-2.5 text-right font-mono font-black text-rose-300 pr-2">
                                    <span className="px-2 py-0.5 rounded-lg bg-rose-500/20 border border-rose-500/40">
                                      {broker.netAmountFormatted}
                                    </span>
                                  </td>
                                  <td className="py-2.5 text-right font-mono text-slate-400">
                                    {broker.totalAmountFormatted}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Tab 3: 賣超前 5 名主力券商 */}
                      {activeTab === 'topSell' && (
                        <div className="mt-3 overflow-x-auto">
                          <table className="w-full text-left text-xs text-slate-300">
                            <thead>
                              <tr className="border-b border-slate-800 text-[11px] text-slate-500 font-semibold">
                                <th className="pb-2 pl-2">主力賣超券商分點</th>
                                <th className="pb-2 text-right">買進張數</th>
                                <th className="pb-2 text-right">賣出張數</th>
                                <th className="pb-2 text-right font-bold text-emerald-400">淨賣超張數</th>
                                <th className="pb-2 text-right font-bold text-emerald-300 pr-2">淨賣超金額</th>
                                <th className="pb-2 text-right">總成交金額</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                              {brokerSummary.topSellBrokers?.map((broker, idx) => (
                                <tr key={idx} className="hover:bg-slate-850/60 transition">
                                  <td className="py-2.5 pl-2 font-bold text-white flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold flex items-center justify-center">
                                      -{idx + 1}
                                    </span>
                                    <span>{broker.name}</span>
                                  </td>
                                  <td className="py-2.5 text-right font-mono text-slate-400">
                                    +{broker.buyLots?.toLocaleString()}
                                  </td>
                                  <td className="py-2.5 text-right font-mono text-emerald-400">
                                    -{broker.sellLots?.toLocaleString()}
                                  </td>
                                  <td className="py-2.5 text-right font-mono font-bold text-emerald-400">
                                    {broker.netLots?.toLocaleString()} 張
                                  </td>
                                  <td className="py-2.5 text-right font-mono font-black text-emerald-300 pr-2">
                                    <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40">
                                      {broker.netAmountFormatted}
                                    </span>
                                  </td>
                                  <td className="py-2.5 text-right font-mono text-slate-400">
                                    {broker.totalAmountFormatted}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-slate-500">
                    <p>目前查無此檔個股之 5 日主力分點券商交易資料（可能為休市、甫上市或連線等待中）。</p>
                  </div>
                )}
              </section>

              {/* --------------------------------------------------------------------- */}
              {/* 3. 三大法人近 10 日買賣超明細                                           */}
              {/* --------------------------------------------------------------------- */}
              {data.chips && data.chips.length > 0 && (
                <section className="rounded-3xl bg-slate-950/80 border border-slate-800 p-5 shadow-lg">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                    <BarChart3 className="w-4 h-4 text-rose-400" />
                    <span>三大法人近 10 日籌碼進出紀錄</span>
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-[11px] text-slate-500">
                          <th className="pb-2">日期</th>
                          <th className="pb-2 text-right">法人名稱</th>
                          <th className="pb-2 text-right">買進張數</th>
                          <th className="pb-2 text-right">賣出張數</th>
                          <th className="pb-2 text-right font-bold text-white">淨買賣超 (張)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850">
                        {data.chips.slice(-15).reverse().map((chip: any, i: number) => {
                          const net = Math.round(((chip.buy || 0) - (chip.sell || 0)) / 1000);
                          const isNetBuy = net >= 0;
                          return (
                            <tr key={i} className="hover:bg-slate-900/50">
                              <td className="py-1.5 font-mono text-slate-400">{chip.date}</td>
                              <td className="py-1.5 text-right font-medium text-slate-300">
                                {chip.name || '法人'}
                              </td>
                              <td className="py-1.5 text-right font-mono text-slate-400">
                                {Math.round((chip.buy || 0) / 1000).toLocaleString()}
                              </td>
                              <td className="py-1.5 text-right font-mono text-slate-400">
                                {Math.round((chip.sell || 0) / 1000).toLocaleString()}
                              </td>
                              <td
                                className={`py-1.5 text-right font-mono font-bold ${
                                  isNetBuy ? 'text-rose-400' : 'text-emerald-400'
                                }`}
                              >
                                {isNetBuy ? '+' : ''}
                                {net.toLocaleString()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>數據來源：台灣證券交易所 MIS 即時撮合與 FinMind 券商大數據</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
          >
            關閉視窗
          </button>
        </div>
      </div>
    </div>
  );
}
