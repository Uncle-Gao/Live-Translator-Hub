import useConfigStore from '../../../store/configStore';
import SkipChipInput from './SkipChipInput';

const WebviewGlobalSkips = () => {
  const { config, updateCursorSkipRules } = useConfigStore();
  const globalSkip = config.cursor.skipRules?.webview?._global_ || {};

  const update = (field, value) => {
    updateCursorSkipRules('_global_', { [field]: value });
  };

  const toArray = (v) => (Array.isArray(v) ? v : typeof v === 'string' ? v.split(',').map(s => s.trim()).filter(Boolean) : []);

  return (
    <div className="space-y-4">
      <h4 className="text-xs font-bold text-white/50 uppercase tracking-wider">插件通用黑名单</h4>

      <div className="space-y-2">
        <label className="text-[10px] text-white/20 uppercase tracking-wider">CSS 选择器</label>
        <SkipChipInput
          type="selectors"
          items={toArray(globalSkip.selectors)}
          onChange={v => update('selectors', v)}
          placeholder="粘贴或输入选择器，回车确认..."
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[10px] text-white/20 uppercase tracking-wider">跳过窗口标题</label>
          <SkipChipInput
            type="titles"
            items={toArray(globalSkip.titles)}
            onChange={v => update('titles', v)}
            placeholder="Output, Terminal..."
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] text-white/20 uppercase tracking-wider">跳过匹配网址</label>
          <SkipChipInput
            type="urls"
            items={toArray(globalSkip.urls)}
            onChange={v => update('urls', v)}
            placeholder="vscode-extension://..."
          />
        </div>
      </div>
    </div>
  );
};

export default WebviewGlobalSkips;
