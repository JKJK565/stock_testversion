import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Search,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  Building2,
  PlusCircle,
  Sparkles,
  ShieldAlert,
  Flame,
  Activity,
  Layers,
  Check,
  RefreshCw,
  Compass,
} from 'lucide-react';
import { StrategyAuditResponse } from '../types/stock';

interface StockStrategyAuditModalProps {
  symbol: string | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenStockDetail?: (symbol: string) => void;
  onAddToPortfolio?: (symbol: string) => Promise<boolean> | void;
  isInPortfolio?: boolean;
}

const SAMPLE_CHIPS = [
  { code: '2330', name: '台積電' },
  { code: '2344', name: '華邦電' },
  { code: '2603', name: '長榮' },
  { code: '3037', name: '欣興' },
  { code: '6278', name: '台表科' },
  { code: '2454', name: '聯發科' },
];

export function StockStrategyAuditModal({
  symbol,
  isOpen,
  onClose,
  onOpenStockDetail,
  onAddToPortfolio,
  isInPortfolio = false,
}: StockStrategyAuditModalProps) {
  const [activeCode, setActiveCode] = useState<string>(symbol || '');
  const [searchInput, setSearchInput] = useState<string>(symbol || '');
  const [data, setData] = useState<StrategyAuditResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addedSuccess, setAddedSuccess] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Sync prop changes
  useEffect(() => {
    if (isOpen) {
      const code = (symbol || '').trim();
      setActiveCode(code);
      setSearchInput(code);
      setAddedSuccess(false);
      setError(null);

      // Auto focus search input
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 100);

      if (code && /^[1-9][0-9]{3}$/.test(code)) {
        fetchAuditData(code);
      } else {
        setData(null);
        setLoading(false);
      }
    } else {
      setData(null);
      setError(null);
    }
  }, [isOpen, symbol]);

  const fetchAuditData = (targetCode: string) => {
    setLoading(true);
    setError(null);
    setAddedSuccess(false);

    fetch(`/api/stocks/${targetCode}/strategy-audit`)
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `健檢查詢失敗 (狀態碼 ${res.status})`);
        }
        return res.json();
      })
      .then((resData: StrategyAuditResponse) => {
        setData(resData);
        setActiveCode(targetCode);
        setLoading(false);
      })
      .catch((err: any) => {
        setError(err.message || '查詢發生異常');
        setLoading(false);
      });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = searchInput.trim();
    if (!/^[1-9][0-9]{3}$/.test(clean)) {
      setError('請輸入正確的 4 碼台股代號 (如 2330)');
      return;
    }
    fetchAuditData(clean);
  };

  const handleChipClick = (code: string) => {
    setSearchInput(code);
    fetchAuditData(code);
  };

  if (!isOpen) return null;

  const currentSymbolForAdd = data?.symbol || activeCode;

  const handleAdd = async () => {
    if (!currentSymbolForAdd || isInPortfolio || addedSuccess) return;
    if (onAddToPortfolio) {
      await onAddToPortfolio(currentSymbolForAdd);
      setAddedSuccess(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-750 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header with Search Bar */}
        <div className="px-5 sm:px-7 py-4 border-b border-slate-800 bg-slate-950/70 sticky top-0 z-10 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 via-amber-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-950/40 flex-shrink-0">
                <Search className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <span>個股量化雙策略健檢</span>
                  {data && (
                    <span className="text-sm font-mono font-bold text-amber-400">
                      {data.symbol} {data.name}
                    </span>
                  )}
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer flex-shrink-0"
              title="關閉"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Prominent Search Bar with AutoFocus */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex items-center gap-2 bg-slate-950/90 border border-slate-700/80 focus-within:border-indigo-500 rounded-2xl px-3.5 py-2 shadow-inner transition-colors"
          >
            <Search className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              autoFocus
              maxLength={4}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="輸入 4 碼台股代號 (例: 2330) 即時透視策略評級與籌碼"
              className="flex-1 bg-transparent text-sm font-mono text-white placeholder-slate-500 focus:outline-none"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  inputRef.current?.focus();
                }}
                className="p-1 text-slate-500 hover:text-white transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold transition flex items-center gap-1 shadow cursor-pointer active:scale-95 flex-shrink-0 disabled:opacity-50"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>{loading ? '分析中...' : '查詢健檢'}</span>
            </button>
          </form>

          {/* Quick Sample Chips */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-500 text-[11px] mr-1">熱門健檢：</span>
            {SAMPLE_CHIPS.map((chip) => (
              <button
                key={chip.code}
                type="button"
                onClick={() => handleChipClick(chip.code)}
                className={`px-2 py-0.5 rounded-lg border text-[11px] font-mono transition cursor-pointer ${
                  activeCode === chip.code
                    ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300 font-bold'
                    : 'bg-slate-800/80 hover:bg-slate-750 border-slate-700/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                {chip.code} {chip.name}
              </button>
            ))}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-6 flex-1 text-slate-200">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 via-amber-500 to-indigo-600 animate-spin flex items-center justify-center p-0.5">
                <div className="w-full h-full bg-slate-900 rounded-xl flex items-center justify-center">
                  <Activity className="w-6 h-6 text-amber-400 animate-pulse" />
                </div>
              </div>
              <div>
                <p className="text-base font-bold text-white">正在全維度分析 {activeCode} 量化指標...</p>
                <p className="text-xs text-slate-400 mt-1">連線即時撮合、近一年高低位階、均線斜率、投信籌碼與主力分點</p>
              </div>
            </div>
          ) : error ? (
            <div className="p-6 rounded-2xl bg-rose-950/40 border border-rose-500/50 text-center space-y-3">
              <XCircle className="w-10 h-10 text-rose-400 mx-auto" />
              <h4 className="text-base font-bold text-white">查詢失敗</h4>
              <p className="text-xs sm:text-sm text-rose-300">{error}</p>
              <div className="flex justify-center gap-2 pt-2">
                <button
                  onClick={() => {
                    setError(null);
                    inputRef.current?.focus();
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition cursor-pointer"
                >
                  重新輸入
                </button>
              </div>
            </div>
          ) : !data ? (
            /* Welcome / Empty state */
            <div className="py-16 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400">
                <Compass className="w-8 h-8 animate-pulse" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white">輸入台股 4 碼代號開始策略體檢</h4>
                <p className="text-xs sm:text-sm text-slate-400 mt-1.5 max-w-md mx-auto">
                  即時透視【強勢動能突破】與【低基期價值轉型】兩大量化門檻審查，並結合法人籌碼與主力分點定調屬性。
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* 板塊 1: 即時基本體檢 */}
              <section className="rounded-2xl bg-slate-950/80 border border-slate-800 p-4 sm:p-5 shadow-inner">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl sm:text-3xl font-black font-mono text-white">
                      ${data.price.toFixed(2)}
                    </span>
                    <div
                      className={`flex items-center gap-1 font-mono font-bold text-sm sm:text-base px-2.5 py-1 rounded-xl ${
                        data.change >= 0
                          ? 'bg-rose-500/15 border border-rose-500/40 text-rose-400'
                          : 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-400'
                      }`}
                    >
                      {data.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      <span>{data.change >= 0 ? '+' : ''}{data.change.toFixed(2)}</span>
                      <span>({data.changePercent >= 0 ? '+' : ''}{data.changePercent.toFixed(2)}%)</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {data.industryTheme && (
                      <span className="text-xs px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-semibold">
                        {data.industryTheme}
                      </span>
                    )}
                    {data.isPriorityWhiteList && (
                      <span className="text-xs px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/40 text-amber-300 font-bold">
                        ★ 五大核心產業
                      </span>
                    )}
                    <span className="text-[11px] text-slate-500 font-mono">
                      撮合更新：{data.updateTime}
                    </span>
                  </div>
                </div>

                {/* 關鍵數值指標 Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                    <div className="text-slate-400 text-[11px]">5MA / 10MA / 20MA</div>
                    <div className="text-white font-bold mt-1">
                      ${data.ma5} / ${data.ma10} / ${data.ma20}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                    <div className="text-slate-400 text-[11px]">20MA 乖離率</div>
                    <div className={`font-bold mt-1 ${data.bias20ma > 10 ? 'text-rose-400' : 'text-slate-200'}`}>
                      {data.bias20ma > 0 ? '+' : ''}{data.bias20ma}%
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                    <div className="text-slate-400 text-[11px]">20日 ATR 波動度</div>
                    <div className="text-white font-bold mt-1">
                      {data.atrPct}% (${data.atr20})
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                    <div className="text-slate-400 text-[11px]">成交量 / 5日均量</div>
                    <div className="text-white font-bold mt-1">
                      {data.volume.toLocaleString()} / {data.volumeAvg5d.toLocaleString()} 張 ({data.volumeRatio}x)
                    </div>
                  </div>
                </div>
              </section>

              {/* 板塊 2: 【強勢動能突破策略】審查清單 */}
              <section className="rounded-2xl bg-slate-950/80 border border-slate-800 p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-amber-400" />
                    <h4 className="text-sm sm:text-base font-bold text-white">
                      1.【強勢動能突破策略】逐項審查
                    </h4>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                      data.momentum.isMatched
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    {data.momentum.isMatched ? '✅ 符合策略標準' : '❌ 未達標'}
                  </span>
                </div>

                {/* 逐項 Checklist */}
                <div className="space-y-2.5">
                  {data.momentum.checks.map((chk, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        {chk.passed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                        )}
                        <span className="font-bold text-white">{chk.name}</span>
                        <span className="text-slate-400 text-[11px]">({chk.target})</span>
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-auto font-mono">
                        <span className="text-slate-300">{chk.actual}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            chk.passed
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {chk.passed ? '符合' : '未過'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 結論說明 */}
                <div
                  className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                    data.momentum.isMatched
                      ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
                      : 'bg-slate-900 border-slate-800 text-slate-300'
                  }`}
                >
                  <strong className="text-white block mb-0.5">動能結論：</strong>
                  {data.momentum.verdict}
                </div>
              </section>

              {/* 板塊 3: 【低基期價值轉型策略】審查清單 */}
              <section className="rounded-2xl bg-slate-950/80 border border-slate-800 p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-400" />
                    <h4 className="text-sm sm:text-base font-bold text-white">
                      2.【低基期價值轉型策略】逐項審查
                    </h4>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                      data.turnaround.isMatched
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    {data.turnaround.isMatched ? '✅ 符合策略標準' : '❌ 未達標'}
                  </span>
                </div>

                {/* 逐項 Checklist */}
                <div className="space-y-2.5">
                  {data.turnaround.checks.map((chk, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        {chk.passed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                        )}
                        <span className="font-bold text-white">{chk.name}</span>
                        <span className="text-slate-400 text-[11px]">({chk.target})</span>
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-auto font-mono">
                        <span className="text-slate-300">{chk.actual}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            chk.passed
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {chk.passed ? '符合' : '未過'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 結論說明 */}
                <div
                  className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                    data.turnaround.isMatched
                      ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
                      : 'bg-slate-900 border-slate-800 text-slate-300'
                  }`}
                >
                  <strong className="text-white block mb-0.5">轉型結論：</strong>
                  {data.turnaround.verdict}
                </div>
              </section>

              {/* 板塊 4: 【籌碼屬性定調】 */}
              <section className="rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    <h4 className="text-sm sm:text-base font-bold text-white">
                      3.【籌碼屬性定調】
                    </h4>
                  </div>
                  <span
                    className={`text-xs px-3 py-1 rounded-xl font-bold border shadow-sm ${
                      data.chipsAttribute.badgeColor === 'emerald'
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                        : data.chipsAttribute.badgeColor === 'amber'
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                        : data.chipsAttribute.badgeColor === 'rose'
                        ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                        : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    {data.chipsAttribute.badge}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {data.chipsAttribute.description}
                </p>

                {/* 籌碼消長細節 */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono pt-1">
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                    <div className="text-slate-400 text-[11px]">投信今日買賣超</div>
                    <div className={`font-bold mt-1 ${data.chipsAttribute.trustNetLotsToday >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {data.chipsAttribute.trustNetLotsToday >= 0 ? '+' : ''}{data.chipsAttribute.trustNetLotsToday.toLocaleString()} 張
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                    <div className="text-slate-400 text-[11px]">外資今日買賣超</div>
                    <div className={`font-bold mt-1 ${data.chipsAttribute.foreignNetLotsToday >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {data.chipsAttribute.foreignNetLotsToday >= 0 ? '+' : ''}{data.chipsAttribute.foreignNetLotsToday.toLocaleString()} 張
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                    <div className="text-slate-400 text-[11px]">融資單日消長</div>
                    <div className={`font-bold mt-1 ${data.chipsAttribute.marginChangeLotsToday > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {data.chipsAttribute.marginChangeLotsToday > 0 ? '+' : ''}{data.chipsAttribute.marginChangeLotsToday.toLocaleString()} 張
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                    <div className="text-slate-400 text-[11px]">5日主力買超首選</div>
                    <div className="text-white font-bold mt-1 truncate" title={data.chipsAttribute.topBuyBroker || '無顯著券商'}>
                      {data.chipsAttribute.topBuyBroker || '無顯著券商'}
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 sm:px-7 py-4 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3 sticky bottom-0">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition cursor-pointer"
          >
            關閉
          </button>

          <div className="flex items-center gap-2.5">
            {onOpenStockDetail && currentSymbolForAdd && (
              <button
                onClick={() => {
                  onClose();
                  onOpenStockDetail(currentSymbolForAdd);
                }}
                className="px-4 py-2.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>查看主力分點籌碼</span>
              </button>
            )}

            {onAddToPortfolio && currentSymbolForAdd && (
              <button
                onClick={handleAdd}
                disabled={isInPortfolio || addedSuccess}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-60 ${
                  isInPortfolio || addedSuccess
                    ? 'bg-emerald-600/20 border border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-900/40 active:scale-95'
                }`}
              >
                {isInPortfolio || addedSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>已在自選清單</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" />
                    <span>＋ 納入自選追蹤</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
