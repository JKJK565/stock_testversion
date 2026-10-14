import React, { useState, useEffect } from 'react';
import { SectorFlowItem, Stock } from '../types/stock';
import { fetchSectorFlows } from '../services/stockApi';
import {
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Flame,
  Layers,
  Sparkles,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ExternalLink,
  Search,
  Activity,
  BarChart3,
  ShieldAlert,
} from 'lucide-react';

interface SectorFlowViewProps {
  stocks: Stock[];
  onSelectStock: (stock: Stock) => void;
  colorMode: 'tw' | 'intl';
}

const DEFAULT_SECTOR_FLOWS: SectorFlowItem[] = [
  {
    id: 'semiconductor',
    sectorName: '半導體與先進封裝',
    turnoverPct: 34.8,
    turnoverPctChange: 1.6,
    flowDirection: 'INFLOW',
    sectorChangePct: 1.25,
    turnoverAmount: 1608,
    leadingStocks: [
      { symbol: '2330', name: '台積電', price: 2500, changePercent: -1.58, volume: 32540 },
      { symbol: '3711', name: '日月光投控', price: 165, changePercent: 1.85, volume: 18450 },
      { symbol: '3131', name: '弘塑', price: 1850, changePercent: 3.64, volume: 4200 },
      { symbol: '3583', name: '辛耘', price: 460, changePercent: 2.45, volume: 8120 },
    ],
    catalyst: 'CoWoS 產能吃緊至 2026 年底，台積電擴大資本支出並認列先進製程營收，設備股同創歷史波段新高。',
  },
  {
    id: 'ai_server',
    sectorName: 'AI 伺服器與代工',
    turnoverPct: 18.2,
    turnoverPctChange: -0.8,
    flowDirection: 'NEUTRAL',
    sectorChangePct: 0.45,
    turnoverAmount: 840,
    leadingStocks: [
      { symbol: '2317', name: '鴻海', price: 250, changePercent: 0.81, volume: 68420 },
      { symbol: '2382', name: '廣達', price: 326, changePercent: -0.61, volume: 24500 },
      { symbol: '6669', name: '緯穎', price: 2220, changePercent: -2.42, volume: 3120 },
      { symbol: '2356', name: '英業達', price: 52.8, changePercent: 1.15, volume: 42100 },
    ],
    catalyst: 'GB200/GB300 機櫃量產出貨動能強勁，美系四大 CSP 雲端資本支出全面上修，代工族群評價具支撐。',
  },
  {
    id: 'cpo_optics',
    sectorName: 'CPO 矽光子光通訊',
    turnoverPct: 8.9,
    turnoverPctChange: 2.4,
    flowDirection: 'INFLOW',
    sectorChangePct: 3.82,
    turnoverAmount: 411,
    leadingStocks: [
      { symbol: '3450', name: '聯鈞', price: 238, changePercent: 5.31, volume: 36800 },
      { symbol: '6442', name: '光聖', price: 485, changePercent: 4.30, volume: 12400 },
      { symbol: '3081', name: '聯亞', price: 2735, changePercent: -9.59, volume: 14500 },
      { symbol: '2345', name: '智邦', price: 620, changePercent: 2.14, volume: 6800 },
    ],
    catalyst: '800G/1.6T 光收發模組與光引擎成為高速運算標配，法人大舉轉進矽光子概念股，量價齊揚。',
  },
  {
    id: 'cooling_mechanical',
    sectorName: '散熱模組與機殼導軌',
    turnoverPct: 7.6,
    turnoverPctChange: 0.9,
    flowDirection: 'INFLOW',
    sectorChangePct: 2.18,
    turnoverAmount: 351,
    leadingStocks: [
      { symbol: '3017', name: '奇鋐', price: 3340, changePercent: -2.91, volume: 9800 },
      { symbol: '3324', name: '雙鴻', price: 840, changePercent: 1.82, volume: 8200 },
      { symbol: '2059', name: '川湖', price: 1350, changePercent: 2.66, volume: 3400 },
      { symbol: '3653', name: '健策', price: 1420, changePercent: 1.43, volume: 2900 },
    ],
    catalyst: '水冷板、快接頭 (UQD) 與分歧管滲透率飆升，奇鋐雙鴻獲外資重申加碼評等，毛利率看升。',
  },
];

