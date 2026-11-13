'use strict';

/**
 * Giả lập SpreadsheetApp ở mức backend dùng tới.
 * Điểm quan trọng nhất: setValues mô phỏng việc Google Sheet tự đổi kiểu chuỗi
 * (0123 → số, 3-4 → ngày, =... → công thức) trừ khi ô định dạng văn bản thuần "@"
 * hoặc chuỗi bắt đầu bằng dấu nháy đơn. Nhờ vậy kiểm thử bắt được lỗi mất số 0 đầu
 * và lỗi chèn công thức. Điều nào là phỏng đoán thì smokeTest() kiểm chứng trên Sheet thật.
 */
const { strict } = require('./strict');

const DEFAULT_ROWS = 1000;
const DEFAULT_COLS = 26;
const FORMULA_RESULT = '#ERROR!';

let idSeq = 0;
function newId(prefix) {
  idSeq += 1;
  return `${prefix}_${idSeq}_${Math.random().toString(36).slice(2, 10)}`;
}

function isDate(v) {
  return Object.prototype.toString.call(v) === '[object Date]';
}

/** Mô phỏng nhận dạng kiểu khi ghi chuỗi vào ô định dạng tự động. */
function autoType(s) {
  if (/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(s)) return Number(s);
  if (/^[+-]?\d+(\.\d+)?%$/.test(s)) return Number(s.replace('%', '')) / 100;
  if (/^(true|false)$/i.test(s)) return s.toLowerCase() === 'true';
  let m = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/.exec(s);
  if (m) return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
  if (m) return new Date(Date.UTC(+m[3], +m[2] - 1, +m[1]));
  m = /^(\d{1,2})[-/](\d{1,2})$/.exec(s);
  if (m) return new Date(Date.UTC(2026, +m[2] - 1, +m[1]));
  return s;
}

/** Giá trị ghi vào ô → nội dung ô {v} hoặc {f: công thức}. */
function coerce(value, format) {
  if (value === null || value === undefined) return { v: '' };
  if (typeof value === 'string') {
    if (value.startsWith("'")) return { v: value.slice(1) };
    if (value.startsWith('=')) return { f: value };
    if (format === '@') return { v: value };
    if (/^[+\-@]/.test(value)) {
      const n = autoType(value);
      return typeof n === 'number' ? { v: n } : { f: value };
    }
    return { v: autoType(value) };
  }
  if (typeof value === 'number' || typeof value === 'boolean') return { v: value };
  if (isDate(value)) return { v: new Date(value.getTime()) };
  throw new Error(`Bộ giả lập: không ghi được giá trị kiểu ${typeof value} vào ô`);
}

class FakeProtection {
  constructor(range) {
    this._range = range;
    this._description = '';
    this._warningOnly = false;
  }
  setDescription(d) { this._description = d; return this._self; }
  getDescription() { return this._description; }
  setWarningOnly(w) { this._warningOnly = !!w; return this._self; }
  isWarningOnly() { return this._warningOnly; }
  getRange() { return this._range; }
}

class FakeValidationBuilder {
  constructor() { this._rule = { values: null, showDropdown: true, allowInvalid: true }; }
  requireValueInList(values, showDropdown) {
    this._rule.values = values.slice();
    this._rule.showDropdown = showDropdown !== false;
    return this._self;
  }
  setAllowInvalid(b) { this._rule.allowInvalid = !!b; return this._self; }
  build() { return Object.freeze({ ...this._rule, getCriteriaValues: () => [this._rule.values] }); }
}

class FakeRange {
  constructor(sheet, row, col, numRows, numCols) {
    if (row < 1 || col < 1 || numRows < 1 || numCols < 1) {
      throw new Error(`Phạm vi không hợp lệ (${row}, ${col}, ${numRows}, ${numCols})`);
    }
    if (row + numRows - 1 > sheet._maxRows || col + numCols - 1 > sheet._maxCols) {
      throw new Error('Phạm vi nằm ngoài kích thước trang tính');
    }
    this._sheet = sheet;
    this._r = row;
    this._c = col;
    this._nr = numRows;
    this._nc = numCols;
  }

  getRow() { return this._r; }
  getColumn() { return this._c; }
  getNumRows() { return this._nr; }
  getNumColumns() { return this._nc; }
  getSheet() { return this._sheet._self; }

  _each(fn) {
    const out = [];
    for (let i = 0; i < this._nr; i++) {
      const row = [];
      for (let j = 0; j < this._nc; j++) row.push(fn(this._r + i, this._c + j));
      out.push(row);
    }
    return out;
  }

  _checkDims(values) {
    if (!Array.isArray(values) || values.length !== this._nr || values.some((r) => !Array.isArray(r) || r.length !== this._nc)) {
      throw new Error(`Số dòng hoặc cột của dữ liệu không khớp phạm vi ${this._nr}×${this._nc}`);
    }
  }

