// Separate OS process for genuine database lock and failure tests, not a production worker.
import { rename, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { claimBootstrap, changeRole, commitCatalog, connectTestDatabase, lockedInstallation, transaction } from './store.mjs';
import { testSchema } from './safety.mjs';

const send = (value) => process.send?.(value);
const pause = (kind) => new Promise((resolve) => {
  process.once('message', (message) => { if (message?.continue !== kind) process.exit(2); resolve(); });
  send({ kind });
});
process.once('message', async (input) => {
  let client;
  try {
    client = await connectTestDatabase(process.env.OAKTECH_POC_DATABASE_URL);
    const backend = await client.query('SELECT pg_backend_pid() AS pid');
    send({ kind: 'connected', nodePid: process.pid, backendPid: backend.rows[0].pid });
    await pause('ready');
    const args = [client, testSchema(input.schema), input.installationId, input.actor];
    let result;
    if (input.action === 'bootstrap') {
      result = await claimBootstrap(...args, input.token, input.pauseAfterRole ? { afterRole: () => pause('afterRole') } : {});
    } else if (input.action === 'role') {
      result = await changeRole(...args, input.target, input.role, input.expectedRevision);
    } else if (input.action === 'catalog') {
      result = await commitCatalog(...args, input.requestId, input.expectedRevision, input.snapshot, input.pauseAfterAuthorization ? { afterAuthorization: () => pause('afterAuthorization') } : {});
    } else if (input.action === 'unsafe-json-demonstration') {
      // Counterexample ONLY: a lost SQL lock cannot fence a later filesystem rename.
      // Test harness supplies its own private temporary output directory and checks this fails the invariant.
      const directory = process.env.OAKTECH_POC_UNSAFE_OUTPUT;
      if (!directory || !path.isAbsolute(directory) || !path.basename(directory).startsWith('oaktech-poc-counterexample-')) throw new Error('POC_UNSAFE_OUTPUT_REJECTED');
      await transaction(client, input.schema, async () => {
        await lockedInstallation(client, input.installationId);
        const p = (await client.query('SELECT role FROM principal WHERE id=$1', [input.actor])).rows[0];
        if (!['admin', 'super_admin'].includes(p?.role)) throw new Error('POC_FORBIDDEN');
        await pause('afterAuthorization');
        const temporary = path.join(directory, `snapshot-${randomUUID()}.json`);
        await writeFile(temporary, JSON.stringify(input.snapshot));
        await rename(temporary, path.join(directory, 'catalog.json'));
        send({ kind: 'unsafeFileWritten' });
      });
    } else throw new Error('POC_UNKNOWN_ACTION');
    send({ kind: 'result', ok: true, result });
  } catch (error) {
    const code = /^POC_[A-Z_]+$/.test(error.message) ? error.message : 'POC_DATABASE_FAILURE';
    send({ kind: 'result', ok: false, code });
  } finally {
    await client?.end().catch(() => {});
    process.disconnect?.();
  }
});