export const SectorFlowView: React.FC<SectorFlowViewProps> = ({
  stocks,
  onSelectStock,
  colorMode,
}) => {
  const [sectors, setSectors] = useState<SectorFlowItem[]>(DEFAULT_SECTOR_FLOWS);
  const [loading, setLoading] = useState<boolean>(false);
  const [filterType, setFilterType] = useState<'ALL' | 'INFLOW' | 'OUTFLOW'>('ALL');
  const [selectedSectorId, setSelectedSectorId] = useState<string>('semiconductor');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchSectorFlows();
      if (data && data.length > 0) {
        setSectors(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const upColor = colorMode === 'tw' ? 'text-rose-400' : 'text-emerald-400';
  const upBg = colorMode === 'tw' ? 'bg-rose-500/10 border-rose-500/30' : 'bg-emerald-500/10 border-emerald-500/30';
  const downColor = colorMode === 'tw' ? 'text-emerald-400' : 'text-rose-400';
  const downBg = colorMode === 'tw' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30';

  const filteredSectors = sectors.filter((s) => {
    if (filterType === 'INFLOW' && s.flowDirection !== 'INFLOW') return false;
    if (filterType === 'OUTFLOW' && s.flowDirection !== 'OUTFLOW') return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = s.sectorName?.toLowerCase().includes(q);
      const matchCatalyst = s.catalyst?.toLowerCase().includes(q);
      const matchStock = s.leadingStocks?.some(
        (stk) => stk.name?.toLowerCase().includes(q) || stk.symbol?.includes(q)
      );
      if (!matchName && !matchCatalyst && !matchStock) return false;
    }
    return true;
  });

  const activeSector =
    (filteredSectors.length > 0
      ? filteredSectors.find((s) => s.id === selectedSectorId) || filteredSectors[0]
      : sectors.find((s) => s.id === selectedSectorId) || sectors[0]) || null;

  // Total calculated turnover
  const totalCoveredTurnover = sectors.reduce((acc, s) => acc + (s.turnoverAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <PieChart className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                台股產業資金輪動與金流雷達
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700/50">
                  實時成交比重分析
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                追蹤全市場資金集聚效應：成交比重突破 35% 警惕過熱，量能放大 + 均線翻揚即主力買盤介入訊號
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="搜尋族群、領頭股或題材..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500 w-52"
            />
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-medium text-slate-200 transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
            更新金流
          </button>
        </div>
      </div>

      {/* Metric Cards Top Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>今日資金最大吸金族群</span>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold text-white">半導體與先進封裝</span>
            <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">
              34.8% 比重
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            佔集中市場逾 1,600 億，台積電/日月光帶動金流增長
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>金流激增最猛暴族群</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold text-white">CPO 矽光子概念</span>
            <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
              比重 +2.4%
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            聯鈞、光聖、聯亞爆量長紅，主力換手接棒
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>高股息防禦蓄水池</span>
            <ShieldAlert className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold text-white">金控與高息 ETF</span>
            <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300">
              10.5% 比重
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            外資投信逢回買超避險，富邦金、國泰金籌碼穩健
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>核心族群總估計金額</span>
            <BarChart3 className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold text-white font-mono">
              約 {totalCoveredTurnover.toLocaleString()} 億元
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            覆蓋大盤逾 88% 成交量，能完整反映主力機構動向
          </div>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Sector ranking list */}
        <div className="lg:col-span-7 space-y-4">
          {/* Filter switcher */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setFilterType('ALL')}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  filterType === 'ALL'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                全部族群 ({sectors.length})
              </button>
              <button
                onClick={() => setFilterType('INFLOW')}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
                  filterType === 'INFLOW'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                資金淨流入 ({sectors.filter((s) => s.flowDirection === 'INFLOW').length})
              </button>
              <button
                onClick={() => setFilterType('OUTFLOW')}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
                  filterType === 'OUTFLOW'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ArrowDownRight className="w-3.5 h-3.5" />
                資金退潮 ({sectors.filter((s) => s.flowDirection === 'OUTFLOW').length})
              </button>
            </div>
            <span className="text-xs text-slate-400">點擊族群檢視領頭股與題材</span>
          </div>

          <div className="space-y-2.5">
            {filteredSectors.map((sector) => {
              const isSelected = sector.id === selectedSectorId;
              const isInflow = sector.flowDirection === 'INFLOW';
              const isOutflow = sector.flowDirection === 'OUTFLOW';

              return (
                <div
                  key={sector.id}
                  onClick={() => setSelectedSectorId(sector.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-950/40 border-indigo-500 shadow-lg shadow-indigo-950/30'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2.5 h-10 rounded-full ${
                          isInflow ? 'bg-emerald-500' : isOutflow ? 'bg-rose-500' : 'bg-slate-600'
                        }`}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-white text-base">{sector.sectorName}</h3>
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-0.5 ${
                              isInflow
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : isOutflow
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {isInflow ? (
                              <>
                                <ArrowUpRight className="w-3 h-3" />
                                主力買盤增溫
                              </>
                            ) : isOutflow ? (
                              <>
                                <ArrowDownRight className="w-3 h-3" />
                                獲利調節退潮
                              </>
                            ) : (
                              '籌碼持平盤整'
                            )}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                          <span>
                            估計成交: <strong className="text-slate-200 font-mono">{sector.turnoverAmount}</strong> 億
                          </span>
                          <span>•</span>
                          <span>
                            族群漲跌:{' '}
                            <strong
                              className={`font-mono ${
                                sector.sectorChangePct > 0 ? upColor : sector.sectorChangePct < 0 ? downColor : 'text-slate-300'
                              }`}
                            >
                              {sector.sectorChangePct > 0 ? '+' : ''}
                              {sector.sectorChangePct}%
                            </strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-black font-mono text-white">
                        {sector.turnoverPct}%
                      </div>
                      <div
                        className={`text-xs font-mono flex items-center justify-end gap-0.5 ${
                          sector.turnoverPctChange >= 0 ? upColor : downColor
                        }`}
                      >
                        {sector.turnoverPctChange >= 0 ? '+' : ''}
                        {sector.turnoverPctChange}% 比重
                      </div>
                    </div>
                  </div>

                  {/* Progress visual bar */}
                  <div className="mt-3">
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden flex">
                      <div
                        className={`h-full transition-all duration-500 ${
                          isInflow
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                            : isOutflow
                            ? 'bg-gradient-to-r from-rose-500 to-amber-500'
                            : 'bg-indigo-500'
                        }`}
                        style={{ width: `${Math.min(100, sector.turnoverPct * 2.8)}%` }}
                      />
                    </div>
                  </div>

                  {/* Leading Stock quick pills */}
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
                    <span className="text-[11px] text-slate-500">焦點股:</span>
                    {sector.leadingStocks.map((stk) => (
                      <span
                        key={stk.symbol}
                        onClick={(e) => {
                          e.stopPropagation();
                          const found = stocks.find((s) => s.symbol === stk.symbol);
                          if (found) onSelectStock(found);
                        }}
                        className="text-xs font-mono px-2 py-0.5 rounded bg-slate-950 hover:bg-indigo-900/50 hover:border-indigo-500/50 border border-slate-800 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5"
                      >
                        <span>{stk.name}</span>
                        <span className="text-[10px] text-slate-500">{stk.symbol}</span>
                        <span
                          className={`font-semibold ${
                            stk.changePercent >= 0 ? upColor : downColor
                          }`}
                        >
                          {stk.changePercent >= 0 ? '+' : ''}
                          {stk.changePercent}%
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Detailed Deep Dive for selected sector */}
        <div className="lg:col-span-5 space-y-4">
          {activeSector ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sticky top-20 shadow-xl space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <span className="text-xs font-bold text-indigo-400 tracking-wider uppercase">
                    SECTOR FOCUS
                  </span>
                  <h3 className="text-xl font-bold text-white mt-0.5 flex items-center gap-2">
                    {activeSector.sectorName}
                    <span className="text-xs font-normal text-slate-400 font-mono">
                      ({activeSector.turnoverPct}% 大盤佔比)
                    </span>
                  </h3>
                </div>
                <div
                  className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${
                    activeSector.flowDirection === 'INFLOW'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : activeSector.flowDirection === 'OUTFLOW'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  {activeSector.flowDirection === 'INFLOW'
                    ? '買盤積極湧入'
                    : activeSector.flowDirection === 'OUTFLOW'
                    ? '減碼資金外流'
                    : '區間高低換手'}
                </div>
              </div>

              {/* Catalyst & Driver Narrative */}
              <div>
                <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  關鍵市場催化劑與基本面題材
                </h4>
                <div className="bg-slate-950 border border-slate-800/90 rounded-lg p-3.5 text-xs leading-relaxed text-slate-300">
                  {activeSector.catalyst}
                </div>
              </div>

              {/* Leading Stocks detail card */}
              <div>
                <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-2.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  族群權重與指標股報價 (點選立即切換技術圖表)
                </h4>
                <div className="space-y-2">
                  {activeSector.leadingStocks?.map((stk) => {
                    const targetStock = stocks.find((s) => s.symbol === stk.symbol);

                    return (
                      <div
                        key={stk.symbol}
                        onClick={() => {
                          if (targetStock) onSelectStock(targetStock);
                        }}
                        className="p-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-indigo-500 hover:bg-slate-850 cursor-pointer transition-all flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-xs font-bold font-mono text-indigo-300 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            {stk.symbol.slice(0, 4)}
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm flex items-center gap-1.5">
                              {stk.name}
                              <span className="text-[11px] text-slate-500 font-mono">
                                ({stk.symbol})
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              成交量: {stk.volume?.toLocaleString() ?? 0} 張
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-bold font-mono text-white text-sm">
                            {stk.price?.toLocaleString() ?? '--'} 元
                          </div>
                          <div
                            className={`text-xs font-mono font-semibold flex items-center justify-end gap-1 ${
                              (stk.changePercent ?? 0) >= 0 ? upColor : downColor
                            }`}
                          >
                            {(stk.changePercent ?? 0) >= 0 ? '+' : ''}
                            {stk.changePercent}%
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Teaching logic note from guide */}
              <div className="bg-indigo-950/30 border border-indigo-800/40 rounded-xl p-3.5 text-xs text-indigo-200 space-y-1.5">
                <div className="font-bold text-indigo-300 flex items-center gap-1.5">
                  💡 操盤講義：資金輪動篩選法
                </div>
                <p className="text-[11px] text-slate-300 leading-normal">
                  1. <strong>觀察領頭羊：</strong>若族群龍頭股（如 2330、2382、3017）開盤 30 分鐘內放量上攻，次級概念股將迎來補漲效應。<br />
                  2. <strong>防禦過熱警訊：</strong>單一產業比重若連續 3 天超過 40%，易引發主力短線拉高倒貨，應提高警覺減碼應對。<br />
                  3. <strong>低基期接棒：</strong>留意成交比重自 2% 爬升至 8% 且均線多頭排列的族群，通常為中波段黑馬股起源。
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
              無符合選取條件的族群
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
