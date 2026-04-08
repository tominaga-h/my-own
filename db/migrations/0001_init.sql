CREATE TABLE projects (
  id serial PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT projects_user_name_unique UNIQUE (user_id, name)
);

CREATE TABLE notes (
  id serial PRIMARY KEY,
  user_id uuid NOT NULL,
  body text NOT NULL,
  source text NOT NULL DEFAULT 'manual',
  slack_ts text,
  project_id int REFERENCES projects(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT notes_source_check CHECK (source IN ('slack', 'manual'))
);

CREATE INDEX notes_user_id_idx ON notes (user_id);
CREATE INDEX notes_project_id_idx ON notes (project_id);
CREATE INDEX notes_slack_ts_idx ON notes (slack_ts);

CREATE TABLE links (
  id serial PRIMARY KEY,
  user_id uuid NOT NULL,
  url text NOT NULL,
  title text,
  description text,
  source text NOT NULL DEFAULT 'manual',
  slack_ts text,
  project_id int REFERENCES projects(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT links_source_check CHECK (source IN ('slack', 'manual'))
);

CREATE INDEX links_user_id_idx ON links (user_id);
CREATE INDEX links_project_id_idx ON links (project_id);
CREATE INDEX links_slack_ts_idx ON links (slack_ts);

CREATE TABLE sync_states (
  id serial PRIMARY KEY,
  user_id uuid NOT NULL,
  key text NOT NULL,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sync_states_user_key_unique UNIQUE (user_id, key)
);

CREATE INDEX sync_states_user_id_idx ON sync_states (user_id);

CREATE TABLE note_links (
  note_id int NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  link_id int NOT NULL REFERENCES links(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (note_id, link_id)
);
