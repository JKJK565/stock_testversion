import React from 'react';
import { Zap, ShieldAlert, X, ArrowRight } from 'lucide-react';

export interface ToastData {
  id: string;
  type: 'radar' | 'alert';
  title: string;
  stockSymbol: string;
  stockName: string;
  description: string;
  triggerPrice?: number;
  volume?: number;
  volumeMultiple?: number;
  supportPrice?: number;
  resistancePrice?: number;
  timestamp?: number;
}

interface ToastAlertProps {
  toast: ToastData | null;
  onClose: () => void;
  onViewStock: (symbol: string) => void;
}

export const ToastAlert: React.FC<ToastAlertProps> = ({
  toast,
  onClose,
  onViewStock,
}) => {
  if (!toast) return null;

  return (
    <div className="fixed top-5 right-5 z-50 max-w-md w-full animate-in slide-in-from-top duration-300">
      <div className="bg-slate-900 border-2 border-rose-500/80 rounded-xl p-4 shadow-2xl backdrop-blur-md text-xs relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-amber-500 to-indigo-500"></div>

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            {toast.type === 'radar' ? (
              <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400">
                <Zap className="w-4 h-4 fill-rose-500" />
              </span>
            ) : (
              <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                <ShieldAlert className="w-4 h-4" />
              </span>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-sm">{toast.stockName}</span>
                <span className="font-mono text-slate-400">{toast.stockSymbol}</span>
                <span className="text-rose-400 font-semibold">{toast.title}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="mt-2 text-slate-300 leading-relaxed pl-8">
          {toast.description}
        </p>

        {/* Support & Resistance & Volume */}
        <div className="mt-2.5 pl-8 grid grid-cols-2 gap-2 font-mono text-[11px] bg-slate-950/70 p-2 rounded-lg border border-slate-800">
          {toast.volume !== undefined && (
            <div className="text-slate-400">
              成交量: <span className="text-amber-400 font-bold">{toast.volume.toLocaleString()} 張</span>
              {toast.volumeMultiple && <span className="text-slate-500 ml-1">({toast.volumeMultiple}x)</span>}
            </div>
          )}
          {toast.triggerPrice !== undefined && (
            <div className="text-slate-400">
              觸發價: <span className="text-white font-bold">{toast.triggerPrice} 元</span>
            </div>
          )}
          {toast.resistancePrice !== undefined && (
            <div className="text-red-400">
              壓力位: <strong>{toast.resistancePrice} 元</strong>
            </div>
          )}
          {toast.supportPrice !== undefined && (
            <div className="text-emerald-400">
              支撐位: <strong>{toast.supportPrice} 元</strong>
            </div>
          )}
        </div>

        <div className="mt-3 pl-8 flex items-center justify-end gap-2">
          <button
            onClick={() => {
              onViewStock(toast.stockSymbol);
              onClose();
            }}
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <span>立即進入技術分析</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
