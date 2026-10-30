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
  foreignNetLots: number | null; // 外資今日買賣超 (張，無數據時為 null，嚴禁偽造為 0)
  trustNetLots: number; // 投信今日買賣超 (張)
  dealerNetLots: number | null; // 自營商今日買賣超 (張，無數據時為 null，嚴禁偽造為 0)
  // 波段交易策略錨定
  isMatched: boolean; // 完全符合條件
  isIntradaySignal?: boolean; // 🟢 盤中即時進場訊號
  isVerifiedByTrust?: boolean; // 🔵 盤後投信確認大買
  estVolume?: number; // 盤中預估全天成交量 (張)
  estVolumeRatio?: number; // 預估成交量比 (estVolume / volumeAvg5d)
  atr20?: number; // 20日平均真實波動度
  atrPct?: number; // 20日 ATR 波動度百分比 %
  industryTheme?: string; // 聚焦產業白名單主題
  isPriorityWhiteList?: boolean; // 符合優先聚焦產業白名單
  suggestedEntryPrice: number;
  stopLossPrice: number;
  targetPrice: number;
  riskRewardRatio: number;
  actionNote: string;
  updateTime?: string; // 即時撮合時間
}

export type ScreenerMode = 'intraday' | 'after_hours';

export interface ScreenerResponse {
  cachedAt: string;
  cacheExpiresInSeconds: number;
  totalScanned: number;
  totalMatched: number;
  screenerList: ScreenerStockItem[];
  allStocks: ScreenerStockItem[];
  mode: ScreenerMode;
  modeLabel: string;
  isMarketOpen: boolean;
  marketStatusText: string;
  lastUpdated?: string;
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
  volume?: number; // 即時累計成交張數
  updateTime?: string; // 即時撮合時間
  yearLow: number;
  yearHigh: number;
  positionPct: number; // 位階百分比 (例如 18.0)
  positionLabel: string; // 例如: "處於近一年 18% 低檔區"
  latestRevenueMonth: number;
  revenueYoY: number; // 最新月營收年增率 %
  eps4Q: number | null; // 近四季累計 EPS
  isProfitable: boolean; // eps4Q > 0
  isRevGrowing: boolean; // revenueYoY >= 5%
  isLowBase: boolean; // positionPct <= 35%
  isSafeBottom: boolean; // 近 20 天未破新低，均線打底
  isTurnaroundMatched: boolean; // 同時符合四大條件
  catalyst: string; // 轉型爆發題材說明
  stopLossPrice: number; // 建議防守價 (跌破年最低點出場)
  actionNote: string;
  atr20?: number; // 20日平均真實波動度
  atrPct?: number; // 20日 ATR 波動度百分比 % (必須 >= 1.8%)
  volumeAvg5d?: number; // 5日平均成交量 (必須 > 1,000張)
  industryTheme?: string; // 聚焦產業白名單主題
  isPriorityWhiteList?: boolean; // 符合優先聚焦產業白名單
}

export interface TurnaroundScreenerResponse {
  cachedAt: string;
  cacheExpiresInSeconds: number;
  totalScanned: number;
  totalMatched: number;
  screenerList: TurnaroundStockItem[];
  allStocks: TurnaroundStockItem[];
  lastUpdated?: string;
  isRealtime?: boolean;
  mode?: ScreenerMode;
  modeLabel?: string;
  isMarketOpen?: boolean;
  marketStatusText?: string;
}

