import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Smartphone, Download, Share, PlusSquare, X, CheckCircle2 } from 'lucide-react';

interface PWAInstallButtonProps {
  variant?: 'button' | 'badge' | 'compact';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'button' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);

  // If already running inside standalone app, hide
  if (isInstalled) {
    return null;
  }

  const handleTrigger = async () => {
    if (isInstallable) {
      const ok = await install();
      if (!ok) {
        setShowGuideModal(true);
      }
    } else {
      setShowGuideModal(true);
    }
  };

  return (
    <>
      <button
        onClick={handleTrigger}
        title="安裝至手機或桌面主畫面，享受如 App 般的原生獨立體驗"
        className={`flex items-center gap-1.5 transition-all font-medium ${
          variant === 'compact'
            ? 'px-2 py-1 rounded-lg text-xs bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/70 text-indigo-200'
            : 'px-2.5 py-1.5 rounded-lg text-xs bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-sm shadow-indigo-900/50'
        }`}
      >
        <Smartphone className="w-3.5 h-3.5 text-indigo-200" />
        <span className="whitespace-nowrap font-semibold">加到手機裝置</span>
      </button>

      {/* Mobile Install Guidance Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center">
                  <Smartphone className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">新增至手機主畫面</h3>
                  <p className="text-[11px] text-slate-400">像原生 App 隨開即用，無需下載商城</p>
                </div>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* iOS Safari Guidance */}
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-sky-400">
                  <Share className="w-3.5 h-3.5" />
                  <span>🍎 iPhone / iPad (Safari 瀏覽器)：</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px] leading-relaxed">
                  <li>
                    點擊 Safari 底部工具列中央的「<strong>分享</strong>」圖示 <Share className="w-3 h-3 inline text-slate-300" />
                  </li>
                  <li>
                    選單下滑找到「<strong>加入主畫面</strong>」<PlusSquare className="w-3 h-3 inline text-slate-300" /> (Add to Home Screen)
                  </li>
                  <li>點擊右上角「<strong>新增</strong>」即完成！桌面隨時一鍵開啟看盤</li>
                </ol>
              </div>

              {/* Android Chrome Guidance */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                  <Download className="w-3.5 h-3.5" />
                  <span>🤖 Android / Chrome 瀏覽器：</span>
                </div>
                {isInstallable ? (
                  <div className="space-y-2">
                    <p className="text-[11px] text-slate-300">
                      您的瀏覽器支援一鍵安裝，請點擊下方按鈕直接加入：
                    </p>
                    <button
                      onClick={async () => {
                        const ok = await install();
                        if (ok) setShowGuideModal(false);
                      }}
                      className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      立即安裝台股雷達 App
                    </button>
                  </div>
                ) : (
                  <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px] leading-relaxed">
                    <li>點擊瀏覽器右上角選單「<strong>⋮</strong>」按鈕</li>
                    <li>點選「<strong>安裝應用程式</strong>」或「<strong>加到主畫面</strong>」</li>
                    <li>確認新增即可在桌面直接啟動全螢幕看盤！</li>
                  </ol>
                )}
              </div>
            </div>

            <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                支援離線快取與即時報價推播
              </span>
              <button
                onClick={() => setShowGuideModal(false)}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
              >
                了解關閉
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
