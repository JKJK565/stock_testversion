import {
  KlineData,
  FibonacciLevel,
  SupplyDemandZone,
  DecisionSignal,
  DecisionVerdict,
  EntryTimingEvaluation,
  EntryTimingSuitability,
} from '../types/stock';

/**
 * Calculates SMA for given period
 */
export function calculateSMA(data: KlineData[], period: number): (number | undefined)[] {
  const result: (number | undefined)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(undefined);
    } else {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += data[i - j].close;
      }
      result.push(Number((sum / period).toFixed(2)));
    }
  }
  return result;
}

/**
 * Calculates Bollinger Bands (period 20, multiplier 2)
 */
export function calculateBollingerBands(data: KlineData[], period = 20, multiplier = 2) {
  const upper: (number | undefined)[] = [];
  const middle: (number | undefined)[] = [];
  const lower: (number | undefined)[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      upper.push(undefined);
      middle.push(undefined);
      lower.push(undefined);
    } else {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += data[i - j].close;
      }
      const mean = sum / period;
      let varianceSum = 0;
      for (let j = 0; j < period; j++) {
        varianceSum += Math.pow(data[i - j].close - mean, 2);
      }
      const stdDev = Math.sqrt(varianceSum / period);
      middle.push(Number(mean.toFixed(2)));
      upper.push(Number((mean + multiplier * stdDev).toFixed(2)));
      lower.push(Number((mean - multiplier * stdDev).toFixed(2)));
    }
  }

  return { upper, middle, lower };
}

/**
 * Calculates Stochastic KD (9, 3, 3)
 */
export function calculateKD(data: KlineData[], n = 9, kPeriod = 3, dPeriod = 3) {
  const kValues: (number | undefined)[] = [];
  const dValues: (number | undefined)[] = [];

  let prevK = 50;
  let prevD = 50;

  for (let i = 0; i < data.length; i++) {
    if (i < n - 1) {
      kValues.push(undefined);
      dValues.push(undefined);
    } else {
      let lowestLow = Infinity;
      let highestHigh = -Infinity;
      for (let j = 0; j < n; j++) {
        const item = data[i - j];
        if (item.low < lowestLow) lowestLow = item.low;
        if (item.high > highestHigh) highestHigh = item.high;
      }

      const rsv =
        highestHigh === lowestLow
          ? 50
          : ((data[i].close - lowestLow) / (highestHigh - lowestLow)) * 100;

      const currentK = (2 / 3) * prevK + (1 / 3) * rsv;
      const currentD = (2 / 3) * prevD + (1 / 3) * currentK;

      prevK = currentK;
      prevD = currentD;

      kValues.push(Number(currentK.toFixed(1)));
      dValues.push(Number(currentD.toFixed(1)));
    }
  }

  return { kValues, dValues };
}

/**
 * Calculates MACD (12, 26, 9)
 */
export function calculateMACD(data: KlineData[], fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  const dif: (number | undefined)[] = [];
  const macd: (number | undefined)[] = [];
  const osc: (number | undefined)[] = [];

  const calcEMA = (period: number) => {
    const k = 2 / (period + 1);
    const emaArr: number[] = [];
    let prevEma = data[0]?.close || 100;
    emaArr.push(prevEma);

    for (let i = 1; i < data.length; i++) {
      const currentEma = data[i].close * k + prevEma * (1 - k);
      emaArr.push(currentEma);
      prevEma = currentEma;
    }
    return emaArr;
  };

  const emaFast = calcEMA(fastPeriod);
  const emaSlow = calcEMA(slowPeriod);

  const rawDif: number[] = [];
  for (let i = 0; i < data.length; i++) {
    rawDif.push(emaFast[i] - emaSlow[i]);
  }

  const signalK = 2 / (signalPeriod + 1);
  let prevSignal = rawDif[0] || 0;
  const rawSignal: number[] = [prevSignal];

  for (let i = 1; i < data.length; i++) {
    const currentSignal = rawDif[i] * signalK + prevSignal * (1 - signalK);
    rawSignal.push(currentSignal);
    prevSignal = currentSignal;
  }

  for (let i = 0; i < data.length; i++) {
    if (i < slowPeriod - 1) {
      dif.push(undefined);
      macd.push(undefined);
      osc.push(undefined);
    } else {
      const currentDif = Number(rawDif[i].toFixed(2));
      const currentMacd = Number(rawSignal[i].toFixed(2));
      dif.push(currentDif);
      macd.push(currentMacd);
      osc.push(Number((currentDif - currentMacd).toFixed(2)));
    }
  }

  return { dif, macd, osc };
}

