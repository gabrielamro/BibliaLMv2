import { mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const outDir = resolve('.tmp-tests/kingdom-ui');
const testEntries = ['kingdomRoadmapUi.test.ts', 'kingdomInteractionFinalization.test.ts'];

function run(command, args) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(command, args, { stdio: 'inherit' });
    child.on('error', rejectRun);
    child.on('exit', code => code === 0 ? resolveRun() : rejectRun(new Error(`${command} exited with code ${code}`)));
  });
}

await mkdir(outDir, { recursive: true });
const outFiles = [];
for (const entry of testEntries) {
  const outFile = resolve(outDir, entry.replace(/\.ts$/, '.mjs'));
  await run('node', ['node_modules/esbuild/bin/esbuild', `tests/${entry}`, '--bundle', '--packages=external', '--platform=node', '--format=esm', `--outfile=${outFile}`]);
  outFiles.push(outFile);
}
await run('node', ['--test', ...outFiles]);
