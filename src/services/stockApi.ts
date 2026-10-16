import {
  MarketOverviewResponse,
  ScreenerResponse,
  TurnaroundScreenerResponse,
  MorningBriefingResponse,
} from '../types/stock';

/**
 * Fetch Market Overview: TAIEX, TPEx, WTX& (Futures), US 4 indices, Morning Report
 * Backed by 15-second server cache
 */
export async function fetchMarketOverview(force = false): Promise<MarketOverviewResponse | null> {
  try {
    const res = await fetch(`/api/market${force ? '?force=true' : ''}`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      console.warn(`Market API responded with status ${res.status}`);
      return null;
    }
    const data: MarketOverviewResponse = await res.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch market overview:', error);
    return null;
  }
}

/**
 * Fetch Gemini AI-powered Deep Morning Briefing
 */
export async function fetchMorningBriefing(force = false): Promise<MorningBriefingResponse | null> {
  try {
    const res = await fetch(`/api/market/morning-briefing${force ? '?force=true' : ''}`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      console.warn(`Morning briefing API responded with status ${res.status}`);
      return null;
    }
    const data: MorningBriefingResponse = await res.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch morning briefing:', error);
    return null;
  }
}

/**
 * Fetch Momentum Swing Screener Data (30-min cache)
 */
export async function fetchScreenerData(force = false): Promise<ScreenerResponse | null> {
  try {
    const res = await fetch(`/api/screener${force ? '?force=true' : ''}`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      console.warn(`Screener API responded with status ${res.status}`);
      return null;
    }
    const data: ScreenerResponse = await res.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch screener data:', error);
    return null;
  }
}

/**
 * Trigger explicit reload for momentum screener with server-side 60s cooldown protection
 */
export async function refreshScreenerData(): Promise<{ success: boolean; data?: ScreenerResponse; message?: string }> {
  try {
    const res = await fetch('/api/screener/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (res.status === 429) {
      const err = await res.json();
      return { success: false, message: err.error || '請求過於頻繁，請稍候重試' };
    }

    if (!res.ok) {
      return { success: false, message: `伺服器回應錯誤 (狀態碼: ${res.status})` };
    }

    const data: ScreenerResponse = await res.json();
    return { success: true, data };
  } catch (error: any) {
    return { success: false, message: error?.message || '網路連線異常' };
  }
}

/**
 * Fetch Turnaround Value Screener Data (30-min cache)
 */
export async function fetchTurnaroundScreenerData(force = false): Promise<TurnaroundScreenerResponse | null> {
  try {
    const res = await fetch(`/api/screener/turnaround${force ? '?force=true' : ''}`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      console.warn(`Turnaround Screener API responded with status ${res.status}`);
      return null;
    }
    const data: TurnaroundScreenerResponse = await res.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch turnaround screener data:', error);
    return null;
  }
}

/**
 * Trigger explicit reload for turnaround screener
 */
export async function refreshTurnaroundScreenerData(): Promise<{
  success: boolean;
  data?: TurnaroundScreenerResponse;
  message?: string;
}> {
  try {
    const res = await fetch('/api/screener/turnaround/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (res.status === 429) {
      const err = await res.json();
      return { success: false, message: err.error || '請求過於頻繁，請稍候重試' };
    }

    if (!res.ok) {
      return { success: false, message: `伺服器回應錯誤 (狀態碼: ${res.status})` };
    }

    const data: TurnaroundScreenerResponse = await res.json();
    return { success: true, data };
  } catch (error: any) {
    return { success: false, message: error?.message || '網路連線異常' };
  }
}

/**
 * Fetch single stock historical price & chips from server
 */
export async function fetchStockDetail(symbol: string): Promise<any | null> {
  try {
    const res = await fetch(`/api/stocks/${encodeURIComponent(symbol)}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error(`Failed to fetch stock ${symbol}:`, e);
    return null;
  }
}
