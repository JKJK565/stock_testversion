import React, { useState } from 'react';
import {
  Bell,
  X,
  ShieldAlert,
  AlertTriangle,
  TrendingDown,
  UserMinus,
  CheckCircle2,
  Trash2,
  ExternalLink,
  Info,
  ShieldCheck,
} from 'lucide-react';
import { NotificationItem } from '../types/stock';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onSelectStock: (symbol: string) => void;
  onRemoveStockFromWatchlist?: (symbol: string) => void;
}

export function NotificationCenter({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
  onClearAll,
  onSelectStock,
  onRemoveStockFromWatchlist,
}: NotificationCenterProps) {
  const [filter, setFilter] = useState<'all' | 'alert'>('all');

  if (!isOpen) return null;

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'alert') {
      return n.type === 'danger' || n.type === 'warning' || n.type === 'shakeout';
    }
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const renderAlertIcon = (type: NotificationItem['alertType']) => {
    switch (type) {
      case 'SHAKEOUT_HOLD':
        return <ShieldCheck className="w-4 h-4 text-blue-400 flex-shrink-0" />;
      case 'CONFIRMED_STOP_LOSS':
      case 'STOP_LOSS':
        return <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0" />;
      case 'RATING_BEARISH':
        return <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />;
      case 'MA_BEARISH':
        return <TrendingDown className="w-4 h-4 text-rose-400 flex-shrink-0" />;
      case 'TRUST_SELLING':
        return <UserMinus className="w-4 h-4 text-purple-400 flex-shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-indigo-400 flex-shrink-0" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      {/* Backdrop click area */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Popover / Drawer Panel */}
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                通知中心
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                    {unreadCount} 未讀
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-400">自選股健康警報與即時異動</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {notifications.length > 0 && (
              <>
                <button
                  onClick={onMarkAllAsRead}
                  className="px-2 py-1 text-[11px] text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
                  title="全部標為已讀"
                >
                  全部已讀
                </button>
                <button
                  onClick={onClearAll}
                  className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                  title="清空所有通知"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-950/40 border-b border-slate-800/80 text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded-lg font-medium transition ${
              filter === 'all'
                ? 'bg-slate-800 text-white font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            全部通知 ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('alert')}
            className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1 ${
              filter === 'alert'
                ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-3 h-3 text-rose-400" />
            <span>破線與健康警訊</span>
          </button>
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/70 p-2 space-y-1">
          {filteredNotifications.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              <CheckCircle2 className="w-10 h-10 text-emerald-500/40 mx-auto mb-2" />
              <p className="font-semibold text-slate-400">目前尚無未讀破線警訊</p>
              <p className="text-[11px] text-slate-600 mt-1">
                自選持股波段持續健康運行中，若有跌破停損或法人轉賣將即時警報。
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-3 rounded-xl transition flex flex-col gap-1.5 ${
                  !notif.isRead
                    ? 'bg-slate-800/60 border border-slate-700/60'
                    : 'bg-slate-900/40 hover:bg-slate-850'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {renderAlertIcon(notif.alertType)}
                    <span className="text-xs font-bold text-white">
                      {notif.stockName} ({notif.stockSymbol})
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                        notif.type === 'shakeout'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : notif.type === 'danger'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {notif.title}
                    </span>
                  </div>

                  <span className="text-[10px] text-slate-500 font-mono flex-shrink-0">
                    {notif.timestamp}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed pl-5">
                  {notif.message}
                </p>

                <div className="flex items-center justify-between pt-1.5 pl-5 border-t border-slate-800/50 text-[11px]">
                  <button
                    onClick={() => {
                      onSelectStock(notif.stockSymbol);
                      onClose();
                    }}
                    className="text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold transition"
                  >
                    <span>查看自選明細</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>

                  {onRemoveStockFromWatchlist && (
                    <button
                      onClick={() => onRemoveStockFromWatchlist(notif.stockSymbol)}
                      className="text-slate-500 hover:text-rose-400 flex items-center gap-1 transition"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>從自選移除</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800 text-center text-[11px] text-slate-500">
          健康警報檢核：停損價防守 × 評定翻空 TRIM/SELL × 均線空頭 × 投信連賣
        </div>
      </div>
    </div>
  );
}
