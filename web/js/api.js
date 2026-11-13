/**
 * Module duy nhất gọi server (quy tắc .claude/rules/web-frontend.md):
 * - POST text/plain để tránh preflight CORS mà Apps Script không xử lý được;
 * - action ghi luôn có requestId; gửi lại dùng đúng requestId cũ nên server không ghi hai lần;
 * - thời gian chờ 30 giây;
 * - SESSION_EXPIRED/SESSION_INVALID/AUTH_REQUIRED: báo cho app để đưa về màn hình đăng nhập.
 */
import { CONFIG } from '../config.js?v=0.2.0';
import { S } from './strings.js?v=0.2.0';
import * as store from './store.js?v=0.2.0';

const TIMEOUT_MS = 30000;
const SESSION_CODES = new Set(['SESSION_EXPIRED', 'SESSION_INVALID', 'AUTH_REQUIRED']);

let onSessionLost = () => {};

export class ApiError extends Error {
  constructor(code, message, { details, retryable = false, requestId = '' } = {}) {
    super(message);
    this.code = code;
    this.details = details;
    this.retryable = retryable;
    this.requestId = requestId;
  }
}

export function setSessionLostHandler(fn) {
  onSessionLost = fn;
}

export function newRequestId() {
  if (globalThis.crypto && crypto.randomUUID) return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('').replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5');
}

async function send(action, data, requestId) {
  if (!CONFIG.API_URL) throw new ApiError('NOT_CONFIGURED', S.notConfigured);
  const body = { action, data: data || {} };
  const session = store.get('session');
  if (session && session.token) body.session = session.token;
  if (requestId) body.requestId = requestId;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let response;
  try {
    response = await fetch(CONFIG.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body),
      redirect: 'follow',
      signal: controller.signal
    });
  } catch (err) {
    const timeout = err && err.name === 'AbortError';
    throw new ApiError(timeout ? 'TIMEOUT' : 'NETWORK', timeout ? S.timeoutError : S.networkError, { retryable: true, requestId });
  } finally {
    clearTimeout(timer);
  }

  let json;
  try {
    json = await response.json();
  } catch {
    throw new ApiError('BAD_RESPONSE', S.serverBadResponse, { retryable: true, requestId });
  }
  if (!json || json.ok !== true) {
    const e = (json && json.error) || {};
    const code = e.code || 'SERVER_ERROR';
    if (SESSION_CODES.has(code)) onSessionLost(code);
    throw new ApiError(code, e.message || S.serverBadResponse, { details: e.details, retryable: code === 'BUSY', requestId });
  }
  return json.data;
}

/** Action chỉ đọc. */
export function read(action, data) {
  return send(action, data, '');
}

/**
 * Action ghi. Gửi lại sau lỗi mạng: truyền đúng requestId của lần trước (ApiError.requestId).
 */
export function write(action, data, requestId) {
  return send(action, data, requestId || newRequestId());
}
