'use strict';

/**
 * Bọc đối tượng giả lập: gọi thuộc tính chưa giả lập thì ném lỗi rõ ràng thay vì trả undefined
 * (quy tắc trong .claude/rules/gas-backend.md).
 */
const PASS = new Set(['then', 'toJSON', 'constructor', 'inspect', 'asymmetricMatch', 'nodeType', 'length']);

function strict(target, label) {
  return new Proxy(target, {
    get(obj, prop, receiver) {
      if (typeof prop === 'symbol' || PASS.has(prop) || prop in obj) return Reflect.get(obj, prop, receiver);
      if (typeof prop === 'string' && prop.startsWith('_')) return undefined;
      throw new Error(`Bộ giả lập chưa hỗ trợ ${label}.${String(prop)}`);
    }
  });
}

module.exports = { strict };
