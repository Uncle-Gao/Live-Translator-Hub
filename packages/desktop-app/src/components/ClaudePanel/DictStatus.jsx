import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import useConfigStore from '../../store/configStore';

const DictRow = ({ label, info }) => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {info?.exists
          ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          : <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
        <span className={`text-sm ${info?.exists ? 'text-white/70' : 'text-amber-400/80'}`}>{label}</span>
      </div>
      {info?.exists && (
        <span className="text-[11px] text-emerald-400/50">{t('dictStatusEntries', { count: info.count })}</span>
      )}
      {!info?.exists && (
        <span className="text-[11px] text-amber-400/40">{t('dictStatusNotExistsBuiltin')}</span>
      )}
    </div>
  );
};

const DictStatus = () => {
  const { t } = useTranslation();
  const { config } = useConfigStore();
  const [mainDict, setMainDict] = useState(null);
  const [stringsDict, setStringsDict] = useState(null);
  const [loading, setLoading] = useState(true);

  const lang = config.claude.targetLanguage;

  const checkDicts = async () => {
    if (!window.liveTranslatorAPI?.getDictStatus) return;
    setLoading(true);
    try {
      const [main, strings] = await Promise.all([
        window.liveTranslatorAPI.getDictStatus({ app: 'claude', lang }),
        window.liveTranslatorAPI.getDictStatus({ app: 'claude-strings', lang }),
      ]);
      setMainDict(main);
      setStringsDict(strings);
    } catch {
      setMainDict({ exists: false });
      setStringsDict({ exists: false });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // checkDicts is async — setState calls happen after await, not synchronously
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkDicts();
  }, [lang]);

  return (
    <div className="bg-[#1A1C1E] border border-white/5 rounded-3xl p-6 space-y-4">
      <div className="flex items-center gap-3">
        <FileText className="w-4 h-4 text-white/30" />
        <h3 className="text-sm font-bold uppercase tracking-widest text-white/60">{t('dictStatusTitle')}</h3>
        <span className="text-[10px] text-white/20 ml-auto">{lang}</span>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-white/30 text-xs">
          <Loader2 className="w-4 h-4 animate-spin" />
          {t('dictStatusChecking')}
        </div>
      ) : (
        <div className="space-y-3">
          <DictRow label={`${lang}.json ${t('dictStatusMainDict')}`} info={mainDict} />
          <DictRow label={`Localizable.strings.zh-CN ${t('dictStatusNativeStrings')}`} info={stringsDict} />
          <p className="text-[10px] text-white/20 italic pt-1">
            {t('dictStatusBuiltinNote')}
          </p>
        </div>
      )}
    </div>
  );
};

export default DictStatus;
