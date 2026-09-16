import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { testDatabaseConfig, testSchema } from '../scripts/admin-poc/safety.mjs';

test('ADM-01 PoC refuses non-loopback/production databases and connection overrides', () => {
  const good = 'postgresql://fixture:temporary@127.0.0.1:15432/oaktech_admin_poc';
  assert.equal(testDatabaseConfig(good).database, 'oaktech_admin_poc');
  for (const value of [undefined, '', 'bad', good.replace('127.0.0.1', 'database.internal'), good.replace('oaktech_admin_poc', 'production'), good + '?host=remote.example', good + '#hidden', good.replace(':temporary', ''), good.replace('15432', '80')]) {
    assert.throws(() => testDatabaseConfig(value), /POC_/);
  }
  assert.throws(() => testDatabaseConfig('postgres://name:secret-value@external.example/db'), (error: Error) => !error.message.includes('secret-value'));
});

test('ADM-01 PoC restricts all temporary schema identifiers', () => {
  assert.equal(testSchema(`oaktech_poc_${'a'.repeat(32)}`), `oaktech_poc_${'a'.repeat(32)}`);
  for (const value of ['public', 'auth', 'catalog', 'oaktech_poc_', 'x;DROP SCHEMA public', undefined]) assert.throws(() => testSchema(value), /POC_INVALID_SCHEMA/);
});

test('ADM-01 experimental workers and grant helpers are not imported by production code', () => {
  const root = path.resolve('.');
  const walk = (directory: string): string[] => readdirSync(directory).flatMap((name) => {
    const p = path.join(directory, name);
    return statSync(p).isDirectory() ? walk(p) : /\.(?:[cm]?js|tsx?)$/.test(p) ? [p] : [];
  });
  for (const directory of ['app', 'lib', 'components']) {
    for (const p of walk(path.join(root, directory))) assert.doesNotMatch(readFileSync(p, 'utf8'), /(?:from\s*|import\s*\()['"][^'"]*admin-poc\//, p);
  }
  assert.doesNotMatch(readFileSync(path.join(root, 'Dockerfile'), 'utf8'), /admin-poc/);
});
