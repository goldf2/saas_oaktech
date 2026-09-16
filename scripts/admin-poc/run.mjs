// Launch an isolated real PostgreSQL cluster, or use an explicitly named loopback CI test DB.
// Does not read .env.local, production connection strings, or existing PostgreSQL clusters.
import { spawn } from 'node:child_process';
import { randomBytes, randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { testDatabaseConfig } from './safety.mjs';
import { claimBootstrap, connectTestDatabase, prepareTestSchema } from './store.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
let temporary;
let postgres;
let serverLog = '';
let signal;
const baseEnv = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('PG')));
const execute = (binary, args, { inherit = false, env = baseEnv, timeout = 60000 } = {}) => new Promise((resolve, reject) => {
  const child = spawn(binary, args, { cwd: root, env, stdio: inherit ? 'inherit' : ['ignore', 'pipe', 'pipe'] });
  let output = '';
  if (!inherit) for (const stream of [child.stdout, child.stderr]) stream.on('data', (data) => { output = (output + data).slice(-12000); });
  const timer = setTimeout(() => { child.kill('SIGKILL'); reject(new Error('POC_COMMAND_TIMEOUT')); }, timeout);
  child.once('error', (error) => { clearTimeout(timer); reject(error); });
  child.once('exit', (code) => { clearTimeout(timer); resolve({ code, output }); });
});
async function stop() {
  if (!postgres || postgres.exitCode !== null) return;
  const child = postgres;
  await new Promise((resolve) => {
    const timer = setTimeout(() => child.kill('SIGKILL'), 10000);
    child.once('exit', () => { clearTimeout(timer); resolve(); });
    child.kill('SIGINT'); // PostgreSQL fast shutdown: rolls back active transactions.
  });
  postgres = undefined;
}
for (const name of ['SIGTERM', 'SIGINT']) process.once(name, () => { signal = name; void stop(); });

async function start(binary, directory, port, config) {
  postgres = spawn(binary, ['-D', directory, '-h', '127.0.0.1', '-p', String(port), '-k', '', '-c', 'fsync=on', '-c', 'max_connections=50', '-c', 'log_statement=none', '-c', 'log_min_messages=warning'], { env: baseEnv, stdio: ['ignore', 'pipe', 'pipe'] });
  for (const stream of [postgres.stdout, postgres.stderr]) stream.on('data', (data) => { serverLog = (serverLog + data.toString()).slice(-12000); });
  postgres.once('error', () => { serverLog = 'POC_POSTGRES_START_FAILED'; });
  for (let i = 0; i < 100; i++) {
    if (signal || postgres.exitCode !== null) throw new Error('POC_POSTGRES_START_FAILED');
    const client = new pg.Client({ ...config, connectionTimeoutMillis: 200 });
    client.on('error', () => {});
    try { await client.connect(); await client.end(); return; }
    catch { await client.end().catch(() => {}); await new Promise((resolve) => setTimeout(resolve, 100)); }
  }
  throw new Error('POC_POSTGRES_NOT_READY');
}

try {
  let url = process.env.OAKTECH_POC_DATABASE_URL;
  let config;
  let bin;
  if (url) config = testDatabaseConfig(url);
  else {
    bin = process.env.OAKTECH_POC_PG_BIN || path.join(root, '.local-verification/admin-poc-tools/node_modules', `@embedded-postgres/${process.platform}-${process.arch}`, 'native/bin');
    if (!existsSync(path.join(bin, 'initdb')) || !existsSync(path.join(bin, 'postgres'))) {
      throw new Error('POC_TEST_SERVER_MISSING: set OAKTECH_POC_PG_BIN to a PostgreSQL bin directory or install the pinned local test tools described in scripts/admin-poc/README.md');
    }
    temporary = await mkdtemp(path.join(os.tmpdir(), 'oaktech-isolated-pg-'));
    const password = randomBytes(32).toString('hex');
    const passwordFile = path.join(temporary, 'init-password');
    await writeFile(passwordFile, password, { mode: 0o600 });
    const port = await new Promise((resolve, reject) => {
      const socket = net.createServer(); socket.on('error', reject);
      socket.listen(0, '127.0.0.1', () => { const address = socket.address(); socket.close(() => resolve(address.port)); });
    });
    const data = path.join(temporary, 'data');
    const init = await execute(path.join(bin, 'initdb'), ['-D', data, '-U', 'oaktech_poc_runner', '--pwfile', passwordFile, '--auth-local=trust', '--auth-host=scram-sha-256', '--encoding=UTF8', '--locale=C']);
    if (init.code !== 0) { serverLog = init.output; throw new Error('POC_INITDB_FAILED'); }
    await rm(passwordFile);
    url = `postgresql://oaktech_poc_runner:${password}@127.0.0.1:${port}/oaktech_admin_poc`;
    config = testDatabaseConfig(url);
    await start(path.join(bin, 'postgres'), data, port, { ...config, database: 'postgres' });
    const creator = new pg.Client({ ...config, database: 'postgres' });
    await creator.connect(); await creator.query('CREATE DATABASE oaktech_admin_poc'); await creator.end();
  }
  const client = await connectTestDatabase(url);
  const version = (await client.query('SHOW server_version')).rows[0].server_version;
  await client.end();
  console.log(`Real PostgreSQL ${version}; ${temporary ? 'isolated local cluster, SCRAM loopback, fsync enabled' : 'explicit loopback CI test database'}.`);
  const result = await execute(process.execPath, ['--test', '--test-concurrency=1', 'tests/admin-poc/storage.test.mjs'], { inherit: true, env: { ...baseEnv, OAKTECH_POC_DATABASE_URL: url }, timeout: 180000 });
  if (result.code !== 0 || signal) throw new Error('POC_TESTS_FAILED');
  if (temporary) {
    // Real server stop/start (not just reconnect) checks durable authorization state.
    const schema = `oaktech_poc_${randomUUID().replaceAll('-', '')}`;
    const install = randomUUID(); const actor = randomUUID(); const token = randomBytes(32).toString('hex');
    const before = await connectTestDatabase(url);
    await prepareTestSchema(before, schema, install, token, [actor]);
    await claimBootstrap(before, schema, install, actor, token);
    await before.end();
    await stop();
    await start(path.join(bin, 'postgres'), path.join(temporary, 'data'), config.port, config);
    const after = await connectTestDatabase(url);
    try {
      const rows = (await after.query(`SELECT i.initialized_at,p.role FROM "${schema}".installation i CROSS JOIN "${schema}".principal p`)).rows;
      if (rows.length !== 1 || !rows[0].initialized_at || rows[0].role !== 'super_admin') throw new Error('POC_RESTART_DURABILITY_FAILED');
      await after.query(`DROP SCHEMA "${schema}" CASCADE`);
    } finally { await after.end(); }
    console.log('PG-16 passed: real PostgreSQL fast shutdown/restart preserved bootstrap marker and superadmin role.');
  }
  console.log('ADM-01 storage PoC passed. No production routes or users were changed.');
} catch (error) {
  console.error(error.message?.startsWith('POC_') ? error.message : 'POC_RUN_FAILED');
  // Only local initdb/postgres diagnostic messages; never print connection URLs or credentials.
  if (serverLog) console.error(serverLog.replace(/password[^\n]*/gi, 'password [omitted]'));
  process.exitCode = 1;
} finally {
  await stop();
  if (temporary) await rm(temporary, { recursive: true, force: true });
}
