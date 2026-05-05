import { RotateCcw } from 'lucide-react';
import useConfigStore from '../../../store/configStore';
import SkipChipInput from './SkipChipInput';

const CURSOR_DEFAULT_SKIPS = {
  selectors: [
    '.monaco-breadcrumbs',
    '.view-lines.monaco-mouse-cursor-text',
    '.monaco-list-row',
    '.pane-header.expanded',
    '.xterm-link-layer',
    '.conversations',
    '.aislash-editor-input',
    '.composer-file-list-item',
    '.agent-sidebar-cell-content-wrapper',
    '[data-resource-name*="."]',
  ],
  titles: [],
  urls: [],
};

const WorkbenchSkips = () => {
  const { config, updateCursorSkipRules } = useConfigStore();
  const skip = config.cursor.skip?._cursor_ || {};

  const update = (field, value) => {
    updateCursorSkipRules('_workbench_', { [field]: value });
  };

  const restoreDefaults = () => {
    updateCursorSkipRules('_workbench_', { ...CURSOR_DEFAULT_SKIPS });
  };

  return (
    <div className="space-y-4">
      <h4 className="text-xs font-bold text-white/50 uppercase tracking-wider">主页面黑名单</h4>

      <div className="space-y-2">
        <label className="text-[10px] text-white/20 uppercase tracking-wider">CSS 选择器</label>
        <SkipChipInput
          type="selectors"
          items={Array.isArray(skip.selectors) ? skip.selectors : []}
          onChange={v => update('selectors', v)}
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
            onChange={v => update('titles', v)}
            placeholder="Output, Terminal..."
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] text-white/20 uppercase tracking-wider">跳过匹配网址</label>
          <SkipChipInput
            type="urls"
            items={Array.isArray(skip.urls) ? skip.urls : []}
            onChange={v => update('urls', v)}
            placeholder="vscode-extension://..."
          />
        </div>
      </div>
    </div>
  );
};

export default WorkbenchSkips;
