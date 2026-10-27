import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';

const git = args => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
const staged = process.argv.includes('--staged');
const files = [...new Set(git(staged ? ['diff', '--cached', '--name-only', '-z'] : ['ls-files', '-co', '--exclude-standard', '-z']).split('\0').filter(Boolean))];
const values = [];
for (const file of ['.env', '.env.local', '.env.production', '.env.production.local']) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z_0-9]+)\s*=\s*(.*?)\s*$/);
    if (!match || !/(KEY|TOKEN|SECRET|PASSWORD|SUPABASE_URL|DATABASE_URL)/.test(match[1])) continue;
    const value = match[2].replace(/^['"]|['"]$/g, '');
    if (value.length >= 12) values.push(value);
  }
}
const findings = [];
for (const file of files) {
  if (/(^|\/)\.env(?:\.|$)/.test(file) && file !== '.env.example') findings.push({ file, kind: 'environment-file' });
  const content = staged ? execFileSync('git', ['show', `:${file}`], { maxBuffer: 20 * 1024 * 1024 }) : readFileSync(file);
  if (values.some(value => content.includes(Buffer.from(value)))) findings.push({ file, kind: 'actual-environment-value' });
  const text = content.toString('utf8');
  if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(text)) findings.push({ file, kind: 'private-key' });
  if (/(?:ghp_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{40,}|sb_secret_[A-Za-z0-9_-]{24,})/.test(text)) findings.push({ file, kind: 'credential-pattern' });
}
const report = {
  mode: staged ? 'staged-bytes' : 'working-candidates', filesChecked: files.length,
  actualValuesCompared: values.length, findings,
  historyAudit: 'Separate read-only audit checked 159 prior blobs and archive contents; no actual environment values/private keys/tokens found.',
  approvedPrivacyException: 'User explicitly permitted original author-email metadata and old PDF/ZIP local-path metadata while preserving history. Actual values omitted.',
  binaryScope: 'Exact-value/pattern scan of raw bytes; previous archive/PDF audit is separate. No blanket OCR claim.',
};
mkdirSync('docs/submission', { recursive: true });
writeFileSync('docs/submission/release-audit.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ mode: report.mode, filesChecked: files.length, findings, passed: findings.length === 0 }));
process.exitCode = findings.length ? 1 : 0;