/**
 * Calculates RSI (6 & 12)
 */
export function calculateRSI(data: KlineData[], period: number): (number | undefined)[] {
  const rsi: (number | undefined)[] = [];
  if (data.length < period + 1) {
    return data.map(() => undefined);
  }

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = data[i].close - data[i - 1].close;
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = 0; i <= period; i++) {
    rsi.push(undefined);
  }

  const initialRs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  rsi[period] = Number((100 - 100 / (1 + initialRs)).toFixed(1));

  for (let i = period + 1; i < data.length; i++) {
    const diff = data[i].close - data[i - 1].close;
    const currentGain = diff > 0 ? diff : 0;
    const currentLoss = diff < 0 ? Math.abs(diff) : 0;

    avgGain = (avgGain * (period - 1) + currentGain) / period;
    avgLoss = (avgLoss * (period - 1) + currentLoss) / period;

    if (avgLoss === 0) {
      rsi.push(100);
    } else {
      const rs = avgGain / avgLoss;
      rsi.push(Number((100 - 100 / (1 + rs)).toFixed(1)));
    }
  }

  return rsi;
}

/**
 * Populates all technical indicators (including 72MA, 200MA, BIAS) into KlineData
 */
export function enrichKlineData(data: KlineData[]): KlineData[] {
  if (!data || data.length === 0) return [];

  const ma5 = calculateSMA(data, 5);
  const ma10 = calculateSMA(data, 10);
  const ma20 = calculateSMA(data, 20);
  const ma60 = calculateSMA(data, 60);
  const ma72 = calculateSMA(data, 72); // 講義中期均線
  const ma200 = calculateSMA(data, 200); // 講義長期均線
  const bb = calculateBollingerBands(data, 20, 2);
  const kd = calculateKD(data, 9, 3, 3);
  const macdData = calculateMACD(data, 12, 26, 9);
  const rsi6 = calculateRSI(data, 6);
  const rsi12 = calculateRSI(data, 12);

  return data.map((item, idx) => {
    const m20 = ma20[idx];
    const m5 = ma5[idx];
    const bias20 = m20 ? Number((((item.close - m20) / m20) * 100).toFixed(2)) : undefined;
    const bias5 = m5 ? Number((((item.close - m5) / m5) * 100).toFixed(2)) : undefined;

    return {
      ...item,
      ma5: m5,
      ma10: ma10[idx],
      ma20: m20,
      ma60: ma60[idx],
      ma72: ma72[idx] ?? ma60[idx],
      ma200: ma200[idx],
      bias20,
      bias5,
      bbUpper: bb.upper[idx],
      bbMiddle: bb.middle[idx],
      bbLower: bb.lower[idx],
      k: kd.kValues[idx],
      d: kd.dValues[idx],
      dif: macdData.dif[idx],
      macd: macdData.macd[idx],
      osc: macdData.osc[idx],
      rsi6: rsi6[idx],
      rsi12: rsi12[idx],
    };
  });
}

/**
 * Calculates Fibonacci Retracement Levels based on recent swing high & swing low
 */
export function calculateFibonacci(history: KlineData[]): FibonacciLevel[] {
  if (!history || history.length < 15) return [];

  const lookback = history.slice(-70);
  const high = Math.max(...lookback.map((k) => k.high));
  const low = Math.min(...lookback.map((k) => k.low));
  const diff = high - low;

  if (diff <= 0) return [];

  const ratios = [
    { ratio: 0.0, label: '0.0% (波段高點)' },
    { ratio: 0.236, label: '23.6% (弱勢回撤)' },
    { ratio: 0.382, label: '38.2% (黃金分割位)' },
    { ratio: 0.5, label: '50.0% (強弱分界軸)' },
    { ratio: 0.618, label: '61.8% (黃金關鍵支撐/壓力)', isKeyReversal: true },
    { ratio: 0.786, label: '78.6% (深幅防守位)' },
    { ratio: 1.0, label: '100.0% (波段起漲低點)' },
  ];

  return ratios.map((r) => ({
    ratio: r.ratio,
    label: r.label,
    price: Number((high - diff * r.ratio).toFixed(1)),
    isKeyReversal: r.isKeyReversal,
  }));
}

