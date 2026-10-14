import React, { useState } from 'react';
import { Stock, StockNewsItem, CommodityRelation } from '../types/stock';
import {
  Search,
  Newspaper,
  Layers,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Flame,
  ArrowUpRight,
  ExternalLink,
  Target,
  Sparkles,
  BarChart3,
  Calendar,
  AlertTriangle,
  Building,
  Wallet,
  Star,
} from 'lucide-react';

interface StockDeepResearchModalProps {
  stock: Stock;
  isOpen: boolean;
  onClose: () => void;
  onSelectStock: (stock: Stock) => void;
  onOpenChart: (stock: Stock) => void;
  onOpenPaperTrade?: (stock: Stock) => void;
  colorMode: 'tw' | 'intl';
  watchlistSymbols?: string[];
  onToggleWatchlist?: (stock: Stock) => void;
}

export const StockDeepResearchModal: React.FC<StockDeepResearchModalProps> = ({
  stock,
  isOpen,
  onClose,
  onSelectStock,
  onOpenChart,
  onOpenPaperTrade,
  colorMode,
  watchlistSymbols = [],
  onToggleWatchlist,
}) => {
  if (!isOpen) return null;

  const isRedUp = colorMode === 'tw';
  const upColor = isRedUp ? '#ef4444' : '#10b981';
  const downColor = isRedUp ? '#10b981' : '#ef4444';

  const [activeTab, setActiveTab] = useState<'news' | 'commodities' | 'brokers' | 'decision'>('news');

  const newsList: StockNewsItem[] = stock.news || [];
  const commoditiesList: CommodityRelation[] = stock.commodities || [];
  const brokerAlerts = stock.chips.brokerAlerts || [];
  const decision = stock.decision;
  const isWatchlisted = watchlistSymbols.includes(stock.symbol);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-base">
              {stock.symbol.slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white tracking-tight">{stock.name}</h3>
                <span className="font-mono text-sm text-slate-400">{stock.symbol}</span>
                <span className="text-xs text-slate-400">{stock.industry} · {stock.market}</span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs font-mono">
                <span className="text-lg font-bold" style={{ color: stock.change >= 0 ? upColor : downColor }}>
                  {stock.price.toFixed(1)} 元
                </span>
                <span className="font-semibold" style={{ color: stock.change >= 0 ? upColor : downColor }}>
                  {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(1)} ({stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%)
                </span>
                <span className="text-slate-400">總成交量: {stock.volume.toLocaleString()} 張</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onToggleWatchlist && (
              <button
                onClick={() => onToggleWatchlist(stock)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 ${
                  isWatchlisted
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                }`}
                title={isWatchlisted ? '已加入自選 (點擊移除)' : '加入自選股'}
              >
                <Star className={`w-3.5 h-3.5 ${isWatchlisted ? 'fill-amber-400 text-amber-400' : ''}`} />
                <span>{isWatchlisted ? '已在自選' : '加自選'}</span>
              </button>
            )}
            {onOpenPaperTrade && (
              <button
                onClick={() => {
                  onOpenPaperTrade(stock);
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg bg-amber-600/30 hover:bg-amber-600 border border-amber-500/50 hover:border-amber-500 text-amber-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Wallet className="w-3.5 h-3.5 text-amber-400" />
                模擬實測下單
              </button>
            )}
            <button
              onClick={() => {
                onOpenChart(stock);
                onClose();
              }}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              查看技術圖表
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 text-base"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="px-5 bg-slate-950/50 border-b border-slate-800 flex items-center gap-2 text-xs">
          <button
            onClick={() => setActiveTab('news')}
            className={`py-3 px-3 font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'news'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Newspaper className="w-4 h-4" />
            各股重大新聞消息 ({newsList.length})
          </button>
          <button
            onClick={() => setActiveTab('commodities')}
            className={`py-3 px-3 font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'commodities'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            原物料狀況與上下游鏈 ({commoditiesList.length})
          </button>
          <button
            onClick={() => setActiveTab('brokers')}
            className={`py-3 px-3 font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'brokers'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Building className="w-4 h-4" />
            【籌碼追蹤】主力買賣超與隔日沖 ({brokerAlerts.length})
          </button>
          <button
            onClick={() => setActiveTab('decision')}
            className={`py-3 px-3 font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'decision'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Target className="w-4 h-4 text-emerald-400" />
            【雙重評定】講義決策與現價進場時機
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* TAB 1: 重大新聞消息 */}
          {activeTab === 'news' && (
            <div className="space-y-3">
              {newsList.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  目前暫無針對此個股之重大異常新聞消息。
                </div>
              ) : (
                newsList.map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                            item.sentiment === 'bullish'
                              ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                              : item.sentiment === 'bearish'
                              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                              : 'bg-slate-800 border-slate-700 text-slate-300'
                          }`}
                        >
                          {item.category}
                        </span>
                        <h4 className="font-bold text-white text-sm">{item.title}</h4>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                        <span>{item.source}</span>
                        <span>·</span>
                        <span>{item.time}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed pl-1">
                      {item.summary}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: 原物料狀況與上下游鏈 */}
          {activeTab === 'commodities' && (
            <div className="space-y-4">
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-indigo-300">
                  <Sparkles className="w-4 h-4" />
                  產業供應鏈定位分析
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-300 pt-1">
                  <div>
                    <span className="text-slate-400 font-medium">上游原物料與零組件：</span>
                    <p className="text-white mt-0.5">{stock.industry} 關鍵原物料供應鏈</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">終端需求與應用市場：</span>
                    <p className="text-white mt-0.5">全球AI算力中心、旗艦消費性電子與外貿出口</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  關鍵原物料成本與產品報價走勢監控
                </h4>
                {commoditiesList.map((comm, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded">
                          {comm.relationType}
                        </span>
                        <span className="font-bold text-white text-sm">{comm.name}</span>
                      </div>
                      <p className="text-slate-300 text-xs pt-1 leading-relaxed">
                        {comm.impactDescription}
                      </p>
                    </div>

                    <div className="text-right font-mono bg-slate-900 p-2.5 rounded-lg border border-slate-800/80 shrink-0">
                      <div className="text-white font-bold">{comm.price}</div>
                      <div
                        className={`text-xs font-semibold ${
                          comm.change.startsWith('+') ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {comm.change} ({comm.trend === 'up' ? '上揚' : comm.trend === 'down' ? '回檔' : '平穩'})
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: 籌碼追蹤 (買方、賣方、標記短線大戶 vs 長線大戶囤貨) */}
          {activeTab === 'brokers' && (
            <div className="space-y-4">
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-xs space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="font-bold flex items-center gap-2 text-white text-sm">
                    <Building className="w-4 h-4 text-indigo-400" />
                    【籌碼追蹤】買方與賣方主力分點深度解析
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 font-semibold">
                      ⚡ 短線隔日沖大戶
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-semibold">
                      🏦 長線主力囤貨
                    </span>
                    <span className="px-2 py-0.5 rounded bg-sky-500/20 border border-sky-500/40 text-sky-300 font-semibold">
                      🌐 外資法人調節
                    </span>
                  </div>
                </div>
                <p className="leading-relaxed text-slate-400">
                  即時盤後籌碼解析：詳細區分買方與賣方券商。短線隔日沖大戶（如凱基台北、富邦嘉義、凱基虎尾、美林短線單）鎖碼後次日早盤易衝高倒貨；長線波段主力（如元大總公司、富邦總公司）買超則具連續護盤吸籌慣性。
                </p>
              </div>

              {(() => {
                const buyers = brokerAlerts.filter((b) => b.action === 'buy');
                const sellers = brokerAlerts.filter((b) => b.action === 'sell');
                const totalBuyVol = buyers.reduce((sum, b) => sum + b.volume, 0);
                const totalSellVol = sellers.reduce((sum, b) => sum + b.volume, 0);
                const hasShortTermWhale = brokerAlerts.some((b) =>
                  b.broker.includes('凱基') ||
                  b.broker.includes('嘉義') ||
                  b.broker.includes('虎尾') ||
                  b.broker.includes('市政') ||
                  b.note.includes('隔日沖')
                );

                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                      <div className="bg-rose-950/20 border border-rose-800/40 p-3 rounded-xl">
                        <span className="text-rose-400 text-[11px] block">主力買方合計</span>
                        <strong className="text-rose-300 text-base font-bold">+{totalBuyVol.toLocaleString()} 張</strong>
                        <span className="text-slate-400 text-[10px] block mt-0.5">主要買超 {buyers.length} 分點</span>
                      </div>
                      <div className="bg-emerald-950/20 border border-emerald-800/40 p-3 rounded-xl">
                        <span className="text-emerald-400 text-[11px] block">主力賣方合計</span>
                        <strong className="text-emerald-300 text-base font-bold">-{totalSellVol.toLocaleString()} 張</strong>
                        <span className="text-slate-400 text-[10px] block mt-0.5">主要調節 {sellers.length} 分點</span>
                      </div>
                      <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                        <span className="text-slate-400 text-[11px] block">隔日沖風險狀態</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {hasShortTermWhale ? (
                            <span className="text-amber-400 font-bold text-xs flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                              高（次日早盤慎防衝高倒貨）
                            </span>
                          ) : (
                            <span className="text-emerald-400 font-bold text-xs">
                              正常（長線波段籌碼居多）
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Buyers Section */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5" />
                        【買超前列分點】買方主力陣容
                      </h4>
                      {buyers.length === 0 ? (
                        <div className="py-4 text-center text-slate-500 text-xs">無顯著買超分點</div>
                      ) : (
                        buyers.map((b, idx) => {
                          const isShortTerm =
                            b.broker.includes('凱基') ||
                            b.broker.includes('嘉義') ||
                            b.broker.includes('虎尾') ||
                            b.broker.includes('市政') ||
                            (b.broker.includes('美林') && b.note.includes('隔日沖')) ||
                            b.note.includes('隔日沖');
                          const isLongTerm =
                            b.broker.includes('總公司') ||
                            b.note.includes('波段') ||
                            b.note.includes('吸籌') ||
                            b.note.includes('長線') ||
                            b.note.includes('增持') ||
                            b.note.includes('第一') ||
                            b.note.includes('第二');

                          return (
                            <div
                              key={idx}
                              className="bg-slate-950/80 border border-slate-800/90 hover:border-slate-700 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                            >
                              <div className="space-y-1">
                                <div className="font-bold text-white text-sm flex items-center gap-2 flex-wrap">
                                  <span>{b.broker}</span>
                                  <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/40 text-rose-300">
                                    買超 +{b.volume.toLocaleString()} 張
                                  </span>
                                  {isShortTerm ? (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                      ⚡ 短線隔日沖大戶
                                    </span>
                                  ) : isLongTerm ? (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                      🏦 長線波段囤貨
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                                      📈 法人主力買盤
                                    </span>
                                  )}
                                </div>
                                <p className="text-slate-400 text-xs">{b.note}</p>
                              </div>

                              <div className="text-right shrink-0">
                                {isShortTerm ? (
                                  <span className="text-amber-400 font-mono text-[11px] font-semibold bg-amber-950/60 border border-amber-800/80 px-2 py-1 rounded inline-block">
                                    次日早盤易衝高倒貨
                                  </span>
                                ) : (
                                  <span className="text-emerald-400 font-mono text-[11px] font-semibold bg-emerald-950/60 border border-emerald-800/80 px-2 py-1 rounded inline-block">
                                    波段支撐力道強
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Sellers Section */}
                    <div className="space-y-2 pt-2">
                      <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                        <TrendingDown className="w-3.5 h-3.5" />
                        【賣超調節分點】賣方主力陣容
                      </h4>
                      {sellers.length === 0 ? (
                        <div className="bg-slate-950/50 border border-slate-800/60 rounded-xl p-3 text-slate-400 text-xs">
                          今日無巨額賣超或洗盤分點，賣壓相對輕盈。
                        </div>
                      ) : (
                        sellers.map((b, idx) => (
                          <div
                            key={idx}
                            className="bg-slate-950/80 border border-slate-800/90 hover:border-slate-700 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                          >
                            <div className="space-y-1">
                              <div className="font-bold text-white text-sm flex items-center gap-2 flex-wrap">
                                <span>{b.broker}</span>
                                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                                  賣超 -{b.volume.toLocaleString()} 張
                                </span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/40">
                                  🌐 外資/短線獲利了結
                                </span>
                              </div>
                              <p className="text-slate-400 text-xs">{b.note}</p>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="text-slate-400 font-mono text-[11px] bg-slate-900 border border-slate-800 px-2 py-1 rounded inline-block">
                                逢高調節賣壓
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 4: 雙重評定（評定一：講義趨勢型態 + 評定二：現階段當下價位適不適合買） */}
          {activeTab === 'decision' && decision && (
            <div className="space-y-4">
              {/* 評定二：【現階段價位與進場時機評定】— 放在最醒目頂部！ */}
              <div
                className={`p-4 rounded-xl border text-xs space-y-3 ${
                  decision.entryTiming?.suitability === 'DO_NOT_CHASE'
                    ? 'bg-rose-950/30 border-rose-700/60'
                    : decision.entryTiming?.suitability === 'WAIT_PULLBACK'
                    ? 'bg-amber-950/30 border-amber-700/60'
                    : decision.entryTiming?.suitability === 'SUITABLE_NOW'
                    ? 'bg-emerald-950/30 border-emerald-700/60'
                    : 'bg-indigo-950/30 border-indigo-700/60'
                }`}
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      【評定二】現階段價位與進場時機即時判斷
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 font-mono">
                      針對當下現價 {stock.price} 元 · 5MA乖離 {decision.entryTiming?.bias5ma > 0 ? '+' : ''}{decision.entryTiming?.bias5ma}%
                    </span>
                  </div>

                  <span
                    className={`font-bold px-3 py-1 rounded-lg text-xs tracking-wide shadow-sm flex items-center gap-1.5 ${
                      decision.entryTiming?.suitability === 'DO_NOT_CHASE'
                        ? 'bg-rose-600 text-white animate-pulse'
                        : decision.entryTiming?.suitability === 'WAIT_PULLBACK'
                        ? 'bg-amber-600 text-white'
                        : decision.entryTiming?.suitability === 'SUITABLE_NOW'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-indigo-600 text-white'
                    }`}
                  >
                    {decision.entryTiming?.suitability === 'DO_NOT_CHASE' && <AlertTriangle className="w-3.5 h-3.5" />}
                    {decision.entryTiming?.label || (decision.entryTiming?.bias5ma > 6 ? '🚨 短線過熱・嚴禁追高' : '🟢 適宜切入・回測守均線')}
                  </span>
                </div>

                {/* Advice Content */}
                <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-lg space-y-2">
                  <div className="font-bold text-white text-sm flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    實戰叮嚀：{decision.entryTiming?.timingAdvice}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
                    <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">短線5MA乖離率</span>
                      <strong className={`text-sm font-mono ${decision.entryTiming?.bias5ma > 5 ? 'text-rose-400 font-bold' : 'text-slate-200'}`}>
                        {decision.entryTiming?.bias5ma > 0 ? '+' : ''}{decision.entryTiming?.bias5ma}%
                      </strong>
                      <span className="text-slate-500 text-[10px] block">{decision.entryTiming?.bias5ma > 5 ? '乖離過大易拉回' : '均線附近風險可控'}</span>
                    </div>

                    <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">隔日沖倒貨風險</span>
                      <strong className={`text-sm font-mono ${decision.entryTiming?.overnightDumpingRisk === 'HIGH' ? 'text-rose-400 font-bold' : 'text-emerald-400'}`}>
                        {decision.entryTiming?.overnightDumpingRisk === 'HIGH' ? '⚠️ 高（短線分點鎖碼）' : '良好'}
                      </strong>
                      <span className="text-slate-500 text-[10px] block">次日開盤不追高點</span>
                    </div>

                    <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">建議安全進場區間</span>
                      <strong className="text-sm font-mono text-emerald-400">
                        {decision.entryTiming?.idealBuyZone?.min || decision.entryPrice} ~ {decision.entryTiming?.idealBuyZone?.max || (decision.entryPrice * 1.02).toFixed(1)} 元
                      </strong>
                      <span className="text-slate-500 text-[10px] block">{decision.entryTiming?.idealBuyZone?.description || '回測均線支撐點'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 評定一：【講義趨勢與型態總體評定】 */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs text-slate-400 flex items-center gap-1.5">
                    <span>【評定一】講義趨勢與型態總體評定 (中長線架構)</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`text-xl font-bold px-3 py-1 rounded-lg border ${
                        decision.verdict === 'STRONG_BUY'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : decision.verdict === 'BUY'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : decision.verdict === 'WATCH'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {decision.verdict === 'STRONG_BUY'
                        ? '🔥 強烈多頭趨勢'
                        : decision.verdict === 'BUY'
                        ? '🟢 偏多買進訊號'
                        : decision.verdict === 'WATCH'
                        ? '🟡 區間觀望'
                        : decision.verdict === 'TRIM'
                        ? '🟠 逢高減碼'
                        : '🛑 破線賣出'}
                    </span>
                    <span className="text-sm font-mono text-slate-400">
                      型態評分: <strong className="text-white text-base">{decision.score}</strong> / 100
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 pt-1">{decision.reason}</p>
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs font-mono bg-slate-900 p-3 rounded-xl border border-slate-800 w-full sm:w-auto">
                  <div>
                    <span className="text-slate-400 text-[11px] block">原進場基準價</span>
                    <strong className="text-white text-sm">{decision.entryPrice}</strong>
                  </div>
                  <div>
                    <span className="text-rose-400 text-[11px] block">停損價(當周低)</span>
                    <strong className="text-rose-400 text-sm">{decision.stopLossPrice}</strong>
                  </div>
                  <div>
                    <span className="text-emerald-400 text-[11px] block">目標價 (盈虧比1:{decision.riskRewardRatio})</span>
                    <strong className="text-emerald-400 text-sm">{decision.targetPrice}</strong>
                  </div>
                </div>
              </div>

              {/* Checklist */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2.5 text-xs">
                <div className="font-bold text-white flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-indigo-400" />
                  講義投資人進場前必備功課檢核表 (Checklist)
                </div>
                <div className="space-y-1.5 text-slate-300">
                  {decision.keyNotes.map((note, i) => (
                    <div key={i} className="flex items-start gap-2 bg-slate-900/60 p-2 rounded-lg">
                      <span className="text-indigo-400 font-bold">✓</span>
                      <span>{note}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
