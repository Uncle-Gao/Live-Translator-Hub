import { useMemo, useState } from 'react';
import { AlertTriangle, Code2, FileText, RotateCcw, ShieldCheck, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import protectionDefaults from '@live-translator/core/src/protection-defaults.json';
import useConfigStore from '../store/configStore';
import SkipChipInput from './CursorPanel/SkipRules/SkipChipInput';

const SETTINGS = [
  {
    key: 'enableFileNameGuard',
    icon: FileText,
    titleKey: 'advancedFileNameGuard',
    titleFallback: '纯文件名/路径跳过',
    descKey: 'advancedFileNameGuardDesc',
    descFallback: '当整段文本是文件名、路径或带行号的资源名时，直接跳过翻译。'
  },
  {
    key: 'enableProtectedTermGuard',
    icon: Code2,
    titleKey: 'advancedProtectedTermGuard',
    titleFallback: '句子内文件名和编程术语保护',
    descKey: 'advancedProtectedTermGuardDesc',
    descFallback: '翻译前用占位符保护句子中的文件名、路径、模型名和编程专有名词，翻译后自动还原。'
  }
];

const DEFAULT_TERMS = protectionDefaults.terms;
const DEFAULT_PATTERNS = protectionDefaults.patterns;

function validatePattern(source) {
  try {
    const literal = source.match(/^\/(.+)\/([a-z]*)$/i);
    if (literal) new RegExp(literal[1], literal[2]);
    else new RegExp(source);
    return true;
  } catch {
    return false;
  }
}

function PatternRuleInput({ items, onChange, placeholder, disabledItems = [], onDisabledItemsChange }) {
  const [input, setInput] = useState('');
  const disabled = new Set(disabledItems);

  const addItems = (raw) => {
    const parsed = raw.split(/\n/).map(item => item.trim()).filter(Boolean);
    if (parsed.length === 0) return;
    const existing = new Set(items);
    const added = parsed.filter(item => !existing.has(item));
    if (added.length > 0) onChange([...items, ...added]);
    setInput('');
  };

  const removeItem = (index) => {
    const removed = items[index];
    onChange(items.filter((_, i) => i !== index));
    onDisabledItemsChange?.(disabledItems.filter(item => item !== removed));
  };

  const toggleItem = (item) => {
    const next = new Set(disabledItems);
    if (next.has(item)) next.delete(item);
    else next.add(item);
    onDisabledItemsChange?.(Array.from(next));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addItems(input);
    } else if (e.key === 'Backspace' && !input && items.length > 0) {
      removeItem(items.length - 1);
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text');
    if (pasted.includes('\n')) {
      e.preventDefault();
      addItems(pasted);
    }
  };

  return (
    <div className="space-y-2">
      <div className="space-y-2 bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 focus-within:border-blue-500/30 transition-colors">
        {items.map((item, index) => {
          const isInvalid = !validatePattern(item);
          const isDisabled = disabled.has(item);
          return (
            <div
              key={`${item}-${index}`}
              className={`flex items-start gap-2 rounded-lg border px-2 py-1.5 cursor-pointer transition-all ${
                isDisabled
                  ? 'bg-white/[0.02] border-white/5 text-white/15 opacity-40'
                  : isInvalid
                    ? 'bg-red-500/10 border-red-500/20 text-red-200/90'
                    : 'bg-blue-500/10 border-blue-500/20 text-blue-300/80'
              }`}
              onClick={() => toggleItem(item)}
            >
              <code className="flex-1 whitespace-pre-wrap break-all text-[11px] leading-relaxed font-mono">
                {item}
              </code>
              <button
                onClick={(e) => { e.stopPropagation(); removeItem(index); }}
                className="p-0.5 rounded transition-all text-blue-400/40 hover:text-red-400 hover:bg-red-500/20 shrink-0"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onBlur={() => { if (input.trim()) addItems(input); }}
          placeholder={items.length === 0 ? placeholder : ''}
          className="w-full bg-transparent border-none outline-none text-xs text-white/70 font-mono placeholder-white/20 py-1"
        />
      </div>
    </div>
  );
}

export default function AdvancedSettingsPanel() {
  const { t } = useTranslation();
  const { config, updateCursorConfig, updateClaudeConfig, updateProtectionConfig } = useConfigStore();

  const cursorFeatures = config.cursor.features || {};
  const claudeFeatures = config.claude.features || {};
  const protection = useMemo(() => config.protection || {}, [config.protection]);
  const terms = Array.isArray(protection.terms) ? protection.terms : DEFAULT_TERMS;
  const patterns = Array.isArray(protection.patterns) ? protection.patterns : DEFAULT_PATTERNS;
  const disabledTerms = Array.isArray(protection.disabledTerms) ? protection.disabledTerms : [];
  const disabledPatterns = Array.isArray(protection.disabledPatterns) ? protection.disabledPatterns : [];
  const invalidPatterns = patterns.filter(pattern => !validatePattern(pattern));

  const isEnabled = (key) => cursorFeatures[key] !== false && claudeFeatures[key] !== false;

  const updateFeature = (key, enabled) => {
    const nextCursor = { ...config.cursor, features: { ...cursorFeatures, [key]: enabled } };
    const nextClaude = { ...config.claude, features: { ...claudeFeatures, [key]: enabled } };
    updateCursorConfig({ features: nextCursor.features });
    updateClaudeConfig({ features: nextClaude.features });
  };

  const updateProtection = (field, value) => {
    updateProtectionConfig({ [field]: value });
  };

  const restoreProtectionField = (field, value) => {
    const disabledField = field === 'terms' ? 'disabledTerms' : field === 'patterns' ? 'disabledPatterns' : null;
    const updates = { [field]: value };
    if (disabledField) {
      updates[disabledField] = [];
    }
    updateProtectionConfig(updates);
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="bg-[#1A1C1E] border border-white/5 rounded-3xl p-6 space-y-6">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-white/60">
            {t('navAdvancedSettings', '高级设置')}
          </h3>
          <p className="text-xs text-white/30 mt-2 leading-relaxed">
            {t('advancedSettingsDesc', '这些设置控制注入到 Cursor 和 Codex/Claude 内核里的保护规则，默认开启。')}
          </p>
        </div>

        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/15 bg-amber-500/8 p-4 text-amber-200/80">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-300/80" />
          <p className="text-xs leading-relaxed">
            {t('advancedSettingsRedeployNotice', '这里的所有修改都需要重新部署对应应用后才会生效。')}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {SETTINGS.map(item => {
            const Icon = item.icon;
            const checked = isEnabled(item.key);

            return (
              <label
                key={item.key}
                className="flex items-center gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl cursor-pointer hover:bg-white/[0.08] transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white/70 group-hover:text-white/90">
                    {t(item.titleKey, item.titleFallback)}
                  </p>
                  <p className="text-xs text-white/30 leading-relaxed mt-1">
                    {t(item.descKey, item.descFallback)}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={e => updateFeature(item.key, e.target.checked)}
                  className="w-5 h-5 rounded-lg bg-black/40 border-white/10 text-blue-500 focus:ring-blue-500/20 shrink-0"
                />
              </label>
            );
          })}
        </div>
      </div>

      {isEnabled('enableProtectedTermGuard') && (
      <div className="bg-[#1A1C1E] border border-white/5 rounded-3xl p-6 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-white/60">
                {t('advancedRuleConfig', '规则配置')}
              </h3>
              <p className="text-xs text-white/30 mt-1">
                {t('advancedRuleConfigDesc', '这两张表会随部署注入内核，可像黑名单配置一样直接编辑。')}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold uppercase tracking-widest text-white/60">
                {t('advancedFixedTerms', '固定术语表')}
              </h3>
              <button
                onClick={() => restoreProtectionField('terms', DEFAULT_TERMS)}
                className="flex items-center gap-1 px-2 py-1 text-[10px] text-white/20 hover:text-white/50 hover:bg-white/5 rounded-lg transition-all shrink-0"
                title={t('skipRulesRestoreDefaultTitle')}
              >
                <RotateCcw className="w-3 h-3" />
                {t('skipRulesRestoreDefault')}
              </button>
            </div>
            <p className="text-xs text-white/30 mt-1">
              {t('advancedFixedTermsDesc', '像黑名单一样添加、删除或粘贴多个固定术语；逗号或换行会自动拆分。')}
            </p>
            <SkipChipInput
              type="terms"
              items={terms}
              onChange={value => updateProtection('terms', value)}
              disabledItems={disabledTerms}
              onDisabledItemsChange={value => updateProtection('disabledTerms', value)}
              placeholder={t('advancedFixedTermsPlaceholder', '输入术语，回车确认...')}
              addOnBlur={true}
              addOnComma={false}
              addOnPaste={true}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold uppercase tracking-widest text-white/60">
                {t('advancedRegexTerms', '正则术语表')}
              </h3>
              <button
                onClick={() => restoreProtectionField('patterns', DEFAULT_PATTERNS)}
                className="flex items-center gap-1 px-2 py-1 text-[10px] text-white/20 hover:text-white/50 hover:bg-white/5 rounded-lg transition-all shrink-0"
                title={t('skipRulesRestoreDefaultTitle')}
              >
                <RotateCcw className="w-3 h-3" />
                {t('skipRulesRestoreDefault')}
              </button>
            </div>
            <p className="text-xs text-white/30 mt-1">
              {t('advancedRegexTermsDesc', '可以直接修改模型名和术语保护正则，一条规则一个 chip。支持 /pattern/flags 形式。')}
            </p>
            <div className="rounded-2xl border border-white/5 bg-black/20 p-3 space-y-2">
              <p className="text-[11px] text-white/35 leading-relaxed">
                {t('advancedRegexSyntaxHint', '支持写法：普通正则内容（自动使用 g 标志），或 /pattern/flags 形式。每条规则单独一行，按 Enter 添加；粘贴多行会自动拆分。')}
              </p>
              <div className="grid grid-cols-1 gap-2">
                <code className="rounded-lg bg-white/5 border border-white/5 px-2 py-1.5 text-[11px] text-emerald-300/80 break-all">
                  {String.raw`\bMyModel[-\s]?\d+\b`}
                </code>
                <code className="rounded-lg bg-white/5 border border-white/5 px-2 py-1.5 text-[11px] text-emerald-300/80 break-all">
                  /SpecialTerm/i
                </code>
              </div>
            </div>
            <PatternRuleInput
              items={patterns}
              onChange={value => updateProtection('patterns', value)}
              disabledItems={disabledPatterns}
              onDisabledItemsChange={value => updateProtection('disabledPatterns', value)}
              placeholder={t('advancedRegexTermsPlaceholder', String.raw`输入正则，例如 \bMyModel[-\s]?\d+\b`)}
            />
            {invalidPatterns.length > 0 && (
              <div className="rounded-2xl border border-red-500/15 bg-red-500/8 p-3 text-xs text-red-200/80">
                {t('advancedInvalidRegex', '以下正则无法编译：')} {invalidPatterns.join(', ')}
              </div>
            )}
          </div>
        </div>
      </div>
      )}

    </div>
  );
}