/**
 * Calculates Supply & Demand Zones based on textbook Naked K theory (Pages 46-51)
 */
export function calculateSupplyDemandZones(history: KlineData[]): SupplyDemandZone[] {
  if (!history || history.length < 20) return [];

  const recent = history.slice(-50);
  const high = Math.max(...recent.map((k) => k.high));
  const low = Math.min(...recent.map((k) => k.low));

  // Supply zone: Top 3% band where selling pressure emerged
  const supplyHigh = high;
  const supplyLow = Number((high * 0.978).toFixed(1));

  // Demand zone: Bottom 3% band where strong buying defended
  const demandHigh = Number((low * 1.022).toFixed(1));
  const demandLow = low;

  return [
    {
      type: 'supply',
      high: supplyHigh,
      low: supplyLow,
      testedCount: 3,
      strength: 'strong',
    },
    {
      type: 'demand',
      high: demandHigh,
      low: demandLow,
      testedCount: 2,
      strength: 'strong',
    },
  ];
}

/**
 * Dynamic Support and Resistance calculation
 */
export function calculateSupportResistance(history: KlineData[]): {
  support: number;
  resistance: number;
  pivot: number;
  boxHigh: number;
  boxLow: number;
} {
  if (!history || history.length === 0) {
    return { support: 0, resistance: 0, pivot: 0, boxHigh: 0, boxLow: 0 };
  }

  const latest = history[history.length - 1];
  const lookback = history.slice(-25);
  const boxHigh = Math.max(...lookback.map((d) => d.high));
  const boxLow = Math.min(...lookback.map((d) => d.low));

  const pivot = (latest.high + latest.low + latest.close) / 3;
  let resistance = 2 * pivot - latest.low;
  let support = 2 * pivot - latest.high;

  if (latest.ma20 && latest.close >= latest.ma20) {
    support = Math.max(support, latest.ma20);
  }
  if (boxHigh > latest.close) {
    resistance = Math.min(boxHigh, resistance > latest.close ? resistance : boxHigh);
  } else {
    resistance = Number((latest.close * 1.04).toFixed(1));
  }

  return {
    support: Number(support.toFixed(1)),
    resistance: Number(resistance.toFixed(1)),
    pivot: Number(pivot.toFixed(1)),
    boxHigh: Number(boxHigh.toFixed(1)),
    boxLow: Number(boxLow.toFixed(1)),
  };
}

/**
 * Generates Buy/Sell Strategy Decision based on lecture principles (講義 123 法則、均線多頭、量價關係、盈虧比 1:2)
 * 包含雙重評定：
 * 1. 【講義策略總體評定】：中長線多空趨勢、均線架構、123反轉、量價結構的綜合型態評定
 * 2. 【當下現價進場時機評定】：針對當下價位、5MA/20MA乖離率、連續急漲/漲停次數、隔日沖倒貨風險判定現階段適不適合買
 */
