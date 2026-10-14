import React, { useState } from 'react';
import { Stock, RadarSignal, SignalType } from '../types/stock';
import { MarketIndexData } from '../services/stockApi';
import {
  Zap,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Shield,
  Layers,
  ArrowUpRight,
  BellRing,
  Filter,
  Flame,
  Activity,
  CheckCircle2,
  RefreshCw,
  Target,
  Sparkles,
  Building,
  Newspaper,
  ChevronRight,
  AlertTriangle,
  Star,
} from 'lucide-react';

interface TopThemeItem {
  id: string;
  rank: number;
  name: string;
  netInflow: number; // 億元
  turnoverRatio: number; // %
  changePct: number; // %
  leadingStocks: { symbol: string; name: string; price: number; changePercent: number }[];
  description: string;
}

interface StockInflowItem {
  rank: number;
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  netInflow: number; // 億元
  mainForceRatio: number; // %
  investorType: 'LONG_TERM_ACCUMULATION' | 'SHORT_TERM_WHALE' | 'INSTITUTIONAL_BUY';
  tagLabel: string;
  note: string;
}

interface MoneyRadarViewProps {
  stocks: Stock[];
  signals: RadarSignal[];
  colorMode: 'tw' | 'intl';
  marketIndex?: MarketIndexData | null;
  onSelectStock: (stock: Stock) => void;
  onOpenAlertModal: (stock: Stock) => void;
  onOpenResearch?: (stock: Stock) => void;
  onOpenChart?: (stock: Stock) => void;
  onNavigateToSectors?: () => void;
  onNavigateToScreener?: () => void;
  onNavigateToPortfolio?: () => void;
  onManualScan: () => void;
  isScanning: boolean;
  watchlistSymbols?: string[];
  onToggleWatchlist?: (stock: Stock | { symbol: string; name: string }) => void;
}

const TOP_THEMES: TopThemeItem[] = [
  {
    id: 'theme-1',
    rank: 1,
    name: 'AI 伺服器散熱水冷與自研 ASIC',
    netInflow: 88.5,
    turnoverRatio: 12.8,
    changePct: 2.45,
    leadingStocks: [
      { symbol: '3017', name: '奇鋐', price: 3340, changePercent: -2.91 },
      { symbol: '3324', name: '雙鴻', price: 840, changePercent: 1.82 },
      { symbol: '3653', name: '健策', price: 1420, changePercent: 1.43 },
    ],
    description: '輝達 GB300 與四大 CSP 自研 ASIC 液冷散熱滲透率飆升，外資重申買進，奇鋐回測月線吸引波段大單進駐。',
  },
  {
    id: 'theme-2',
    rank: 2,
    name: 'CoWoS 先進封裝與 CPO 矽光子',
    netInflow: 126.8,
    turnoverRatio: 15.6,
    changePct: 3.42,
    leadingStocks: [
      { symbol: '2330', name: '台積電', price: 2500, changePercent: -1.58 },
      { symbol: '3081', name: '聯亞', price: 2735, changePercent: -9.59 },
      { symbol: '3363', name: '上詮', price: 548, changePercent: -8.97 },
    ],
    description: 'AI 算力模組全面擁抱 800G/1.6T 矽光子收發晶片，先進封裝供不應求，外資長線核心持續囤貨。',
  },
  {
    id: 'theme-3',
    rank: 3,
    name: '伺服器 BMC 晶片與千金矽智財',
    netInflow: 76.4,
    turnoverRatio: 9.2,
    changePct: 2.18,
    leadingStocks: [
      { symbol: '5274', name: '信驊', price: 17220, changePercent: -2.68 },
      { symbol: '3529', name: '力旺', price: 2765, changePercent: -2.98 },
      { symbol: '3661', name: '世芯-KY', price: 2450, changePercent: 1.45 },
    ],
    description: '伺服器遠端晶片與先進製程純 IP 授權金雙雙爆發，千金股龍頭高資產波段買盤堅定。',
  },
  {
    id: 'theme-4',
    rank: 4,
    name: 'AI 伺服器整機與雲端機櫃',
    netInflow: 68.2,
    turnoverRatio: 11.5,
    changePct: 1.95,
    leadingStocks: [
      { symbol: '6669', name: '緯穎', price: 2220, changePercent: -2.42 },
      { symbol: '2382', name: '廣達', price: 326, changePercent: -0.61 },
      { symbol: '2317', name: '鴻海', price: 250, changePercent: 0.81 },
    ],
    description: 'GB200/GB300 新一代 AI 機櫃全面量產出貨，四大美系 CSP 雲端資本支出上調帶來持續強勁動能。',
  },
  {
    id: 'theme-5',
    rank: 5,
    name: '人形機器人傳動與精密減速機',
    netInflow: 45.6,
    turnoverRatio: 5.8,
    changePct: 2.82,
    leadingStocks: [
      { symbol: '4583', name: '台灣精銳', price: 396, changePercent: -3.42 },
      { symbol: '6187', name: '萬潤', price: 1635, changePercent: -2.39 },
    ],
    description: '特斯拉 Optimus 與輝達 GR00T 引爆人形機器人零組件轉型商機，減速機毛利率突破 50%。',
  },
  {
    id: 'theme-6',
    rank: 6,
    name: 'WiFi 7 次世代手機與砷化鎵 PA',
    netInflow: 38.5,
    turnoverRatio: 6.4,
    changePct: 4.85,
    leadingStocks: [
      { symbol: '8086', name: '宏捷科', price: 140.5, changePercent: -5.39 },
      { symbol: '1513', name: '中興電', price: 166, changePercent: -1.77 },
    ],
    description: '受惠 WiFi 7 次世代手機 PA 晶片用量倍增及強韌電網 GIS 開關在手訂單近 400 億，低基期資金湧入。',
  },
];

