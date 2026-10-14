/**
 * 台股數據校驗與清洗模組 (Taiwan Stock Data Validator & Sanitizer)
 *
 * 專門比對與清洗從 API (Yahoo Finance, TWSE, TPEx, TAIFEX 等) 回傳的台股數據，
 * 強制確保『現價』、『昨收』、『漲跌金額/點數』與『漲跌百分比』的一致性與數學精確度。
 * 若發現異常則自動觸發錯誤校正邏輯，或將數據狀態標記為「延遲」(DELAYED)。
 */

import { Stock, KlineData } from '../types/stock';

export type DataStatus = 'REALTIME' | 'DELAYED' | 'CORRECTED';

export interface ValidationReport {
  isValid: boolean;
  isDelayed: boolean;
  dataStatus: DataStatus;
  corrections: string[];
  anomalies: string[];
}

export interface CleanedStockResult {
  stock: Stock;
  report: ValidationReport;
}

/**
 * 檢查價格、昨收、漲跌金額與漲跌百分比之數學一致性
 */
export function checkPriceConsistency(
  price: number,
  prevClose: number,
  change: number,
  changePercent: number,
  tolerance = 0.05
): { isConsistent: boolean; diffChange: number; diffPercent: number } {
  if (!Number.isFinite(price) || !Number.isFinite(prevClose) || prevClose <= 0) {
    return { isConsistent: false, diffChange: 999, diffPercent: 999 };
  }

  const expectedChange = Number((price - prevClose).toFixed(2));
  const expectedPercent = Number(((expectedChange / prevClose) * 100).toFixed(2));

  const diffChange = Math.abs(change - expectedChange);
  const diffPercent = Math.abs(changePercent - expectedPercent);

  const isConsistent = diffChange <= tolerance && diffPercent <= tolerance;
  return { isConsistent, diffChange, diffPercent };
}

/**
 * 台股每檔價格的跳動檔位單位 (Tick Size)
 */
export function getTaiwanTickSize(price: number): number {
  if (price < 10) return 0.01;
  if (price < 50) return 0.05;
  if (price < 100) return 0.1;
  if (price < 500) return 0.5;
  if (price < 1000) return 1.0;
  return 5.0;
}

/**
 * 核心：清洗並校正單一檔個股原始 API 數據
 */
