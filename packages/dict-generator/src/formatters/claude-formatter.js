/**
 * Claude 字典格式化器
 * 输出格式：flat hash:value JSON（与 zh-CN.json 完全相同的格式）
 * key 是不可读的 hash，value 是译文字符串
 */

'use strict';

/**
 * 将翻译结果组装为 Claude flat JSON
 * @param {object} enMap        hash → 英文原文（原始 en-US.json）
 * @param {object} resultMap    hash → 译文字符串
 * @returns {object}            输出 JSON 对象 { hash: translatedText, ... }
 */
function format(enMap, resultMap) {
  const output = {};
  for (const hash of Object.keys(enMap)) {
    output[hash] = resultMap[hash] ?? enMap[hash]; // 缺失时保留英文原文
  }
  return output;
}

/**
 * 序列化为格式化 JSON 字符串
 * @param {object} dict
 * @returns {string}
 */
function serialize(dict) {
  return JSON.stringify(dict, null, 2) + '\n';
}

module.exports = { format, serialize };
