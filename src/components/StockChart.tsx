import React, { useState, useMemo } from 'react';
import { Stock, KlineData, FibonacciLevel, SupplyDemandZone } from '../types/stock';
import { calculate123Pattern, Rule123PatternResult } from '../utils/indicators';
import {
  Layers,
  TrendingUp,
  BarChart2,
  Compass,
  Activity,
  Eye,
  ShieldAlert,
  Target,
  Sparkles,
  Newspaper,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  X,
  Star,
} from 'lucide-react';

interface StockChartProps {
  stock: Stock;
  colorMode: 'tw' | 'intl';
  onOpenAlertModal?: () => void;
  onOpenBacktest?: () => void;
  onOpenResearch?: () => void;
  onOpenPaperTrade?: () => void;
  watchlistSymbols?: string[];
  onToggleWatchlist?: () => void;
}

type SubIndicator = 'volume' | 'kd' | 'macd' | 'rsi' | 'bias';
type ChartPeriod = 'day' | 'week' | 'intraday';

export const StockChart: React.FC<StockChartProps> = ({
  stock,
  colorMode,
  onOpenAlertModal,
  onOpenBacktest,
  onOpenResearch,
  onOpenPaperTrade,
  watchlistSymbols = [],
  onToggleWatchlist,
}) => {
  const [period, setPeriod] = useState<ChartPeriod>('day');
  const [subIndicator, setSubIndicator] = useState<SubIndicator>('volume');
  const [candleCount, setCandleCount] = useState<number>(60);
  const [isZoomModalOpen, setIsZoomModalOpen] = useState<boolean>(false);
  const [showMA, setShowMA] = useState(true);
  const [showBB, setShowBB] = useState(false);
  const [showSRLines, setShowSRLines] = useState(true);
  const [showFibonacci, setShowFibonacci] = useState(true);
  const [showSupplyDemand, setShowSupplyDemand] = useState(true);
  const [showPattern123, setShowPattern123] = useState(true);
  const [showTradeSignal, setShowTradeSignal] = useState(true);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const isRedUp = colorMode === 'tw';
  const upColor = isRedUp ? '#ef4444' : '#10b981';
  const downColor = isRedUp ? '#10b981' : '#ef4444';

  const decision = stock.decision;
  const fiboLevels = stock.fibonacci || [];
  const supplyDemand = stock.supplyDemand || [];

  // Data selection
  const klines = useMemo(() => {
    if (period === 'day') {
      return stock.history.slice(-candleCount);
    }
    if (period === 'week') {
      const weekly: KlineData[] = [];
      const data = stock.history;
      for (let i = 0; i < data.length; i += 5) {
        const slice = data.slice(i, i + 5);
        if (slice.length === 0) continue;
        const open = slice[0].open;
        const close = slice[slice.length - 1].close;
        const high = Math.max(...slice.map((s) => s.high));
        const low = Math.min(...slice.map((s) => s.low));
        const volume = slice.reduce((acc, s) => acc + s.volume, 0);
        weekly.push({
          date: slice[slice.length - 1].date,
          open,
          high,
          low,
          close,
          volume,
          ma5: slice[slice.length - 1].ma5,
          ma20: slice[slice.length - 1].ma20,
          bias20: slice[slice.length - 1].bias20,
          k: slice[slice.length - 1].k,
          d: slice[slice.length - 1].d,
        });
      }
      return weekly.slice(-50);
    }
    return stock.history.slice(-80);
  }, [stock, period]);

  // 裸K 123 法則轉折型態精確計算
  const pattern123 = useMemo(() => {
    return calculate123Pattern(klines);
  }, [klines]);

  // Chart dimensions
  const width = 840;
  const mainHeight = 330;
  const subHeight = 110;
  const padding = { top: 20, right: 85, bottom: 25, left: 10 };
  const chartWidth = width - padding.left - padding.right;

  // Min / Max calculation
  const { minPrice, maxPrice } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    klines.forEach((k) => {
      if (k.low < min) min = k.low;
      if (k.high > max) max = k.high;
      if (showBB && k.bbLower && k.bbLower < min) min = k.bbLower;
      if (showBB && k.bbUpper && k.bbUpper > max) max = k.bbUpper;
    });

    if (showSRLines) {
      if (stock.supportPrice < min) min = stock.supportPrice * 0.99;
      if (stock.resistancePrice > max) max = stock.resistancePrice * 1.01;
    }

    if (showFibonacci && fiboLevels.length > 0) {
      const fMin = Math.min(...fiboLevels.map((f) => f.price));
      const fMax = Math.max(...fiboLevels.map((f) => f.price));
      if (fMin < min) min = fMin * 0.99;
      if (fMax > max) max = fMax * 1.01;
    }

    if (showPattern123 && pattern123) {
      if (pattern123.p0.price < min) min = pattern123.p0.price * 0.985;
      if (pattern123.p2.price < min) min = pattern123.p2.price * 0.985;
      if (pattern123.stopLossPrice < min) min = pattern123.stopLossPrice * 0.985;
      if (pattern123.necklinePrice > max) max = pattern123.necklinePrice * 1.015;
      if (pattern123.targetPrice > max && pattern123.status === 'CONFIRMED') {
        max = Math.min(max * 1.08, pattern123.targetPrice * 1.01);
      }
    }

    const margin = (max - min) * 0.08 || 1;
    return { minPrice: min - margin, maxPrice: max + margin };
  }, [klines, showBB, showSRLines, showFibonacci, fiboLevels, showPattern123, pattern123, stock]);

  // Sub indicator min / max
  const { subMin, subMax } = useMemo(() => {
    if (subIndicator === 'volume') {
      const maxVol = Math.max(...klines.map((k) => k.volume), 100);
      return { subMin: 0, subMax: maxVol * 1.15 };
    }
    if (subIndicator === 'kd' || subIndicator === 'rsi') {
      return { subMin: 0, subMax: 100 };
    }
    if (subIndicator === 'bias') {
      return { subMin: -15, subMax: 15 };
    }
    if (subIndicator === 'macd') {
      let maxAbs = 1;
      klines.forEach((k) => {
        if (k.dif !== undefined && Math.abs(k.dif) > maxAbs) maxAbs = Math.abs(k.dif);
        if (k.macd !== undefined && Math.abs(k.macd) > maxAbs) maxAbs = Math.abs(k.macd);
        if (k.osc !== undefined && Math.abs(k.osc) > maxAbs) maxAbs = Math.abs(k.osc);
      });
      return { subMin: -maxAbs * 1.2, subMax: maxAbs * 1.2 };
    }
    return { subMin: 0, subMax: 100 };
  }, [klines, subIndicator]);

  const getY = (val: number) => {
    const ratio = (val - minPrice) / (maxPrice - minPrice);
    return padding.top + (1 - ratio) * (mainHeight - padding.top - 10);
  };

  const getSubY = (val: number) => {
    const ratio = (val - subMin) / (subMax - subMin);
    return 10 + (1 - ratio) * (subHeight - 20);
  };

  const candleStep = chartWidth / (klines.length || 1);
  const candleBarWidth = Math.max(2, Math.min(10, candleStep * 0.65));

  const activeItem = hoverIndex !== null && klines[hoverIndex] ? klines[hoverIndex] : klines[klines.length - 1];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col space-y-0">
      {/* 講義買賣輔助決策指示條 (DNAI Trade Assistant Ribbon) */}
      {decision && (
        <div className="px-5 py-3 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/70 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span
              className={`px-3 py-1 rounded-lg font-bold border flex items-center gap-1.5 ${
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
                ? '🔥 講義評定：強烈買進'
                : decision.verdict === 'BUY'
                ? '🟢 講義評定：偏多買進'
                : decision.verdict === 'WATCH'
                ? '🟡 講義評定：區間觀望'
                : decision.verdict === 'TRIM'
                ? '🟠 講義評定：逢高減碼'
                : '🛑 講義評定：破線賣出'}
            </span>
            <span className="text-slate-300 hidden sm:inline">{decision.reason}</span>
          </div>

          <div className="flex items-center gap-3 font-mono">
            <span className="text-slate-400">
              進場參考: <strong className="text-white">{decision.entryPrice}</strong>
            </span>
            <span className="text-rose-400">
              停損點(當周低): <strong>{decision.stopLossPrice}</strong>
            </span>
            <span className="text-emerald-400">
              目標價: <strong>{decision.targetPrice}</strong> (盈虧比1:{decision.riskRewardRatio})
            </span>
            {onOpenResearch && (
              <button
                onClick={onOpenResearch}
                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center gap-1 transition-colors text-[11px]"
              >
                <Newspaper className="w-3.5 h-3.5" />
                重大新聞與原物料
              </button>
            )}
          </div>
        </div>
      )}

      {/* Top Header Controls */}
      <div className="px-5 py-3.5 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        {/* Stock Identity */}
        <div className="flex items-center gap-3">
          {onToggleWatchlist && (
            <button
              onClick={onToggleWatchlist}
              className={`p-2 rounded-xl border transition-all active:scale-95 flex items-center justify-center shrink-0 ${
                watchlistSymbols.includes(stock.symbol)
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
              }`}
              title={watchlistSymbols.includes(stock.symbol) ? '已在自選股 (點擊移除)' : '加入自選股'}
            >
              <Star className={`w-4 h-4 ${watchlistSymbols.includes(stock.symbol) ? 'fill-amber-400 text-amber-400' : ''}`} />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-white">{stock.name}</span>
              <span className="text-sm font-mono text-slate-400">{stock.symbol}</span>
              <span className="text-xs text-slate-500">{stock.market}</span>
              <span className="text-xs text-slate-500">·</span>
              <span className="text-xs text-slate-400">{stock.industry}</span>
            </div>
            <div className="flex items-center gap-3 text-xs mt-0.5 font-mono">
              <span className="text-xl font-bold" style={{ color: stock.change >= 0 ? upColor : downColor }}>
                {stock.price.toFixed(1)}
              </span>
              <span className="font-semibold" style={{ color: stock.change >= 0 ? upColor : downColor }}>
                {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(1)} ({stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%)
              </span>
              <span className="text-slate-400">總量: {stock.volume.toLocaleString()} 張</span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-400">成交額: {stock.turnover} 億</span>
            </div>
          </div>
        </div>

        {/* Action Buttons & Period Selector */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          {/* Period selector */}
          <div className="inline-flex rounded-lg bg-slate-800/80 p-0.5 border border-slate-700/60">
            <button
              onClick={() => setPeriod('intraday')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                period === 'intraday' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              即時分時
            </button>
            <button
              onClick={() => setPeriod('day')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                period === 'day' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              日 K 線
            </button>
            <button
              onClick={() => setPeriod('week')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                period === 'week' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              週 K 線
            </button>
          </div>

          {/* Indicator toggles */}
          <div className="inline-flex rounded-lg bg-slate-800/80 p-0.5 border border-slate-700/60">
            <button
              onClick={() => setShowMA(!showMA)}
              className={`px-2 py-1 rounded font-medium transition-colors ${
                showMA ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-white'
              }`}
              title="講義均線系統 MA5 / MA10 / MA20 / MA60 / MA72 / MA200"
            >
              均線 MA
            </button>
            <button
              onClick={() => setShowFibonacci(!showFibonacci)}
              className={`px-2 py-1 rounded font-medium transition-colors ${
                showFibonacci ? 'bg-yellow-500/25 text-yellow-300 font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="斐波那契黃金回撤線 (0%, 23.6%, 38.2%, 50%, 61.8%, 78.6%, 100%)"
            >
              斐波那契
            </button>
            <button
              onClick={() => setShowSupplyDemand(!showSupplyDemand)}
              className={`px-2 py-1 rounded font-medium transition-colors ${
                showSupplyDemand ? 'bg-rose-500/20 text-rose-300' : 'text-slate-400 hover:text-white'
              }`}
              title="講義裸K：供給區間 (賣壓) 與 需求區間 (買盤支撐)"
            >
              供需區間
            </button>
            <button
              onClick={() => setShowSRLines(!showSRLines)}
              className={`px-2 py-1 rounded font-medium transition-colors ${
                showSRLines ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
              }`}
              title="支撐與壓力線"
            >
              支撐壓力
            </button>
            <button
              onClick={() => setShowBB(!showBB)}
              className={`px-2 py-1 rounded font-medium transition-colors ${
                showBB ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              布林通道
            </button>
            <button
              onClick={() => setShowPattern123(!showPattern123)}
              className={`px-2 py-1 rounded font-medium transition-colors ${
                showPattern123 ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="講義【裸K 123法則】：突破頸線、回測不破、創波段新高"
            >
              123法則
            </button>
            <button
              onClick={() => setShowTradeSignal(!showTradeSignal)}
              className={`px-2 py-1 rounded font-medium transition-colors ${
                showTradeSignal ? 'bg-rose-500/20 text-rose-300 font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="講義【買賣輔助指示】：進場價、停損點、盈虧比目標價位"
            >
              買賣訊號
            </button>
          </div>

          {/* Zoom controls */}
          <div className="inline-flex rounded-lg bg-slate-800/80 p-0.5 border border-slate-700/60 items-center">
            <button
              onClick={() => setCandleCount((c) => Math.max(30, c - 15))}
              className="p-1 hover:text-white text-slate-300 transition-colors"
              title="放大K棒 (縮短K棒數量，放大單根細節)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono px-1 text-slate-400" title="當前顯示K棒數量">
              {klines.length}K
            </span>
            <button
              onClick={() => setCandleCount((c) => Math.min(130, c + 15))}
              className="p-1 hover:text-white text-slate-300 transition-colors"
              title="縮小K棒 (增加K棒數量，全景綜覽)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Fullscreen Expand button */}
          <button
            onClick={() => setIsZoomModalOpen(true)}
            className="px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 border border-indigo-500/50 hover:border-indigo-500 text-indigo-200 hover:text-white transition-colors flex items-center gap-1 font-semibold text-xs shadow-sm"
            title="點擊展開超大全螢幕圖表，放大縮小細看轉折型態"
          >
            <Maximize2 className="w-3.5 h-3.5 text-indigo-300" />
            <span>點開放大縮小</span>
          </button>

          {onOpenAlertModal && (
            <button
              onClick={onOpenAlertModal}
              className="px-2.5 py-1 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 hover:bg-rose-500/25 transition-colors flex items-center gap-1 font-medium"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              價格提醒
            </button>
          )}
        </div>
      </div>

      {/* Crosshair HUD Bar */}
      {activeItem && period !== 'intraday' && (
        <div className="px-5 py-1.5 bg-slate-950/60 border-b border-slate-800/70 flex flex-wrap items-center gap-4 text-xs font-mono">
          <span className="text-slate-400">日期: <strong className="text-white">{activeItem.date}</strong></span>
          <span className="text-slate-400">開: <strong className="text-white">{activeItem.open}</strong></span>
          <span className="text-slate-400">高: <strong className="text-white">{activeItem.high}</strong></span>
          <span className="text-slate-400">低: <strong className="text-white">{activeItem.low}</strong></span>
          <span className="text-slate-400">收: <strong style={{ color: activeItem.close >= activeItem.open ? upColor : downColor }}>{activeItem.close}</strong></span>
          <span className="text-slate-400">量: <strong className="text-amber-400">{activeItem.volume.toLocaleString()} 張</strong></span>
          {showMA && (
            <>
              {activeItem.ma5 && <span className="text-amber-400">MA5: {activeItem.ma5}</span>}
              {activeItem.ma10 && <span className="text-sky-400">MA10: {activeItem.ma10}</span>}
              {activeItem.ma20 && <span className="text-yellow-300">MA20: {activeItem.ma20}</span>}
              {activeItem.ma72 && <span className="text-purple-400">MA72: {activeItem.ma72}</span>}
              {activeItem.bias20 !== undefined && (
                <span className={activeItem.bias20 > 8 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                  乖離率20: {activeItem.bias20}% {activeItem.bias20 > 8 ? '(開口過大)' : ''}
                </span>
              )}
            </>
          )}
        </div>
      )}

      {/* Candlestick & Technical Indicators SVG */}
      {period === 'intraday' ? (
        <div className="p-4">
          <div className="text-xs text-slate-400 mb-2 flex items-center justify-between">
            <span>今日盤中走勢 (09:00 - 13:30)</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-0.5 bg-sky-400 inline-block"></span> 走勢價
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-0.5 bg-amber-400 inline-block"></span> 均價線
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-0.5 bg-slate-500 border-dashed inline-block"></span> 昨收 {stock.prevClose}
              </span>
            </div>
          </div>
          <svg viewBox={`0 0 ${width} 280`} className="w-full h-auto select-none">
            <line x1={0} y1={70} x2={width - 50} y2={70} stroke="#1e293b" strokeDasharray="3 3" />
            <line x1={0} y1={140} x2={width - 50} y2={140} stroke="#334155" strokeDasharray="4 4" />
            <line x1={0} y1={210} x2={width - 50} y2={210} stroke="#1e293b" strokeDasharray="3 3" />
            <text x={width - 45} y={144} fill="#64748b" fontSize="10" fontFamily="monospace">
              {stock.prevClose}
            </text>

            {(() => {
              if (stock.intraday.length === 0) {
                return (
                  <text x={width / 2} y={140} fill="#64748b" fontSize="12" textAnchor="middle">
                    今日盤後休市或分時連線撮合中
                  </text>
                );
              }
              const maxDelta = Math.max(
                ...stock.intraday.map((p) => Math.abs(p.price - stock.prevClose)),
                stock.prevClose * 0.02
              );
              const scaleY = (p: number) => 140 - ((p - stock.prevClose) / maxDelta) * 110;
              const stepX = (width - 60) / (stock.intraday.length - 1 || 1);

              const pricePoints = stock.intraday.map((p, i) => `${i * stepX},${scaleY(p.price)}`).join(' ');
              const avgPoints = stock.intraday.map((p, i) => `${i * stepX},${scaleY(p.avgPrice)}`).join(' ');

              return (
                <>
                  <polyline fill="none" stroke="#38bdf8" strokeWidth="2" points={pricePoints} />
                  <polyline fill="none" stroke="#f59e0b" strokeWidth="1.2" strokeDasharray="3 2" points={avgPoints} />
                </>
              );
            })()}
          </svg>
        </div>
      ) : (
        <div className="relative p-2">
          <svg
            viewBox={`0 0 ${width} ${mainHeight + subHeight}`}
            className="w-full h-auto select-none"
            onMouseLeave={() => setHoverIndex(null)}
          >
            {/* Horizontal Grid lines */}
            {[0.2, 0.4, 0.6, 0.8].map((ratio, idx) => {
              const yVal = minPrice + ratio * (maxPrice - minPrice);
              const y = getY(yVal);
              return (
                <g key={idx}>
                  <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#1e293b" strokeDasharray="2 2" />
                  <text x={width - padding.right + 8} y={y + 3} fill="#64748b" fontSize="10" fontFamily="monospace">
                    {yVal.toFixed(1)}
                  </text>
                </g>
              );
            })}

            {/* 講義 裸K 供需區間 (Supply & Demand Zones) */}
            {showSupplyDemand &&
              supplyDemand.map((zone, zIdx) => {
                const yTop = getY(zone.high);
                const yBottom = getY(zone.low);
                const h = Math.max(8, Math.abs(yBottom - yTop));
                const isSupply = zone.type === 'supply';

                return (
                  <g key={`sd-${zIdx}`}>
                    <rect
                      x={padding.left}
                      y={Math.min(yTop, yBottom)}
                      width={chartWidth}
                      height={h}
                      fill={isSupply ? '#f43f5e' : '#10b981'}
                      fillOpacity="0.08"
                      stroke={isSupply ? '#f43f5e' : '#10b981'}
                      strokeWidth="0.8"
                      strokeDasharray="4 3"
                    />
                    <text
                      x={padding.left + 8}
                      y={Math.min(yTop, yBottom) + 12}
                      fill={isSupply ? '#fda4af' : '#6ee7b7'}
                      fontSize="9"
                      fontWeight="bold"
                    >
                      {isSupply ? '【供給區間】歷史賣壓共識區' : '【需求區間】歷史買盤支撐區'}
                    </text>
                  </g>
                );
              })}

            {/* 斐波那契回撤黃金分割線 (Fibonacci Retracement) */}
            {showFibonacci && (() => {
              const f382 = fiboLevels.find((f) => f.ratio === 0.382);
              const f618 = fiboLevels.find((f) => f.ratio === 0.618);
              return (
                <g>
                  {/* Golden Pocket Area Fill */}
                  {f382 && f618 && (
                    <g>
                      <rect
                        x={padding.left}
                        y={Math.min(getY(f382.price), getY(f618.price))}
                        width={chartWidth}
                        height={Math.abs(getY(f618.price) - getY(f382.price))}
                        fill="#eab308"
                        fillOpacity="0.08"
                        stroke="#eab308"
                        strokeWidth="0.8"
                        strokeDasharray="2 2"
                      />
                      <text
                        x={padding.left + 8}
                        y={Math.min(getY(f382.price), getY(f618.price)) + 12}
                        fill="#fde047"
                        fontSize="9"
                        fontWeight="bold"
                      >
                        ★ 斐波那契黃金口袋防守區 (0.382 ~ 0.618)
                      </text>
                    </g>
                  )}

                  {fiboLevels.map((fibo, fIdx) => {
                    const y = getY(fibo.price);
                    const isGold = fibo.ratio === 0.618 || fibo.ratio === 0.5;

                    return (
                      <g key={`fibo-${fIdx}`}>
                        <line
                          x1={padding.left}
                          y1={y}
                          x2={width - padding.right}
                          y2={y}
                          stroke={isGold ? '#eab308' : '#854d0e'}
                          strokeWidth={isGold ? '1.4' : '0.8'}
                          strokeDasharray={isGold ? 'none' : '3 3'}
                        />
                        <text
                          x={width - padding.right + 6}
                          y={y + 3}
                          fill={isGold ? '#fde047' : '#ca8a04'}
                          fontSize="9"
                          fontFamily="monospace"
                          fontWeight={isGold ? 'bold' : 'normal'}
                        >
                          {fibo.ratio === 0.618 ? '★ 61.8%' : fibo.label.slice(0, 5)} {fibo.price}
                        </text>
                      </g>
                    );
                  })}
                </g>
              );
            })()}

            {/* 講義【裸K 123 法則轉折形態標記與線型】 */}
            {showPattern123 && pattern123 && klines.length >= 20 && (() => {
              const p0 = pattern123.p0;
              const p1 = pattern123.p1;
              const p2 = pattern123.p2;
              const p3 = pattern123.p3;

              const x0 = padding.left + p0.idx * candleStep + candleStep / 2;
              const y0 = getY(p0.price);

              const x1 = padding.left + p1.idx * candleStep + candleStep / 2;
              const y1 = getY(p1.price);

              const x2 = padding.left + p2.idx * candleStep + candleStep / 2;
              const y2 = getY(p2.price);

              const x3 = padding.left + p3.idx * candleStep + candleStep / 2;
              const y3 = getY(p3.price);

              const trendX1 = padding.left + pattern123.trendline.x1Idx * candleStep + candleStep / 2;
              const trendY1 = getY(pattern123.trendline.y1);
              const trendX2 = padding.left + pattern123.trendline.x2Idx * candleStep + candleStep / 2;
              const trendY2 = getY(pattern123.trendline.y2);

              const neckY = getY(pattern123.necklinePrice);
              const stopLossY = getY(pattern123.stopLossPrice);
              const targetY = getY(pattern123.targetPrice);

              return (
                <g className="rule-123-graphics">
                  {/* 1. 下降趨勢壓力線 (步驟1被向上突破的趨勢線) */}
                  <g>
                    <line
                      x1={trendX1}
                      y1={trendY1}
                      x2={trendX2}
                      y2={trendY2}
                      stroke="#f59e0b"
                      strokeWidth="5"
                      strokeOpacity="0.18"
                      strokeLinecap="round"
                    />
                    <line
                      x1={trendX1}
                      y1={trendY1}
                      x2={trendX2}
                      y2={trendY2}
                      stroke="#f59e0b"
                      strokeWidth="1.8"
                      strokeDasharray="6 3"
                    />
                    <g transform={`translate(${(trendX1 + trendX2) / 2}, ${(trendY1 + trendY2) / 2 - 8})`}>
                      <rect x="-44" y="-8" width="88" height="15" rx="3" fill="#1e1b4b" stroke="#f59e0b" strokeWidth="0.8" fillOpacity="0.95" />
                      <text x="0" y="3" fill="#fbbf24" fontSize="8" fontWeight="bold" textAnchor="middle">
                        📉 下降趨勢線(已突破)
                      </text>
                    </g>
                  </g>

                  {/* 2. 水平頸線突破基準線 (P1 高點延伸頸線) */}
                  <g>
                    <line
                      x1={Math.max(padding.left, x1 - 25)}
                      y1={neckY}
                      x2={width - padding.right}
                      y2={neckY}
                      stroke="#818cf8"
                      strokeWidth="2"
                      strokeDasharray="4 2"
                    />
                    <g transform={`translate(${width - padding.right - 55}, ${neckY - 8})`}>
                      <rect x="-48" y="-7" width="96" height="15" rx="3" fill="#312e81" stroke="#818cf8" strokeWidth="0.8" fillOpacity="0.95" />
                      <text x="0" y="4" fill="#c7d2fe" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                        ══ 頸線位: {pattern123.necklinePrice} 元
                      </text>
                    </g>
                  </g>

                  {/* 3. 123 轉折走勢折線 (P0 -> P1 -> P2 -> P3 核心幾何路徑) */}
                  <g>
                    {/* Glowing underlay polyline */}
                    <polyline
                      points={`${x0},${y0} ${x1},${y1} ${x2},${y2} ${x3},${y3}`}
                      fill="none"
                      stroke="#6366f1"
                      strokeWidth="6"
                      strokeOpacity="0.3"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                    {/* Sharp core polyline */}
                    <polyline
                      points={`${x0},${y0} ${x1},${y1} ${x2},${y2} ${x3},${y3}`}
                      fill="none"
                      stroke="#a5b4fc"
                      strokeWidth="2.5"
                      strokeDasharray="5 3"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                  </g>

                  {/* 4. 停損水平線與目標價水平線 */}
                  <g>
                    {/* 停損線 (P2低點防守位) */}
                    <line
                      x1={x2}
                      y1={stopLossY}
                      x2={width - padding.right}
                      y2={stopLossY}
                      stroke="#ef4444"
                      strokeWidth="1.2"
                      strokeDasharray="2 2"
                    />
                    <text x={x2 + 8} y={stopLossY + 11} fill="#fca5a5" fontSize="8" fontFamily="monospace" fontWeight="bold">
                      🛑 123停損價 {pattern123.stopLossPrice} (P2低點)
                    </text>

                    {/* 目標價線 */}
                    <line
                      x1={x1}
                      y1={targetY}
                      x2={width - padding.right}
                      y2={targetY}
                      stroke="#10b981"
                      strokeWidth="1.2"
                      strokeDasharray="2 2"
                    />
                    <text x={x1 + 8} y={targetY - 4} fill="#6ee7b7" fontSize="8" fontFamily="monospace" fontWeight="bold">
                      🎯 123目標價 {pattern123.targetPrice} (1:1.618波段)
                    </text>
                  </g>

                  {/* 5. 節點標記 (Node Circles & Badges) */}
                  {/* Point 0: ⓪ 探底最低點 */}
                  <g transform={`translate(${x0}, ${y0})`}>
                    <circle r="7" fill="#64748b" fillOpacity="0.35" />
                    <circle r="3.5" fill="#94a3b8" stroke="#0f172a" strokeWidth="1.5" />
                    <line x1="0" y1="5" x2="0" y2="14" stroke="#64748b" strokeWidth="1" strokeDasharray="1 1" />
                    <g transform="translate(0, 22)">
                      <rect x="-42" y="-8" width="84" height="15" rx="3" fill="#0f172a" stroke="#64748b" strokeWidth="0.8" fillOpacity="0.95" />
                      <text x="0" y="3" fill="#cbd5e1" fontSize="8" fontWeight="bold" textAnchor="middle">
                        ⓪ 探底 {p0.price}
                      </text>
                    </g>
                  </g>

                  {/* Point 1: ① 突破下降趨勢線 */}
                  <g transform={`translate(${x1}, ${y1})`}>
                    <circle r="8" fill="#6366f1" fillOpacity="0.4" />
                    <circle r="4" fill="#6366f1" stroke="#ffffff" strokeWidth="1.5" />
                    <line x1="0" y1="-5" x2="0" y2="-12" stroke="#6366f1" strokeWidth="1" strokeDasharray="1 1" />
                    <g transform="translate(0, -20)">
                      <rect x="-44" y="-8" width="88" height="15" rx="3" fill="#312e81" stroke="#6366f1" strokeWidth="1" fillOpacity="0.95" />
                      <text x="0" y="3" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">
                        ① 突破線 {p1.price}
                      </text>
                    </g>
                  </g>

                  {/* Point 2: ② 回測不破底 (Higher Low) */}
                  <g transform={`translate(${x2}, ${y2})`}>
                    <circle r="8" fill="#10b981" fillOpacity="0.4" />
                    <circle r="4" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
                    <line x1="0" y1="5" x2="0" y2="12" stroke="#10b981" strokeWidth="1" strokeDasharray="1 1" />
                    <g transform="translate(0, 20)">
                      <rect x="-48" y="-8" width="96" height="15" rx="3" fill="#064e3b" stroke="#10b981" strokeWidth="1" fillOpacity="0.95" />
                      <text x="0" y="3" fill="#6ee7b7" fontSize="8" fontWeight="bold" textAnchor="middle">
                        ② 不破底 {p2.price}
                      </text>
                    </g>
                  </g>

                  {/* Point 3: ③ 突破頸線買點 (反轉確立) */}
                  <g transform={`translate(${x3}, ${y3})`}>
                    <circle r="9" fill={p3.isBreakout ? '#f43f5e' : '#f59e0b'} fillOpacity="0.45" className="animate-pulse" />
                    <circle r="4.5" fill={p3.isBreakout ? '#f43f5e' : '#f59e0b'} stroke="#ffffff" strokeWidth="1.5" />
                    <line x1="0" y1="-6" x2="0" y2="-14" stroke={p3.isBreakout ? '#f43f5e' : '#f59e0b'} strokeWidth="1.2" />
                    <g transform="translate(0, -22)">
                      <rect x="-52" y="-8" width="104" height="15" rx="3" fill={p3.isBreakout ? '#881337' : '#78350f'} stroke={p3.isBreakout ? '#f43f5e' : '#f59e0b'} strokeWidth="1" fillOpacity="0.95" />
                      <text x="0" y="3" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">
                        {p3.isBreakout ? `③ 買點 ${p3.price} (反轉確立)` : `③ 衝擊頸線 ${p3.price}`}
                      </text>
                    </g>
                  </g>
                </g>
              );
            })()}

            {/* 講義【買進/停損/目標價標註線】 */}
            {showTradeSignal && decision && (
              <g>
                {/* 建議進場價 */}
                <line
                  x1={padding.left}
                  y1={getY(decision.entryPrice)}
                  x2={width - padding.right}
                  y2={getY(decision.entryPrice)}
                  stroke="#38bdf8"
                  strokeWidth="1.2"
                  strokeDasharray="3 2"
                />
                <text
                  x={padding.left + 12}
                  y={getY(decision.entryPrice) - 4}
                  fill="#7dd3fc"
                  fontSize="9"
                  fontWeight="bold"
                >
                  進場參考: {decision.entryPrice}
                </text>

                {/* 停損點位 */}
                <line
                  x1={padding.left}
                  y1={getY(decision.stopLossPrice)}
                  x2={width - padding.right}
                  y2={getY(decision.stopLossPrice)}
                  stroke="#ef4444"
                  strokeWidth="1.4"
                  strokeDasharray="2 2"
                />
                <text
                  x={padding.left + 12}
                  y={getY(decision.stopLossPrice) + 12}
                  fill="#fca5a5"
                  fontSize="9"
                  fontWeight="bold"
                >
                  🛑 嚴格停損: {decision.stopLossPrice} (當周低)
                </text>

                {/* 目標獲利價位 */}
                <line
                  x1={padding.left}
                  y1={getY(decision.targetPrice)}
                  x2={width - padding.right}
                  y2={getY(decision.targetPrice)}
                  stroke="#10b981"
                  strokeWidth="1.4"
                  strokeDasharray="3 2"
                />
                <text
                  x={padding.left + 12}
                  y={getY(decision.targetPrice) - 4}
                  fill="#6ee7b7"
                  fontSize="9"
                  fontWeight="bold"
                >
                  🎯 目標價: {decision.targetPrice} (風報比 1:{decision.riskRewardRatio})
                </text>
              </g>
            )}

            {/* Support and Resistance Lines */}
            {showSRLines && (
              <>
                <g>
                  <line
                    x1={padding.left}
                    y1={getY(stock.resistancePrice)}
                    x2={width - padding.right}
                    y2={getY(stock.resistancePrice)}
                    stroke="#ef4444"
                    strokeWidth="1.2"
                    strokeDasharray="4 3"
                  />
                  <rect
                    x={width - padding.right + 4}
                    y={getY(stock.resistancePrice) - 8}
                    width="60"
                    height="16"
                    rx="3"
                    fill="#ef4444"
                    fillOpacity="0.2"
                    stroke="#ef4444"
                    strokeWidth="0.8"
                  />
                  <text
                    x={width - padding.right + 8}
                    y={getY(stock.resistancePrice) + 4}
                    fill="#fca5a5"
                    fontSize="9"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    壓 {stock.resistancePrice}
                  </text>
                </g>

                <g>
                  <line
                    x1={padding.left}
                    y1={getY(stock.supportPrice)}
                    x2={width - padding.right}
                    y2={getY(stock.supportPrice)}
                    stroke="#10b981"
                    strokeWidth="1.2"
                    strokeDasharray="4 3"
                  />
                  <rect
                    x={width - padding.right + 4}
                    y={getY(stock.supportPrice) - 8}
                    width="60"
                    height="16"
                    rx="3"
                    fill="#10b981"
                    fillOpacity="0.2"
                    stroke="#10b981"
                    strokeWidth="0.8"
                  />
                  <text
                    x={width - padding.right + 8}
                    y={getY(stock.supportPrice) + 4}
                    fill="#6ee7b7"
                    fontSize="9"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    撐 {stock.supportPrice}
                  </text>
                </g>
              </>
            )}

            {/* Moving Averages Lines */}
            {showMA && (
              <g>
                {/* MA5 */}
                {(() => {
                  const pts = klines
                    .map((k, i) => (k.ma5 ? `${padding.left + i * candleStep + candleStep / 2},${getY(k.ma5)}` : ''))
                    .filter(Boolean)
                    .join(' ');
                  return <polyline fill="none" stroke="#f59e0b" strokeWidth="1.5" points={pts} />;
                })()}

                {/* MA10 */}
                {(() => {
                  const pts = klines
                    .map((k, i) => (k.ma10 ? `${padding.left + i * candleStep + candleStep / 2},${getY(k.ma10)}` : ''))
                    .filter(Boolean)
                    .join(' ');
                  return <polyline fill="none" stroke="#38bdf8" strokeWidth="1.2" points={pts} />;
                })()}

                {/* MA20 */}
                {(() => {
                  const pts = klines
                    .map((k, i) => (k.ma20 ? `${padding.left + i * candleStep + candleStep / 2},${getY(k.ma20)}` : ''))
                    .filter(Boolean)
                    .join(' ');
                  return <polyline fill="none" stroke="#eab308" strokeWidth="1.5" points={pts} />;
                })()}

                {/* MA72 (講義中期均線) */}
                {(() => {
                  const pts = klines
                    .map((k, i) => (k.ma72 ? `${padding.left + i * candleStep + candleStep / 2},${getY(k.ma72)}` : ''))
                    .filter(Boolean)
                    .join(' ');
                  return <polyline fill="none" stroke="#c084fc" strokeWidth="1.5" strokeDasharray="3 1" points={pts} />;
                })()}
              </g>
            )}

            {/* Candlesticks */}
            {klines.map((k, idx) => {
              const cx = padding.left + idx * candleStep + candleStep / 2;
              const isBull = k.close >= k.open;
              const color = isBull ? upColor : downColor;

              const openY = getY(k.open);
              const closeY = getY(k.close);
              const highY = getY(k.high);
              const lowY = getY(k.low);

              const bodyTop = Math.min(openY, closeY);
              const bodyHeight = Math.max(1.5, Math.abs(closeY - openY));

              return (
                <g key={idx}>
                  <line x1={cx} y1={highY} x2={cx} y2={lowY} stroke={color} strokeWidth="1.2" />
                  <rect
                    x={cx - candleBarWidth / 2}
                    y={bodyTop}
                    width={candleBarWidth}
                    height={bodyHeight}
                    fill={color}
                    rx="1"
                  />
                  <rect
                    x={padding.left + idx * candleStep}
                    y={padding.top}
                    width={candleStep}
                    height={mainHeight + subHeight}
                    fill="transparent"
                    onMouseEnter={() => setHoverIndex(idx)}
                    className="cursor-crosshair"
                  />
                </g>
              );
            })}

            {/* Active Crosshair line */}
            {hoverIndex !== null && (
              <g pointerEvents="none">
                <line
                  x1={padding.left + hoverIndex * candleStep + candleStep / 2}
                  y1={padding.top}
                  x2={padding.left + hoverIndex * candleStep + candleStep / 2}
                  y2={mainHeight + subHeight - 10}
                  stroke="#94a3b8"
                  strokeWidth="0.8"
                  strokeDasharray="3 3"
                />
                {klines[hoverIndex] && (
                  <line
                    x1={padding.left}
                    y1={getY(klines[hoverIndex].close)}
                    x2={width - padding.right}
                    y2={getY(klines[hoverIndex].close)}
                    stroke="#94a3b8"
                    strokeWidth="0.8"
                    strokeDasharray="3 3"
                  />
                )}
              </g>
            )}

            {/* Divider */}
            <line x1={padding.left} y1={mainHeight} x2={width - padding.right} y2={mainHeight} stroke="#334155" strokeWidth="1" />

            {/* Sub Indicator Sub-chart */}
            <g transform={`translate(0, ${mainHeight})`}>
              <rect x={padding.left} y={0} width={chartWidth} height={subHeight} fill="#0f172a" fillOpacity="0.4" />

              {/* Volume sub-chart */}
              {subIndicator === 'volume' && (
                <g>
                  {klines.map((k, idx) => {
                    const cx = padding.left + idx * candleStep + candleStep / 2;
                    const isBull = k.close >= k.open;
                    const color = isBull ? upColor : downColor;
                    const h = ((k.volume - subMin) / (subMax - subMin)) * (subHeight - 20);
                    const y = subHeight - h - 5;

                    return (
                      <rect
                        key={idx}
                        x={cx - candleBarWidth / 2}
                        y={y}
                        width={candleBarWidth}
                        height={Math.max(1, h)}
                        fill={color}
                        fillOpacity="0.85"
                        rx="1"
                      />
                    );
                  })}
                </g>
              )}

              {/* 乖離率 BIAS Sub-chart (講義 Page 33) */}
              {subIndicator === 'bias' && (
                <g>
                  {/* +8% Overextended line */}
                  <line x1={padding.left} y1={getSubY(8)} x2={width - padding.right} y2={getSubY(8)} stroke="#ef4444" strokeDasharray="2 2" strokeWidth="0.8" />
                  <text x={padding.left + 5} y={getSubY(8) - 2} fill="#ef4444" fontSize="8">+8% (開口過大/波段結束警戒)</text>

                  {/* 0% Line */}
                  <line x1={padding.left} y1={getSubY(0)} x2={width - padding.right} y2={getSubY(0)} stroke="#475569" strokeWidth="1" />

                  {/* -8% Line */}
                  <line x1={padding.left} y1={getSubY(-8)} x2={width - padding.right} y2={getSubY(-8)} stroke="#10b981" strokeDasharray="2 2" strokeWidth="0.8" />
                  <text x={padding.left + 5} y={getSubY(-8) + 8} fill="#10b981" fontSize="8">-8% (負乖離超跌)</text>

                  {/* 20-day BIAS line */}
                  {(() => {
                    const pts = klines
                      .map((k, i) => (k.bias20 !== undefined ? `${padding.left + i * candleStep + candleStep / 2},${getSubY(k.bias20)}` : ''))
                      .filter(Boolean)
                      .join(' ');
                    return <polyline fill="none" stroke="#eab308" strokeWidth="1.6" points={pts} />;
                  })()}
                </g>
              )}

              {/* KD Sub-chart */}
              {subIndicator === 'kd' && (
                <g>
                  <line x1={padding.left} y1={getSubY(80)} x2={width - padding.right} y2={getSubY(80)} stroke="#ef4444" strokeDasharray="2 2" strokeWidth="0.8" />
                  <line x1={padding.left} y1={getSubY(20)} x2={width - padding.right} y2={getSubY(20)} stroke="#10b981" strokeDasharray="2 2" strokeWidth="0.8" />
                  {(() => {
                    const kPts = klines.map((k, i) => (k.k !== undefined ? `${padding.left + i * candleStep + candleStep / 2},${getSubY(k.k)}` : '')).filter(Boolean).join(' ');
                    const dPts = klines.map((k, i) => (k.d !== undefined ? `${padding.left + i * candleStep + candleStep / 2},${getSubY(k.d)}` : '')).filter(Boolean).join(' ');
                    return (
                      <>
                        <polyline fill="none" stroke="#f59e0b" strokeWidth="1.5" points={kPts} />
                        <polyline fill="none" stroke="#38bdf8" strokeWidth="1.5" points={dPts} />
                      </>
                    );
                  })()}
                </g>
              )}

              {/* MACD Sub-chart */}
              {subIndicator === 'macd' && (
                <g>
                  <line x1={padding.left} y1={getSubY(0)} x2={width - padding.right} y2={getSubY(0)} stroke="#475569" strokeWidth="1" />
                  {klines.map((k, idx) => {
                    if (k.osc === undefined) return null;
                    const cx = padding.left + idx * candleStep + candleStep / 2;
                    const zeroY = getSubY(0);
                    const oscY = getSubY(k.osc);
                    const barH = Math.abs(oscY - zeroY);
                    const barTop = k.osc >= 0 ? oscY : zeroY;
                    const color = k.osc >= 0 ? upColor : downColor;
                    return (
                      <rect key={idx} x={cx - candleBarWidth / 2} y={barTop} width={candleBarWidth} height={Math.max(1, barH)} fill={color} fillOpacity="0.75" />
                    );
                  })}
                  {(() => {
                    const difPts = klines.map((k, i) => (k.dif !== undefined ? `${padding.left + i * candleStep + candleStep / 2},${getSubY(k.dif)}` : '')).filter(Boolean).join(' ');
                    const macdPts = klines.map((k, i) => (k.macd !== undefined ? `${padding.left + i * candleStep + candleStep / 2},${getSubY(k.macd)}` : '')).filter(Boolean).join(' ');
                    return (
                      <>
                        <polyline fill="none" stroke="#f59e0b" strokeWidth="1.4" points={difPts} />
                        <polyline fill="none" stroke="#06b6d4" strokeWidth="1.4" points={macdPts} />
                      </>
                    );
                  })()}
                </g>
              )}

              {/* RSI Sub-chart */}
              {subIndicator === 'rsi' && (
                <g>
                  <line x1={padding.left} y1={getSubY(70)} x2={width - padding.right} y2={getSubY(70)} stroke="#ef4444" strokeDasharray="2 2" strokeWidth="0.8" />
                  <line x1={padding.left} y1={getSubY(30)} x2={width - padding.right} y2={getSubY(30)} stroke="#10b981" strokeDasharray="2 2" strokeWidth="0.8" />
                  {(() => {
                    const rsi6Pts = klines.map((k, i) => (k.rsi6 !== undefined ? `${padding.left + i * candleStep + candleStep / 2},${getSubY(k.rsi6)}` : '')).filter(Boolean).join(' ');
                    return <polyline fill="none" stroke="#f43f5e" strokeWidth="1.5" points={rsi6Pts} />;
                  })()}
                </g>
              )}
            </g>
          </svg>
        </div>
      )}

      {/* Sub-indicator Selector Bar */}
      <div className="px-5 py-2 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1">
          <span className="text-slate-500 mr-2">副圖指標:</span>
          {(['volume', 'bias', 'kd', 'macd', 'rsi'] as SubIndicator[]).map((tab) => {
            const labels: Record<SubIndicator, string> = {
              volume: '成交量 VOL',
              bias: '【講義】乖離率 BIAS',
              kd: '隨機指標 KD',
              macd: '平滑 MACD',
              rsi: '強弱 RSI',
            };
            return (
              <button
                key={tab}
                onClick={() => setSubIndicator(tab)}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  subIndicator === tab
                    ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>

        {activeItem && (
          <div className="font-mono text-xs flex items-center gap-3">
            {subIndicator === 'volume' && (
              <span className="text-slate-400">
                成交量: <span className="text-amber-400">{activeItem.volume.toLocaleString()} 張</span>
              </span>
            )}
            {subIndicator === 'bias' && (
              <span className="text-amber-300 font-bold">
                20日乖離率: {activeItem.bias20 ?? 0}%
              </span>
            )}
            {subIndicator === 'kd' && (
              <>
                <span className="text-amber-400">K: {activeItem.k ?? '-'}</span>
                <span className="text-sky-400">D: {activeItem.d ?? '-'}</span>
              </>
            )}
            {subIndicator === 'macd' && (
              <>
                <span className="text-amber-400">DIF: {activeItem.dif ?? '-'}</span>
                <span className="text-cyan-400">MACD: {activeItem.macd ?? '-'}</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* 斐波那契黃金分割計算板與【講義】買賣選股輔助戰情室 (Fibonacci & Decision Assistant Cockpit) */}
      <div className="border-t border-slate-800 bg-slate-950 p-5 space-y-4">
        {/* Fibonacci Retracement Ladder */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <h3 className="font-bold text-white text-xs uppercase tracking-wider">
                斐波那契黃金回撤分割線 (Fibonacci Retracement Matrix)
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded bg-yellow-950/70 border border-yellow-800 text-yellow-300 font-mono">
                關鍵比例: 0.382 / 0.5 / 0.618
              </span>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              現價: <strong className="text-white">{stock.price}</strong> 元
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 font-mono text-xs">
            {fiboLevels.map((fibo, idx) => {
              const isCurrentClose = Math.abs(stock.price - fibo.price) / (stock.price || 1) < 0.025;
              const isGolden = fibo.ratio === 0.618 || fibo.ratio === 0.382 || fibo.ratio === 0.5;

              return (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    isCurrentClose
                      ? 'bg-yellow-500/20 border-yellow-500/80 text-yellow-200 ring-2 ring-yellow-500/30 shadow-md'
                      : isGolden
                      ? 'bg-slate-900 border-yellow-900/60 text-yellow-300/90'
                      : 'bg-slate-900/70 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="text-[10px] font-semibold text-slate-400">
                    {fibo.ratio === 0.618
                      ? '★ 0.618 (黃金支撐)'
                      : fibo.ratio === 0.382
                      ? '0.382 (強回檔)'
                      : fibo.ratio === 0.5
                      ? '0.50 (多空中軸)'
                      : fibo.label}
                  </div>
                  <div className="text-sm font-bold text-white mt-0.5">
                    {fibo.price}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {stock.price >= fibo.price ? (
                      <span className="text-emerald-400">撐 +{((stock.price - fibo.price) / fibo.price * 100).toFixed(1)}%</span>
                    ) : (
                      <span className="text-rose-400">壓 {((stock.price - fibo.price) / fibo.price * 100).toFixed(1)}%</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 講義【裸K 123 法則轉折型態專屬診斷面板】 */}
        {showPattern123 && pattern123 && (
          <div className="bg-slate-900/90 border border-indigo-900/60 rounded-xl p-4 shadow-lg bg-gradient-to-r from-slate-950 via-indigo-950/20 to-slate-950 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-900/40 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded bg-indigo-600/20 text-indigo-300 border border-indigo-500/30">
                  <Sparkles className="w-4 h-4" />
                </span>
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  【裸K 123 法則】轉折波段多頭形態幾何解析
                </h4>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                    pattern123.status === 'CONFIRMED'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      : pattern123.status === 'IN_PROGRESS'
                      ? 'bg-amber-950 text-amber-300 border-amber-800'
                      : 'bg-rose-950 text-rose-300 border-rose-800'
                  }`}
                >
                  {pattern123.status === 'CONFIRMED'
                    ? '✅ 步驟3完成 · 123多頭反轉正式確立 (最佳買點)'
                    : pattern123.status === 'IN_PROGRESS'
                    ? '⏳ 步驟3進行中 · 回測守住第2隻腳，挑戰頸線中'
                    : '⚠️ 跌破起跌低點 · 型態失效'}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <span>頸線阻力: <strong className="text-indigo-300">{pattern123.necklinePrice}</strong> 元</span>
                <span>·</span>
                <span>防守停損: <strong className="text-rose-400">{pattern123.stopLossPrice}</strong> 元</span>
                <span>·</span>
                <span>滿足目標: <strong className="text-emerald-400">{pattern123.targetPrice}</strong> 元</span>
              </div>
            </div>

            {/* 3 Steps Visual Timeline */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              {/* Step 1 */}
              <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 space-y-1">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-indigo-400">步驟 1：突破下降趨勢線</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-mono">
                    {pattern123.p1.date}
                  </span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  自波段最低點 <strong className="text-white font-mono">{pattern123.p0.price}</strong> 元放量突破下降壓力線，反彈衝至第一波高點 <strong className="text-white font-mono">{pattern123.p1.price}</strong> 元，奠定水平頸線基準。
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 space-y-1">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-emerald-400">步驟 2：回測不破底 (Higher Low)</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                    {pattern123.p2.date}
                  </span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  短線拉回打第二隻腳，最低至 <strong className="text-white font-mono">{pattern123.p2.price}</strong> 元，{pattern123.p2.price >= pattern123.p0.price ? '未跌破前期低點 (Higher Low成立)' : '測底回穩'}，買盤進駐承接。
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 space-y-1">
                <div className="flex items-center justify-between font-bold">
                  <span className={pattern123.p3.isBreakout ? 'text-rose-400' : 'text-amber-400'}>
                    步驟 3：突破前高頸線 (反轉確認)
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800 font-mono">
                    {pattern123.p3.date}
                  </span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {pattern123.p3.isBreakout
                    ? `帶量突破頸線 ${pattern123.necklinePrice} 元，收盤價 ${pattern123.p3.price} 元，主升段反轉正式確立，依紀律進場！`
                    : `現價正自第二隻腳向頸線 ${pattern123.necklinePrice} 元挺進，待帶量突破即為正式進場加碼點。`}
                </p>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 bg-slate-950/50 px-3 py-1.5 rounded border border-slate-800/80 flex items-center justify-between">
              <span>📌 講義風控原則：停損嚴格設在第 2 步低點下方 ({pattern123.stopLossPrice} 元)，目標價依 1:1.618 拓展設為 {pattern123.targetPrice} 元，維持正期望值。</span>
            </div>
          </div>
        )}

        {/* DNAI Trade Assistant Decision & Risk-Reward Evaluation */}
        {decision && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-stretch justify-between gap-4 text-xs">
            {/* Verdict and Conditions */}
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-white text-sm">【講義輔助決策評定】買賣建議與技術型態檢核</span>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded border ${
                    decision.verdict === 'STRONG_BUY'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : decision.verdict === 'BUY'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : decision.verdict === 'WATCH'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  {decision.verdict === 'STRONG_BUY'
                    ? '🔥 強烈買進訊號'
                    : decision.verdict === 'BUY'
                    ? '🟢 偏多買進訊號'
                    : decision.verdict === 'WATCH'
                    ? '🟡 區間觀望'
                    : '🟠 逢高減碼'}
                </span>
                <span className="font-mono text-slate-400 font-semibold">
                  綜合得分: <strong className="text-white">{decision.score}</strong> / 100
                </span>
              </div>

              <p className="text-slate-300 leading-relaxed pl-1">
                {decision.reason}
              </p>

              {/* Lecture Checklist Badges */}
              <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-[11px]">
                <span
                  className={`px-2 py-0.5 rounded border flex items-center gap-1 ${
                    decision.rule123Status === 'PASSED'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  裸K 123反轉型態: {decision.rule123Status === 'PASSED' ? '確認完成' : '醞釀中'}
                </span>

                <span
                  className={`px-2 py-0.5 rounded border flex items-center gap-1 ${
                    decision.maAlignment === 'BULLISH'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                  均線排列: {decision.maAlignment === 'BULLISH' ? '多頭排列 (MA5>20>60)' : '震盪整理'}
                </span>

                <span
                  className={`px-2 py-0.5 rounded border flex items-center gap-1 ${
                    decision.volumeStatus === 'EXPANDING'
                      ? 'bg-rose-950 text-rose-300 border-rose-800'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  <BarChart2 className="w-3 h-3 text-rose-400" />
                  預估成交量: {decision.volumeStatus === 'EXPANDING' ? '放量 1.5~4倍 (主力點火)' : '常態量能'}
                </span>
              </div>
            </div>

            {/* Price Targets & Stop Loss Card */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 shrink-0 font-mono space-y-2 min-w-[260px]">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                <span>紀律交易參數</span>
                <span className="text-emerald-400 font-bold">盈虧比 1:{decision.riskRewardRatio}</span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">進場參考價：</span>
                  <strong className="text-white text-sm">{decision.entryPrice} 元</strong>
                </div>

                <div className="flex items-center justify-between text-rose-400">
                  <span>🛑 嚴格停損 (當周低)：</span>
                  <strong className="text-sm font-bold">{decision.stopLossPrice} 元</strong>
                </div>

                <div className="flex items-center justify-between text-emerald-400">
                  <span>🎯 目標價 (滿足波段)：</span>
                  <strong className="text-sm font-bold">{decision.targetPrice} 元</strong>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 bg-slate-900/80 p-1.5 rounded border border-slate-800 leading-tight">
                講義紀律：嚴守「盈虧比至少 1:2」與「不破當周低點」原則，避免追高被隔日沖主力倒貨。
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FULLSCREEN ZOOM MODAL (點開放大縮小技術型態) */}
      {isZoomModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col p-3 sm:p-6 overflow-hidden animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl flex-1 flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-bold text-base">
                  {stock.symbol.slice(0, 2)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-white tracking-tight">{stock.name}</h3>
                    <span className="font-mono text-sm text-slate-400">{stock.symbol}</span>
                    <span className="text-xs text-slate-400">{stock.industry} · {stock.market}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                      全螢幕高清放大檢視
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs mt-0.5 font-mono">
                    <span className="text-lg font-bold" style={{ color: stock.change >= 0 ? upColor : downColor }}>
                      {stock.price.toFixed(1)} 元
                    </span>
                    <span className="font-semibold" style={{ color: stock.change >= 0 ? upColor : downColor }}>
                      {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(1)} ({stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%)
                    </span>
                    <span className="text-slate-400">總成交量: {stock.volume.toLocaleString()} 張</span>
                  </div>
                </div>
              </div>

              {/* Controls inside Fullscreen Modal */}
              <div className="flex items-center flex-wrap gap-2 text-xs">
                {/* Zoom Controls */}
                <div className="inline-flex rounded-lg bg-slate-800 p-1 border border-slate-700 items-center gap-1">
                  <span className="text-[11px] text-slate-400 px-1 font-medium">圖表縮放:</span>
                  <button
                    onClick={() => setCandleCount((c) => Math.max(25, c - 15))}
                    className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-white flex items-center gap-1 font-medium text-xs transition-colors"
                    title="放大K棒"
                  >
                    <ZoomIn className="w-3.5 h-3.5 text-indigo-300" />
                    放大 ({candleCount}K)
                  </button>
                  <button
                    onClick={() => setCandleCount((c) => Math.min(130, c + 15))}
                    className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-white flex items-center gap-1 font-medium text-xs transition-colors"
                    title="縮小K棒"
                  >
                    <ZoomOut className="w-3.5 h-3.5 text-indigo-300" />
                    縮小
                  </button>
                </div>

                {/* Period Selector */}
                <div className="inline-flex rounded-lg bg-slate-800 p-0.5 border border-slate-700">
                  <button
                    onClick={() => setPeriod('day')}
                    className={`px-3 py-1 rounded font-medium transition-colors ${
                      period === 'day' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    日K線
                  </button>
                  <button
                    onClick={() => setPeriod('week')}
                    className={`px-3 py-1 rounded font-medium transition-colors ${
                      period === 'week' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    週K線
                  </button>
                  <button
                    onClick={() => setPeriod('intraday')}
                    className={`px-3 py-1 rounded font-medium transition-colors ${
                      period === 'intraday' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    即時分時
                  </button>
                </div>

                {/* Close Fullscreen Button */}
                <button
                  onClick={() => setIsZoomModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 border border-slate-700 hover:border-rose-500 text-white font-semibold flex items-center gap-1.5 transition-colors text-xs"
                >
                  <Minimize2 className="w-4 h-4" />
                  縮小關閉
                </button>
              </div>
            </div>

            {/* Crosshair HUD in Fullscreen */}
            {activeItem && period !== 'intraday' && (
              <div className="px-5 py-2 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center gap-5 text-xs font-mono">
                <span className="text-slate-400">日期: <strong className="text-white text-sm">{activeItem.date}</strong></span>
                <span className="text-slate-400">開盤: <strong className="text-white text-sm">{activeItem.open}</strong></span>
                <span className="text-slate-400">最高: <strong className="text-white text-sm">{activeItem.high}</strong></span>
                <span className="text-slate-400">最低: <strong className="text-white text-sm">{activeItem.low}</strong></span>
                <span className="text-slate-400">收盤: <strong className="text-sm" style={{ color: activeItem.close >= activeItem.open ? upColor : downColor }}>{activeItem.close}</strong></span>
                <span className="text-slate-400">成交量: <strong className="text-amber-400 text-sm">{activeItem.volume.toLocaleString()} 張</strong></span>
                {showMA && (
                  <>
                    {activeItem.ma5 && <span className="text-amber-400 font-semibold">MA5: {activeItem.ma5}</span>}
                    {activeItem.ma10 && <span className="text-sky-400 font-semibold">MA10: {activeItem.ma10}</span>}
                    {activeItem.ma20 && <span className="text-yellow-300 font-semibold">MA20: {activeItem.ma20}</span>}
                    {activeItem.ma72 && <span className="text-purple-400 font-semibold">MA72: {activeItem.ma72}</span>}
                  </>
                )}
              </div>
            )}

            {/* Main Interactive Chart in Fullscreen (Scrollable / Big Viewport) */}
            <div className="flex-1 overflow-auto p-4 flex flex-col items-center justify-center bg-slate-950/40">
              <div className="w-full max-w-6xl">
                <svg
                  viewBox={`0 0 ${width} ${mainHeight + subHeight + 10}`}
                  className="w-full h-auto drop-shadow-md select-none rounded-xl bg-slate-900/90 border border-slate-800"
                  style={{ minHeight: '480px' }}
                >
                  {/* Grid Lines */}
                  {[0.2, 0.4, 0.6, 0.8].map((ratio) => {
                    const price = minPrice + ratio * (maxPrice - minPrice);
                    const y = getY(price);
                    return (
                      <g key={ratio}>
                        <line
                          x1={padding.left}
                          y1={y}
                          x2={width - padding.right}
                          y2={y}
                          stroke="#1e293b"
                          strokeDasharray="3 3"
                          strokeWidth="1"
                        />
                        <text
                          x={width - padding.right + 8}
                          y={y + 4}
                          fill="#64748b"
                          fontSize="11"
                          fontFamily="monospace"
                        >
                          {price.toFixed(1)}
                        </text>
                      </g>
                    );
                  })}

                  {/* Fibonacci Levels */}
                  {showFibonacci &&
                    fiboLevels.map((f, idx) => {
                      const y = getY(f.price);
                      return (
                        <g key={idx}>
                          <line
                            x1={padding.left}
                            y1={y}
                            x2={width - padding.right}
                            y2={y}
                            stroke="#eab308"
                            strokeOpacity={f.isKeyReversal ? '0.85' : '0.4'}
                            strokeDasharray={f.isKeyReversal ? 'none' : '4 4'}
                            strokeWidth={f.isKeyReversal ? '1.5' : '1'}
                          />
                          <text
                            x={padding.left + 5}
                            y={y - 4}
                            fill="#eab308"
                            fontSize="10"
                            fontFamily="monospace"
                            fontWeight="bold"
                          >
                            斐波 {f.label} ({f.price.toFixed(1)})
                          </text>
                        </g>
                      );
                    })}

                  {/* Support & Resistance Lines */}
                  {showSRLines && (
                    <>
                      <line
                        x1={padding.left}
                        y1={getY(stock.resistancePrice)}
                        x2={width - padding.right}
                        y2={getY(stock.resistancePrice)}
                        stroke="#ef4444"
                        strokeDasharray="4 2"
                        strokeWidth="1.5"
                      />
                      <text
                        x={width - padding.right + 8}
                        y={getY(stock.resistancePrice) - 3}
                        fill="#ef4444"
                        fontSize="11"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        壓力 {stock.resistancePrice}
                      </text>

                      <line
                        x1={padding.left}
                        y1={getY(stock.supportPrice)}
                        x2={width - padding.right}
                        y2={getY(stock.supportPrice)}
                        stroke="#10b981"
                        strokeDasharray="4 2"
                        strokeWidth="1.5"
                      />
                      <text
                        x={width - padding.right + 8}
                        y={getY(stock.supportPrice) + 12}
                        fill="#10b981"
                        fontSize="11"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        支撐 {stock.supportPrice}
                      </text>
                    </>
                  )}

                  {/* Candlesticks in Fullscreen */}
                  {klines.map((k, idx) => {
                    const x = padding.left + idx * candleStep + candleStep / 2;
                    const openY = getY(k.open);
                    const closeY = getY(k.close);
                    const highY = getY(k.high);
                    const lowY = getY(k.low);
                    const isUp = k.close >= k.open;
                    const color = isUp ? upColor : downColor;
                    const top = Math.min(openY, closeY);
                    const bodyH = Math.max(2, Math.abs(openY - closeY));

                    return (
                      <g
                        key={idx}
                        onMouseEnter={() => setHoverIndex(idx)}
                        className="cursor-pointer transition-opacity hover:opacity-80"
                      >
                        <line x1={x} y1={highY} x2={x} y2={lowY} stroke={color} strokeWidth="1.5" />
                        <rect
                          x={x - candleBarWidth / 2}
                          y={top}
                          width={candleBarWidth}
                          height={bodyH}
                          fill={isUp ? color : color}
                          stroke={color}
                          strokeWidth="1"
                          rx="1"
                        />
                      </g>
                    );
                  })}

                  {/* Volume Bars */}
                  {klines.map((k, idx) => {
                    const x = padding.left + idx * candleStep + candleStep / 2;
                    const isUp = k.close >= k.open;
                    const color = isUp ? upColor : downColor;
                    const volRatio = (k.volume - subMin) / (subMax - subMin);
                    const volH = Math.max(2, volRatio * (subHeight - 20));
                    const y = mainHeight + 20 + (subHeight - 20 - volH);

                    return (
                      <rect
                        key={`vol-${idx}`}
                        x={x - candleBarWidth / 2}
                        y={y}
                        width={candleBarWidth}
                        height={volH}
                        fill={color}
                        opacity="0.7"
                        rx="1"
                      />
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Bottom Status Ribbons in Fullscreen Modal */}
            <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="text-white font-semibold">雙重評定提示：</span>
                <span className="text-slate-300">
                  {decision?.entryTiming?.label || '依據講義紀律：嚴守5MA/20MA均線支撐，切勿追高過熱個股。'}
                </span>
              </div>
              <button
                onClick={() => setIsZoomModalOpen(false)}
                className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white font-medium"
              >
                關閉放大畫面
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
