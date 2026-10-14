import { Stock, KlineData, IntradayPoint, DailyChips, RadarSignal } from '../types/stock';
import { enrichKlineData, calculateSupportResistance, generateTradeDecision } from '../utils/indicators';

// Accurate baseline values matching true Taiwan market prices in 2026
export const INITIAL_STOCKS_CONFIG = [
  // 核心千金股 & 高價龍頭
  { symbol: '5274', name: '信驊', industry: '伺服器BMC', market: '上櫃', basePrice: 17100, isBullish: true },
  { symbol: '2454', name: '聯發科', industry: '半導體IC', market: '上市', basePrice: 4500, isBullish: true },
  { symbol: '3017', name: '奇鋐', industry: 'AI散熱', market: '上市', basePrice: 3315, isBullish: true },
  { symbol: '2330', name: '台積電', industry: '半導體晶圓', market: '上市', basePrice: 2500, isBullish: true },
  { symbol: '6669', name: '緯穎', industry: 'AI雲端整機', market: '上市', basePrice: 2212, isBullish: true },
  { symbol: '3529', name: '力旺', industry: '矽智財IP', market: '上櫃', basePrice: 2760, isBullish: true },
  { symbol: '3661', name: '世芯-KY', industry: 'ASIC設計', market: '上市', basePrice: 3850, isBullish: true },
  { symbol: '3131', name: '弘塑', industry: 'CoWoS設備', market: '上櫃', basePrice: 2650, isBullish: true },
  { symbol: '2059', name: '川湖', industry: '伺服器導軌', market: '上市', basePrice: 2150, isBullish: true },
  { symbol: '3653', name: '健策', industry: '均熱片散熱', market: '上市', basePrice: 2350, isBullish: true },
  { symbol: '3008', name: '大立光', industry: '光學鏡頭', market: '上市', basePrice: 2850, isBullish: false },

  // 低基期潛力轉型小公司 & 成長黑馬
  { symbol: '3363', name: '上詮', industry: 'CPO光纖陣列', market: '上櫃', basePrice: 544, isBullish: true },
  { symbol: '4583', name: '台灣精銳', industry: '減速機/機器人', market: '上市', basePrice: 395, isBullish: true },
  { symbol: '2382', name: '廣達', industry: 'AI伺服器', market: '上市', basePrice: 322.5, isBullish: true },
  { symbol: '2317', name: '鴻海', industry: '電子代工/AI', market: '上市', basePrice: 240.5, isBullish: true },
  { symbol: '1513', name: '中興電', industry: '重電GIS開關', market: '上市', basePrice: 166, isBullish: true },
  { symbol: '8086', name: '宏捷科', industry: '砷化鎵PA代工', market: '上櫃', basePrice: 139, isBullish: true },
  { symbol: '3081', name: '聯亞', industry: '矽光子雷射', market: '上櫃', basePrice: 2725, isBullish: true },
  { symbol: '6187', name: '萬潤', industry: 'CoWoS貼合設備', market: '上櫃', basePrice: 1630, isBullish: true },
  { symbol: '3450', name: '聯鈞', industry: 'CPO雷射封裝', market: '上市', basePrice: 385, isBullish: true },
  { symbol: '6442', name: '光聖', industry: '光通訊光被動', market: '上市', basePrice: 650, isBullish: true },
  { symbol: '3324', name: '雙鴻', industry: '散熱模組/水冷', market: '上市', basePrice: 1650, isBullish: true },
  { symbol: '1519', name: '華城', industry: '重電變壓器', market: '上市', basePrice: 780, isBullish: true },
  { symbol: '3665', name: '貿聯-KY', industry: '高速連接線束', market: '上市', basePrice: 720, isBullish: true },
  { symbol: '3583', name: '辛耘', industry: '再生晶圓設備', market: '上市', basePrice: 560, isBullish: true },
  { symbol: '2455', name: '全新', industry: '砷化鎵磊晶', market: '上市', basePrice: 220, isBullish: true },

  // 其他關鍵熱門權值
  { symbol: '2308', name: '台達電', industry: '電源與綠能', market: '上市', basePrice: 580, isBullish: true },
  { symbol: '3231', name: '緯創', industry: 'AI代工', market: '上市', basePrice: 235, isBullish: true },
  { symbol: '3037', name: '欣興', industry: 'PCB載板', market: '上市', basePrice: 265, isBullish: false },
  { symbol: '2603', name: '長榮', industry: '航運業', market: '上市', basePrice: 245, isBullish: true },
  { symbol: '2881', name: '富邦金', industry: '金融保險', market: '上市', basePrice: 96.5, isBullish: true },
  { symbol: '2376', name: '技嘉', industry: '主機板/AI', market: '上市', basePrice: 420, isBullish: true },
  { symbol: '3711', name: '日月光投控', industry: '半導體封測', market: '上市', basePrice: 195, isBullish: true },
];

function getRecentTradingDates(days = 120): string[] {
  const dates: string[] = [];
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const taipei = new Date(utc + 3600000 * 8);

  let cur = new Date(taipei);
  if (cur.getDay() === 0) cur.setDate(cur.getDate() - 2);
  else if (cur.getDay() === 6) cur.setDate(cur.getDate() - 1);
  else if (cur.getHours() < 15) {
    cur.setDate(cur.getDate() - 1);
    if (cur.getDay() === 0) cur.setDate(cur.getDate() - 2);
    if (cur.getDay() === 6) cur.setDate(cur.getDate() - 1);
  }

  while (dates.length < days) {
    const dayOfWeek = cur.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      const y = cur.getFullYear();
      const m = String(cur.getMonth() + 1).padStart(2, '0');
      const d = String(cur.getDate()).padStart(2, '0');
      dates.unshift(`${y}-${m}-${d}`);
    }
    cur.setDate(cur.getDate() - 1);
  }
  return dates;
}

