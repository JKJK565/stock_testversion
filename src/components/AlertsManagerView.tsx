import React, { useState } from 'react';
import { Stock, PriceAlert, AlertCondition } from '../types/stock';
import {
  Bell,
  Plus,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Play,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  TrendingDown,
  Volume2,
  ShieldAlert,
} from 'lucide-react';

interface AlertsManagerViewProps {
  stocks: Stock[];
  alerts: PriceAlert[];
  onAddAlert: (newAlert: Omit<PriceAlert, 'id' | 'createdAt' | 'triggered'>) => void;
  onToggleAlertActive: (id: string) => void;
  onDeleteAlert: (id: string) => void;
  onTestTriggerAlert: (id: string) => void;
  colorMode: 'tw' | 'intl';
}

export const AlertsManagerView: React.FC<AlertsManagerViewProps> = ({
  stocks,
  alerts,
  onAddAlert,
  onToggleAlertActive,
  onDeleteAlert,
  onTestTriggerAlert,
  colorMode,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState(stocks[0]?.symbol || '2330');
  const [condition, setCondition] = useState<AlertCondition>('PRICE_ABOVE');
  const [targetValue, setTargetValue] = useState('1080');
  const [note, setNote] = useState('');

  const activeStock = stocks.find((s) => s.symbol === selectedSymbol) || stocks[0];

  const handleStockChange = (symbol: string) => {
    setSelectedSymbol(symbol);
    const s = stocks.find((item) => item.symbol === symbol);
    if (s) {
      if (condition === 'PRICE_ABOVE') setTargetValue(String(s.resistancePrice || (s.price * 1.03).toFixed(1)));
      if (condition === 'PRICE_BELOW') setTargetValue(String(s.supportPrice || (s.price * 0.97).toFixed(1)));
      if (condition === 'PCT_GAIN_ABOVE') setTargetValue('3.5');
      if (condition === 'PCT_DROP_ABOVE') setTargetValue('3.0');
      if (condition === 'VOLUME_ABOVE') setTargetValue(String(Math.round(s.volume * 1.5)));
    }
  };

  const handleConditionChange = (newCond: AlertCondition) => {
    setCondition(newCond);
    if (activeStock) {
      if (newCond === 'PRICE_ABOVE') setTargetValue(String(activeStock.resistancePrice || (activeStock.price * 1.03).toFixed(1)));
      if (newCond === 'PRICE_BELOW') setTargetValue(String(activeStock.supportPrice || (activeStock.price * 0.97).toFixed(1)));
      if (newCond === 'PCT_GAIN_ABOVE') setTargetValue('3.5');
      if (newCond === 'PCT_DROP_ABOVE') setTargetValue('3.0');
      if (newCond === 'VOLUME_ABOVE') setTargetValue(String(Math.round(activeStock.volume * 1.5)));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStock) return;
    const val = parseFloat(targetValue);
    if (isNaN(val)) return;

    onAddAlert({
      symbol: activeStock.symbol,
      stockName: activeStock.name,
      condition,
      targetValue: val,
      active: true,
      note: note.trim() || undefined,
    });

    setIsCreating(false);
    setNote('');
  };

  const formatConditionLabel = (cond: AlertCondition, val: number) => {
    switch (cond) {
      case 'PRICE_ABOVE':
        return `市價向上突破 ${val} 元`;
      case 'PRICE_BELOW':
        return `市價跌破停損 ${val} 元`;
      case 'PCT_GAIN_ABOVE':
        return `當日漲幅超過 +${val}%`;
      case 'PCT_DROP_ABOVE':
        return `當日跌幅超過 -${val}%`;
      case 'VOLUME_ABOVE':
        return `成交量爆量突破 ${val.toLocaleString()} 張`;
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">自定義價格觸發提醒中心</h2>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            自由設定標的目標突破價、停損價、漲跌幅警示與成交量門檻。系統實時撮合比對，條件滿足立即播放音效並推播至通知欄。
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          新增自訂提醒
        </button>
      </div>

      {/* Creation Form Modal */}
      {isCreating && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-rose-400" />
              建立新價格觸發提醒
            </h3>
            <button
              onClick={() => setIsCreating(false)}
              className="text-slate-400 hover:text-white text-sm"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Select Stock */}
            <div>
              <label className="block text-slate-300 mb-1 font-medium">監控股票標的</label>
              <select
                value={selectedSymbol}
                onChange={(e) => handleStockChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-rose-500 font-mono"
              >
                {stocks.map((s) => (
                  <option key={s.symbol} value={s.symbol}>
                    {s.symbol} {s.name} (現價 {s.price})
                  </option>
                ))}
              </select>
              {activeStock && (
                <div className="mt-1.5 text-[11px] text-slate-400 flex items-center gap-3 font-mono">
                  <span>現價: <strong className="text-white">{activeStock.price}</strong></span>
                  <span>支撐: <strong className="text-emerald-400">{activeStock.supportPrice}</strong></span>
                  <span>壓力: <strong className="text-red-400">{activeStock.resistancePrice}</strong></span>
                </div>
              )}
            </div>

            {/* Condition Type */}
            <div>
              <label className="block text-slate-300 mb-1 font-medium">觸發條件類型</label>
              <select
                value={condition}
                onChange={(e) => handleConditionChange(e.target.value as AlertCondition)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-rose-500"
              >
                <option value="PRICE_ABOVE">目標價向上突破 (大於等於指定價格)</option>
                <option value="PRICE_BELOW">價格跌破停損 (小於等於指定價格)</option>
                <option value="PCT_GAIN_ABOVE">當日漲幅超過 % (例如 +3.5%)</option>
                <option value="PCT_DROP_ABOVE">當日跌幅超過 % (例如 -3.0%)</option>
                <option value="VOLUME_ABOVE">當日成交量突破指定張數</option>
              </select>
            </div>

            {/* Target Value */}
            <div>
              <label className="block text-slate-300 mb-1 font-medium">
                {condition.includes('PRICE')
                  ? '目標價格 (TWD)'
                  : condition.includes('PCT')
                  ? '目標百分比 (%)'
                  : '目標成交量 (張)'}
              </label>
              <input
                type="number"
                step={condition.includes('PCT') ? '0.1' : condition.includes('PRICE') ? '0.5' : '100'}
                required
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:outline-none focus:border-rose-500"
              />
            </div>

            {/* Note */}
            <div>
              <label className="block text-slate-300 mb-1 font-medium">備註說明 (選填)</label>
              <input
                type="text"
                placeholder="例如: 突破帶量加碼2張、跌破均線停損出場"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="md:col-span-2 flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium transition-colors"
              >
                確認啟用監控
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Alerts List */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              目前設定提醒清單 ({alerts.length})
            </span>
          </div>
          <span className="text-xs text-slate-400">
            運作中: {alerts.filter((a) => a.active && !a.triggered).length} · 已觸發: {alerts.filter((a) => a.triggered).length}
          </span>
        </div>

        <div className="divide-y divide-slate-800/80">
          {alerts.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              目前尚未設定任何價格提醒，點擊上方「新增自訂提醒」快速建立！
            </div>
          ) : (
            alerts.map((alert) => {
              const currentStock = stocks.find((s) => s.symbol === alert.symbol);
              const currentPrice = currentStock?.price ?? 0;

              return (
                <div
                  key={alert.id}
                  className="p-4 hover:bg-slate-800/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                >
                  {/* Left: Info */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-white text-sm">
                        {alert.stockName}
                      </span>
                      <span className="font-mono text-slate-400">
                        {alert.symbol}
                      </span>

                      {/* Status badge */}
                      {alert.triggered ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-300 bg-rose-950/70 border border-rose-800 px-2 py-0.5 rounded">
                          <CheckCircle className="w-3 h-3 text-rose-400" />
                          已觸發提醒
                        </span>
                      ) : alert.active ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300 bg-emerald-950/70 border border-emerald-800 px-2 py-0.5 rounded">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          即時監控中
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
                          已暫停
                        </span>
                      )}

                      <span className="text-[11px] font-mono text-slate-500">
                        現價: {currentPrice}
                      </span>
                    </div>

                    <div className="text-slate-300 font-medium">
                      觸發條件: <strong className="text-white">{formatConditionLabel(alert.condition, alert.targetValue)}</strong>
                      {alert.note && <span className="text-slate-400 ml-2">({alert.note})</span>}
                    </div>

                    {alert.triggeredAt && (
                      <div className="text-[11px] text-rose-400 font-mono">
                        觸發時間: {new Date(alert.triggeredAt).toLocaleTimeString('zh-TW')} (觸發時成交價 {alert.triggeredPrice})
                      </div>
                    )}
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center">
                    {/* Test Trigger Button */}
                    <button
                      onClick={() => onTestTriggerAlert(alert.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1 text-[11px]"
                      title="模擬觸發音效與推播"
                    >
                      <Play className="w-3 h-3 text-amber-400" />
                      模擬觸發
                    </button>

                    {/* Toggle Active */}
                    <button
                      onClick={() => onToggleAlertActive(alert.id)}
                      className="p-1.5 text-slate-400 hover:text-white transition-colors"
                      title={alert.active ? '暫停監控' : '啟用監控'}
                    >
                      {alert.active ? (
                        <ToggleRight className="w-6 h-6 text-emerald-400" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-slate-600" />
                      )}
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => onDeleteAlert(alert.id)}
                      className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                      title="刪除提醒"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
