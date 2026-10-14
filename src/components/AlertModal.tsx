import React, { useState } from 'react';
import { Stock, AlertCondition } from '../types/stock';
import { ShieldAlert, Plus, X } from 'lucide-react';

interface AlertModalProps {
  stock: Stock | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (symbol: string, stockName: string, condition: AlertCondition, targetValue: number, note?: string) => void;
}

export const AlertModal: React.FC<AlertModalProps> = ({
  stock,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen || !stock) return null;

  const [condition, setCondition] = useState<AlertCondition>('PRICE_ABOVE');
  const [targetValue, setTargetValue] = useState<string>(
    String(stock.resistancePrice || (stock.price * 1.03).toFixed(1))
  );
  const [note, setNote] = useState('');

  const handleConditionChange = (newCond: AlertCondition) => {
    setCondition(newCond);
    if (newCond === 'PRICE_ABOVE') setTargetValue(String(stock.resistancePrice || (stock.price * 1.03).toFixed(1)));
    if (newCond === 'PRICE_BELOW') setTargetValue(String(stock.supportPrice || (stock.price * 0.97).toFixed(1)));
    if (newCond === 'PCT_GAIN_ABOVE') setTargetValue('3.5');
    if (newCond === 'PCT_DROP_ABOVE') setTargetValue('3.0');
    if (newCond === 'VOLUME_ABOVE') setTargetValue(String(Math.round(stock.volume * 1.5)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(targetValue);
    if (isNaN(val)) return;

    onSave(stock.symbol, stock.name, condition, val, note.trim() || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <h3 className="text-base font-bold text-white">
              設定價格提醒 — {stock.name} ({stock.symbol})
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-sm">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 font-mono text-xs flex items-center justify-between">
          <span className="text-slate-400">當前成交價: <strong className="text-white">{stock.price}</strong></span>
          <span className="text-emerald-400">支撐位: <strong>{stock.supportPrice}</strong></span>
          <span className="text-red-400">壓力位: <strong>{stock.resistancePrice}</strong></span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-300 mb-1 font-medium">觸發條件</label>
            <select
              value={condition}
              onChange={(e) => handleConditionChange(e.target.value as AlertCondition)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-rose-500"
            >
              <option value="PRICE_ABOVE">市價向上突破 (≥ 目標價)</option>
              <option value="PRICE_BELOW">市價跌破停損 (≤ 停損價)</option>
              <option value="PCT_GAIN_ABOVE">當日漲幅超過 % (例如 +3.5%)</option>
              <option value="PCT_DROP_ABOVE">當日跌幅超過 % (例如 -3.0%)</option>
              <option value="VOLUME_ABOVE">盤中成交量爆量突破 (張)</option>
            </select>
          </div>

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

          <div>
            <label className="block text-slate-300 mb-1 font-medium">自訂備註說明</label>
            <input
              type="text"
              placeholder="例如: 突破帶量加碼買進、回測停損出場"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium transition-colors"
            >
              確認開啟提醒
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
