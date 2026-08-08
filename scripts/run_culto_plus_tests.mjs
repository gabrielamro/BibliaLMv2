import { mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const outDir = resolve('.tmp-tests');
const testEntries = [
  'tests/serviceModality.test.ts',
  'tests/cultoPlusCalendar.test.ts',
];

function run(command, args) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(command, args, { stdio: 'inherit' });
    child.on('error', rejectRun);
    child.on('exit', (code) => {
      if (code === 0) resolveRun();
      else rejectRun(new Error(`${command} exited with code ${code}`));
    });
  });
}

await mkdir(outDir, { recursive: true });

const outFiles = [];
for (const entry of testEntries) {
  const outFile = resolve(outDir, entry.replace(/^tests[\\/]/, '').replace(/\.ts$/, '.mjs'));
  outFiles.push(outFile);
  await run('node', [
    'node_modules/esbuild/bin/esbuild',
    entry,
    '--bundle',
    '--packages=external',
    '--platform=node',
    '--format=esm',
    `--outfile=${outFile}`,
  ]);
}

await run('node', ['--test', ...outFiles]);
