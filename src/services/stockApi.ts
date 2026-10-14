import { Stock, KlineData, RadarSignal, MarketChipsOverview, SectorFlowItem } from '../types/stock';
import {
  enrichKlineData,
  calculateFibonacci,
  calculateSupplyDemandZones,
  generateTradeDecision,
} from '../utils/indicators';
import { getStockKnowledge } from '../data/stockKnowledge';
import {
  validateAndCleanStock,
  validateMarketIndex,
  checkPriceConsistency,
  DataStatus,
} from './dataValidator';

export { validateAndCleanStock, validateMarketIndex, checkPriceConsistency };
export type { DataStatus };

export interface IndexItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  prevClose: number;
  high: number;
  low: number;
  turnoverEst: number;
  session?: string;
  isNightSession?: boolean;
  nightChange?: number;
  nightChangePercent?: number;
  dayClose?: number;
  dayChange?: number;
  dayChangePercent?: number;
  updateTime?: string;
}

export interface MarketIndexData {
  taiex: IndexItem;
  txf: IndexItem;
  otc: IndexItem;
  session?: string;
  isNightSession?: boolean;
  updateTime?: string;
  symbol?: string;
  name?: string;
  price?: number;
  change?: number;
  changePercent?: number;
  prevClose?: number;
  high?: number;
  low?: number;
  turnoverEst?: number;
}

export async function fetchMarketIndex(): Promise<MarketIndexData | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const res = await fetch('/api/market', { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) return validateMarketIndex(null);
    const data = await res.json();
    return validateMarketIndex(data);
  } catch (e) {
    clearTimeout(timeoutId);
    return validateMarketIndex(null);
  }
}

export function processStockData(raw: any): Stock {
  // 1. 強制透過 dataValidator 執行數學對齊校驗與清洗
  const { stock: validated, report } = validateAndCleanStock(raw);
  const isDelayed = report.isDelayed;
  const dataStatus = report.dataStatus;

  const currentPrice = validated.price;
  const prevClose = validated.prevClose;
  const change = validated.change;
  const changePercent = validated.changePercent;

  const enrichedKlines: KlineData[] = enrichKlineData(raw.klines || validated.history || []);
  const latest = enrichedKlines[enrichedKlines.length - 1];
  const prev = enrichedKlines[enrichedKlines.length - 2];

  const volumeLots = validated.volume || (latest ? latest.volume : 1000);
  const volumeAvg5d = validated.volumeAvg5d || volumeLots;
  const volumeMultiple = volumeAvg5d > 0 ? Number((volumeLots / volumeAvg5d).toFixed(2)) : 1;

  // Evaluate radar signals based on real indicators
  const activeSignals: RadarSignal[] = [];

  if (latest) {
    // 1. Breakout Resistance
    if (currentPrice >= raw.resistancePrice || (raw.high >= raw.resistancePrice && changePercent > 1.2)) {
      activeSignals.push({
        id: `sig-${raw.symbol}-breakout`,
        timestamp: Date.now() - 1000 * 60 * 12,
        stockSymbol: raw.symbol,
        stockName: raw.name,
        type: 'BREAKOUT_RESISTANCE',
        title: '實盤帶量突破前高壓力線',
        description: `即時報價 ${currentPrice} 元強勢突破波段壓力位 ${raw.resistancePrice} 元，今日量能放大至 ${volumeLots.toLocaleString()} 張 (${volumeMultiple}x 均量)！`,
        triggerPrice: currentPrice,
        volumeMultiple,
        supportPrice: raw.supportPrice,
        resistancePrice: Number((raw.resistancePrice * 1.03).toFixed(1)),
        volume: volumeLots,
        severity: 'high',
        read: false,
      });
    }

    // 2. Bullish MA alignment
    if (
      latest.ma5 &&
      latest.ma10 &&
      latest.ma20 &&
      latest.ma60 &&
      latest.ma5 > latest.ma10 &&
      latest.ma10 > latest.ma20 &&
      latest.ma20 > latest.ma60
    ) {
      activeSignals.push({
        id: `sig-${raw.symbol}-ma-align`,
        timestamp: Date.now() - 1000 * 60 * 28,
        stockSymbol: raw.symbol,
        stockName: raw.name,
        type: 'BULLISH_MA_ALIGN',
        title: '均線呈現完整多頭排列',
        description: `MA5 (${latest.ma5}) > MA10 (${latest.ma10}) > MA20 (${latest.ma20}) > MA60 (${latest.ma60})，多頭均線發散向上開展。`,
        triggerPrice: currentPrice,
        volumeMultiple,
        supportPrice: Number((latest.ma20).toFixed(1)),
        resistancePrice: raw.resistancePrice,
        volume: volumeLots,
        severity: 'medium',
        read: false,
      });
    }

    // 3. Volume Explosion (> 1.8x)
    if (volumeMultiple >= 1.8) {
      activeSignals.push({
        id: `sig-${raw.symbol}-vol-surge`,
        timestamp: Date.now() - 1000 * 60 * 6,
        stockSymbol: raw.symbol,
        stockName: raw.name,
        type: 'VOLUME_EXPLOSION',
        title: '資金雷達爆量警訊',
        description: `盤中成交量爆出 ${volumeLots.toLocaleString()} 張，較5日均量急增 ${volumeMultiple} 倍，大筆資金持續湧入。`,
        triggerPrice: currentPrice,
        volumeMultiple,
        supportPrice: raw.supportPrice,
        resistancePrice: raw.resistancePrice,
        volume: volumeLots,
        severity: 'high',
        read: false,
      });
    }

    // 4. KD Golden Cross
    if (
      latest.k !== undefined &&
      latest.d !== undefined &&
      prev?.k !== undefined &&
      prev?.d !== undefined &&
      prev.k <= prev.d &&
      latest.k > latest.d &&
      latest.k < 45
    ) {
      activeSignals.push({
        id: `sig-${raw.symbol}-kd-cross`,
        timestamp: Date.now() - 1000 * 60 * 45,
        stockSymbol: raw.symbol,
        stockName: raw.name,
        type: 'KD_GOLDEN_CROSS',
        title: 'KD指標低檔黃金交叉',
        description: `KD 指標於低檔築底，K值 (${latest.k}) 向上突破 D值 (${latest.d})，出現超跌反彈訊號。`,
        triggerPrice: currentPrice,
        volumeMultiple,
        supportPrice: raw.supportPrice,
        resistancePrice: raw.resistancePrice,
        volume: volumeLots,
        severity: 'medium',
        read: false,
      });
    }
  }

  const fibonacci = calculateFibonacci(enrichedKlines);
  const supplyDemand = calculateSupplyDemandZones(enrichedKlines);
  const profile = getStockKnowledge(raw.symbol, raw.name);
  const brokerAlerts = profile.brokerNotice || [];
  const decision = generateTradeDecision(enrichedKlines, currentPrice, volumeAvg5d, raw.symbol, brokerAlerts);

  // Merge broker notices if available
  const chips = {
    ...raw.chips,
    brokerAlerts,
  };

  return {
    symbol: raw.symbol,
    name: raw.name,
    industry: raw.industry,
    market: raw.market,
    price: currentPrice,
    change,
    changePercent,
    prevClose,
    open: raw.open || currentPrice,
    high: raw.high || currentPrice,
    low: raw.low || currentPrice,
    volume: volumeLots,
    volumeAvg5d,
    turnover: raw.turnover || Number((((volumeLots * currentPrice * 1000) / 100000000)).toFixed(1)),
    supportPrice: raw.supportPrice,
    resistancePrice: raw.resistancePrice,
    bid: raw.bid || [currentPrice - 0.5, currentPrice - 1, currentPrice - 1.5, currentPrice - 2, currentPrice - 2.5],
    bidVol: raw.bidVol || [120, 150, 180, 210, 250],
    ask: raw.ask || [currentPrice + 0.5, currentPrice + 1, currentPrice + 1.5, currentPrice + 2, currentPrice + 2.5],
    askVol: raw.askVol || [110, 140, 170, 200, 240],
    history: enrichedKlines,
    intraday: raw.intraday || [],
    chips,
    activeSignals,
    news: profile.news,
    commodities: profile.commodities,
    fibonacci,
    supplyDemand,
    decision,
    dataStatus,
    isDelayed,
  };
}

