-- Prune legacy fields (name, role) and ensure new profile columns exist
-- Safe alterations: drop constraints dependent on role if any (none currently besides CHECK inline)
-- 1. Remove CHECK constraint on role by recreating table structure for just dropping column would be heavy; easier to drop column directly
ALTER TABLE users
  DROP COLUMN IF EXISTS name,
  DROP COLUMN IF EXISTS role;

-- 2. Ensure desired profile columns exist (idempotent if previous migration ran)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS additional_info TEXT,
  ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- 3. (Optional) Could add simple index for frequent lookups by lower(first_name,last_name) later.
