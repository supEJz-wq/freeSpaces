-- ============================================================
-- FreeSpace — EXISTING DATABASE PATCH
-- Run this in Supabase → SQL Editor if tables already exist.
-- Safe to re-run: uses IF NOT EXISTS / skips duplicate errors.
-- ============================================================

-- posts: soft-delete column (if you added it via ALTER before)
alter table posts add column if not exists is_deleted boolean default false;

-- bug_reports: idea vs bug type
alter table bug_reports add column if not exists type text default 'bug';

-- REQUIRED for admin Feedback tab — read reports in dashboard
drop policy if exists "read bug_reports" on bug_reports;
create policy "read bug_reports"
  on bug_reports for select using (true);

-- REQUIRED for admin Feedback tab — delete handled reports
drop policy if exists "delete bug_reports" on bug_reports;
create policy "delete bug_reports"
  on bug_reports for delete using (true);

-- Live updates when users submit new bugs/ideas
alter publication supabase_realtime add table bug_reports;
