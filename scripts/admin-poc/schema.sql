-- ADM-01 experimental schema only. Not a production migration and never run at app startup.
CREATE TABLE installation (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  installation_id uuid UNIQUE NOT NULL,
  schema_version integer NOT NULL DEFAULT 1 CHECK (schema_version = 1),
  initialized_at timestamptz,
  token_fingerprint text NOT NULL CHECK (length(token_fingerprint) = 64),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  CHECK ((initialized_at IS NULL) = (consumed_at IS NULL))
);
CREATE TABLE principal (
  id uuid PRIMARY KEY,
  provider text NOT NULL,
  issuer text COLLATE "C" NOT NULL,
  subject text COLLATE "C" NOT NULL,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  revision integer NOT NULL DEFAULT 0 CHECK (revision >= 0),
  UNIQUE (provider, issuer, subject)
);
CREATE TABLE catalog (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  revision integer NOT NULL DEFAULT 0 CHECK (revision >= 0),
  body jsonb NOT NULL CHECK (jsonb_typeof(body) = 'object')
);
CREATE TABLE audit (
  id uuid PRIMARY KEY,
  actor uuid NOT NULL REFERENCES principal(id),
  action text NOT NULL,
  target uuid,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE committed_command (
  id uuid PRIMARY KEY,
  actor uuid NOT NULL REFERENCES principal(id),
  payload_digest text NOT NULL,
  revision integer UNIQUE NOT NULL,
  snapshot jsonb NOT NULL,
  committed_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
