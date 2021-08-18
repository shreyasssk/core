CREATE TABLE users (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  cover VARCHAR,
  avatar VARCHAR,
  email VARCHAR NOT NULL UNIQUE,
  username VARCHAR NOT NULL UNIQUE,
  password VARCHAR NOT NULL,
  last_name VARCHAR NOT NULL,
  first_name VARCHAR NOT NULL,
  bio TEXT DEFAULT '' NOT NULL,
  private BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);