// Verifies the public (anon) key can never mutate data.
// Reads are reported but not failed: the public read path is jev-stats -> get_public_stats().
// Run: npm run check:rls
import { readFileSync } from 'node:fs';

function env(name) {
  if (process.env[name]) return process.env[name];
  try {
    const file = readFileSync(new URL('../.env', import.meta.url), 'utf8');
    return file.match(new RegExp(`^${name}=(.*)$`, 'm'))?.[1]?.trim();
  } catch {
    return undefined;
  }
}

const url = env('VITE_SUPABASE_URL');
const key = env('VITE_SUPABASE_ANON_KEY');
const table = 'analysis_stats_5m';

if (!url || !key) {
  console.error('check:rls needs VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (env or .env)');
  process.exit(2);
}

const auth = { apikey: key, Authorization: `Bearer ${key}` };
const call = (path, init = {}) => fetch(`${url}${path}`, { ...init, headers: { ...auth, ...init.headers } });

const filter = `bucket_start=gt.1900-01-01`;
const attempts = {
  'SELECT table': call(`/rest/v1/${table}?select=*&limit=1`),
  'INSERT table': call(`/rest/v1/${table}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bucket_start: '2020-01-01T00:00:00Z' }) }),
  'UPDATE table': call(`/rest/v1/${table}?${filter}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ completed: 999 }) }),
  'DELETE table': call(`/rest/v1/${table}?${filter}`, { method: 'DELETE' }),
  'rpc record_analysis': call('/rest/v1/rpc/record_analysis', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ p_party_name: 'rls-check', p_latency_ms: 1 }) }),
  'rpc get_public_stats': call('/rest/v1/rpc/get_public_stats', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
};

let failed = 0;
for (const [name, pending] of Object.entries(attempts)) {
  const res = await pending;
  const write = !name.startsWith('SELECT') && name !== 'rpc get_public_stats';
  const allowed = res.ok;
  const verdict = write ? (allowed ? 'FAIL (write allowed)' : 'denied') : allowed ? 'allowed' : 'denied';
  if (write && allowed) failed += 1;
  console.log(`${write && allowed ? '✗' : '✓'} ${name.padEnd(22)} HTTP ${res.status}  ${verdict}`);
}

if (failed) {
  console.error(`\n${failed} anon write path(s) are open. Grant/RLS regression.`);
  process.exit(1);
}
console.log('\nOK: anon cannot INSERT/UPDATE/DELETE analysis_stats_5m nor call record_analysis.');
