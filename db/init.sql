CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS players (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  name_normalized TEXT GENERATED ALWAYS AS (lower(trim(name))) STORED,
  league        TEXT NOT NULL CHECK (league IN ('NFL', 'NBA', 'MLB')),
  position      TEXT,
  team          TEXT,
  years_active  TEXT,         -- e.g. "1995-2007" or "2001"
  external_id   TEXT,         -- e.g. Sports Reference slug
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigram index for fuzzy/similarity search
CREATE INDEX IF NOT EXISTS players_name_trgm_idx
  ON players USING GIN (name gin_trgm_ops);

-- Prefix/ILIKE index
CREATE INDEX IF NOT EXISTS players_name_normalized_idx
  ON players (name_normalized text_pattern_ops);

CREATE INDEX IF NOT EXISTS players_league_idx
  ON players (league);

CREATE UNIQUE INDEX IF NOT EXISTS players_external_id_idx
  ON players (external_id)
  WHERE external_id IS NOT NULL;

-- Lower the similarity threshold slightly so shorter name fragments match
-- (default is 0.3; 0.2 catches more typos at the cost of a few false positives)
ALTER DATABASE players SET pg_trgm.similarity_threshold = 0.2;