const STOCK_INFLOW_RANK: StockInflowItem[] = [
  {
    rank: 1,
    symbol: '2330',
    name: '台積電',
    price: 2500,
    change: -40,
    changePercent: -1.58,
    netInflow: 168.5,
    mainForceRatio: 64,
    investorType: 'LONG_TERM_ACCUMULATION',
    tagLabel: '🏦 長線波段主力囤貨',
    note: '外資與投信長線核心持有，2nm 與 CoWoS 產能吃緊，長線籌碼極度安定。',
  },
  {
    rank: 2,
    symbol: '3017',
    name: '奇鋐',
    price: 3340,
    change: -100,
    changePercent: -2.91,
    netInflow: 58.2,
    mainForceRatio: 56,
    investorType: 'INSTITUTIONAL_BUY',
    tagLabel: '❄️ 散熱龍頭回測吸籌',
    note: 'AI伺服器水冷板與分歧管滲透率飆升；今拉回回測月線，波段主力趁勢大額吸籌。',
  },
  {
    rank: 3,
    symbol: '2454',
    name: '聯發科',
    price: 4745,
    change: 85,
    changePercent: 1.82,
    netInflow: 52.6,
    mainForceRatio: 60,
    investorType: 'LONG_TERM_ACCUMULATION',
    tagLabel: '📱 天璣AI與ASIC爆發',
    note: '旗艦天璣晶片獲高階智慧機大舉採用，雲端ASIC專案進入認列期，外資重金布局。',
  },
  {
    rank: 4,
    symbol: '5274',
    name: '信驊',
    price: 17220,
    change: -475,
    changePercent: -2.68,
    netInflow: 46.8,
    mainForceRatio: 62,
    investorType: 'LONG_TERM_ACCUMULATION',
    tagLabel: '👑 股王千金波段吸籌',
    note: '伺服器 BMC 晶片市占超過 75%，千張大戶持股逾 68%，特定分點長線囤貨。',
  },
  {
    rank: 5,
    symbol: '3081',
    name: '聯亞',
    price: 2735,
    change: -290,
    changePercent: -9.59,
    netInflow: 42.5,
    mainForceRatio: 66,
    investorType: 'LONG_TERM_ACCUMULATION',
    tagLabel: '🌱 低基期矽光子大轉機',
    note: 'CPO 800G/1.6T CW 雷射光源供不應求，長線法人與波段主力積極進場。',
  },
  {
    rank: 6,
    symbol: '4583',
    name: '台灣精銳',
    price: 396,
    change: -14,
    changePercent: -3.42,
    netInflow: 36.2,
    mainForceRatio: 59,
    investorType: 'LONG_TERM_ACCUMULATION',
    tagLabel: '🤖 機器人減速機黑馬',
    note: '全球行星減速機前二強，大戶持股逾 78%，無散戶套牢浮額，突破整理平台。',
  },
  {
    rank: 7,
    symbol: '6669',
    name: '緯穎',
    price: 2220,
    change: -55,
    changePercent: -2.42,
    netInflow: 34.8,
    mainForceRatio: 58,
    investorType: 'INSTITUTIONAL_BUY',
    tagLabel: '📈 法人重金加碼',
    note: '美系 CSP 自研 ASIC 伺服器整機出貨高峰，投信與外資同步大單買超。',
  },
  {
    rank: 8,
    symbol: '3529',
    name: '力旺',
    price: 2765,
    change: -85,
    changePercent: -2.98,
    netInflow: 31.5,
    mainForceRatio: 55,
    investorType: 'LONG_TERM_ACCUMULATION',
    tagLabel: '🏦 純矽智財權利金爆發',
    note: '台積電 3nm/2nm 授權權利金零成本入帳，波段大戶籌碼集中度大增。',
  },
  {
    rank: 9,
    symbol: '8086',
    name: '宏捷科',
    price: 140.5,
    change: -8,
    changePercent: -5.39,
    netInflow: 28.6,
    mainForceRatio: 72,
    investorType: 'SHORT_TERM_WHALE',
    tagLabel: '⚡ 隔日沖鎖碼 (嚴禁追高)',
    note: '短線隔日沖分點介入。切勿追高第一根漲停，待拉回 5MA (約 136~140 元) 量縮承接！',
  },
  {
    rank: 10,
    symbol: '6187',
    name: '萬潤',
    price: 1635,
    change: -40,
    changePercent: -2.39,
    netInflow: 26.4,
    mainForceRatio: 57,
    investorType: 'INSTITUTIONAL_BUY',
    tagLabel: '📦 CoWoS 設備龍頭',
    note: '台積電先進封裝擴產關鍵貼合點膠設備，在手訂單直達2026年，投信持續加碼。',
  },
];

