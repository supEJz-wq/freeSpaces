-- Run in Supabase → SQL Editor (only if delete comment fails with permission error)

CREATE POLICY "delete comments" ON comments FOR DELETE USING (true);
