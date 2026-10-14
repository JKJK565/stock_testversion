export interface KlineData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number; // 張數
  ma5?: number;
  ma10?: number;
  ma20?: number;
  ma60?: number;
  ma72?: number; // 講義中期均線 72MA
  ma200?: number; // 講義長期均線 200MA
  bias20?: number; // 20日乖離率 %
  bias5?: number; // 5日乖離率 %
  bbUpper?: number;
  bbMiddle?: number;
  bbLower?: number;
  k?: number;
  d?: number;
  dif?: number;
  macd?: number;
  osc?: number;
  rsi6?: number;
  rsi12?: number;
}

export interface IntradayPoint {
  time: string; // HH:mm
  price: number;
  avgPrice: number;
  volume: number; // 單盤成交量
  accumVolume: number;
}

export interface ChipHistoryItem {
  date: string;
  foreignBuySell: number; // 外資 (張)
  trustBuySell: number; // 投信 (張)
  dealerBuySell: number; // 自營商 (張)
  mainForceBuySell: number; // 主力 (張)
  marginLongChange: number; // 融資增減 (張)
  marginShortChange: number; // 融券增減 (張)
}

export interface DailyChips {
  date: string;
  foreignBuySell: number;
  trustBuySell: number;
  dealerBuySell: number;
  totalInstitutional: number;
  mainForceBuySell: number;
  chipConcentration: number; // %
  marginLongBalance: number; // 融資餘額 (張)
  marginLongChange: number; // 融資增減 (張)
  marginShortBalance: number; // 融券餘額 (張)
  marginShortChange: number; // 融券增減 (張)
  marginShortRatio: number; // 券資比 %
  govBankBuySell: number; // 八大官股買賣超 (張)
  largeHolderRatio: number; // 千張大戶持股比例 %
  foreignShareRatio?: number; // 外資持股比例 %
  history: ChipHistoryItem[];
  brokerAlerts?: { broker: string; action: 'buy' | 'sell'; volume: number; note: string }[]; // 隔日沖大戶追蹤
}

export interface StockNewsItem {
  id: string;
  title: string;
  source: string;
  time: string;
  summary: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  impact: 'high' | 'medium' | 'low';
  category: '重大訊息' | '財報營收' | '法說會' | '產業題材' | '籌碼變動';
}

export interface CommodityRelation {
  name: string; // 例如: 銅、矽晶圓、原油、BPU伺服器晶片
  relationType: '原料成本' | '產品報價' | '終端需求' | '運價指數';
  price: string;
  change: string;
  impactDescription: string;
  trend: 'up' | 'down' | 'stable';
}

export interface FibonacciLevel {
  ratio: number;
  label: string; // 0%, 23.6%, 38.2%, 50%, 61.8%, 78.6%, 100%
  price: number;
  isKeyReversal?: boolean;
}

export interface SupplyDemandZone {
  type: 'supply' | 'demand'; // 供給區間 (賣壓/壓力) vs 需求區間 (買盤/支撐)
  high: number;
  low: number;
  testedCount: number;
  strength: 'strong' | 'medium';
}

export type DecisionVerdict = 'STRONG_BUY' | 'BUY' | 'WATCH' | 'TRIM' | 'SELL';

export type EntryTimingSuitability =
  | 'DO_NOT_CHASE' // 🚨 短線過熱・嚴禁追高 (連續急漲/漲停、短線乖離過大、隔日沖主力進駐)
  | 'WAIT_PULLBACK' // ⏳ 乖離偏大・靜待拉回 (多頭格局強，但建議等待拉回支撐再進)
  | 'SUITABLE_NOW' // 💎 回踩支撐・適宜進場 (回踩5MA/20MA守穩，或剛突破頸線，盈虧比極佳)
  | 'BREAKOUT_EARLY' // 🚀 起漲初升・可直接切入 (均線剛發散、乖離小於3%，起漲第一根)
  | 'AVOID_WEAK'; // 🛑 破線弱勢・不宜買進 (均線破位、主力出貨)

