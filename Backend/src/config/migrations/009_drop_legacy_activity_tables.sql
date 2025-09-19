-- Migration 009: Drop legacy activity tables after successful transition to stop_activities
-- Preconditions: Data has been backfilled into stop_activities (migration 007) and code no longer queries these tables.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='trip_stop_activities') THEN
    EXECUTE 'DROP TABLE trip_stop_activities';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='activities') THEN
    EXECUTE 'DROP TABLE activities';
  END IF;
END$$;

-- Irreversible (unless restored from backup). Ensure backups before applying in production.