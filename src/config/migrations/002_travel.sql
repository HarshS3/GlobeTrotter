-- Trips core
CREATE TABLE IF NOT EXISTS trips (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  cover_photo_url TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_date >= start_date)
);
CREATE INDEX IF NOT EXISTS idx_trips_user ON trips(user_id);

-- Trip stops (cities / locations)
CREATE TABLE IF NOT EXISTS trip_stops (
  id SERIAL PRIMARY KEY,
  trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  city TEXT NOT NULL,
  country TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_date >= start_date)
);
CREATE INDEX IF NOT EXISTS idx_trip_stops_trip ON trip_stops(trip_id);

-- Activities catalog (user-created or global) - simple flexible table
CREATE TABLE IF NOT EXISTS activities (
  id SERIAL PRIMARY KEY,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  category TEXT,
  base_cost NUMERIC(12,2) DEFAULT 0,
  duration_minutes INTEGER,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_activities_category ON activities(category);

-- Trip stop activity assignments (instance level overrides cost/time)
CREATE TABLE IF NOT EXISTS trip_stop_activities (
  id SERIAL PRIMARY KEY,
  trip_stop_id INTEGER NOT NULL REFERENCES trip_stops(id) ON DELETE CASCADE,
  activity_id INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  day_offset INTEGER NOT NULL DEFAULT 0, -- relative day inside stop
  start_time TIME,
  cost_override NUMERIC(12,2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tsa_stop ON trip_stop_activities(trip_stop_id);

-- Budget snapshots (optional incremental analytics)
CREATE TABLE IF NOT EXISTS trip_budget_snapshots (
  id SERIAL PRIMARY KEY,
  trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_cost NUMERIC(14,2) NOT NULL,
  transport_cost NUMERIC(14,2) DEFAULT 0,
  stay_cost NUMERIC(14,2) DEFAULT 0,
  activities_cost NUMERIC(14,2) DEFAULT 0,
  meals_cost NUMERIC(14,2) DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_budget_trip ON trip_budget_snapshots(trip_id);

-- Public share tokens (simple slug for sharing)
CREATE TABLE IF NOT EXISTS trip_public_shares (
  id SERIAL PRIMARY KEY,
  trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  share_slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_public_share_trip ON trip_public_shares(trip_id);