  getValues() {
    this._sheet._ss._state.counters.sheetReads += 1;
    return this._each((r, c) => {
      const cell = this._sheet._cell(r, c);
      if (!cell) return '';
      if (cell.f) return FORMULA_RESULT;
      return isDate(cell.v) ? new Date(cell.v.getTime()) : cell.v;
    });
  }

  getValue() { return this.getCell(1, 1).getValues()[0][0]; }

  getFormulas() { return this._each((r, c) => (this._sheet._cell(r, c) || {}).f || ''); }

  getFormula() { return this.getCell(1, 1).getFormulas()[0][0]; }

  setValues(values) {
    this._checkDims(values);
    this._sheet._ss._state.counters.sheetWrites += 1;
    values.forEach((row, i) => row.forEach((v, j) => {
      const r = this._r + i;
      const c = this._c + j;
      this._sheet._setCell(r, c, coerce(v, this._sheet._format(r, c)));
    }));
    return this._self;
  }

  setValue(v) { return this.getCell(1, 1).setValues([[v]]) && this._self; }

  clearContent() {
    this._each((r, c) => this._sheet._setCell(r, c, { v: '' }));
    return this._self;
  }

  getCell(i, j) { return new FakeRange(this._sheet, this._r + i - 1, this._c + j - 1, 1, 1)._wrap(); }

  setNumberFormat(fmt) {
    this._sheet._formatRules.push({ r1: this._r, r2: this._r + this._nr - 1, c1: this._c, c2: this._c + this._nc - 1, fmt, seq: ++this._sheet._seq });
    return this._self;
  }

  setNumberFormats(formats) {
    this._checkDims(formats);
    formats.forEach((row, i) => row.forEach((fmt, j) => {
      this._sheet._cellFormats.set(`${this._r + i},${this._c + j}`, { fmt, seq: ++this._sheet._seq });
    }));
    return this._self;
  }

  getNumberFormat() { return this._sheet._format(this._r, this._c) || 'General'; }

  getNumberFormats() { return this._each((r, c) => this._sheet._format(r, c) || 'General'); }

  setNotes(notes) {
    this._checkDims(notes);
    notes.forEach((row, i) => row.forEach((n, j) => this._sheet._setNote(this._r + i, this._c + j, n)));
    return this._self;
  }

  setNote(n) { this._sheet._setNote(this._r, this._c, n); return this._self; }

  getNotes() { return this._each((r, c) => this._sheet._notes.get(`${r},${c}`) || ''); }

  getNote() { return this.getNotes()[0][0]; }

  setDataValidation(rule) {
    this._sheet._validations.push({ r1: this._r, r2: this._r + this._nr - 1, c1: this._c, c2: this._c + this._nc - 1, rule });
    return this._self;
  }

  getDataValidation() {
    const list = this._sheet._validations;
    for (let k = list.length - 1; k >= 0; k--) {
      const v = list[k];
      if (this._r >= v.r1 && this._r <= v.r2 && this._c >= v.c1 && this._c <= v.c2) return v.rule;
    }
    return null;
  }

  setFontWeight(w) { this._sheet._fontWeights.push({ r: this._r, c: this._c, nr: this._nr, nc: this._nc, w }); return this._self; }

  protect() {
    const p = new FakeProtection(this._self);
    p._self = strict(p, 'Protection');
    this._sheet._protections.push(p._self);
    return p._self;
  }

  _wrap() {
    this._self = strict(this, 'Range');
    return this._self;
  }
}

class FakeSheet {
  constructor(ss, name) {
    this._ss = ss;
    this._name = name;
    this._rows = []; // mảng dòng, mỗi dòng là mảng ô {v} hoặc {f}
    this._maxRows = DEFAULT_ROWS;
    this._maxCols = DEFAULT_COLS;
    this._formatRules = [];
    this._cellFormats = new Map();
    this._notes = new Map();
    this._validations = [];
    this._protections = [];
    this._fontWeights = [];
    this._frozenRows = 0;
    this._seq = 0;
    this._self = strict(this, 'Sheet');
  }

  _cell(r, c) {
    const row = this._rows[r - 1];
    return row ? row[c - 1] : undefined;
  }

  _setCell(r, c, content) {
    while (this._rows.length < r) this._rows.push([]);
    this._rows[r - 1][c - 1] = content;
  }

  _setNote(r, c, n) {
    const key = `${r},${c}`;
    if (n === null || n === undefined || n === '') this._notes.delete(key);
    else this._notes.set(key, String(n));
  }