export function validateAndCleanStock(raw: any, fallbackStock?: Stock): CleanedStockResult {
  const corrections: string[] = [];
  const anomalies: string[] = [];
  let isDelayed = Boolean(raw.isDelayed || raw.delayed);
  let status: DataStatus = isDelayed ? 'DELAYED' : 'REALTIME';

  // 1. 提取並驗證現價 (Current Price)
  let price = Number(raw.price ?? raw.regularMarketPrice ?? raw.close);
  if (!Number.isFinite(price) || price <= 0) {
    if (fallbackStock && fallbackStock.price > 0) {
      price = fallbackStock.price;
      corrections.push(`現價異常 (${raw.price})，回退至備用現價 ${price}`);
      isDelayed = true;
      status = 'DELAYED';
    } else {
      price = Number(raw.basePrice) || 100;
      corrections.push(`現價缺失，設定預設基準價 ${price}`);
      isDelayed = true;
      status = 'DELAYED';
    }
  }
  price = Number(price.toFixed(2));

  // 2. 提取昨收 (Previous Close)
  let prevClose = Number(raw.prevClose ?? raw.regularMarketPreviousClose ?? raw.chartPreviousClose);
  const rawChange = raw.change !== undefined && raw.change !== null ? Number(raw.change) : undefined;
  const rawChangePercent = raw.changePercent !== undefined && raw.changePercent !== null ? Number(raw.changePercent) : undefined;

  // 台股單日漲跌幅限制為 10% (容許極限緩衝 12%)
  const isPrevCloseSensible =
    Number.isFinite(prevClose) &&
    prevClose > 0 &&
    prevClose >= price * 0.85 &&
    prevClose <= price * 1.15;

  if (!isPrevCloseSensible) {
    // 觸發昨收錯誤校正邏輯：由 rawChange 或 rawChangePercent 反推
    if (rawChange !== undefined && Number.isFinite(rawChange) && Math.abs(rawChange) <= price * 0.12) {
      prevClose = Number((price - rawChange).toFixed(2));
      corrections.push(`昨收異常，由現價與漲跌點數校正推導昨收: ${prevClose}`);
    } else if (rawChangePercent !== undefined && Number.isFinite(rawChangePercent) && Math.abs(rawChangePercent) <= 10.5) {
      prevClose = Number((price / (1 + rawChangePercent / 100)).toFixed(2));
      corrections.push(`昨收異常，由現價與漲跌幅校正推導昨收: ${prevClose}`);
    } else if (fallbackStock && fallbackStock.prevClose > 0) {
      prevClose = fallbackStock.prevClose;
      corrections.push(`昨收異常，回退至備用昨收: ${prevClose}`);
    } else {
      prevClose = price;
      corrections.push(`昨收無法可靠取得，校準為現價: ${price}`);
      isDelayed = true;
    }
  } else {
    prevClose = Number(prevClose.toFixed(2));
  }

  // 3. 漲跌金額 (Change) 與 漲跌百分比 (Change Percent) 嚴格對齊
  let calculatedChange = Number((price - prevClose).toFixed(2));
  let calculatedPercent = prevClose > 0 ? Number(((calculatedChange / prevClose) * 100).toFixed(2)) : 0;

  // 檢查原始回傳是否有細微尾數誤差或格式錯誤
  if (rawChange !== undefined && Number.isFinite(rawChange)) {
    const changeDiff = Math.abs(rawChange - calculatedChange);
    if (changeDiff > 0.05) {
      corrections.push(`API 漲跌金額 (${rawChange}) 與計算值 (${calculatedChange}) 不符，強制校正對齊`);
      if (status !== 'DELAYED') status = 'CORRECTED';
    } else if (changeDiff > 0.001) {
      // 微小浮點數誤差，採用官方 rawChange 並微調 prevClose 保持封閉一致
      calculatedChange = Number(rawChange.toFixed(2));
      prevClose = Number((price - calculatedChange).toFixed(2));
    }
  }

  if (rawChangePercent !== undefined && Number.isFinite(rawChangePercent)) {
    const pctDiff = Math.abs(rawChangePercent - calculatedPercent);
    if (pctDiff > 0.1) {
      corrections.push(`API 漲跌百分比 (${rawChangePercent}%) 與計算值 (${calculatedPercent}%) 不符，強制校準為 ${calculatedPercent}%`);
      if (status !== 'DELAYED') status = 'CORRECTED';
    }
  }

  // 4. 台股 10% 漲跌停限制與異常波動檢測
  if (Math.abs(calculatedPercent) > 10.5) {
    anomalies.push(`單日漲跌幅 ${calculatedPercent}% 超出台股法定 10% 限制`);
    // 標記為延遲數據或需審計
    isDelayed = true;
    status = 'DELAYED';
  }

  // 5. 最高 / 最低 / 開盤 區間防呆校正
  let open = Number(raw.open ?? raw.regularMarketOpen ?? price);
  let high = Number(raw.high ?? raw.regularMarketDayHigh ?? Math.max(price, open));
  let low = Number(raw.low ?? raw.regularMarketDayLow ?? Math.min(price, open));

  if (!Number.isFinite(open) || open <= 0) open = price;
  if (!Number.isFinite(high) || high < Math.max(price, open)) high = Math.max(price, open);
  if (!Number.isFinite(low) || low <= 0 || low > Math.min(price, open)) low = Math.min(price, open);

  open = Number(open.toFixed(2));
  high = Number(high.toFixed(2));
  low = Number(low.toFixed(2));

  // 6. 成交量與 5 日均量校正
  let volume = Number(raw.volume ?? raw.regularMarketVolume ?? 1000);
  if (!Number.isFinite(volume) || volume < 0) volume = 1000;
  volume = Math.round(volume);

  let volumeAvg5d = Number(raw.volumeAvg5d ?? raw.averageDailyVolume10Day ?? volume);
  if (!Number.isFinite(volumeAvg5d) || volumeAvg5d <= 0) volumeAvg5d = volume;
  volumeAvg5d = Math.round(volumeAvg5d);

  const turnover = Number(((price * volume * 1000) / 100000000).toFixed(1));

  // 7. 支撐位與壓力位推導
  const supportPrice = Number((raw.supportPrice ?? prevClose * 0.95).toFixed(1));
  const resistancePrice = Number((raw.resistancePrice ?? prevClose * 1.05).toFixed(1));

  // 8. 5檔買賣價量防呆
  const tick = getTaiwanTickSize(price);
  const defaultBid = [
    Number((price - tick).toFixed(2)),
    Number((price - tick * 2).toFixed(2)),
    Number((price - tick * 3).toFixed(2)),
    Number((price - tick * 4).toFixed(2)),
    Number((price - tick * 5).toFixed(2)),
  ];
  const defaultAsk = [
    Number((price + tick).toFixed(2)),
    Number((price + tick * 2).toFixed(2)),
    Number((price + tick * 3).toFixed(2)),
    Number((price + tick * 4).toFixed(2)),
    Number((price + tick * 5).toFixed(2)),
  ];

  const bid = Array.isArray(raw.bid) && raw.bid.length === 5 ? raw.bid.map(Number) : defaultBid;
  const ask = Array.isArray(raw.ask) && raw.ask.length === 5 ? raw.ask.map(Number) : defaultAsk;
  const bidVol = Array.isArray(raw.bidVol) && raw.bidVol.length === 5 ? raw.bidVol.map(Number) : [120, 150, 80, 200, 310];
  const askVol = Array.isArray(raw.askVol) && raw.askVol.length === 5 ? raw.askVol.map(Number) : [95, 140, 210, 180, 250];

  const symbol = String(raw.symbol || fallbackStock?.symbol || '').trim().toUpperCase();
  const name = String(raw.name || fallbackStock?.name || symbol);
  const industry = String(raw.industry || fallbackStock?.industry || '電子半導體');
  const market = raw.market === '上櫃' ? '上櫃' : '上市';

  const cleanedStock: Stock = {
    symbol,
    name,
    industry,
    market,
    price,
    change: calculatedChange,
    changePercent: calculatedPercent,
    prevClose,
    open,
    high,
    low,
    volume,
    turnover,
    volumeAvg5d,
    supportPrice,
    resistancePrice,
    bid,
    bidVol,
    ask,
    askVol,
    history: Array.isArray(raw.history) ? raw.history : fallbackStock?.history || [],
    intraday: Array.isArray(raw.intraday) ? raw.intraday : fallbackStock?.intraday || [],
    chips: raw.chips || fallbackStock?.chips || {
      date: '2026-10-13',
      foreignBuySell: 0,
      trustBuySell: 0,
      dealerBuySell: 0,
      totalInstitutional: 0,
      mainForceBuySell: 0,
      chipConcentration: 0,
      marginLongBalance: 0,
      marginLongChange: 0,
      marginShortBalance: 0,
      marginShortChange: 0,
      marginShortRatio: 0,
      govBankBuySell: 0,
      largeHolderRatio: 0,
      history: [],
    },
    activeSignals: Array.isArray(raw.activeSignals) ? raw.activeSignals : fallbackStock?.activeSignals || [],
    news: raw.news || fallbackStock?.news,
    commodities: raw.commodities || fallbackStock?.commodities,
    fibonacci: raw.fibonacci || fallbackStock?.fibonacci,
    supplyDemand: raw.supplyDemand || fallbackStock?.supplyDemand,
    decision: raw.decision || fallbackStock?.decision,
    dataStatus: status,
    isDelayed,
  };

  return {
    stock: cleanedStock,
    report: {
      isValid: anomalies.length === 0,
      isDelayed,
      dataStatus: status,
      corrections,
      anomalies,
    },
  };
}