export interface EntryTimingEvaluation {
  suitability: EntryTimingSuitability;
  label: string; // e.g. "短線過熱・切勿追高 (隔日沖倒貨風險極高)"
  badgeColor: 'rose' | 'amber' | 'emerald' | 'blue' | 'purple';
  bias5ma: number; // 偏離 5MA 乖離率 %
  bias20ma: number; // 偏離 20MA 乖離率 %
  consecutiveLimitUps: number; // 近期連續大漲/漲停天數
  overnightDumpingRisk: 'HIGH' | 'MEDIUM' | 'LOW'; // 隔日沖大戶次日開盤倒貨風險
  idealBuyZone: {
    min: number;
    max: number;
    description: string;
  };
  timingAdvice: string; // 實戰進場叮嚀與防守建議
}

export interface DecisionSignal {
  verdict: DecisionVerdict; // 【評定一】講義策略總體評定
  score: number; // 0 - 100
  reason: string;
  entryPrice: number;
  stopLossPrice: number; // 講義停損點：當周低點或跌破關鍵均線
  targetPrice: number; // 講義目標價：盈虧比至少 1:2
  riskRewardRatio: number; // 盈虧比 (如 2.4)
  rule123Status: 'PASSED' | 'IN_PROGRESS' | 'FAILED'; // 講義 123 法則狀態
  maAlignment: 'BULLISH' | 'BEARISH' | 'SQUEEZE'; // 均線排列
  volumeStatus: 'EXPANDING' | 'DIVERGENCE' | 'NORMAL'; // 價量關係
  supplyDemandStatus: string;
  keyNotes: string[];
  entryTiming: EntryTimingEvaluation; // 【評定二】現階段當下進場時機評定
}

export type SignalType =
  | 'BREAKOUT_RESISTANCE' // 突破壓力位
  | 'BULLISH_MA_ALIGN' // 均線多頭排列
  | 'VOLUME_EXPLOSION' // 成交量爆量 (大於5日均量1.5~4倍)
  | 'KD_GOLDEN_CROSS' // KD 低檔黃金交叉
  | 'MA_SQUEEZE_BREAKOUT' // 均線糾結帶量突破
  | 'CHIP_HEAVY_ACCUMULATION' // 法人與主力連續大買
  | 'RULE_123_BUY' // 講義 123 法則突破買進
  | 'FIBO_GOLDEN_REVERSAL' // 斐波那契 61.8% 反彈支撐
  | 'SUPPLY_ZONE_TOUCH'; // 觸及供給賣壓區

export interface RadarSignal {
  id: string;
  timestamp: number;
  stockSymbol: string;
  stockName: string;
  type: SignalType;
  title: string;
  description: string;
  triggerPrice: number;
  volumeMultiple: number; // 均量倍數
  supportPrice: number; // 支撐位
  resistancePrice: number; // 壓力位
  volume: number; // 當前成交量 (張)
  severity: 'high' | 'medium' | 'info';
  read: boolean;
}

export type AlertCondition =
  | 'PRICE_ABOVE' // 目標價向上突破
  | 'PRICE_BELOW' // 價格跌破停損
  | 'PCT_GAIN_ABOVE' // 當日漲幅超過 %
  | 'PCT_DROP_ABOVE' // 當日跌幅超過 %
  | 'VOLUME_ABOVE'; // 當日成交量突破 (張)

export interface PriceAlert {
  id: string;
  symbol: string;
  stockName: string;
  condition: AlertCondition;
  targetValue: number;
  active: boolean;
  triggered: boolean;
  triggeredAt?: number;
  triggeredPrice?: number;
  createdAt: number;
  note?: string;
}

