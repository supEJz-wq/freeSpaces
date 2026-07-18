-- ============================================================
-- SQL Patch: Add Image Upload Support for Bug Reports & Ideas
-- Run this in your Supabase SQL Editor.
-- ============================================================

-- 1. Add 'image_url' column to 'bug_reports' table
alter table bug_reports add column if not exists image_url text;

-- 2. Create the 'bug_reports' storage bucket if it doesn't exist
insert into storage.buckets (id, name, public) 
values ('bug_reports', 'bug_reports', true)
on conflict (id) do update set public = true;

-- 3. Set up Storage Policies for the 'bug_reports' bucket
-- Allow anyone to upload images (for submitting bugs/ideas)
create policy "Anyone can upload bug report images"
on storage.objects for insert with check (
  bucket_id = 'bug_reports'
);

-- Allow anyone to read images (so admin dashboard can show them)
create policy "Anyone can read bug report images"
on storage.objects for select using (
  bucket_id = 'bug_reports'
);

-- Allow admin tools to delete if needed
create policy "Anyone can delete bug report images"
on storage.objects for delete using (
  bucket_id = 'bug_reports'
);
