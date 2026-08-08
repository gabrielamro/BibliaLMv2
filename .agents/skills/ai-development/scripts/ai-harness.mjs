#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const changed = process.argv.includes('--changed');
const fixtureIndex = process.argv.indexOf('--fixture');
const fixturePath = fixtureIndex >= 0 ? process.argv[fixtureIndex + 1] : '';
let fixture = null;
if (fixturePath) {
  try { fixture = JSON.parse(readFileSync(fixturePath, 'utf8')); }
  catch (error) { console.error(`Invalid fixture: ${error instanceof Error ? error.message : String(error)}`); process.exit(1); }
}
const run = (command, args) => { try { execFileSync(command, args, { stdio: 'inherit' }); return true; } catch { return false; } };
const guardArgs = ['.agents/skills/ai-development/scripts/ai-diff-guard.mjs'];
if (fixture?.include?.length) guardArgs.push('--scope', fixture.include.join(','));
if (!run('node', guardArgs)) process.exit(1);
if (changed) {
  const command = process.platform === 'win32' ? 'cmd.exe' : 'npm';
  const args = process.platform === 'win32' ? ['/d', '/s', '/c', 'npm run typecheck'] : ['run', 'typecheck'];
  if (!run(command, args)) process.exit(1);
}
if (fixture?.checks?.includes('typecheck') && !changed) {
  const command = process.platform === 'win32' ? 'cmd.exe' : 'npm';
  const args = process.platform === 'win32' ? ['/d', '/s', '/c', 'npm run typecheck'] : ['run', 'typecheck'];
  if (!run(command, args)) process.exit(1);
}
console.log(JSON.stringify({ ok: true, mode: fixture ? 'fixture' : changed ? 'changed' : 'structural', fixture: fixture?.id ?? null, externalAiCalls: 0 }));
