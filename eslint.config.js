'use strict';

/**
 * ESLint cho backend Apps Script (gas/) và kiểm thử (tests/).
 * Mọi file gas/*.js chung một phạm vi toàn cục khi chạy trên Apps Script, nên các không gian tên
 * của backend (Config, Util, Repo...) được khai báo là biến toàn cục ở đây.
 */
const js = require('@eslint/js');
const globals = require('globals');

const GOOGLE_SERVICES = [
  'SpreadsheetApp', 'PropertiesService', 'CacheService', 'LockService', 'DriveApp', 'MailApp',
  'UrlFetchApp', 'Utilities', 'Session', 'ContentService', 'Logger', 'ScriptApp', 'HtmlService'
];

// Không gian tên và hàm toàn cục của backend (thêm vào đây khi tạo file mới trong gas/)
const BACKEND_GLOBALS = [
  'Config', 'Util', 'Repo', 'Migrations', 'Setup', 'SmokeTest',
  'setup', 'smokeTest'
];

function asGlobals(names, mode) {
  return Object.fromEntries(names.map((n) => [n, mode]));
}

module.exports = [
  js.configs.recommended,
  {
    files: ['gas/**/*.js'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'script',
      globals: {
        ...asGlobals(GOOGLE_SERVICES, 'readonly'),
        ...asGlobals(BACKEND_GLOBALS, 'writable')
      }
    },
    rules: {
      'no-redeclare': ['error', { builtinGlobals: false }],
      'no-unused-vars': ['error', { vars: 'local', args: 'none' }],
      'no-control-regex': 'off',
      'no-restricted-syntax': ['error',
        { selector: 'ImportDeclaration', message: 'Apps Script không hỗ trợ import.' },
        { selector: 'ExportNamedDeclaration', message: 'Apps Script không hỗ trợ export.' }
      ],
      'no-restricted-properties': ['error',
        { object: 'console', property: 'log', message: 'Không ghi dữ liệu ra console; dùng Logger ở hàm chạy tay.' }
      ],
      eqeqeq: ['error', 'smart']
    }
  },
  {
    files: ['tests/**/*.js', 'eslint.config.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'commonjs',
      globals: { ...globals.node }
    },
    rules: {
      'no-unused-vars': ['error', { args: 'none' }],
      eqeqeq: ['error', 'smart']
    }
  }
];
