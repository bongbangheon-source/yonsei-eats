import { spawn } from 'node:child_process';
import { dirname, delimiter } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';

// Execute with Node 24, including every child npm script. No DB writes/deploys.
if (Number(process.versions.node.split('.')[0]) !== 24) {
  console.error('FAIL: run preflight with Node 24; use npm.cmd exec --yes --package=node@24 -- node scripts/preflight.mjs');
  process.exit(1);
}
const env = { ...process.env, PATH: `${dirname(process.execPath)}${delimiter}${process.env.PATH ?? ''}` };
const results = { runtime: process.version, platform: process.platform, checks: [], allPassed: false };
mkdirSync('docs/submission', { recursive: true });
const save = () => writeFileSync('docs/submission/preflight-results.json', JSON.stringify(results, null, 2) + '\n');
async function run(command, attempt = 1) {
  console.log(`Running: ${command}${attempt > 1 ? ` (attempt ${attempt})` : ''}`);
  const started = Date.now();
  const code = await new Promise(resolve => {
    const child = process.platform === 'win32'
      ? spawn(process.env.ComSpec ?? 'cmd.exe', ['/d', '/s', '/c', command], { env, stdio: 'inherit', windowsHide: true })
      : spawn('/bin/sh', ['-c', command.replaceAll('npm.cmd', 'npm')], { env, stdio: 'inherit' });
    child.on('error', () => resolve(1));
    child.on('exit', value => resolve(value ?? 1));
  });
  results.checks.push({ command, attempt, exitCode: code, durationMs: Date.now() - started });
  save();
  return code;
}
await run('npm.cmd exec -- node --version');
for (const command of ['npm.cmd test', 'npm.cmd run lint', 'npm.cmd run typecheck', 'npm.cmd run build']) await run(command);
// User explicitly requested npm run db three times.
for (let attempt = 1; attempt <= 3; attempt++) await run('npm.cmd run db', attempt);
results.allPassed = results.checks.every(check => check.exitCode === 0);
save();
console.log(`Preflight ${results.allPassed ? 'PASS' : 'FAIL'}; safe summary: docs/submission/preflight-results.json`);
process.exitCode = results.allPassed ? 0 : 1;
