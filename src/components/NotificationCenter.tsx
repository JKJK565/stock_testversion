import React from 'react';
import { RadarSignal, Stock, PriceAlert } from '../types/stock';
import {
  Bell,
  Zap,
  ShieldAlert,
  X,
  ArrowRight,
  CheckCircle,
  ExternalLink,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface NotificationItem {
  id: string;
  type: 'radar' | 'alert';
  title: string;
  stockSymbol: string;
  stockName: string;
  description: string;
  timestamp: number;
  read: boolean;
  volume?: number;
  volumeMultiple?: number;
  supportPrice?: number;
  resistancePrice?: number;
  triggerPrice?: number;
}

interface NotificationCenterProps {
  notifications: NotificationItem[];
  isOpen: boolean;
  onClose: () => void;
  onMarkAllRead: () => void;
  onClearAll: () => void;
  onSelectStockBySymbol: (symbol: string) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  isOpen,
  onClose,
  onMarkAllRead,
  onClearAll,
  onSelectStockBySymbol,
  soundEnabled,
  onToggleSound,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-rose-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">即時雷達推播與提醒中心</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-rose-950 border border-rose-800 text-rose-300 font-mono">
              {notifications.filter((n) => !n.read).length} 未讀
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleSound}
              className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title={soundEnabled ? '關閉提示音' : '開啟提示音'}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-500" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action strip */}
        <div className="px-4 py-2 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <button
            onClick={onMarkAllRead}
            className="hover:text-white transition-colors flex items-center gap-1"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            全部標為已讀
          </button>
          <button
            onClick={onClearAll}
            className="hover:text-rose-400 transition-colors"
          >
            清空歷史紀錄
          </button>
        </div>

        {/* Notifications list */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/80 p-2 space-y-1">
          {notifications.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs">
              暫無新推播訊息，當自選標的突破型態或觸發自訂價格時將主動通知。
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => {
                  onSelectStockBySymbol(n.stockSymbol);
                  onClose();
                }}
                className={`p-3.5 rounded-xl cursor-pointer transition-all hover:bg-slate-800/60 ${
                  !n.read ? 'bg-indigo-950/20 border border-indigo-900/40' : 'bg-slate-900/40'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5">
                    {n.type === 'radar' ? (
                      <span className="p-1 rounded bg-rose-500/20 text-rose-400">
                        <Zap className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="p-1 rounded bg-amber-500/20 text-amber-400">
                        <ShieldAlert className="w-3.5 h-3.5" />
                      </span>
                    )}
                    <span className="font-bold text-white text-xs">
                      {n.stockName}
                    </span>
                    <span className="font-mono text-[11px] text-slate-400">
                      {n.stockSymbol}
                    </span>
                    <span className="text-[11px] font-semibold text-rose-300">
                      {n.title}
                    </span>
                  </div>

                  <span className="text-[10px] text-slate-500 font-mono shrink-0">
                    {new Date(n.timestamp).toLocaleTimeString('zh-TW', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed pl-6">
                  {n.description}
                </p>

                {/* Quantitative Level Metrics */}
                {(n.supportPrice !== undefined || n.volume !== undefined) && (
                  <div className="mt-2 pl-6 grid grid-cols-2 gap-1.5 text-[11px] font-mono">
                    {n.volume !== undefined && (
                      <div className="text-slate-400">
                        成交量: <span className="text-amber-300 font-bold">{n.volume.toLocaleString()} 張</span>
                        {n.volumeMultiple && <span className="text-slate-500 ml-1">({n.volumeMultiple}x)</span>}
                      </div>
                    )}
                    {n.triggerPrice !== undefined && (
                      <div className="text-slate-400">
                        觸發市價: <span className="text-white font-bold">{n.triggerPrice} 元</span>
                      </div>
                    )}
                    {n.resistancePrice !== undefined && (
                      <div className="text-red-400">
                        壓力位: <strong className="font-bold">{n.resistancePrice} 元</strong>
                      </div>
                    )}
                    {n.supportPrice !== undefined && (
                      <div className="text-emerald-400">
                        支撐位: <strong className="font-bold">{n.supportPrice} 元</strong>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-2 pl-6 flex items-center gap-1 text-[11px] text-indigo-400 font-medium">
                  <span>查看技術分析圖表</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