export interface Stock {
  symbol: string;
  name: string;
  industry: string;
  market: '上市' | '上櫃';
  price: number;
  change: number;
  changePercent: number;
  prevClose: number;
  open: number;
  high: number;
  low: number;
  volume: number; // 張
  turnover: number; // 億元
  volumeAvg5d: number; // 5日均量
  supportPrice: number; // 支撐位
  resistancePrice: number; // 壓力位
  bid: number[]; // 5檔買價
  bidVol: number[]; // 5檔買量
  ask: number[]; // 5檔賣價
  askVol: number[]; // 5檔賣量
  history: KlineData[];
  intraday: IntradayPoint[];
  chips: DailyChips;
  activeSignals: RadarSignal[];
  dataStatus?: 'REALTIME' | 'DELAYED' | 'CORRECTED';
  isDelayed?: boolean;
  news?: StockNewsItem[];
  commodities?: CommodityRelation[];
  fibonacci?: FibonacciLevel[];
  supplyDemand?: SupplyDemandZone[];
  decision?: DecisionSignal;
}

export type StrategyType =
  | 'MA_CROSS' // 5日與20日均線黃金交叉
  | 'VOLUME_BREAKOUT' // 突破前波壓力帶量進場 (講義法)
  | 'RULE_123_REVERSAL' // 講義 裸K 123 法則波段做多
  | 'KD_OVERSOLD' // KD < 25 低檔金叉買進
  | 'BOLLINGER_BREAKOUT' // 布林通道擠壓後帶量衝出上軌
  | 'MOMENTUM_ALIGN'; // 均線多頭排列動能策略 (講義法)

export interface BacktestConfig {
  symbol: string;
  strategy: StrategyType;
  initialCapital: number; // 初始資金 TWD
  positionSizePct: number; // 每次下單資金佔比 % (10% - 100%)
  takeProfitPct: number; // 停利 % (0 = 不設)
  stopLossPct: number; // 停損 % (0 = 不設)
  periodDays: number; // 回測天數 (60, 120, 240)
}

export interface BacktestTrade {
  id: string;
  entryDate: string;
  entryPrice: number;
  exitDate: string;
  exitPrice: number;
  holdingDays: number;
  shares: number; // 股數
  profitAmount: number; // 損益 (TWD)
  returnPct: number; // 報酬率 %
  exitReason: 'TAKE_PROFIT' | 'STOP_LOSS' | 'SIGNAL_EXIT' | 'PERIOD_END';
}

export interface BacktestResult {
  config: BacktestConfig;
  stockName: string;
  stockSymbol: string;
  totalReturnPct: number;
  totalReturnAmount: number;
  benchmarkReturnPct: number;
  winRate: number; // %
  totalTrades: number;
  winTrades: number;
  lossTrades: number;
  profitFactor: number;
  maxDrawdownPct: number;
  sharpeRatio: number;
  avgHoldingDays: number;
  equityCurve: {
    date: string;
    equity: number;
    benchmarkEquity: number;
    price: number;
  }[];
  trades: BacktestTrade[];
}