export interface MorningBriefingResponse {
  isGenerated?: boolean;
  date?: string;
  markdown?: string;
  generatedAt?: string;
  model?: string;
  cachedAt?: string;
  expiresInSeconds?: number;
  dailyDate?: string;
  isDailyCached?: boolean;
  status?: 'COMPLETED' | 'PENDING';
  statusMessage?: string;
  isPast830?: boolean;
  source?: string;
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
  change?: number;
  changePercent?: number;
  updateTime?: string;
  unrealizedPL?: number; // 毛損益金額 (TWD)
  returnPct?: number; // 毛報酬率 %
  feeDiscount?: number; // 手續費折數 (例如 60 代表 6 折，預設 60；100 代表無折扣原價)
  feeCostTotal?: number; // 預估總交易成本 (買進手續費 + 賣出手續費 + 0.3% 證交稅)
  netPL?: number; // 實拿淨損益 = 毛損益 - feeCostTotal
  netReturnPct?: number; // 淨報酬率 %
  isStopLossTriggered?: boolean;
  isTargetTriggered?: boolean;
  // Health Evaluation Details
  ma5?: number;
  ma10?: number;
  ma20?: number;
  trustNetBuyDays?: number;
  trustNetBuyLots?: number;
  decisionRating?: 'BUY' | 'HOLD' | 'TRIM' | 'SELL' | 'SHAKEOUT_HOLD' | 'CONFIRMED_STOP_LOSS';
  healthAlerts?: WatchlistAlertDetail[];
  diagnosticNote?: string;
  volumeLots?: number;
  volumeAvg5d?: number;
  foreignNetLots?: number;
  marginChangeLots?: number;
}

export interface WatchlistAlertDetail {
  type: 'STOP_LOSS' | 'RATING_BEARISH' | 'MA_BEARISH' | 'TRUST_SELLING' | 'SHAKEOUT_HOLD' | 'CONFIRMED_STOP_LOSS';
  title: string;
  description: string;
  severity: 'danger' | 'warning' | 'info' | 'success' | 'shakeout';
}

export interface WatchlistStockDiagnostic {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  ma5: number;
  ma10: number;
  ma20: number;
  volumeLots: number;
  volumeAvg5d: number;
  volumeRatio: number;
  trustNetLots: number;
  foreignNetLots: number;
  marginChangeLots: number;
  isBrokenMa20: boolean;
  dropBelowMa20Pct: number;
  decisionRating: 'BUY' | 'HOLD' | 'TRIM' | 'SELL' | 'SHAKEOUT_HOLD' | 'CONFIRMED_STOP_LOSS';
  diagnosticTitle: string;
  diagnosticNote: string;
  severity: 'danger' | 'warning' | 'info' | 'success';
}

export interface WatchlistBriefingResponse {
  isGenerated: boolean;
  date: string;
  markdown?: string;
  model?: string;
  generatedAt?: string;
  cachedAt?: string;
  diagnostics?: Record<string, WatchlistStockDiagnostic>;
  status?: 'COMPLETED' | 'NO_STOCKS' | 'PENDING';
  statusMessage?: string;
  isPast2130?: boolean;
  message?: string;
  source?: string;
}

export interface BrokerTradeItem {
  name: string;
  buyLots: number;
  sellLots: number;
  netLots: number;
  totalLots: number;
  buyAmount: number;
  sellAmount: number;
  netAmount: number; // 買賣超金額 (正為買超，負為賣超)
  totalAmount: number;
  netAmountFormatted: string; // e.g. "+19.41 億元" or "-47.24 億元"
  totalAmountFormatted: string;
  action: 'BUY' | 'SELL' | 'NEUTRAL';
  volumeRatioPct?: number; // 佔個股成交量比重 %
}

export interface BrokerTradingSummary {
  symbol: string;
  majorBuyLots: number;
  majorSellLots: number;
  majorNetLots: number;
  majorNetAmount: number;
  majorNetAmountFormatted: string;
  volumeRate: number; // 買賣超佔成交量 %
  topBrokersByVolume: BrokerTradeItem[]; // 最近 5 日成交量最大的前 5 家券商買賣超金額
  topBuyBrokers: BrokerTradeItem[];
  topSellBrokers: BrokerTradeItem[];
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  sentimentLabel: string;
  analysis: string;
  updatedAt: string;
}

export interface StockDetailResponse {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  prevClose: number;
  volume: number;
  updateTime: string;
  industry?: string;
  industryTheme?: string;
  isPriorityWhiteList?: boolean;
  ma5?: number;
  ma10?: number;
  ma20?: number;
  bias20ma?: number;
  stopLossPrice?: number;
  atr20?: number;
  atrPct?: number;
  prices?: any[];
  chips?: any[];
  brokerTrading?: BrokerTradingSummary | null;
}