  _format(r, c) {
    let best = null;
    const cell = this._cellFormats.get(`${r},${c}`);
    if (cell) best = cell;
    for (let k = this._formatRules.length - 1; k >= 0; k--) {
      const f = this._formatRules[k];
      if (best && f.seq < best.seq) break;
      if (r >= f.r1 && r <= f.r2 && c >= f.c1 && c <= f.c2) {
        if (!best || f.seq > best.seq) best = f;
        break;
      }
    }
    return best ? best.fmt : null;
  }

  _nonEmpty(cell) {
    return cell && (cell.f || (cell.v !== '' && cell.v !== null && cell.v !== undefined));
  }

  getName() { return this._name; }
  setName(n) { this._name = n; return this._self; }
  getParent() { return this._ss._self; }

  getLastRow() {
    for (let r = this._rows.length; r >= 1; r--) {
      if ((this._rows[r - 1] || []).some((cell) => this._nonEmpty(cell))) return r;
    }
    return 0;
  }

  getLastColumn() {
    let last = 0;
    this._rows.forEach((row) => row.forEach((cell, j) => { if (this._nonEmpty(cell) && j + 1 > last) last = j + 1; }));
    return last;
  }

  getMaxRows() { return this._maxRows; }
  getMaxColumns() { return this._maxCols; }

  getRange(row, col, numRows, numCols) {
    if (typeof row === 'string') throw new Error('Bộ giả lập chưa hỗ trợ Sheet.getRange(A1)');
    return new FakeRange(this, row, col, numRows || 1, numCols || 1)._wrap();
  }

  getDataRange() {
    return this.getRange(1, 1, Math.max(this.getLastRow(), 1), Math.max(this.getLastColumn(), 1));
  }

  insertRowsAfter(after, howMany) {
    if (after !== this._maxRows) throw new Error('Bộ giả lập chỉ hỗ trợ thêm dòng ở cuối sheet');
    this._maxRows += howMany;
    return this._self;
  }

  insertColumnsAfter(after, howMany) {
    if (after !== this._maxCols) throw new Error('Bộ giả lập chỉ hỗ trợ thêm cột ở cuối sheet');
    this._maxCols += howMany;
    return this._self;
  }

  setFrozenRows(n) { this._frozenRows = n; return this._self; }
  getFrozenRows() { return this._frozenRows; }

  getProtections(type) {
    if (type !== 'RANGE') throw new Error('Bộ giả lập chỉ hỗ trợ ProtectionType.RANGE');
    return this._protections.slice();
  }
}

class FakeSpreadsheet {
  constructor(state, name) {
    this._state = state;
    this._id = newId('ss');
    this._name = name;
    this._sheets = [];
    this._self = strict(this, 'Spreadsheet');
    this._addSheet('Trang tính1');
  }

  _addSheet(name) {
    const sh = new FakeSheet(this, name);
    this._sheets.push(sh);
    return sh._self;
  }

  getId() { return this._id; }
  getName() { return this._name; }
  getUrl() { return `https://docs.google.com/spreadsheets/d/${this._id}/edit`; }
  getSheets() { return this._sheets.map((s) => s._self); }

  getSheetByName(name) {
    const sh = this._sheets.find((s) => s._name === name);
    return sh ? sh._self : null;
  }

  insertSheet(name) {
    if (this._sheets.some((s) => s._name === name)) throw new Error(`Đã có trang tính tên "${name}"`);
    return this._addSheet(name);
  }

  deleteSheet(sheet) {
    if (this._sheets.length === 1) throw new Error('Không xóa được trang tính duy nhất');
    const idx = this._sheets.findIndex((s) => s._self === sheet);
    if (idx < 0) throw new Error('Trang tính không thuộc bảng tính này');
    this._sheets.splice(idx, 1);
  }
}

function createSpreadsheetApp(state) {
  state.spreadsheets = state.spreadsheets || new Map();
  const app = {
    ProtectionType: Object.freeze({ RANGE: 'RANGE', SHEET: 'SHEET' }),
    openById(id) {
      state.counters.openById += 1;
      const ss = state.spreadsheets.get(id);
      if (!ss || (state.drive && state.drive.isTrashed(id))) throw new Error(`Không mở được bảng tính ${id}`);
      return ss._self;
    },
    create(name) {
      const ss = new FakeSpreadsheet(state, name);
      state.spreadsheets.set(ss._id, ss);
      if (state.drive) state.drive.registerFile(ss._id, name, 'application/vnd.google-apps.spreadsheet');
      return ss._self;
    },
    flush() { state.counters.flush += 1; },
    newDataValidation() {
      const b = new FakeValidationBuilder();
      b._self = strict(b, 'DataValidationBuilder');
      return b._self;
    }
  };
  return strict(app, 'SpreadsheetApp');
}

module.exports = { createSpreadsheetApp, coerce, FORMULA_RESULT };
