/**
 * Apple .strings 格式化器
 * 输出格式：每行 "English original" = "Translation";\n\n
 * 注释行和空行原样保留
 */

'use strict';

/**
 * 将翻译结果重新组装为 .strings 格式内容
 * @param {string[]} lines       原始文件所有行（split('\n')）
 * @param {Array<{ key, value, rawLine, lineIndex }>} entries  提取的条目
 * @param {object} resultMap     { key → 译文字符串 }
 * @returns {string}             新 .strings 文件内容
 */
function format(lines, entries, resultMap) {
  // 构建行索引 → 新内容的映射
  const replacements = new Map();
  for (const entry of entries) {
    const translated = resultMap[entry.key];
    if (translated !== undefined) {
      // 转义译文中的双引号
      const escaped = escapeStringValue(translated);
      replacements.set(entry.lineIndex, `"${escapeStringValue(entry.key)}" = "${escaped}";`);
    }
  }

  // 重建所有行
  const newLines = lines.map((line, i) => {
    if (replacements.has(i)) return replacements.get(i);
    return line;
  });

  return newLines.join('\n');
}

/**
 * 转义 .strings 值中的特殊字符
 */
function escapeStringValue(str) {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
}

module.exports = { format, escapeStringValue };