// 大盤集中市場籌碼與台指期貨多空部位
export interface MarketChipsOverview {
  date: string;
  taiexPrice: number;
  taiexChange: number;
  taiexVolumeTotal: number; // 億元
  // 集中市場三大法人買賣超 (億元)
  foreignBuy: number; // 外資買進 (億)
  foreignSell: number; // 外資賣出 (億)
  foreignNetBuy: number; // 外資買賣超 (億)
  trustBuy: number; // 投信買進 (億)
  trustSell: number; // 投信賣出 (億)
  trustNetBuy: number; // 投信買賣超 (億)
  dealerNetBuy: number; // 自營商買賣超 (億)
  dealerPropNetBuy: number; // 自營商 (自行買賣)
  dealerHedgeNetBuy: number; // 自營商 (避險)
  totalInstitutionalNetBuy: number; // 三大法人集中市場合計買賣超 (億)
  // 信用交易
  marginLongBalanceTotal: number; // 融資餘額 (億元)
  marginLongChangeTotal: number; // 融資增減 (億元)
  marginShortBalanceTotal: number; // 融券張數 (萬張)
  marginShortChangeTotal: number; // 融券增減 (張)
  // 台指期貨 (TX) 三大法人未平倉淨部位
  futures: {
    contractName: string;
    foreignLongOI: number; // 外資多單 (口)
    foreignShortOI: number; // 外資空單 (口)
    foreignNetOI: number; // 外資淨部位 (口)
    foreignNetChange: number; // 今日淨增減 (口)
    trustLongOI: number; // 投信多單 (口)
    trustShortOI: number; // 投信空單 (口)
    trustNetOI: number; // 投信淨部位 (口)
    trustNetChange: number; // 今日淨增減 (口)
    dealerNetOI: number; // 自營商淨部位 (口)
    dealerNetChange: number; // 今日淨增減 (口)
    totalNetOI: number; // 三大法人期貨合計淨部位 (口)
    retailSmallTXRatio: number; // 散戶小台多空比 % (負數代表散戶偏空，正數代表散戶偏多)
    retailMicroTXRatio?: number; // 微台散戶多空比 %
    retailSmallNetOI?: number; // 散戶小台淨未平倉 (口)
    retailSmallNetChange?: number; // 散戶小台增減 (口)
    retailMicroNetOI?: number; // 散戶微台淨未平倉 (口)
    retailMicroNetChange?: number; // 散戶微台增減 (口)
    foreignCallOI?: number; // 外資買權淨未平倉 (口)
    foreignCallChange?: number; // 外資買權增減 (口)
    foreignPutOI?: number; // 外資賣權淨未平倉 (口)
    foreignPutChange?: number; // 外資賣權增減 (口)
    putCallRatio?: number; // 全市場 Put/Call Ratio %
    vixIndex?: number; // VIX 指標
    price?: number;
    change?: number;
    retailSentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    interpretation: string; // 專業法人期貨多空判斷
  };
  settlementStatus?: {
    isAutoSettledFinal: boolean;
    autoSettledTime: string;
    title: string;
    scheduleStages: { time: string; name: string; status: 'COMPLETED' | 'PENDING' }[];
    description: string;
  };
}

// 產業資金流向
export interface SectorFlowItem {
  id: string;
  sectorName: string;
  turnoverPct: number; // 佔大盤成交比重 %
  turnoverPctChange: number; // 較前一日比重增減 %
  flowDirection: 'INFLOW' | 'OUTFLOW' | 'NEUTRAL';
  sectorChangePct: number; // 族群平均漲跌幅 %
  turnoverAmount: number; // 估計成交金額 (億元)
  leadingStocks: {
    symbol: string;
    name: string;
    price: number;
    changePercent: number;
    volume: number;
  }[];
  catalyst: string;
}

// 模擬交易持股部位
export interface PaperPosition {
  id: string;
  symbol: string;
  stockName: string;
  side: 'LONG' | 'SHORT';
  shares: number; // 股數
  entryPrice: number;
  currentPrice: number;
  entryTime: number;
  stopLossPrice?: number;
  takeProfitPrice?: number;
  strategyTag?: string;
  unrealizedProfit: number;
  returnPct: number;
}

// 模擬交易歷史成交平倉明細
export interface PaperTradeRecord {
  id: string;
  symbol: string;
  stockName: string;
  side: 'LONG' | 'SHORT';
  shares: number;
  entryPrice: number;
  exitPrice: number;
  entryTime: number;
  exitTime: number;
  holdingDays: number;
  feeAndTax: number;
  netProfit: number;
  returnPct: number;
  exitReason: 'TAKE_PROFIT' | 'STOP_LOSS' | 'MANUAL_CLOSE' | 'TRAILED_STOP';
  strategyTag?: string;
}

// 模擬交易帳戶模型
export interface PaperAccount {
  initialCapital: number;
  cashBalance: number;
  positions: PaperPosition[];
  history: PaperTradeRecord[];
  totalEquity: number;
  realizedProfit: number;
  unrealizedProfit: number;
  totalProfit: number;
  totalReturnPct: number;
  winRate: number;
  totalTrades: number;
  winTrades: number;
  lossTrades: number;
  profitFactor: number;
}

