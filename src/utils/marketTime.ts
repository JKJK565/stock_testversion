export interface MarketSessionInfo {
  isOpen: boolean;
  isPostMarket: boolean;
  isNightFutures: boolean;
  statusLabel: string;
  badgeClass: string;
  dotClass: string;
  taipeiTimeStr: string;
}

export function getTaipeiMarketSession(): MarketSessionInfo {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const taipei = new Date(utc + 3600000 * 8); // UTC+8

  const day = taipei.getDay(); // 0 is Sunday, 6 is Saturday
  const hour = taipei.getHours();
  const min = taipei.getMinutes();
  const currentMinute = hour * 60 + min;

  const isWeekend = day === 0 || (day === 6 && hour >= 5); // Saturday after 05:00 AM
  const timeFormatted = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;

  // 1. 現貨常規時段: 09:00 ~ 13:30
  const isTradingHours = !isWeekend && currentMinute >= 540 && currentMinute <= 810;
  if (isTradingHours) {
    return {
      isOpen: true,
      isPostMarket: false,
      isNightFutures: false,
      statusLabel: '現貨即時撮合中',
      badgeClass: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/80',
      dotClass: 'bg-emerald-400 animate-pulse',
      taipeiTimeStr: timeFormatted,
    };
  }

  // 2. 盤後定價撮合時段: 13:30 ~ 14:30
  const isPostMarketHours = !isWeekend && currentMinute > 810 && currentMinute <= 870;
  if (isPostMarketHours) {
    return {
      isOpen: false,
      isPostMarket: true,
      isNightFutures: false,
      statusLabel: '盤後定價撮合中',
      badgeClass: 'text-amber-300 bg-amber-950/60 border-amber-800/80',
      dotClass: 'bg-amber-400',
      taipeiTimeStr: timeFormatted,
    };
  }

  // 3. 盤後結算與法人籌碼公布時段: 14:30 ~ 15:00
  const isSettlementHours = !isWeekend && currentMinute > 870 && currentMinute < 900;
  if (isSettlementHours) {
    return {
      isOpen: false,
      isPostMarket: true,
      isNightFutures: false,
      statusLabel: '盤後法人籌碼結算',
      badgeClass: 'text-sky-300 bg-sky-950/60 border-sky-800/80',
      dotClass: 'bg-sky-400',
      taipeiTimeStr: timeFormatted,
    };
  }

  // 4. 台指期夜盤 (豁免全時撮合時段): 15:00 ~ 次日 05:00 (平日夜盤)
  const isNightFuturesHours =
    !isWeekend && ((currentMinute >= 900 && currentMinute < 1440) || (hour < 5 && day !== 0 && day !== 1));

  if (isNightFuturesHours) {
    return {
      isOpen: false,
      isPostMarket: false,
      isNightFutures: true,
      statusLabel: '🌙 期貨夜盤撮合中 (15:00~05:00)',
      badgeClass: 'text-indigo-300 bg-indigo-950/80 border-indigo-700/80 shadow-sm shadow-indigo-950',
      dotClass: 'bg-indigo-400 animate-pulse',
      taipeiTimeStr: timeFormatted,
    };
  }

  return {
    isOpen: false,
    isPostMarket: false,
    isNightFutures: false,
    statusLabel: isWeekend ? '台股週末休市' : '現貨收盤 (夜盤休市)',
    badgeClass: 'text-slate-300 bg-slate-900 border-slate-700/80',
    dotClass: 'bg-slate-400',
    taipeiTimeStr: timeFormatted,
  };
}
