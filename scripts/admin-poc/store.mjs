// Storage experiment only: callers are synthetic test principals, NOT authenticated web users.
// Production session validation, CSRF, rate limiting, MFA, provisioning and migrations are NOT here.
// This module must never be imported from app/, lib/, or a production entrypoint.
import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import pg from 'pg';
import { testDatabaseConfig, testSchema } from './safety.mjs';

export const fingerprint = (value) => createHash('sha256').update(value).digest('hex');
export async function connectTestDatabase(value) {
  const client = new pg.Client(testDatabaseConfig(value));
  // A killed backend is expected in fault tests; the next query still rejects and cannot commit.
  client.on('error', () => {});
  await client.connect();
  return client;
}

export async function transaction(client, schema, operation) {
  testSchema(schema);
  await client.query('BEGIN');
  try {
    await client.query(`SET LOCAL search_path TO "${schema}", pg_catalog`);
    await client.query("SET LOCAL lock_timeout = '5s'");
    await client.query("SET LOCAL statement_timeout = '10s'");
    const result = await operation();
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  }
}

export async function prepareTestSchema(client, schema, installationId, token, principalIds) {
  testSchema(schema);
  const source = await readFile(new URL('./schema.sql', import.meta.url), 'utf8');
  await client.query('BEGIN');
  try {
    await client.query(`CREATE SCHEMA "${schema}"`);
    await client.query(`SET LOCAL search_path TO "${schema}", pg_catalog`);
    await client.query(source);
    await client.query('INSERT INTO installation (installation_id,token_fingerprint,expires_at) VALUES ($1,$2,clock_timestamp()+interval \'60 minutes\')', [installationId, fingerprint(token)]);
    for (const [index, id] of principalIds.entries()) {
      await client.query('INSERT INTO principal(id,provider,issuer,subject) VALUES ($1,$2,$3,$4)', [id, 'test-oidc', 'https://identity.example.invalid', `fixture-${index}`]);
    }
    await client.query('INSERT INTO catalog(body) VALUES ($1)', [{ schemaVersion: 1, products: [], releases: [] }]);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  }
}

export async function lockedInstallation(client, expectedId, requireInitialized = true) {
  const { rows } = await client.query('SELECT * FROM installation WHERE singleton FOR UPDATE');
  const row = rows[0];
  if (!row || row.installation_id !== expectedId) throw new Error('POC_INSTALLATION_MISMATCH');
  if (requireInitialized && !row.initialized_at) throw new Error('POC_NOT_INITIALIZED');
  // A computed SELECT expression can be evaluated before a FOR UPDATE lock wait.
  // Read wall-clock validity in a NEW statement after acquiring the lock (regression PG-17).
  const validity = await client.query('SELECT expires_at > clock_timestamp() AS token_valid FROM installation WHERE singleton');
  return { ...row, token_valid: validity.rows[0].token_valid };
}

async function principal(client, id) {
  const { rows } = await client.query('SELECT * FROM principal WHERE id=$1 FOR UPDATE', [id]);
  if (!rows[0] || rows[0].status !== 'active') throw new Error('POC_FORBIDDEN');
  return rows[0];
}
async function writeAudit(client, actor, action, target, detail = {}) {
  await client.query('INSERT INTO audit(id,actor,action,target,detail) VALUES ($1,$2,$3,$4,$5)', [randomUUID(), actor, action, target, detail]);
}

export async function claimBootstrap(client, schema, installationId, actor, token, hooks = {}) {
  return transaction(client, schema, async () => {
    const installation = await lockedInstallation(client, installationId, false);
    if (installation.initialized_at) throw new Error('POC_ALREADY_INITIALIZED');
    if (!installation.token_valid || !timingSafeEqual(Buffer.from(installation.token_fingerprint, 'hex'), Buffer.from(fingerprint(token), 'hex'))) {
      throw new Error('POC_INVALID_BOOTSTRAP');
    }
    await principal(client, actor);
    await client.query("UPDATE principal SET role='super_admin', revision=revision+1 WHERE id=$1", [actor]);
    await hooks.afterRole?.();
    await client.query('UPDATE installation SET initialized_at=clock_timestamp(), consumed_at=clock_timestamp() WHERE singleton');
    await writeAudit(client, actor, 'bootstrap', actor);
    return { actor, role: 'super_admin' };
  });
}

export async function changeRole(client, schema, installationId, actor, target, role, expectedRevision) {
  if (!['user', 'admin', 'super_admin'].includes(role)) throw new Error('POC_INVALID_ROLE');
  return transaction(client, schema, async () => {
    await lockedInstallation(client, installationId);
    if ((await principal(client, actor)).role !== 'super_admin') throw new Error('POC_FORBIDDEN');
    const previous = await principal(client, target);
    if (previous.revision !== expectedRevision) throw new Error('POC_REVISION_CONFLICT');
    if (previous.role === 'super_admin' && role !== 'super_admin') {
      const result = await client.query("SELECT count(*)::int AS count FROM principal WHERE role='super_admin' AND status='active'");
      if (result.rows[0].count <= 1) throw new Error('POC_LAST_SUPER_ADMIN');
    }
    await client.query('UPDATE principal SET role=$1, revision=revision+1 WHERE id=$2', [role, target]);
    await writeAudit(client, actor, 'role.change', target, { before: previous.role, after: role });
    return { role, revision: previous.revision + 1 };
  });
}

export async function commitCatalog(client, schema, installationId, actor, requestId, expectedRevision, snapshot, hooks = {}) {
  if (snapshot?.schemaVersion !== 1 || !Array.isArray(snapshot.products) || !Array.isArray(snapshot.releases)) throw new Error('POC_INVALID_CATALOG');
  const digest = fingerprint(JSON.stringify(snapshot));
  return transaction(client, schema, async () => {
    await lockedInstallation(client, installationId);
    if (!['admin', 'super_admin'].includes((await principal(client, actor)).role)) throw new Error('POC_FORBIDDEN');
    const existing = (await client.query('SELECT * FROM committed_command WHERE id=$1', [requestId])).rows[0];
    if (existing) {
      if (existing.actor !== actor || existing.payload_digest !== digest) throw new Error('POC_IDEMPOTENCY_CONFLICT');
      return { revision: existing.revision, replay: true };
    }
    const current = (await client.query('SELECT revision FROM catalog WHERE singleton FOR UPDATE')).rows[0];
    if (!current || current.revision !== expectedRevision) throw new Error('POC_CATALOG_CONFLICT');
    await hooks.afterAuthorization?.();
    const revision = current.revision + 1;
    await client.query('UPDATE catalog SET body=$1, revision=$2 WHERE singleton', [snapshot, revision]);
    await hooks.afterCatalog?.();
    await writeAudit(client, actor, 'catalog.commit', null, { revision, requestId });
    await client.query('INSERT INTO committed_command(id,actor,payload_digest,revision,snapshot) VALUES ($1,$2,$3,$4,$5)', [requestId, actor, digest, revision, snapshot]);
    return { revision, replay: false };
  });
}