function generateSeedKlines(basePrice: number, symbol: string, days = 120): KlineData[] {
  const result: KlineData[] = [];
  const dates = getRecentTradingDates(days);

  // 3017 奇鋐特定前收: 3440, 現價: 3385 (跌 55 元, -1.60%)
  const is3017 = symbol === '3017';
  const prevCloseTarget = is3017 ? 3440 : basePrice * (1 - 0.012);

  let cur = basePrice * 0.85;
  for (let i = 0; i < days; i++) {
    const isLast = i === days - 1;
    const isSecondLast = i === days - 2;

    let close = cur;
    if (isLast) {
      close = basePrice;
    } else if (isSecondLast) {
      close = prevCloseTarget;
    } else {
      const shock = (Math.random() - 0.49) * 0.02;
      close = cur * (1 + 0.0015 + shock);
    }

    const open = isLast
      ? (is3017 ? 3420 : close * (1 - 0.005))
      : close * (1 + (Math.random() - 0.5) * 0.008);
    const high = isLast
      ? (is3017 ? 3435 : Math.max(open, close) * 1.01)
      : Math.max(open, close) * (1 + Math.random() * 0.01);
    const low = isLast
      ? (is3017 ? 3360 : Math.min(open, close) * 0.99)
      : Math.min(open, close) * (1 - Math.random() * 0.01);
    const volume = isLast && is3017
      ? 3450
      : Math.floor((basePrice > 2000 ? 3800 : basePrice > 500 ? 7500 : 18000) * (0.8 + Math.random() * 0.5));

    result.push({
      date: dates[i],
      open: Number(open.toFixed(1)),
      high: Number(high.toFixed(1)),
      low: Number(low.toFixed(1)),
      close: Number(close.toFixed(1)),
      volume,
    });
    cur = close;
  }

  return enrichKlineData(result);
}

export const INITIAL_STOCKS: Stock[] = INITIAL_STOCKS_CONFIG.map((item) => {
  const history = generateSeedKlines(item.basePrice, item.symbol, 120);
  const latest = history[history.length - 1];
  const prev = history[history.length - 2];
  latest.close = item.basePrice;
  const change = Number((latest.close - prev.close).toFixed(2));
  const changePercent = Number(((change / prev.close) * 100).toFixed(2));
  const sr = calculateSupportResistance(history);

  const step = item.basePrice >= 1000 ? 5 : item.basePrice >= 500 ? 1 : item.basePrice >= 100 ? 0.5 : 0.1;
  const bid = [1, 2, 3, 4, 5].map((i) => Number((item.basePrice - i * step).toFixed(1)));
  const ask = [1, 2, 3, 4, 5].map((i) => Number((item.basePrice + i * step).toFixed(1)));

  // Generate 6-day chips history
  const recent6Dates = getRecentTradingDates(6);
  const chipsHistory = recent6Dates.map((dateStr, idx) => {
    const isToday = idx === recent6Dates.length - 1;
    const mult = isToday ? (change >= 0 ? 1 : -1) : (Math.random() > 0.45 ? 1 : -1);
    const baseVol = Math.max(600, Math.round(latest.volume * 0.28));
    return {
      date: dateStr,
      foreignBuySell: Math.floor(baseVol * (0.7 + Math.random() * 0.6) * mult),
      trustBuySell: Math.floor(baseVol * (0.25 + Math.random() * 0.3) * (mult > 0 ? 1.2 : 0.3)),
      dealerBuySell: Math.floor(baseVol * 0.15 * mult),
      mainForceBuySell: Math.floor(baseVol * (0.5 + Math.random() * 0.7) * mult),
      marginLongChange: Math.floor((Math.random() - 0.45) * 450),
      marginShortChange: Math.floor((Math.random() - 0.55) * 120),
    };
  });
  const latestChip = chipsHistory[chipsHistory.length - 1];
  const totalInst = latestChip.foreignBuySell + latestChip.trustBuySell + latestChip.dealerBuySell;

  return {
    symbol: item.symbol,
    name: item.name,
    industry: item.industry,
    market: item.market as any,
    price: item.basePrice,
    change,
    changePercent,
    prevClose: prev.close,
    open: latest.open,
    high: latest.high,
    low: latest.low,
    volume: latest.volume,
    turnover: Number(((latest.volume * item.basePrice * 1000) / 100000000).toFixed(1)),
    volumeAvg5d: Math.round(latest.volume * 0.95),
    supportPrice: sr.support,
    resistancePrice: sr.resistance,
    bid,
    bidVol: [120, 150, 180, 220, 290],
    ask,
    askVol: [110, 140, 170, 200, 250],
    history,
    intraday: [],
    chips: {
      date: latestChip.date,
      foreignBuySell: latestChip.foreignBuySell,
      trustBuySell: latestChip.trustBuySell,
      dealerBuySell: latestChip.dealerBuySell,
      totalInstitutional: totalInst,
      mainForceBuySell: latestChip.mainForceBuySell,
      chipConcentration: Number((change >= 0 ? 14.2 : 5.8).toFixed(1)),
      marginLongBalance: 16500,
      marginLongChange: latestChip.marginLongChange,
      marginShortBalance: 2450,
      marginShortChange: latestChip.marginShortChange,
      marginShortRatio: 14.8,
      govBankBuySell: change >= 0 ? -450 : 680,
      largeHolderRatio: 76.5,
      history: chipsHistory,
    },
    activeSignals: [],
    decision: generateTradeDecision(history, item.basePrice, Math.round(latest.volume * 0.95), item.symbol),
  };
});