export async function fetchAllStocks(symbols?: string[]): Promise<Stock[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const coreTargets = [
      '5274', '2454', '3017', '2330', '6669', '3529', '3661', '3443', '5269', '3008', '3131', '2059', '3653',
      '2382', '2317', '3231', '2376', '2356', '2308', '3324', '3013', '8210', '2421',
      '3081', '3363', '3450', '6442', '4979', '3163', '2345', '3665',
      '6187', '3583', '3711', '2449', '2303', '4583', '8086', '3105', '2455',
      '1513', '1519', '1503', '3037', '2383', '2603', '2881', '2882'
    ];
    const mergedSymbols = symbols && symbols.length > 0
      ? Array.from(new Set([...symbols, ...coreTargets]))
      : coreTargets;

    const url = `/api/stocks?symbols=${mergedSymbols.join(',')}`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) {
      return [];
    }
    const rawList: any[] = await res.json();
    if (!Array.isArray(rawList)) return [];
    return rawList.map(processStockData);
  } catch (err) {
    clearTimeout(timeoutId);
    return [];
  }
}

export async function fetchSingleStock(symbol: string): Promise<Stock | null> {
  const clean = (symbol || '').trim().toUpperCase().replace(/\.(TW|TWO)$/i, '');
  if (!clean) return null;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch(`/api/stocks/${encodeURIComponent(clean)}`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const raw = await res.json();
      if (raw && (raw.symbol || raw.price)) {
        return processStockData(raw);
      }
    }

    // Real source query fallback: Search for matching company name or stock code
    try {
      const searchRes = await fetch(`/api/stocks/search?q=${encodeURIComponent(clean)}`);
      if (searchRes.ok) {
        const matches = await searchRes.json();
        if (Array.isArray(matches) && matches.length > 0) {
          const targetSymbol = matches[0].symbol;
          if (targetSymbol && targetSymbol !== clean) {
            return await fetchSingleStock(targetSymbol);
          }
        }
      }
    } catch (searchErr) {}

    return null;
  } catch (err) {
    clearTimeout(timeoutId);
    return null;
  }
}

export async function fetchMarketChips(): Promise<MarketChipsOverview | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch('/api/market/chips', { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    clearTimeout(timeoutId);
    return null;
  }
}

export async function fetchSectorFlows(): Promise<SectorFlowItem[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch('/api/market/sectors', { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) return [];
    const list = await res.json();
    return Array.isArray(list) ? list : [];
  } catch (err) {
    clearTimeout(timeoutId);
    return [];
  }
}

export async function searchStocksApi(query: string): Promise<any[]> {
  if (!query || !query.trim()) return [];
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);
  try {
    const res = await fetch(`/api/stocks/search?q=${encodeURIComponent(query.trim())}`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    clearTimeout(timeoutId);
    return [];
  }
}

