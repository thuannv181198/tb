'use strict';

/**
 * Giả lập các dịch vụ Google ngoài Spreadsheet: Properties, Cache, Lock, Drive, Mail,
 * UrlFetch, Utilities, Session, ContentService, Logger. Chỉ cài phương thức backend dùng.
 */
const crypto = require('node:crypto');
const { strict } = require('./strict');

// ---------- PropertiesService ----------

function createPropertiesService(state) {
  const store = state.props;
  const scriptProps = strict({
    getProperty(k) { state.counters.propReads += 1; return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
    getProperties() { state.counters.propReads += 1; return { ...store }; },
    getKeys() { state.counters.propReads += 1; return Object.keys(store); },
    setProperty(k, v) { state.counters.propWrites += 1; store[k] = String(v); return scriptProps; },
    setProperties(obj, deleteAllOthers) {
      state.counters.propWrites += 1;
      if (deleteAllOthers) Object.keys(store).forEach((k) => delete store[k]);
      Object.keys(obj).forEach((k) => { store[k] = String(obj[k]); });
      return scriptProps;
    },
    deleteProperty(k) { state.counters.propWrites += 1; delete store[k]; return scriptProps; }
  }, 'ScriptProperties');
  return strict({ getScriptProperties: () => scriptProps }, 'PropertiesService');
}

// ---------- CacheService ----------

const CACHE_MAX_VALUE_BYTES = 100 * 1024;
const CACHE_MAX_KEY = 250;
const CACHE_MAX_TTL = 21600;

function createCacheService(state) {
  const items = state.cache; // Map key → {value, expires}
  function check(key, value) {
    if (typeof key !== 'string' || key.length > CACHE_MAX_KEY) throw new Error('Khóa bộ đệm quá dài hoặc không hợp lệ');
    if (value !== undefined) {
      if (typeof value !== 'string') throw new Error('Giá trị bộ đệm phải là chuỗi');
      if (Buffer.byteLength(value, 'utf8') > CACHE_MAX_VALUE_BYTES) throw new Error('Argument too large: value');
    }
  }
  function alive(key) {
    const it = items.get(key);
    if (!it) return null;
    if (it.expires <= state.clock.now()) { items.delete(key); return null; }
    return it.value;
  }
  const cache = strict({
    get(key) { check(key); state.counters.cacheReads += 1; return alive(key); },
    getAll(keys) {
      state.counters.cacheReads += 1;
      const out = {};
      keys.forEach((k) => { check(k); const v = alive(k); if (v !== null) out[k] = v; });
      return out;
    },
    put(key, value, ttl) {
      check(key, value);
      const seconds = Math.min(ttl === undefined ? 600 : ttl, CACHE_MAX_TTL);
      items.set(key, { value, expires: state.clock.now() + seconds * 1000 });
    },
    putAll(obj, ttl) { Object.keys(obj).forEach((k) => cache.put(k, obj[k], ttl)); },
    remove(key) { check(key); items.delete(key); },
    removeAll(keys) { keys.forEach((k) => items.delete(k)); }
  }, 'Cache');
  return strict({ getScriptCache: () => cache }, 'CacheService');
}

// ---------- LockService ----------

function createLockService(state) {
  function newLock() {
    let held = false;
    return strict({
      tryLock() {
        state.counters.lockAttempts += 1;
        if (state.lock.failNext > 0) { state.lock.failNext -= 1; return false; }
        if (state.lock.alwaysFail) return false;
        held = true;
        state.lock.held += 1;
        return true;
      },
      waitLock(ms) {
        if (!this.tryLock(ms)) throw new Error('Lock timeout: another process was holding the lock for too long.');
      },
      hasLock() { return held; },
      releaseLock() { if (held) { held = false; state.lock.held -= 1; } }
    }, 'Lock');
  }
  return strict({ getScriptLock: newLock }, 'LockService');
}

// ---------- DriveApp ----------

function createDrive(state) {
  const files = new Map(); // id → {id, name, mime, parent, trashed, isFolder, bytes}
  let seq = 0;
  const newId = (p) => `${p}_${++seq}_${Math.random().toString(36).slice(2, 8)}`;

  const rootId = 'root';
  files.set(rootId, { id: rootId, name: 'Drive của tôi', isFolder: true, parent: null, trashed: false });

  function wrapFolder(rec) {
    const folder = strict({
      getId: () => rec.id,
      getName: () => rec.name,
      createFolder(name) {
        const child = { id: newId('folder'), name, isFolder: true, parent: rec.id, trashed: false };
        files.set(child.id, child);
        return wrapFolder(child);
      },
      setTrashed(b) { rec.trashed = !!b; return folder; },
      isTrashed: () => rec.trashed
    }, 'Folder');
    return folder;
  }

  function wrapFile(rec) {
    const file = strict({
      getId: () => rec.id,
      getName: () => rec.name,
      getMimeType: () => rec.mime,
      moveTo(folder) { rec.parent = folder.getId(); return file; },
      setTrashed(b) { rec.trashed = !!b; return file; },
      isTrashed: () => rec.trashed,
      getParents() {
        const parent = files.get(rec.parent);
        const list = parent ? [wrapFolder(parent)] : [];
        let i = 0;
        return strict({ hasNext: () => i < list.length, next: () => list[i++] }, 'FolderIterator');
      }
    }, 'File');
    return file;
  }

  const api = {
    registerFile(id, name, mime) { files.set(id, { id, name, mime, parent: rootId, trashed: false, isFolder: false }); },
    isTrashed(id) { const f = files.get(id); return !!(f && f.trashed); },
    records: files
  };

  const app = strict({
    getRootFolder: () => wrapFolder(files.get(rootId)),
    createFolder(name) {
      const rec = { id: newId('folder'), name, isFolder: true, parent: rootId, trashed: false };
      files.set(rec.id, rec);
      return wrapFolder(rec);
    },
    getFolderById(id) {
      const rec = files.get(id);
      if (!rec || !rec.isFolder) throw new Error(`Không tìm thấy thư mục ${id}`);
      return wrapFolder(rec);
    },
    getFileById(id) {
      const rec = files.get(id);
      if (!rec || rec.isFolder) throw new Error(`Không tìm thấy tệp ${id}`);
      return wrapFile(rec);
    }
  }, 'DriveApp');

  return { app, api };
}

// ---------- MailApp ----------

function createMailApp(state) {
  return strict({
    getRemainingDailyQuota: () => state.mail.quota,
    sendEmail(arg, subject, body, options) {
      const msg = typeof arg === 'object' ? { ...arg } : { to: arg, subject, body, ...(options || {}) };
      const recipients = String(msg.to || '').split(',').filter((s) => s.trim()).length;
      if (recipients === 0) throw new Error('Thiếu người nhận');
      if (state.mail.quota < recipients) throw new Error('Service invoked too many times for one day: email.');
      state.mail.quota -= recipients;
      state.mail.sent.push(msg);
    }
  }, 'MailApp');
}

// ---------- UrlFetchApp ----------

function createUrlFetchApp(state) {
  return strict({
    fetch(url, params) {
      state.counters.urlFetch += 1;
      if (!state.urlFetch.handler) throw new Error(`Bộ giả lập: chưa khai báo phản hồi cho ${url}`);
      const res = state.urlFetch.handler(url, params || {});
      const code = res.code || 200;
      const body = typeof res.body === 'string' ? res.body : JSON.stringify(res.body || {});
      if (code >= 400 && !(params && params.muteHttpExceptions)) throw new Error(`Request failed for ${url} returned code ${code}`);
      return strict({
        getResponseCode: () => code,
        getContentText: () => body,
        getHeaders: () => res.headers || {}
      }, 'HTTPResponse');
    }
  }, 'UrlFetchApp');
}

// ---------- Utilities ----------

/** Byte[] của Apps Script là số có dấu −128..127. */
function toSignedBytes(buf) {
  return Array.from(buf, (b) => (b > 127 ? b - 256 : b));
}

function toBuffer(v) {
  if (typeof v === 'string') return Buffer.from(v, 'utf8');
  if (Array.isArray(v)) return Buffer.from(v.map((b) => (b < 0 ? b + 256 : b)));
  throw new Error('Bộ giả lập Utilities: dữ liệu phải là chuỗi hoặc mảng byte');
}

/** Utilities.formatDate theo mẫu kiểu Java SimpleDateFormat (các ký hiệu backend dùng). */
function formatDate(date, tz, pattern) {
  const parts = {};
  new Intl.DateTimeFormat('en-GB', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
  }).formatToParts(date).forEach((p) => { parts[p.type] = p.value; });
  const offsetMin = Math.round((Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second) -
    Math.floor(date.getTime() / 1000) * 1000) / 60000);
  const sign = offsetMin >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMin);
  const xxx = `${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`;
  const tokens = {
    yyyy: parts.year, MM: parts.month, dd: parts.day, HH: parts.hour, mm: parts.minute, ss: parts.second,
    SSS: String(date.getTime() % 1000).padStart(3, '0'), XXX: xxx
  };
  let out = '';
  for (let i = 0; i < pattern.length;) {
    if (pattern[i] === "'") {
      const end = pattern.indexOf("'", i + 1);
      out += pattern.slice(i + 1, end);
      i = end + 1;
      continue;
    }
    const tok = ['yyyy', 'SSS', 'XXX', 'MM', 'dd', 'HH', 'mm', 'ss'].find((t) => pattern.startsWith(t, i));
    if (tok) { out += tokens[tok]; i += tok.length; continue; }
    if (/[A-Za-z]/.test(pattern[i])) throw new Error(`Bộ giả lập formatDate chưa hỗ trợ ký hiệu "${pattern[i]}" trong "${pattern}"`);
    out += pattern[i];
    i += 1;
  }
  return out;
}

