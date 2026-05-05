import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Key,
  RefreshCw,
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import cursorLogo from '../assets/cursor-logo.png';
import claudeLogo from '../assets/claude-logo.png';
import appIcon from '../assets/app-icon.png';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const Sidebar = ({ activeTab, setActiveTab, cursorStatus, claudeStatus, onCheckUpdate, updateChecking }) => {
  const { t } = useTranslation();
  const [appVersion, setAppVersion] = useState('');

  useEffect(() => {
    if (window.liveTranslatorAPI?.getAppVersion) {
      window.liveTranslatorAPI.getAppVersion().then(setAppVersion).catch(() => {});
    }
  }, []);

  const NAV_GROUPS = [
    {
      title: t('sectionPatcher'),
      items: [
        {
          id: 'cursor',
          label: t('cursorEngine'),
          logo: cursorLogo,
          status: cursorStatus?.installed ? (cursorStatus.isPatched ? 'patched' : 'installed') : 'missing',
          color: 'blue'
        },
        {
          id: 'claude',
          label: t('claudeEngine'),
          logo: claudeLogo,
          status: claudeStatus?.installed ? (claudeStatus.isPatched ? 'patched' : 'installed') : 'missing',
          color: 'purple'
        },
      ]
    },
  ];

  return (
    <aside className="w-64 border-r border-white/5 bg-[#0B0D10] flex flex-col z-20 relative flex-shrink-0">
      <div className="h-24 flex flex-col justify-end pb-2 pl-4 pr-4 border-b border-white/5" style={{ WebkitAppRegion: 'drag' }}>
        <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' }}>
          <img src={appIcon} alt="Live Translator Hub" className="w-9 h-9 object-contain" />
          <span className="font-bold text-lg tracking-tight text-white select-none">
            Live Translator Hub
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8">
        {NAV_GROUPS.map((group, gIdx) => (
          <div key={gIdx} className="space-y-2">
            <h3 className="px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/20 select-none">
              {group.title}
            </h3>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = activeTab === item.id;
                const Icon = item.icon;

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={cn(
                      "group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative",
                      isActive
                        ? "bg-white/5 text-white shadow-sm"
                        : "text-white/40 hover:text-white/70 hover:bg-white/[0.02]"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                      isActive
                        ? (item.color === 'blue' ? 'bg-blue-500/10' :
                           item.color === 'purple' ? 'bg-purple-500/10' :
                           item.color === 'amber' ? 'bg-amber-500/10' :
                           'bg-emerald-500/10')
                        : "bg-transparent group-hover:bg-white/5"
                    )}>
                      {item.logo
                        ? <img src={item.logo} alt={item.label} className={cn("w-7 h-7 object-contain", !isActive && "opacity-40 group-hover:opacity-70")} />
                        : <Icon className="w-4.5 h-4.5" />
                      }
                    </div>
                    
                    <span className="text-sm font-medium flex-1 text-left">
                      {item.label}
                    </span>

                    {item.status && (
                      <span className={cn(
                        "text-[10px] font-bold px-1.5 py-0.5 rounded-md",
                        item.status === 'patched' ? "bg-blue-500/15 text-blue-400" :
                        item.status === 'installed' ? "bg-amber-500/15 text-amber-400" :
                        "bg-white/5 text-white/20"
                      )}>
                        {item.status === 'patched' ? t('sidebarPatched') : item.status === 'installed' ? t('sidebarUnpatched') : t('sidebarNotInstalled')}
                      </span>
                    )}

                    {isActive && (
                      <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-blue-500 rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-white/5 space-y-1">
        <button
          onClick={() => setActiveTab('apikeys')}
          className={cn(
            "group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative",
            activeTab === 'apikeys'
              ? "bg-white/5 text-white shadow-sm"
              : "text-white/60 hover:text-white/80 hover:bg-white/[0.02]"
          )}
        >
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
            activeTab === 'apikeys' ? "bg-amber-500/10" : "bg-transparent group-hover:bg-white/5"
          )}>
            <Key className={cn("w-4 h-4", activeTab === 'apikeys' ? "text-amber-400" : "text-white/60")} />
          </div>
          <span className="text-sm font-medium">{t('navApiKeys')}</span>
          {activeTab === 'apikeys' && (
            <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-blue-500 rounded-full" />
          )}
        </button>

        <button
          onClick={onCheckUpdate}
          disabled={updateChecking}
          className={cn(
            "group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
            "text-white/60 hover:text-white/80 hover:bg-white/[0.02]"
          )}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-transparent group-hover:bg-white/5 transition-colors">
            <RefreshCw className={cn('w-4 h-4', updateChecking && 'animate-spin text-blue-400')} />
          </div>
          <span className="text-sm font-medium">{updateChecking ? t('updateChecking') : t('updateCheckBtn')}</span>
        </button>

        <button
          onClick={() => window.liveTranslatorAPI?.openExternal('https://github.com/Uncle-Gao/Live-Translator-Hub')}
          className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-white/60 hover:text-white/80 hover:bg-white/[0.02]"
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-transparent group-hover:bg-white/5 transition-colors">
            <svg className="w-4 h-4 text-white/60" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
            </svg>
          </div>
          <span className="text-sm font-medium">GitHub</span>
        </button>

        {appVersion && (
          <p className="text-center text-[10px] text-white/20 pt-1 font-mono">v{appVersion}</p>
        )}
      </div>

    </aside>
  );
};

export default Sidebar;
