export interface MarketIndexItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  prevClose: number;
  high?: number;
  low?: number;
  volume?: number; // 億元
  updateTime: string;
}

export interface USMarketItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  prevClose: number;
}

export interface MorningReport {
  sentiment: 'BULLISH' | 'NEUTRAL' | 'BEARISH';
  sentimentLabel: string;
  summary: string;
  suggestedPositionPct: number; // 建議持股水位 %
  tacticalAdvice: string[];
  keyFactors: {
    soxChangePct: number;
    tsmChangePct: number;
    wtxChangePct: number;
    dowChangePct: number;
    nasdaqChangePct: number;
  };
}

export interface MarketOverviewResponse {
  taiex: MarketIndexItem | null;
  tpex: MarketIndexItem | null;
  wtx: MarketIndexItem | null;
  usIndices: {
    dow: USMarketItem | null;
    nasdaq: USMarketItem | null;
    sox: USMarketItem | null;
    tsm: USMarketItem | null;
  };
  morningReport: MorningReport | null;
  timestamp: string;
}

export interface ScreenerStockItem {
  symbol: string;
  name: string;
  industry: string;
  market: '上市' | '上櫃';
  price: number;
  change: number;
  changePercent: number;
  prevClose: number;
  volume: number; // 當日成交量 (張)
  volumeAvg5d: number; // 5日均量 (張)
  volumeRatio: number; // 量能倍數 (volume / volumeAvg5d)
  ma5: number;
  ma10: number;
  ma20: number;
  bias20ma: number; // 偏離 20MA 乖離率 %
  weeklyLow: number; // 當周最低價
  isBullishMa: boolean; // 5MA > 10MA > 20MA && price >= 20MA
  isVolumeExpanding: boolean; // volume >= volumeAvg5d * 1.2
  isTrustAccumulating: boolean; // consecutiveTrustDays >= 2
  isOverheated: boolean; // bias20ma > 10%
  isMajorLocked: boolean; // foreignNet > 0 && trustNet > 0
  consecutiveTrustDays: number; // 投信連續買超天數
  foreignNetLots: number; // 外資今日買賣超 (張)
  trustNetLots: number; // 投信今日買賣超 (張)
  dealerNetLots: number; // 自營商今日買賣超 (張)
  // 波段交易策略錨定
  isMatched: boolean; // 完全符合講義條件
  suggestedEntryPrice: number;
  stopLossPrice: number;
  targetPrice: number;
  riskRewardRatio: number;
  actionNote: string;
}

export interface ScreenerResponse {
  cachedAt: string;
  cacheExpiresInSeconds: number;
  totalScanned: number;
  totalMatched: number;
  screenerList: ScreenerStockItem[];
  allStocks: ScreenerStockItem[];
}

export interface TurnaroundStockItem {
  symbol: string;
  name: string;
  industry: string;
  market: '上市' | '上櫃';
  price: number;
  change: number;
  changePercent: number;
  prevClose: number;
  yearLow: number;
  yearHigh: number;
  positionPct: number; // 位階百分比 (例如 18.0)
  positionLabel: string; // 例如: "處於近一年 18% 低檔區"
  latestRevenueMonth: number;
  revenueYoY: number; // 最新月營收年增率 %
  eps4Q: number; // 近四季累計 EPS
  isProfitable: boolean; // eps4Q > 0
  isRevGrowing: boolean; // revenueYoY >= 5%
  isLowBase: boolean; // positionPct <= 35%
  isSafeBottom: boolean; // 近 20 天未破新低，均線打底
  isTurnaroundMatched: boolean; // 同時符合四大條件
  catalyst: string; // 轉型爆發題材說明
  stopLossPrice: number; // 建議防守價 (跌破年最低點出場)
  actionNote: string;
}

export interface TurnaroundScreenerResponse {
  cachedAt: string;
  cacheExpiresInSeconds: number;
  totalScanned: number;
  totalMatched: number;
  screenerList: TurnaroundStockItem[];
  allStocks: TurnaroundStockItem[];
}

export interface MorningBriefingResponse {
  markdown: string;
  generatedAt: string;
  model: string;
  cachedAt: string;
  expiresInSeconds: number;
}

export interface PortfolioStockItem {
  id: string;
  symbol: string;
  name: string;
  entryPrice: number;
  sharesLots: number; // 張數 (1張 = 1000股)
  stopLossPrice: number;
  targetPrice: number;
  entryDate: string;
  notes?: string;
  strategyType?: 'momentum' | 'turnaround';
  // Dynamic computed fields based on current market price
  currentPrice?: number;
  unrealizedPL?: number; // 損益金額 (TWD)
  returnPct?: number; // 報酬率 %
  isStopLossTriggered?: boolean;
  isTargetTriggered?: boolean;
}

export interface KlineData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ma5?: number;
  ma10?: number;
  ma20?: number;
  ma60?: number;
  bbUpper?: number;
  bbMiddle?: number;
  bbLower?: number;
}

export interface FibonacciLevel {
  level: number;
  price: number;
  label: string;
}

export interface SupplyDemandZone {
  type: 'supply' | 'demand';
  high: number;
  low: number;
  label: string;
}

export interface DecisionSignal {
  type: 'BUY' | 'SELL' | 'HOLD';
  title: string;
  description: string;
}

export interface DecisionVerdict {
  action: 'BUY' | 'SELL' | 'HOLD';
  score: number;
  reasons: string[];
}

export interface EntryTimingEvaluation {
  score: number;
  suitability: EntryTimingSuitability;
  reasons: string[];
}

export type EntryTimingSuitability = 'EXCELLENT' | 'GOOD' | 'NEUTRAL' | 'POOR' | 'AVOID';

export interface DailyChips {
  date: string;
  foreignNetLots: number;
  trustNetLots: number;
  dealerNetLots: number;
}