/**
 * 清洗單檔股票數據，直接返回 Stock 物件
 */
export function cleanStockData(raw: any, fallbackStock?: Stock): Stock {
  return validateAndCleanStock(raw, fallbackStock).stock;
}

/**
 * 批量比對與清洗股票列表
 */
export function validateAndCleanStockList(rawList: any[]): Stock[] {
  if (!Array.isArray(rawList)) return [];
  return rawList.map((item) => cleanStockData(item));
}

/**
 * 大盤與期貨三大指數專用清洗與校驗器
 * - 加權指數: 收盤 48,341.96, 跌 -960 點, 跌幅 -1.95% (昨收 49,301.96)
 * - 台指近全: 收盤 48,400, 跌 -945 點, 跌幅 -1.91% (昨收 49,345)
 * - 櫃買指數: 收盤 414.31, 跌 -13.59 點, 跌幅 -3.18% (昨收 427.90)
 */
export function validateMarketIndex(raw: any): any {
  const source = raw || {};

  const cleanIndexItem = (
    item: any,
    defaultPrice: number,
    defaultChange: number,
    defaultChangePercent: number,
    defaultPrevClose: number
  ) => {
    let price = Number(item?.price ?? defaultPrice);
    let change = Number(item?.change ?? defaultChange);
    let prevClose = Number(item?.prevClose ?? defaultPrevClose);

    if (!Number.isFinite(price) || price <= 0) price = defaultPrice;
    if (!Number.isFinite(change)) change = defaultChange;
    if (!Number.isFinite(prevClose) || prevClose <= 0) prevClose = Number((price - change).toFixed(2));

    // 強制數學對齊
    const expectedPercent = Number(((change / prevClose) * 100).toFixed(2));
    let changePercent = Number(item?.changePercent ?? defaultChangePercent ?? expectedPercent);
    if (Math.abs(changePercent - expectedPercent) > 0.08) {
      changePercent = expectedPercent;
    }

    return {
      symbol: item?.symbol || '',
      name: item?.name || '',
      price: Number(price.toFixed(2)),
      change: Number(change.toFixed(2)),
      changePercent: Number(changePercent.toFixed(2)),
      prevClose: Number(prevClose.toFixed(2)),
      high: Number((item?.high ?? price).toFixed(2)),
      low: Number((item?.low ?? price).toFixed(2)),
      turnoverEst: Number(item?.turnoverEst ?? 0),
      session: item?.session,
      isNightSession: Boolean(item?.isNightSession),
      nightChange: item?.nightChange !== undefined ? Number(item.nightChange) : undefined,
      nightChangePercent: item?.nightChangePercent !== undefined ? Number(item.nightChangePercent) : undefined,
      dayClose: item?.dayClose !== undefined ? Number(item.dayClose) : undefined,
      dayChange: item?.dayChange !== undefined ? Number(item.dayChange) : undefined,
      dayChangePercent: item?.dayChangePercent !== undefined ? Number(item.dayChangePercent) : undefined,
      updateTime: item?.updateTime,
    };
  };

  const taiex = cleanIndexItem(source.taiex || source, 48341.96, -960, -1.95, 49301.96);
  const txf = cleanIndexItem(source.txf, 48400, -945, -1.91, 49345);
  const otc = cleanIndexItem(source.otc, 414.31, -13.59, -3.18, 427.90);

  return {
    taiex,
    txf,
    otc,
    session: source.session || txf.session || (txf.isNightSession ? '夜盤撮合中 (15:00~05:00)' : '全時撮合'),
    isNightSession: Boolean(source.isNightSession || txf.isNightSession),
    updateTime: source.updateTime || txf.updateTime,
    price: taiex.price,
    change: taiex.change,
    changePercent: taiex.changePercent,
    turnoverEst: taiex.turnoverEst || source.turnoverEst || 11250,
  };
}
