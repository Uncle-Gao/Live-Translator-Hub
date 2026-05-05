import { useTranslation } from 'react-i18next';
import { Languages, Wand2 } from 'lucide-react';
import { clsx } from 'clsx';
import { ALL_LANGUAGES } from '../constants';

const Header = ({ title, handleLocalizeUI, isLocalizing }) => {
  const { t, i18n } = useTranslation();

  return (
    <header className="h-24 flex items-end justify-between px-8 pb-4 border-b border-white/5 bg-[#0B0D10] z-10 flex-shrink-0" style={{ WebkitAppRegion: 'drag' }}>
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-white/90 tracking-tight">
          {title}
        </h2>
      </div>

      <div className="flex items-center gap-6" style={{ WebkitAppRegion: 'no-drag' }}>
        <div className="flex items-center gap-3">
          <Languages className="w-4 h-4 text-white/50" />
          <select
            className="bg-white/5 border border-white/10 rounded-lg text-xs font-medium px-3 py-1.5 text-white/70 hover:text-white hover:bg-white/10 transition-all cursor-pointer outline-none focus:ring-2 focus:ring-blue-500/20"
            value={i18n.language}
            onChange={e => i18n.changeLanguage(e.target.value)}
          >
            {Object.keys(ALL_LANGUAGES).map(code => (
              <option key={code} value={code} className="bg-[#1A1C1E]">
                {ALL_LANGUAGES[code].split(' (')[0]}
              </option>
            ))}
          </select>
        </div>

        {i18n.language !== 'en-US' && i18n.language !== 'zh-CN' && (
          <button
            onClick={handleLocalizeUI}
            disabled={isLocalizing}
            className={clsx(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all",
              isLocalizing 
                ? "bg-purple-500/20 border-purple-500/40 text-purple-300 animate-pulse cursor-wait"
                : "bg-purple-500/10 border-purple-500/20 text-purple-400 hover:bg-purple-500/20 hover:border-purple-500/40"
            )}
          >
            <Wand2 className="w-3.5 h-3.5" />
            {isLocalizing ? t('localizing', 'Localizing...') : t('localizeHub', 'AI Localize Hub')}
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