export interface NotificationItem {
  id: string;
  stockSymbol: string;
  stockName: string;
  type: 'danger' | 'warning' | 'info' | 'success' | 'shakeout';
  title: string;
  message: string;
  alertType: 'STOP_LOSS' | 'RATING_BEARISH' | 'MA_BEARISH' | 'TRUST_SELLING' | 'SHAKEOUT_HOLD' | 'CONFIRMED_STOP_LOSS' | 'GENERAL';
  timestamp: string;
  isRead: boolean;
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

// ---------------------------------------------------------------------------
// 操盤手資金管理與歷史平倉交易日記 (Trade Diary)
// ---------------------------------------------------------------------------
export interface TradeRecordItem {
  id: string;
  symbol: string;
  name: string;
  strategyType?: string; // 'momentum' | 'turnaround' | 'custom'
  entryPrice: number;
  exitPrice: number;
  sharesLots: number; // 張數 (1張 = 1000股)
  entryDate: string; // YYYY-MM-DD
  exitDate: string; // YYYY-MM-DD
  exitType: 'TAKE_PROFIT' | 'STOP_LOSS' | 'MANUAL';
  realizedPL: number; // 已實現損益 (TWD)
  returnPct: number; // 報酬率 %
  holdingDays: number;
  feeDiscount?: number; // 券商手續費折數 % (例如 60 代表 6 折)
  feeCostTotal?: number; // 交易稅費總額 (買賣手續費低消20 + 0.3%證交稅)
  netPL?: number; // 實拿淨已實現損益 (扣除稅費)
  netReturnPct?: number; // 實拿淨報酬率 %
  notes?: string;
}

export interface UserSettings {
  initialCapital: number;
}

export interface UserPortfolioResponse {
  initialCapital: number;
  portfolio: PortfolioStockItem[];
  tradeHistory: TradeRecordItem[];
  syncStatus?: {
    connected: boolean;
    provider: 'supabase' | 'local_store';
    message: string;
  };
}

// ---------------------------------------------------------------------------
// 個股量化策略健檢 (Stock Strategy Audit)
// ---------------------------------------------------------------------------
export interface StrategyCheckItem {
  name: string;
  target: string;
  actual: string;
  passed: boolean;
  note?: string;
}

export interface StrategyAuditResponse {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  prevClose: number;
  volume: number; // 當日即時張數
  volumeAvg5d: number; // 5日均量
  volumeRatio: number; // 量能倍數
  ma5: number;
  ma10: number;
  ma20: number;
  bias20ma: number; // 20MA乖離率 %
  atr20: number;
  atrPct: number;
  industry: string;
  industryTheme: string;
  isPriorityWhiteList: boolean;
  updateTime: string;
  // 1. 強勢動能突破策略
  momentum: {
    isMatched: boolean;
    verdict: string;
    checks: StrategyCheckItem[];
    trustNetLots10d: number;
    isBullishMa: boolean;
    isVolumeExpanding: boolean;
    isBiasSafe: boolean;
  };
  // 2. 低基期價值轉型策略
  turnaround: {
    isMatched: boolean;
    verdict: string;
    checks: StrategyCheckItem[];
    positionPct: number;
    yearHigh: number;
    yearLow: number;
    isLowBase: boolean;
    isSafeBottom: boolean;
    revenueYoY: number;
    eps4Q: number | null;
    isProfitable: boolean;
    isRevGrowing: boolean;
  };
  // 3. 籌碼屬性定調
  chipsAttribute: {
    badge: string; // e.g. "💎 投信波段認養股"
    badgeColor: 'emerald' | 'amber' | 'rose' | 'slate';
    description: string;
    trustNetLotsToday: number;
    foreignNetLotsToday: number;
    marginChangeLotsToday: number;
    majorConcentration5dPct?: number;
    topBuyBroker?: string;
  };
  timestamp: string;
}