export const MoneyRadarView: React.FC<MoneyRadarViewProps> = ({
  stocks,
  signals,
  colorMode,
  marketIndex,
  onSelectStock,
  onOpenAlertModal,
  onOpenResearch,
  onOpenChart,
  onNavigateToSectors,
  onNavigateToScreener,
  onNavigateToPortfolio,
  onManualScan,
  isScanning,
  watchlistSymbols = [],
  onToggleWatchlist,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | SignalType>('ALL');

  const isRedUp = colorMode === 'tw';
  const upColor = isRedUp ? '#ef4444' : '#10b981';
  const downColor = isRedUp ? '#10b981' : '#ef4444';

  // Live Indices Data (2026-10-13 今日盤後正式結算)
  const taiexPrice = marketIndex?.taiex?.price ?? marketIndex?.price ?? 48341.96;
  const taiexChange = marketIndex?.taiex?.change ?? marketIndex?.change ?? -960;
  const taiexPct = marketIndex?.taiex?.changePercent ?? marketIndex?.changePercent ?? -1.95;
  const taiexTurnover = marketIndex?.taiex?.turnoverEst ?? marketIndex?.turnoverEst ?? 11250; // 1 兆 1,250 億元

  const txPrice = marketIndex?.txf?.price ?? 48400;
  const txChange = marketIndex?.txf?.change ?? -945;
  const txPct = marketIndex?.txf?.changePercent ?? -1.91;

  const otcPrice = marketIndex?.otc?.price ?? 414.31;
  const otcChange = marketIndex?.otc?.change ?? -13.59;
  const otcPct = marketIndex?.otc?.changePercent ?? -3.18;
  const otcTurnover = marketIndex?.otc?.turnoverEst ?? 2460;

  const filteredSignals = signals.filter((sig) => {
    if (selectedFilter === 'ALL') return true;
    return sig.type === selectedFilter;
  });

  const handleStockClick = (symbol: string) => {
    const found = stocks.find((s) => s.symbol === symbol);
    if (found) {
      if (onOpenResearch) {
        onOpenResearch(found);
      } else {
        onSelectStock(found);
      }
    }
  };

  const handleChartClick = (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const found = stocks.find((s) => s.symbol === symbol);
    if (found && onOpenChart) {
      onOpenChart(found);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* 1. 當前即時大盤、期貨、櫃買報價看板 (即時資金雷達核心頂部看板) */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/70 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Zap className="w-4 h-4 fill-rose-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                即時資金雷達首頁
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-950/80 border border-rose-800 text-rose-300 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                  即時串流連線中
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                台指近全 (期貨代號: TXF8) · 加權指數 · 櫃買指數全時報價 · 當日熱門題材資金流動 · 個股主力淨流入深度監測
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onManualScan}
              disabled={isScanning}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              {isScanning ? '資金掃描中...' : '重新掃描雷達'}
            </button>
          </div>
        </div>

        {/* 3 大指數看板卡片 (期貨 / 加權 / 櫃買) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* 台指近全 (期貨代號: TXF8 / 全時盤) */}
          <div className="bg-slate-900/90 border border-indigo-500/40 rounded-xl p-3.5 flex flex-col justify-between hover:border-indigo-500/70 transition-colors ring-1 ring-indigo-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-indigo-300">台指近全 (TXF8)</span>
                {marketIndex?.isNightSession || marketIndex?.txf?.isNightSession ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-700/80 font-mono font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
                    🌙 夜盤撮合中
                  </span>
                ) : (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-mono">
                    全日盤
                  </span>
                )}
              </div>
              <span className="text-[10px] text-indigo-300/90 font-mono">
                {marketIndex?.txf?.updateTime ? `${marketIndex.txf.updateTime} 更新` : '即時撮合'}
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <div className="font-mono text-xl font-bold text-white tracking-tight">
                {txPrice.toLocaleString()}
              </div>
              <div className="flex flex-col items-end">
                {marketIndex?.txf?.nightChange !== undefined && (marketIndex.isNightSession || marketIndex.txf.isNightSession) ? (
                  <>
                    <div
                      className="font-mono font-bold text-xs flex items-center gap-0.5"
                      style={{ color: (marketIndex.txf.nightChange ?? 0) >= 0 ? upColor : downColor }}
                    >
                      {(marketIndex.txf.nightChange ?? 0) >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                      夜盤 {(marketIndex.txf.nightChange ?? 0) >= 0 ? '+' : ''}
                      {marketIndex.txf.nightChange} ({(marketIndex.txf.nightChangePercent ?? 0) >= 0 ? '+' : ''}
                      {marketIndex.txf.nightChangePercent}%)
                    </div>
                    <div className="font-mono text-[10px] text-slate-400 mt-0.5">
                      全日 {txChange >= 0 ? '+' : ''}{txChange} ({txPct >= 0 ? '+' : ''}{txPct}%)
                    </div>
                  </>
                ) : (
                  <div
                    className="font-mono font-bold text-xs flex items-center gap-0.5"
                    style={{ color: txChange >= 0 ? upColor : downColor }}
                  >
                    {txChange >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    {txChange >= 0 ? '+' : ''}
                    {txChange} ({txPct >= 0 ? '+' : ''}
                    {txPct}%)
                  </div>
                )}
              </div>
            </div>
            <div className="mt-1 text-[11px] text-slate-400 font-mono flex items-center justify-between border-t border-slate-800/80 pt-1.5 flex-wrap gap-1">
              <span>日盤結算: <strong className="text-slate-300 font-semibold">{marketIndex?.txf?.dayClose?.toLocaleString() ?? '48,400'}</strong> ({marketIndex?.txf?.dayChange ?? -945}點)</span>
              <span>區間: {marketIndex?.txf?.low ? marketIndex.txf.low.toLocaleString() : '48,000'} ~ {marketIndex?.txf?.high ? marketIndex.txf.high.toLocaleString() : '49,200'}</span>
            </div>
          </div>

          {/* 加權指數 (TAIEX) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between hover:border-slate-700 transition-colors ring-1 ring-amber-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-amber-300">加權指數 (TAIEX)</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800 font-mono">
                  大盤
                </span>
              </div>
              <span
                className="text-amber-300 font-mono text-[11px] font-bold bg-amber-950/80 border border-amber-800/80 px-1.5 py-0.5 rounded"
                title="大盤最新總成交金額"
              >
                {taiexTurnover.toLocaleString()} 億元
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <div className="font-mono text-xl font-bold text-white tracking-tight">
                {taiexPrice.toLocaleString()}
              </div>
              <div
                className="font-mono font-bold text-xs flex items-center gap-0.5"
                style={{ color: taiexChange >= 0 ? upColor : downColor }}
              >
                {taiexChange >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {taiexChange >= 0 ? '+' : ''}
                {Math.abs(taiexChange) % 1 === 0 ? taiexChange : taiexChange.toFixed(2)} ({taiexPct >= 0 ? '+' : ''}
                {taiexPct.toFixed(2)}%)
              </div>
            </div>
            <div className="mt-1 text-[11px] text-slate-400 font-mono flex items-center justify-between border-t border-slate-800/80 pt-1.5">
              <span>TWSE 集中市場總成交金額</span>
              <strong className="text-amber-300 font-bold">{taiexTurnover.toLocaleString()} 億 (1.1 兆)</strong>
            </div>
          </div>

          {/* 櫃買指數 (OTC) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-300">櫃買指數 (OTC)</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-950 text-sky-300 border border-sky-800 font-mono">
                  中小型股
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">{otcTurnover} 億</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <div className="font-mono text-xl font-bold text-white tracking-tight">
                {otcPrice.toFixed(2)}
              </div>
              <div
                className="font-mono font-bold text-xs flex items-center gap-0.5"
                style={{ color: otcChange >= 0 ? upColor : downColor }}
              >
                {otcChange >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {otcChange >= 0 ? '+' : ''}
                {otcChange.toFixed(2)} ({otcPct >= 0 ? '+' : ''}
                {otcPct.toFixed(2)}%)
              </div>
            </div>
            <div className="mt-1 text-[11px] text-slate-400 font-mono flex items-center justify-between border-t border-slate-800/80 pt-1.5">
              <span>中小型氛圍</span>
              <span className={`font-semibold ${otcChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {otcChange >= 0 ? '資金輪動偏多' : '避險賣壓沉重'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 綜合策略波段核心投組入口 Banner (4檔千金股 + 6檔低基期潛力小公司) */}
      <div className="bg-gradient-to-r from-indigo-950/90 via-slate-900 to-amber-950/60 border border-indigo-700/60 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-amber-500 flex items-center justify-center text-white shrink-0 shadow-lg">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-base tracking-tight">
                綜合策略波段 10 檔核心投組推薦
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                4檔千金股 + 6檔低基期潛力小公司
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
              全面覆蓋未來 5 大主流產業趨勢（CPO矽光子、AI ASIC、先進封裝、機器人減速機、WiFi 7），兼顧千金股穩健箭頭與低基期轉型爆發力！
            </p>
          </div>
        </div>

        {onNavigateToPortfolio && (
          <button
            onClick={onNavigateToPortfolio}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs whitespace-nowrap shadow-lg flex items-center justify-center gap-1.5 transition-all active:scale-95 shrink-0"
          >
            <span>查看 10 檔波段名單與進場建議</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 2. 當日即時題材排行榜 (即時題材排行榜) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                當日即時題材排行榜
                <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-mono">
                  資金淨流入 TOP 6
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                依據當日概念族群資金淨流入金額排序 · 掌握市場主流領頭羊動能
              </p>
            </div>
          </div>

          {onNavigateToSectors && (
            <button
              onClick={onNavigateToSectors}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold transition-colors"
            >
              看完整題材資金流向
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 題材排行榜卡片列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {TOP_THEMES.map((theme) => {
            const rankBadgeColor =
              theme.rank === 1
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : theme.rank === 2
                ? 'bg-slate-700/60 text-slate-200 border-slate-600'
                : theme.rank === 3
                ? 'bg-amber-700/20 text-amber-400 border-amber-700/40'
                : 'bg-slate-800 text-slate-400 border-slate-700';

            return (
              <div
                key={theme.id}
                className="bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-xl p-4 space-y-3 transition-all hover:shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-lg text-xs font-mono font-bold flex items-center justify-center border ${rankBadgeColor}`}>
                        {theme.rank}
                      </span>
                      <h4 className="font-bold text-white text-sm tracking-tight">{theme.name}</h4>
                    </div>
                    <span
                      className="font-mono text-xs font-bold"
                      style={{ color: theme.changePct >= 0 ? upColor : downColor }}
                    >
                      {theme.changePct >= 0 ? '+' : ''}
                      {theme.changePct.toFixed(2)}%
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-2.5 bg-slate-900/80 p-2 rounded-lg border border-slate-800/80 text-xs font-mono">
                    <div>
                      <span className="text-slate-400 text-[10px] block">資金淨流入</span>
                      <strong className="text-rose-400 text-sm font-bold">+{theme.netInflow} 億</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">大盤成交佔比</span>
                      <strong className="text-white text-sm">{theme.turnoverRatio}%</strong>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {theme.description}
                  </p>
                </div>

                {/* Leading Stocks inside Theme */}
                <div className="pt-2 border-t border-slate-800/80">
                  <div className="text-[10px] text-slate-400 font-semibold mb-1">族群領頭強勢股：</div>
                  <div className="flex flex-wrap gap-1.5">
                    {theme.leadingStocks.map((stk) => {
                      const live = stocks.find((s) => s.symbol === stk.symbol);
                      const p = live?.price ?? stk.price;
                      const pct = live?.changePercent ?? stk.changePercent;
                      return (
                        <button
                          key={stk.symbol}
                          onClick={() => handleStockClick(stk.symbol)}
                          className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500 text-xs font-mono flex items-center gap-1 transition-all group"
                        >
                          <span className="text-white font-medium group-hover:text-indigo-400">{stk.name}</span>
                          <span className="text-[10px]" style={{ color: pct >= 0 ? upColor : downColor }}>
                            {p.toLocaleString()} ({pct >= 0 ? '+' : ''}{pct.toFixed(2)}%)
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. 資金流入個股排行榜 (主力大單淨買超個股排行) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                資金流入個股排行榜
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                  大單淨流入 TOP 8
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                依據當日主力大單資金淨買超金額 · 標記短線隔日沖鎖碼風險與長線囤貨主力
              </p>
            </div>
          </div>

          {onNavigateToScreener && (
            <button
              onClick={onNavigateToScreener}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold transition-colors"
            >
              進入【講義】選股決策體系
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 個股資金流入卡片/表格 */}
        <div className="space-y-2.5">
          {STOCK_INFLOW_RANK.map((item) => {
            const isShortWhale = item.investorType === 'SHORT_TERM_WHALE';
            const isLongWhale = item.investorType === 'LONG_TERM_ACCUMULATION';
            const live = stocks.find((s) => s.symbol === item.symbol);
            const curPrice = live?.price ?? item.price;
            const curChange = live?.change ?? item.change;
            const curPct = live?.changePercent ?? item.changePercent;

            return (
              <div
                key={item.symbol}
                onClick={() => handleStockClick(item.symbol)}
                className="bg-slate-950/70 border border-slate-800 hover:border-slate-700 hover:bg-slate-950 rounded-xl p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs cursor-pointer transition-all hover:shadow-md group"
              >
                {/* Stock Info & Tag */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 font-mono text-sm font-bold flex items-center justify-center text-indigo-400 shrink-0">
                    #{item.rank}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-base group-hover:text-indigo-400 transition-colors">
                        {item.name}
                      </span>
                      <span className="text-slate-400 font-mono text-xs">{item.symbol}</span>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                          isShortWhale
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                            : isLongWhale
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                        }`}
                      >
                        {item.tagLabel}
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs mt-1 leading-relaxed max-w-xl">
                      {item.note}
                    </p>
                  </div>
                </div>

                {/* Numbers & Action */}
                <div className="flex items-center justify-between md:justify-end gap-5 shrink-0 font-mono">
                  {/* Price & Change */}
                  <div className="text-right">
                    <span className="text-white font-bold text-sm block">
                      {curPrice.toLocaleString()} 元
                    </span>
                    <span
                      className="font-semibold text-xs block"
                      style={{ color: curChange >= 0 ? upColor : downColor }}
                    >
                      {curChange >= 0 ? '+' : ''}
                      {curChange.toFixed(1)} ({curPct >= 0 ? '+' : ''}
                      {curPct.toFixed(2)}%)
                    </span>
                  </div>

                  {/* Inflow Amount */}
                  <div className="text-right bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">大單淨流入</span>
                    <strong className="text-rose-400 text-sm font-bold">+{item.netInflow} 億</strong>
                    <span className="text-slate-500 text-[10px] block">佔比 {item.mainForceRatio}%</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    {onToggleWatchlist && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const found = stocks.find((s) => s.symbol === item.symbol);
                          onToggleWatchlist(found || { symbol: item.symbol, name: item.name });
                        }}
                        className={`p-1.5 rounded-lg border transition-all active:scale-95 ${
                          watchlistSymbols?.includes(item.symbol)
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                        }`}
                        title={
                          watchlistSymbols?.includes(item.symbol)
                            ? '已在自選股 (點擊移除)'
                            : '加入自選股'
                        }
                      >
                        <Star
                          className={`w-3.5 h-3.5 ${
                            watchlistSymbols?.includes(item.symbol)
                              ? 'fill-amber-400 text-amber-400'
                              : ''
                          }`}
                        />
                      </button>
                    )}
                    <button
                      onClick={(e) => handleChartClick(item.symbol, e)}
                      className="px-2.5 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white transition-colors text-xs font-semibold"
                      title="點開技術圖表放大縮小檢視"
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStockClick(item.symbol);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors text-xs font-medium"
                      title="查看籌碼追蹤與雙重評定"
                    >
                      籌碼詳情
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. 即時突破與資金湧入訊號流 (Live Signals) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-rose-500" />
            <h3 className="text-base font-bold text-white tracking-tight">即時盤中突破訊號流</h3>
            <span className="text-xs text-slate-400">({filteredSignals.length} 則即時預警)</span>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            <button
              onClick={() => setSelectedFilter('ALL')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                selectedFilter === 'ALL'
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-400 hover:text-white bg-slate-900/60'
              }`}
            >
              全部訊號
            </button>
            <button
              onClick={() => setSelectedFilter('BREAKOUT_RESISTANCE')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                selectedFilter === 'BREAKOUT_RESISTANCE'
                  ? 'bg-rose-600 text-white'
                  : 'text-rose-400 hover:text-white bg-slate-900/60 border border-rose-900/40'
              }`}
            >
              壓力突破
            </button>
            <button
              onClick={() => setSelectedFilter('VOLUME_EXPLOSION')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                selectedFilter === 'VOLUME_EXPLOSION'
                  ? 'bg-amber-600 text-white'
                  : 'text-amber-400 hover:text-white bg-slate-900/60 border border-amber-900/40'
              }`}
            >
              爆量急湧
            </button>
            <button
              onClick={() => setSelectedFilter('BULLISH_MA_ALIGN')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                selectedFilter === 'BULLISH_MA_ALIGN'
                  ? 'bg-indigo-600 text-white'
                  : 'text-indigo-400 hover:text-white bg-slate-900/60 border border-indigo-900/40'
              }`}
            >
              均線發散
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredSignals.map((sig) => {
            const stock = stocks.find((s) => s.symbol === sig.stockSymbol);
            return (
              <div
                key={sig.id}
                onClick={() => handleStockClick(sig.stockSymbol)}
                className="bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-xl p-4 space-y-3 cursor-pointer transition-all hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{sig.stockName}</span>
                    <span className="text-slate-400 font-mono text-xs">{sig.stockSymbol}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                      {sig.title}
                    </span>
                  </div>
                  <span className="text-slate-500 font-mono text-[10px]">
                    {typeof sig.timestamp === 'number'
                      ? new Date(sig.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : sig.timestamp}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{sig.description}</p>

                <div className="grid grid-cols-3 gap-2 bg-slate-900/80 p-2 rounded-lg border border-slate-800 font-mono text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] block">現價</span>
                    <strong className="text-white text-sm">{stock?.price ?? sig.triggerPrice}</strong>
                  </div>
                  <div>
                    <span className="text-emerald-400 text-[10px] block">防守支撐</span>
                    <strong className="text-emerald-400 text-sm">{sig.supportPrice}</strong>
                  </div>
                  <div>
                    <span className="text-rose-400 text-[10px] block">上方壓力</span>
                    <strong className="text-rose-400 text-sm">{sig.resistancePrice}</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
