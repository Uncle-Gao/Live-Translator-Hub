import { useState, useRef } from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';

// Parse raw user input into individual items. Handles:
// - HTML fragments → extracts class/id attributes
// - Bare class names → auto-prefixes with "."
// - Space-separated class names → concatenates with "."
// - Comma/newline as delimiters
function parseInput(raw, type) {
  const rawItems = raw.split(/[,\n]/).map(s => s.trim()).filter(Boolean);
  if (type !== 'selectors') return rawItems;

  return rawItems.map(item => {
    if (item.startsWith('<')) {
      const classMatch = item.match(/class=["'](.*?)["']/);
      const idMatch = item.match(/id=["'](.*?)["']/);
      if (classMatch) return '.' + classMatch[1].split(/\s+/).filter(c => c).join('.');
      if (idMatch) return '#' + idMatch[1];
      return item;
    }
    if (/^[a-zA-Z0-9_-]+$/.test(item)) return '.' + item;
    if (/\s/.test(item) && !item.startsWith('.') && !item.startsWith('#')) {
      return '.' + item.split(/\s+/).filter(c => c).join('.');
    }
    return item;
  });
}

const SkipChipInput = ({ items = [], onChange, placeholder, type = 'selectors' }) => {
  const [input, setInput] = useState('');
  const [disabled, setDisabled] = useState(new Set());
  const inputRef = useRef(null);

  const addItems = (raw) => {
    const parsed = parseInput(raw, type);
    if (parsed.length === 0) return;
    const existing = new Set(items);
    const added = parsed.filter(p => !existing.has(p));
    if (added.length > 0) onChange([...items, ...added]);
    setInput('');
  };

  const removeItem = (idx) => {
    onChange(items.filter((_, i) => i !== idx));
    // Clean up disabled index if this item was disabled
    setDisabled(prev => {
      const next = new Set(prev);
      next.delete(idx);
      // Shift indices above idx down by 1
      const shifted = new Set();
      for (const i of next) {
        shifted.add(i > idx ? i - 1 : i);
      }
      return shifted;
    });
  };

  const toggleItem = (idx) => {
    setDisabled(prev => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const removeDisabled = () => {
    if (disabled.size === 0) return;
    const indices = new Set(disabled);
    onChange(items.filter((_, i) => !indices.has(i)));
    setDisabled(new Set());
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addItems(input);
    } else if (e.key === 'Delete' && !input) {
      e.preventDefault();
      removeDisabled();
    } else if (e.key === 'Backspace' && !input && items.length > 0) {
      removeItem(items.length - 1);
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text');
    if (pasted.includes(',') || pasted.includes('\n') || (type === 'selectors' && pasted.includes('<'))) {
      e.preventDefault();
      addItems(pasted);
    }
  };

  const handleBlur = () => {
    if (input.trim()) addItems(input);
  };

  return (
    <div
      className="flex flex-wrap items-start gap-1.5 bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 min-h-[42px] cursor-text focus-within:border-blue-500/30 transition-colors"
      onClick={() => inputRef.current?.focus()}
    >
      {items.map((item, i) => {
        const isDisabled = disabled.has(i);
        return (
          <span
            key={`${item}-${i}`}
            className={clsx(
              "inline-flex items-center gap-1 px-2 py-0.5 border rounded-lg text-[11px] font-mono group transition-all select-none cursor-pointer",
              isDisabled
                ? "bg-white/[0.02] border-white/5 text-white/15 opacity-40"
                : "bg-blue-500/10 border-blue-500/20 text-blue-300/80 hover:border-blue-500/40"
            )}
            onClick={() => toggleItem(i)}
          >
            <span className="max-w-[200px] truncate">{item}</span>
            <button
              onClick={(e) => { e.stopPropagation(); removeItem(i); }}
              className="p-0.5 rounded transition-all text-blue-400/40 hover:text-red-400 hover:bg-red-500/20"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        );
      })}
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onBlur={handleBlur}
        placeholder={items.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-xs text-white/70 font-mono placeholder-white/20 py-0.5"
      />
    </div>
  );
};

export default SkipChipInput;
