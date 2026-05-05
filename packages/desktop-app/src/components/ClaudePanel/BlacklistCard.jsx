import { RotateCcw } from 'lucide-react';
import useConfigStore from '../../store/configStore';
import SkipChipInput from '../CursorPanel/SkipRules/SkipChipInput';

const CLAUDE_DEFAULT_SKIPS = {
  selectors: [
    '.monaco-breadcrumbs',
    '.view-lines',
    '.monaco-list-row',
    '.pane-header',
    '.xterm-link-layer',
    '.conversations',
    '.aislash-editor-input',
    '.composer-file-list-item',
    '.agent-sidebar-cell-content-wrapper',
    '.code-block',
    '.mantine-CodeHighlight-root',
    'pre',
    'code',
  ],
  titles: [],
  urls: [],
};

const BlacklistCard = () => {
  const { config, updateClaudeConfig } = useConfigStore();
  const claude = config.claude;
  const skip = claude.skip?._claude_ || {};

  const updateSkip = (field, value) => {
    updateClaudeConfig({
      skip: { _claude_: { ...skip, [field]: value } }
    });
  };

  const restoreDefaults = () => {
    updateClaudeConfig({
      skip: { _claude_: { ...CLAUDE_DEFAULT_SKIPS } }
    });
  };

  return (
    <div className="bg-[#1A1C1E] border border-white/5 rounded-3xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-widest text-white/60">黑名单配置</h3>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-[10px] text-white/20 uppercase tracking-wider">CSS 选择器</label>
          <SkipChipInput
            type="selectors"
            items={Array.isArray(skip.selectors) ? skip.selectors : []}
            onChange={v => updateSkip('selectors', v)}
            placeholder="粘贴或输入选择器，回车确认..."
          />
          <div className="flex justify-end">
            <button
              onClick={restoreDefaults}
              className="flex items-center gap-1 px-2 py-1 text-[10px] text-white/20 hover:text-white/50 hover:bg-white/5 rounded-lg transition-all"
              title="恢复默认黑名单配置"
            >
              <RotateCcw className="w-3 h-3" />
              恢复默认
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] text-white/20 uppercase tracking-wider">跳过窗口标题</label>
            <SkipChipInput
              type="titles"
              items={Array.isArray(skip.titles) ? skip.titles : []}
              onChange={v => updateSkip('titles', v)}
              placeholder="Settings, Welcome..."
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-white/20 uppercase tracking-wider">跳过匹配网址</label>
            <SkipChipInput
              type="urls"
              items={Array.isArray(skip.urls) ? skip.urls : []}
              onChange={v => updateSkip('urls', v)}
              placeholder="vscode-extension://..."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlacklistCard;
