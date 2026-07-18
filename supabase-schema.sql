-- ============================================================
-- FreeSpace — Supabase Schema (FULL SETUP)
-- Run this ONCE in a NEW Supabase project:
--   Dashboard → SQL Editor → New Query → Paste → Run
-- ============================================================

-- 1. POSTS
create table posts (
  id         bigint generated always as identity primary key,
  username   text not null,
  mood       text not null,
  text       text not null,
  likes      int default 0,
  reactions  jsonb default '{}',
  device_id  uuid not null,
  is_deleted boolean default false,
  created_at timestamptz default now()
);

-- Function for cleanup (triggered by admin via RPC)
create or replace function purge_expired_posts()
returns void as $$
begin
  delete from posts where created_at < now() - interval '10 hours';
end;
$$ language plpgsql;

-- 2. COMMENTS (cascade-delete when parent post is deleted)
create table comments (
  id         bigint generated always as identity primary key,
  post_id    bigint references posts(id) on delete cascade,
  parent_id  bigint references comments(id) on delete cascade,
  username   text not null,
  text       text not null,
  created_at timestamptz default now()
);

-- 3. REPORTED POSTS
create table reported_posts (
  post_id bigint references posts(id) on delete cascade,
  primary key (post_id)
);

-- 4. SETTINGS (blacklisted words, auto-delete hours, etc.)
create table settings (
  key   text primary key,
  value jsonb
);
insert into settings values ('blacklisted_words', '["spam","hate"]');
insert into settings values ('auto_delete_hours', '10');

-- 5. DEVICE IDENTITIES (name locking)
create table device_identities (
  device_id  uuid primary key,
  username   text not null,
  created_at timestamptz default now()
);

-- 6. BUG REPORTS & USER IDEAS
create table bug_reports (
  id            uuid default gen_random_uuid() primary key,
  text          text not null,
  reporter_name text,
  device_id     text,
  type          text default 'bug', -- 'bug' or 'suggestion'
  created_at    timestamptz default timezone('utc'::text, now()) not null
);

-- ────────────────────────────────────────────────────────────
-- Row Level Security — public access (no Supabase auth)
-- ────────────────────────────────────────────────────────────
alter table posts             enable row level security;
alter table comments          enable row level security;
alter table reported_posts    enable row level security;
alter table settings          enable row level security;
alter table device_identities enable row level security;
alter table bug_reports       enable row level security;

-- posts
create policy "read posts"   on posts for select using (true);
create policy "insert posts" on posts for insert with check (true);
create policy "update posts" on posts for update using (true);
create policy "delete posts" on posts for delete using (true);

-- comments
create policy "read comments"   on comments for select using (true);
create policy "insert comments" on comments for insert with check (true);
create policy "delete comments" on comments for delete using (true);

-- reported_posts
create policy "read reported"   on reported_posts for select using (true);
create policy "insert reported" on reported_posts for insert with check (true);
create policy "delete reported" on reported_posts for delete using (true);

-- settings
create policy "read settings"   on settings for select using (true);
create policy "update settings" on settings for update using (true);

-- device_identities
create policy "read ident"   on device_identities for select using (true);
create policy "upsert ident" on device_identities for insert with check (true);
create policy "delete ident" on device_identities for delete using (true);

-- bug_reports (users submit; admin reads & deletes in dashboard)
create policy "Anyone can submit a bug report"
  on bug_reports for insert with check (true);
create policy "read bug_reports"
  on bug_reports for select using (true);
create policy "delete bug_reports"
  on bug_reports for delete using (true);

-- ────────────────────────────────────────────────────────────
-- Realtime (live admin dashboard updates)
-- ────────────────────────────────────────────────────────────
alter publication supabase_realtime add table posts;
alter publication supabase_realtime add table bug_reports;


-- ============================================================
-- EXISTING DATABASE PATCH
-- If you already created tables, run ONLY the lines you need.
-- Skip anything that errors (e.g. column/policy already exists).
-- ============================================================

-- Fix posts: add is_deleted if missing
-- alter table posts add column if not exists is_deleted boolean default false;

-- Fix comments: add parent_id for replies
-- >>> Open and run: migrations/add-comment-replies.sql <<<
-- (Do NOT copy only "parent_id bigint ..." from create table above — that causes syntax errors.)

-- Fix comments: allow delete
-- >>> Open and run: migrations/add-comment-delete-policy.sql <<<

-- Fix bug_reports: add type column if missing
-- alter table bug_reports add column if not exists type text default 'bug';

-- Admin MUST be able to read & delete feedback (your old schema only had INSERT)
-- create policy "read bug_reports" on bug_reports for select using (true);
-- create policy "delete bug_reports" on bug_reports for delete using (true);

-- Live updates in admin Feedback tab
-- alter publication supabase_realtime add table bug_reports;