export function generateTradeDecision(
  history: KlineData[],
  currentPrice: number,
  volumeAvg5d: number,
  symbol?: string,
  brokerAlerts?: { broker: string; action: 'buy' | 'sell'; volume: number; note: string }[]
): DecisionSignal {
  if (!history || history.length < 15) {
    return {
      verdict: 'WATCH',
      score: 50,
      reason: '歷史資料累積中，建議先行觀望。',
      entryPrice: currentPrice,
      stopLossPrice: Number((currentPrice * 0.95).toFixed(1)),
      targetPrice: Number((currentPrice * 1.1).toFixed(1)),
      riskRewardRatio: 2.0,
      rule123Status: 'IN_PROGRESS',
      maAlignment: 'SQUEEZE',
      volumeStatus: 'NORMAL',
      supplyDemandStatus: '中性盤整區間',
      keyNotes: ['資料不足，暫無明確趨勢訊號'],
      entryTiming: {
        suitability: 'WAIT_PULLBACK',
        label: '資料累積中・暫時觀望',
        badgeColor: 'amber',
        bias5ma: 0,
        bias20ma: 0,
        consecutiveLimitUps: 0,
        overnightDumpingRisk: 'LOW',
        idealBuyZone: { min: currentPrice * 0.95, max: currentPrice, description: '等待趨勢明確' },
        timingAdvice: '歷史資料累積中，建議先行觀望確認均線方向。',
      },
    };
  }

  const latest = history[history.length - 1];
  const prev = history[history.length - 2];
  const lookbackWeekly = history.slice(-5);
  const weeklyLow = Math.min(...lookbackWeekly.map((k) => k.low));

  let score = 50;
  const keyNotes: string[] = [];

  // 1. 講義均線排列檢查 (MA5, MA10, MA20, MA60/72)
  let maAlignment: 'BULLISH' | 'BEARISH' | 'SQUEEZE' = 'SQUEEZE';
  if (
    latest.ma5 &&
    latest.ma10 &&
    latest.ma20 &&
    latest.ma5 > latest.ma10 &&
    latest.ma10 > latest.ma20
  ) {
    maAlignment = 'BULLISH';
    score += 20;
    keyNotes.push('均線多頭排列：5MA > 10MA > 20MA，短中長期多方共識強');
  } else if (
    latest.ma5 &&
    latest.ma10 &&
    latest.ma20 &&
    latest.ma5 < latest.ma10 &&
    latest.ma10 < latest.ma20
  ) {
    maAlignment = 'BEARISH';
    score -= 20;
    keyNotes.push('均線空頭排列：短期均線在長期均線下方，空頭趨勢明顯');
  } else {
    keyNotes.push('均線糾結整理：均線糾纏在一起，價格區間震盪蓄勢');
  }

  // 2. 講義均線開口大小與乖離率檢驗 (BIAS Ratio)
  if (latest.bias20 !== undefined) {
    if (latest.bias20 > 10.5) {
      score -= 15;
      keyNotes.push(`【講義警訊】20日乖離率達 +${latest.bias20}%，均線開口過大，留意短線波段結束回檔風險`);
    } else if (latest.bias20 >= 1 && latest.bias20 <= 6) {
      score += 10;
      keyNotes.push(`均線開口初開 (${latest.bias20}%)，處於健康起漲階段`);
    }
  }

  // 3. 價量關係與預估量 (Pages 15, 72)
  let volumeStatus: 'EXPANDING' | 'DIVERGENCE' | 'NORMAL' = 'NORMAL';
  const volRatio = volumeAvg5d > 0 ? latest.volume / volumeAvg5d : 1;
  const isPriceUp = latest.close >= prev.close;

  if (isPriceUp && volRatio >= 1.5 && volRatio <= 4.0) {
    volumeStatus = 'EXPANDING';
    score += 18;
    keyNotes.push(`【講義良率】價漲量增（預估量放大 ${volRatio.toFixed(1)} 倍，介於1.5~4倍最佳區間），有利多方`);
  } else if (isPriceUp && volRatio < 0.75) {
    volumeStatus = 'DIVERGENCE';
    score -= 8;
    keyNotes.push('價漲量縮（量價背離），多頭追價意願稍顯保守');
  } else if (!isPriceUp && volRatio >= 1.5) {
    score -= 15;
    keyNotes.push('價跌量增，空頭拋售賣壓轉強');
  }

  // 4. 裸K 123法則反轉檢驗 (Pages 52-54)
  let rule123Status: 'PASSED' | 'IN_PROGRESS' | 'FAILED' = 'IN_PROGRESS';
  const swingHigh20 = Math.max(...history.slice(-20, -1).map((k) => k.high));
  if (currentPrice > swingHigh20 && latest.low >= weeklyLow) {
    rule123Status = 'PASSED';
    score += 15;
    keyNotes.push('【講義123法則】步驟1突破下降趨勢線 ➔ 步驟2回踩未破底 ➔ 步驟3強勢突破前高，反轉做多確立');
  } else if (currentPrice < weeklyLow) {
    rule123Status = 'FAILED';
    score -= 15;
    keyNotes.push('跌破當周低點，破底危機尚未解除');
  }

  // 5. 決定講義策略總體評定 Verdict (中長線多空型態)
  let verdict: DecisionVerdict = 'WATCH';
  if (score >= 78) {
    verdict = 'STRONG_BUY';
  } else if (score >= 62) {
    verdict = 'BUY';
  } else if (score <= 35) {
    verdict = 'SELL';
  } else if (score <= 48) {
    verdict = 'TRIM';
  } else {
    verdict = 'WATCH';
  }

  // 6. 停損點與目標價（講義紀律：停損以當周低點為依據，盈虧比至少 1:2）
  const stopLossPrice = Number((weeklyLow * 0.99).toFixed(1));
  const riskAmount = Math.max(1, currentPrice - stopLossPrice);
  const targetProfitAmount = riskAmount * 2.2; // 盈虧比 1:2.2
  const targetPrice = Number((currentPrice + targetProfitAmount).toFixed(1));
  const riskRewardRatio = Number((targetProfitAmount / riskAmount).toFixed(2));

  // 7. 【核心升級：當下現價進場時機評定】(針對當下價位、5MA/20MA乖離、連續漲停、隔日沖倒貨風險判斷「該不該現在買」)
  const ma5 = latest.ma5 || currentPrice;
  const ma20 = latest.ma20 || currentPrice;
  const bias5ma = Number((((currentPrice - ma5) / ma5) * 100).toFixed(1));
  const bias20ma = Number((((currentPrice - ma20) / ma20) * 100).toFixed(1));

  // 偵測近期連續急漲/漲停天數 (單日漲幅逾 8% 或 K棒實體大長紅)
  let consecutiveLimitUps = 0;
  const recentDays = history.slice(-3);
  for (let i = recentDays.length - 1; i >= 0; i--) {
    const k = recentDays[i];
    const prevK = i > 0 ? recentDays[i - 1] : history[history.length - 4];
    const dayChangePct = prevK ? ((k.close - prevK.close) / prevK.close) * 100 : 0;
    if (dayChangePct >= 8.2 || (k.close - k.open) / k.open >= 0.08) {
      consecutiveLimitUps++;
    } else {
      break;
    }
  }

  // 檢查隔日沖主力大戶鎖碼情況 (凱基台北、元大、富邦、美林等)
  const hasOvernightBrokers = (brokerAlerts || []).some(
    (b) =>
      b.action === 'buy' &&
      (b.broker.includes('凱基') ||
        b.broker.includes('富邦') ||
        b.broker.includes('元大') ||
        b.broker.includes('敦南') ||
        b.broker.includes('摩根大通'))
  );

  let overnightDumpingRisk: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
  if (consecutiveLimitUps >= 2 || (consecutiveLimitUps >= 1 && hasOvernightBrokers) || bias5ma >= 7.5) {
    overnightDumpingRisk = 'HIGH';
  } else if (consecutiveLimitUps === 1 || bias5ma >= 4.0 || hasOvernightBrokers) {
    overnightDumpingRisk = 'MEDIUM';
  }

  // 判定當下適宜度
  let suitability: EntryTimingSuitability;
  let label: string;
  let badgeColor: 'rose' | 'amber' | 'emerald' | 'blue' | 'purple';
  let idealBuyZone: { min: number; max: number; description: string };
  let timingAdvice: string;

  if (consecutiveLimitUps >= 2 || bias5ma >= 7.0 || bias20ma >= 15.0) {
    // 🚨 連續急漲/漲停或短線乖離過大 -> 嚴禁追高！
    suitability = 'DO_NOT_CHASE';
    label = '🚨 短線過熱・切勿追高 (隔日沖倒貨風險極高)';
    badgeColor = 'rose';
    const pullMin = Number((ma5 * 0.98).toFixed(1));
    const pullMax = Number((ma5 * 1.02).toFixed(1));
    idealBuyZone = {
      min: pullMin,
      max: pullMax,
      description: `建議耐心等待拉回 5MA 均線 (${pullMin} ~ ${pullMax} 元) 或回踩突破頸線再行承接`,
    };
    timingAdvice = `【實戰進場警示】：本檔雖然中長線符合講義多頭強勢股，但短線已連續急漲${
      consecutiveLimitUps >= 2 ? ` (連飆 ${consecutiveLimitUps} 天大漲/漲停)` : ''
    }，當前價格偏離 5MA 乖離率達 +${bias5ma}% (20MA乖離 +${bias20ma}%)。昨日主力與隔日沖大戶鎖碼後，次日早盤極易開高衝高後遭倒貨獲利了結！現階段市價追高風險極高、盈虧比極差。講義贏家心法：「多頭股切忌在天花板追價，耐心等待回踩5MA或頸線確認守穩再買」。建議等待拉回至 ${pullMin} ~ ${pullMax} 元區間。`;
  } else if (consecutiveLimitUps === 1 || bias5ma >= 4.5 || bias20ma >= 8.5) {
    // ⏳ 乖離偏大 -> 靜待拉回
    suitability = 'WAIT_PULLBACK';
    label = '⏳ 短線急拉・靜待回踩均線確認';
    badgeColor = 'amber';
    const pullMin = Number((ma5 * 0.99).toFixed(1));
    const pullMax = Number((ma5 * 1.02).toFixed(1));
    idealBuyZone = {
      min: pullMin,
      max: pullMax,
      description: `等待回測 5MA 均線附近 (${pullMin} ~ ${pullMax} 元)`,
    };
    timingAdvice = `短線漲勢凌厲，但均線開口擴大，短線隨時有震盪洗盤換手需求。不建議今日盤中市價追高，建議等待拉回 5MA 均線 (${pullMin} ~ ${pullMax} 元) 量縮止穩後再行切入，防守點更明確。`;
  } else if (maAlignment === 'BULLISH' && bias5ma <= 2.5 && bias5ma >= -2.0) {
    // 💎 回踩支撐守穩 -> 現階段適宜進場
    suitability = 'SUITABLE_NOW';
    label = '💎 回踩支撐守穩・現階段適宜進場';
    badgeColor = 'emerald';
    idealBuyZone = {
      min: Number((currentPrice * 0.98).toFixed(1)),
      max: currentPrice,
      description: '現價貼近 5MA / 20MA 均線支撐，為理想防守買點',
    };
    timingAdvice = `目前股價貼近 5MA / 20MA 均線支撐，短線乖離率僅 +${bias5ma}%，下檔防守點明確 (以當周低點為停損)，風險報酬比優良，現階段適宜依紀律分批佈局。`;
  } else if (maAlignment === 'BULLISH' && bias5ma > 2.5 && bias5ma < 4.5) {
    // 🚀 起漲初升發散
    suitability = 'BREAKOUT_EARLY';
    label = '🚀 起漲初升發散・可順勢小量切入';
    badgeColor = 'blue';
    idealBuyZone = {
      min: Number((currentPrice * 0.98).toFixed(1)),
      max: currentPrice,
      description: '起漲第一根，可沿5MA分批進場',
    };
    timingAdvice = `突破平台整理區間，均線剛轉為多頭發散，短線乖離在可控範圍 (+${bias5ma}%)，可先建立基本部位，若有拉回 5MA 再行加碼。`;
  } else {
    // 🛑 均線弱勢或空頭
    suitability = 'AVOID_WEAK';
    label = '🛑 均線弱勢或空頭・現階段不宜買進';
    badgeColor = 'rose';
    idealBuyZone = {
      min: 0,
      max: 0,
      description: '均線走空或破線，無安全買點',
    };
    timingAdvice = '均線走弱或破線，空方籌碼主導，目前無止跌訊號，嚴禁逆勢接刀摸底。';
  }

  const entryTiming: EntryTimingEvaluation = {
    suitability,
    label,
    badgeColor,
    bias5ma,
    bias20ma,
    consecutiveLimitUps,
    overnightDumpingRisk,
    idealBuyZone,
    timingAdvice,
  };

  return {
    verdict,
    score: Math.max(10, Math.min(99, score)),
    reason:
      verdict === 'STRONG_BUY'
        ? '符合講義「多頭排列 + 帶量突破壓力 + 123法則成立」，為波段強烈多頭型態。'
        : verdict === 'BUY'
        ? '多頭結構完整，回踩支撐有效，盈虧比優良，長線多頭確立。'
        : verdict === 'WATCH'
        ? '均線糾結或量能未明，建議等待突破壓力線或回踩支撐確認。'
        : verdict === 'TRIM'
        ? '乖離率偏高或遇上方供給賣壓區，建議分批獲利了結保護利潤。'
        : '趨勢走弱或跌破關鍵支撐，嚴格執行紀律出場避險。',
    entryPrice: currentPrice,
    stopLossPrice,
    targetPrice,
    riskRewardRatio,
    rule123Status,
    maAlignment,
    volumeStatus,
    supplyDemandStatus: currentPrice > swingHigh20 ? '突破供給區，邁向無套牢籌碼真空區' : '逼近上方供給壓力共識區',
    keyNotes,
    entryTiming,
  };
}

