-- Run this ENTIRE file in Supabase → SQL Editor → New Query → Run
-- Do NOT copy just "parent_id bigint ..." — that line alone is invalid.

ALTER TABLE comments ADD COLUMN IF NOT EXISTS parent_id BIGINT;

ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_parent_id_fkey;
ALTER TABLE comments ADD CONSTRAINT comments_parent_id_fkey
  FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE;
