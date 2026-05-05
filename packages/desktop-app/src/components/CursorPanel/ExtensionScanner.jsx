import React from 'react';
import { useTranslation } from 'react-i18next';
import { Layers, ShieldCheck, ShieldAlert, RefreshCw, CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';

const ExtensionScanner = ({ extensions, selectedIds = [], onToggle, onRefresh, isScanning }) => {
  const { t } = useTranslation();

  return (
    <div className="bg-[#1A1C1E] border border-white/5 rounded-3xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Layers className="w-5 h-5 text-purple-400" />
          <h3 className="text-sm font-bold uppercase tracking-widest text-white/60">{t('pluginScanner', 'Webview Plugin Scanner')}</h3>
        </div>
        <button 
          onClick={onRefresh}
          disabled={isScanning}
          className="p-2 hover:bg-white/5 rounded-xl transition-all text-white/20 hover:text-white/60 disabled:animate-spin"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {isScanning ? (
          <div className="py-10 flex flex-col items-center justify-center gap-3 text-white/20">
            <RefreshCw className="w-8 h-8 animate-spin" />
            <span className="text-xs font-bold uppercase tracking-widest">Scanning Extensions...</span>
          </div>
        ) : extensions.length === 0 ? (
          <div className="py-10 border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center gap-2 text-white/20">
            <Layers className="w-8 h-8 opacity-20" />
            <span className="text-xs font-medium">No translatable plugins found</span>
          </div>
        ) : (
          extensions.map((ext, idx) => {
            const isSelected = selectedIds.includes(ext.id);
            return (
              <div 
                key={idx} 
                onClick={() => onToggle(ext.id)}
                className={clsx(
                  "group flex items-center justify-between p-4 border rounded-2xl transition-all cursor-pointer",
                  isSelected ? "bg-blue-500/5 border-blue-500/20" : "bg-white/5 border-white/5 hover:bg-white/[0.08]"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/5 flex items-center justify-center text-lg">
                      🧩
                    </div>
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-[#1A1C1E] flex items-center justify-center">
                        <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className={clsx(
                      "text-sm font-bold transition-colors",
                      isSelected ? "text-blue-400" : "text-white group-hover:text-white/80"
                    )}>{ext.id}</div>
                    <div className="text-[10px] font-mono text-white/30 uppercase tracking-tighter">v{ext.version}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {ext.isPatched ? (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-400 uppercase tracking-widest">
                      Patched
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] font-bold text-white/20 uppercase tracking-widest">
                      Original
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
      
      <p className="text-[10px] text-white/20 leading-relaxed italic px-2">
        * Only plugins with internal Webview JS components are shown here. Injection is performantly applied during deployment.
      </p>
    </div>
  );
};

export default ExtensionScanner;