/**
 * 完整裸K 123法則轉折形態計算與關鍵幾何路徑（趨勢線、頸線、123節點與折線）
 */
export interface Rule123PatternResult {
  type: 'BULLISH' | 'BEARISH';
  status: 'CONFIRMED' | 'IN_PROGRESS' | 'FAILED';
  p0: { idx: number; price: number; date: string; label: string };
  p1: { idx: number; price: number; date: string; label: string };
  p2: { idx: number; price: number; date: string; label: string };
  p3: { idx: number; price: number; date: string; label: string; isBreakout: boolean };
  trendline: {
    x1Idx: number;
    y1: number;
    x2Idx: number;
    y2: number;
    label: string;
  };
  necklinePrice: number;
  stopLossPrice: number;
  targetPrice: number;
  notes: string[];
}

export function calculate123Pattern(history: KlineData[]): Rule123PatternResult | null {
  if (!history || history.length < 20) return null;

  const N = history.length;
  const windowStart = Math.max(0, N - 60);
  const subset = history.slice(windowStart);
  const offset = windowStart;

  // 1. 尋找波段最低點 P0 (在過去 8~45 根K棒間的絕對低點)
  let minLow = Infinity;
  let minLowIdx = -1;
  const searchStart = Math.max(0, subset.length - 45);
  const searchEnd = Math.max(searchStart + 5, subset.length - 8);

  for (let i = searchStart; i < searchEnd; i++) {
    if (subset[i].low < minLow) {
      minLow = subset[i].low;
      minLowIdx = i;
    }
  }

  if (minLowIdx === -1) minLowIdx = Math.max(0, subset.length - 25);

  const p0GlobalIdx = offset + minLowIdx;
  const p0 = {
    idx: p0GlobalIdx,
    price: history[p0GlobalIdx].low,
    date: history[p0GlobalIdx].date,
    label: '⓪ 起跌探底低點',
  };

  // 2. 尋找 P0 之前的波段高點 anchor，作為下降趨勢線起點
  let anchorHigh = -Infinity;
  let anchorIdx = -1;
  const anchorSearchStart = Math.max(0, minLowIdx - 20);
  for (let i = anchorSearchStart; i < minLowIdx; i++) {
    if (subset[i].high > anchorHigh) {
      anchorHigh = subset[i].high;
      anchorIdx = i;
    }
  }
  if (anchorIdx === -1) {
    anchorIdx = Math.max(0, minLowIdx - 8);
    anchorHigh = subset[anchorIdx]?.high || p0.price * 1.08;
  }
  const anchorGlobalIdx = offset + anchorIdx;

  // 3. 尋找 P1: 突破下降趨勢線後創出的波段反彈高點 (頸線基準)
  let p1High = -Infinity;
  let p1Idx = -1;
  const p1SearchEnd = Math.max(minLowIdx + 3, subset.length - 3);
  for (let i = minLowIdx + 1; i < p1SearchEnd; i++) {
    if (subset[i].high > p1High) {
      p1High = subset[i].high;
      p1Idx = i;
    }
  }
  if (p1Idx === -1 || p1Idx <= minLowIdx) {
    p1Idx = Math.min(subset.length - 2, minLowIdx + 6);
    p1High = subset[p1Idx].high;
  }
  const p1GlobalIdx = offset + p1Idx;
  const p1 = {
    idx: p1GlobalIdx,
    price: history[p1GlobalIdx].high,
    date: history[p1GlobalIdx].date,
    label: '① 突破趨勢線',
  };

  const necklinePrice = p1.price;

  // 4. 尋找 P2: P1 之後拉回測試不破底的支撐低點 (Higher Low)
  let p2Low = Infinity;
  let p2Idx = -1;
  for (let i = p1Idx + 1; i < subset.length; i++) {
    if (subset[i].low < p2Low) {
      p2Low = subset[i].low;
      p2Idx = i;
    }
  }
  if (p2Idx === -1 || p2Idx <= p1Idx) {
    p2Idx = Math.min(subset.length - 1, p1Idx + 3);
    p2Low = subset[p2Idx].low;
  }
  const p2GlobalIdx = offset + p2Idx;
  const isP2HigherLow = history[p2GlobalIdx].low >= p0.price;
  const p2 = {
    idx: p2GlobalIdx,
    price: history[p2GlobalIdx].low,
    date: history[p2GlobalIdx].date,
    label: isP2HigherLow ? '② 回測不破底 (Higher Low)' : '② 回測測試支撐',
  };

  // 5. 尋找 P3: 突破頸線確認買進
  let p3Idx = -1;
  let isBreakout = false;
  for (let i = p2Idx + 1; i < subset.length; i++) {
    if (subset[i].close >= necklinePrice || subset[i].high >= necklinePrice) {
      p3Idx = i;
      isBreakout = true;
      break;
    }
  }
  if (p3Idx === -1) {
    p3Idx = subset.length - 1;
    isBreakout = history[offset + p3Idx].close >= necklinePrice;
  }
  const p3GlobalIdx = offset + p3Idx;
  const p3 = {
    idx: p3GlobalIdx,
    price: isBreakout ? history[p3GlobalIdx].close : history[p3GlobalIdx].high,
    date: history[p3GlobalIdx].date,
    label: isBreakout ? '③ 突破頸線確認買進' : '③ 挑戰頸線中',
    isBreakout,
  };

  // 下降趨勢壓力線幾何延伸
  const slope = (p1.price - anchorHigh) / Math.max(1, p1GlobalIdx - anchorGlobalIdx);
  const trendlineEndIdx = Math.min(history.length - 1, p1GlobalIdx + 8);
  const trendlineEndY = Number((anchorHigh + slope * (trendlineEndIdx - anchorGlobalIdx)).toFixed(1));

  const status: 'CONFIRMED' | 'IN_PROGRESS' | 'FAILED' = isBreakout
    ? 'CONFIRMED'
    : history[history.length - 1].low < p0.price
    ? 'FAILED'
    : 'IN_PROGRESS';

  const stopLossPrice = Number((p2.price * 0.985).toFixed(1));
  const targetPrice = Number((necklinePrice + (necklinePrice - p2.price) * 1.618).toFixed(1));

  const notes = [
    `【步驟1】自波段最低 ${p0.price} 元放量向上突破下降壓力線，衝上 ${p1.price} 元反彈峰值 (確立頸線)`,
    `【步驟2】拉回打第二隻腳最低至 ${p2.price} 元，${isP2HigherLow ? `明確守住前低 ${p0.price} 元 (Higher Low 成立)` : '回測支撐帶'}`,
    isBreakout
      ? `【步驟3】長紅帶量突破頸線 ${necklinePrice} 元，123多頭反轉結構正式確立！`
      : `【步驟3進行中】目前自第 2 隻腳向頸線 ${necklinePrice} 元推進中，等待收盤突破確認`,
  ];

  return {
    type: 'BULLISH',
    status,
    p0,
    p1,
    p2,
    p3,
    trendline: {
      x1Idx: anchorGlobalIdx,
      y1: anchorHigh,
      x2Idx: trendlineEndIdx,
      y2: trendlineEndY,
      label: '下降趨勢壓力線',
    },
    necklinePrice,
    stopLossPrice,
    targetPrice,
    notes,
  };
}