function createUtilities() {
  return strict({
    Charset: Object.freeze({ UTF_8: 'UTF_8', US_ASCII: 'US_ASCII' }),
    DigestAlgorithm: Object.freeze({ SHA_256: 'SHA_256', MD5: 'MD5' }),
    formatDate,
    getUuid: () => crypto.randomUUID(),
    sleep() {},
    computeHmacSha256Signature(value, key) {
      return toSignedBytes(crypto.createHmac('sha256', toBuffer(key)).update(toBuffer(value)).digest());
    },
    computeDigest(algorithm, value) {
      const name = { SHA_256: 'sha256', MD5: 'md5' }[algorithm];
      if (!name) throw new Error(`Bộ giả lập computeDigest chưa hỗ trợ ${algorithm}`);
      return toSignedBytes(crypto.createHash(name).update(toBuffer(value)).digest());
    },
    base64Encode: (v) => toBuffer(v).toString('base64'),
    base64EncodeWebSafe: (v) => toBuffer(v).toString('base64').replace(/\+/g, '-').replace(/\//g, '_'),
    base64Decode: (s) => toSignedBytes(Buffer.from(s, 'base64')),
    base64DecodeWebSafe: (s) => toSignedBytes(Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64')),
    newBlob(data, contentType, name) {
      const bytes = toBuffer(data);
      const blob = strict({
        getBytes: () => toSignedBytes(bytes),
        getDataAsString: () => bytes.toString('utf8'),
        getContentType: () => contentType || null,
        getName: () => name || null,
        setName(n) { name = n; return blob; }
      }, 'Blob');
      return blob;
    }
  }, 'Utilities');
}

// ---------- Session, ContentService, Logger ----------

function createSession(state) {
  const user = (email) => strict({ getEmail: () => email }, 'User');
  return strict({
    getEffectiveUser: () => user(state.session.effectiveEmail),
    getActiveUser: () => user(state.session.activeEmail),
    getScriptTimeZone: () => 'Asia/Ho_Chi_Minh'
  }, 'Session');
}

function createContentService() {
  const MimeType = Object.freeze({ JSON: 'JSON', TEXT: 'TEXT' });
  return strict({
    MimeType,
    createTextOutput(content) {
      let mime = 'TEXT';
      const out = strict({
        getContent: () => content,
        setMimeType(m) { mime = m; return out; },
        getMimeType: () => mime
      }, 'TextOutput');
      return out;
    }
  }, 'ContentService');
}

function createLogger(state) {
  return strict({
    log(...args) { state.logs.push(args.map(String).join(' ')); }
  }, 'Logger');
}

module.exports = {
  createPropertiesService,
  createCacheService,
  createLockService,
  createDrive,
  createMailApp,
  createUrlFetchApp,
  createUtilities,
  createSession,
  createContentService,
  createLogger,
  formatDate
};
