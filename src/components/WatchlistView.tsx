import React, { useState } from 'react';
import { Stock } from '../types/stock';
import {
  Search,
  Plus,
  Trash2,
  TrendingUp,
  BarChart2,
  ShieldAlert,
  Activity,
  ArrowUpDown,
  Sparkles,
  Layers,
  Newspaper,
} from 'lucide-react';

interface WatchlistViewProps {
  stocks: Stock[];
  watchlistSymbols: string[];
  selectedSymbol: string;
  colorMode: 'tw' | 'intl';
  onSelectStock: (stock: Stock) => void;
  onToggleWatchlist: (symbol: string) => void;
  onOpenAlertModal: (stock: Stock) => void;
  onAddNewCustomStock: (symbol: string, name: string, price: number, industry: string) => void;
  onOpenResearch?: (stock: Stock) => void;
}

export const WatchlistView: React.FC<WatchlistViewProps> = ({
  stocks,
  watchlistSymbols,
  selectedSymbol,
  colorMode,
  onSelectStock,
  onToggleWatchlist,
  onOpenAlertModal,
  onAddNewCustomStock,
  onOpenResearch,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'ai' | 'semiconductor' | 'shipping_finance' | 'high_vol'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSymbol, setNewSymbol] = useState('');
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('100');
  const [newIndustry, setNewIndustry] = useState('其他電子');

  const isRedUp = colorMode === 'tw';
  const upColor = isRedUp ? '#ef4444' : '#10b981';
  const downColor = isRedUp ? '#10b981' : '#ef4444';

  // Filter stocks
  const filteredStocks = stocks.filter((stock) => {
    const isWatchlisted = watchlistSymbols.includes(stock.symbol);
    if (!isWatchlisted) return false;

    // Search query
    const matchQuery =
      stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.industry.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchQuery) return false;

    // Category tab
    if (activeTab === 'ai') {
      return stock.industry.includes('AI') || stock.industry.includes('散熱') || stock.industry.includes('代工');
    }
    if (activeTab === 'semiconductor') {
      return stock.industry.includes('半導體') || stock.industry.includes('ASIC') || stock.industry.includes('PCB');
    }
    if (activeTab === 'shipping_finance') {
      return stock.industry.includes('航運') || stock.industry.includes('金融');
    }
    if (activeTab === 'high_vol') {
      return stock.volume >= 40000;
    }

    return true;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSymbol.trim() || !newName.trim()) return;
    const priceNum = parseFloat(newPrice) || 100;
    onAddNewCustomStock(newSymbol.trim(), newName.trim(), priceNum, newIndustry.trim());
    setIsAddModalOpen(false);
    setNewSymbol('');
    setNewName('');
    setNewPrice('100');
  };

  return (
    <div className="space-y-4">
      {/* Top Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜尋股票代號 (如 2330) 或名稱 (台積電)..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Action button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            新增自選股
          </button>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
            activeTab === 'all'
              ? 'bg-slate-800 text-white border border-slate-700'
              : 'text-slate-400 hover:text-white bg-slate-900/60'
          }`}
        >
          全部自選 ({watchlistSymbols.length})
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
            activeTab === 'ai'
              ? 'bg-slate-800 text-white border border-slate-700'
              : 'text-slate-400 hover:text-white bg-slate-900/60'
          }`}
        >
          AI伺服器/散熱
        </button>
        <button
          onClick={() => setActiveTab('semiconductor')}
          className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
            activeTab === 'semiconductor'
              ? 'bg-slate-800 text-white border border-slate-700'
              : 'text-slate-400 hover:text-white bg-slate-900/60'
          }`}
        >
          半導體與IC設計
        </button>
        <button
          onClick={() => setActiveTab('shipping_finance')}
          className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
            activeTab === 'shipping_finance'
              ? 'bg-slate-800 text-white border border-slate-700'
              : 'text-slate-400 hover:text-white bg-slate-900/60'
          }`}
        >
          航運與金控
        </button>
        <button
          onClick={() => setActiveTab('high_vol')}
          className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
            activeTab === 'high_vol'
              ? 'bg-slate-800 text-white border border-slate-700'
              : 'text-slate-400 hover:text-white bg-slate-900/60'
          }`}
        >
          高成交量人氣股
        </button>
      </div>

      {/* Watchlist Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 font-semibold">標的名稱 / 代碼</th>
                <th className="py-3 px-4 font-semibold font-mono text-right">即時成交價</th>
                <th className="py-3 px-4 font-semibold font-mono text-right">漲跌幅</th>
                <th className="py-3 px-4 font-semibold font-mono text-right">成交量 (張)</th>
                <th className="py-3 px-4 font-semibold font-mono text-right">支撐 / 壓力位</th>
                <th className="py-3 px-4 font-semibold text-center">法人籌碼 (三大)</th>
                <th className="py-3 px-4 font-semibold">型態警訊</th>
                <th className="py-3 px-4 font-semibold text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredStocks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    目前自選名單中沒有符合條件的標的。
                  </td>
                </tr>
              ) : (
                filteredStocks.map((stock) => {
                  const isSelected = stock.symbol === selectedSymbol;
                  const institutionalTotal = stock.chips.totalInstitutional;
                  const hasSignals = stock.activeSignals.length > 0;

                  return (
                    <tr
                      key={stock.symbol}
                      onClick={() => onSelectStock(stock)}
                      className={`hover:bg-slate-800/50 cursor-pointer transition-colors ${
                        isSelected ? 'bg-indigo-950/30 border-l-2 border-indigo-500' : ''
                      }`}
                    >
                      {/* Name & Symbol */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-bold text-white text-sm flex items-center gap-1.5">
                              {stock.name}
                              <span className="font-mono text-xs text-slate-400 font-normal">
                                {stock.symbol}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {stock.industry} · {stock.market}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Realtime Price */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-sm">
                        <span style={{ color: stock.change >= 0 ? upColor : downColor }}>
                          {stock.price.toFixed(1)}
                        </span>
                      </td>

                      {/* Change % */}
                      <td className="py-3 px-4 text-right font-mono">
                        <div
                          className="font-semibold"
                          style={{ color: stock.change >= 0 ? upColor : downColor }}
                        >
                          {stock.change >= 0 ? '+' : ''}
                          {stock.change.toFixed(1)}
                        </div>
                        <div
                          className="text-[11px] font-medium"
                          style={{ color: stock.change >= 0 ? upColor : downColor }}
                        >
                          ({stock.changePercent >= 0 ? '+' : ''}
                          {stock.changePercent.toFixed(2)}%)
                        </div>
                      </td>

                      {/* Volume */}
                      <td className="py-3 px-4 text-right font-mono">
                        <div className="text-white font-semibold">
                          {stock.volume.toLocaleString()}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {stock.turnover} 億元
                        </div>
                      </td>

                      {/* Support & Resistance */}
                      <td className="py-3 px-4 text-right font-mono">
                        <div className="text-red-400 text-[11px]">
                          壓: <strong>{stock.resistancePrice}</strong>
                        </div>
                        <div className="text-emerald-400 text-[11px]">
                          撐: <strong>{stock.supportPrice}</strong>
                        </div>
                      </td>

                      {/* Institutional Chips */}
                      <td className="py-3 px-4 text-center font-mono">
                        <span
                          className={`inline-block font-semibold ${
                            institutionalTotal >= 0 ? 'text-red-400' : 'text-emerald-400'
                          }`}
                        >
                          {institutionalTotal >= 0 ? '+' : ''}
                          {institutionalTotal.toLocaleString()} 張
                        </span>
                        <div className="text-[10px] text-slate-500">
                          外資 {stock.chips.foreignBuySell > 0 ? '+' : ''}
                          {stock.chips.foreignBuySell}
                        </div>
                      </td>

                      {/* Pattern signal badge */}
                      <td className="py-3 px-4">
                        {hasSignals ? (
                          <div className="flex flex-col gap-1">
                            {stock.activeSignals.slice(0, 1).map((s) => (
                              <span
                                key={s.id}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-300 bg-rose-950/60 border border-rose-800/60 px-2 py-0.5 rounded"
                              >
                                <Sparkles className="w-3 h-3 text-rose-400" />
                                {s.title}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-500 text-xs">區間整理</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div
                          className="flex items-center justify-end gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {onOpenResearch && (
                            <button
                              onClick={() => onOpenResearch(stock)}
                              className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-indigo-400 transition-colors"
                              title="各股重大新聞與原物料狀況"
                            >
                              <Newspaper className="w-4 h-4 text-indigo-400" />
                            </button>
                          )}
                          <button
                            onClick={() => onOpenAlertModal(stock)}
                            className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-rose-400 transition-colors"
                            title="設定價格提醒"
                          >
                            <ShieldAlert className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onToggleWatchlist(stock.symbol)}
                            className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-red-400 transition-colors"
                            title="移出自選"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Custom Stock Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-400" />
                新增台股自選標的
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">股票代號</label>
                <input
                  type="text"
                  required
                  placeholder="例如: 2609 或 2409"
                  value={newSymbol}
                  onChange={(e) => setNewSymbol(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">股票名稱</label>
                <input
                  type="text"
                  required
                  placeholder="例如: 陽明 或 友達"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">參考價格 (TWD)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">所屬產業</label>
                <select
                  value={newIndustry}
                  onChange={(e) => setNewIndustry(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="半導體">半導體</option>
                  <option value="AI伺服器">AI伺服器</option>
                  <option value="電子零組件">電子零組件</option>
                  <option value="航運業">航運業</option>
                  <option value="金融保險">金融保險</option>
                  <option value="電腦週邊">電腦週邊</option>
                  <option value="綠能環保">綠能環保</option>
                  <option value="其他電子">其他電子</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
                >
                  確認新增
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
