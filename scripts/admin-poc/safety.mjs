// Test-only connection boundary. Never read DATABASE_URL or production auth configuration.
export function testDatabaseConfig(value) {
  let url;
  try { url = new URL(value); } catch { throw new Error('POC_DATABASE_URL_REQUIRED'); }
  if (!['postgres:', 'postgresql:'].includes(url.protocol) || url.hostname !== '127.0.0.1'
    || url.pathname !== '/oaktech_admin_poc' || url.search || url.hash || !url.username || !url.password) {
    throw new Error('POC_REQUIRES_EXPLICIT_LOOPBACK_TEST_DATABASE');
  }
  const port = url.port ? Number(url.port) : 5432;
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('POC_INVALID_PORT');
  return {
    host: '127.0.0.1', port, database: 'oaktech_admin_poc',
    user: decodeURIComponent(url.username), password: decodeURIComponent(url.password),
    application_name: 'oaktech-admin-storage-poc',
    connectionTimeoutMillis: 5000, query_timeout: 15000,
    ssl: false, options: '',
  };
}

export function testSchema(value) {
  if (!/^oaktech_poc_[a-f0-9]{32}$/.test(value ?? '')) throw new Error('POC_INVALID_SCHEMA');
  return value;
}
