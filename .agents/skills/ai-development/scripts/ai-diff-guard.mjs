#!/usr/bin/env node
import { execFileSync } from 'node:child_process';

const args = process.argv.slice(2);
const index = args.indexOf('--base');
const base = index >= 0 ? args[index + 1] : 'HEAD';
const scopeIndex = args.indexOf('--scope');
const scope = scopeIndex >= 0 ? args[scopeIndex + 1].split(',').map((item) => item.trim()).filter(Boolean) : [];
const output = execFileSync('git', ['diff', '--name-only', base], { encoding: 'utf8' }).trim();
const files = output ? output.split(/\r?\n/).filter(Boolean) : [];
const forbidden = files.filter((file) => /(^|[\\/])(\.env|node_modules|\.next)([\\/]|$)|\.(pem|key)$/.test(file));
if (forbidden.length) { console.error(JSON.stringify({ ok: false, reason: 'forbidden-files', files: forbidden }, null, 2)); process.exit(1); }
const outsideScope = scope.length ? files.filter((file) => !scope.some((allowed) => file === allowed || file.startsWith(`${allowed.replace(/\\\\/g, '/')}/`))) : [];
if (outsideScope.length) { console.error(JSON.stringify({ ok: false, reason: 'outside-scope', scope, files: outsideScope }, null, 2)); process.exit(1); }
console.log(JSON.stringify({ ok: true, base, scope: scope.length ? scope : null, changedFiles: files, changedCount: files.length }, null, 2));
